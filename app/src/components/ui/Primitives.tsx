import type {
  AISuggestion,
  AuditEvent,
  CandidateItem,
  GovernanceChecklistItem,
  RiskLevel,
  SignoffGate,
} from "../../core/types";
import type { ReactNode } from "react";
import { canPublishAISuggestion } from "../../policies/governance";

const riskLabels: Record<RiskLevel, string> = {
  info: "Info",
  warning: "Needs Review",
  danger: "High Risk",
  locked: "Locked",
  success: "Ready",
};

export function StatusBadge({ risk, label }: { risk: RiskLevel; label?: string }) {
  return <span className={`badge badge-${risk}`}>{label ?? riskLabels[risk]}</span>;
}

export function WarningBanner({
  title,
  children,
  risk = "warning",
}: {
  title: string;
  children: ReactNode;
  risk?: RiskLevel;
}) {
  return (
    <section className={`notice notice-${risk}`} role={risk === "danger" ? "alert" : "status"}>
      <strong>{title}</strong>
      <div>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  supporting,
}: {
  label: string;
  value: string;
  supporting: string;
}) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{supporting}</small>
    </div>
  );
}

export function DataBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="data-bar" aria-label={`${label}: ${value}%`}>
      <div className="data-bar-row">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="data-bar-track">
        <span style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
      </div>
    </div>
  );
}

export function LockedRule({
  title,
  value,
  locked,
}: {
  title: string;
  value: string;
  locked: boolean;
}) {
  return (
    <div className="locked-rule">
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
      <StatusBadge risk={locked ? "locked" : "warning"} label={locked ? "Locked before launch" : "Draft"} />
    </div>
  );
}

export function Checklist({ items }: { items: GovernanceChecklistItem[] }) {
  return (
    <div className="checklist">
      {items.map((item) => (
        <article className="check-row" key={item.id}>
          <StatusBadge risk={item.complete ? "success" : item.risk} label={item.complete ? "Complete" : "Open"} />
          <div>
            <strong>{item.label}</strong>
            <p>{item.detail}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function SignoffGateList({ signoffs }: { signoffs: SignoffGate[] }) {
  return (
    <div className="signoff-grid">
      {signoffs.map((signoff) => (
        <article className="signoff" key={signoff.id}>
          <StatusBadge risk={signoff.status === "Signed" ? "success" : "warning"} label={signoff.status} />
          <strong>{signoff.label}</strong>
          <span>{signoff.signedBy ?? "Awaiting approval"}</span>
        </article>
      ))}
    </div>
  );
}

export function ProvenanceList({ item }: { item: CandidateItem }) {
  return (
    <div className="provenance">
      {item.provenance.map((link) => (
        <div className="provenance-row" key={`${link.sourceId}-${link.sourceType}`}>
          <span>{link.sourceType.replace("_", " ")}</span>
          <p>{link.excerpt}</p>
          <small>Round {link.roundNumber} source: {link.sourceId}</small>
        </div>
      ))}
    </div>
  );
}

export function AISuggestionCard({ suggestion }: { suggestion: AISuggestion }) {
  const publishable = canPublishAISuggestion(suggestion);

  return (
    <article className="ai-card">
      <div className="split-line">
        <strong>{suggestion.label}</strong>
        <StatusBadge risk={publishable ? "success" : "warning"} label={publishable ? "Release ready" : "Human approval required"} />
      </div>
      <p>{suggestion.feature.replaceAll("_", " ")}</p>
      <dl>
        <div>
          <dt>Decision</dt>
          <dd>{suggestion.status}</dd>
        </div>
        <div>
          <dt>Output hash</dt>
          <dd>{suggestion.outputHash}</dd>
        </div>
      </dl>
    </article>
  );
}

export function AuditTrail({ events }: { events: AuditEvent[] }) {
  return (
    <div className="audit-list">
      {events.map((event) => (
        <article className="audit-row" key={event.id}>
          <StatusBadge risk={event.risk} />
          <div>
            <strong>{event.action}</strong>
            <span>{event.object}</span>
          </div>
          <time>{new Date(event.timestamp).toLocaleString()}</time>
        </article>
      ))}
    </div>
  );
}
