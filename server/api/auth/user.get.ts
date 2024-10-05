import * as botCodeStore from "~/other/botCodeStore";

export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const botCodes = botCodeStore.getBots();
  const userCode = Object.values(botCodes).find(bot => bot.username === event.context.user.username)?.code;

  return {
    statusCode: 200,
    body: {
      code: userCode,
      username: event.context.user.username as string,
    },
  };
});
