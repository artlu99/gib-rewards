import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useEffect, useState } from "react";
import { SassyCast } from "~/components/SassyCast";
import { useFrame } from "~/components/context/FrameContext";
import { useSignIn } from "~/hooks/use-sign-in";
import { getStoredToken } from "~/utils/auth";
import { calculateSmoothScores } from "~/utils/smoothScores";
import { fetchCasts } from "~/utils/topNcasts";
import { useBearStore } from "~/utils/zustand";

export const Route = createFileRoute("/")({
  component: PostsLayoutComponent,
});

function PostsLayoutComponent() {
  const { contextFid, viewProfile } = useFrame();
  const { signIn } = useSignIn();
  const [loading, setLoading] = useState(false);
  const { casts, setCasts, smoothScores, setSmoothScores } = useBearStore();

  useEffect(() => {
    const token = getStoredToken(contextFid ?? undefined);
    if (!token) {
      signIn();
    }
  }, [signIn, contextFid]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore the set state functions
  useEffect(() => {
    const fetchUserPosts = async () => {
      setLoading(true);
      try {
        const token = getStoredToken(contextFid ?? undefined);
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
  }, [contextFid]);

  return (
    <Suspense fallback={<div>Loading casts...</div>}>
      <div className="p-2 flex gap-2">
        <ol className="list-decimal pl-4 w-full max-w-full overflow-x-hidden">
          {(loading ? [] : smoothScores.items).map((cast) => {
            const castInfo = casts.find((c) => c.castHash === cast.castHash);
            return (
              <li key={cast.castHash} className="whitespace-nowrap break-words">
                <div className="block text-lg p-1 active:scale-95 transition-transform">
                  <div>
                    {cast.smooth.toFixed(2)} points{" "}
                    <button
                      type="button"
                      className="link btn-link"
                      onClick={() => viewProfile(cast.fid, cast.username)}
                    >
                      @{cast.username}
                    </button>
                  </div>
                </div>
                <details open={!!castInfo}>
                  <summary>
                    {castInfo?.decodedText
                      ? `${castInfo.decodedText.slice(0, 2)}...`
                      : null}
                  </summary>
                  <div className="w-full overflow-x-hidden">
                    {castInfo ? <SassyCast cast={castInfo} /> : null}
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
        <hr />
      </div>
    </Suspense>
  );
}
