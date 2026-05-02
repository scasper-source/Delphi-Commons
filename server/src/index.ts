import Fastify from "fastify";
import { adminRoutes } from "./routes/admin.js";
import { studiesRoutes } from "./studies/routes.js";

import { participantsRoutes } from "./routes/participants.js";
import { responsesRoutes } from "./routes/responses.js";
import { consentRoutes } from "./routes/consent.js";
import { itemsRoutes } from "./routes/items.js";
import { reportsRoutes } from "./routes/reports.js";
import { aiRoutes } from "./routes/ai.js";
import { getServerConfig } from "./core/config.js";
import { authRoutes } from "./routes/auth.js";

const app = Fastify({ logger: true });
const config = getServerConfig();

app.addHook("onRequest", async (req, reply) => {
  const requestOrigin = req.headers.origin;
  const allowedOrigin =
    typeof requestOrigin === "string" && config.allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : config.allowedOrigins[0];

  reply.header("Access-Control-Allow-Origin", allowedOrigin);
  reply.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  reply.header("Access-Control-Allow-Headers", "Authorization,Content-Type,X-User-ID,X-User-Role");
  reply.header("Vary", "Origin");
  reply.header("X-Content-Type-Options", "nosniff");
  reply.header("Referrer-Policy", "no-referrer");
  reply.header("X-Frame-Options", "DENY");
  reply.header("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    reply.code(204).send();
  }
});

app.get("/health", async () => {
  return { status: "ok", service: "edelphi-server", environment: config.environment };
});

await app.register(authRoutes);
await app.register(adminRoutes);
await studiesRoutes(app);
await app.register(participantsRoutes);
await app.register(responsesRoutes);
await app.register(consentRoutes);
await app.register(itemsRoutes);
await app.register(reportsRoutes);
await app.register(aiRoutes);

app.listen({ port: config.port, host: config.host }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});
