import { createServerFn } from "@tanstack/react-start";
import { Redis } from "@upstash/redis/cloudflare";
import { verifyToken } from "~/utils/auth";

const DEFAULT_TTL = 60 * 60 * 24 * 7; // 7 days

class RedisCache {
  private redis: Redis;
  private salt: string;

  constructor() {
    this.redis = new Redis({
      url: process.env.YOGA_REDIS_REST_URL,
      token: process.env.YOGA_REDIS_REST_TOKEN,
    });
    this.salt = process.env.ANALYTICS_SALT ?? "";
  }

  async incrementActionUsage(
    viewerFid: number,
    castHash: string,
    fid: number,
    username: string,
    rootParentUrl: string,
    ttl: number = DEFAULT_TTL
  ): Promise<void> {
    const usageKey = `${fid}-${username}-${rootParentUrl}-${castHash}`;
    const interactionsSetKey = `interactions-${castHash}`;

    const hashedViewerId = await crypto.subtle
      .digest("SHA-1", new TextEncoder().encode(`${this.salt}-${viewerFid}`))
      .then((hash) =>
        Array.from(new Uint8Array(hash))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      );

    // SADD returns 1 if the element was added, 0 if it already existed
    const wasAdded = await this.redis.sadd(interactionsSetKey, hashedViewerId);

    if (wasAdded === 1) {
      await this.redis.hincrby("action-usage", usageKey, 1);
    }

    await this.redis.expire(interactionsSetKey, ttl);
    await this.redis.expire("action-usage", ttl);
  }
}

export const logCastDecode = createServerFn({ method: "POST" })
  .validator(
    (
      input:
        | {
            hash: string;
            author: { fid: number; username: string };
            rootParentUrl: string;
            token?: string;
          }
        | undefined
    ) => input
  )
  .handler(async ({ data }) => {
    const token = data?.token;
    const auth = token ? await verifyToken(token) : null;

    if (!auth) {
      throw new Error("Unauthorized");
    }

    const { fid: viewerFid } = auth;
    const { hash, author, rootParentUrl } = data ?? {};

    if (!hash || !author || !rootParentUrl) {
      throw new Error("Invalid request");
    }

    try {
      // Anonymously log cast decoding
      const redisCache = new RedisCache();
      await redisCache.incrementActionUsage(
        viewerFid,
        hash,
        author.fid,
        author.username,
        rootParentUrl
      );
    } catch (error) {
      console.error("Error in Redis logging:", error);
    }
  });
