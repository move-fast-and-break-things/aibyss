import { SESSION_COOKIE_NAME, SESSION_STORAGE } from "~/utils/sessionStorage";

export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const sessionId = getCookie(event, SESSION_COOKIE_NAME);
  if (sessionId) {
    SESSION_STORAGE.delete(sessionId);
  }

  deleteCookie(event, SESSION_COOKIE_NAME);

  return sendRedirect(event, "/");
});
