import { createFileRoute } from "@tanstack/react-router";
import { useBearStore } from "~/utils/zustand";

export const Route = createFileRoute("/winner")({
  component: Winner,
});

function Winner() {
  const { bears, addABear } = useBearStore();

  return (
    <div className="p-2">
      <div>Count: {bears}</div>
      <div>
        <button type="button" onClick={() => addABear()}>
          Increment
        </button>
      </div>
    </div>
  );
}
