import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
    invoices,
    contacts,
    orderItems,
    products,
    salesOrders
} from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateDocumentNumber } from "@/lib/db/utils";

// POST /api/invoices/convert-sales-order - Convert SO to customer invoice
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            soId,
            invoiceDate,
            dueDate,
            terms,
            notes
        } = body;

        // Validation
        if (!soId || !invoiceDate) {
            return NextResponse.json(
                { error: "Sales order ID and invoice date are required" },
                { status: 400 }
            );
        }

        // Get sales order with customer details
        const [salesOrder] = await db
            .select({
                id: salesOrders.id,
                soNumber: salesOrders.soNumber,
                customerId: salesOrders.customerId,
                customerName: contacts.name,
                customerEmail: contacts.email,
                customerMobile: contacts.mobile,
                customerAddress: contacts.address,
                orderDate: salesOrders.orderDate,
                status: salesOrders.status,
                totalAmount: salesOrders.totalAmount,
                notes: salesOrders.notes,
            })
            .from(salesOrders)
            .leftJoin(contacts, eq(salesOrders.customerId, contacts.id))
            .where(eq(salesOrders.id, soId));

        if (!salesOrder) {
            return NextResponse.json(
                { error: "Sales order not found" },
                { status: 404 }
            );
        }

        // Check if SO is in correct status
        if (salesOrder.status !== 'APPROVED' && salesOrder.status !== 'DELIVERED') {
            return NextResponse.json(
                { error: "Sales order must be approved or delivered to convert to invoice" },
                { status: 400 }
            );
        }

        // Check if invoice already exists for this SO
        const [existingInvoice] = await db
            .select()
            .from(invoices)
            .where(and(
                eq(invoices.orderId, soId),
                eq(invoices.type, 'SALES')
            ));

        if (existingInvoice) {
            return NextResponse.json(
                { error: "Customer invoice already exists for this sales order" },
                { status: 400 }
            );
        }

        // Get sales order items
        const soItems = await db
            .select({
                id: orderItems.id,
                productId: orderItems.productId,
                productName: products.name,
                productSku: products.sku,
                productHsnCode: products.hsnCode,
                quantity: orderItems.quantity,
                unitPrice: orderItems.unitPrice,
                taxAmount: orderItems.taxAmount,
                discountAmount: orderItems.discountAmount,
                totalAmount: orderItems.totalAmount,
            })
            .from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(and(
                eq(orderItems.orderId, soId),
                eq(orderItems.orderType, 'SALES')
            ));

        if (soItems.length === 0) {
            return NextResponse.json(
                { error: "No items found in sales order" },
                { status: 400 }
            );
        }

        // Generate invoice number
        const currentYear = new Date().getFullYear();
        const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

        // Get next sequence number for this month
        const lastInvoice = await db
            .select({ invoiceNumber: invoices.invoiceNumber })
            .from(invoices)
            .where(and(
                eq(invoices.type, 'SALES'),
                sql`EXTRACT(YEAR FROM ${invoices.invoiceDate}) = ${currentYear}`,
                sql`EXTRACT(MONTH FROM ${invoices.invoiceDate}) = ${currentMonth}`
            ))
            .orderBy(desc(invoices.createdAt))
            .limit(1);

        const sequence = lastInvoice.length > 0
            ? parseInt(lastInvoice[0].invoiceNumber.split('-')[2]) + 1
            : 1;

        const invoiceNumber = generateDocumentNumber('INV-', sequence);

        // Calculate amounts
        let subTotal = 0;
        let taxAmount = 0;
        let discountAmount = 0;
        let totalAmount = 0;

        for (const item of soItems) {
            subTotal += parseFloat(item.quantity) * parseFloat(item.unitPrice);
            taxAmount += parseFloat(item.taxAmount || '0');
            discountAmount += parseFloat(item.discountAmount || '0');
            totalAmount += parseFloat(item.totalAmount || '0');
        }

        // Create customer invoice
        const [newInvoice] = await db
            .insert(invoices)
            .values({
                invoiceNumber: invoiceNumber,
                type: 'SALES',
                contactId: salesOrder.customerId,
                orderId: soId,
                invoiceDate: new Date(invoiceDate),
                dueDate: dueDate ? new Date(dueDate) : null,
                status: 'UNPAID',
                subTotal: subTotal.toString(),
                totalAmount: totalAmount.toString(),
                taxAmount: taxAmount.toString(),
                discountAmount: discountAmount.toString(),
                paidAmount: '0',
                balanceAmount: totalAmount.toString(),
                currency: 'INR',
                terms: terms || salesOrder.notes,
                notes: notes,
                createdBy: parseInt(session.user.id),
            })
            .returning();

        // Create invoice items (copy from SO items)
        const invoiceItemsData = soItems.map(item => ({
            orderId: newInvoice.id,
            orderType: 'INVOICE',
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxAmount: item.taxAmount,
            discountAmount: item.discountAmount,
            totalAmount: item.totalAmount,
        }));

        await db.insert(orderItems).values(invoiceItemsData);

        // Update SO status to DELIVERED if it was APPROVED
        if (salesOrder.status === 'APPROVED') {
            await db
                .update(salesOrders)
                .set({
                    status: 'DELIVERED',
                    updatedAt: new Date(),
                })
                .where(eq(salesOrders.id, soId));
        }

        // Fetch the complete invoice with customer details
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
            message: "Customer invoice created successfully from sales order",
            invoice: completeInvoice,
            items: soItems
        }, { status: 201 });

    } catch (error) {
        console.error("Error converting sales order to invoice:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
