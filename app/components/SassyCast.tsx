import type { Message } from "@farcaster/core";
import { AnimatePresence, motion } from "framer-motion";
import { fetcher } from "itty-fetcher";
import { useEffect, useState } from "react";
import { FarcasterEmbed } from "react-farcaster-embed/dist/client";
import { useFrame } from "~/components/context/FrameContext";
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

const pluralize = (count: number, singular: string, plural?: string) =>
  count === 1
    ? `${count} ${singular}`
    : `${count.toLocaleString()} ${plural ?? `${singular}s`}`;

interface SassyCastProps {
  cast: LeaderboardCastInfo;
}

export const SassyCast = ({ cast }: SassyCastProps) => {
  const { openUrl } = useFrame();
  const [showDecodedText, setShowDecodedText] = useState(false);
  const [modLikes, setModLikes] = useState<number[]>([]);
  const { addExcludedCast } = useBearStore();

  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore the set state functions
  useEffect(() => {
    const fetchLikes = async () => {
      const res = await client.get<{ messages: Message[] }>(
        `/v1/reactionsByCast?${new URLSearchParams({
          target_fid: cast.fid.toString(),
          target_hash: cast.castHash,
          reaction_type: "1",
          page_size: MAX_PAGE_SIZE.toString(),
        })}`
      );

      const modLikes =
        res?.messages
          .map((m) => m.data?.fid ?? 0)
          .filter((fid) => MODERATOR_FIDS.includes(fid)) ?? [];

      if ([6546].includes(cast.fid) || modLikes.length < 1) {
        addExcludedCast(cast.castHash);
      }
      setModLikes(modLikes);
    };
    fetchLikes();
  }, [cast]);

  return (
    <div className="max-w-screen-sm">
      <div className="flex justify-between items-center">
        <div className="text-sm">
          {pluralize(cast.count, "attempted view")} (raw) -{" "}
          {pluralize(modLikes.length, "SassyMod like")}
        </div>
        <button
          type="button"
          onClick={() => setShowDecodedText(true)}
          className="btn btn-ghost btn-sm"
        >
          {cast.decodedText ? "💅" : null}
        </button>
      </div>

      <AnimatePresence>
        {showDecodedText && (
          <motion.dialog
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
              },
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="modal modal-open"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowDecodedText(false);
            }}
          >
            <motion.div
              className="modal-box w-[95vw] h-[70vh] max-w-none flex flex-col 
                bg-gradient-to-br from-[#FFD700]/60 via-[#FFA07A]/50 to-[#DEB887]/60
                after:absolute after:inset-0 after:bg-gradient-to-tr after:from-[#F4C430]/40 after:via-[#FFB6C1]/30 after:to-[#DEB887]/50
                border border-[#FF69B4]/30 shadow-[0_0_70px_-12px] shadow-[#DA70D6]/40
                overflow-hidden"
              initial={{ y: 50 }}
              animate={{
                y: 0,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                },
              }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-[#FFD700]/60 via-[#FFA07A]/40 to-[#DEB887]/60"
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#FFB6C1]/30 via-transparent to-[#DA70D6]/30" />
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 hover:bg-[#FF69B4]/30 z-10 text-base-content"
                onClick={() => setShowDecodedText(false)}
              >
                ✕
              </button>
              <p className="text-2xl flex-1 flex items-center justify-center p-8 break-all whitespace-pre-wrap overflow-auto text-center relative z-10 text-base-content">
                {cast.decodedText}
              </p>
              <hr />
              <div className="text-sm">
                {modLikes.length > 0 ? (
                  <div>
                    Liked by:{" "}
                    {modLikes.map((fid) => MODERATORS[fid]).join(", ")}
                  </div>
                ) : (
                  <div>Liked by: {pluralize(modLikes.length, "moderator")}</div>
                )}
              </div>
            </motion.div>
          </motion.dialog>
        )}
      </AnimatePresence>

      <div
        onClick={() =>
          openUrl(
            `https://warpcast.com/${cast.username}/${cast.castHash.slice(0, 8)}`
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
    </div>
  );
};
