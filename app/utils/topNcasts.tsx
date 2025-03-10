import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getStoredToken, verifyToken } from "~/utils/auth";
import { getMostSeenCasts } from "~/utils/whistles";

export const fetchCasts = createServerFn({ method: "GET" })
  .validator(
    (
      d:
        | {
            limit?: number;
            cursor?: string;
            headers?: { Authorization?: string };
          }
        | undefined
    ) => d
  )
  .handler(async ({ data }) => {
    const authHeader = data?.headers?.Authorization;
    const token = authHeader?.replace("Bearer ", "");
    const auth = token ? await verifyToken(token) : null;

    return await getMostSeenCasts({
      viewerFid: auth?.fid ?? null,
      limit: data?.limit ?? undefined,
      cursor: data?.cursor ?? undefined,
    });
  });

// Define query options for use with useQuery
export const castsQueryOptions = (
  contextFid: number | null,
  limit?: number,
  cursor?: string
) => {
  const token = contextFid ? getStoredToken(contextFid) : null;

  return queryOptions({
    queryKey: ["casts", contextFid, limit, cursor],
    queryFn: async () => {
      return fetchCasts({
        data: {
          limit,
          cursor,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      });
    },
  });
};

export const castsInfiniteQueryOptions = (contextFid: number | null) => {
  const token = contextFid ? getStoredToken(contextFid) : null;

  return infiniteQueryOptions({
    queryKey: ["casts", "infinite", contextFid],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      return fetchCasts({
        data: {
          limit: 30,
          cursor: pageParam ?? undefined,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      });
    },
    getNextPageParam: (lastPage) => lastPage.cursor || undefined,
    getPreviousPageParam: (firstPage) => firstPage.cursor || undefined,
  });
};
