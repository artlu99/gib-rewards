import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useFrame } from "~/components/context/FrameContext";
import { useSignIn } from "~/hooks/use-sign-in";
import { getStoredToken } from "~/utils/auth";
import { fetchCasts } from "~/utils/topNcasts";
import type { LeaderboardCastInfo } from "~/utils/whistles";

export const Route = createFileRoute("/casts")({
  component: PostsLayoutComponent,
});

function PostsLayoutComponent() {
  const { context } = useFrame();
  const { signIn, isSignedIn } = useSignIn();
  const [loading, setLoading] = useState(false);
  const [casts, setCasts] = useState<LeaderboardCastInfo[]>([]);

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
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [context?.user?.fid]);

  return loading ? (
    <div>Loading casts...</div>
  ) : (
    <div className="p-2 flex gap-2">
      <ul className="list-disc pl-4">
        {casts.map((cast) => {
          return (
            <li key={cast.castHash} className="whitespace-nowrap">
              <Link
                to="/casts/$castHash"
                params={{ castHash: cast.castHash }}
                className="block py-1 text-blue-800 hover:text-blue-600"
                activeProps={{ className: "text-black font-bold" }}
              >
                <div>
                  @{cast.username}-{cast.count}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <hr />
      <Outlet />
    </div>
  );
}
