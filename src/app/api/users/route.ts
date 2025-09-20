import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";

// GET - Fetch all users (Admin only)
export async function GET(request: NextRequest) {
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

        // Fetch all users except passwords
        const allUsers = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                isActive: users.isActive,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
                lastLoginAt: users.lastLoginAt,
                emailVerifiedAt: users.emailVerifiedAt,
            })
            .from(users)
            .orderBy(users.createdAt);

        return NextResponse.json({
            users: allUsers
        });

    } catch (error) {
        console.error("Users fetch error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Create new user (Admin only)
export async function POST(request: NextRequest) {
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

        const { name, email, password, role } = await request.json();

        // Validation
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Name, email, and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters long" },
                { status: 400 }
            );
        }

        // Validate role - default to CONTACT as per requirement
        const validRoles = ['ADMIN', 'ACCOUNTANT', 'CONTACT'];
        const userRole = validRoles.includes(role) ? role : 'CONTACT';

        // Check if user already exists
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase()))
            .limit(1);

        if (existingUser.length > 0) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const newUser = await db
            .insert(users)
            .values({
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                role: userRole,
                isActive: true,
            })
            .returning({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                isActive: users.isActive,
                createdAt: users.createdAt,
            });

        return NextResponse.json(
            {
                message: "User created successfully",
                user: newUser[0]
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("User creation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}