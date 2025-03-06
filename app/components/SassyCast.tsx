import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { FarcasterEmbed } from "react-farcaster-embed/dist/client";
import { useFrame } from "~/components/context/FrameContext";
import type { LeaderboardCastInfo } from "~/utils/whistles";

interface SassyCastProps {
  cast: LeaderboardCastInfo;
}

export const SassyCast = ({ cast }: SassyCastProps) => {
  const { openUrl } = useFrame();
  const [showDecodedText, setShowDecodedText] = useState(false);

  return (
    <div className="max-w-screen-sm">
      <div className="flex justify-between items-center">
        <div className="text-sm">{cast.count} attempted views (raw)</div>
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
