import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useFrame } from "~/components/context/FrameContext";
import { useSignIn } from "~/hooks/use-sign-in";
export const Route = createFileRoute("/casts/")({
  component: PostsIndexComponent,
});

function PostsIndexComponent() {
  const { context } = useFrame();
  const { signIn, isSignedIn } = useSignIn();

  useEffect(() => {
    if (context?.user) return;
    if (!isSignedIn) {
      signIn();
    }
  }, [context, isSignedIn, signIn]);

  return <div>Select a SassyHash cast.</div>;
}
