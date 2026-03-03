import Fastify from "fastify";
import { adminRoutes } from "./routes/admin.ts";
import { studiesRoutes } from "./studies/routes.ts";

const app = Fastify({ logger: true });

app.get("/health", async () => {
  return { status: "ok", service: "edelphi-server" };
});

await app.register(adminRoutes);
await studiesRoutes(app);

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "127.0.0.1";

app.listen({ port, host }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});