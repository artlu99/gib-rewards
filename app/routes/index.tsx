import { createFileRoute } from "@tanstack/react-router";
import { useFrame } from "~/components/context/FrameContext";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { openUrl } = useFrame();

  return (
    <div className="prose dark:prose-invert p-2">
      <h3>Contest 🏆</h3>
      <p>Weekly contest to elevate the sassiest hashes.</p>
      <h3>SassyHash 💅</h3>
      <p>
        SassyHash leverages cryptographic building blocks and the open Farcaster
        Protocol, to share restricted-distribution information in
        self-sovereign, transparent, and sufficiently decentralized blah blah.
      </p>
      <p>
        Read more
        <button
          onClick={() => openUrl("https://sassyhash.artlu.xyz/blog")}
          type="button"
        >
          here
        </button>
      </p>
    </div>
  );
}
