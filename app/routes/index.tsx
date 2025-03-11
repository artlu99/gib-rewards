import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { unique } from "radash";
import { useCallback, useEffect, useRef } from "react";
import { SassyCast } from "~/components/SassyCast";
import { useFrame } from "~/components/context/FrameContext";
import { calculateSmoothScores } from "~/utils/smoothScores";
import { castsInfiniteQueryOptions } from "~/utils/topNcasts";
import { calculateWinners } from "~/utils/winners";
import { useBearStore } from "~/utils/zustand";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      fid: search.fid ? Number(search.fid) : undefined,
    };
  },
  loader: async ({ context }) => {
    const queryClient = context.queryClient;
    return {
      preload: queryClient.getQueryData(
        castsInfiniteQueryOptions(null).queryKey
      ),
    };
  },
  component: PostsLayoutComponent,
});

function PostsLayoutComponent() {
  const { preload } = useLoaderData({ from: "/" });
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

  // Create ref for intersection observer
  const observerTarget = useRef(null);

  const {
    data,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    ...castsInfiniteQueryOptions(contextFid),
    initialData: preload as any,
  });

  // Callback for intersection observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  // Set up intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: "0px 0px 400px 0px", // Load more when user is 400px from bottom
    });

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [handleObserver]);

  // Update effect to update casts when data changes
  useEffect(() => {
    if (data?.pages && data.pages.length > 0) {
      // Flatten all pages of data and extract the casts
      const allPagesCasts = data.pages.flatMap((page) => page.data);
      setCasts(unique(allPagesCasts, (c) => c.castHash));
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
      {data && data.pages.length > 0 && data.pages[0].data.length > 0 ? (
        <ol className="list-decimal pl-6 w-full max-w-full overflow-x-hidden text-xs">
          {casts
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

          {/* Intersection observer target */}
          <div ref={observerTarget} className="h-10 mt-4">
            {isFetchingNextPage && (
              <div className="flex justify-center">
                <span className="loading loading-ring loading-md loading-secondary" />
              </div>
            )}
          </div>
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
    </div>
  );
}
