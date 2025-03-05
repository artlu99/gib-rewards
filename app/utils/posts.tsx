import { createServerFn } from "@tanstack/react-start";
import { getMostSeenCasts } from "./whistles";

export const fetchPost = createServerFn({ method: "GET" }).handler(
  async ({ data: postId }) => {
    console.info(`Fetching post with id ${postId}...`);
    const casts = await getMostSeenCasts({
      viewerFid: null,
      limit: 100,
    });
    return casts.find((cast) => cast.castHash === postId);
  }
);

export const fetchPosts = createServerFn({ method: "GET" }).handler(
  async () => {
    console.info("Fetching casts...");
    return await getMostSeenCasts({
      viewerFid: null,
      limit: 10,
    });
  }
);
