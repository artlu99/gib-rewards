import { Redis } from "@upstash/redis/cloudflare";
import dotenv from "dotenv";
import { execSync } from "node:child_process";
import { sort, unique } from "radash";

const DO_NOT_RUN = false;

const env = dotenv.config().parsed;
if (!env) {
  throw new Error(
    "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set"
  );
}

const spamLabelsRedis = new Redis({
  url: env.YOGA_REDIS_REST_URL,
  token: env.YOGA_REDIS_REST_TOKEN,
});

const spamLabelsKey = () => "gib-rewards:labels";

const getCachedSpamLabel = async (fid: number) => {
  const spamLabel = (await spamLabelsRedis.hget(
    spamLabelsKey(),
    fid.toString()
  )) as string | null;
  if (spamLabel !== null) {
    return spamLabel;
  }
  try {
    const spamLabelFresh = execSync(`./scripts/spam-labels.sh ${fid}`)
      .toString()
      .trim();
    console.log("fetched", fid, spamLabelFresh);
    await spamLabelsRedis.hset(spamLabelsKey(), {
      [fid.toString()]: spamLabelFresh,
    });
    await spamLabelsRedis.expire(spamLabelsKey(), 60 * 60 * 24 * 1); // 1 day
    return spamLabelFresh;
  } catch (e) {
    console.error(e);
  }
};

if (!DO_NOT_RUN) {
  const usage = await spamLabelsRedis.hgetall("action-usage");
  if (!usage) {
    console.log("No usage data found");
    process.exit(1);
  }
  const fids = unique(
    sort(
      Object.entries(usage).map(([key]) => Number(key.split("-")[0])),
      (fid) => fid,
      false
    )
  ).slice(0, 1000);

  for (const fid of fids) {
    const spamLabel = await getCachedSpamLabel(fid);
    console.log(fid, spamLabel);
  }
}
