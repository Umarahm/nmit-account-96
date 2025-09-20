import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orderItems, products, purchaseOrders, salesOrders } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/order-items - Get order items with filtering
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');
        const orderType = searchParams.get('orderType');
        const productId = searchParams.get('productId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        let whereConditions = [];
        if (orderId) {
            whereConditions.push(eq(orderItems.orderId, parseInt(orderId)));
        }
        if (orderType) {
            whereConditions.push(eq(orderItems.orderType, orderType));
        }
        if (productId) {
            whereConditions.push(eq(orderItems.productId, parseInt(productId)));
        }

        const [items, totalCount] = await Promise.all([
            db
                .select({
                    id: orderItems.id,
                    orderId: orderItems.orderId,
                    orderType: orderItems.orderType,
                    productId: orderItems.productId,
                    productName: products.name,
                    productHsnCode: products.hsnCode,
                    quantity: orderItems.quantity,
                    unitPrice: orderItems.unitPrice,
                    taxAmount: orderItems.taxAmount,
                    discountAmount: orderItems.discountAmount,
                    totalAmount: orderItems.totalAmount,
                    createdAt: orderItems.createdAt,
                })
                .from(orderItems)
                .leftJoin(products, eq(orderItems.productId, products.id))
                .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
                .limit(limit)
                .offset(offset),

            db
                .select({ count: sql`count(*)` })
                .from(orderItems)
                .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        ]);

        return NextResponse.json({
            items,
            pagination: {
                page,
                limit,
                total: totalCount[0].count,
                pages: Math.ceil(totalCount[0].count / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching order items:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/order-items - Create new order item
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, orderType, productId, quantity, unitPrice, taxAmount, discountAmount } = body;

        // Validation
        if (!orderId || !orderType || !productId || !quantity || !unitPrice) {
            return NextResponse.json(
                { error: "Order ID, order type, product ID, quantity, and unit price are required" },
                { status: 400 }
            );
        }

        // Validate order exists and is in DRAFT status
        const orderTable = orderType === 'PURCHASE' ? purchaseOrders : salesOrders;
        const [order] = await db
            .select()
            .from(orderTable)
            .where(eq(orderTable.id, orderId));

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        if (order.status !== 'DRAFT') {
            return NextResponse.json(
                { error: "Items can only be added to DRAFT orders" },
                { status: 400 }
            );
        }

        // Validate product exists
        const [product] = await db
            .select()
            .from(products)
            .where(eq(products.id, productId));

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Calculate total amount
        const totalAmount = (quantity * unitPrice) + (taxAmount || 0) - (discountAmount || 0);

        // Create order item
        const [newItem] = await db
            .insert(orderItems)
            .values({
                orderId,
                orderType,
                productId,
                quantity: quantity.toString(),
                unitPrice: unitPrice.toString(),
                taxAmount: taxAmount?.toString() || '0',
                discountAmount: discountAmount?.toString() || '0',
                totalAmount: totalAmount.toString(),
            })
            .returning();

        // Update order total amount
        const [allItems] = await db
            .select({ totalAmount: sql`sum(${orderItems.totalAmount})` })
            .from(orderItems)
            .where(and(
                eq(orderItems.orderId, orderId),
                eq(orderItems.orderType, orderType)
            ));

        const newOrderTotal = allItems.totalAmount || '0';

        await db
            .update(orderTable)
            .set({
                totalAmount: newOrderTotal,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(orderTable.id, orderId));

        // Fetch complete item with product details
        const [completeItem] = await db
            .select({
                id: orderItems.id,
                orderId: orderItems.orderId,
                orderType: orderItems.orderType,
                productId: orderItems.productId,
                productName: products.name,
                productHsnCode: products.hsnCode,
                quantity: orderItems.quantity,
                unitPrice: orderItems.unitPrice,
                taxAmount: orderItems.taxAmount,
                discountAmount: orderItems.discountAmount,
                totalAmount: orderItems.totalAmount,
                createdAt: orderItems.createdAt,
            })
            .from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(eq(orderItems.id, newItem.id));

        return NextResponse.json({
            message: "Order item created successfully",
            item: completeItem
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating order item:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
