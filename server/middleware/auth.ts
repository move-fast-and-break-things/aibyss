import prisma from "~/other/db";
import { SESSION_COOKIE_NAME, SESSION_STORAGE } from "~/other/sessionStorage";

const PUBLIC_PATHS = [
  "/api/auth/login",
  "/login",
  "/metrics",
  "/rating",
  "/api/rating",
];

export default defineEventHandler(async (event) => {
  if (PUBLIC_PATHS.includes(event.path)) {
    return;
  }

  const sessionId = getCookie(event, SESSION_COOKIE_NAME);
  if (!sessionId) {
    return sendRedirect(event, "/login");
  }

  const userId = SESSION_STORAGE.get(sessionId);
  if (!userId) {
    return sendRedirect(event, "/login");
  }

  const user = await prisma.user.findFirst({ where: { id: userId } });
  if (!user) {
    SESSION_STORAGE.delete(sessionId);
    deleteCookie(event, SESSION_COOKIE_NAME);
    return sendRedirect(event, "/login");
  }

  event.context.user = user;
});
