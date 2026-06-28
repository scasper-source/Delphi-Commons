/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { apiBoundary } from "../core/api";
import { WarningBanner } from "../components/ui/Primitives";

export function FirstRunSetupScreen({ onComplete }: { onComplete: () => void }) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const passwordTooShort = password.length > 0 && password.length < 10;
  const canSubmit = email.includes("@") && password.length >= 10 && password === confirmPassword && !busy;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`${apiBoundary.baseUrl}/auth/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, display_name: displayName, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? `Setup failed (HTTP ${response.status})`);
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed. Check the server connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="first-run-shell">
      <section className="first-run-card">
        <div className="first-run-header">
          <span className="eyebrow">First-run setup</span>
          <h1>Welcome to Delphi Commons</h1>
          <p>
            No operator account exists yet. Create the platform administrator account to get started.
            This account will have full owner and admin privileges.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <label className="field wide-field">
            <span>Email address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="field wide-field">
            <span>Display name</span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Optional — defaults to email"
              autoComplete="name"
            />
          </label>

          <label className="field wide-field">
            <span>Password (minimum 10 characters)</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={10}
              required
            />
          </label>

          <label className="field wide-field">
            <span>Confirm password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>

          {passwordTooShort ? (
            <WarningBanner title="Password too short" risk="warning">
              Password must be at least 10 characters.
            </WarningBanner>
          ) : null}

          {passwordMismatch ? (
            <WarningBanner title="Passwords do not match" risk="warning">
              Re-enter the confirmation password.
            </WarningBanner>
          ) : null}

          {error ? (
            <WarningBanner title="Setup error" risk="danger">
              {error}
            </WarningBanner>
          ) : null}

          <div className="action-row">
            <button className="primary-button" type="submit" disabled={!canSubmit}>
              {busy ? "Creating account..." : "Create operator account"}
            </button>
          </div>
        </form>

        <WarningBanner title="Demo accounts included" risk="info">
          Setup also creates standard demo accounts (owner@example.test, steward@example.test, etc.)
          so the current development-phase UI works immediately. These can be disabled later via Admin.
        </WarningBanner>
      </section>
    </div>
  );
}
