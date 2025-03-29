"use server";

import type {
  AddressBalance,
  BalanceResponse,
  BulkUsersResponse,
  User as NeynarUser,
} from "@neynar/nodejs-sdk/build/api";
import { Redis } from "@upstash/redis/cloudflare";
import { fetcher } from "itty-fetcher";

const neynarApi = fetcher({ base: "https://api.neynar.com" });

const cachedFetcherGet = async <T>(url: string, experimental = false) => {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  const cache = await redis.get(`neynar:${url}`);

  if (cache) {
    return cache as T;
  }

  const res = await neynarApi.get(url, undefined, {
    headers: {
      "x-api-key": process.env.NEYNAR_API_KEY,
      "x-neynar-experimental": experimental ? "true" : "false",
    },
  });

  await redis.set(`neynar:${url}`, JSON.stringify(res), { ex: 14400 }); // 4 hours

  return res as T;
};

export const fetchUser = async (fid: number): Promise<NeynarUser> => {
  try {
    const res = await cachedFetcherGet<BulkUsersResponse>(
      `/v2/farcaster/user/bulk?fids=${fid}`
    );
    return res.users[0];
  } catch (error) {
    throw new Error("Failed to fetch Farcaster user on Neynar");
  }
};

export const getUsers = async (
  fids: number[],
  viewerFid = 6546
): Promise<BulkUsersResponse> => {
  const chunks = fids.reduce((acc, fid, index) => {
    const chunkIndex = Math.floor(index / 100);
    if (!acc[chunkIndex]) {
      acc[chunkIndex] = [];
    }
    acc[chunkIndex].push(fid);
    return acc;
  }, [] as number[][]);

  const res = await Promise.all(
    chunks.map((chunk) =>
      cachedFetcherGet<BulkUsersResponse>(
        `/v2/farcaster/user/bulk?viewer_fid=${viewerFid}&fids=${chunk.join(",")}`,
        true
      )
    )
  );

  return {users: res.flatMap((r) => r.users)};
};

export const getTokenBalances = async (
  fid: number
): Promise<AddressBalance[] | undefined> => {
  try {
    const res = await cachedFetcherGet<BalanceResponse>(
      `/v2/farcaster/user/balance?fid=${fid}&networks=base`
    );
    return res.user_balance?.address_balances;
  } catch (error) {
    throw new Error("Failed to fetch Token Balances on Neynar");
  }
};
