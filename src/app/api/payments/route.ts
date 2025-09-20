import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments, invoices } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/payments - Get all payments with optional filters
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const invoiceId = searchParams.get('invoiceId');
        const status = searchParams.get('status');
        const paymentMethod = searchParams.get('paymentMethod');

        let whereConditions = [];

        if (invoiceId) {
            whereConditions.push(eq(payments.invoiceId, parseInt(invoiceId)));
        }

        if (status) {
            whereConditions.push(eq(payments.status, status));
        }

        if (paymentMethod) {
            whereConditions.push(eq(payments.paymentMethod, paymentMethod));
        }

        const paymentList = await db
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
                createdAt: payments.createdAt,
                updatedAt: payments.updatedAt,
            })
            .from(payments)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(desc(payments.paymentDate));

        return NextResponse.json({
            payments: paymentList
        });

    } catch (error) {
        console.error("Error fetching payments:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/payments - Create a new payment
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            invoiceId,
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

        // Validate required fields
        if (!invoiceId || !paymentDate || !amount) {
            return NextResponse.json(
                { error: "Invoice ID, payment date, and amount are required" },
                { status: 400 }
            );
        }

        // Check if invoice exists
        const [invoice] = await db
            .select()
            .from(invoices)
            .where(eq(invoices.id, parseInt(invoiceId)));

        if (!invoice) {
            return NextResponse.json(
                { error: "Invoice not found" },
                { status: 404 }
            );
        }

        // Generate payment number if not provided
        let paymentNumber = body.paymentNumber;
        if (!paymentNumber) {
            const currentYear = new Date().getFullYear();
            const [lastPayment] = await db
                .select({ paymentNumber: payments.paymentNumber })
                .from(payments)
                .where(payments.paymentNumber.like(`${currentYear}-%`))
                .orderBy(desc(payments.paymentNumber))
                .limit(1);

            let nextNumber = 1;
            if (lastPayment?.paymentNumber) {
                const match = lastPayment.paymentNumber.match(/(\d+)$/);
                if (match) {
                    nextNumber = parseInt(match[1]) + 1;
                }
            }

            paymentNumber = `${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
        }

        // Create payment
        const [newPayment] = await db
            .insert(payments)
            .values({
                paymentNumber,
                invoiceId: parseInt(invoiceId),
                paymentDate: new Date(paymentDate),
                amount: amount.toString(),
                paymentMethodId: paymentMethodId ? parseInt(paymentMethodId) : null,
                paymentMethod: paymentMethod || 'CASH',
                reference,
                bankAccount,
                chequeDate: chequeDate ? new Date(chequeDate) : null,
                clearanceDate: clearanceDate ? new Date(clearanceDate) : null,
                status: status || 'COMPLETED',
                currency: currency || 'INR',
                exchangeRate: exchangeRate ? parseFloat(exchangeRate) : 1.0,
                notes,
                createdBy: parseInt(session.user.id),
            })
            .returning();

        // Update invoice payment amounts and status
        const [updatedInvoice] = await db
            .select({
                totalAmount: invoices.totalAmount,
                paidAmount: invoices.paidAmount,
            })
            .from(invoices)
            .where(eq(invoices.id, parseInt(invoiceId)));

        const currentPaidAmount = parseFloat(updatedInvoice.paidAmount || '0');
        const paymentAmount = parseFloat(amount);
        const newPaidAmount = currentPaidAmount + paymentAmount;
        const totalAmount = parseFloat(updatedInvoice.totalAmount);
        const newBalanceAmount = Math.max(0, totalAmount - newPaidAmount);

        let newStatus = invoice.status;
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
            .where(eq(invoices.id, parseInt(invoiceId)));

        return NextResponse.json({
            message: "Payment created successfully",
            payment: newPayment
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating payment:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
