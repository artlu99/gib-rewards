import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { LeaderboardCastInfo } from "~/utils/whistles";
import type { SmoothScores } from "./smoothScores";

type BearStore = {
  bears: number;
  addABear: () => void;
  casts: LeaderboardCastInfo[];
  setCasts: (casts: LeaderboardCastInfo[]) => void;
  smoothScores: SmoothScores;
  setSmoothScores: (smoothScores: SmoothScores) => void;
  excludedCasts: string[];
  addExcludedCast: (castHash: string) => void;
};

export const useBearStore = create<BearStore>()(
  persist(
    (set, get) => ({
      bears: 0,
      addABear: () => set({ bears: get().bears + 1 }),
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
    }),
    {
      name: "zustand-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
