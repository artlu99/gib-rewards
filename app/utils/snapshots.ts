"use server";

import { createServerFn } from "@tanstack/react-start";
import { Redis } from "@upstash/redis/cloudflare";
import { z } from "zod";
import type { RulesConfig } from "~/utils/winners";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const WinnersSchema = z.array(
  z.object({
    fid: z.number(),
    username: z.string(),
    rawScore: z.number(),
    smoothScore: z.number(),
    numCasts: z.number(),
    payout: z.number(),
  })
);

export const getWinners = async () => {
  const data = await redis.get("current-winners");
  return data;
};

export const saveWinners = createServerFn({ method: "POST" })
  .validator(
    (
      input:
        | {
            winners: z.infer<typeof WinnersSchema>;
            rulesConfig: RulesConfig;
          }
        | undefined
    ) => input
  )
  .handler(async ({ data }) => {
    if (!data) throw new Error("No data provided");

    const { winners, rulesConfig } = data;
    const validated = WinnersSchema.safeParse(winners);

    if (!validated.success) {
      throw new Error("Invalid winners data");
    }

    await redis.set("current-winners", {
      winners: validated.data,
      rulesConfig,
      timestamp: Date.now(),
    });

    return { success: true };
  });
