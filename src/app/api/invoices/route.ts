import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, contacts, orderItems, products, purchaseOrders, salesOrders } from "@/lib/db/schema";
import { eq, desc, and, sql, or } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateDocumentNumber } from "@/lib/db/utils";

// GET /api/invoices - Get all invoices
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // PURCHASE or SALES
        const status = searchParams.get('status');
        const contactId = searchParams.get('contactId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        let whereConditions = [];
        if (type) {
            whereConditions.push(eq(invoices.type, type));
        }
        if (status) {
            whereConditions.push(eq(invoices.status, status));
        }
        if (contactId) {
            whereConditions.push(eq(invoices.contactId, parseInt(contactId)));
        }

        const [invoiceList, totalCount] = await Promise.all([
            db
                .select({
                    id: invoices.id,
                    invoiceNumber: invoices.invoiceNumber,
                    type: invoices.type,
                    contactId: invoices.contactId,
                    contactName: contacts.name,
                    orderId: invoices.orderId,
                    invoiceDate: invoices.invoiceDate,
                    dueDate: invoices.dueDate,
                    status: invoices.status,
                    subTotal: invoices.subTotal,
                    totalAmount: invoices.totalAmount,
                    taxAmount: invoices.taxAmount,
                    discountAmount: invoices.discountAmount,
                    paidAmount: invoices.paidAmount,
                    balanceAmount: invoices.balanceAmount,
                    currency: invoices.currency,
                    notes: invoices.notes,
                    createdAt: invoices.createdAt,
                    updatedAt: invoices.updatedAt,
                })
                .from(invoices)
                .leftJoin(contacts, eq(invoices.contactId, contacts.id))
                .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
                .orderBy(desc(invoices.createdAt))
                .limit(limit)
                .offset(offset),

            db
                .select({ count: sql`count(*)` })
                .from(invoices)
                .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        ]);

        return NextResponse.json({
            invoices: invoiceList,
            pagination: {
                page,
                limit,
                total: Number(totalCount[0].count),
                pages: Math.ceil(Number(totalCount[0].count) / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching invoices:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/invoices - Create new invoice
export async function POST(request: NextRequest) {
    try {
        console.log('Starting invoice creation...');
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        console.log('Request body:', body);
        const {
            type,
            contactId,
            orderId,
            invoiceDate,
            dueDate,
            items,
            subTotal,
            taxAmount,
            discountAmount,
            totalAmount,
            currency = 'INR',
            terms,
            notes
        } = body;

        console.log('Parsed data:', { type, contactId, invoiceDate, dueDate, items: items?.length });

        // Validation
        if (!type || !contactId || !invoiceDate || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "Type, contact ID, invoice date, and items are required" },
                { status: 400 }
            );
        }

        // Validate date fields
        console.log('Validating dates...');
        const invoiceDateObj = new Date(invoiceDate);
        if (isNaN(invoiceDateObj.getTime())) {
            return NextResponse.json(
                { error: "Invalid invoice date format" },
                { status: 400 }
            );
        }

        let dueDateObj = null;
        if (dueDate) {
            dueDateObj = new Date(dueDate);
            if (isNaN(dueDateObj.getTime())) {
                return NextResponse.json(
                    { error: "Invalid due date format" },
                    { status: 400 }
                );
            }
        }

        console.log('Date validation passed:', { invoiceDate: invoiceDateObj.toISOString(), dueDate: dueDateObj?.toISOString() });

        if (!['PURCHASE', 'SALES'].includes(type)) {
            return NextResponse.json(
                { error: "Type must be either PURCHASE or SALES" },
                { status: 400 }
            );
        }

        // Validate contact exists and has correct type
        console.log('Validating contact...', { contactId, type });
        const contact = await db
            .select()
            .from(contacts)
            .where(and(
                eq(contacts.id, contactId),
                or(
                    eq(contacts.type, type === 'PURCHASE' ? 'VENDOR' : 'CUSTOMER'),
                    eq(contacts.type, 'BOTH')
                )
            ))
            .limit(1);

        console.log('Contact query result:', contact);
        if (contact.length === 0) {
            return NextResponse.json(
                { error: `Invalid ${type === 'PURCHASE' ? 'vendor' : 'customer'} ID` },
                { status: 400 }
            );
        }

        // Validate order exists if provided
        if (orderId) {
            const orderTable = type === 'PURCHASE' ? purchaseOrders : salesOrders;
            const order = await db
                .select()
                .from(orderTable)
                .where(eq(orderTable.id, orderId))
                .limit(1);

            if (order.length === 0) {
                return NextResponse.json(
                    { error: `Invalid ${type === 'PURCHASE' ? 'purchase' : 'sales'} order ID` },
                    { status: 400 }
                );
            }
        }

        // Generate invoice number
        const currentYear = new Date().getFullYear();
        const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
        const prefix = type === 'PURCHASE' ? 'BILL' : 'INV';

        // Get next sequence number for this month
        const lastInvoice = await db
            .select({ invoiceNumber: invoices.invoiceNumber })
            .from(invoices)
            .where(and(
                eq(invoices.type, type),
                sql`EXTRACT(YEAR FROM ${invoices.invoiceDate}) = ${currentYear}`,
                sql`EXTRACT(MONTH FROM ${invoices.invoiceDate}) = ${currentMonth}`
            ))
            .orderBy(desc(invoices.createdAt))
            .limit(1);

        const sequence = lastInvoice.length > 0
            ? parseInt(lastInvoice[0].invoiceNumber.split('-')[2]) + 1
            : 1;

        const invoiceNumber = generateDocumentNumber(`${prefix}-`, sequence);

        // Calculate amounts if not provided
        let calculatedSubTotal = subTotal || 0;
        let calculatedTaxAmount = taxAmount || 0;
        let calculatedDiscountAmount = discountAmount || 0;
        let calculatedTotalAmount = totalAmount || 0;

        console.log('Checking if amounts need calculation...', { subTotal, taxAmount, discountAmount, totalAmount });
        if (!subTotal || !taxAmount || !discountAmount || !totalAmount) {
            console.log('Calculating amounts from items...');
            for (const item of items) {
                console.log('Processing item:', item);
                const product = await db
                    .select()
                    .from(products)
                    .where(eq(products.id, item.productId))
                    .limit(1);

                console.log('Product query result:', product);
                if (product.length === 0) {
                    return NextResponse.json(
                        { error: `Product with ID ${item.productId} not found` },
                        { status: 400 }
                    );
                }

                const itemSubTotal = item.quantity * item.unitPrice;
                const itemTaxAmount = item.taxAmount || 0;
                const itemDiscountAmount = item.discountAmount || 0;
                const itemTotal = itemSubTotal + itemTaxAmount - itemDiscountAmount;

                calculatedSubTotal += itemSubTotal;
                calculatedTaxAmount += itemTaxAmount;
                calculatedDiscountAmount += itemDiscountAmount;
                calculatedTotalAmount += itemTotal;
            }
        }

        console.log('Calculated amounts:', {
            calculatedSubTotal,
            calculatedTaxAmount,
            calculatedDiscountAmount,
            calculatedTotalAmount,
            types: {
                subTotal: typeof calculatedSubTotal,
                taxAmount: typeof calculatedTaxAmount,
                discountAmount: typeof calculatedDiscountAmount,
                totalAmount: typeof calculatedTotalAmount
            }
        });

        const balanceAmount = calculatedTotalAmount;

        // Create invoice
        console.log('About to create invoice. Date objects:', {
            invoiceDateObj,
            dueDateObj,
            invoiceDateType: typeof invoiceDateObj,
            dueDateType: typeof dueDateObj
        });

        // Use Date objects directly instead of ISO strings for Drizzle timestamp fields
        console.log('Using Date objects for database insert:', {
            invoiceDate: invoiceDateObj,
            dueDate: dueDateObj
        });

        console.log('Creating invoice with data:', {
            invoiceNumber,
            type,
            contactId,
            invoiceDate: invoiceDateObj,
            dueDate: dueDateObj,
            totalAmount: calculatedTotalAmount,
            taxAmount: calculatedTaxAmount,
            discountAmount: calculatedDiscountAmount
        });

        const [newInvoice] = await db
            .insert(invoices)
            .values({
                invoiceNumber,
                type,
                contactId,
                orderId: orderId || null,
                invoiceDate: invoiceDateObj,
                dueDate: dueDateObj,
                status: 'UNPAID',
                subTotal: String(calculatedSubTotal),
                totalAmount: String(calculatedTotalAmount),
                taxAmount: String(calculatedTaxAmount),
                discountAmount: String(calculatedDiscountAmount),
                paidAmount: '0',
                balanceAmount: String(calculatedTotalAmount),
                currency: 'INR',
                notes,
                createdBy: parseInt(session.user.id),
            })
            .returning();

        console.log('Invoice created:', newInvoice);

        // Create invoice items (using orderItems table with orderType as INVOICE)
        const invoiceItemsData = items.map(item => ({
            orderId: newInvoice.id,
            orderType: 'INVOICE',
            productId: item.productId,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            taxAmount: item.taxAmount ? String(item.taxAmount) : '0',
            discountAmount: item.discountAmount ? String(item.discountAmount) : '0',
            totalAmount: String((item.quantity * item.unitPrice) + (item.taxAmount || 0) - (item.discountAmount || 0)),
        }));

        console.log('Creating invoice items:', invoiceItemsData);
        await db.insert(orderItems).values(invoiceItemsData);
        console.log('Invoice items created successfully');

        // Fetch the complete invoice with contact details
        const [completeInvoice] = await db
            .select({
                id: invoices.id,
                invoiceNumber: invoices.invoiceNumber,
                type: invoices.type,
                contactId: invoices.contactId,
                contactName: contacts.name,
                orderId: invoices.orderId,
                invoiceDate: invoices.invoiceDate,
                dueDate: invoices.dueDate,
                status: invoices.status,
                subTotal: invoices.subTotal,
                totalAmount: invoices.totalAmount,
                taxAmount: invoices.taxAmount,
                discountAmount: invoices.discountAmount,
                paidAmount: invoices.paidAmount,
                balanceAmount: invoices.balanceAmount,
                currency: invoices.currency,
                terms: invoices.terms,
                notes: invoices.notes,
                createdAt: invoices.createdAt,
                updatedAt: invoices.updatedAt,
            })
            .from(invoices)
            .leftJoin(contacts, eq(invoices.contactId, contacts.id))
            .where(eq(invoices.id, newInvoice.id));

        return NextResponse.json({
            message: `${type === 'PURCHASE' ? 'Vendor bill' : 'Customer invoice'} created successfully`,
            invoice: completeInvoice
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating invoice:", error);
        console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
        return NextResponse.json(
            { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
