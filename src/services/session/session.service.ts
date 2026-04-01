import Redis from "ioredis";
import { config } from "../../config";

let redis: Redis | null = null;
let redisAvailable = false;

// In-memory fallback
const memoryStore = new Map<number, any>();

try {
  redis = new Redis({
    host: config.redisHost,
    port: config.redisPort,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  redis.on("error", () => {
    redisAvailable = false;
  });

  redis.on("connect", () => {
    redisAvailable = true;
    console.log("Redis connected");
  });

  redis.connect().catch(() => {
    redisAvailable = false;
  });

} catch {
  redisAvailable = false;
}



export interface Session {
  messages: any[];
}

export async function getSession(chatId: number): Promise<Session> {
  if (redisAvailable && redis) {
    try {
      const data = await redis.get(`session:${chatId}`);
      return data ? JSON.parse(data) : { messages: [] };
    } catch {
      redisAvailable = false;
    }
  }

  // fallback
  return memoryStore.get(chatId) || { messages: [] };
}

export async function saveSession(chatId: number, session: Session) {
  if (redisAvailable && redis) {
    try {
      await redis.set(`session:${chatId}`, JSON.stringify(session));
      return;
    } catch {
      redisAvailable = false;
    }
  }

  // fallback
  memoryStore.set(chatId, session);
}