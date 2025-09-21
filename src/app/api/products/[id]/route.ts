import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/products/[id] - Get single product
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const productId = parseInt(params.id);
        if (isNaN(productId)) {
            return NextResponse.json(
                { error: "Invalid product ID" },
                { status: 400 }
            );
        }

        const [product] = await db
            .select()
            .from(products)
            .where(and(eq(products.id, productId), eq(products.isActive, true)))
            .limit(1);

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ product });

    } catch (error) {
        console.error("Error fetching product:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT /api/products/[id] - Update product
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const productId = parseInt(params.id);
        if (isNaN(productId)) {
            return NextResponse.json(
                { error: "Invalid product ID" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const {
            name,
            type,
            salesPrice,
            purchasePrice,
            taxPercentage,
            category
        } = body;

        // Check if product exists
        const [existingProduct] = await db
            .select()
            .from(products)
            .where(and(eq(products.id, productId), eq(products.isActive, true)))
            .limit(1);

        if (!existingProduct) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Validation
        if (name && name !== existingProduct.name) {
            // Check if another product with same name exists
            const [duplicateProduct] = await db
                .select()
                .from(products)
                .where(and(eq(products.name, name), eq(products.isActive, true)))
                .limit(1);

            if (duplicateProduct && duplicateProduct.id !== productId) {
                return NextResponse.json(
                    { error: "Product with this name already exists" },
                    { status: 400 }
                );
            }
        }

        if (type && !['GOODS', 'SERVICE'].includes(type)) {
            return NextResponse.json(
                { error: "Type must be GOODS or SERVICE" },
                { status: 400 }
            );
        }

        // Update product
        const [updatedProduct] = await db
            .update(products)
            .set({
                name: name || existingProduct.name,
                type: type || existingProduct.type,
                salesPrice: salesPrice !== undefined ? parseFloat(salesPrice) : existingProduct.salesPrice,
                purchasePrice: purchasePrice !== undefined ? parseFloat(purchasePrice) : existingProduct.purchasePrice,
                taxPercentage: taxPercentage !== undefined ? parseFloat(taxPercentage) : existingProduct.taxPercentage,
                category: category !== undefined ? category : existingProduct.category,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(products.id, productId))
            .returning();

        return NextResponse.json({
            message: "Product updated successfully",
            product: updatedProduct
        });

    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/products/[id] - Soft delete product
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const productId = parseInt(params.id);
        if (isNaN(productId)) {
            return NextResponse.json(
                { error: "Invalid product ID" },
                { status: 400 }
            );
        }

        // Check if product exists
        const [existingProduct] = await db
            .select()
            .from(products)
            .where(and(eq(products.id, productId), eq(products.isActive, true)))
            .limit(1);

        if (!existingProduct) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Soft delete product
        await db
            .update(products)
            .set({
                isActive: false,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(products.id, productId));

        return NextResponse.json({
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
