import { LRUCache } from "lru-cache";
import { z } from "zod";
import * as botCodeStore from "~/other/botCodeStore";
import { HTTP_STATUS_CODES } from "~/other/httpStatusCodes";
import { SUBMIT_COOLDOWN_MS } from "~/other/submitApiRatelimitConstants";

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

  await prisma.user.update({
    where: { id: event.context.user.id },
    data: { submissionCount: { increment: 1 } },
  });

  botCodeStore.submitBotCode({
    username: event.context.user.username,
    userId: event.context.user.id,
    code: result.data.code,
  });

  RATELIMITER.set(event.context.user.id, true);

  return { status: "submitted" };
});
