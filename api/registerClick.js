import { getRedisClient } from "../lib/redisClient.js";

const TITLES = [
  "Мастер Облаков",
  "Удачливый кликер",
  "Разрушитель кнопок",
  "Король Клика",
  "Легенда Интернета",
];

async function getTopLeaders(redis) {
  const entries = await redis.zRangeWithScores("leaderboard", 0, 2, { REV: true });
  const leaders = [];
  for (const entry of entries) {
    const nickname = (await redis.hGet("userNicknames", entry.value)) || "Игрок";
    leaders.push({ nickname, clicks: entry.score });
  }
  return leaders;
}

export default async function handler(req, res) {
  const redis = await getRedisClient();

  if (req.method === "GET") {
    const current = Number((await redis.get("clickCount")) || 0);
    const leaderboard = await getTopLeaders(redis);
    return res.status(200).json({ count: current, title: null, leaderboard });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не поддерживается" });
  }

  const userId = (req.body && req.body.userId) || "anonymous";
  const amount = Math.max(1, Number(req.body && req.body.amount) || 1);

  const count = await redis.incrBy("clickCount", amount);
  await redis.zIncrBy("leaderboard", amount, userId);
  const leaderboard = await getTopLeaders(redis);

  let title = null;
  if (Math.floor(count / 50) > Math.floor((count - amount) / 50)) {
    title = TITLES[Math.floor(Math.random() * TITLES.length)];
  }

  return res.status(200).json({ count, title, leaderboard });
}
