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
