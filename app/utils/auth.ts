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

// useful for partial client-side checks where we do not want to expose the secret
export async function isTokenExpired(token: string): Promise<boolean> {
  try {
    // in jose, this is the correct way to decode a JWT without verifying its signature
    const { payload } = await jose.jwtVerify(
      token,
      new TextEncoder().encode("")
    );
    return (payload.exp ?? 0) > Math.floor(Date.now() / 1000);
  } catch (error) {
    return false;
  }
}

export function getStoredToken(fid: number | undefined): string | null {
  if (!fid) return null;
  return typeof window !== "undefined"
    ? localStorage.getItem(`token-${fid}`)
    : null;
}
