import { getRedisClient } from "../lib/redisClient.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не поддерживается" });
  }

  const redis = await getRedisClient();
  const userId = req.body && req.body.userId;
  const nickname = req.body && req.body.nickname && req.body.nickname.trim();

  if (!userId || !nickname) {
    return res.status(400).json({ error: "Нужны userId и nickname" });
  }

  const existingOwner = await redis.hGet("nicknameOwners", nickname);
  if (existingOwner && existingOwner !== userId) {
    return res.status(200).json({ occupied: true });
  }

  const previousNickname = await redis.hGet("userNicknames", userId);
  if (previousNickname && previousNickname !== nickname) {
    await redis.hDel("nicknameOwners", previousNickname);
  }

  await redis.hSet("nicknameOwners", nickname, userId);
  await redis.hSet("userNicknames", userId, nickname);

  return res.status(200).json({ occupied: false, nickname });
}
