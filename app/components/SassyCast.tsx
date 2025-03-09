import type { Message } from "@farcaster/core";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { fetcher } from "itty-fetcher";
import { useEffect, useState } from "react";
import { FarcasterEmbed } from "react-farcaster-embed/dist/client";
import { useFrame } from "~/components/context/FrameContext";
import { getStoredToken } from "~/utils/auth";
import { pluralize } from "~/utils/pluralize";
import { logCastDecode } from "~/utils/redis";
import type { LeaderboardCastInfo } from "~/utils/whistles";
import { useBearStore } from "~/utils/zustand";

const MAX_PAGE_SIZE = 100;
const MODERATORS: Record<number, string> = {
  533: "alexpaden",
  3115: "ghostlinkz.eth",
  4163: "kmacb.eth",
  6546: "artlu",
  8004: "ahn.eth",
  10174: "cryptowenmoon.eth",
  10215: "zoo",
  15850: "christin",
  16567: "serendipity",
  191780: "agrimony.eth",
  475488: "hankmoody",
  535389: "xbornid.eth",
};
const MODERATOR_FIDS = Object.keys(MODERATORS).map(Number);

const client = fetcher({ base: "https://nemes.farcaster.xyz:2281" });

interface SassyCastProps {
  cast: LeaderboardCastInfo;
  minMods: number;
}

export const SassyCast = ({ cast, minMods }: SassyCastProps) => {
  const { contextFid, openUrl } = useFrame();
  const [isOpen, setIsOpen] = useState(true);
  const [showDecodedText, setShowDecodedText] = useState(false);
  const [modLikes, setModLikes] = useState<number[]>([]);
  const [currentUserLiked, setCurrentUserLiked] = useState<boolean>();
  const { addExcludedCast } = useBearStore();

  const { data: castLikes = [] } = useQuery({
    queryKey: ["castLikes", cast.fid, cast.castHash],
    queryFn: async () => {
      const res = await client.get<{ messages: Message[] }>(
        `/v1/reactionsByCast?${new URLSearchParams({
          target_fid: cast.fid.toString(),
          target_hash: cast.castHash,
          reaction_type: "1",
          page_size: MAX_PAGE_SIZE.toString(),
        })}`
      );

      const allLikes = res?.messages.map((m) => m.data?.fid ?? 0) || [];

      // Continue with the existing modLikes logic
      const mLikes = allLikes.filter((fid) => MODERATOR_FIDS.includes(fid));

      if ([6546].includes(cast.fid) || mLikes.length < minMods) {
        addExcludedCast(cast.castHash);
      }

      setModLikes(mLikes);
      return allLikes;
    },
    refetchIntervalInBackground: true,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (cast.decodedText && showDecodedText) {
      const token = getStoredToken(contextFid ?? undefined) ?? undefined;

      logCastDecode({
        data: {
          hash: cast.castHash,
          author: {
            fid: cast.fid,
            username: cast.username,
          },
          rootParentUrl: cast.rootParentUrl ?? "null",
          token,
        },
      });
    }
  }, [cast, showDecodedText, contextFid]);

  useEffect(() => {
    if (!contextFid) return;

    if (castLikes.includes(contextFid)) {
      setCurrentUserLiked(true);
      if (cast.decodedText) {
        setIsOpen(false);
      }
    }
  }, [contextFid, castLikes, cast]);

  return (
    <div className="max-w-screen-sm">
      <div className="flex justify-between items-center">
        <div
          className="text-sm"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setIsOpen(!isOpen);
          }}
        >
          {pluralize(cast.count, "unique view")}-{" "}
          {pluralize(modLikes.length, "SassyMod like")}
        </div>

        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => {
              if (cast.decodedText && !showDecodedText) {
                setIsOpen(true);
              }
              setShowDecodedText(!showDecodedText);
            }}
            className="btn btn-ghost btn-sm"
          >
            {currentUserLiked ? (
              <span className="mr-1" aria-label="You liked this cast">
                ❤️
              </span>
            ) : (
              <span className="mr-1" aria-label="You haven't liked this cast">
                🤍
              </span>
            )}
            {cast.decodedText ? (showDecodedText ? "🙈" : "💅") : null}
          </button>
        </div>
      </div>
      <div className="relative">
        <AnimatePresence>
          {showDecodedText && (
            <motion.div
              className="absolute inset-0 z-20 w-full h-full overflow-hidden rounded-xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              <div
                className="w-full h-full 
                bg-gradient-to-br from-[#FFD700] via-[#FFA07A] to-[#DEB887]
                border border-[#FF69B4] shadow-[0_0_70px_-12px] shadow-[#DA70D6]
                relative overflow-hidden flex flex-col rounded-xl"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-[#FFD700] via-[#FFA07A] to-[#DEB887] rounded-xl"
                  animate={{
                    opacity: [0.7, 1, 0.7],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#FFB6C1] via-white to-[#DA70D6] opacity-20 rounded-xl" />

                <p className="text-xl flex-1 flex items-center justify-center p-4 whitespace-pre-wrap overflow-auto text-center relative z-10 text-base-content">
                  {cast.decodedText}
                </p>
                <hr className="border-[#FF69B4]" />
                <div className="text-sm p-2 relative z-10">
                  {modLikes.length > 0 ? (
                    <div>
                      Liked by:{" "}
                      {modLikes.map((fid) => MODERATORS[fid]).join(", ")}
                    </div>
                  ) : (
                    <div>
                      Liked by: {pluralize(modLikes.length, "moderator")}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isOpen && (
          <div
            onClick={() =>
              openUrl(
                `https://warpcast.com/${cast.username}/${cast.castHash.slice(
                  0,
                  8
                )}`
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                openUrl(
                  `https://warpcast.com/${cast.username}/${cast.castHash.slice(
                    0,
                    8
                  )}`
                );
              }
            }}
          >
            <FarcasterEmbed username={cast.username} hash={cast.castHash} />
          </div>
        )}
      </div>
    </div>
  );
};
