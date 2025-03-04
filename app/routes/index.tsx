import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="prose p-2">
      <h3>Contest | SassyHash 💅</h3>
    </div>
  );
}
