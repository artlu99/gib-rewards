import { createServerFn } from "@tanstack/react-start";
import { verifyToken } from "./auth";
import { getMostSeenCasts } from "./whistles";

export const fetchCast = createServerFn({ method: "GET" })
  .validator(
    (d: {
      castHash: string;
      headers?: { Authorization?: string } | undefined;
    }) => d
  )
  .handler(async ({ data }) => {
    const { castHash, headers } = data;

    const authHeader = headers?.Authorization;
    const token = authHeader?.replace("Bearer ", "");
    const auth = token ? await verifyToken(token) : null;

    const casts = await getMostSeenCasts({
      viewerFid: auth?.fid ?? null,
      limit: 100,
    });
    return casts.find((cast) => cast.castHash === castHash);
  });

export const fetchCasts = createServerFn({ method: "GET" })
  .validator((d: { headers?: { Authorization?: string } } | undefined) => d)
  .handler(async ({ data }) => {
    const authHeader = data?.headers?.Authorization;
    const token = authHeader?.replace("Bearer ", "");
    const auth = token ? await verifyToken(token) : null;

    return await getMostSeenCasts({
      viewerFid: auth?.fid ?? null,
      limit: 10,
    });
  });
