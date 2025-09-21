import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        // Get current session
        const session = await getServerSession(authOptions);
        
        if (session) {
            console.log('Logout API - Session found for user:', session.user?.email, 'Role:', session.user?.role);
        } else {
            console.log('Logout API - No session found');
        }

        // Return success - NextAuth will handle the actual session cleanup
        return NextResponse.json(
            { 
                success: true, 
                message: "Logout successful",
                userRole: session?.user?.role || null
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Logout API error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: "Logout failed",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}