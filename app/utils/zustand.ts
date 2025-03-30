import { unique } from "radash";
import { create } from "zustand";
// import { createJSONStorage, persist } from "zustand/middleware";
import type { SmoothScores } from "~/utils/smoothScores";
import type { LeaderboardCastInfo } from "~/utils/whistles";
import type { RulesConfig, Winners } from "~/utils/winners";

type BearStore = {
  rulesConfig: RulesConfig;
  setRulesConfig: (rulesConfig: RulesConfig) => void;
  casts: LeaderboardCastInfo[];
  setCasts: (casts: LeaderboardCastInfo[]) => void;
  smoothScores: SmoothScores;
  setSmoothScores: (smoothScores: SmoothScores) => void;
  excludedCasts: string[];
  addExcludedCast: (castHash: string) => void;
  clearExcludedCasts: () => void;
  winners: Winners[];
  setWinners: (winners: Winners[]) => void;
  sortBy: "views" | "likes" | "timestamp";
  setSortBy: (sortBy: "views" | "likes" | "timestamp") => void;
  filterZeros: boolean;
  setFilterZeros: (filterZeros: boolean) => void;
};

export const useBearStore = create<BearStore>()(
  // persist(
  (set, get) => ({
    rulesConfig: {
      topN: 15,
      totalPool: 100,
      minPayout: 5,
      minMods: 2,
      vector: {
        views: 1,
        likes: 0,
        replies: 0,
      },
    },
    setRulesConfig: (rulesConfig: RulesConfig) => set({ rulesConfig }),
    casts: [],
    setCasts: (casts: LeaderboardCastInfo[]) => set({ casts }),
    smoothScores: {
      nRaw: 0,
      sumRaw: 0,
      meanRaw: 0,
      stdevRaw: 0,
      sumSmooth: 0,
      items: [],
    },
    setSmoothScores: (smoothScores: SmoothScores) => set({ smoothScores }),
    excludedCasts: [],
    addExcludedCast: (castHash: string) =>
      set({
        excludedCasts: unique([...get().excludedCasts, castHash]),
      }),
    clearExcludedCasts: () => set({ excludedCasts: [] }),
    winners: [],
    setWinners: (winners: Winners[]) => set({ winners }),
    sortBy: "views",
    setSortBy: (sortBy: "views" | "likes" | "timestamp") => set({ sortBy }),
    filterZeros: false,
    setFilterZeros: (filterZeros: boolean) => set({ filterZeros }),
  })
  // { name: "bear-store", storage: createJSONStorage(() => sessionStorage) }
  // )
);
