import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { useEffect } from "react";
import { SassyCast } from "~/components/SassyCast";
import { useFrame } from "~/components/context/FrameContext";
import { useSignIn } from "~/hooks/use-sign-in";
import { defaultRulesConfig } from "~/routes/winner";
import { getStoredToken } from "~/utils/auth";
import { calculateSmoothScores } from "~/utils/smoothScores";
import { castsQueryOptions } from "~/utils/topNcasts";
import { useBearStore } from "~/utils/zustand";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    // Pre-fetch data on the server or during navigation
    const queryClient = context.queryClient;

    // Prefetch the query so it's available immediately on client
    await queryClient.ensureQueryData(castsQueryOptions());

    return {
      rulesConfig: defaultRulesConfig,
    };
  },
  component: PostsLayoutComponent,
});

function PostsLayoutComponent() {
  const { rulesConfig } = useLoaderData({ from: "/" });
  const { topN, minMods } = rulesConfig;
  const { contextFid, viewProfile } = useFrame();
  const { signIn } = useSignIn();
  const { setCasts, smoothScores, setSmoothScores, excludedCasts } =
    useBearStore();

  // Use React Query instead of useEffect+fetch
  const {
    data: castsData,
    isLoading,
    isFetching,
  } = useQuery({
    ...castsQueryOptions(contextFid),
    // Keep previous data while fetching new data
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    const token = getStoredToken(contextFid ?? undefined);
    if (!token) {
      signIn();
    }
  }, [signIn, contextFid]);

  // Update store when query data changes
  useEffect(() => {
    if (castsData) {
      setCasts(castsData);
    }
  }, [castsData, setCasts]);

  // Calculate smooth scores when casts or excludedCasts change
  useEffect(() => {
    const filteredCasts = (castsData || []).filter(
      (cast) => !excludedCasts.includes(cast.castHash)
    );
    const newSmoothScores = calculateSmoothScores(filteredCasts.slice(0, topN));
    setSmoothScores(newSmoothScores);
  }, [castsData, excludedCasts, topN, setSmoothScores]);

  // Get the casts from the store or query data
  const casts = castsData || [];

  return (
    <div className="p-2 flex gap-2">
      {/* Show loading indicator while fetching new data */}
      {isFetching && (
        <div className="fixed top-2 right-2 bg-blue-500 text-white py-1 px-2 rounded">
          Refreshing...
        </div>
      )}

      <ol className="list-decimal pl-6 w-full max-w-full overflow-x-hidden text-xs">
        {casts.map((cast) => {
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
