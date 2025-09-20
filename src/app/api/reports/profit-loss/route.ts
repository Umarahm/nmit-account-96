import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, orderItems, products, transactions, chartOfAccounts } from "@/lib/db/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'current'; // current, quarter, year

        // Calculate date range
        const now = new Date();
        let startDate: Date;
        let endDate: Date = now;

        switch (period) {
            case 'current':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of current month
                break;
            case 'quarter':
                const quarterStart = Math.floor(now.getMonth() / 3) * 3;
                startDate = new Date(now.getFullYear(), quarterStart, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1); // Start of current year
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        // Get revenue from sales invoices
        const [salesRevenue] = await db
            .select({
                total: sql<number>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
                tax: sql<number>`COALESCE(SUM(CAST(${invoices.taxAmount} AS DECIMAL)), 0)`,
                discount: sql<number>`COALESCE(SUM(CAST(${invoices.discountAmount} AS DECIMAL)), 0)`
            })
            .from(invoices)
            .where(and(
                eq(invoices.type, 'SALES'),
                gte(invoices.invoiceDate, startDate.toISOString()),
                lte(invoices.invoiceDate, endDate.toISOString())
            ));

        // Get cost of goods sold from purchase invoices
        const [purchaseCost] = await db
            .select({
                total: sql<number>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`
            })
            .from(invoices)
            .where(and(
                eq(invoices.type, 'PURCHASE'),
                gte(invoices.invoiceDate, startDate.toISOString()),
                lte(invoices.invoiceDate, endDate.toISOString())
            ));

        // Get other expenses from transactions (expense accounts)
        const [operatingExpenses] = await db
            .select({
                total: sql<number>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)`
            })
            .from(transactions)
            .leftJoin(chartOfAccounts, eq(transactions.debitAccountId, chartOfAccounts.id))
            .where(and(
                eq(chartOfAccounts.type, 'EXPENSE'),
                gte(transactions.date, startDate.toISOString()),
                lte(transactions.date, endDate.toISOString())
            ));

        // Get other income from transactions (revenue accounts excluding sales)
        const [otherIncome] = await db
            .select({
                total: sql<number>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)`
            })
            .from(transactions)
            .leftJoin(chartOfAccounts, eq(transactions.creditAccountId, chartOfAccounts.id))
            .where(and(
                eq(chartOfAccounts.type, 'REVENUE'),
                sql`LOWER(${chartOfAccounts.name}) NOT LIKE '%sales%'`,
                gte(transactions.date, startDate.toISOString()),
                lte(transactions.date, endDate.toISOString())
            ));

        // Get interest and other expenses
        const [interestExpense] = await db
            .select({
                total: sql<number>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)`
            })
            .from(transactions)
            .leftJoin(chartOfAccounts, eq(transactions.debitAccountId, chartOfAccounts.id))
            .where(and(
                sql`LOWER(${chartOfAccounts.name}) LIKE '%interest%'`,
                gte(transactions.date, startDate.toISOString()),
                lte(transactions.date, endDate.toISOString())
            ));

        // Calculate P&L components
        const totalRevenue = Number(salesRevenue?.total || 0) + Number(otherIncome?.total || 0);
        const totalCOGS = Number(purchaseCost?.total || 0);
        const grossProfit = totalRevenue - totalCOGS;
        const totalOperatingExpenses = Number(operatingExpenses?.total || 0);
        const operatingProfit = grossProfit - totalOperatingExpenses;
        const totalOtherIncome = Number(otherIncome?.total || 0);
        const totalOtherExpenses = Number(interestExpense?.total || 0);
        const profitBeforeTax = operatingProfit + totalOtherIncome - totalOtherExpenses;

        // For demo purposes, if no real data exists, provide sample data
        const hasRealData = totalRevenue > 0 || totalCOGS > 0 || totalOperatingExpenses > 0;

        let responseData;
        if (!hasRealData) {
            // Sample P&L data
            responseData = {
                period: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    period
                },
                revenue: {
                    sales: { amount: 285000, count: 45 },
                    services: { amount: 95000, count: 12 },
                    other: { amount: 45000, count: 8 },
                    total: 425000
                },
                costOfGoodsSold: {
                    materials: { amount: 125000 },
                    labor: { amount: 55000 },
                    overhead: { amount: 35000 },
                    adjustments: { amount: -5000 },
                    total: 210000
                },
                grossProfit: 215000,
                operatingExpenses: {
                    salaries: { amount: 45000 },
                    rent: { amount: 18000 },
                    marketing: { amount: 12000 },
                    supplies: { amount: 8000 },
                    insurance: { amount: 6000 },
                    depreciation: { amount: 8000 },
                    miscellaneous: { amount: 5000 },
                    total: 112000
                },
                operatingProfit: 103000,
                otherIncomeExpense: {
                    interestIncome: { amount: 3000 },
                    interestExpense: { amount: -8000 },
                    otherIncome: { amount: 2000 },
                    otherExpense: { amount: -1500 },
                    total: -5500
                },
                profitBeforeTax: 97500,
                taxes: {
                    incomeTax: { amount: 28000 },
                    gst: { amount: 12000 },
                    total: 40000
                },
                netProfit: 57500,
                margins: {
                    grossMargin: 50.6,
                    operatingMargin: 24.2,
                    netMargin: 13.5,
                    taxRate: 41.0
                },
                hasRealData: false
            };
        } else {
            // Real data from database
            responseData = {
                period: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    period
                },
                revenue: {
                    sales: Number(salesRevenue?.total || 0),
                    services: 0, // Would need to categorize products
                    other: Number(otherIncome?.total || 0),
                    total: totalRevenue
                },
                costOfGoodsSold: {
                    total: totalCOGS
                },
                grossProfit,
                operatingExpenses: {
                    total: totalOperatingExpenses
                },
                operatingProfit,
                otherIncomeExpense: {
                    total: totalOtherIncome - totalOtherExpenses
                },
                profitBeforeTax,
                taxes: {
                    total: 0 // Would need tax calculation logic
                },
                netProfit: profitBeforeTax, // Simplified
                margins: {
                    grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
                    operatingMargin: totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0,
                    netMargin: totalRevenue > 0 ? (profitBeforeTax / totalRevenue) * 100 : 0,
                    taxRate: 0
                },
                hasRealData: true
            };
        }

        return NextResponse.json(responseData);

    } catch (error) {
        console.error("Error fetching profit & loss statement:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
