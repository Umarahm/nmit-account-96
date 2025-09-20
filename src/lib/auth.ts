import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    // Find user by email
                    const user = await db
                        .select()
                        .from(users)
                        .where(eq(users.email, credentials.email))
                        .limit(1);

                    if (!user[0]) {
                        return null;
                    }

                    const dbUser = user[0];

                    // Check if user is active
                    if (!dbUser.isActive) {
                        return null;
                    }

                    // Verify password
                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        dbUser.password || ""
                    );

                    if (!isPasswordValid) {
                        return null;
                    }

                    // Return user object for session
                    return {
                        id: dbUser.id.toString(),
                        email: dbUser.email,
                        name: dbUser.name,
                        role: dbUser.role,
                    };
                } catch (error) {
                    console.error("Authentication error:", error);
                    return null;
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.sub!;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/signin",
        signUp: "/signup",
    },
};
