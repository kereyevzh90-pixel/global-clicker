import { kv } from "@vercel/kv";

const TITLES = [
  "Мастер Облаков",
  "Удачливый кликер",
  "Разрушитель кнопок",
  "Король Клика",
  "Легенда Интернета",
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не поддерживается" });
  }

  const count = await kv.incr("clickCount");

  let title = null;
  if (count % 50 === 0) {
    title = TITLES[Math.floor(Math.random() * TITLES.length)];
  }

  return res.status(200).json({ count, title });
}
