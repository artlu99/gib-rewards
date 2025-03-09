import { createFileRoute } from "@tanstack/react-router";
import { useFrame } from "~/components/context/FrameContext";
import { pluralize } from "~/utils/pluralize";
import { useBearStore } from "~/utils/zustand";

const LOCAL_DEBUGGING = import.meta.env.DEV;

export const Route = createFileRoute("/winner")({
  component: Winner,
});

function Winner() {
  const { viewProfile, isInstalled, isNotificationsEnabled } = useFrame();
  const { winners } = useBearStore();

  return isInstalled || LOCAL_DEBUGGING ? (
    isNotificationsEnabled || LOCAL_DEBUGGING ? (
      <div className="prose dark:prose-invert p-2">
        <h2>Week March 4 ~ March 11</h2>

        <div>
          <ol className="list-decimal pl-6 w-full max-w-full overflow-x-hidden text-xs">
            {winners.map((winner) => {
              const { fid, username, smoothScore, numCasts, payout } = winner;
              return (
                <li key={username}>
                  <div className="block text-lg p-1 active:scale-95 transition-transform">
                    <button
                      type="button"
                      className="link btn-link"
                      onClick={() => viewProfile(fid, username)}
                    >
                      @{username}
                    </button>
                    -{smoothScore.toFixed(2)}-{pluralize(numCasts, "cast")}-$
                    {payout.toFixed(2)}
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
