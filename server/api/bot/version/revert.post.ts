import { z } from "zod";
import * as botCodeStore from "~/other/botCodeStore";
import { HTTP_STATUS_CODES } from "~/other/httpStatusCodes";

const revertSchema = z.object({
  timestamp: z.number(),
});

export default defineEventHandler(async (event) => {
  const username = event.context.user.username;
  
  const result = await readValidatedBody(event, body => revertSchema.safeParse(body));
  if (!result.success) {
    throw createError({
      statusCode: HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY,
      statusMessage: "Timestamp field is required",
    });
  }
  
  const { timestamp } = result.data;
  const success = botCodeStore.revertToBotVersion(username, timestamp);
  
  if (!success) {
    throw createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      statusMessage: "Version not found",
    });
  }
  
  return {
    status: "reverted",
    timestamp,
  };
});