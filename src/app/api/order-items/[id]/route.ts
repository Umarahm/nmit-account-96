import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orderItems, products, purchaseOrders, salesOrders } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/order-items/[id] - Get single order item
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const itemId = parseInt(params.id);
        if (isNaN(itemId)) {
            return NextResponse.json(
                { error: "Invalid item ID" },
                { status: 400 }
            );
        }

        const [item] = await db
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
            .where(eq(orderItems.id, itemId));

        if (!item) {
            return NextResponse.json(
                { error: "Order item not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(item);

    } catch (error) {
        console.error("Error fetching order item:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT /api/order-items/[id] - Update order item
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const itemId = parseInt(params.id);
        if (isNaN(itemId)) {
            return NextResponse.json(
                { error: "Invalid item ID" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { quantity, unitPrice, taxAmount, discountAmount } = body;

        // Get existing item
        const [existingItem] = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.id, itemId));

        if (!existingItem) {
            return NextResponse.json(
                { error: "Order item not found" },
                { status: 404 }
            );
        }

        // Validate order is in DRAFT status
        const orderTable = existingItem.orderType === 'PURCHASE' ? purchaseOrders : salesOrders;
        const [order] = await db
            .select()
            .from(orderTable)
            .where(eq(orderTable.id, existingItem.orderId));

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        if (order.status !== 'DRAFT') {
            return NextResponse.json(
                { error: "Items can only be updated in DRAFT orders" },
                { status: 400 }
            );
        }

        // Calculate new total amount
        const newQuantity = quantity !== undefined ? quantity : parseFloat(existingItem.quantity);
        const newUnitPrice = unitPrice !== undefined ? unitPrice : parseFloat(existingItem.unitPrice);
        const newTaxAmount = taxAmount !== undefined ? taxAmount : parseFloat(existingItem.taxAmount || '0');
        const newDiscountAmount = discountAmount !== undefined ? discountAmount : parseFloat(existingItem.discountAmount || '0');

        const totalAmount = (newQuantity * newUnitPrice) + newTaxAmount - newDiscountAmount;

        // Update order item
        await db
            .update(orderItems)
            .set({
                quantity: newQuantity.toString(),
                unitPrice: newUnitPrice.toString(),
                taxAmount: newTaxAmount.toString(),
                discountAmount: newDiscountAmount.toString(),
                totalAmount: totalAmount.toString(),
            })
            .where(eq(orderItems.id, itemId));

        // Update order total amount
        const [allItems] = await db
            .select({ totalAmount: sql`sum(${orderItems.totalAmount})` })
            .from(orderItems)
            .where(and(
                eq(orderItems.orderId, existingItem.orderId),
                eq(orderItems.orderType, existingItem.orderType)
            ));

        const newOrderTotal = allItems.totalAmount || '0';

        await db
            .update(orderTable)
            .set({
                totalAmount: newOrderTotal,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(orderTable.id, existingItem.orderId));

        // Fetch updated item
        const [updatedItem] = await db
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
            .where(eq(orderItems.id, itemId));

        return NextResponse.json({
            message: "Order item updated successfully",
            item: updatedItem
        });

    } catch (error) {
        console.error("Error updating order item:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/order-items/[id] - Delete order item
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const itemId = parseInt(params.id);
        if (isNaN(itemId)) {
            return NextResponse.json(
                { error: "Invalid item ID" },
                { status: 400 }
            );
        }

        // Get existing item
        const [existingItem] = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.id, itemId));

        if (!existingItem) {
            return NextResponse.json(
                { error: "Order item not found" },
                { status: 404 }
            );
        }

        // Validate order is in DRAFT status
        const orderTable = existingItem.orderType === 'PURCHASE' ? purchaseOrders : salesOrders;
        const [order] = await db
            .select()
            .from(orderTable)
            .where(eq(orderTable.id, existingItem.orderId));

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        if (order.status !== 'DRAFT') {
            return NextResponse.json(
                { error: "Items can only be deleted from DRAFT orders" },
                { status: 400 }
            );
        }

        // Delete order item
        await db
            .delete(orderItems)
            .where(eq(orderItems.id, itemId));

        // Update order total amount
        const [allItems] = await db
            .select({ totalAmount: sql`sum(${orderItems.totalAmount})` })
            .from(orderItems)
            .where(and(
                eq(orderItems.orderId, existingItem.orderId),
                eq(orderItems.orderType, existingItem.orderType)
            ));

        const newOrderTotal = allItems.totalAmount || '0';

        await db
            .update(orderTable)
            .set({
                totalAmount: newOrderTotal,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(orderTable.id, existingItem.orderId));

        return NextResponse.json({
            message: "Order item deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting order item:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
