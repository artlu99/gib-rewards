import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { setResponseStatus } from "@tanstack/react-start/server";
import * as jose from "jose";
import { verifyMessage as verifyMessageViem } from "viem";
const verifyMessage = async ({
  fid,
  signature,
  message,
  referrerFid,
}: {
  fid: string;
  signature: string;
  message: string;
  referrerFid: string | null;
}) => {
  if (!fid || !signature || !message) {
    return false;
  }

  console.log("verifyMessage:", fid, signature, message, referrerFid);

  const isValidSignature = await verifyMessageViem({
    address: "0x0x21ca9f0f7c0b59f616b1d96325d55b62c9661d6d" as `0x${string}`, // user.custodyWalletAddress
    message,
    signature: signature as `0x${string}`,
  });

  console.log("isValidSignature:", isValidSignature);

  return true;
};

export const APIRoute = createAPIFileRoute("/api/sign-in")({
  POST: async ({ request }) => {
    const { fid, signature, message, referrerFid } = await request.json();

    if (!fid || !signature || !message || !referrerFid) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    const isValid = await verifyMessage({
      fid,
      signature,
      message,
      referrerFid,
    });

    if (!isValid) {
      return json({ error: "Invalid message" }, { status: 400 });
    }

    // Generate a session token using fid and current timestamp
    const jwtToken = await new jose.SignJWT({
      fid,
      timestamp: Date.now(),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7 days")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    setResponseStatus(200, "OK");
    return json({ success: true, token: jwtToken });
  },
});
