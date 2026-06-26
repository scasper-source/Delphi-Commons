/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import { StatCard } from "../components/ui/Primitives";
import { methodRegistry } from "../methods/registry";
import { moduleRegistry } from "../modules/registry";
import { outputModelRegistry } from "../outputModels/registry";

export function ArchitectureScreen({
  apiMode,
  apiBaseUrl,
  knownStudies,
  listStudiesLabel,
}: {
  apiMode: string;
  apiBaseUrl: string;
  knownStudies: number;
  listStudiesLabel: string;
}) {
  return (
    <div className="screen-grid">
      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Extensible foundation</span>
          <h2>Platform shell with registries and policy gates</h2>
        </div>
        <div className="architecture-grid">
          <StatCard label="Modules" value={String(moduleRegistry.length)} supporting="Routes and permissions are registry-driven." />
          <StatCard label="Study methods" value={String(methodRegistry.length)} supporting="Available now plus future method models." />
          <StatCard label="Output models" value={String(outputModelRegistry.length)} supporting="Exports define roles, redaction, and audit action." />
          <StatCard label="API mode" value={apiMode} supporting={`${knownStudies} mock study via ${listStudiesLabel || "listStudies"}.`} />
        </div>
      </section>

      <section className="panel">
        <h3>API Boundary</h3>
        <p className="muted">
          The UI can use mock data during design, while keeping a clear backend boundary for the road-tested Fastify API.
        </p>
        <dl className="detail-list">
          <div>
            <dt>Base URL</dt>
            <dd>{apiBaseUrl}</dd>
          </div>
          <div>
            <dt>Auth header model</dt>
            <dd>Role-aware headers for local development; backend still enforces permissions.</dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <h3>Extension Points</h3>
        <ul className="plain-list">
          <li>New application modules register label, route, permissions, and maturity.</li>
          <li>New study methods define round plan, required setup, feedback rules, and launch blockers.</li>
          <li>New output models define sections, signoffs, redaction rules, and audit action.</li>
          <li>Policy gates remain outside page components for testing and reuse.</li>
        </ul>
      </section>
    </div>
  );
}
