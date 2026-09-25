import Redis, { RedisOptions } from "ioredis";

const getRedisConfig = (): RedisOptions => {
  if (process.env.REDIS_URL) {
    const url = process.env.REDIS_URL.trim();
    // Use rediss:// or tls for upstash
    const isUpstash = url.includes("upstash.io");
    return {
      maxRetriesPerRequest: null,
      tls: isUpstash || url.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
    };
  }

  // Clean host (remove https://, http://, redis:// if present)
  let rawHost = process.env.REDIS_HOST || "127.0.0.1";
  rawHost = rawHost.replace(/^(https?:\/\/|rediss?:\/\/)/, "").split("/")[0].split(":")[0];

  const port = Number(process.env.REDIS_PORT) || 6379;
  const password = process.env.REDIS_PASSWORD || undefined;
  const isUpstash = rawHost.includes("upstash.io");
  const useTls = isUpstash || process.env.REDIS_TLS === "true";

  return {
    host: rawHost,
    port,
    password,
    tls: useTls ? { rejectUnauthorized: false } : undefined,
    maxRetriesPerRequest: null,
  };
};

const redisOptions = getRedisConfig();
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL.trim(), redisOptions)
  : new Redis(redisOptions);

redis.on("connect", () => {
  console.log("✅ Redis Connected Successfully");
});

redis.on("error", (err) => {
  console.error("❌ Redis Error:", err.message);
});

export default redis;