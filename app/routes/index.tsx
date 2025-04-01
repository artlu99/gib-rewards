import type { Message } from "@farcaster/core";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { fetcher } from "itty-fetcher";
import { cluster, sift, unique } from "radash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SassyCast } from "~/components/SassyCast";
import { useFrame } from "~/components/context/FrameContext";
import { Eyeball, Flame, Heart } from "~/components/ui/Icons";
import { useSignIn } from "~/hooks/use-sign-in";
import { useFollowing } from "~/hooks/useFollowing";
import { getStoredToken } from "~/utils/auth";
import { FARCASTER_EPOCH } from "~/utils/hub";
import { moderatorFids } from "~/utils/moderators";
import { calculateSmoothScores } from "~/utils/smoothScores";
import { sortCasts } from "~/utils/sorting";
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
    addExcludedCast,
  } = useBearStore();
  const { topN, minMods } = rulesConfig;

  useEffect(() => {
    const token = getStoredToken(contextFid ?? undefined);

    if (!token) {
      signIn();
    } else {
      logout();
      signIn();
    }
  }, [contextFid, logout, signIn]);

  const { data: following } = useFollowing(contextFid ?? null);

  // 1. Load casts with infinite query
  const {
    data: castsData,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    ...castsInfiniteQueryOptions(contextFid ?? null),
    // biome-ignore lint/suspicious/noExplicitAny: too gnarly
    initialData: preload as any,
  });

  // 1. Initial casts loading - handle infinite query data properly
  useEffect(() => {
    if (!castsData?.pages) return;

    // Combine all pages and ensure uniqueness
    const allPagesCasts = castsData.pages.flatMap((page) => page.data);
    const uniqueCasts = unique(allPagesCasts, (c) => c.castHash);

    setCasts(uniqueCasts);
  }, [castsData, setCasts]);

  // 3. Load likes only after casts are processed
  const { data: likesData } = useQuery({
    queryKey: ["allCastsLikes", casts.map((c) => c.castHash).join(",")],
    queryFn: async () => {
      const allLikesData: Record<string, number[]> = {};
      const lastLikedTimes: Record<string, number> = {};

      const castBatches = cluster(casts, 25);
      for (const batch of castBatches) {
        await Promise.all(
          batch.map(async (cast) => {
            try {
              const res = await client.get<{ messages: Message[] }>(
                `/v1/reactionsByCast?${new URLSearchParams({
                  target_fid: cast.fid.toString(),
                  target_hash: cast.castHash,
                  reaction_type: "1",
                  page_size: MAX_REACTIONS_PAGE_SIZE.toString(),
                })}`
              );

              allLikesData[cast.castHash] =
                res?.messages.map((m) => m.data?.fid ?? 0) || [];
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
    staleTime: 5 * 60 * 1000,
  });

  // 1. First, let's clear out old excluded casts that aren't in our current set
  useEffect(() => {
    if (casts.length > 0) {
      const currentCastHashes = new Set(casts.map((cast) => cast.castHash));
      const validExcludedCasts = excludedCasts.filter((hash) =>
        currentCastHashes.has(hash)
      );

      if (validExcludedCasts.length !== excludedCasts.length) {
        clearExcludedCasts();
        for (const hash of validExcludedCasts) {
          addExcludedCast(hash);
        }
      }
    }
  }, [casts, excludedCasts, clearExcludedCasts, addExcludedCast]);

  // 2. Debug the likes processing
  const processedLikesMap = useMemo(() => {
    if (!likesData || !following) return {};

    const processedMap: Record<
      string,
      {
        allLikes: number[];
        modLikes: number[];
        followingLikes: number[];
      }
    > = {};
    for (const [castHash, likes] of Object.entries(likesData.allLikesData)) {
      processedMap[castHash] = {
        allLikes: likes,
        modLikes: likes.filter((fid) => moderatorFids.includes(fid)),
        followingLikes: likes.filter((fid) =>
          (following?.following ?? []).includes(fid)
        ),
      };
    }

    return processedMap;
  }, [likesData, following]);

  // 3. Make sure we update castsLikesMap
  useEffect(() => {
    if (Object.keys(processedLikesMap).length > 0) {
      setCastsLikesMap(processedLikesMap);
    }
  }, [processedLikesMap]);

  // 4. Update the filtering logic
  const filteredCasts = useMemo(() => {
    if (!casts.length) return [];

    const filtered = casts
      .filter((cast) => !excludedCasts.includes(cast.castHash))
      .filter((cast) => !DO_NOT_PAY.includes(cast.fid));

    return filtered;
  }, [casts, excludedCasts]);

  // Separate score calculation
  const calculatedScores = useMemo(() => {
    if (!filteredCasts.length || !likesData || !castsLikesMap) {
      return null;
    }

    // First enrich casts with their likes data
    const castsWithLikes = filteredCasts.map((cast) => ({
      ...cast,
      modLikes: castsLikesMap[cast.castHash]?.modLikes || [],
      followingLikes: castsLikesMap[cast.castHash]?.followingLikes || [],
      allLikes: castsLikesMap[cast.castHash]?.allLikes || [],
      lastLikedTime: likesData.lastLikedTimes[cast.castHash] || 0,
    }));

    // Then filter for mod threshold
    const eligibleCasts = castsWithLikes.filter(
      (cast) => cast.modLikes.length >= minMods
    );

    if (eligibleCasts.length === 0) return null;

    // Take top N by views from eligible casts
    const scoringCasts = eligibleCasts
      .sort((a, b) => b.count - a.count)
      .slice(0, topN);

    const newSmoothScores = calculateSmoothScores(scoringCasts);
    const winners = calculateWinners(newSmoothScores, rulesConfig);

    return { smoothScores: newSmoothScores, winners };
  }, [
    filteredCasts,
    likesData,
    castsLikesMap,
    minMods,
    topN,
    rulesConfig,
    rulesConfig.minMods,
  ]);

  // Update scores and winners when calculated
  useEffect(() => {
    if (!calculatedScores) return;

    setSmoothScores(calculatedScores.smoothScores);
    setWinners(calculatedScores.winners);
  }, [calculatedScores, setSmoothScores, setWinners]);

  // 6. Handle sorting separately
  const sortedCasts = useMemo(() => {
    if (!casts.length) return casts;

    // Don't sort if we need likes data but don't have it
    if (
      (sortBy === "likes" || sortBy === "timestamp") &&
      (!likesData || Object.keys(castsLikesMap).length === 0)
    ) {
      return casts;
    }

    return sortCasts([...casts], sortBy, likesData, castsLikesMap);
  }, [casts, sortBy, likesData, castsLikesMap]);

  // 7. Update casts only when sort actually changes
  useEffect(() => {
    if (
      JSON.stringify(sortedCasts.map((c) => c.castHash)) !==
      JSON.stringify(casts.map((c) => c.castHash))
    ) {
      setCasts(sortedCasts);
    }
  }, [casts, sortedCasts, setCasts]);

  // Simple sort handler
  const handleSort = useCallback(
    (sortType: "views" | "likes" | "timestamp") => {
      setSortBy(sortType);
    },
    [setSortBy]
  );

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

  // Make sure the intersection observer is working
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

  useEffect(() => {
    // Once we have our first page of data
    if (castsData?.pages[0]) {
      fetchNextPage();
    }
  }, [castsData?.pages[0], fetchNextPage]);

  // Clear excluded casts when likes data arrives
  useEffect(() => {
    if (likesData && Object.keys(castsLikesMap).length > 0) {
      clearExcludedCasts();
    }
  }, [likesData, castsLikesMap, clearExcludedCasts]);

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
        {casts && casts.length > 0 ? (
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
        ) : (
          isFetching &&
          !isFetchingNextPage && (
            <div className="flex justify-center mt-4">
              <span className="loading loading-ring loading-lg loading-primary" />
            </div>
          )
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
