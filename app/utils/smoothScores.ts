import { sift } from "radash";
import type { RulesConfig } from "~/utils/rules";
import type { LeaderboardCastInfo } from "~/utils/whistles";

export interface SmoothScores {
  nRaw: number;
  sumRaw: number;
  meanRaw: number;
  stdevRaw: number;
  sumSmooth: number;
  items: {
    fid: number;
    username: string;
    castHash: string;
    raw: number;
    rawZscore: number;
    smooth: number;
    smoothZscore: number;
  }[];
}

export interface Winners {
  fid: number;
  username: string;
  rawScore: number;
  smoothScore: number;
  payout: number;
}

export const calculateSmoothScores = (data: LeaderboardCastInfo[]) => {
  const smoothData: SmoothScores = {
    nRaw: 0,
    sumRaw: 0,
    sumSmooth: 0,
    meanRaw: 0,
    stdevRaw: 0,
    items: [],
  };
  for (const cast of data) {
    smoothData.nRaw++;
    smoothData.sumRaw += cast.count;
    smoothData.items.push({
      fid: cast.fid,
      username: cast.username,
      castHash: cast.castHash,
      raw: cast.count,
      rawZscore: 0,
      smooth: 0,
      smoothZscore: 0,
    });
  }
  smoothData.meanRaw = smoothData.sumRaw / smoothData.nRaw;
  smoothData.stdevRaw = Math.sqrt(
    smoothData.items.reduce(
      (acc, item) => acc + (item.raw - smoothData.meanRaw) ** 2,
      0
    ) / smoothData.nRaw
  );
  for (const item of smoothData.items) {
    item.rawZscore = (item.raw - smoothData.meanRaw) / smoothData.stdevRaw;
    item.smoothZscore = Math.atan(item.rawZscore);
  }
  for (const item of smoothData.items) {
    item.smooth = item.smoothZscore * smoothData.stdevRaw + smoothData.meanRaw;
    smoothData.sumSmooth += item.smooth;
  }
  return smoothData;
};

export const calculateWinners = (smoothScores: SmoothScores, rules: RulesConfig): Winners[] => {
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
      const item = smoothScores.items.find(
        (item) => item.username === username
      );
      if (!item) {
        return null;
      }
      const { fid, raw, smooth } = item;
      const payout = minPayout + (score / totalPoints) * availablePool;

      return {
        fid,
        username,
        rawScore: raw,
        smoothScore: smooth,
        payout,
      };
    })
  );
  return winners;
};
