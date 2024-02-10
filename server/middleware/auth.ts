import { SESSION_STORAGE } from "~/utils/sessionStorage"

export default defineEventHandler( async (event) => {
    if (!event.path.includes('login/'))
        return

    const sessionId = getCookie(event, 'session_id')
    if (!sessionId || !SESSION_STORAGE.get(sessionId))
        await sendRedirect(event, 'login/', 301);
  })