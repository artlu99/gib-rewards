import type {
  FrameContext,
  SafeAreaInsets,
} from "@farcaster/frame-core/dist/context";
import sdk from "@farcaster/frame-sdk";
import { useCallback, useEffect, useState } from "react";

const LOCAL_DEBUGGING = import.meta.env.DEV;
export const LOCAL_GDD_MODE_FID = 6546;

export const useFrame = () => {
  const [context, setContext] = useState<FrameContext | null>(null);
  const [safeAreaInsets, setSafeAreaInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const context = await sdk.context;
        if (context) {
          if (context.client?.safeAreaInsets) {
            setSafeAreaInsets(context.client.safeAreaInsets);
          }
          setContext(context as FrameContext);
        } else {
          setError("Failed to load Farcaster context");
        }
        await sdk.actions.ready();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to initialize SDK"
        );
        console.error("SDK initialization error:", err);
      }
    };

    if (sdk && !isSDKLoaded) {
      load().then(() => {
        setIsSDKLoaded(true);
      });
    }
  }, [isSDKLoaded]);

  const contextFid = context?.user?.fid ?? LOCAL_DEBUGGING ? LOCAL_GDD_MODE_FID : null;
  const isWarpcast = context?.client?.clientFid === 9152;
  const isInstalled = context?.client?.added ?? false;
  const isNotificationsEnabled =
    context?.client?.notificationDetails?.token !== undefined;

  const openUrl = useCallback(
    (url: string) => {
      context ? sdk.actions.openUrl(url) : window.open(url, "_blank");
    },
    [context]
  );

  const viewProfile = useCallback(
    (fid: number, username?: string) => {
      const profileUrl = username
        ? `https://warpcast.com/${username}`
        : `https://vasco.wtf/${fid}`;

      isWarpcast
        ? sdk.actions.viewProfile({ fid })
        : context
        ? sdk.actions.openUrl(profileUrl)
        : window.open(profileUrl, "_blank");
    },
    [context, isWarpcast]
  );

  return {
    context,
    safeAreaInsets,
    isSDKLoaded,
    contextFid,
    isInstalled,
    isNotificationsEnabled,
    error,
    openUrl,
    viewProfile,
  };
};
