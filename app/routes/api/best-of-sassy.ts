"use server";

import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getBestOfSassy, saveBestOfSassy } from "~/utils/snapshots";

export const APIRoute = createAPIFileRoute("/api/best-of-sassy")({
  GET: async ({ request, params }) => {
    try {
      const bestOfSassy = await getBestOfSassy();
      return new Response(JSON.stringify(bestOfSassy, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="best-of-sassy-snapshot-${new Date().toISOString()}.json"`,
        },
      });
    } catch (error) {
      console.error("Error in GET route:", error);
      return json({ error: "Failed to fetch best of sassy" }, { status: 500 });
    }
  },
  POST: async ({ request, params }) => {
    const body = await request.json();

    try {
      await saveBestOfSassy(body);
      return json({ ok: true });
    } catch (error) {
      console.error(error);
      return json({ ok: false, error }, { status: 500 });
    }
  },
});
