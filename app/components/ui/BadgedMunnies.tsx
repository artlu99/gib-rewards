import { useFrame } from "~/components/context/FrameContext";
import { useBearStore } from "~/utils/zustand";

export function BadgedMunnies() {
  const { contextFid } = useFrame();
  const { winners } = useBearStore();

  const munny = winners.find((w) => w.fid === contextFid)?.payout ?? 0;

  return (
    <div className="relative">
      <span className="text-xl">💰</span>
      {munny > 0 ? (
        <span className="badge badge-lg badge-success absolute bottom-1/2 left-1/2 -translate-x-1/2">
          ${munny.toFixed(2)}
        </span>
      ) : null}
      <br />
      Munnies
    </div>
  );
}
