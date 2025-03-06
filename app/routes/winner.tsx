import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { defaultRulesConfig } from "~/routes/_pathlessLayout/_nested-layout";
import { useBearStore } from "~/utils/zustand";

export const Route = createFileRoute("/winner")({
  loader: () => ({
    rulesConfig: defaultRulesConfig,
  }),
  component: Winner,
});

function Winner() {
  const { rulesConfig } = useLoaderData({ from: "/winner" });
  const { bears, addABear, smoothScores } = useBearStore();
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

  console.log(availablePool);

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
                @{username}-{score.toFixed(2)}-${payout.toFixed(2)}
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
