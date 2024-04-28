import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { SESSION_STORAGE, SESSION_TTL } from '~/utils/sessionStorage';

const userSchema = z.object({
  username: z.string(),
  password: z.string(),
})
const prisma = new PrismaClient()


export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const result = await readValidatedBody(event, body => userSchema.safeParse(body));

  if (!result.success)
    throw createError({ statusCode: 422, statusMessage: 'Username and password field is required' });
  const user = await prisma.user.findFirst({ where: { username: result.data.username } })
  if (!user)
    throw createError({ statusCode: 401, statusMessage: `Unauthorized` });

  const hash = user.password;
  const match = await bcrypt.compare(result.data.password, hash);
  if (match) {
    const sessionId = crypto.randomUUID();
    setCookie(event, 'session_id', sessionId, {
      httpOnly: true,
      secure: true,
      maxAge: SESSION_TTL,
    });
    SESSION_STORAGE.set(sessionId, user.id)
    return sendRedirect(event, '/')
  }
  else {
    throw createError({ statusCode: 401, statusMessage: 'Invalid password or username' });
  }
})
