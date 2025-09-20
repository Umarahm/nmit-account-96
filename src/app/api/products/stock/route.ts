import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, orderItems } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/products/stock - Get stock report
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');

        let whereConditions = [eq(products.isActive, true)];

        if (category && category !== 'ALL') {
            whereConditions.push(eq(products.category, category));
        }

        if (search) {
            whereConditions.push(
                sql`${products.name} ILIKE ${`%${search}%`}`
            );
        }

        // Get products with stock calculations
        const stockReport = await db
            .select({
                id: products.id,
                name: products.name,
                type: products.type,
                category: products.category,
                hsnCode: products.hsnCode,
                salesPrice: products.salesPrice,
                purchasePrice: products.purchasePrice,
                // Calculate stock quantities
                totalPurchased: sql<number>`COALESCE((
                    SELECT SUM(COALESCE(oi.quantity, 0))
                    FROM ${orderItems} oi
                    WHERE oi.product_id = ${products.id}
                    AND oi.order_type = 'PURCHASE_ORDER'
                ), 0)`,
                totalSold: sql<number>`COALESCE((
                    SELECT SUM(COALESCE(oi.quantity, 0))
                    FROM ${orderItems} oi
                    WHERE oi.product_id = ${products.id}
                    AND oi.order_type = 'SALES_ORDER'
                ), 0)`,
                currentStock: sql<number>`COALESCE((
                    SELECT SUM(COALESCE(oi.quantity, 0))
                    FROM ${orderItems} oi
                    WHERE oi.product_id = ${products.id}
                    AND oi.order_type = 'PURCHASE_ORDER'
                ), 0) - COALESCE((
                    SELECT SUM(COALESCE(oi.quantity, 0))
                    FROM ${orderItems} oi
                    WHERE oi.product_id = ${products.id}
                    AND oi.order_type = 'SALES_ORDER'
                ), 0)`,
                // Calculate stock value
                stockValue: sql<number>`(
                    COALESCE((
                        SELECT SUM(COALESCE(oi.quantity, 0))
                        FROM ${orderItems} oi
                        WHERE oi.product_id = ${products.id}
                        AND oi.order_type = 'PURCHASE_ORDER'
                    ), 0) - COALESCE((
                        SELECT SUM(COALESCE(oi.quantity, 0))
                        FROM ${orderItems} oi
                        WHERE oi.product_id = ${products.id}
                        AND oi.order_type = 'SALES_ORDER'
                    ), 0)
                ) * COALESCE(${products.purchasePrice}, 0)`
            })
            .from(products)
            .where(and(...whereConditions))
            .orderBy(desc(products.name));

        // Calculate summary statistics
        const summary = await db
            .select({
                totalProducts: sql<number>`count(*)`,
                totalStockValue: sql<number>`SUM((
                    COALESCE((
                        SELECT SUM(COALESCE(oi.quantity, 0))
                        FROM ${orderItems} oi
                        WHERE oi.product_id = ${products.id}
                        AND oi.order_type = 'PURCHASE_ORDER'
                    ), 0) - COALESCE((
                        SELECT SUM(COALESCE(oi.quantity, 0))
                        FROM ${orderItems} oi
                        WHERE oi.product_id = ${products.id}
                        AND oi.order_type = 'SALES_ORDER'
                    ), 0)
                ) * COALESCE(${products.purchasePrice}, 0))`,
                lowStockItems: sql<number>`COUNT(CASE WHEN (
                    COALESCE((
                        SELECT SUM(COALESCE(oi.quantity, 0))
                        FROM ${orderItems} oi
                        WHERE oi.product_id = ${products.id}
                        AND oi.order_type = 'PURCHASE_ORDER'
                    ), 0) - COALESCE((
                        SELECT SUM(COALESCE(oi.quantity, 0))
                        FROM ${orderItems} oi
                        WHERE oi.product_id = ${products.id}
                        AND oi.order_type = 'SALES_ORDER'
                    ), 0)
                ) <= 5 THEN 1 END)`
            })
            .from(products)
            .where(and(...whereConditions));

        return NextResponse.json({
            stockReport,
            summary: summary[0]
        });

    } catch (error) {
        console.error("Error fetching stock report:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
