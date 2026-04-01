import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "no token" });
  
  const payload = verifyToken(token);
  return NextResponse.json({ 
    token: token.substring(0, 20) + "...",
    payload,
    secret: process.env.JWT_SECRET?.substring(0, 10) + "...",
  });
}
