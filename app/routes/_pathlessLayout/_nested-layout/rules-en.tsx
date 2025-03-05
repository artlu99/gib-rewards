import { createFileRoute } from "@tanstack/react-router";
import {
  Caret,
  Route as parentRoute,
} from "~/routes/_pathlessLayout/_nested-layout";

export const Route = createFileRoute(
  "/_pathlessLayout/_nested-layout/rules-en"
)({
  component: LayoutAComponent,
});

function LayoutAComponent() {
  const { rulesConfig } = parentRoute.useLoaderData();
  const { topN, totalPool, minPayout, minMods, vector } = rulesConfig;

  return (
    <div className="prose dark:prose-invert flex flex-col gap-4">
      <details open className="group w-full">
        <summary className="flex w-full cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-900">
          <span className="text-lg sm:text-xl font-bold">Rules</span>
          <Caret />
        </summary>
        <details open className="group w-full">
          <summary className="flex w-full cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-900">
            <span className="text-lg sm:text-xl font-bold">General</span>
            <Caret />
          </summary>
          <div className="prose dark:prose-invert prose-neutral mt-4 px-3 pb-4 max-w-none">
            <ul>
              <li>Weekly contest, same time frame as Warpcast Rewards</li>
              <li>
                <strong>{topN}</strong> most engaging SassyHash will share a{" "}
                <strong>${totalPool}</strong> pool
              </li>
              <li>One user can win rewards for multiple casts</li>
              <li>
                Attempts to farm/game are welcome, and will be rewarded! <br />
                We learn in public
              </li>
              <li>
                Anti-collusion based on "decentralized retroactive delegation"
              </li>
            </ul>
          </div>
        </details>
        <details className="group w-full">
          <summary className="flex w-full cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-900">
            <span className="text-lg sm:text-xl font-bold">💲🎩🌯 Payment</span>
            <Caret />
          </summary>
          <div className="prose dark:prose-invert prose-neutral mt-4 px-3 pb-4 max-w-none">
            <ul>
              <li>
                Minimum payout is <strong>${minPayout}</strong> per FID on the
                Leaderboard
              </li>
              <li>
                Payment to your last verified Ethereum address (generally, your
                Warpcast Wallet)
              </li>
              <ul>
                <li>60% $USDC on Base</li>
                <li>30% $DEGEN on Degen L3</li>
                <li>10% $BURRITO on Base</li>
              </ul>
              <li>
                Maximum payout is <strong>${totalPool}</strong> (if you made all
                Top {topN} casts for the week)
              </li>
            </ul>
          </div>
        </details>
        <details className="group w-full">
          <summary className="flex w-full cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-900">
            <span className="text-lg sm:text-xl font-bold">Anti-Farmer 🕵️‍♀️</span>
            <Caret />
          </summary>
          <div className="prose dark:prose-invert prose-neutral mt-4 px-3 pb-4 max-w-none">
            <ul>
              <li>
                Each cast qualifies by getting a minimum number of likes by
                SassyMods 💁‍♀️ / Sassquatch 🦧
              </li>
              <li>
                Starts at <strong>{minMods}</strong>, will increase as necessary
              </li>
              <li>No individual moderator has outsized influence</li>
              <li>
                Mods are free to accept bribes and collude, but may be called
                out and excluded
              </li>
              <li>There is no veto I love you</li>
            </ul>
          </div>
        </details>
        <details className="group w-full">
          <summary className="flex w-full cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-900">
            <span className="text-lg sm:text-xl font-bold">📊 Nerds</span>
            <Caret />
          </summary>
          <div className="prose dark:prose-invert prose-neutral mt-4 px-3 pb-4 max-w-none">
            <ul>
              <li>Raw score for each cast: </li>
              <ol>
                <li>views x {vector.views.toLocaleString()}</li>
                <li>SassyMod likes: x {vector.likes.toLocaleString()}</li>
                <li>
                  replies by other users, that get liked by original caster: x{" "}
                  {vector.replies.toLocaleString()}
                </li>
              </ol>
              <li>Raw score ➡️ Smooth score via arctan function 🤓</li>
              <ul>
                <li>takes from extremes, moves them to the middle</li>
                <li>
                  rewards repetition more than high notes (already rewarded
                  enough)
                </li>
              </ul>
              <li>
                <strong>${minPayout}</strong> is allocated to each unique FID on
                the leaderboard
              </li>
              <li>
                <strong>Rest of pool</strong> distributed pro-rata according to
                the smooth score
              </li>
            </ul>
          </div>

          <details className="group w-full">
            <summary className="flex w-full cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-900">
              <span className="text-lg sm:text-xl font-bold">
                wat is $BURRITO
              </span>
              <Caret />
            </summary>
            <div className="prose dark:prose-invert prose-neutral mt-4 px-3 pb-4 max-w-none">
              <ul>
                <li>
                  🌯 BURROTI is a [
                  <a
                    href="https://www.clanker.world/clanker/0x097745F2FB83C104543F93E528B455FC3cE392b6"
                    target="_blank"
                    rel="noreferrer"
                  >
                    clanker v0
                  </a>
                  ], and my personal Fan Token.
                </li>
                <li>CA: 0x097745F2FB83C104543F93E528B455FC3cE392b6 [Base]</li>
                <li>
                  I received zero tokens at launch, and traded against snipers
                  to get my allocation. I market buy more tokens with all my
                  trading fees.
                </li>
                <li>
                  Swap your tokens; do whatever you want with them. I will
                  market buy whatever I give out.
                </li>
              </ul>
            </div>
          </details>
        </details>
      </details>
    </div>
  );
}
