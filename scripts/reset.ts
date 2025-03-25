import { Redis } from "@upstash/redis/cloudflare";
import dotenv from "dotenv";
import { cluster } from "radash";

const DO_NOT_RUN = false;
const DO_NOT_DELETE = true;

const env = dotenv.config().parsed;
if (!env) {
  throw new Error(
    "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set"
  );
}

const viewsRedis = new Redis({
  url: env.YOGA_REDIS_REST_URL,
  token: env.YOGA_REDIS_REST_TOKEN,
});

const usageKey = () => "action-usage";
const getAllInterationsKeys = async () => {
  let cursor = 0;
  const keys = new Set<string>();

  do {
    const [nextCursor, batch] = await viewsRedis.scan(cursor, {
      match: "interactions-0x*",
      count: 100,
    });

    for (const key of batch) {
      keys.add(key);
    }
    cursor = Number.parseInt(nextCursor);
  } while (cursor !== 0);

  return Array.from(keys);
};

if (!DO_NOT_RUN) {
  const keys = await getAllInterationsKeys();
  console.log(keys.length, "interactions");

  if (!DO_NOT_DELETE) {
    await viewsRedis.del(usageKey());

    for (const keyChunk of cluster(keys, 100)) {
      await viewsRedis.del(...keyChunk);
    }
  } else {
    console.log("set DO_NOT_DELETE to false to delete interactions");
  }
} else {
  console.log("set DO_NOT_RUN to false to delete interactions");
}
