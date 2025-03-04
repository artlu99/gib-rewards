import { createFileRoute } from "@tanstack/react-router";
import { useFrame } from "~/components/context/FrameContext";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { context } = useFrame();

  return (
    <div className="prose prose-dark p-2">
      <h3>Contest | SassyHash 💅</h3>
      {context ? <div>NotLiveFrame</div> : <div>LiveFrame</div>}
    </div>
  );
}
