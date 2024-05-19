import { LRUCache } from "lru-cache";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
export const SESSION_TTL_MILLISECONDS = SESSION_TTL_SECONDS * 1000;
export const SESSION_COOKIE_NAME = "session_id";

export const SESSION_STORAGE = new LRUCache<string, number>({
  ttl: SESSION_TTL_MILLISECONDS,
  max: 5000,
});
