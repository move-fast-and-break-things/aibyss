import * as botCodeStore from "~/other/botCodeStore";
import { HTTP_STATUS_CODES } from "~/other/httpStatusCodes";

export default defineEventHandler(async (event) => {
  const username = event.context.user.username;
  const timestampParam = event.context.params?.timestamp;
  
  if (!timestampParam) {
    throw createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      statusMessage: "Version timestamp is required",
    });
  }
  
  const timestamp = parseInt(timestampParam, 10);
  
  if (isNaN(timestamp)) {
    throw createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      statusMessage: "Invalid timestamp format",
    });
  }
  
  const versions = botCodeStore.getBotVersions(username);
  const version = versions.find(v => v.timestamp === timestamp);
  
  if (!version) {
    throw createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      statusMessage: "Version not found",
    });
  }
  
  return {
    code: version.code,
    timestamp: version.timestamp,
    date: new Date(version.timestamp).toLocaleString(),
  };
});