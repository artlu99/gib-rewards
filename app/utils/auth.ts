import * as jose from "jose";

export async function verifyToken(
  token: string
): Promise<{ fid: number } | null> {
  try {
    const { payload } = await jose.jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    return payload as { fid: number };
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}

export function getStoredToken(fid: number | undefined): string | null {
  if (!fid) return null;
  return typeof window !== "undefined"
    ? localStorage.getItem(`token-${fid}`)
    : null;
}
