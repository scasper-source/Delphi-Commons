import type { FastifyRequest, FastifyReply } from "fastify";

export type Actor = { userId: string; role: string };

export function getActor(req: FastifyRequest): Actor {
  const userId = String(req.headers["x-user-id"] ?? "anonymous");
  const role = String(req.headers["x-user-role"] ?? "anonymous");
  return { userId, role };
}

export function requireRole(allowed: string[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const actor = getActor(req);
    if (!allowed.includes(actor.role)) {
      reply.code(403).send({ error: "forbidden", allowed, role: actor.role });
      return;
    }
  };
}