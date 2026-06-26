/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import { formatDateTime } from "../core/appUtils";

export function SaveStatusIndicator({ savedAt, scope }: { savedAt: string | null | undefined; scope: string }) {
  return (
    <p className="save-status" aria-live="polite">
      {savedAt ? `${scope} saved ${formatDateTime(savedAt)}.` : `${scope} not saved yet.`}
    </p>
  );
}
