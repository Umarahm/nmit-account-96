import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments, invoices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/payments/[id] - Get specific payment
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const paymentId = parseInt(params.id);
        if (isNaN(paymentId)) {
            return NextResponse.json(
                { error: "Invalid payment ID" },
                { status: 400 }
            );
        }

        const [payment] = await db
            .select({
                id: payments.id,
                paymentNumber: payments.paymentNumber,
                invoiceId: payments.invoiceId,
                paymentDate: payments.paymentDate,
                amount: payments.amount,
                paymentMethodId: payments.paymentMethodId,
                paymentMethod: payments.paymentMethod,
                reference: payments.reference,
                bankAccount: payments.bankAccount,
                chequeDate: payments.chequeDate,
                clearanceDate: payments.clearanceDate,
                status: payments.status,
                currency: payments.currency,
                exchangeRate: payments.exchangeRate,
                notes: payments.notes,
                attachments: payments.attachments,
                createdBy: payments.createdBy,
                createdAt: payments.createdAt,
                updatedAt: payments.updatedAt,
            })
            .from(payments)
            .where(eq(payments.id, paymentId));

        if (!payment) {
            return NextResponse.json(
                { error: "Payment not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            payment
        });

    } catch (error) {
        console.error("Error fetching payment:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT /api/payments/[id] - Update payment
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const paymentId = parseInt(params.id);
        if (isNaN(paymentId)) {
            return NextResponse.json(
                { error: "Invalid payment ID" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const {
            paymentDate,
            amount,
            paymentMethodId,
            paymentMethod,
            reference,
            bankAccount,
            chequeDate,
            clearanceDate,
            status,
            currency,
            exchangeRate,
            notes
        } = body;

        // Check if payment exists
        const [existingPayment] = await db
            .select()
            .from(payments)
            .where(eq(payments.id, paymentId));

        if (!existingPayment) {
            return NextResponse.json(
                { error: "Payment not found" },
                { status: 404 }
            );
        }

        // Calculate the difference in payment amount
        const oldAmount = parseFloat(existingPayment.amount);
        const newAmount = amount ? parseFloat(amount) : oldAmount;
        const amountDifference = newAmount - oldAmount;

        // Update payment
        const [updatedPayment] = await db
            .update(payments)
            .set({
                paymentDate: paymentDate ? new Date(paymentDate) : undefined,
                amount: amount ? amount.toString() : undefined,
                paymentMethodId: paymentMethodId ? parseInt(paymentMethodId) : undefined,
                paymentMethod: paymentMethod || undefined,
                reference,
                bankAccount,
                chequeDate: chequeDate ? new Date(chequeDate) : null,
                clearanceDate: clearanceDate ? new Date(clearanceDate) : null,
                status: status || undefined,
                currency: currency || undefined,
                exchangeRate: exchangeRate ? parseFloat(exchangeRate) : undefined,
                notes,
                updatedAt: new Date(),
            })
            .where(eq(payments.id, paymentId))
            .returning();

        // Update invoice payment amounts and status if amount changed
        if (amountDifference !== 0) {
            const [invoice] = await db
                .select({
                    totalAmount: invoices.totalAmount,
                    paidAmount: invoices.paidAmount,
                })
                .from(invoices)
                .where(eq(invoices.id, existingPayment.invoiceId));

            const currentPaidAmount = parseFloat(invoice.paidAmount || '0');
            const newPaidAmount = currentPaidAmount + amountDifference;
            const totalAmount = parseFloat(invoice.totalAmount);
            const newBalanceAmount = Math.max(0, totalAmount - newPaidAmount);

            let newStatus = invoice.status;
            if (newPaidAmount >= totalAmount) {
                newStatus = 'PAID';
            } else if (newPaidAmount > 0) {
                newStatus = 'PARTIAL';
            } else {
                newStatus = 'UNPAID';
            }

            await db
                .update(invoices)
                .set({
                    paidAmount: newPaidAmount.toString(),
                    balanceAmount: newBalanceAmount.toString(),
                    status: newStatus,
                    updatedAt: new Date(),
                })
                .where(eq(invoices.id, existingPayment.invoiceId));
        }

        return NextResponse.json({
            message: "Payment updated successfully",
            payment: updatedPayment
        });

    } catch (error) {
        console.error("Error updating payment:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/payments/[id] - Delete payment
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const paymentId = parseInt(params.id);
        if (isNaN(paymentId)) {
            return NextResponse.json(
                { error: "Invalid payment ID" },
                { status: 400 }
            );
        }

        // Check if payment exists
        const [existingPayment] = await db
            .select()
            .from(payments)
            .where(eq(payments.id, paymentId));

        if (!existingPayment) {
            return NextResponse.json(
                { error: "Payment not found" },
                { status: 404 }
            );
        }

        // Store payment amount for invoice update
        const paymentAmount = parseFloat(existingPayment.amount);

        // Delete payment
        await db
            .delete(payments)
            .where(eq(payments.id, paymentId));

        // Update invoice payment amounts and status
        const [invoice] = await db
            .select({
                totalAmount: invoices.totalAmount,
                paidAmount: invoices.paidAmount,
            })
            .from(invoices)
            .where(eq(invoices.id, existingPayment.invoiceId));

        const currentPaidAmount = parseFloat(invoice.paidAmount || '0');
        const newPaidAmount = Math.max(0, currentPaidAmount - paymentAmount);
        const totalAmount = parseFloat(invoice.totalAmount);
        const newBalanceAmount = totalAmount - newPaidAmount;

        let newStatus = 'UNPAID';
        if (newPaidAmount >= totalAmount) {
            newStatus = 'PAID';
        } else if (newPaidAmount > 0) {
            newStatus = 'PARTIAL';
        }

        await db
            .update(invoices)
            .set({
                paidAmount: newPaidAmount.toString(),
                balanceAmount: newBalanceAmount.toString(),
                status: newStatus,
                updatedAt: new Date(),
            })
            .where(eq(invoices.id, existingPayment.invoiceId));

        return NextResponse.json({
            message: "Payment deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting payment:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
