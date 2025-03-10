import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { setResponseStatus } from "@tanstack/react-start/server";
import * as jose from "jose";
import { type ByteArray, verifyMessage as verifyMessageViem } from "viem";
import { z } from "zod";
import { fetchUser } from "~/utils/neynar";

const LOCAL_DEBUGGING = import.meta.env.DEV;

const verifyMessageSchema = z.object({
  fid: z.number(),
  signature: z.string(),
  message: z.string(),
  referrerFid: z.number().nullable().optional(),
});

const verifyMessage = async (params: z.infer<typeof verifyMessageSchema>) => {
  if (LOCAL_DEBUGGING) return true;

  const result = verifyMessageSchema.safeParse(params);
  if (!result.success) {
    console.info("DEBUGGING: Result", JSON.stringify(result, null, 2));
    return false;
  }
  const { fid, signature, message } = result.data;

  const user = await fetchUser(fid);
  try {
    const isValidSignature = await verifyMessageViem({
      address: user.custody_address as `0x${string}`,
      message,
      signature: signature as unknown as ByteArray,
    });
    return isValidSignature;
  } catch (error) {
    console.error(
      "Error verifying message:",
      (error as unknown as Error).message
    );
  }

  return false;
};

export const APIRoute = createAPIFileRoute("/api/sign-in")({
  POST: async ({ request }) => {
    const { fid, signature, message, referrerFid } = await request.json();

    if (!signature || !message) {
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
