import * as botCodeStore from "~/other/botCodeStore";

export default defineEventHandler(async (event) => {
  const userId = event.context.user.id;
  const versions = botCodeStore.getCodeVersions(userId);
  return { versions };
});
