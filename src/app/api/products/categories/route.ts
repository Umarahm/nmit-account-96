import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/products/categories - Get all product categories
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const categories = await db
            .select({
                category: products.category,
                count: sql<number>`count(*)`
            })
            .from(products)
            .where(eq(products.isActive, true))
            .groupBy(products.category)
            .orderBy(products.category);

        return NextResponse.json({
            categories: categories.map(cat => ({
                name: cat.category,
                count: cat.count
            }))
        });

    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
