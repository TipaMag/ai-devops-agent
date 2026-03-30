import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  telegramToken: process.env.TELEGRAM_TOKEN!,
  allowedUserIds: process.env.TELEGRAM_ALLOWED_USER_IDS ? process.env.TELEGRAM_ALLOWED_USER_IDS.split(",") : [],
  geminiKey: process.env.GEMINI_API_KEY!,
  redisHost: process.env.REDIS_HOST!,
  redisPort: Number(process.env.REDIS_PORT),
};