/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { join, resolve, extname, sep } from "node:path";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const root = resolve(args.get("--root") ?? "app/dist");
const host = args.get("--host") ?? "127.0.0.1";
const port = Number.parseInt(args.get("--port") ?? "4173", 10);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
]);

function safePath(pathname) {
  const decoded = decodeURIComponent(pathname.split("?")[0] ?? "/");
  const candidate = resolve(join(root, decoded));
  const candidateLower = candidate.toLowerCase();
  const rootLower = root.toLowerCase();
  if (candidateLower !== rootLower && !candidateLower.startsWith(`${rootLower}${sep}`)) {
    return null;
  }
  return candidate;
}

const server = createServer((request, response) => {
  const method = request.method ?? "GET";
  if (method !== "GET" && method !== "HEAD") {
    response.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
    response.end("Method not allowed");
    return;
  }

  let filePath = safePath(request.url ?? "/");
  if (!filePath) {
    response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    const indexPath = join(root, "index.html");
    filePath = existsSync(indexPath) ? indexPath : filePath;
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": contentTypes.get(extname(filePath).toLowerCase()) ?? "application/octet-stream",
    "cache-control": "no-store",
  });
  if (method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Static UI serving ${root} at http://${host}:${port}`);
});
