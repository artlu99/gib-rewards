import { createFileRoute, useLoaderData } from "@tanstack/react-router";
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
  const { viewProfile } = useFrame();
  
  const aggregatedScores = smoothScores.items.reduce((acc, item) => {
    acc[item.username] = (acc[item.username] || 0) + item.smooth;
    return acc;
  }, {} as Record<string, number>);

  const sortedScores = Object.entries(aggregatedScores).sort(
    ([, value], [, otherValue]) => otherValue - value
  );

  const totalPoints = sortedScores.reduce((acc, [, score]) => acc + score, 0);
  const numWinners = Math.min(rulesConfig.topN, sortedScores.length);

  const availablePool =
    rulesConfig.totalPool - rulesConfig.minPayout * numWinners;

  return (
    <div className="prose dark:prose-invert p-2">
      <h2>Week March 4 ~ March 11</h2>

      <div className="text-lg">
        <ol className="list-decimal pl-4">
          {sortedScores.map(([username, score]) => {
            const payout =
              rulesConfig.minPayout + (score / totalPoints) * availablePool;
            return (
              <li key={username}>
                <button
                  type="button"
                  className="link btn-link"
                  onClick={() => viewProfile(cast.fid, cast.username)}
                >
                  @{username}
                </button>
                -{score.toFixed(2)}-${payout.toFixed(2)}
              </li>
            );
          })}
        </ol>
      </div>
      <div className="text-warning text-xl">
        Payouts are fake until the game goes live!
      </div>
    </div>
  );
}
