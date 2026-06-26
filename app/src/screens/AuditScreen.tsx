/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import type { StudyRecord } from "../core/types";
import { AuditTrail } from "../components/ui/Primitives";

export function AuditScreen({ study }: { study: StudyRecord }) {
  return (
    <div className="screen-grid">
      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Audit Log Viewer</span>
          <h2>Human-readable events for sensitive actions</h2>
        </div>
        <div className="filter-row">
          {["AI operation", "export", "identity access", "item change", "signoff", "security event"].map((filter) => (
            <button className="filter-chip" key={filter} type="button">{filter}</button>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <AuditTrail events={study.auditEvents} />
      </section>
    </div>
  );
}
