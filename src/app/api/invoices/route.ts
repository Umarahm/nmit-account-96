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
                total: totalCount[0].count,
                pages: Math.ceil(totalCount[0].count / limit)
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
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
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

        // Validation
        if (!type || !contactId || !invoiceDate || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "Type, contact ID, invoice date, and items are required" },
                { status: 400 }
            );
        }

        if (!['PURCHASE', 'SALES'].includes(type)) {
            return NextResponse.json(
                { error: "Type must be either PURCHASE or SALES" },
                { status: 400 }
            );
        }

        // Validate contact exists and has correct type
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

        if (!subTotal || !taxAmount || !discountAmount || !totalAmount) {
            for (const item of items) {
                const product = await db
                    .select()
                    .from(products)
                    .where(eq(products.id, item.productId))
                    .limit(1);

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

        const balanceAmount = calculatedTotalAmount - (paidAmount || 0);

        // Create invoice
        const [newInvoice] = await db
            .insert(invoices)
            .values({
                invoiceNumber,
                type,
                contactId,
                orderId: orderId || null,
                invoiceDate: new Date(invoiceDate).toISOString(),
                dueDate: dueDate ? new Date(dueDate).toISOString() : null,
                status: 'UNPAID',
                subTotal: calculatedSubTotal.toString(),
                totalAmount: calculatedTotalAmount.toString(),
                taxAmount: calculatedTaxAmount.toString(),
                discountAmount: calculatedDiscountAmount.toString(),
                paidAmount: '0',
                balanceAmount: balanceAmount.toString(),
                currency,
                terms,
                notes,
                createdBy: session.user.id,
            })
            .returning();

        // Create invoice items (using orderItems table with orderType as INVOICE)
        const invoiceItemsData = items.map(item => ({
            orderId: newInvoice.id,
            orderType: 'INVOICE',
            productId: item.productId,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            taxAmount: item.taxAmount?.toString() || '0',
            discountAmount: item.discountAmount?.toString() || '0',
            totalAmount: ((item.quantity * item.unitPrice) + (item.taxAmount || 0) - (item.discountAmount || 0)).toString(),
        }));

        await db.insert(orderItems).values(invoiceItemsData);

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
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
