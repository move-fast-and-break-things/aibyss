import { z } from "zod";
import * as botStore from "~/utils/botstore";

const submitBotCodeSchema = z.object({
  code: z.string(),
});

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, body => submitBotCodeSchema.safeParse(body));
  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: "Username and password field is required" });
  }

  botStore.submitBotCode({
    username: event.context.user.username,
    code: result.data.code,
  });

  return { statusCode: 200 };
});
