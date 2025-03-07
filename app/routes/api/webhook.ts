import {
  type ParseWebhookEvent,
  type ParseWebhookEventResult,
  createVerifyAppKeyWithHub,
  parseWebhookEvent,
} from "@farcaster/frame-node";
import {
  type SendNotificationRequest,
  sendNotificationResponseSchema,
} from "@farcaster/frame-sdk";
import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { setResponseStatus } from "@tanstack/react-start/server";

const hubUrl = "https://nemes.farcaster.xyz:2281";

async function sendFrameNotification({
  title,
  body,
  targetUrl,
  userNotificationDetails: { url, token },
}: {
  title: string;
  body: string;
  targetUrl: string;
  userNotificationDetails: { url: string; token: string };
}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      notificationId: crypto.randomUUID(),
      title,
      body,
      targetUrl,
      tokens: [token],
    } satisfies SendNotificationRequest),
  });

  const responseJson = await response.json();

  if (response.status === 200) {
    const responseBody = sendNotificationResponseSchema.safeParse(responseJson);
    if (responseBody.success === false) {
      // Malformed response
      return { state: "error", error: responseBody.error.errors };
    }

    if (responseBody.data.result.rateLimitedTokens.length) {
      // Rate limited
      return { state: "rate_limit" };
    }

    return { state: "success" };
  }

  // Error response
  return { state: "error", error: responseJson };
}

export const APIRoute = createAPIFileRoute("/api/webhook")({
  POST: async ({ request }) => {
    const payload = await request.json();

    // verify app key with Hub
    let data: ParseWebhookEventResult;
    try {
      const verifyAppKeyWithHub = createVerifyAppKeyWithHub(hubUrl);
      data = await parseWebhookEvent(payload, verifyAppKeyWithHub);
    } catch (e: unknown) {
      const error = e as ParseWebhookEvent.ErrorType;

      switch (error.name) {
        case "VerifyJsonFarcasterSignature.InvalidDataError":
        case "VerifyJsonFarcasterSignature.InvalidEventDataError":
          // The request data is invalid
          setResponseStatus(400);
          return json({ success: false, error: error.message });
        case "VerifyJsonFarcasterSignature.InvalidAppKeyError":
          // The app key is invalid
          setResponseStatus(401);
          return json({ success: false, error: error.message });
        case "VerifyJsonFarcasterSignature.VerifyAppKeyError":
          // Internal error verifying the app key (caller may want to try again)
          setResponseStatus(500);
          return json({ success: false, error: error.message });
      }
    }

    const { fid, appFid, event } = data;

    if (event.event === "frame_added" && event.notificationDetails) {
      const { url, token } = event.notificationDetails;

      console.info(fid, appFid, event, Date.now().toString());

      await sendFrameNotification({
        title: "SassyHash 💅 Contest Frame",
        body: "Welcome to SassyHash 💅 Contest",
        targetUrl: "https://gib-rewards.artlu.xyz",
        userNotificationDetails: { url, token },
      });
    }

    setResponseStatus(200, "OK");
    return json({ success: true });
  },
});
