import { LRUCache } from "lru-cache";

export const SESSION_TTL = 1000 * 60 * 24 * 7; // session TTL in milliseconds
export const SESSION_COOKIE_NAME = "session_id";

export const SESSION_STORAGE = new LRUCache<string, number>({
  ttl: SESSION_TTL,
  max: 5000,
});
