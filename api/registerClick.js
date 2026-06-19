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
  return entries.map((entry) => ({ nickname: entry.value, clicks: entry.score }));
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

  const nickname = (req.body && req.body.nickname) || "Игрок";

  const count = await redis.incr("clickCount");
  await redis.zIncrBy("leaderboard", 1, nickname);
  const leaderboard = await getTopLeaders(redis);

  let title = null;
  if (count % 50 === 0) {
    title = TITLES[Math.floor(Math.random() * TITLES.length)];
  }

  return res.status(200).json({ count, title, leaderboard });
}
