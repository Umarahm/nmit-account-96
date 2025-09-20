import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, contacts, orderItems, products, payments } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/invoices/[id] - Get specific invoice with items and payments
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const invoiceId = parseInt(params.id);
        if (isNaN(invoiceId)) {
            return NextResponse.json(
                { error: "Invalid invoice ID" },
                { status: 400 }
            );
        }

        // Get invoice details
        const [invoice] = await db
            .select({
                id: invoices.id,
                invoiceNumber: invoices.invoiceNumber,
                type: invoices.type,
                contactId: invoices.contactId,
                contactName: contacts.name,
                contactEmail: contacts.email,
                contactMobile: contacts.mobile,
                contactAddress: contacts.address,
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
            .where(eq(invoices.id, invoiceId));

        if (!invoice) {
            return NextResponse.json(
                { error: "Invoice not found" },
                { status: 404 }
            );
        }

        // Get invoice items
        const invoiceItems = await db
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
                eq(orderItems.orderId, invoiceId),
                eq(orderItems.orderType, 'INVOICE')
            ));

        // Get payments for this invoice
        const invoicePayments = await db
            .select({
                id: payments.id,
                paymentNumber: payments.paymentNumber,
                paymentDate: payments.paymentDate,
                amount: payments.amount,
                paymentMethod: payments.paymentMethod,
                reference: payments.reference,
                status: payments.status,
                notes: payments.notes,
                createdAt: payments.createdAt,
            })
            .from(payments)
            .where(eq(payments.invoiceId, invoiceId))
            .orderBy(desc(payments.paymentDate));

        return NextResponse.json({
            invoice: {
                ...invoice,
                items: invoiceItems,
                payments: invoicePayments,
            }
        });

    } catch (error) {
        console.error("Error fetching invoice:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const invoiceId = parseInt(params.id);
        if (isNaN(invoiceId)) {
            return NextResponse.json(
                { error: "Invalid invoice ID" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const {
            invoiceDate,
            dueDate,
            status,
            terms,
            notes
        } = body;

        // Check if invoice exists
        const [existingInvoice] = await db
            .select()
            .from(invoices)
            .where(eq(invoices.id, invoiceId));

        if (!existingInvoice) {
            return NextResponse.json(
                { error: "Invoice not found" },
                { status: 404 }
            );
        }

        // Validate status if provided
        if (status && !['PAID', 'UNPAID', 'PARTIAL', 'OVERDUE', 'CANCELLED'].includes(status)) {
            return NextResponse.json(
                { error: "Invalid status" },
                { status: 400 }
            );
        }

        // Update invoice
        const [updatedInvoice] = await db
            .update(invoices)
            .set({
                invoiceDate: invoiceDate ? new Date(invoiceDate).toISOString() : undefined,
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                status: status || undefined,
                terms: terms || undefined,
                notes: notes || undefined,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(invoices.id, invoiceId))
            .returning();

        return NextResponse.json({
            message: "Invoice updated successfully",
            invoice: updatedInvoice
        });

    } catch (error) {
        console.error("Error updating invoice:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/invoices/[id] - Delete invoice (soft delete by changing status)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const invoiceId = parseInt(params.id);
        if (isNaN(invoiceId)) {
            return NextResponse.json(
                { error: "Invalid invoice ID" },
                { status: 400 }
            );
        }

        // Check if invoice exists
        const [existingInvoice] = await db
            .select()
            .from(invoices)
            .where(eq(invoices.id, invoiceId));

        if (!existingInvoice) {
            return NextResponse.json(
                { error: "Invoice not found" },
                { status: 404 }
            );
        }

        // Check if invoice has payments
        const [paymentCount] = await db
            .select({ count: sql`count(*)` })
            .from(payments)
            .where(eq(payments.invoiceId, invoiceId));

        if (paymentCount.count > 0) {
            return NextResponse.json(
                { error: "Cannot delete invoice with existing payments" },
                { status: 400 }
            );
        }

        // Soft delete by changing status to CANCELLED
        const [deletedInvoice] = await db
            .update(invoices)
            .set({
                status: 'CANCELLED',
                updatedAt: new Date().toISOString(),
            })
            .where(eq(invoices.id, invoiceId))
            .returning();

        return NextResponse.json({
            message: "Invoice cancelled successfully",
            invoice: deletedInvoice
        });

    } catch (error) {
        console.error("Error deleting invoice:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
