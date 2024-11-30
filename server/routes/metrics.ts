import promClient from "prom-client";

promClient.collectDefaultMetrics();

export default defineEventHandler(async () => {
  const metrics = await promClient.register.metrics();
  return new Response(metrics, {
    headers: {
      "Content-Type": promClient.register.contentType,
    },
  });
});
