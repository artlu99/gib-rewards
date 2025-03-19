import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { sort } from "radash";
import { useFrame } from "~/components/context/FrameContext";
import { useSignIn } from "~/hooks/use-sign-in";
import { getTokenBalances } from "~/utils/neynar";

interface FIDBalance {
  token: string;
  balanceUsd: string;
}

const fetchBalances = createServerFn({
  method: "GET",
})
  .validator((d: { fid: number | null }) => d)
  .handler(async ({ data }) => {
    const { fid } = data;
    if (!fid) {
      return [];
    }

    const addressBalances = await getTokenBalances(fid);
    const fidBalances: FIDBalance[] = [];
    for (const addressBalance of addressBalances ?? []) {
      for (const tokenBalance of addressBalance.token_balances ?? []) {
        fidBalances.push({
          token: tokenBalance.token.symbol,
          balanceUsd: tokenBalance.balance.in_usdc,
        });
      }
    }
    // now aggregate the balances by token
    const aggregatedBalances = fidBalances.reduce((acc, curr) => {
      acc[curr.token] = acc[curr.token]
        ? acc[curr.token] + curr.balanceUsd
        : curr.balanceUsd;
      return acc;
    }, {} as Record<string, string>);
    return sort(
      Object.entries(aggregatedBalances).map(([token, balanceUsd]) => ({
        token,
        balanceUsd,
      })),
      (t) => Number(t.balanceUsd),
      true
    ).slice(0, 25);
  });

export const Route = createFileRoute("/whut")({
  component: Home,
});

function Me() {
  const { contextFid, context } = useFrame();
  const { error, logout, signIn, isSignedIn } = useSignIn();

  const { data: balances } = useQuery({
    queryKey: ["balances", contextFid],
    queryFn: () => fetchBalances({ data: { fid: contextFid ?? null } }),
  });

  return (
    <div className="flex flex-col items-center justify-center">
      {error && (
        <p className="text-error">
          {error}
          <br />
        </p>
      )}

      {isSignedIn ? (
        <button
          type="button"
          className="btn btn-wide btn-secondary"
          onClick={() => logout()}
        >
          <img src={context?.user?.pfpUrl} alt="pfp" className="w-6 h-6" />
          Sign Out
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-wide btn-secondary"
          onClick={() => signIn()}
        >
          Sign In as {contextFid}
        </button>
      )}

      <div className="flex flex-col my-8">
        <p className="text-sm">
          Top 3 Token Holdings across FC verified addresses:
        </p>
        {balances?.slice(0, 3).map((balance) => (
          <div key={balance.token}>
            <strong>{balance.token}</strong>: $
            {Number(balance.balanceUsd).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function Home() {
  const { openUrl } = useFrame();

  return (
    <>
      <div className="prose dark:prose-invert p-8">
        <h3>Contest 🏆</h3>
        <p className="text-xl">
          Get paid weekly for content that the most people want to see.
        </p>
        <p> </p>
        <h3>SassyHash 💅</h3>
        <p className="text-sm">
          SassyHash leverages cryptographic building blocks and the open
          Farcaster Protocol, to share restricted-distribution information in
          self-sovereign, transparent, and sufficiently decentralized blah blah.
        </p>
        <p>
          Warpcast channel
          <button
            onClick={() => openUrl("https://warpcast.com/~/channel/p2p")}
            type="button"
            className="link link-secondary text-lg p-1 active:scale-95 transition-transform"
          >
            here
          </button>
          .
        </p>
      </div>
      <Me />
    </>
  );
}
