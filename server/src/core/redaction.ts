const SECRET_KEY_PATTERN =
  /^(apiKey|api_key|authorization|encryptedKey|encrypted_key|apiKeyEncrypted|api_key_encrypted|api_key_fingerprint_hash|apiKeyFingerprintHash|providerSecret|providerSecrets|provider_secret|provider_secrets|bearerToken|accessToken|refreshToken|token)$/i;

const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const API_KEY_PATTERN = /\b(?:sk|pk)[-_][A-Za-z0-9._~+/=-]{8,}\b/gi;

export function redactSensitiveString(value: string): string {
  return value
    .replace(BEARER_PATTERN, "Bearer [REDACTED]")
    .replace(API_KEY_PATTERN, "[REDACTED_SECRET]");
}

export function redactSensitive<T>(value: T): T {
  if (typeof value === "string") return redactSensitiveString(value) as T;
  if (value === null || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map((entry) => redactSensitive(entry)) as T;
  }

  const output: Record<string, unknown> = {};
  for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      output[key] = "[REDACTED]";
      continue;
    }
    output[key] = redactSensitive(entryValue);
  }
  return output as T;
}
