import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentMethods, chartOfAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/payment-methods - Get all payment methods
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const paymentMethodList = await db
            .select({
                id: paymentMethods.id,
                name: paymentMethods.name,
                type: paymentMethods.type,
                accountId: paymentMethods.accountId,
                accountName: chartOfAccounts.name,
                description: paymentMethods.description,
                isActive: paymentMethods.isActive,
                createdAt: paymentMethods.createdAt,
                updatedAt: paymentMethods.updatedAt,
            })
            .from(paymentMethods)
            .leftJoin(chartOfAccounts, eq(paymentMethods.accountId, chartOfAccounts.id))
            .orderBy(paymentMethods.name);

        return NextResponse.json({
            paymentMethods: paymentMethodList
        });

    } catch (error) {
        console.error("Error fetching payment methods:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/payment-methods - Create a new payment method
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, type, accountId, description } = body;

        // Validate required fields
        if (!name || !type) {
            return NextResponse.json(
                { error: "Name and type are required" },
                { status: 400 }
            );
        }

        // Validate type
        if (!['CASH', 'BANK', 'CARD', 'DIGITAL'].includes(type)) {
            return NextResponse.json(
                { error: "Invalid payment method type" },
                { status: 400 }
            );
        }

        // Check if account exists if provided
        if (accountId) {
            const [account] = await db
                .select()
                .from(chartOfAccounts)
                .where(eq(chartOfAccounts.id, parseInt(accountId)));

            if (!account) {
                return NextResponse.json(
                    { error: "Chart of account not found" },
                    { status: 404 }
                );
            }
        }

        // Create payment method
        const [newPaymentMethod] = await db
            .insert(paymentMethods)
            .values({
                name,
                type,
                accountId: accountId ? parseInt(accountId) : null,
                description,
            })
            .returning();

        return NextResponse.json({
            message: "Payment method created successfully",
            paymentMethod: newPaymentMethod
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating payment method:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
