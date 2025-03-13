import { useQuery } from "@tanstack/react-query";

interface FollowingResponse {
  following: number[];
}

export function useFollowing(fid: number | null) {
  return useQuery<FollowingResponse>({
    queryKey: ["following", fid],
    queryFn: async () => {
      if (!fid) return { following: [] };
      const response = await fetch(`/api/following?fid=${fid}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch following list");
      }

      return response.json();
    },
  });
}
