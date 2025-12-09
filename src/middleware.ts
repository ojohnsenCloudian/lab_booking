import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth();
  
  // Allow access to initial setup if no admin exists
  if (request.nextUrl.pathname === "/initial-setup") {
    return NextResponse.next();
  }
  
  // Allow access to login page
  if (request.nextUrl.pathname === "/login") {
    return NextResponse.next();
  }
  
  // Allow access to API auth routes
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }
  
  // Require authentication for all other routes
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|sw.js|manifest.json).*)",
  ],
};
