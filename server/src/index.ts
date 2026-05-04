import Fastify from "fastify";
import { adminRoutes } from "./routes/admin.js";
import { studiesRoutes } from "./studies/routes.js";

import { participantsRoutes } from "./routes/participants.js";
import { responsesRoutes } from "./routes/responses.js";
import { consentRoutes } from "./routes/consent.js";
import { itemsRoutes } from "./routes/items.js";
import { reportsRoutes } from "./routes/reports.js";
import { aiRoutes } from "./routes/ai.js";
import { aiConfigRoutes } from "./routes/aiConfig.js";
import { getServerConfig } from "./core/config.js";
import { authRoutes } from "./routes/auth.js";
import { registerSecurity } from "./core/security.js";

const config = getServerConfig();
const app = Fastify({
  bodyLimit: config.bodyLimitBytes,
  disableRequestLogging: true,
  logger:
    config.environment === "test"
      ? false
      : {
          level: "info",
          redact: ["req.headers.authorization", "req.headers.cookie", "headers.authorization", "headers.cookie"],
        },
});

registerSecurity(app, config);

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
await app.register(aiConfigRoutes);
await app.register(aiRoutes);

app.listen({ port: config.port, host: config.host }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});
