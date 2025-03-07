import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { useEffect } from "react";
import { useFrame } from "~/components/context/FrameContext";
import { useBearStore } from "~/utils/zustand";

interface RulesConfig {
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

export const defaultRulesConfig: RulesConfig = {
  topN: 15,
  totalPool: 100,
  minPayout: 5,
  minMods: 1,
  vector: {
    views: 1,
    likes: 0,
    replies: 0,
  },
};

export const Route = createFileRoute("/winner")({
  loader: () => ({
    rulesConfig: defaultRulesConfig,
  }),
  component: Winner,
});

function Winner() {
  const { rulesConfig } = useLoaderData({ from: "/winner" });
  const { smoothScores } = useBearStore();
  const { viewProfile, isInstalled, isNotificationsEnabled, setPrimaryButton } =
    useFrame();

  const aggregatedScores = smoothScores.items.reduce((acc, item) => {
    acc[item.username] = (acc[item.username] || 0) + item.smooth;
    return acc;
  }, {} as Record<string, number>);

  const sortedScores = Object.entries(aggregatedScores)
    .sort(([, value], [, otherValue]) => otherValue - value)
    .slice(0, rulesConfig.topN);

  const totalPoints = sortedScores.reduce((acc, [, score]) => acc + score, 0);
  const numWinners = Math.min(rulesConfig.topN, sortedScores.length);

  const availablePool =
    rulesConfig.totalPool - rulesConfig.minPayout * numWinners;

  useEffect(() => {
    if (!isInstalled) {
      setPrimaryButton("Install Contest Frame");
    }
  }, [setPrimaryButton, isInstalled]);

  return isInstalled ? (
    isNotificationsEnabled ? (
      <div className="prose dark:prose-invert p-2">
        <h2>Week March 4 ~ March 11</h2>

        <div>
          <ol className="list-decimal pl-6 w-full max-w-full overflow-x-hidden text-xs">
            {sortedScores.map(([username, score]) => {
              const castFid = smoothScores.items.find(
                (item) => item.username === username
              )?.fid;

              const payout =
                rulesConfig.minPayout + (score / totalPoints) * availablePool;

              return (
                <li key={username}>
                  <div className="block text-lg p-1 active:scale-95 transition-transform">
                    <button
                      type="button"
                      className="link btn-link"
                      onClick={() => viewProfile(castFid ?? 0, username)}
                    >
                      @{username}
                    </button>
                    -{score.toFixed(2)}-${payout.toFixed(2)}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="text-warning text-xl">
          Payouts are fake until the game goes live!
        </div>
      </div>
    ) : (
      <div className="text-error text-xl">
        Please enable notifications to see payouts
      </div>
    )
  ) : (
    <div className="text-error text-xl">
      Please install Frame to see payouts
    </div>
  );
}
