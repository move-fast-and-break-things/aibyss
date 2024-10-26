import { LRUCache } from "lru-cache";
import { z } from "zod";
import * as botCodeStore from "~/other/botCodeStore";
import { HTTP_STATUS_CODES } from "~/other/httpStatusCodes";
import { SUBMIT_COOLDOWN_MS, SUBMIT_COOLDOWN_SEC } from "~/other/submitApiRatelimitConstants";

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
    throw createError({
      statusCode: HTTP_STATUS_CODES.TOO_MANY_REQUESTS,
      statusMessage: `Teapot needs ${SUBMIT_COOLDOWN_SEC} seconds to think about your code`,
    });
  }

  const result = await readValidatedBody(event, body => submitBotCodeSchema.safeParse(body));
  if (!result.success) {
    throw createError({
      statusCode: HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY,
      statusMessage: "Username and password field is required",
    });
  }

  botCodeStore.submitBotCode({
    username: event.context.user.username,
    userId: event.context.user.id,
    code: result.data.code,
  });

  RATELIMITER.set(event.context.user.id, true);

  return { status: "submitted" };
});
