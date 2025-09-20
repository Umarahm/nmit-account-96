import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/products - Get all products with filtering and pagination
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // GOODS, SERVICE
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        let whereConditions = [eq(products.isActive, true)];

        if (type && type !== 'ALL') {
            whereConditions.push(eq(products.type, type));
        }

        if (category && category !== 'ALL') {
            whereConditions.push(eq(products.category, category));
        }

        if (search) {
            whereConditions.push(
                or(
                    like(products.name, `%${search}%`),
                    like(products.hsnCode, `%${search}%`),
                    like(products.category, `%${search}%`)
                )
            );
        }

        const [productsList, totalCount] = await Promise.all([
            db
                .select({
                    id: products.id,
                    name: products.name,
                    type: products.type,
                    salesPrice: products.salesPrice,
                    purchasePrice: products.purchasePrice,
                    taxPercentage: products.taxPercentage,
                    hsnCode: products.hsnCode,
                    category: products.category,
                    isActive: products.isActive,
                    createdAt: products.createdAt,
                    updatedAt: products.updatedAt,
                })
                .from(products)
                .where(and(...whereConditions))
                .orderBy(desc(products.createdAt))
                .limit(limit)
                .offset(offset),

            db
                .select({ count: sql`count(*)` })
                .from(products)
                .where(and(...whereConditions))
        ]);

        return NextResponse.json({
            products: productsList,
            pagination: {
                page,
                limit,
                total: totalCount[0].count,
                pages: Math.ceil(totalCount[0].count / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            name,
            type = 'GOODS',
            salesPrice,
            purchasePrice,
            taxPercentage,
            hsnCode,
            category
        } = body;

        // Validation
        if (!name) {
            return NextResponse.json(
                { error: "Product name is required" },
                { status: 400 }
            );
        }

        if (!['GOODS', 'SERVICE'].includes(type)) {
            return NextResponse.json(
                { error: "Type must be GOODS or SERVICE" },
                { status: 400 }
            );
        }

        // Check if product with same name already exists
        const existingProduct = await db
            .select()
            .from(products)
            .where(and(eq(products.name, name), eq(products.isActive, true)))
            .limit(1);

        if (existingProduct.length > 0) {
            return NextResponse.json(
                { error: "Product with this name already exists" },
                { status: 400 }
            );
        }

        // Create product
        const [newProduct] = await db
            .insert(products)
            .values({
                name,
                type,
                salesPrice: salesPrice ? parseFloat(salesPrice) : null,
                purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
                taxPercentage: taxPercentage ? parseFloat(taxPercentage) : null,
                hsnCode,
                category,
                isActive: true,
            })
            .returning();

        return NextResponse.json({
            message: "Product created successfully",
            product: newProduct
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
