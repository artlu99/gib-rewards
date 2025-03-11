"use server";

import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getWinners } from "~/utils/snapshots";

import { saveWinners } from "~/utils/snapshots";
export const APIRoute = createAPIFileRoute("/api/munnies")({
  GET: async ({ request, params }) => {
    try {
      const winners = await getWinners();
      return new Response(JSON.stringify(winners, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="winners-snapshot-${
            new Date().toISOString()
          }.json"`,
        },
      });
    } catch (error) {
      console.error("Error in GET route:", error);
      return json({ error: "Failed to fetch winners" }, { status: 500 });
    }
  },
  POST: async ({ request, params }) => {
    const body = await request.json();

    try {
      await saveWinners(body);
      return json({ ok: true });
    } catch (error) {
      console.error(error);
      return json({ ok: false, error }, { status: 500 });
    }
  },
});
