import { Redis } from "@upstash/redis/cloudflare";
import { GraphQLClient, gql } from "graphql-request";
import { sift, sort, unique } from "radash";
import type { ZodObject, ZodRawShape } from "zod";
import { z } from "zod";

const GRAPHQL_ENDPOINT = "https://whistles.artlu.xyz/graphql";
export const BLOCKLIST = [6546];

const redis = new Redis({
  url: process.env.YOGA_REDIS_REST_URL,
  token: process.env.YOGA_REDIS_REST_READ_ONLY_TOKEN,
});

const cache = new Redis({
  url: process.env.UPSTASH_REDIS_YOGA_CACHE_REST_URL,
  token: process.env.UPSTASH_REDIS_YOGA_CACHE_REST_TOKEN,
});

const queries: Record<string, string> = {
  getTextByCastHash: gql`
    query getTextByCastHash($castHash: String!, $fid: Int!) {
      getTextByCastHash(castHash: $castHash, viewerFid: $fid) {
        isDecrypted
        timestamp
        text
        decodedText
      }
    }
  `,
};

interface TextByCastHashResponse {
  getTextByCastHash: {
    isDecrypted: boolean;
    timestamp: string;
    text: string;
    decodedText: string | null;
  } | null;
}

const TextByCastHashSchema = z.object({
  getTextByCastHash: z
    .object({
      isDecrypted: z.boolean(),
      timestamp: z.string(),
      text: z.string(),
      decodedText: z.string().nullable(),
    })
    .nullable(),
});

export interface LeaderboardCastInfo {
  fid: number;
  username: string;
  rootParentUrl: string | null;
  castHash: string;
  count: number;
  decodedText?: string | null;
  modLikes?: number[];
}

const LeaderboardCastInfoSchema = z.object({
  fid: z.number(),
  username: z.string(),
  rootParentUrl: z.string().nullable(),
  castHash: z.string(),
  count: z.number(),
  decodedText: z.string().nullable().optional(),
  modLikes: z.array(z.number()).optional(),
});

export const LeaderboardCastInfoResponseSchema = z.array(
  LeaderboardCastInfoSchema
);

const getTextByCastHash = async (castHash: string, fid: number | null) => {
  if (!fid) {
    throw new Error("Fid is required");
  }

  const cacheKey = `getTextByCastHash-${fid}-${castHash}`;
  const cached = await cache.get<string | undefined>(cacheKey);
  if (cached) {
    return cached as unknown as TextByCastHashResponse;
  }

  try {
    const res = await genericGraphQLQuery<TextByCastHashResponse>(
      "getTextByCastHash",
      TextByCastHashSchema,
      { castHash, fid },
      process.env.YOGA_WHISTLES_BEARER
    );

    await cache.set(cacheKey, JSON.stringify(res));
    await cache.expire(cacheKey, 60 * 60 * 24 * 1); // 1 day

    return res;
  } catch (error) {
    throw new Error(`Failed to get text by cast hash: ${castHash} for: ${fid}`);
  }
};

export async function getMostSeenCasts({
  viewerFid,
  limit = 10,
  cursor = null,
  excludeFids = BLOCKLIST,
}: {
  viewerFid: number | null;
  limit?: number;
  cursor?: string | null;
  excludeFids?: number[];
}): Promise<{ data: LeaderboardCastInfo[]; cursor: string | null }> {
  const usage = await redis.hgetall("action-usage");

  if (!usage) {
    return { data: [], cursor: null };
  }

  // Parse cursor if it exists
  let cursorData: { idx: number } | null = null;
  if (cursor) {
    try {
      cursorData = JSON.parse(Buffer.from(cursor, "base64").toString());
    } catch (e) {
      console.error("Invalid cursor format:", e);
    }
  }

  const allCasts = Object.entries(usage)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .map(([key, cnt]) => {
      const parts = key.split("-");
      const fid = Number(parts[0]);
      const username = parts[1];
      const castHash = parts[parts.length - 1];
      const rootParentUrl = parts.slice(2, -1).join("-");
      return {
        fid,
        username,
        rootParentUrl,
        castHash,
        count: Number(cnt),
      };
    });

  const filteredCasts = allCasts
    .filter((cast) => !excludeFids.includes(cast.fid))
    .map((cast) => {
      return {
        ...cast,
        rootParentUrl:
          cast.rootParentUrl === "null" ? null : cast.rootParentUrl,
      };
    });

  const viewersCasts = allCasts
    .filter((cast) => cast.fid === viewerFid)
    .map((stringifiedCast) => ({
      ...stringifiedCast,
      rootParentUrl:
        stringifiedCast.rootParentUrl === "null"
          ? null
          : stringifiedCast.rootParentUrl,
    }));

  const filteredCastsPlusViewersCasts = sort(
    unique(filteredCasts.concat(viewersCasts), (c) => c.castHash),
    (c) => c.count,
    true // descending === true
  ).map((c, idx) => ({ ...c, idx }));

  // Apply cursor-based pagination if cursor exists
  const paginatedCasts = cursorData
    ? filteredCastsPlusViewersCasts.filter((cast) => cast.idx > cursorData.idx)
    : filteredCastsPlusViewersCasts;

  const enhancedTopNCasts = sift(
    await Promise.all(
      paginatedCasts.slice(0, limit).map(async (cast) => {
        try {
          const res = await getTextByCastHash(cast.castHash, viewerFid);
          return {
            ...cast,
            decodedText: res?.getTextByCastHash?.decodedText ?? null,
          };
        } catch (error) {
          console.log("error:", error.message);
          return cast;
        }
      })
    )
  );

  // Generate next cursor if we have enough results
  let nextCursor: string | null = null;
  if (paginatedCasts.length >= limit) {
    const lastItem = enhancedTopNCasts[enhancedTopNCasts.length - 1];
    const cursorPayload = { idx: lastItem.idx };
    nextCursor = Buffer.from(JSON.stringify(cursorPayload)).toString("base64");
  }

  return { data: enhancedTopNCasts, cursor: nextCursor };
}

const genericGraphQLQuery = async <T>(
  queryName: string,
  schema: ZodObject<ZodRawShape>,
  variables?: Record<string, unknown>,
  bearerToken?: string
) => {
  const graphQLClient = bearerToken
    ? new GraphQLClient(GRAPHQL_ENDPOINT, {
        headers: { authorization: `Bearer ${bearerToken}` },
      })
    : new GraphQLClient(GRAPHQL_ENDPOINT);

  const query = queries[queryName];
  try {
    const res = await graphQLClient.request<T>(query, variables);

    const validated = schema.safeParse(res);
    if (!validated.success) {
      console.error("res:", res);
      throw new Error(`Failed to validate response: ${validated.error}`);
    }

    return validated.data as T;
  } catch (error: any) {
    throw new Error(
      `Failed to get ${queryName} ${
        variables ? ` on: ${JSON.stringify(variables)}` : ""
      }`
    );
  }
};
