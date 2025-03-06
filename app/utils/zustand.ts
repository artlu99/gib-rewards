import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { LeaderboardCastInfo } from "~/utils/whistles";

type BearStore = {
  bears: number;
  addABear: () => void;
  casts: LeaderboardCastInfo[];
  setCasts: (casts: LeaderboardCastInfo[]) => void;
};

export const useBearStore = create<BearStore>()(
  persist(
    (set, get) => ({
      bears: 0,
      addABear: () => set({ bears: get().bears + 1 }),
      casts: [],
      setCasts: (casts: LeaderboardCastInfo[]) => set({ casts }),
    }),
    {
      name: "zustand-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
