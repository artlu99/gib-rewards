export const sortCasts = (
  castsToSort: LeaderboardCastInfo[],
  sortType: "views" | "likes" | "timestamp",
  likesData: any,
  likesMap: Record<string, { followingLikes: number[] }>
) => {
  if (!castsToSort.length) return castsToSort;
  const sortedCasts = [...castsToSort];

  switch (sortType) {
    case "likes":
      return likesMap
        ? sortedCasts.sort((a, b) => {
            const aLikes = likesMap[a.castHash]?.followingLikes?.length || 0;
            const bLikes = likesMap[b.castHash]?.followingLikes?.length || 0;
            return bLikes - aLikes;
          })
        : sortedCasts;

    case "views":
      return sortedCasts.sort((a, b) => b.count - a.count);

    case "timestamp":
      return likesData
        ? sortedCasts.sort((a, b) => {
            const aTimestamp = likesData.lastLikedTimes[a.castHash] ?? 0;
            const bTimestamp = likesData.lastLikedTimes[b.castHash] ?? 0;
            return bTimestamp - aTimestamp;
          })
        : sortedCasts;

    default:
      return sortedCasts;
  }
};
