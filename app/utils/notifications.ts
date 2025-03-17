import type { FrameNotificationDetails } from "@farcaster/frame-core";
import { Redis } from "@upstash/redis/cloudflare";

const framesRedis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export function getUserNotificationDetailsKey(fid: number): string {
  return `gib-rewards:user:${fid}:notification-details`;
}

export async function getUserNotificationDetails(
  fid: number
): Promise<FrameNotificationDetails | null> {
  return await framesRedis.get<FrameNotificationDetails>(
    getUserNotificationDetailsKey(fid)
  );
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: FrameNotificationDetails
): Promise<void> {
  await framesRedis.set(
    getUserNotificationDetailsKey(fid),
    notificationDetails
  );
}

export async function deleteUserNotificationDetails(
  fid: number
): Promise<void> {
  await framesRedis.del(getUserNotificationDetailsKey(fid));
}
