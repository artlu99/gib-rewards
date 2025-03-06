import { Redis } from "@upstash/redis/cloudflare";
import { GraphQLClient, gql } from "graphql-request";
import { sift, sort, unique } from "radash";
import type { ZodObject, ZodRawShape } from "zod";
import { z } from "zod";

const GRAPHQL_ENDPOINT = "https://whistles.artlu.xyz/graphql";

const redis = new Redis({
  url: process.env.YOGA_REDIS_REST_URL,
  token: process.env.YOGA_REDIS_REST_READ_ONLY_TOKEN,
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
  };
}

const TextByCastHashSchema = z.object({
  getTextByCastHash: z.object({
    isDecrypted: z.boolean(),
    timestamp: z.string(),
    text: z.string(),
    decodedText: z.string().nullable(),
  }),
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

  try {
    const res = await genericGraphQLQuery<TextByCastHashResponse>(
      "getTextByCastHash",
      TextByCastHashSchema,
      { castHash, fid },
      process.env.YOGA_WHISTLES_BEARER
    );
    return res;
  } catch (error) {
    throw new Error(`Failed to get text by cast hash: ${castHash} for: ${fid}`);
  }
};

export async function getMostSeenCasts({
  viewerFid,
  limit = 10,
  excludeFids = [6546],
}: {
  viewerFid: number | null;
  limit?: number;
  excludeFids?: number[];
}): Promise<LeaderboardCastInfo[]> {
  console.log("url:", process.env.YOGA_REDIS_REST_URL);
  console.log("token:", process.env.YOGA_REDIS_REST_READ_ONLY_TOKEN);

  const usage = await redis.hgetall("action-usage");

  if (!usage) {
    return [];
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

  // Keep track of how many times we've seen each fid
  const fidCounts: { [key: string]: number } = {};
  const filteredCasts = allCasts
    .filter((cast) => {
      fidCounts[cast.fid] = (fidCounts[cast.fid] || 0) + 1;
      return fidCounts[cast.fid] <= 3;
    })
    .filter((cast) => !excludeFids.includes(cast.fid));

  const topNCasts = filteredCasts
    .map((cast) => {
      return {
        ...cast,
        rootParentUrl:
          cast.rootParentUrl === "null" ? null : cast.rootParentUrl,
      };
    })
    .slice(0, limit);

  const viewersCasts = allCasts
    .filter((cast) => cast.fid === viewerFid)
    .map((stringifiedCast) => ({
      ...stringifiedCast,
      rootParentUrl:
        stringifiedCast.rootParentUrl === "null"
          ? null
          : stringifiedCast.rootParentUrl,
    }));

  const topNCastsPlusViewersCasts = sort(
    unique(topNCasts.concat(viewersCasts), (c) => c.castHash),
    (c) => c.count,
    true // descending === true
  );

  const enhancedTopNCasts = sift(
    await Promise.all(
      topNCastsPlusViewersCasts.map(async (cast) => {
        try {
          const res = await getTextByCastHash(cast.castHash, viewerFid);
          return {
            ...cast,
            decodedText: res?.getTextByCastHash.decodedText,
          };
        } catch (error) {
          return cast;
        }
      })
    )
  );
  return enhancedTopNCasts;
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
      throw new Error(`Failed to validate response: ${validated.error}`);
    }

    return validated.data as T;
  } catch (error: any) {
    console.error("Error response:", error.response || error);
    throw new Error(
      `Failed to get ${queryName} ${
        variables ? ` on: ${JSON.stringify(variables)}` : ""
      }`
    );
  }
};
