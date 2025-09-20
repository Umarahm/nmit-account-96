import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
    invoices,
    contacts,
    orderItems,
    products,
    purchaseOrders
} from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateDocumentNumber } from "@/lib/db/utils";

// POST /api/invoices/convert-purchase-order - Convert PO to vendor bill
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            poId,
            invoiceDate,
            dueDate,
            terms,
            notes
        } = body;

        // Validation
        if (!poId || !invoiceDate) {
            return NextResponse.json(
                { error: "Purchase order ID and invoice date are required" },
                { status: 400 }
            );
        }

        // Get purchase order with vendor details
        const [purchaseOrder] = await db
            .select({
                id: purchaseOrders.id,
                poNumber: purchaseOrders.poNumber,
                vendorId: purchaseOrders.vendorId,
                vendorName: contacts.name,
                vendorEmail: contacts.email,
                vendorMobile: contacts.mobile,
                vendorAddress: contacts.address,
                orderDate: purchaseOrders.orderDate,
                status: purchaseOrders.status,
                totalAmount: purchaseOrders.totalAmount,
                notes: purchaseOrders.notes,
            })
            .from(purchaseOrders)
            .leftJoin(contacts, eq(purchaseOrders.vendorId, contacts.id))
            .where(eq(purchaseOrders.id, poId));

        if (!purchaseOrder) {
            return NextResponse.json(
                { error: "Purchase order not found" },
                { status: 404 }
            );
        }

        // Check if PO is in correct status
        if (purchaseOrder.status !== 'APPROVED' && purchaseOrder.status !== 'RECEIVED') {
            return NextResponse.json(
                { error: "Purchase order must be approved or received to convert to bill" },
                { status: 400 }
            );
        }

        // Check if bill already exists for this PO
        const [existingBill] = await db
            .select()
            .from(invoices)
            .where(and(
                eq(invoices.orderId, poId),
                eq(invoices.type, 'PURCHASE')
            ));

        if (existingBill) {
            return NextResponse.json(
                { error: "Vendor bill already exists for this purchase order" },
                { status: 400 }
            );
        }

        // Get purchase order items
        const poItems = await db
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
                eq(orderItems.orderId, poId),
                eq(orderItems.orderType, 'PURCHASE')
            ));

        if (poItems.length === 0) {
            return NextResponse.json(
                { error: "No items found in purchase order" },
                { status: 400 }
            );
        }

        // Generate bill number
        const currentYear = new Date().getFullYear();
        const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

        // Get next sequence number for this month
        const lastBill = await db
            .select({ invoiceNumber: invoices.invoiceNumber })
            .from(invoices)
            .where(and(
                eq(invoices.type, 'PURCHASE'),
                sql`EXTRACT(YEAR FROM ${invoices.invoiceDate}) = ${currentYear}`,
                sql`EXTRACT(MONTH FROM ${invoices.invoiceDate}) = ${currentMonth}`
            ))
            .orderBy(desc(invoices.createdAt))
            .limit(1);

        const sequence = lastBill.length > 0
            ? parseInt(lastBill[0].invoiceNumber.split('-')[2]) + 1
            : 1;

        const billNumber = generateDocumentNumber('BILL-', sequence);

        // Calculate amounts
        let subTotal = 0;
        let taxAmount = 0;
        let discountAmount = 0;
        let totalAmount = 0;

        for (const item of poItems) {
            subTotal += parseFloat(item.quantity) * parseFloat(item.unitPrice);
            taxAmount += parseFloat(item.taxAmount || '0');
            discountAmount += parseFloat(item.discountAmount || '0');
            totalAmount += parseFloat(item.totalAmount || '0');
        }

        // Create vendor bill
        const [newBill] = await db
            .insert(invoices)
            .values({
                invoiceNumber: billNumber,
                type: 'PURCHASE',
                contactId: purchaseOrder.vendorId,
                orderId: poId,
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
                terms: terms || purchaseOrder.notes,
                notes: notes,
                createdBy: parseInt(session.user.id),
            })
            .returning();

        // Create bill items (copy from PO items)
        const billItemsData = poItems.map(item => ({
            orderId: newBill.id,
            orderType: 'INVOICE',
            productId: item.productId,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            taxAmount: item.taxAmount ? String(item.taxAmount) : '0',
            discountAmount: item.discountAmount ? String(item.discountAmount) : '0',
            totalAmount: item.totalAmount ? String(item.totalAmount) : '0',
        }));

        await db.insert(orderItems).values(billItemsData);

        // Update PO status to RECEIVED if it was APPROVED
        if (purchaseOrder.status === 'APPROVED') {
            await db
                .update(purchaseOrders)
                .set({
                    status: 'RECEIVED',
                    updatedAt: new Date(),
                })
                .where(eq(purchaseOrders.id, poId));
        }

        // Fetch the complete bill with vendor details
        const [completeBill] = await db
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
            .where(eq(invoices.id, newBill.id));

        return NextResponse.json({
            message: "Vendor bill created successfully from purchase order",
            bill: completeBill,
            items: poItems
        }, { status: 201 });

    } catch (error) {
        console.error("Error converting purchase order to bill:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
