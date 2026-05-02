export type ServerConfig = {
  port: number;
  host: string;
  allowedOrigins: string[];
  environment: "development" | "test" | "production";
};

function parsePort(value: string | undefined): number {
  const port = Number(value ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("invalid_port");
  }
  return port;
}

function parseAllowedOrigins(value: string | undefined): string[] {
  const origins = (value ?? "http://127.0.0.1:5173,http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    throw new Error("allowed_origins_required");
  }

  if (origins.includes("*")) {
    throw new Error("wildcard_cors_origin_disallowed");
  }

  return Array.from(new Set(origins));
}

export function getServerConfig(): ServerConfig {
  const environment = process.env.NODE_ENV === "production"
    ? "production"
    : process.env.NODE_ENV === "test"
      ? "test"
      : "development";

  return {
    port: parsePort(process.env.PORT),
    host: process.env.HOST ?? "127.0.0.1",
    allowedOrigins: parseAllowedOrigins(process.env.EDELPHI_ALLOWED_ORIGINS),
    environment,
  };
}

