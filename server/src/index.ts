import Fastify from "fastify";
import { adminRoutes } from "./routes/admin.js";
import { studiesRoutes } from "./studies/routes.js";

import { participantsRoutes } from "./routes/participants.js";
import { responsesRoutes } from "./routes/responses.js";
import { consentRoutes } from "./routes/consent.js";
import { itemsRoutes } from "./routes/items.js";
import { reportsRoutes } from "./routes/reports.js";
import { aiRoutes } from "./routes/ai.js";

const app = Fastify({ logger: true });

app.addHook("onRequest", async (req, reply) => {
  reply.header("Access-Control-Allow-Origin", "http://127.0.0.1:5173");
  reply.header("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  reply.header("Access-Control-Allow-Headers", "Content-Type,X-User-ID,X-User-Role");

  if (req.method === "OPTIONS") {
    reply.code(204).send();
  }
});

app.get("/health", async () => {
  return { status: "ok", service: "edelphi-server" };
});

await app.register(adminRoutes);
await studiesRoutes(app);
await app.register(participantsRoutes);
await app.register(responsesRoutes);
await app.register(consentRoutes);
await app.register(itemsRoutes);
await app.register(reportsRoutes);
await app.register(aiRoutes);

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "127.0.0.1";

app.listen({ port, host }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});
