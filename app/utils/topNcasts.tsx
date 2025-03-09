import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getStoredToken, verifyToken } from "~/utils/auth";
import { getMostSeenCasts } from "~/utils/whistles";

export const fetchCasts = createServerFn({ method: "GET" })
  .validator(
    (
      d:
        | {
            limit?: number;
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
      limit: data?.limit ?? 30,
    });
  });

// Define query options for use with useQuery
export const castsQueryOptions = (contextFid: number | null) => {
  const token = contextFid ? getStoredToken(contextFid) : null;

  return queryOptions({
    queryKey: ["casts", contextFid],
    queryFn: async () => {
      return fetchCasts({
        data: {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      });
    },
  });
};
