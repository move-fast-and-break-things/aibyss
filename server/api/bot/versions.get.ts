import * as botCodeStore from "~/other/botCodeStore";

export default defineEventHandler(async (event) => {
  const username = event.context.user.username;
  const versions = botCodeStore.getBotVersions(username);
  
  // Format the versions data for the frontend
  const formattedVersions = versions.map(version => ({
    timestamp: version.timestamp,
    date: new Date(version.timestamp).toLocaleString(),
    id: version.id,
  }));
  
  return formattedVersions;
});