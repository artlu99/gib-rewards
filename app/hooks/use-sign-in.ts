import { sdk } from "@farcaster/frame-sdk";
import { useCallback, useState } from "react";
import { useFrame } from "~/components/context/FrameContext";

const MESSAGE_EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days

export const useSignIn = () => {
  const { context, error: contextError } = useFrame();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (contextError) {
        throw new Error(`SDK initialization failed: ${contextError}`);
      }

      if (!context) {
        throw new Error("Contest must be accessed from a Farcaster client!");
      }

      if (!context.user?.fid) {
        throw new Error(
          "No FID found. Please make sure you're logged into Fartcaster."
        );
      }

      const result = await sdk.actions.signIn({
        nonce: Math.random().toString(36).substring(2),
        notBefore: new Date().toISOString(),
        expirationTime: new Date(
          Date.now() + MESSAGE_EXPIRATION_TIME
        ).toISOString(),
      });

      const referrerFid =
        context.location?.type === "cast_embed"
          ? context.location.cast.fid
          : null;

      const res = await fetch("/api/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature: result.signature,
          message: result.message,
          fid: context.user.fid,
          referrerFid,
        }),
      });

      console.log(res);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Sign in failed (specific)");
      }

      const data = await res.json();
      localStorage.setItem(`token-${context.user.fid}`, data.token);
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
  }, [context, contextError]);

  const logout = useCallback(() => {
    localStorage.removeItem(`token-${context?.user.fid}`);
    setIsSignedIn(false);
  }, [context]);

  return { signIn, logout, isSignedIn, isLoading, error };
};
