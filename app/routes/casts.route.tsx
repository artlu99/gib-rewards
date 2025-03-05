import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { fetchPosts } from "../utils/posts";

export const Route = createFileRoute("/casts")({
  loader: async () => fetchPosts(),
  component: PostsLayoutComponent,
});

function PostsLayoutComponent() {
  const casts = Route.useLoaderData();

  return (
    <div className="p-2 flex gap-2">
      <ul className="list-disc pl-4">
        {[
          ...casts,
          {
            fid: 0,
            castHash: "i-do-not-exist",
            username: "no-user",
            count: 0,
            rootParentUrl: null,
          },
        ].map((cast) => {
          return (
            <li key={cast.castHash} className="whitespace-nowrap">
              <Link
                to="/casts/$postId"
                params={{
                  postId: cast.castHash,
                }}
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
