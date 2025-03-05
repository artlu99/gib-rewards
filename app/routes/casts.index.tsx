import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/casts/")({
  component: CastsIndexComponent,
});

function CastsIndexComponent() {
  return <div>Select a SassyHash cast.</div>;
}
