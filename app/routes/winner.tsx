import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useFrame } from "~/components/context/FrameContext";
import { getUsers } from "~/utils/neynar";
import { useBearStore } from "~/utils/zustand";

const LOCAL_DEBUGGING = import.meta.env.DEV;

const fetchUsers = createServerFn({
  method: "GET",
})
  .validator((d: { fids: number[] }) => d)
  .handler(async ({ data }) => {
    const { fids } = data;

    const users = await getUsers(fids);

    return users;
  });

export const Route = createFileRoute("/winner")({
  component: Winner,
});

function Winner() {
  const { viewProfile, isInstalled, isNotificationsEnabled } = useFrame();
  const { winners, casts, rulesConfig } = useBearStore();
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const handleSaveWinners = async () => {
    try {
      setIsSaving(true);
      const response = await fetch("/api/munnies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            winners: winners,
            rulesConfig: rulesConfig,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setSavedMessage(error.message || "Failed to save winners");
      } else {
        setSavedMessage("Winners saved successfully!");
      }
    } catch (error) {
      console.error("Error saving winners:", error);
      setSavedMessage(
        error instanceof Error ? error.message : "Failed to save winners"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const { data: users } = useQuery({
    queryKey: ["users", winners.map((winner) => winner.fid)],
    queryFn: () =>
      fetchUsers({ data: { fids: winners.map((winner) => winner.fid) } }),
  });

  return (
    <>
      {isInstalled || LOCAL_DEBUGGING ? (
        isNotificationsEnabled || LOCAL_DEBUGGING ? (
          <div className="prose dark:prose-invert p-2">
            <h2 className="text-center mb-4">Week March 18 ~ March 25</h2>

            <div className="flex flex-col gap-2">
              {winners.map((winner, index) => {
                const { fid, username, smoothScore, payout, numCasts } = winner;
                const totalCasts = casts.filter(
                  (cast) => cast.fid === fid
                ).length;
                const user = users?.users.find((user) => user.fid === fid);
                return (
                  <div
                    key={username}
                    className="card card-bordered border-base-200 bg-base-100"
                  >
                    <div className="card-body p-3">
                      <div className="flex items-center gap-2">
                        <div className="badge btn-soft badge-ghost">
                          {index + 1}
                        </div>
                        <button
                          type="button"
                          className="flex items-center justify-between w-full text-lg font-medium hover:underline active:scale-95 transition-transform relative"
                          onClick={() => viewProfile(fid, username)}
                        >
                          <span>
                            @{username}{" "}
                            {user?.experimental?.neynar_user_score ? (
                              <span className="text-xs opacity-50 align-middle">
                                {user.experimental.neynar_user_score} Neynar
                                Score
                              </span>
                            ) : null}
                          </span>
                          {user?.pfp_url ? (
                            <img
                              src={user.pfp_url}
                              alt={user.username}
                              className="w-10 h-10 rounded-md absolute right-4 translate-y-2 opacity-70"
                            />
                          ) : null}
                        </button>
                      </div>

                      <Link
                        to="/"
                        search={{ fid }}
                        className="stats stats-horizontal w-full bg-transparent text-sm no-underline"
                      >
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
                          <div className="stat-value flex items-baseline">
                            {numCasts}
                            <span className="stat-desc ml-1">
                              / {totalCasts}
                            </span>
                          </div>
                        </div>

                        <div className="stat px-2 py-1">
                          <div className="stat-title text-xs opacity-60">
                            💰Payout
                          </div>
                          <div className="stat-value text-md">
                            ${payout.toFixed(2)}
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between">
              <a
                href="/api/munnies/download"
                download={`winners-snapshot-${new Date().toISOString()}.json`}
                className="btn btn-ghost no-underline"
              >
                Download Snapshot
              </a>
              <button
                type="button"
                onClick={handleSaveWinners}
                className="btn btn-ghost"
                disabled={isSaving}
              >
                {isSaving ? savedMessage : "Take Snapshot"}
              </button>
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

      <div className="h-16" />
      <div className="h-16" />
      <div className="h-16" />
      <div className="h-16" />
    </>
  );
}
