import { createServerFn } from "@tanstack/react-start";
import { defaultRulesConfig } from "~/routes/winner";
import { verifyToken } from "./auth";
import { getMostSeenCasts } from "./whistles";

export const fetchCasts = createServerFn({ method: "GET" })
  .validator((d: { headers?: { Authorization?: string } } | undefined) => d)
  .handler(async ({ data }) => {
    const authHeader = data?.headers?.Authorization;
    const token = authHeader?.replace("Bearer ", "");
    const auth = token ? await verifyToken(token) : null;

    return await getMostSeenCasts({
      viewerFid: auth?.fid ?? null,
      limit: defaultRulesConfig.topN * 2,
    });
  });
