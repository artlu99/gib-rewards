import { createFileRoute } from "@tanstack/react-router";
import { useFrame } from "~/components/context/FrameContext";
import { useSignIn } from "~/hooks/use-sign-in";

export const Route = createFileRoute("/whut")({
  component: Home,
});

function Me() {
  const { contextFid, context } = useFrame();
  const { error, logout, signIn, isSignedIn } = useSignIn();

  return (
    <div className="flex flex-col items-center justify-center">
      {error && (
        <p className="text-error">
          {error}
          <br />
        </p>
      )}

      {isSignedIn ? (
        <button
          type="button"
          className="btn btn-wide btn-secondary"
          onClick={() => logout()}
        >
          <img src={context?.user?.pfpUrl} alt="pfp" className="w-6 h-6" />
          Sign Out
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-wide btn-secondary"
          onClick={() => signIn()}
        >
          Sign In as {contextFid}
        </button>
      )}
    </div>
  );
}

function Home() {
  const { openUrl } = useFrame();

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
          Warpcast channel
          <button
            onClick={() => openUrl("https://warpcast.com/~/channel/p2p")}
            type="button"
            className="link link-secondary text-lg p-1 active:scale-95 transition-transform"
          >
            here
          </button>
          .
        </p>
      </div>
      <Me />
    </>
  );
}
