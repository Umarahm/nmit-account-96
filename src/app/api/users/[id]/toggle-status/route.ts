import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH - Toggle user active status (Admin only)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Check if user is admin
        const currentUser = await db
            .select()
            .from(users)
            .where(eq(users.id, parseInt(session.user.id)))
            .limit(1);

        if (!currentUser[0] || currentUser[0].role !== 'ADMIN') {
            return NextResponse.json(
                { error: "Access denied. Admin privileges required." },
                { status: 403 }
            );
        }

        const userId = parseInt(params.id);
        if (isNaN(userId)) {
            return NextResponse.json(
                { error: "Invalid user ID" },
                { status: 400 }
            );
        }

        const { isActive } = await request.json();

        if (typeof isActive !== 'boolean') {
            return NextResponse.json(
                { error: "isActive must be a boolean value" },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!existingUser[0]) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Prevent admins from deactivating themselves
        if (userId === parseInt(session.user.id) && isActive === false) {
            return NextResponse.json(
                { error: "You cannot deactivate your own account" },
                { status: 400 }
            );
        }

        // Update user status
        const updatedUser = await db
            .update(users)
            .set({
                isActive,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
            .returning({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                isActive: users.isActive,
                updatedAt: users.updatedAt,
            });

        return NextResponse.json({
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            user: updatedUser[0]
        });

    } catch (error) {
        console.error("User status toggle error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}