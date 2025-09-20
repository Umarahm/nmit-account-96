import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salesOrders, orderItems, contacts, products } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/sales-orders - Get all sales orders
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const customerId = searchParams.get('customerId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        let whereConditions = [];
        if (status) {
            whereConditions.push(eq(salesOrders.status, status));
        }
        if (customerId) {
            whereConditions.push(eq(salesOrders.customerId, parseInt(customerId)));
        }

        const [orders, totalCount] = await Promise.all([
            db
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
                .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
                .orderBy(desc(salesOrders.createdAt))
                .limit(limit)
                .offset(offset),

            db
                .select({ count: sql`count(*)` })
                .from(salesOrders)
                .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        ]);

        return NextResponse.json({
            orders,
            pagination: {
                page,
                limit,
                total: totalCount[0].count,
                pages: Math.ceil(totalCount[0].count / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching sales orders:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/sales-orders - Create new sales order
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { customerId, orderDate, notes, items } = body;

        // Validation
        if (!customerId || !orderDate || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "Customer ID, order date, and items are required" },
                { status: 400 }
            );
        }

        // Validate customer exists
        const customer = await db
            .select()
            .from(contacts)
            .where(and(eq(contacts.id, customerId), eq(contacts.type, 'CUSTOMER')))
            .limit(1);

        if (customer.length === 0) {
            return NextResponse.json(
                { error: "Invalid customer ID" },
                { status: 400 }
            );
        }

        // Generate SO number
        const soNumber = `SO-${Date.now()}`;

        // Calculate total amount
        let totalAmount = 0;
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

            const itemTotal = (item.quantity * item.unitPrice) + (item.taxAmount || 0) - (item.discountAmount || 0);
            totalAmount += itemTotal;
        }

        // Create sales order
        const [newOrder] = await db
            .insert(salesOrders)
            .values({
                soNumber,
                customerId,
                orderDate: new Date(orderDate).toISOString(),
                status: 'DRAFT',
                totalAmount: totalAmount.toString(),
                notes,
            })
            .returning();

        // Create order items
        const orderItemsData = items.map(item => ({
            orderId: newOrder.id,
            orderType: 'SALES',
            productId: item.productId,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            taxAmount: item.taxAmount?.toString() || '0',
            discountAmount: item.discountAmount?.toString() || '0',
            totalAmount: ((item.quantity * item.unitPrice) + (item.taxAmount || 0) - (item.discountAmount || 0)).toString(),
        }));

        await db.insert(orderItems).values(orderItemsData);

        // Fetch the complete order with customer details
        const [completeOrder] = await db
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
            .where(eq(salesOrders.id, newOrder.id));

        return NextResponse.json({
            message: "Sales order created successfully",
            order: completeOrder
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating sales order:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
