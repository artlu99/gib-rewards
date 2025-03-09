import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { useEffect } from "react";
import { SassyCast } from "~/components/SassyCast";
import { useFrame } from "~/components/context/FrameContext";
import { useSignIn } from "~/hooks/use-sign-in";
import { getStoredToken } from "~/utils/auth";
import { calculateSmoothScores, calculateWinners } from "~/utils/smoothScores";
import { castsQueryOptions } from "~/utils/topNcasts";
import type { LeaderboardCastInfo } from "~/utils/whistles";
import { useBearStore } from "~/utils/zustand";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    // Pre-fetch data on the server or during navigation
    const queryClient = context.queryClient;

    // Prefetch the query so it's available immediately on client
    await queryClient.ensureQueryData(castsQueryOptions(null));

    return {};
  },
  component: PostsLayoutComponent,
});

function PostsLayoutComponent() {
  useLoaderData({ from: "/" });
  const { contextFid, viewProfile } = useFrame();
  const { signIn } = useSignIn();
  const {
    rulesConfig,
    setCasts,
    smoothScores,
    setSmoothScores,
    excludedCasts,
    setWinners,
  } = useBearStore();
  const { topN, minMods } = rulesConfig;

  // Get access to queryClient to retrieve data
  const queryClient = useQueryClient();

  // Use React Query instead of useEffect+fetch
  const { data: castsData, isPlaceholderData } = useQuery({
    ...castsQueryOptions(contextFid),
    refetchOnWindowFocus: true,
    // Properly handle transitions between different contextFid values
    // If previous query with same contextFid had data, use that
    placeholderData: (previousData) =>
      previousData
        ? previousData
        : queryClient.getQueryData<LeaderboardCastInfo[]>(["casts", null]),
    // This makes the component use the last successful data when switching between queries
    // staleTime: 1000,
  });

  useEffect(() => {
    const token = getStoredToken(contextFid ?? undefined);
    if (!token) {
      signIn();
    }
  }, [signIn, contextFid]);

  // Update store when query data changes
  useEffect(() => {
    if (castsData && !isPlaceholderData) {
      setCasts(castsData);
    }
  }, [castsData, setCasts, isPlaceholderData]);

  // Calculate smooth scores when casts or excludedCasts change
  useEffect(() => {
    if (!castsData || isPlaceholderData) {
      return;
    }
    const filteredCasts = castsData.filter(
      (cast) => !excludedCasts.includes(cast.castHash)
    );
    const newSmoothScores = calculateSmoothScores(filteredCasts.slice(0, topN));
    const winners = calculateWinners(newSmoothScores, rulesConfig);
    setSmoothScores(newSmoothScores);
    setWinners(winners);
  }, [
    castsData,
    isPlaceholderData,
    excludedCasts,
    topN,
    rulesConfig,
    setSmoothScores,
    setWinners,
  ]);

  return (
    <div className="p-2 flex gap-2">
      <ol className="list-decimal pl-6 w-full max-w-full overflow-x-hidden text-xs">
        {(castsData || []).map((cast) => {
          const castInfo = smoothScores.items.find(
            (c) => c.castHash === cast.castHash
          );
          return (
            <li key={cast.castHash} className="whitespace-nowrap break-words">
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
              <details open={!!castInfo}>
                <summary>
                  {cast.decodedText
                    ? `${cast.decodedText.slice(0, 2)}...`
                    : null}
                </summary>
                <div className="w-full overflow-x-hidden">
                  <SassyCast cast={cast} minMods={minMods} />
                </div>
              </details>
            </li>
          );
        })}
      </ol>
      <hr />
    </div>
  );
}
