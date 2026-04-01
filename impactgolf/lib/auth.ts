import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface JWTPayload {
  userId: string;
  email: string;
  role: "user" | "admin";
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
}

// Convenience — reads token from request header and verifies in one step
export function requireAuth(req: NextRequest): JWTPayload | null {
  const token = getTokenFromHeader(req.headers.get("authorization"));
  if (!token) return null;
  return verifyToken(token);
}
