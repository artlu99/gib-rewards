import { Redis } from "@upstash/redis/cloudflare";
import { fetcher } from "itty-fetcher";
import { unique } from "radash";
import { z } from "zod";

const pinataHubApi = fetcher({ base: "https://hub.pinata.cloud/v1" });

const FARCASTER_EPOCH = 1609459200;

const hubTimestampToBrowserTimestamp = (timestamp: number) => {
  return (timestamp + FARCASTER_EPOCH) * 1000;
};

const CastActivyResponseSchema = z.object({
  messages: z.array(
    z.object({
      hash: z.string(),
      hashScheme: z.string(),
      signature: z.string(),
      signatureScheme: z.string(),
      signer: z.string(),
      data: z.object({
        type: z.string(),
        fid: z.number(),
        timestamp: z.number(),
        network: z.string(),
      }),
    })
  ),
  nextPageToken: z.string().optional(),
});

const ReactionResponseSchema = z.object({
  messages: z.array(
    z.object({
      hash: z.string(),
      hashScheme: z.string(),
      signature: z.string(),
      signatureScheme: z.string(),
      signer: z.string(),
      data: z.object({
        type: z.string(),
        fid: z.number(),
        timestamp: z.number(),
        network: z.string(),
      }),
    })
  ),
  nextPageToken: z.string().optional(),
});

const LinkResponseSchema = z.object({
  messages: z.array(
    z.object({
      hash: z.string(),
      hashScheme: z.string(),
      signature: z.string(),
      signatureScheme: z.string(),
      signer: z.string(),
      data: z.object({
        type: z.string(),
        fid: z.number(),
        timestamp: z.number(),
        network: z.string(),
        linkBody: z.object({
          type: z.string(),
          targetFid: z.number(),
        }),
      }),
    })
  ),
  nextPageToken: z.string().optional(),
});

const GetUserDataByFidHubResponseSchema = z.object({
  data: z.object({
    type: z.literal("MESSAGE_TYPE_USER_DATA_ADD"),
    fid: z.number(),
    timestamp: z.number(),
    network: z.literal("FARCASTER_NETWORK_MAINNET"),
    userDataBody: z.object({
      type: z.literal("USER_DATA_TYPE_PFP"),
      value: z.string(),
    }),
  }),
  hash: z.string(),
  hashScheme: z.literal("HASH_SCHEME_BLAKE3"),
  signature: z.string(),
  signatureScheme: z.literal("SIGNATURE_SCHEME_ED25519"),
  signer: z.string(),
});

export const getRecentActivity = async (fid: number) => {
  // Get latest cast
  let latestCastOrReply = null;
  try {
    const castResponse = await pinataHubApi.get(
      `/castsByFid?fid=${fid}&reverse=true&pageSize=1`
    );
    const parsedData = CastActivyResponseSchema.parse(castResponse);

    latestCastOrReply = parsedData.messages[0]?.data.timestamp
      ? hubTimestampToBrowserTimestamp(
          parsedData.messages[0]?.data.timestamp
        ).toString()
      : null;
  } catch (error) {
    console.error("Error fetching latest cast:", error);
  }

  // Get latest likes
  let latestLike = null;
  try {
    const likesResponse = await pinataHubApi.get(
      `/reactionsByFid?fid=${fid}&reaction_type=REACTION_TYPE_LIKE&pageSize=1&reverse=true`
    );
    const parsedLikesData = ReactionResponseSchema.parse(likesResponse);

    latestLike = parsedLikesData.messages[0]?.data.timestamp
      ? hubTimestampToBrowserTimestamp(
          parsedLikesData.messages[0]?.data.timestamp
        ).toString()
      : null;
  } catch (error) {
    console.error("Error fetching latest likes:", error);
  }

  // Get latest recasts
  let latestRecast = null;
  try {
    const recastsResponse = await pinataHubApi.get(
      `/reactionsByFid?fid=${fid}&reaction_type=REACTION_TYPE_RECAST&pageSize=1&reverse=true`
    );
    const parsedRecastsData = ReactionResponseSchema.parse(recastsResponse);

    latestRecast = parsedRecastsData.messages[0]?.data.timestamp
      ? hubTimestampToBrowserTimestamp(
          parsedRecastsData.messages[0]?.data.timestamp
        ).toString()
      : null;
  } catch (error) {
    console.error("Error fetching latest recasts:", error);
  }

  // Get latest follow/unfollow
  let latestFollowUnfollow = null;
  try {
    const followUnfollowResponse = await pinataHubApi.get(
      `/linksByFid?fid=${fid}&pageSize=1&reverse=true`
    );
    const parsedFollowUnfollowData = LinkResponseSchema.parse(
      followUnfollowResponse
    );

    latestFollowUnfollow = parsedFollowUnfollowData.messages[0]?.data.timestamp
      ? hubTimestampToBrowserTimestamp(
          parsedFollowUnfollowData.messages[0]?.data.timestamp
        ).toString()
      : null;
  } catch (error) {
    console.error("Error fetching latest follow/unfollow:", error);
  }

  return { latestCastOrReply, latestLike, latestRecast, latestFollowUnfollow };
};

export const getPfpUrl = async (fid: number): Promise<string | undefined> => {
  try {
    const res = await pinataHubApi.get(
      `/userDataByFid?fid=${fid}&user_data_type=USER_DATA_TYPE_PFP`
    );
    const parsedUserDataByFid = GetUserDataByFidHubResponseSchema.parse(res);
    return parsedUserDataByFid.data.userDataBody.value;
  } catch (error) {
    console.error("Error fetching PFP URL:", error);
    return undefined;
  }
};

const getAllFollowingMax10kUncached = async (fid: number) => {
  try {
    let allFollowing: number[] = [];
    let nextPageToken: string | undefined;
    const pageSize = 100;
    const maxIterations = 100;

    for (let i = 0; i < maxIterations; i++) {
      const endpoint = `/linksByFid?fid=${fid}&pageSize=${pageSize}&reverse=true${
        nextPageToken ? `&pageToken=${nextPageToken}` : ""
      }`;

      const res = await pinataHubApi.get(endpoint);
      const parsedLinksData = LinkResponseSchema.parse(res);

      // If we got an empty array of messages, we're done
      if (parsedLinksData.messages.length === 0) break;

      const newFollowing = parsedLinksData.messages.map(
        (message) => message.data.linkBody.targetFid
      );
      allFollowing = [...allFollowing, ...newFollowing];

      // Get the new nextPageToken from the response
      nextPageToken = parsedLinksData.nextPageToken;

      // If there's no nextPageToken, we've reached the end
      if (!nextPageToken) break;
    }

    return unique(allFollowing);
  } catch (error) {
    console.error("Error fetching all following:", error);
    return [];
  }
};

export const getAllFollowing = async (fid: number) => {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  const cache = await redis.get(`pinataHub:getAllFollowing:${fid}`);

  if (cache) {
    return cache as number[];
  }

  const res = await getAllFollowingMax10kUncached(fid);
  await redis.set(`pinataHub:getAllFollowing:${fid}`, JSON.stringify(res), {
    ex: 14400,
  }); // 4 hours

  return res;
};
