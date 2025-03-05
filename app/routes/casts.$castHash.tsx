import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FarcasterEmbed } from "react-farcaster-embed/dist/client";
import { CastErrorComponent } from "~/components/CastError";
import { NotFound } from "~/components/NotFound";
import { fetchCast } from "~/utils/topNcasts";

export const Route = createFileRoute("/casts/$castHash")({
  loader: ({ params: { castHash } }) => fetchCast({ data: { castHash } }),
  errorComponent: CastErrorComponent,
  component: CastComponent,
  notFoundComponent: () => {
    return <NotFound>Cast not found</NotFound>;
  },
});

function CastComponent() {
  const cast = Route.useLoaderData();

  const [showDecodedText, setShowDecodedText] = useState(false);

  if (!cast) {
    return <NotFound>Cast not found</NotFound>;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xl font-bold underline">{cast.username}</h4>
      <div className="flex justify-between items-center w-full">
        <div className="text-sm">{cast.count}</div>
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
      {showDecodedText && <div className="text-lg">{cast.decodedText}</div>}
    </div>
  );
}
