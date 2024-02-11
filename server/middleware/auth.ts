import { SESSION_STORAGE } from "~/utils/sessionStorage"

export default defineEventHandler((event) => {
    if (event.path.includes('login'))
        return

    const sessionId = getCookie(event, 'session_id')
    if (!sessionId)
        return sendRedirect(event, '/login');
    const userId = SESSION_STORAGE.get(sessionId)
    if (!userId)
        return sendRedirect(event, '/login');
    event.context.userId = userId
  })