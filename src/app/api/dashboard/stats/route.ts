import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { 
    contacts, 
    products, 
    salesOrders, 
    purchaseOrders, 
    invoices, 
    payments 
} from '@/lib/db/schema';
import { eq, and, gte, sum, count, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Fetching dashboard statistics...');

        // Get current month date range
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        // Parallel queries for better performance
        const [
            totalContactsResult,
            totalProductsResult,
            totalActiveProductsResult,
            currentMonthSalesResult,
            lastMonthSalesResult,
            pendingInvoicesResult,
            paidInvoicesResult,
            currentMonthPaymentsResult,
            stockValueResult,
            recentInvoicesResult,
            recentPaymentsResult,
            recentOrdersResult
        ] = await Promise.all([
            // Total active contacts
            db.select({ count: count() })
              .from(contacts)
              .where(eq(contacts.isActive, true)),

            // Total products
            db.select({ count: count() })
              .from(products)
              .where(eq(products.isActive, true)),

            // Active products with stock
            db.select({ count: count() })
              .from(products)
              .where(and(
                  eq(products.isActive, true),
                  sql`${products.currentStock} > 0`
              )),

            // Current month sales
            db.select({ 
                total: sum(salesOrders.totalAmount),
                count: count()
            })
              .from(salesOrders)
              .where(gte(salesOrders.orderDate, currentMonthStart)),

            // Last month sales
            db.select({ 
                total: sum(salesOrders.totalAmount),
                count: count()
            })
              .from(salesOrders)
              .where(and(
                  gte(salesOrders.orderDate, lastMonthStart),
                  sql`${salesOrders.orderDate} <= ${lastMonthEnd}`
              )),

            // Pending invoices
            db.select({ 
                total: sum(invoices.totalAmount),
                count: count()
            })
              .from(invoices)
              .where(eq(invoices.status, 'UNPAID')),

            // Paid invoices this month
            db.select({ 
                total: sum(invoices.totalAmount),
                count: count()
            })
              .from(invoices)
              .where(and(
                  eq(invoices.status, 'PAID'),
                  gte(invoices.invoiceDate, currentMonthStart)
              )),

            // Current month payments
            db.select({ 
                total: sum(payments.amount),
                count: count()
            })
              .from(payments)
              .where(gte(payments.paymentDate, currentMonthStart)),

            // Stock value
            db.select({ 
                total: sum(sql`${products.currentStock} * ${products.costPrice}`)
            })
              .from(products)
              .where(and(
                  eq(products.isActive, true),
                  sql`${products.currentStock} > 0`
              )),

            // Recent invoices (last 5)
            db.select({
                id: invoices.id,
                invoiceNumber: invoices.invoiceNumber,
                totalAmount: invoices.totalAmount,
                status: invoices.status,
                invoiceDate: invoices.invoiceDate,
                contactName: contacts.name
            })
              .from(invoices)
              .leftJoin(contacts, eq(invoices.contactId, contacts.id))
              .orderBy(sql`${invoices.invoiceDate} DESC`)
              .limit(5),

            // Recent payments (last 5)
            db.select({
                id: payments.id,
                amount: payments.amount,
                paymentDate: payments.paymentDate,
                paymentMethod: payments.paymentMethod,
                invoiceNumber: invoices.invoiceNumber
            })
              .from(payments)
              .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
              .orderBy(sql`${payments.paymentDate} DESC`)
              .limit(5),

            // Recent orders (last 5)
            db.select({
                id: salesOrders.id,
                orderNumber: salesOrders.soNumber,
                totalAmount: salesOrders.totalAmount,
                status: salesOrders.status,
                orderDate: salesOrders.orderDate,
                contactName: contacts.name,
                type: sql<string>`'SALE'`
            })
              .from(salesOrders)
              .leftJoin(contacts, eq(salesOrders.customerId, contacts.id))
              .orderBy(sql`${salesOrders.orderDate} DESC`)
              .limit(3)
        ]);

        // Calculate trends
        const currentSales = Number(currentMonthSalesResult[0]?.total || 0);
        const lastSales = Number(lastMonthSalesResult[0]?.total || 0);
        const salesTrend = lastSales > 0 ? ((currentSales - lastSales) / lastSales) * 100 : 0;

        // Format statistics
        const statistics = {
            totalRevenue: {
                value: currentSales,
                formatted: new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    minimumFractionDigits: 0,
                }).format(currentSales),
                trend: {
                    value: salesTrend,
                    direction: salesTrend > 0 ? 'up' : salesTrend < 0 ? 'down' : 'neutral'
                }
            },
            activeContacts: {
                value: totalContactsResult[0]?.count || 0,
                formatted: (totalContactsResult[0]?.count || 0).toString()
            },
            pendingInvoices: {
                value: pendingInvoicesResult[0]?.count || 0,
                formatted: (pendingInvoicesResult[0]?.count || 0).toString(),
                amount: Number(pendingInvoicesResult[0]?.total || 0),
                amountFormatted: new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    minimumFractionDigits: 0,
                }).format(Number(pendingInvoicesResult[0]?.total || 0))
            },
            stockValue: {
                value: Number(stockValueResult[0]?.total || 0),
                formatted: new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    minimumFractionDigits: 0,
                }).format(Number(stockValueResult[0]?.total || 0)),
                totalProducts: totalProductsResult[0]?.count || 0,
                activeProducts: totalActiveProductsResult[0]?.count || 0
            },
            monthlyPayments: {
                value: Number(currentMonthPaymentsResult[0]?.total || 0),
                formatted: new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    minimumFractionDigits: 0,
                }).format(Number(currentMonthPaymentsResult[0]?.total || 0)),
                count: currentMonthPaymentsResult[0]?.count || 0
            }
        };

        const recentActivity = [
            ...recentInvoicesResult.map(invoice => ({
                id: `invoice-${invoice.id}`,
                type: 'invoice',
                title: `Invoice ${invoice.invoiceNumber}`,
                description: `${invoice.contactName || 'Unknown Contact'} - ${new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR'
                }).format(Number(invoice.totalAmount || 0))}`,
                date: invoice.invoiceDate,
                status: invoice.status,
                amount: invoice.totalAmount
            })),
            ...recentPaymentsResult.map(payment => ({
                id: `payment-${payment.id}`,
                type: 'payment',
                title: `Payment Received`,
                description: `${payment.invoiceNumber || 'Direct Payment'} - ${payment.paymentMethod}`,
                date: payment.paymentDate,
                status: 'COMPLETED',
                amount: payment.amount
            })),
            ...recentOrdersResult.map(order => ({
                id: `order-${order.id}`,
                type: 'order',
                title: `Sales Order ${order.orderNumber}`,
                description: `${order.contactName || 'Unknown Customer'}`,
                date: order.orderDate,
                status: order.status,
                amount: order.totalAmount
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

        console.log('Dashboard statistics calculated successfully');

        return NextResponse.json({
            success: true,
            statistics,
            recentActivity,
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard statistics' },
            { status: 500 }
        );
    }
}