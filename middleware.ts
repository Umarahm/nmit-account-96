import { withAuth } from "next-auth/middleware";

export default withAuth(
    function middleware(req) {
        // Add any additional middleware logic here if needed
        console.log('Middleware - Processing request for:', req.nextUrl.pathname);
        console.log('Middleware - User token exists:', !!req.nextauth.token);
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Check if user is authenticated
                if (!token) {
                    console.log('Middleware - No token found for:', req.nextUrl.pathname);
                    return false;
                }

                console.log('Middleware - Token found for user role:', token.role);
                
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
