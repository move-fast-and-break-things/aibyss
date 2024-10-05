import { z } from "zod";
import * as botCodeStore from "~/other/botCodeStore";

const submitBotCodeSchema = z.object({
  code: z.string(),
});

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, body => submitBotCodeSchema.safeParse(body));
  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: "Username and password field is required" });
  }

  botCodeStore.submitBotCode({
    username: event.context.user.username,
    userId: event.context.user.id,
    code: result.data.code,
  });

  return { statusCode: 200 };
});
