import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { useEffect } from "react";
import { SassyCast } from "~/components/SassyCast";
import { useFrame } from "~/components/context/FrameContext";
import { calculateSmoothScores, calculateWinners } from "~/utils/smoothScores";
import { castsQueryOptions } from "~/utils/topNcasts";
import { useBearStore } from "~/utils/zustand";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      fid: search.fid ? Number(search.fid) : undefined,
    };
  },
  loader: async ({ context }) => {
    // Pre-fetch data on the server or during navigation
    const queryClient = context.queryClient;
    const data = await queryClient.ensureQueryData(castsQueryOptions(null));

    return { data };
  },
  component: PostsLayoutComponent,
});

function PostsLayoutComponent() {
  const { data: preload } = useLoaderData({ from: "/" });
  const { fid } = Route.useSearch();

  const { contextFid, viewProfile, openUrl } = useFrame();
  const {
    rulesConfig,
    casts,
    setCasts,
    smoothScores,
    setSmoothScores,
    excludedCasts,
    setWinners,
  } = useBearStore();
  const { topN, minMods } = rulesConfig;

  const { data, isFetching, refetch } = useQuery({
    ...castsQueryOptions(contextFid),
    // if contextFid is not set, use the data preloaded
    placeholderData: contextFid ? keepPreviousData : preload,
    staleTime: 1000 * 60, // 1 minute
  });

  // Update store when query data changes
  useEffect(() => {
    if (data) {
      setCasts(data);
    }
  }, [data, setCasts]);

  // Calculate smooth scores when casts or excludedCasts change
  useEffect(() => {
    if (casts.length === 0) {
      return;
    }
    const filteredCasts = casts.filter(
      (cast) => !excludedCasts.includes(cast.castHash)
    );
    const newSmoothScores = calculateSmoothScores(filteredCasts.slice(0, topN));
    const winners = calculateWinners(newSmoothScores, rulesConfig);
    setSmoothScores(newSmoothScores);
    setWinners(winners);
  }, [casts, excludedCasts, topN, rulesConfig, setSmoothScores, setWinners]);

  return (
    <div className="p-2 flex gap-2">
      {casts.length > 0 ? (
        <ol className="list-decimal pl-6 w-full max-w-full overflow-x-hidden text-xs">
          {(casts || [])
            .filter((cast) => (fid ? cast.fid === fid : true))
            .map((cast) => {
              const castInfo = smoothScores.items.find(
                (c) => c.castHash === cast.castHash
              );
              return (
                <li
                  key={cast.castHash}
                  className="whitespace-nowrap break-words"
                >
                  <div className="block text-lg p-1 active:scale-95 transition-transform">
                    <div>
                      {castInfo?.smooth.toFixed(2) ?? "0"} points{" "}
                      <button
                        type="button"
                        className="link btn-link"
                        onClick={() => viewProfile(cast.fid, cast.username)}
                      >
                        @{cast.username}
                      </button>
                    </div>
                  </div>
                  <div className="w-full overflow-x-hidden">
                    <SassyCast cast={cast} minMods={minMods} />
                  </div>
                </li>
              );
            })}
        </ol>
      ) : isFetching ? (
        <div className="flex flex-col w-full items-center p-4">
          <span className="loading loading-ring loading-lg loading-secondary" />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-3xl">💅</span>
          </div>
          <h3 className="font-bold text-xl">No SassyHash casts yet</h3>
          <p className="text-base-content/70 max-w-md">
            There are no decoded messages to display right now. Check back later
            or explore other casts.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => refetch()}
            >
              Refresh
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => openUrl("https://warpcast.com/~/channel/p2p")}
            >
              Go to Warpcast
            </button>
          </div>
        </div>
      )}
      <hr />
    </div>
  );
}
