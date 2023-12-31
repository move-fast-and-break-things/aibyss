import * as botUtils from "~/utils/botstore";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const code = body.code;

  botUtils.submitBot(code);

  return { statusCode: 200 };
});
