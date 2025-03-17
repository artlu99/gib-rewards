import type { Message } from "@farcaster/core";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { fetcher } from "itty-fetcher";
import { cluster, sift, unique } from "radash";
import { useCallback, useEffect, useRef, useState } from "react";
import { SassyCast } from "~/components/SassyCast";
import { useFrame } from "~/components/context/FrameContext";
import { Eyeball, Flame, Heart } from "~/components/ui/Icons";
import { useSignIn } from "~/hooks/use-sign-in";
import { useFollowing } from "~/hooks/useFollowing";
import { getStoredToken, verifyToken } from "~/utils/auth";
import { FARCASTER_EPOCH } from "~/utils/hub";
import { moderatorFids } from "~/utils/moderators";
import { calculateSmoothScores } from "~/utils/smoothScores";
import { castsInfiniteQueryOptions } from "~/utils/topNcasts";
import { calculateWinners } from "~/utils/winners";
import { useBearStore } from "~/utils/zustand";

const MAX_REACTIONS_PAGE_SIZE = 100;
const DO_NOT_PAY = [6546];

const client = fetcher({ base: "https://nemes.farcaster.xyz:2281" });

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

  const [isSavingBestOfSassy, setIsSavingBestOfSassy] = useState(false);
  const [savedMessageBestOfSassy, setSavedMessageBestOfSassy] = useState("");

  const { logout, signIn } = useSignIn();

  const { contextFid, viewProfile, openUrl } = useFrame();
  const {
    rulesConfig,
    setRulesConfig,
    casts,
    setCasts,
    smoothScores,
    setSmoothScores,
    excludedCasts,
    clearExcludedCasts,
    setWinners,
    sortBy,
    setSortBy,
    filterZeros,
    setFilterZeros,
  } = useBearStore();
  const { topN, minMods } = rulesConfig;

  useEffect(() => {
    const token = getStoredToken(contextFid ?? undefined);

    if (!token) {
      signIn();
    } else if (!verifyToken(token)) {
      logout();
      signIn();
    }
  }, [contextFid, logout, signIn]);

  const { data: following } = useFollowing(contextFid ?? null);

  const handleSort = (sortType: "views" | "likes" | "timestamp") => {
    setSortBy(sortType);

    if (sortType === "views") {
      setCasts([...casts].sort((a, b) => b.count - a.count));
    } else if (sortType === "timestamp") {
      setCasts(
        [...casts].sort((a, b) => {
          const aTimestamp = likesData?.lastLikedTimes[a.castHash] ?? 0;
          const bTimestamp = likesData?.lastLikedTimes[b.castHash] ?? 0;
          return bTimestamp - aTimestamp;
        })
      );
    } else if (sortType === "likes") {
      setCasts(
        [...casts].sort((a, b) => {
          const aLikes = castsLikesMap[a.castHash]?.followingLikes?.length || 0;
          const bLikes = castsLikesMap[b.castHash]?.followingLikes?.length || 0;
          return bLikes - aLikes;
        })
      );
    }
  };

  const handleRemoveMod = () => {
    if (minMods > 0) {
      setRulesConfig({ ...rulesConfig, minMods: minMods - 1 });
      clearExcludedCasts();
    }
  };

  const handleAddMod = () => {
    if (minMods < 12) {
      setRulesConfig({ ...rulesConfig, minMods: minMods + 1 });
      clearExcludedCasts();
    }
  };

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
    ...castsInfiniteQueryOptions(contextFid ?? null),
    // biome-ignore lint/suspicious/noExplicitAny: too gnarly
    initialData: preload as any,
  });

  const [showScrollButton, setShowScrollButton] = useState(false);

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      setShowScrollButton(scrollY > windowHeight);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSaveBestOfSassy = async () => {
    try {
      setIsSavingBestOfSassy(true);
      const response = await fetch("/api/best-of-sassy", {
        method: "POST",
        body: JSON.stringify({
          data: { bestOfSassy: smoothScores, rulesConfig },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setSavedMessageBestOfSassy(
          error.message || "Failed to save Best of Sassy"
        );
      } else {
        setSavedMessageBestOfSassy("Best of Sassy saved successfully!");
      }
    } catch (error) {
      console.error("Error saving Best of Sassy:", error);
      setSavedMessageBestOfSassy(
        error instanceof Error ? error.message : "Failed to save Best of Sassy"
      );
    } finally {
      setIsSavingBestOfSassy(false);
    }
  };

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: also use count in effect dependency
  useEffect(() => {
    if (casts.length === 0) {
      return;
    }
    const filteredCasts = casts
      .filter((cast) => !excludedCasts.includes(cast.castHash))
      .filter((cast) => !DO_NOT_PAY.includes(cast.fid));
    const newSmoothScores = calculateSmoothScores(filteredCasts.slice(0, topN));
    const winners = calculateWinners(newSmoothScores, rulesConfig);
    setSmoothScores(newSmoothScores);
    setWinners(winners);
  }, [
    casts,
    excludedCasts,
    excludedCasts.length,
    topN,
    rulesConfig,
    setSmoothScores,
    setWinners,
  ]);

  // Add new state for consolidated likes data
  const [castsLikesMap, setCastsLikesMap] = useState<
    Record<
      string,
      {
        allLikes: number[];
        modLikes: number[];
        followingLikes: number[];
      }
    >
  >({});

  // Fetch all likes in batches
  const { data: likesData, isLoading: isLoadingLikes } = useQuery({
    queryKey: ["allCastsLikes", casts.map((c) => c.castHash).join(",")],
    queryFn: async () => {
      // You could batch this in chunks of ~20 casts if needed
      const allLikesData: Record<string, number[]> = {};
      const lastLikedTimes: Record<string, number> = {};

      // Process in smaller batches to avoid request size limits
      const castBatches = cluster(casts, 20);

      for (const batch of castBatches) {
        await Promise.all(
          batch.map(async (cast) => {
            try {
              const res = await client.get<{ messages: Message[] }>(
                `/v1/reactionsByCast?${new URLSearchParams({
                  target_fid: cast.fid.toString(),
                  target_hash: cast.castHash,
                  reaction_type: "1", // 1 === likes
                  page_size: MAX_REACTIONS_PAGE_SIZE.toString(),
                })}`
              );

              allLikesData[cast.castHash] =
                res?.messages.map((m) => m.data?.fid ?? 0) || [];

              // Update last liked time for each cast with the timestamp of the most recent like
              lastLikedTimes[cast.castHash] =
                res?.messages.reduce((max, m) => {
                  const timestamp =
                    ((m.data?.timestamp ?? 0) + FARCASTER_EPOCH) * 1000;
                  return Math.max(max, timestamp);
                }, 0) ?? 0;
            } catch (error) {
              console.error(
                `Error fetching likes for cast ${cast.castHash}`,
                error
              );
              allLikesData[cast.castHash] = [];
            }
          })
        );
      }

      return { allLikesData, lastLikedTimes };
    },
    enabled: casts.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Process the likes data
  useEffect(() => {
    if (!likesData || !following) return;

    const processedLikesMap: Record<
      string,
      {
        allLikes: number[];
        modLikes: number[];
        followingLikes: number[];
      }
    > = {};

    for (const [castHash, likes] of Object.entries(likesData.allLikesData)) {
      processedLikesMap[castHash] = {
        allLikes: likes,
        modLikes: likes.filter((fid) => moderatorFids.includes(fid)),
        followingLikes: likes.filter((fid) =>
          (following?.following ?? []).includes(fid)
        ),
      };
    }

    setCastsLikesMap(processedLikesMap);
  }, [likesData, following]);

  return (
    <>
      <div className="flex justify-between">
        <a
          href="/api/best-of-sassy/download"
          download={`best-of-sassy-snapshot-${new Date().toISOString()}.json`}
          className="btn btn-ghost no-underline"
        >
          Download
        </a>

        <div className="">
          <div className="join">
            <button
              type="button"
              className="join-item btn "
              onClick={handleRemoveMod}
              disabled={rulesConfig.minMods === 0}
            >
              -
            </button>
            <span className="join-item btn btn-ghost">
              {rulesConfig.minMods}
            </span>
            <button
              type="button"
              className="join-item btn"
              onClick={handleAddMod}
              disabled={rulesConfig.minMods >= 12}
            >
              +
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveBestOfSassy}
          className="btn btn-ghost"
          disabled={isSavingBestOfSassy}
        >
          {isSavingBestOfSassy ? savedMessageBestOfSassy : "Snapshot"}
        </button>
      </div>

      <div className="flex justify-center m-4">
        <div className="join bg-outline bg-base-300 rounded-full shadow-sm p-1">
          <button
            type="button"
            className="flex items-center px-3 text-sm font-medium text-base-content/70"
            onClick={() => setFilterZeros(!filterZeros)}
          >
            Sort by
          </button>

          <button
            type="button"
            className={`join-item btn btn-sm normal-case px-3 ${
              sortBy === "views"
                ? "bg-base/50 text-accent-content"
                : "bg-transparent text-base-content/80"
            }`}
            onClick={() => handleSort("views")}
          >
            <span>Views</span>
            <Eyeball />
          </button>

          <button
            type="button"
            className={`join-item btn btn-sm normal-case px-3 ${
              sortBy === "timestamp"
                ? "bg-base/50 text-accent-content "
                : "bg-transparent text-base-content/80 "
            }`}
            onClick={() => handleSort("timestamp")}
          >
            <Flame />
            <span>Fresh</span>
          </button>

          <button
            type="button"
            className={`join-item btn btn-sm normal-case px-3 rounded-r-full ${
              sortBy === "likes"
                ? "bg-base/50 text-accent-content"
                : "bg-transparent text-base-content/80"
            }`}
            onClick={() => handleSort("likes")}
          >
            <span>Likes</span>
            <Heart />
          </button>
        </div>
      </div>

      <div className="p-2 flex gap-2">
        {data && data.pages.length > 0 && data.pages[0].data.length > 0 ? (
          <ol className="list-decimal pl-6 w-full max-w-full overflow-x-hidden text-xs">
            {sift(
              casts
                .filter((cast) => (fid ? cast.fid === fid : true))
                .map((cast) => {
                  const castInfo = smoothScores.items.find(
                    (c) => c.castHash === cast.castHash
                  );
                  return filterZeros && (castInfo?.smooth ?? 0) === 0 ? null : (
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
                        <SassyCast
                          cast={cast}
                          minMods={minMods}
                          likesData={castsLikesMap[cast.castHash]}
                          lastLikedTime={
                            likesData?.lastLikedTimes[cast.castHash] ?? null
                          }
                        />
                      </div>
                    </li>
                  );
                })
            )}

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
              There are no decoded messages to display right now. Check back
              later or explore other casts.
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
        {showScrollButton && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="btn btn-circle btn-ghost fixed text-2xl animate-bounce hover:animate-none"
            style={{ bottom: "25vh", right: "1rem" }}
          >
            🚀
          </button>
        )}
      </div>
      <div className="h-16" />
      <div className="h-16" />
      <div className="h-16" />
      <div className="h-16" />
    </>
  );
}
