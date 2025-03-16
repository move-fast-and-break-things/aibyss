import { LRUCache } from "lru-cache";
import { z } from "zod";
import * as botCodeStore from "~/other/botCodeStore";
import { HTTP_STATUS_CODES } from "~/other/httpStatusCodes";
import { SUBMIT_COOLDOWN_MS } from "~/other/submitApiRatelimitConstants";
import fs from "fs/promises";
import path from "path";

const submitBotCodeSchema = z.object({
  code: z.string(),
});

const RATELIMITER = new LRUCache<string, boolean>({
  ttl: SUBMIT_COOLDOWN_MS,
  max: 5000,
});

export default defineEventHandler(async (event) => {
  const isUserRatelimited = RATELIMITER.get(event.context.user.id);

  if (isUserRatelimited) {
    throw createError({ statusCode: HTTP_STATUS_CODES.TOO_MANY_REQUESTS });
  }

  const result = await readValidatedBody(event, body => submitBotCodeSchema.safeParse(body));
  if (!result.success) {
    throw createError({
      statusCode: HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY,
      statusMessage: "Username and password field is required",
    });
  }
  
  const timestamp = Date.now();
  const filename = `${event.context.user.id}-${timestamp}.js`;
  const latestFilename = `${event.context.user.id}-latest.js`;
  const CODE_VERSIONS_DIR = path.join(process.cwd(), "botCodes");
  const filePath = path.join(CODE_VERSIONS_DIR, filename);
  const latestFilePath = path.join(CODE_VERSIONS_DIR, latestFilename);
  await fs.writeFile(filePath, result.data.code);
  await fs.writeFile(latestFilePath, result.data.code);
  
  botCodeStore.submitBotCode({
    username: event.context.user.username,
    userId: event.context.user.id,
    code: result.data.code,
  });

  RATELIMITER.set(event.context.user.id, true);

  return { status: "submitted" };
});
