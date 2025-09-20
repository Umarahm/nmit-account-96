import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chartOfAccounts, transactions } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all active chart of accounts
        const accounts = await db
            .select({
                id: chartOfAccounts.id,
                code: chartOfAccounts.code,
                name: chartOfAccounts.name,
                type: chartOfAccounts.type,
                parentId: chartOfAccounts.parentId
            })
            .from(chartOfAccounts)
            .where(eq(chartOfAccounts.isActive, true))
            .orderBy(chartOfAccounts.code);

        // Calculate balances for each account
        const accountBalances = await Promise.all(
            accounts.map(async (account) => {
                // Get debit transactions
                const [debitBalance] = await db
                    .select({
                        total: sql<number>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)`
                    })
                    .from(transactions)
                    .where(eq(transactions.debitAccountId, account.id));

                // Get credit transactions
                const [creditBalance] = await db
                    .select({
                        total: sql<number>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)`
                    })
                    .from(transactions)
                    .where(eq(transactions.creditAccountId, account.id));

                const debitTotal = Number(debitBalance?.total || 0);
                const creditTotal = Number(creditBalance?.total || 0);

                // Calculate net balance based on account type
                let balance = 0;
                if (account.type === 'ASSET' || account.type === 'EXPENSE') {
                    balance = debitTotal - creditTotal;
                } else if (account.type === 'LIABILITY' || account.type === 'EQUITY' || account.type === 'REVENUE') {
                    balance = creditTotal - debitTotal;
                }

                return {
                    ...account,
                    debitBalance: debitTotal,
                    creditBalance: creditTotal,
                    balance
                };
            })
        );

        // Organize accounts by type
        const assets = accountBalances.filter(acc => acc.type === 'ASSET');
        const liabilities = accountBalances.filter(acc => acc.type === 'LIABILITY');
        const equity = accountBalances.filter(acc => acc.type === 'EQUITY');

        // Calculate totals
        const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
        const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.balance, 0);
        const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0);
        const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

        // For demo purposes, if no transactions exist, provide sample data
        const hasTransactions = accountBalances.some(acc => acc.debitBalance > 0 || acc.creditBalance > 0);

        let responseData;
        if (!hasTransactions) {
            // Sample balance sheet data when no real transactions exist
            responseData = {
                assets: {
                    current: [
                        { name: "Cash & Cash Equivalents", amount: 125000, accounts: [] },
                        { name: "Accounts Receivable", amount: 85000, accounts: [] },
                        { name: "Inventory", amount: 75000, accounts: [] },
                        { name: "Prepaid Expenses", amount: 15000, accounts: [] }
                    ],
                    fixed: [
                        { name: "Property & Equipment", amount: 200000, accounts: [] },
                        { name: "Accumulated Depreciation", amount: -30000, accounts: [] },
                        { name: "Long-term Investments", amount: 25000, accounts: [] }
                    ]
                },
                liabilities: {
                    current: [
                        { name: "Accounts Payable", amount: 65000, accounts: [] },
                        { name: "Short-term Loans", amount: 35000, accounts: [] },
                        { name: "Taxes Payable", amount: 12000, accounts: [] },
                        { name: "Accrued Expenses", amount: 8000, accounts: [] }
                    ],
                    longTerm: [
                        { name: "Long-term Debt", amount: 85000, accounts: [] },
                        { name: "Deferred Tax Liability", amount: 25000, accounts: [] }
                    ]
                },
                equity: [
                    { name: "Owner's Capital", amount: 150000, accounts: [] },
                    { name: "Retained Earnings", amount: 85000, accounts: [] },
                    { name: "Current Year Profit", amount: 40000, accounts: [] }
                ],
                totals: {
                    totalAssets: 500000,
                    totalLiabilities: 230000,
                    totalEquity: 275000,
                    totalLiabilitiesAndEquity: 505000
                },
                ratios: {
                    debtToAssetRatio: 0.46,
                    equityRatio: 0.55,
                    currentRatio: 1.8,
                    solvencyRatio: 1.2
                },
                hasRealData: false
            };
        } else {
            // Real data from database
            responseData = {
                assets: {
                    current: assets.filter(acc => acc.name.toLowerCase().includes('cash') ||
                        acc.name.toLowerCase().includes('receivable') ||
                        acc.name.toLowerCase().includes('inventory') ||
                        acc.name.toLowerCase().includes('prepaid')),
                    fixed: assets.filter(acc => acc.name.toLowerCase().includes('property') ||
                        acc.name.toLowerCase().includes('equipment') ||
                        acc.name.toLowerCase().includes('investment'))
                },
                liabilities: {
                    current: liabilities.filter(acc => acc.name.toLowerCase().includes('payable') ||
                        acc.name.toLowerCase().includes('short') ||
                        acc.name.toLowerCase().includes('tax')),
                    longTerm: liabilities.filter(acc => acc.name.toLowerCase().includes('long') ||
                        acc.name.toLowerCase().includes('debt') ||
                        acc.name.toLowerCase().includes('deferred'))
                },
                equity: equity.map(acc => ({
                    name: acc.name,
                    amount: acc.balance,
                    accounts: [acc]
                })),
                totals: {
                    totalAssets,
                    totalLiabilities,
                    totalEquity,
                    totalLiabilitiesAndEquity
                },
                ratios: {
                    debtToAssetRatio: totalAssets > 0 ? totalLiabilities / totalAssets : 0,
                    equityRatio: totalAssets > 0 ? totalEquity / totalAssets : 0,
                    currentRatio: 1.0, // Would need to calculate properly
                    solvencyRatio: totalAssets > 0 ? totalEquity / totalLiabilities : 0
                },
                hasRealData: true
            };
        }

        return NextResponse.json(responseData);

    } catch (error) {
        console.error("Error fetching balance sheet:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
