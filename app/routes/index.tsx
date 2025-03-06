import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Suspense, useEffect, useState } from "react";
import { FarcasterEmbed } from "react-farcaster-embed/dist/client";
import { useFrame } from "~/components/context/FrameContext";
import { useSignIn } from "~/hooks/use-sign-in";
import { getStoredToken } from "~/utils/auth";
import { calculateSmoothScores } from "~/utils/smoothScores";
import { fetchCasts } from "~/utils/topNcasts";
import type { LeaderboardCastInfo } from "~/utils/whistles";
import { useBearStore } from "~/utils/zustand";

export const Route = createFileRoute("/")({
  component: PostsLayoutComponent,
});

function PostsLayoutComponent() {
  const { context, viewProfile } = useFrame();
  const { signIn, isSignedIn } = useSignIn();
  const [loading, setLoading] = useState(false);
  const [cast, setCast] = useState<LeaderboardCastInfo>();
  const [showDecodedText, setShowDecodedText] = useState(false);
  const { casts, setCasts, smoothScores, setSmoothScores } = useBearStore();

  useEffect(() => {
    if (!context?.user) return;
    if (!isSignedIn) {
      signIn();
    }
  }, [context, isSignedIn, signIn]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      setLoading(true);
      try {
        const token = getStoredToken(context?.user?.fid);
        const result = await fetchCasts({
          data: {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          },
        });
        setCasts(result);
        setSmoothScores(calculateSmoothScores(result));
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [context, setCasts, setSmoothScores]);

  return (
    <Suspense fallback={<div>Loading casts...</div>}>
      {!cast ? (
        <div className="p-2 flex gap-2">
          <ol className="list-decimal pl-4">
            {(loading ? [] : smoothScores.items).map((cast) => {
              const castInfo = casts.find((c) => c.castHash === cast.castHash);
              return (
                <li key={cast.castHash} className="whitespace-nowrap">
                  <div className="block text-lg p-1 active:scale-95 transition-transform">
                    <div>
                      <button
                        type="button"
                        className="link btn-link"
                        onClick={() => viewProfile(cast.fid, cast.username)}
                      >
                        @{cast.username}
                      </button>{" "}
                      <button
                        type="button"
                        className="link btn-link"
                        onClick={() => setCast(castInfo)}
                      >
                        {cast.raw} {cast.smooth.toFixed(2)}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <hr />
          <Outlet />
        </div>
      ) : (
        <div>
          <div className="space-y-2">
            <button
              type="button"
              className="link btn-link"
              onClick={() => setCast(undefined)}
            >
              ← Back
            </button>
            <div className="flex justify-between items-center w-full">
              <div className="text-sm">{cast.count} attempted views (raw)</div>
              <button
                type="button"
                onClick={() => setShowDecodedText(!showDecodedText)}
              >
                {cast.decodedText ? (showDecodedText ? "🙈" : "💅") : null}
              </button>
            </div>
            <div className="w-[320px]">
              <FarcasterEmbed username={cast.username} hash={cast.castHash} />
            </div>
            {showDecodedText && (
              <div className="text-lg">{cast.decodedText}</div>
            )}
          </div>
        </div>
      )}
    </Suspense>
  );
}
