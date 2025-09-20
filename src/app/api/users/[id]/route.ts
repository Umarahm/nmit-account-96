import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PUT - Update user (Admin only)
export async function PUT(
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

        const { name, email, role, isActive } = await request.json();

        // Validation
        if (!name || !email) {
            return NextResponse.json(
                { error: "Name and email are required" },
                { status: 400 }
            );
        }

        // Validate role
        const validRoles = ['ADMIN', 'ACCOUNTANT', 'CONTACT'];
        if (role && !validRoles.includes(role)) {
            return NextResponse.json(
                { error: "Invalid role specified" },
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

        // Check if email is already taken by another user
        if (email.toLowerCase() !== existingUser[0].email) {
            const emailCheck = await db
                .select()
                .from(users)
                .where(eq(users.email, email.toLowerCase()))
                .limit(1);

            if (emailCheck.length > 0) {
                return NextResponse.json(
                    { error: "Email is already taken by another user" },
                    { status: 400 }
                );
            }
        }

        // Prevent admins from deactivating themselves
        if (userId === parseInt(session.user.id) && isActive === false) {
            return NextResponse.json(
                { error: "You cannot deactivate your own account" },
                { status: 400 }
            );
        }

        // Update user
        const updatedUser = await db
            .update(users)
            .set({
                name,
                email: email.toLowerCase(),
                role: role || existingUser[0].role,
                isActive: isActive !== undefined ? isActive : existingUser[0].isActive,
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
            message: "User updated successfully",
            user: updatedUser[0]
        });

    } catch (error) {
        console.error("User update error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE - Delete user (Admin only)
export async function DELETE(
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

        // Prevent admins from deleting themselves
        if (userId === parseInt(session.user.id)) {
            return NextResponse.json(
                { error: "You cannot delete your own account" },
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

        // For safety, instead of deleting, we'll deactivate the user
        // This preserves data integrity
        await db
            .update(users)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

        return NextResponse.json({
            message: "User deactivated successfully"
        });

    } catch (error) {
        console.error("User deletion error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}