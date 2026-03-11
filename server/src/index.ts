import Fastify from "fastify";
import { adminRoutes } from "./routes/admin.js";
import { studiesRoutes } from "./studies/routes.js";

import { participantsRoutes } from "./routes/participants.js";
import { responsesRoutes } from "./routes/responses.js";
import { consentRoutes } from "./routes/consent.js";

const app = Fastify({ logger: true });

app.get("/health", async () => {
  return { status: "ok", service: "edelphi-server" };
});

await app.register(adminRoutes);
await studiesRoutes(app);
await app.register(participantsRoutes);
await app.register(responsesRoutes);
await app.register(consentRoutes);

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "127.0.0.1";

app.listen({ port, host }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});
