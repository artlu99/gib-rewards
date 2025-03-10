import { sift } from "radash";
import type { SmoothScores } from "~/utils/smoothScores";

export interface RulesConfig {
  topN: number;
  totalPool: number;
  minPayout: number;
  minMods: number;
  vector: {
    views: number;
    likes: number;
    replies: number;
  };
}

export interface Winners {
  fid: number;
  username: string;
  rawScore: number;
  smoothScore: number;
  numCasts: number;
  payout: number;
}

export const calculateWinners = (
  smoothScores: SmoothScores,
  rules: RulesConfig
): Winners[] => {
  const { topN, totalPool, minPayout } = rules;

  const aggregatedScores = smoothScores.items.reduce((acc, item) => {
    acc[item.username] = (acc[item.username] || 0) + item.smooth;
    return acc;
  }, {} as Record<string, number>);

  const sortedScores = Object.entries(aggregatedScores)
    .sort(([, value], [, otherValue]) => otherValue - value)
    .slice(0, topN);

  const totalPoints = sortedScores.reduce((acc, [, score]) => acc + score, 0);
  const numWinners = Math.min(topN, sortedScores.length);

  const availablePool = totalPool - minPayout * numWinners;

  const winners = sift(
    sortedScores.map(([username, score]) => {
      const items = smoothScores.items.filter(
        (item) => item.username === username
      );
      if (!items.length) {
        return null;
      }
      const { fid } = items[0];
      const rawScore = items.reduce((acc, item) => acc + item.raw, 0);
      const smoothScore = items.reduce((acc, item) => acc + item.smooth, 0);
      const numCasts = items.length;
      const payout = minPayout + (score / totalPoints) * availablePool;

      return {
        fid,
        username,
        rawScore,
        smoothScore,
        numCasts,
        payout,
      };
    })
  );
  return winners;
};
