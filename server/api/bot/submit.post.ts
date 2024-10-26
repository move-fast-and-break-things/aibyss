import { z } from "zod";
import * as botCodeStore from "~/other/botCodeStore";

const submitBotCodeSchema = z.object({
  code: z.string(),
});

const rateLimit = new Map<string, number>();
const RATE_LIMIT_THRESHOLD_IN_MILLIS = 4000;

export default defineEventHandler(async (event) => {
  const lastRequestTime = rateLimit.get(event.context.user.id);

  if (lastRequestTime && Date.now() - lastRequestTime <= RATE_LIMIT_THRESHOLD_IN_MILLIS) {
    return { statusCode: 429, statusMessage: "Teapot needs 4 seconds to think about your code" };
  }

  const result = await readValidatedBody(event, body => submitBotCodeSchema.safeParse(body));
  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: "Username and password field is required" });
  }

  botCodeStore.submitBotCode({
    username: event.context.user.username,
    userId: event.context.user.id,
    code: result.data.code,
  });

  rateLimit.set(event.context.user.id, Date.now());

  return { statusCode: 200 };
});
