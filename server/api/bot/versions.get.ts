import { getUserCodeVersions } from "~/other/botCodeStore";

export default defineEventHandler(async (event) => {
  const userId = event.context.user.id;
  
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized"
    });
  }

  // Get all code versions for the user
  const versions = getUserCodeVersions(userId);
  
  return {
    versions
  };
});
