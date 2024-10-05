import crypto from "crypto";
import bcrypt from "bcrypt";
import { z } from "zod";
import { SESSION_COOKIE_NAME, SESSION_STORAGE, SESSION_TTL_SECONDS } from "~/utils/sessionStorage";
import prisma from "~/utils/db";
import { STATUS_CODES } from '~/utils/statusCodes';

const ERROR_MESSAGES = {
  VALIDATION_ERROR: "Username and password field is required",
  USER_NOT_FOUND: "Invalid username or password",
  INVALID_CREDENTIALS: "Invalid username or password",
};

const userSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, body => userSchema.safeParse(body));
  if (!result.success) {
    throw createError({ statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY, statusMessage: ERROR_MESSAGES.VALIDATION_ERROR });
  }

  const user = await prisma.user.findFirst({ where: { username: result.data.username } });
  if (!user) {
    throw createError({ statusCode: STATUS_CODES.UNAUTHORIZED, statusMessage: ERROR_MESSAGES.USER_NOT_FOUND });
  }

  const isPasswordValid = await bcrypt.compare(result.data.password, user.password);
  if (isPasswordValid) {
    const sessionId = crypto.randomUUID();
    setCookie(event, SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: true,
      maxAge: SESSION_TTL_SECONDS,
    });
    SESSION_STORAGE.set(sessionId, user.id);
    return sendRedirect(event, "/");
  } else {
    throw createError({ statusCode: STATUS_CODES.UNAUTHORIZED, statusMessage: ERROR_MESSAGES.INVALID_CREDENTIALS });
  }
});
