/**
 * middleware.js
 * Lightweight middleware that checks for NextAuth session cookie
 * without importing MongoDB (Edge Runtime compatible).
 */

import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/event-types") ||
    pathname.startsWith("/availability") ||
    pathname.startsWith("/settings");

  if (!isProtected) return NextResponse.next();

  // Check for NextAuth session cookie (works on Edge Runtime)
  const sessionToken =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token") ||
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token");

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/event-types/:path*",
    "/availability/:path*",
    "/settings/:path*",
  ],
};