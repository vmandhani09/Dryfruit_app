import { NextResponse } from "next/server";

export function middleware(req: any) {
  const token = req.cookies.get("token")?.value;
  const adminToken = req.cookies.get("adminToken")?.value;
  const url = req.nextUrl.pathname;

  // Admin routes - check for adminToken, allow access to login page
  if (url.startsWith("/admin")) {
    // Always allow access to admin login page
    if (url === "/admin/login") {
      return NextResponse.next();
    }
    
    // For other admin routes, require adminToken
    if (!adminToken) {
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Customer protected routes
  const protectedRoutes = ["/checkout", "/account", "/orders"];

  if (protectedRoutes.some((route) => url.startsWith(route))) {
    if (!token) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("redirect", url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/checkout",
    "/account/:path*",
    "/orders/:path*",
    "/admin/:path*",
  ],
};
