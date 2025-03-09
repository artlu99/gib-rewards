import { createFileRoute } from "@tanstack/react-router";
import { useFrame } from "~/components/context/FrameContext";
import { useBearStore } from "~/utils/zustand";

const LOCAL_DEBUGGING = import.meta.env.DEV;

export const Route = createFileRoute("/winner")({
  component: Winner,
});

function Winner() {
  const { viewProfile, isInstalled, isNotificationsEnabled } = useFrame();
  const { winners } = useBearStore();

  return (
    <>
      <div className="text-center text-warning text-xl">
        Pre-launch payouts until{" "}
        <span className="text-info font-bold">March 18</span>
      </div>

      {isInstalled || LOCAL_DEBUGGING ? (
        isNotificationsEnabled || LOCAL_DEBUGGING ? (
          <div className="prose dark:prose-invert p-2">
            <h2 className="text-center mb-4">Week March 4 ~ March 11</h2>

            <div className="flex flex-col gap-2">
              {winners.map((winner, index) => {
                const { fid, username, smoothScore, numCasts, payout } = winner;
                return (
                  <div
                    key={username}
                    className="card bg-base-100 shadow-sm rounded-md m-2"
                  >
                    <div className="card-body p-3">
                      <div className="flex items-center gap-2">
                        <div className="badge btn-soft badge-ghost">{index + 1}</div>
                        <button
                          type="button"
                          className="text-lg font-medium hover:underline active:scale-95 transition-transform"
                          onClick={() => viewProfile(fid, username)}
                        >
                          @{username}
                        </button>
                      </div>

                      <div className="stats stats-horizontal w-full bg-transparent text-sm">
                        <div className="stat px-2 py-1">
                          <div className="stat-title text-xs opacity-60">
                            Score🏆
                          </div>
                          <div className="stat-value text-md">
                            {smoothScore.toFixed(2)}
                          </div>
                        </div>

                        <div className="stat px-2 py-1">
                          <div className="stat-title text-xs opacity-60">
                            Casts 💅
                          </div>
                          <div className="stat-value text-md">{numCasts}</div>
                        </div>

                        <div className="stat px-2 py-1">
                          <div className="stat-title text-xs opacity-60">
                            💰Payout
                          </div>
                          <div className="stat-value text-md">
                            ${payout.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
      )}
    </>
  );
}
