import { intlFormatDistance } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FarcasterEmbed } from "react-farcaster-embed/dist/client";
import { useFrame } from "~/components/context/FrameContext";
import { getStoredToken } from "~/utils/auth";
import { ModeratorsMap } from "~/utils/moderators";
import { pluralize } from "~/utils/pluralize";
import { logCastDecode } from "~/utils/redis";
import type { LeaderboardCastInfo } from "~/utils/whistles";
import { BLOCKLIST } from "~/utils/whistles";
import { useBearStore } from "~/utils/zustand";

interface SassyCastProps {
  cast: LeaderboardCastInfo;
  minMods: number;
  likesData?: {
    allLikes: number[];
    modLikes: number[];
    followingLikes: number[];
  };
  lastLikedTime: number | null;
}

export const SassyCast = ({
  cast,
  minMods,
  likesData,
  lastLikedTime,
}: SassyCastProps) => {
  const { contextFid, openUrl } = useFrame();
  const [isOpen, setIsOpen] = useState(false);
  const [showDecodedText, setShowDecodedText] = useState(false);
  const [currentUserLiked, setCurrentUserLiked] = useState<boolean>();
  const { addExcludedCast } = useBearStore();

  // If likesData is provided, use it instead of fetching
  const modLikes = likesData?.modLikes || [];
  const followingLikes = likesData?.followingLikes || [];
  const castLikes = likesData?.allLikes || [];

  // Remove the useQuery for castLikes since data is now passed in

  useEffect(() => {
    if (modLikes.length > 0) {
      if (BLOCKLIST.includes(cast.fid) || modLikes.length < minMods) {
        addExcludedCast(cast.castHash);
      }
    }
  }, [modLikes, addExcludedCast, cast, minMods]);

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
          {
            <>
              <br />
              {lastLikedTime
                ? `last liked ${intlFormatDistance(lastLikedTime, new Date())}`
                : ""}
            </>
          }
          {
            <>
              <br />
              {`${followingLikes.length.toLocaleString()}/${pluralize(
                castLikes.length,
                "like"
              )}`}{" "}
              by accounts I follow
            </>
          }
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
                      {modLikes.map((fid) => ModeratorsMap[fid]).join(", ")}
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
