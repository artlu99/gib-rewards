import { sdk } from "@farcaster/frame-sdk";
import { useCallback, useState } from "react";
import { useFrame } from "~/components/context/FrameContext";

const MESSAGE_EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days

const LOCAL_DEBUGGING = import.meta.env.DEV;

export const useSignIn = () => {
  const { context, contextFid, error: contextError } = useFrame();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem(`token-${contextFid}`);
    setIsSignedIn(false);
  }, [contextFid]);

  const signIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!LOCAL_DEBUGGING) {
        if (contextError) {
          throw new Error(`SDK initialization failed: ${contextError}`);
        }

        if (!contextFid) {
          throw new Error(
            "No FID found. Please make sure you're logged into Fartcaster."
          );
        }
      }

      const result = !LOCAL_DEBUGGING
        ? await sdk.actions.signIn({
            nonce: Math.random().toString(36).substring(2),
            notBefore: new Date().toISOString(),
            expirationTime: new Date(
              Date.now() + MESSAGE_EXPIRATION_TIME
            ).toISOString(),
          })
        : { signature: "0x123", message: "0x123" };

      const referrerFid =
        context?.location?.type === "cast_embed"
          ? context?.location.cast.fid
          : null;

      const res = await fetch("/api/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature: result.signature,
          message: result.message,
          fid: contextFid,
          referrerFid,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Sign in failed (specific)");
      }

      const data = await res.json();
      localStorage.setItem(`token-${contextFid}`, data.token);
      setIsSignedIn(true);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign in failed (general)";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [context, contextFid, contextError]);

  return { logout, signIn, isSignedIn, isLoading, error };
};
