import { createFileRoute } from "@tanstack/react-router";
import { useFrame } from "~/components/context/FrameContext";
import { useSignIn } from "~/hooks/use-sign-in";

export const Route = createFileRoute("/whut")({
  component: Home,
});

function Home() {
  const { openUrl } = useFrame();
  const { logout, signIn, isSignedIn } = useSignIn();

  return (
    <>
      <div className="prose dark:prose-invert p-8">
        <h3>Contest 🏆</h3>
        <p className="text-xl">
          Get paid weekly for content that the most people want to see.
        </p>
        <p> </p>
        <h3>SassyHash 💅</h3>
        <p className="text-sm">
          SassyHash leverages cryptographic building blocks and the open
          Farcaster Protocol, to share restricted-distribution information in
          self-sovereign, transparent, and sufficiently decentralized blah blah.
        </p>
        <p>
          Read more
          <button
            onClick={() => openUrl("https://sassyhash.artlu.xyz/blog")}
            type="button"
            className="link link-secondary text-lg p-1 active:scale-95 transition-transform"
          >
            here
          </button>
          .
        </p>
      </div>
      <div className="flex justify-center">
        {isSignedIn ? (
          <button
            type="button"
            className="btn btn-wide btn-secondary"
            onClick={() => logout()}
          >
            Sign Out
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-wide btn-secondary"
            onClick={() => signIn()}
          >
            Sign In
          </button>
        )}
      </div>
    </>
  );
}
