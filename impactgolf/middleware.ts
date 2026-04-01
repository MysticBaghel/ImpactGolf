import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin routes — check role header set by route handler
  // We just pass everything through — routes do their own auth
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/scores/:path*", "/api/user/:path*", "/api/admin/:path*", "/api/draws/:path*"],
};
