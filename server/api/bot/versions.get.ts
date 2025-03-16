import { getUserCodeVersions } from "~/other/botCodeStore";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const userId = parseInt(query.userId as string);
  
  if (isNaN(userId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid user ID",
    });
  }

  // Check if the requesting user is the same as the user whose versions are being requested
  if (event.context.user.id !== userId) {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized to access other users' code versions",
    });
  }

  const versions = getUserCodeVersions(userId);
  
  return {
    versions,
  };
});
