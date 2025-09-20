import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchaseOrders, salesOrders, orderItems } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PUT /api/orders/[type]/[id]/status - Update order status
export async function PUT(
    request: NextRequest,
    { params }: { params: { type: string; id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { type, id } = params;
        const orderId = parseInt(id);

        if (isNaN(orderId)) {
            return NextResponse.json(
                { error: "Invalid order ID" },
                { status: 400 }
            );
        }

        if (!['purchase', 'sales'].includes(type)) {
            return NextResponse.json(
                { error: "Invalid order type. Must be 'purchase' or 'sales'" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { status, notes } = body;

        if (!status) {
            return NextResponse.json(
                { error: "Status is required" },
                { status: 400 }
            );
        }

        // Valid status transitions
        const validStatuses = ['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            );
        }

        const orderTable = type === 'purchase' ? purchaseOrders : salesOrders;
        const orderType = type === 'purchase' ? 'PURCHASE' : 'SALES';

        // Get existing order
        const [existingOrder] = await db
            .select()
            .from(orderTable)
            .where(eq(orderTable.id, orderId));

        if (!existingOrder) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Validate status transition
        const currentStatus = existingOrder.status;
        const validTransitions: Record<string, string[]> = {
            'DRAFT': ['CONFIRMED', 'CANCELLED'],
            'CONFIRMED': ['IN_PROGRESS', 'CANCELLED'],
            'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
            'COMPLETED': [], // No transitions from completed
            'CANCELLED': [] // No transitions from cancelled
        };

        if (!validTransitions[currentStatus]?.includes(status)) {
            return NextResponse.json(
                { error: `Cannot transition from ${currentStatus} to ${status}` },
                { status: 400 }
            );
        }

        // If confirming order, validate it has items
        if (status === 'CONFIRMED') {
            const [items] = await db
                .select({ count: sql`count(*)` })
                .from(orderItems)
                .where(and(
                    eq(orderItems.orderId, orderId),
                    eq(orderItems.orderType, orderType)
                ));

            if (items.count === 0) {
                return NextResponse.json(
                    { error: "Cannot confirm order without items" },
                    { status: 400 }
                );
            }
        }

        // Update order status
        await db
            .update(orderTable)
            .set({
                status,
                notes: notes !== undefined ? notes : existingOrder.notes,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(orderTable.id, orderId));

        // Get updated order
        const [updatedOrder] = await db
            .select()
            .from(orderTable)
            .where(eq(orderTable.id, orderId));

        return NextResponse.json({
            message: `Order status updated to ${status}`,
            order: updatedOrder
        });

    } catch (error) {
        console.error("Error updating order status:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// GET /api/orders/[type]/[id]/status - Get order status history (placeholder for future implementation)
export async function GET(
    request: NextRequest,
    { params }: { params: { type: string; id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // For now, return current status
        // In future, this could return status change history
        const { type, id } = params;
        const orderId = parseInt(id);

        if (isNaN(orderId)) {
            return NextResponse.json(
                { error: "Invalid order ID" },
                { status: 400 }
            );
        }

        if (!['purchase', 'sales'].includes(type)) {
            return NextResponse.json(
                { error: "Invalid order type. Must be 'purchase' or 'sales'" },
                { status: 400 }
            );
        }

        const orderTable = type === 'purchase' ? purchaseOrders : salesOrders;

        const [order] = await db
            .select({
                id: orderTable.id,
                status: orderTable.status,
                updatedAt: orderTable.updatedAt,
            })
            .from(orderTable)
            .where(eq(orderTable.id, orderId));

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            orderId: order.id,
            currentStatus: order.status,
            lastUpdated: order.updatedAt,
            // Future: statusHistory: []
        });

    } catch (error) {
        console.error("Error fetching order status:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
