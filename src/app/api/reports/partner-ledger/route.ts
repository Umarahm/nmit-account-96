import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts, invoices, payments, transactions } from "@/lib/db/schema";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const partnerId = searchParams.get('partnerId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!partnerId) {
            return NextResponse.json({ error: "Partner ID is required" }, { status: 400 });
        }

        // Get partner information
        const partner = await db
            .select({
                id: contacts.id,
                name: contacts.name,
                type: contacts.type,
                email: contacts.email,
                mobile: contacts.mobile
            })
            .from(contacts)
            .where(eq(contacts.id, parseInt(partnerId)))
            .limit(1);

        if (!partner.length) {
            return NextResponse.json({ error: "Partner not found" }, { status: 404 });
        }

        // Get all invoices for this partner
        const invoiceQuery = db
            .select({
                id: invoices.id,
                invoiceNumber: invoices.invoiceNumber,
                type: invoices.type,
                invoiceDate: invoices.invoiceDate,
                totalAmount: invoices.totalAmount,
                status: invoices.status,
                reference: sql<string>`'Invoice: ' || ${invoices.invoiceNumber}`
            })
            .from(invoices)
            .where(eq(invoices.contactId, parseInt(partnerId)));

        if (startDate) {
            invoiceQuery.where(sql`${invoices.invoiceDate} >= ${startDate}`);
        }
        if (endDate) {
            invoiceQuery.where(sql`${invoices.invoiceDate} <= ${endDate}`);
        }

        const invoicesData = await invoiceQuery.orderBy(asc(invoices.invoiceDate));

        // Get all payments for this partner (through invoices)
        const paymentQuery = db
            .select({
                id: payments.id,
                paymentDate: payments.paymentDate,
                amount: payments.amount,
                paymentMethod: payments.paymentMethod,
                reference: payments.reference,
                invoiceNumber: invoices.invoiceNumber,
                paymentRef: sql<string>`'Payment for Invoice: ' || ${invoices.invoiceNumber}`
            })
            .from(payments)
            .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
            .where(eq(invoices.contactId, parseInt(partnerId)));

        if (startDate) {
            paymentQuery.where(sql`${payments.paymentDate} >= ${startDate}`);
        }
        if (endDate) {
            paymentQuery.where(sql`${payments.paymentDate} <= ${endDate}`);
        }

        const paymentsData = await paymentQuery.orderBy(asc(payments.paymentDate));

        // Combine and sort all transactions
        let allTransactions: any[] = [];

        // Add invoices as debit entries (amounts owed by customers or amounts to pay vendors)
        invoicesData.forEach(invoice => {
            const amount = Number(invoice.totalAmount || 0);
            const isDebit = invoice.type === 'SALES'; // Customer invoice = debit (customer owes us)
            const isCredit = invoice.type === 'PURCHASE'; // Vendor invoice = credit (we owe vendor)

            allTransactions.push({
                id: `inv-${invoice.id}`,
                date: invoice.invoiceDate,
                description: invoice.reference,
                type: 'INVOICE',
                debit: isDebit ? amount : 0,
                credit: isCredit ? amount : 0,
                balance: 0, // Will be calculated below
                status: invoice.status
            });
        });

        // Add payments as credit entries (payments received from customers or payments made to vendors)
        paymentsData.forEach(payment => {
            const amount = Number(payment.amount);
            const isCredit = partner[0].type === 'CUSTOMER'; // Customer payment = credit (customer paying us)
            const isDebit = partner[0].type === 'VENDOR'; // Vendor payment = debit (us paying vendor)

            allTransactions.push({
                id: `pay-${payment.id}`,
                date: payment.paymentDate,
                description: payment.paymentRef,
                type: 'PAYMENT',
                debit: isDebit ? amount : 0,
                credit: isCredit ? amount : 0,
                balance: 0, // Will be calculated below
                paymentMethod: payment.paymentMethod
            });
        });

        // Sort all transactions by date
        allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate running balance
        let runningBalance = 0;
        allTransactions.forEach(transaction => {
            runningBalance += transaction.debit - transaction.credit;
            transaction.balance = runningBalance;
        });

        // Calculate summary
        const totalDebit = allTransactions.reduce((sum, t) => sum + t.debit, 0);
        const totalCredit = allTransactions.reduce((sum, t) => sum + t.credit, 0);
        const closingBalance = totalDebit - totalCredit;

        // Format currency
        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 0,
            }).format(amount);
        };

        // Format the response
        const responseData = {
            partner: partner[0],
            summary: {
                openingBalance: 0, // For now, assuming starts from 0
                totalDebit,
                totalCredit,
                closingBalance,
                transactionCount: allTransactions.length
            },
            transactions: allTransactions.map(t => ({
                ...t,
                debitFormatted: formatCurrency(t.debit),
                creditFormatted: formatCurrency(t.credit),
                balanceFormatted: formatCurrency(t.balance)
            })),
            formatted: {
                openingBalance: formatCurrency(0),
                totalDebit: formatCurrency(totalDebit),
                totalCredit: formatCurrency(totalCredit),
                closingBalance: formatCurrency(closingBalance)
            }
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error("Error fetching partner ledger:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

