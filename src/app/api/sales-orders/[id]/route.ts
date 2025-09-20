import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salesOrders, orderItems, contacts, products } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/sales-orders/[id] - Get single sales order with items
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const orderId = parseInt(params.id);
        if (isNaN(orderId)) {
            return NextResponse.json(
                { error: "Invalid order ID" },
                { status: 400 }
            );
        }

        // Get order details
        const [order] = await db
            .select({
                id: salesOrders.id,
                soNumber: salesOrders.soNumber,
                customerId: salesOrders.customerId,
                customerName: contacts.name,
                customerEmail: contacts.email,
                customerMobile: contacts.mobile,
                customerAddress: contacts.address,
                orderDate: salesOrders.orderDate,
                status: salesOrders.status,
                totalAmount: salesOrders.totalAmount,
                notes: salesOrders.notes,
                createdAt: salesOrders.createdAt,
                updatedAt: salesOrders.updatedAt,
            })
            .from(salesOrders)
            .leftJoin(contacts, eq(salesOrders.customerId, contacts.id))
            .where(eq(salesOrders.id, orderId));

        if (!order) {
            return NextResponse.json(
                { error: "Sales order not found" },
                { status: 404 }
            );
        }

        // Get order items
        const items = await db
            .select({
                id: orderItems.id,
                productId: orderItems.productId,
                productName: products.name,
                productHsnCode: products.hsnCode,
                quantity: orderItems.quantity,
                unitPrice: orderItems.unitPrice,
                taxAmount: orderItems.taxAmount,
                discountAmount: orderItems.discountAmount,
                totalAmount: orderItems.totalAmount,
            })
            .from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(and(
                eq(orderItems.orderId, orderId),
                eq(orderItems.orderType, 'SALES')
            ));

        return NextResponse.json({
            ...order,
            items
        });

    } catch (error) {
        console.error("Error fetching sales order:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT /api/sales-orders/[id] - Update sales order
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const orderId = parseInt(params.id);
        if (isNaN(orderId)) {
            return NextResponse.json(
                { error: "Invalid order ID" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { status, notes, items } = body;

        // Check if order exists
        const [existingOrder] = await db
            .select()
            .from(salesOrders)
            .where(eq(salesOrders.id, orderId));

        if (!existingOrder) {
            return NextResponse.json(
                { error: "Sales order not found" },
                { status: 404 }
            );
        }

        // If status is being changed to CONFIRMED, validate items
        if (status === 'CONFIRMED' && items) {
            // Validate all products exist
            for (const item of items) {
                const product = await db
                    .select()
                    .from(products)
                    .where(eq(products.id, item.productId))
                    .limit(1);

                if (product.length === 0) {
                    return NextResponse.json(
                        { error: `Product with ID ${item.productId} not found` },
                        { status: 400 }
                    );
                }
            }

            // Delete existing items
            await db
                .delete(orderItems)
                .where(and(
                    eq(orderItems.orderId, orderId),
                    eq(orderItems.orderType, 'SALES')
                ));

            // Calculate new total amount
            let totalAmount = 0;
            const orderItemsData = items.map(item => {
                const itemTotal = (item.quantity * item.unitPrice) + (item.taxAmount || 0) - (item.discountAmount || 0);
                totalAmount += itemTotal;

                return {
                    orderId,
                    orderType: 'SALES',
                    productId: item.productId,
                    quantity: item.quantity.toString(),
                    unitPrice: item.unitPrice.toString(),
                    taxAmount: item.taxAmount?.toString() || '0',
                    discountAmount: item.discountAmount?.toString() || '0',
                    totalAmount: itemTotal.toString(),
                };
            });

            // Insert new items
            await db.insert(orderItems).values(orderItemsData);

            // Update order
            await db
                .update(salesOrders)
                .set({
                    status: status || existingOrder.status,
                    notes: notes !== undefined ? notes : existingOrder.notes,
                    totalAmount: totalAmount.toString(),
                    updatedAt: new Date().toISOString(),
                })
                .where(eq(salesOrders.id, orderId));
        } else {
            // Update only status and notes
            await db
                .update(salesOrders)
                .set({
                    status: status || existingOrder.status,
                    notes: notes !== undefined ? notes : existingOrder.notes,
                    updatedAt: new Date().toISOString(),
                })
                .where(eq(salesOrders.id, orderId));
        }

        // Fetch updated order
        const [updatedOrder] = await db
            .select({
                id: salesOrders.id,
                soNumber: salesOrders.soNumber,
                customerId: salesOrders.customerId,
                customerName: contacts.name,
                orderDate: salesOrders.orderDate,
                status: salesOrders.status,
                totalAmount: salesOrders.totalAmount,
                notes: salesOrders.notes,
                createdAt: salesOrders.createdAt,
                updatedAt: salesOrders.updatedAt,
            })
            .from(salesOrders)
            .leftJoin(contacts, eq(salesOrders.customerId, contacts.id))
            .where(eq(salesOrders.id, orderId));

        return NextResponse.json({
            message: "Sales order updated successfully",
            order: updatedOrder
        });

    } catch (error) {
        console.error("Error updating sales order:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/sales-orders/[id] - Delete sales order
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const orderId = parseInt(params.id);
        if (isNaN(orderId)) {
            return NextResponse.json(
                { error: "Invalid order ID" },
                { status: 400 }
            );
        }

        // Check if order exists and is in DRAFT status
        const [existingOrder] = await db
            .select()
            .from(salesOrders)
            .where(eq(salesOrders.id, orderId));

        if (!existingOrder) {
            return NextResponse.json(
                { error: "Sales order not found" },
                { status: 404 }
            );
        }

        if (existingOrder.status !== 'DRAFT') {
            return NextResponse.json(
                { error: "Only DRAFT orders can be deleted" },
                { status: 400 }
            );
        }

        // Delete order items first
        await db
            .delete(orderItems)
            .where(and(
                eq(orderItems.orderId, orderId),
                eq(orderItems.orderType, 'SALES')
            ));

        // Delete order
        await db
            .delete(salesOrders)
            .where(eq(salesOrders.id, orderId));

        return NextResponse.json({
            message: "Sales order deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting sales order:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
