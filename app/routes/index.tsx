import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
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
        Read more <a href="https://sassyhash.artlu.xyz/blog"> here</a>
      </p>
    </div>
  );
}
