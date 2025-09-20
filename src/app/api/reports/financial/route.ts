import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, payments, transactions, chartOfAccounts, products, orderItems } from "@/lib/db/schema";
import { eq, and, sql, gte, lte, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
        const previousPeriodEnd = startDate;

        // Get revenue data (Sales invoices)
        const [currentRevenue, previousRevenue] = await Promise.all([
            db
                .select({
                    total: sql<number>`SUM(CAST(${invoices.totalAmount} AS DECIMAL))`,
                    count: sql<number>`COUNT(*)`
                })
                .from(invoices)
                .where(and(
                    eq(invoices.type, 'SALES'),
                    gte(invoices.invoiceDate, startDate.toISOString()),
                    lte(invoices.invoiceDate, now.toISOString())
                )),
            db
                .select({
                    total: sql<number>`SUM(CAST(${invoices.totalAmount} AS DECIMAL))`,
                    count: sql<number>`COUNT(*)`
                })
                .from(invoices)
                .where(and(
                    eq(invoices.type, 'SALES'),
                    gte(invoices.invoiceDate, previousPeriodStart.toISOString()),
                    lte(invoices.invoiceDate, previousPeriodEnd.toISOString())
                ))
        ]);

        // Get expense data (Purchase invoices)
        const [currentExpenses, previousExpenses] = await Promise.all([
            db
                .select({
                    total: sql<number>`SUM(CAST(${invoices.totalAmount} AS DECIMAL))`,
                    count: sql<number>`COUNT(*)`
                })
                .from(invoices)
                .where(and(
                    eq(invoices.type, 'PURCHASE'),
                    gte(invoices.invoiceDate, startDate.toISOString()),
                    lte(invoices.invoiceDate, now.toISOString())
                )),
            db
                .select({
                    total: sql<number>`SUM(CAST(${invoices.totalAmount} AS DECIMAL))`,
                    count: sql<number>`COUNT(*)`
                })
                .from(invoices)
                .where(and(
                    eq(invoices.type, 'PURCHASE'),
                    gte(invoices.invoiceDate, previousPeriodStart.toISOString()),
                    lte(invoices.invoiceDate, previousPeriodEnd.toISOString())
                ))
        ]);

        // Get payments received (customer payments)
        const [currentPaymentsReceived] = await db
            .select({
                total: sql<number>`SUM(CAST(${payments.amount} AS DECIMAL))`
            })
            .from(payments)
            .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
            .where(and(
                eq(invoices.type, 'SALES'),
                gte(payments.paymentDate, startDate.toISOString()),
                lte(payments.paymentDate, now.toISOString())
            ));

        // Get payments made (vendor payments)
        const [currentPaymentsMade] = await db
            .select({
                total: sql<number>`SUM(CAST(${payments.amount} AS DECIMAL))`
            })
            .from(payments)
            .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
            .where(and(
                eq(invoices.type, 'PURCHASE'),
                gte(payments.paymentDate, startDate.toISOString()),
                lte(payments.paymentDate, now.toISOString())
            ));

        // Get outstanding receivables
        const [receivables] = await db
            .select({
                total: sql<number>`SUM(CAST(${invoices.balanceAmount} AS DECIMAL))`
            })
            .from(invoices)
            .where(and(
                eq(invoices.type, 'SALES'),
                sql`CAST(${invoices.balanceAmount} AS DECIMAL) > 0`
            ));

        // Get outstanding payables
        const [payables] = await db
            .select({
                total: sql<number>`SUM(CAST(${invoices.balanceAmount} AS DECIMAL))`
            })
            .from(invoices)
            .where(and(
                eq(invoices.type, 'PURCHASE'),
                sql`CAST(${invoices.balanceAmount} AS DECIMAL) > 0`
            ));

        // Revenue breakdown by categories (this would need product category data)
        const revenueBreakdown = await db
            .select({
                category: sql<string>`COALESCE(${products.category}, 'Uncategorized')`,
                amount: sql<number>`SUM(CAST(${orderItems.totalAmount} AS DECIMAL))`
            })
            .from(orderItems)
            .leftJoin(invoices, and(
                eq(orderItems.orderId, invoices.id),
                eq(orderItems.orderType, 'INVOICE')
            ))
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(and(
                eq(invoices.type, 'SALES'),
                gte(invoices.invoiceDate, startDate.toISOString()),
                lte(invoices.invoiceDate, now.toISOString())
            ))
            .groupBy(products.category);

        // Calculate financial metrics
        const currentRevenueTotal = Number(currentRevenue[0]?.total || 0);
        const previousRevenueTotal = Number(previousRevenue[0]?.total || 0);
        const currentExpenseTotal = Number(currentExpenses[0]?.total || 0);
        const previousExpenseTotal = Number(previousExpenses[0]?.total || 0);

        const revenueChange = previousRevenueTotal > 0
            ? ((currentRevenueTotal - previousRevenueTotal) / previousRevenueTotal) * 100
            : 0;
        const expenseChange = previousExpenseTotal > 0
            ? ((currentExpenseTotal - previousExpenseTotal) / previousExpenseTotal) * 100
            : 0;

        const netProfit = currentRevenueTotal - currentExpenseTotal;
        const profitMargin = currentRevenueTotal > 0 ? (netProfit / currentRevenueTotal) * 100 : 0;

        return NextResponse.json({
            period: {
                startDate: startDate.toISOString(),
                endDate: now.toISOString(),
                period
            },
            metrics: {
                totalRevenue: currentRevenueTotal,
                totalExpenses: currentExpenseTotal,
                netProfit,
                profitMargin,
                outstandingReceivables: Number(receivables[0]?.total || 0),
                outstandingPayables: Number(payables[0]?.total || 0),
                paymentsReceived: Number(currentPaymentsReceived[0]?.total || 0),
                paymentsMade: Number(currentPaymentsMade[0]?.total || 0)
            },
            trends: {
                revenueChange,
                expenseChange,
                profitChange: revenueChange - expenseChange // Simplified
            },
            breakdowns: {
                revenue: revenueBreakdown.map(item => ({
                    category: item.category,
                    amount: Number(item.amount),
                    percentage: currentRevenueTotal > 0 ? (Number(item.amount) / currentRevenueTotal) * 100 : 0
                }))
            }
        });

    } catch (error) {
        console.error("Error fetching financial reports:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
