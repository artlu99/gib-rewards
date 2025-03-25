import dotenv from "dotenv";
import { getUsers } from "../app/utils/neynar";

dotenv.config();

const json = {
  winners: [
    {
      fid: 644823,
      username: "0xkesha",
      rawScore: 22,
      smoothScore: 18.836579051786785,
      numCasts: 2,
      payout: 11.019504293923909,
    },
    {
      fid: 535389,
      username: "xbornid.eth",
      rawScore: 11,
      smoothScore: 11.919974893325639,
      numCasts: 2,
      payout: 8.809202289681823,
    },
    {
      fid: 1355,
      username: "bias",
      rawScore: 12,
      smoothScore: 10.393790742997695,
      numCasts: 1,
      payout: 8.321487826192433,
    },
    {
      fid: 10174,
      username: "cryptowenmoon.eth",
      rawScore: 11,
      smoothScore: 10.044807461235466,
      numCasts: 1,
      payout: 8.209965115125843,
    },
    {
      fid: 8004,
      username: "ahn.eth",
      rawScore: 9,
      smoothScore: 8.880083136474816,
      numCasts: 1,
      payout: 7.837760424727492,
    },
    {
      fid: 234616,
      username: "pichi",
      rawScore: 9,
      smoothScore: 8.880083136474816,
      numCasts: 1,
      payout: 7.837760424727492,
    },
    {
      fid: 3115,
      username: "ghostlinkz.eth",
      rawScore: 7,
      smoothScore: 7.003858734713214,
      numCasts: 1,
      payout: 7.238185480056343,
    },
    {
      fid: 875987,
      username: "i-d0-care",
      rawScore: 6,
      smoothScore: 6.106153679378548,
      numCasts: 1,
      payout: 6.951310701976528,
    },
    {
      fid: 380950,
      username: "lovejoy",
      rawScore: 6,
      smoothScore: 6.106153679378548,
      numCasts: 1,
      payout: 6.951310701976528,
    },
    {
      fid: 997390,
      username: "lomonn",
      rawScore: 6,
      smoothScore: 6.106153679378548,
      numCasts: 1,
      payout: 6.951310701976528,
    },
    {
      fid: 538667,
      username: "lixzon",
      rawScore: 5,
      smoothScore: 5.4141425326944805,
      numCasts: 1,
      payout: 6.730168420384117,
    },
    {
      fid: 476033,
      username: "torii-stories",
      rawScore: 4,
      smoothScore: 4.916116158612425,
      numCasts: 1,
      payout: 6.571016809625479,
    },
    {
      fid: 646397,
      username: "trizsamae",
      rawScore: 4,
      smoothScore: 4.916116158612425,
      numCasts: 1,
      payout: 6.571016809625479,
    },
  ],
  rulesConfig: {
    topN: 15,
    totalPool: 100,
    minPayout: 5,
    minMods: 2,
    vector: {
      views: 1,
      likes: 0,
      replies: 0,
    },
  },
  timestamp: 1742913023679,
};

console.log("fid,username,USDC,DEGEN,BURRITO,primary");
for await (const winner of json.winners) {
  const { fid, username, payout } = winner;

  const usdc = (payout * 0.6).toFixed(2);
  const degen = (payout * 0.3).toFixed(2);
  const burrito = (payout * 0.1).toFixed(2);

  const user = await getUsers([fid]);
  const primary = user.users[0].verified_addresses.primary.eth_address;

  console.log([fid, username, usdc, degen, burrito, primary].join(","));
}
