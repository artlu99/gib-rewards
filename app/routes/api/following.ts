"use server";

import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { z } from "zod";
import { getAllFollowing } from "~/utils/hub";

const querySchema = z.object({
  fid: z.coerce.number().positive().int(),
});

export const APIRoute = createAPIFileRoute("/api/following")({
  GET: async ({ request }): Promise<Response> => {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      const { fid } = querySchema.parse(queryParams);

      const following: number[] = await getAllFollowing(fid);

      return json({ following });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return json(
          { error: "Invalid FID parameter", details: error.format() },
          { status: 400 }
        );
      }

      return json({ error: "Failed to fetch following list" }, { status: 500 });
    }
  },
});
