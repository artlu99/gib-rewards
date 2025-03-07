import { create } from "zustand";
import type { SmoothScores } from "~/utils/smoothScores";
import type { LeaderboardCastInfo } from "~/utils/whistles";

type BearStore = {
  casts: LeaderboardCastInfo[];
  setCasts: (casts: LeaderboardCastInfo[]) => void;
  smoothScores: SmoothScores;
  setSmoothScores: (smoothScores: SmoothScores) => void;
  excludedCasts: string[];
  addExcludedCast: (castHash: string) => void;
};

export const useBearStore = create<BearStore>()((set, get) => ({
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
    set({ excludedCasts: [...get().excludedCasts, castHash] }),
}));
