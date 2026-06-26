/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import { useState } from "react";

export function InlineHelp({ id, label, text }: { id: string; label: string; text: string }) {
  const [open, setOpen] = useState(false);
  const helpId = `inline-help-${id}`;
  return (
    <span className="inline-help">
      <button
        aria-controls={helpId}
        aria-expanded={open}
        aria-label={`Help: ${label}`}
        className="inline-help-trigger"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        ?
      </button>
      {open ? (
        <span className="inline-help-popover" id={helpId} role="note">
          {text}
          <button aria-label={`Close help for ${label}`} onClick={() => setOpen(false)} type="button">
            Close help
          </button>
        </span>
      ) : null}
    </span>
  );
}
