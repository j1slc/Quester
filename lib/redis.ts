// Minimal Redis client over the Upstash / Vercel KV REST API.
// Uses plain fetch, so no extra dependency is required.
//
// Env vars (either pair works):
//   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//   KV_REST_API_URL        + KV_REST_API_TOKEN

export type RedisCommand = (string | number)[];

function getConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

export function isRedisConfigured(): boolean {
  return getConfig() !== null;
}

export async function redisPipeline(commands: RedisCommand[]): Promise<any[]> {
  const config = getConfig();
  if (!config) throw new Error("Redis is not configured");

  const res = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Redis request failed (${res.status})`);

  const data = (await res.json()) as { result?: any; error?: string }[];
  return data.map((item) => {
    if (item.error) throw new Error(item.error);
    return item.result;
  });
}

export async function redis(...command: RedisCommand): Promise<any> {
  const [result] = await redisPipeline([command]);
  return result;
}
