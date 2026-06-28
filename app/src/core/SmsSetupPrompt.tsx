/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import type { SmsSetupStatus } from "./api";
import { StatusBadge } from "../components/ui/Primitives";

export const TWILIO_SETUP_FALLBACK_URL = "https://console.twilio.com/us1/develop/sms/services";

// eslint-disable-next-line react-refresh/only-export-components
export function smsSetupProgress(setup: SmsSetupStatus | null): string {
  if (!setup) return "Not checked";
  const values = Object.values(setup.required);
  const complete = values.filter(Boolean).length;
  return `${complete}/${values.length} ready`;
}

export function SmsSetupPrompt({
  setup,
  busy,
  onKeepOff,
  onUseSms,
  onRefresh,
}: {
  setup: SmsSetupStatus | null;
  busy: boolean;
  onKeepOff: () => void;
  onUseSms: () => void;
  onRefresh: () => void;
}) {
  const connectUrl = setup?.connect_url ?? TWILIO_SETUP_FALLBACK_URL;
  return (
    <section className="sms-first-run-panel" aria-label="SMS setup choice">
      <div>
        <span className="eyebrow">Optional SMS setup</span>
        <h2>Use text-message links for participants?</h2>
        <p>
          SMS is off until an operator chooses it and completes Twilio setup. The local package can continue without SMS.
        </p>
      </div>
      <div className="sms-first-run-actions">
        <StatusBadge risk={setup?.ready_for_real_sms_attempt ? "success" : "warning"} label={smsSetupProgress(setup)} />
        <button className="secondary-button" onClick={onKeepOff} type="button">
          Keep SMS off
        </button>
        <button className="primary-button" onClick={onUseSms} type="button">
          Use SMS
        </button>
        <a className="secondary-button link-button" href={connectUrl} rel="noreferrer" target="_blank">
          Open Twilio
        </a>
        <button className="icon-text-button" disabled={busy} onClick={onRefresh} type="button">
          {busy ? "Checking..." : "Refresh"}
        </button>
      </div>
    </section>
  );
}
