import { getRedisClient } from "../lib/redisClient.js";

const ACTIVE_WINDOW_MS = 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не поддерживается" });
  }

  const redis = await getRedisClient();
  const clientId = (req.body && req.body.clientId) || "anonymous";
  const now = Date.now();

  await redis.zAdd("online", { score: now, value: clientId });
  await redis.zRemRangeByScore("online", 0, now - ACTIVE_WINDOW_MS);
  const online = await redis.zCard("online");

  return res.status(200).json({ online });
}
