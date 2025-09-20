import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, orderItems, invoices } from "@/lib/db/schema";
import { eq, and, sql, desc, like, or } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || 'all';
        const sortBy = searchParams.get('sortBy') || 'value';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        // Build where conditions
        let whereConditions = [eq(products.isActive, true)];

        if (search) {
            whereConditions.push(
                or(
                    like(products.name, `%${search}%`),
                    like(products.hsnCode, `%${search}%`)
                )
            );
        }

        if (category && category !== 'all') {
            whereConditions.push(eq(products.category, category));
        }

        // Get products with their current stock levels calculated from transactions
        const productsData = await db
            .select({
                id: products.id,
                name: products.name,
                type: products.type,
                salesPrice: products.salesPrice,
                purchasePrice: products.purchasePrice,
                taxPercentage: products.taxPercentage,
                hsnCode: products.hsnCode,
                category: products.category,
                createdAt: products.createdAt,
                updatedAt: products.updatedAt
            })
            .from(products)
            .where(and(...whereConditions))
            .orderBy(desc(products.createdAt))
            .limit(limit)
            .offset(offset);

        // Get total count of products for pagination
        const [totalCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(and(...whereConditions));

        // Calculate real stock levels for each product based on transactions
        const stockItems = await Promise.all(
            productsData.map(async (product) => {
                // Get incoming stock from purchase orders (increases stock)
                const [incomingStock] = await db
                    .select({
                        total: sql<number>`COALESCE(SUM(CAST(${orderItems.quantity} AS DECIMAL)), 0)`
                    })
                    .from(orderItems)
                    .leftJoin(invoices, and(
                        eq(orderItems.orderId, invoices.id),
                        eq(orderItems.orderType, 'INVOICE'),
                        eq(invoices.type, 'PURCHASE')
                    ))
                    .where(eq(orderItems.productId, product.id));

                // Get outgoing stock from sales orders (decreases stock)
                const [outgoingStock] = await db
                    .select({
                        total: sql<number>`COALESCE(SUM(CAST(${orderItems.quantity} AS DECIMAL)), 0)`
                    })
                    .from(orderItems)
                    .leftJoin(invoices, and(
                        eq(orderItems.orderId, invoices.id),
                        eq(orderItems.orderType, 'INVOICE'),
                        eq(invoices.type, 'SALES')
                    ))
                    .where(eq(orderItems.productId, product.id));

                const incomingQty = Number(incomingStock?.total || 0);
                const outgoingQty = Number(outgoingStock?.total || 0);
                const currentStock = incomingQty - outgoingQty;

                // Set default reorder point (30% of current stock or minimum 5)
                const reorderPoint = Math.max(5, Math.floor(currentStock * 0.3));

                const purchasePrice = product.purchasePrice ? Number(product.purchasePrice) : 1000;
                const salesPrice = product.salesPrice ? Number(product.salesPrice) : 1500;

                // Determine stock status based on real data
                let status = 'good';
                if (currentStock <= 0) {
                    status = 'out_of_stock';
                } else if (currentStock <= reorderPoint) {
                    status = 'critical';
                } else if (currentStock <= reorderPoint * 1.5) {
                    status = 'low';
                }

                return {
                    id: product.id,
                    name: product.name,
                    category: product.category || 'Uncategorized',
                    sku: `SKU-${product.id.toString().padStart(4, '0')}`,
                    currentStock: Math.max(0, currentStock), // Ensure non-negative stock
                    reorderPoint,
                    unitCost: purchasePrice,
                    sellingPrice: salesPrice,
                    totalValue: Math.max(0, currentStock) * purchasePrice,
                    lastUpdated: product.updatedAt,
                    status,
                    incomingStock: incomingQty,
                    outgoingStock: outgoingQty
                };
            })
        );

        // Sort the results
        stockItems.sort((a, b) => {
            switch (sortBy) {
                case 'value':
                    return b.totalValue - a.totalValue;
                case 'stock':
                    return b.currentStock - a.currentStock;
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });

        // The stockItems array is already paginated from the database query
        const paginatedItems = stockItems;
        const totalItems = Number(totalCount?.count || 0);

        // Calculate summary statistics for all products (not just current page)
        // For performance, we'll calculate based on current page but note this is approximate
        const totalStockValue = paginatedItems.reduce((sum, item) => sum + item.totalValue, 0);
        const lowStockItems = paginatedItems.filter(item => item.status === 'low' || item.status === 'critical' || item.status === 'out_of_stock');
        const averageStockLevel = paginatedItems.length > 0 ? paginatedItems.reduce((sum, item) => sum + item.currentStock, 0) / paginatedItems.length : 0;

        // Get unique categories from current page
        const categories = Array.from(new Set(paginatedItems.map(item => item.category)));

        return NextResponse.json({
            items: paginatedItems,
            summary: {
                totalItems,
                totalStockValue,
                lowStockItemsCount: lowStockItems.length,
                averageStockLevel: Math.round(averageStockLevel * 100) / 100,
                categories: categories
            },
            pagination: {
                page,
                limit,
                total: totalItems,
                pages: Math.ceil(totalItems / limit)
            },
            alerts: lowStockItems.slice(0, 10).map(item => ({
                id: item.id,
                name: item.name,
                currentStock: item.currentStock,
                reorderPoint: item.reorderPoint,
                status: item.status,
                totalValue: item.totalValue
            }))
        });

    } catch (error) {
        console.error("Error fetching stock report:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
