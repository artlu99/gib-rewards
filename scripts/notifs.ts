import type {
  FrameNotificationDetails,
  SendNotificationRequest,
} from "@farcaster/frame-sdk";
import { sendNotificationResponseSchema } from "@farcaster/frame-sdk";
import { Redis } from "@upstash/redis/cloudflare";
import dotenv from "dotenv";
import { cluster } from "radash";
import { getUsers } from "../app/utils/neynar";

const DO_NOT_RUN = false;
const DO_NOT_SEND = true;

const env = dotenv.config().parsed;
if (!env) {
  throw new Error(
    "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set"
  );
}

const framesRedis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

function getUserNotificationDetailsKey(fid: number): string {
  return `gib-rewards:user:${fid}:notification-details`;
}

async function getAllUsersWithNotificationDetails(): Promise<number[]> {
  const keys = await framesRedis.keys(
    "gib-rewards:user:*:notification-details"
  );
  return keys.map((key) => Number.parseInt(key.split(":")[2]));
}

async function getUserNotificationDetails(
  fid: number
): Promise<FrameNotificationDetails | null> {
  return await framesRedis.get<FrameNotificationDetails>(
    getUserNotificationDetailsKey(fid)
  );
}

async function sendFrameNotification({
  fid,
  body,
  title = "SassyHash 💅 Contest",
}: {
  fid: number;
  body: string;
  title?: string;
}) {
  const userNotificationDetails = await getUserNotificationDetails(fid);
  if (!userNotificationDetails) {
    return;
  }
  const { url, token } = userNotificationDetails;

  const targetUrl = "https://gib-rewards.artlu.xyz";
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

const getNotifications = async (minUserScore = 0.8) => {
  const usersWithNotificationDetails =
    await getAllUsersWithNotificationDetails();
  const users = await getUsers(usersWithNotificationDetails);

  const res = users.users.map((user) => ({
    fid: user.fid,
    name: user.display_name,
    username: user.username,
    followerCount: user.follower_count,
    followingCount: user.following_count,
    amFollowing: user.viewer_context?.following,
    amFollowedBy: user.viewer_context?.followed_by,
    userScore: user.experimental?.neynar_user_score ?? 0,
  }));

  return res
    .sort((a, b) => b.userScore - a.userScore)
    .filter((user) => user.userScore > minUserScore);
};

const sendNotifications = async (
  fids: number[],
  topN = 15,
  totalPool = 100,
  chunkSize = 5,
  delayInMs = 1000
) => {
  for (const chunk of cluster(fids, chunkSize)) {
    await Promise.all(
      chunk.map(async (fid) => {
        await sendFrameNotification({
          fid,
          body: `Weekly Rewards has begun! $${totalPool} for the top ${topN} qualified SassyHash casts`,
        });
      })
    );
    await new Promise((resolve) => setTimeout(resolve, delayInMs));
  }
};

if (!DO_NOT_RUN) {
  const minUserScore = 0.7;

  const res = await getNotifications(minUserScore);
  console.log(res.length, "users above score", minUserScore);

  console.log(
    "sending notifications to",
    res.map((r) => `${r.username}:${r.fid} (${r.userScore}) ${r.followerCount} followers`)
  );

  if (!DO_NOT_SEND) {
    await sendNotifications(res.map((r) => r.fid));
  }
} else {
  console.log("set DO_NOT_RUN to false to send notifications");
}
