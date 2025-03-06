import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { Suspense, useEffect, useState } from "react";
import { useFrame } from "~/components/context/FrameContext";
import { useSignIn } from "~/hooks/use-sign-in";
import { getStoredToken } from "~/utils/auth";
import { calculateSmoothScores } from "~/utils/smoothScores";
import { fetchCasts } from "~/utils/topNcasts";
import { useBearStore } from "~/utils/zustand";

export const Route = createFileRoute("/casts")({
  component: PostsLayoutComponent,
});

function PostsLayoutComponent() {
  const { context } = useFrame();
  const { signIn, isSignedIn } = useSignIn();
  const [loading, setLoading] = useState(false);
  const [contextFid, setContextFid] = useState<number>();
  const { casts, setCasts, smoothScores, setSmoothScores } = useBearStore();

  useEffect(() => {
    if (context?.user) {
      setContextFid(context.user.fid);
    }
  }, [context]);

  useEffect(() => {
    if (context?.user) return;
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

  console.log(smoothScores);

  return (
    <Suspense fallback={<div>Loading casts...</div>}>
      <div>Context FID: {contextFid}</div>
      <div className="p-2 flex gap-2">
        <ol className="list-decimal pl-4">
          {(loading ? [] : smoothScores.items).map((cast) => {
            return (
              <li key={cast.castHash} className="whitespace-nowrap">
                <Link
                  to="/casts/$castHash"
                  params={{ castHash: cast.castHash }}
                  className="block text-lg p-1 active:scale-95 transition-transform"
                  activeProps={{ className: "text-black font-bold" }}
                >
                  <div>
                    @{cast.username}-{cast.raw}-{cast.smooth.toFixed(2)}
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
        <hr />
        <Outlet />
      </div>
    </Suspense>
  );
}
