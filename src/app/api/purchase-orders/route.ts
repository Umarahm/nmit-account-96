import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchaseOrders, orderItems, contacts, products } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/purchase-orders - Get all purchase orders
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const vendorId = searchParams.get('vendorId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        let whereConditions = [];
        if (status) {
            whereConditions.push(eq(purchaseOrders.status, status));
        }
        if (vendorId) {
            whereConditions.push(eq(purchaseOrders.vendorId, parseInt(vendorId)));
        }

        const [orders, totalCount] = await Promise.all([
            db
                .select({
                    id: purchaseOrders.id,
                    poNumber: purchaseOrders.poNumber,
                    vendorId: purchaseOrders.vendorId,
                    vendorName: contacts.name,
                    orderDate: purchaseOrders.orderDate,
                    status: purchaseOrders.status,
                    totalAmount: purchaseOrders.totalAmount,
                    notes: purchaseOrders.notes,
                    createdAt: purchaseOrders.createdAt,
                    updatedAt: purchaseOrders.updatedAt,
                })
                .from(purchaseOrders)
                .leftJoin(contacts, eq(purchaseOrders.vendorId, contacts.id))
                .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
                .orderBy(desc(purchaseOrders.createdAt))
                .limit(limit)
                .offset(offset),

            db
                .select({ count: sql`count(*)` })
                .from(purchaseOrders)
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
        console.error("Error fetching purchase orders:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/purchase-orders - Create new purchase order
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { vendorId, orderDate, notes, items } = body;

        // Validation
        if (!vendorId || !orderDate || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "Vendor ID, order date, and items are required" },
                { status: 400 }
            );
        }

        // Validate vendor exists
        const vendor = await db
            .select()
            .from(contacts)
            .where(and(eq(contacts.id, vendorId), eq(contacts.type, 'VENDOR')))
            .limit(1);

        if (vendor.length === 0) {
            return NextResponse.json(
                { error: "Invalid vendor ID" },
                { status: 400 }
            );
        }

        // Generate PO number
        const poNumber = `PO-${Date.now()}`;

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

        // Create purchase order
        const [newOrder] = await db
            .insert(purchaseOrders)
            .values({
                poNumber,
                vendorId,
                orderDate: new Date(orderDate).toISOString(),
                status: 'DRAFT',
                totalAmount: totalAmount.toString(),
                notes,
            })
            .returning();

        // Create order items
        const orderItemsData = items.map(item => ({
            orderId: newOrder.id,
            orderType: 'PURCHASE',
            productId: item.productId,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            taxAmount: item.taxAmount?.toString() || '0',
            discountAmount: item.discountAmount?.toString() || '0',
            totalAmount: ((item.quantity * item.unitPrice) + (item.taxAmount || 0) - (item.discountAmount || 0)).toString(),
        }));

        await db.insert(orderItems).values(orderItemsData);

        // Fetch the complete order with vendor details
        const [completeOrder] = await db
            .select({
                id: purchaseOrders.id,
                poNumber: purchaseOrders.poNumber,
                vendorId: purchaseOrders.vendorId,
                vendorName: contacts.name,
                orderDate: purchaseOrders.orderDate,
                status: purchaseOrders.status,
                totalAmount: purchaseOrders.totalAmount,
                notes: purchaseOrders.notes,
                createdAt: purchaseOrders.createdAt,
                updatedAt: purchaseOrders.updatedAt,
            })
            .from(purchaseOrders)
            .leftJoin(contacts, eq(purchaseOrders.vendorId, contacts.id))
            .where(eq(purchaseOrders.id, newOrder.id));

        return NextResponse.json({
            message: "Purchase order created successfully",
            order: completeOrder
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating purchase order:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
