import { withAuth } from "next-auth/middleware";

export default withAuth(
    function middleware(req) {
        // Add any additional middleware logic here if needed
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Check if user is authenticated
                if (!token) {
                    return false;
                }

                // Allow access to all authenticated users for now
                // In the future, you can add role-based access control here
                return true;
            },
        },
    }
);

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (NextAuth API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*|auth/).*)",
    ],
};
