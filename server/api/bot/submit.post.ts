import { LRUCache } from "lru-cache";
import { z } from "zod";
import * as botCodeStore from "~/other/botCodeStore";
import { HTTP_STATUS_CODES } from "~/other/httpStatusCodes";
import { SUBMIT_COOLDOWN_MS } from "~/other/submitApiRatelimitConstants";
import { promises as fs } from "fs";
import { join } from "path";

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

  const userId = event.context.user.id;
  const botCodesDir = join(process.cwd(), 'botCodes');
  await fs.mkdir(botCodesDir, { recursive: true });
  const timestamp = Date.now();
  const versionFilename = join(botCodesDir, `${userId}-${timestamp}.js`);
  const latestFilename = join(botCodesDir, `${userId}-latest.js`);
  await fs.writeFile(versionFilename, result.data.code, "utf8");
  await fs.writeFile(latestFilename, result.data.code, "utf8");

  RATELIMITER.set(event.context.user.id, true);

  return { status: "submitted" };
});
