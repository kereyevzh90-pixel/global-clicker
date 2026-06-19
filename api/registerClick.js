import { createClient } from "redis";

const TITLES = [
  "Мастер Облаков",
  "Удачливый кликер",
  "Разрушитель кнопок",
  "Король Клика",
  "Легенда Интернета",
];

let client;

async function getClient() {
  if (!client) {
    client = createClient({ url: process.env.REDIS_URL });
    await client.connect();
  }
  return client;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не поддерживается" });
  }

  const redis = await getClient();
  const count = await redis.incr("clickCount");

  let title = null;
  if (count % 50 === 0) {
    title = TITLES[Math.floor(Math.random() * TITLES.length)];
  }

  return res.status(200).json({ count, title });
}
