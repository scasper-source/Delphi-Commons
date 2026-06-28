/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import { useState, type CSSProperties } from "react";
import type { FinalResultSnapshot, ParticipantFinalResponse } from "../core/api";
import { formatDateTime } from "../core/appUtils";
import { useAppContext } from "../core/AppContext";
import { Checklist, StatCard, StatusBadge, WarningBanner } from "../components/ui/Primitives";

const finalOutcomeLabels: Record<FinalResultSnapshot["itemOutcomes"][number]["outcome"], string> = {
  consensus: "Consensus",
  near_consensus: "Near consensus",
  descriptive_near_consensus: "Descriptive near consensus",
  no_consensus: "No consensus",
  consensus_out: "Not endorsed",
};

const finalOutcomeRisks: Record<FinalResultSnapshot["itemOutcomes"][number]["outcome"], "success" | "info" | "warning" | "locked"> = {
  consensus: "success",
  near_consensus: "info",
  descriptive_near_consensus: "info",
  no_consensus: "warning",
  consensus_out: "locked",
};

export function FinalResultsCloseoutScreen({
  snapshot,
  blockers,
  participantFinalResponses,
  message,
  error,
  busy,
  onAction,
  onExportOutput,
}: {
  snapshot: FinalResultSnapshot | null;
  blockers: string[];
  participantFinalResponses: ParticipantFinalResponse[];
  message: string | null;
  error: string | null;
  busy: string | null;
  onAction: (action: "create" | "signoff" | "release" | "archive") => void;
  onExportOutput: (outputId: string) => void;
}) {
  const { role } = useAppContext();
  const [activeOutcome, setActiveOutcome] = useState<FinalResultSnapshot["itemOutcomes"][number]["outcome"] | "all">("all");
  const isParticipant = role === "panelist";
  const visibleItems = snapshot
    ? snapshot.itemOutcomes.filter((item) => activeOutcome === "all" || item.outcome === activeOutcome)
    : [];

  if (!snapshot) {
    return (
      <div className="screen-grid">
        <section className="panel wide">
          <div className="section-heading">
            <span className="eyebrow">Final Results & Study Closeout</span>
            <h2>Create the canonical final results snapshot</h2>
          </div>
          <WarningBanner title="Terminal round required" risk="warning">
            Final closeout opens after the terminal round is closed. The snapshot preserves one source for PI review,
            participant summaries, exports, audit, and provenance.
          </WarningBanner>
          <div className="action-row">
            <button type="button" onClick={() => onAction("create")} disabled={busy === "create"}>
              {busy === "create" ? "Creating..." : "Create FinalResultSnapshot"}
            </button>
          </div>
          {error && <WarningBanner title="Closeout action blocked" risk="danger">{error}</WarningBanner>}
        </section>
      </div>
    );
  }

  const participantSummary = (
    <div className="screen-grid">
      <section className="panel wide final-hero">
        <div className="section-heading">
          <span className="eyebrow">Final results</span>
          <h2>Thank you - this Delphi study is complete</h2>
        </div>
        <p>The planned final round has closed. There are no more rating rounds.</p>
        <WarningBanner title="How to read these results" risk="info">
          {snapshot.requiredStatement} Disagreement is part of the result.
        </WarningBanner>
      </section>

      <section className="panel wide">
        <h3>How to read this</h3>
        <div className="result-card-grid">
          <StatCard label="Reached consensus" value={String(snapshot.aggregateCounts.consensus)} supporting="Met the pre-set rule." />
          <StatCard label="Near consensus" value={String(snapshot.aggregateCounts.descriptiveNearConsensus + snapshot.aggregateCounts.nearConsensus)} supporting="Shown separately from formal consensus." />
          <StatCard label="Did not reach consensus" value={String(snapshot.aggregateCounts.noConsensus)} supporting="Still part of the result." />
          <StatCard label="Final round participation" value={`${snapshot.aggregateCounts.terminalRoundCompletedCount}/${snapshot.aggregateCounts.terminalRoundEligibleCount}`} supporting={`${snapshot.aggregateCounts.terminalRoundCompletionRate}% completed`} />
        </div>
        <p className="microcopy">
          Near consensus is descriptive unless the study protocol defined it as a separate category. No consensus means
          the panel did not reach the pre-set level of agreement; the item remains part of the study result.
        </p>
      </section>

      <section className="panel wide">
        <h3>Final item lists</h3>
        {(["consensus", "descriptive_near_consensus", "no_consensus"] as const).map((outcome) => {
          const items = snapshot.itemOutcomes.filter((item) => item.outcome === outcome);
          return (
            <details className="closeout-accordion" key={outcome} open={outcome !== "no_consensus"}>
              <summary>{finalOutcomeLabels[outcome]} ({items.length})</summary>
              <div className="item-outcome-list">
                {items.length === 0 ? (
                  <p className="microcopy">No items are in this category.</p>
                ) : items.map((item) => <FinalItemOutcomeCard item={item} participantMode key={item.itemId} />)}
              </div>
            </details>
          );
        })}
      </section>

      <section className="panel wide">
        <h3>Your final responses</h3>
        <p className="microcopy">
          These are visible only to you and the study team as described in the consent materials. They are not ranked
          against other panelists.
        </p>
        {participantFinalResponses.length === 0 ? (
          <p>No terminal-round responses are available in this browser session.</p>
        ) : (
          <div className="item-outcome-list">
            {participantFinalResponses.map((response) => (
              <article className="report-row" key={`${response.item_id}-${response.submitted_at}`}>
                <strong>{response.item_text}</strong>
                <span>Final rating: {response.rating}</span>
                {response.rationale_text && <small>Rationale: {response.rationale_text}</small>}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel wide">
        <h3>Your participation and data</h3>
        <p>
          Your identifiable information remains confidential to the study team under the study protocol. Complete
          anonymity from the study team may not be possible because responses are linked across rounds. Aggregated
          results may already include your response.
        </p>
      </section>
    </div>
  );

  if (isParticipant) return participantSummary;

  return (
    <div className="screen-grid">
      <section className="panel wide final-hero">
        <div className="section-heading">
          <span className="eyebrow">Final Results & Study Closeout</span>
          <h2>Terminal round complete</h2>
        </div>
        <p>
          Round {snapshot.terminalRoundNumber} closed on {formatDateTime(snapshot.closedAt)}. This was the final
          analytic round defined in the study design.
        </p>
        <div className="badge-line">
          <StatusBadge risk="locked" label={snapshot.consensusRule.lockStatus === "locked" ? "Consensus rule locked" : "Consensus rule warning"} />
          <StatusBadge risk={snapshot.status === "released" || snapshot.status === "archived" ? "success" : "warning"} label={snapshot.status.replaceAll("_", " ")} />
        </div>
        <WarningBanner title="Required interpretation" risk="info">{snapshot.requiredStatement}</WarningBanner>
        <p className="microcopy">{snapshot.consensusRule.description}</p>
      </section>

      {message && <WarningBanner title="Closeout update" risk="success">{message}</WarningBanner>}
      {error && <WarningBanner title="Closeout action blocked" risk="danger">{error}</WarningBanner>}

      <section className="panel wide">
        <h3>Closeout Summary</h3>
        <div className="result-card-grid">
          <StatCard label="Consensus reached" value={String(snapshot.aggregateCounts.consensus)} supporting="Items meeting the locked rule." />
          <StatCard label="Near consensus" value={String(snapshot.aggregateCounts.nearConsensus + snapshot.aggregateCounts.descriptiveNearConsensus)} supporting="Descriptive unless pre-specified." />
          <StatCard label="No consensus" value={String(snapshot.aggregateCounts.noConsensus)} supporting="Retained as study findings." />
          <StatCard label="Preserved perspectives" value={String(snapshot.aggregateCounts.preservedPerspectiveCount)} supporting="Shown or privacy-suppressed with reason." />
          <StatCard label="Final-round response rate" value={`${snapshot.aggregateCounts.terminalRoundCompletionRate}%`} supporting={`${snapshot.aggregateCounts.terminalRoundCompletedCount}/${snapshot.aggregateCounts.terminalRoundEligibleCount} completed`} />
          <StatCard label="Overall attrition" value={snapshot.aggregateCounts.overallAttritionLabel} supporting="Included in exports." />
        </div>
      </section>

      <section className="panel wide">
        <h3>Item Outcome Explorer</h3>
        <div className="segmented-control outcome-tabs" role="tablist" aria-label="Final item outcome filters">
          {(["all", "consensus", "descriptive_near_consensus", "no_consensus", "consensus_out"] as const).map((outcome) => (
            <button
              className={activeOutcome === outcome ? "active" : ""}
              key={outcome}
              onClick={() => setActiveOutcome(outcome)}
              type="button"
            >
              {outcome === "all" ? "All items" : finalOutcomeLabels[outcome]}
            </button>
          ))}
        </div>
        <div className="item-outcome-list">
          {visibleItems.length === 0 ? (
            <p className="microcopy">No items are in this category.</p>
          ) : visibleItems.map((item) => <FinalItemOutcomeCard item={item} key={item.itemId} />)}
        </div>
      </section>

      <section className="panel">
        <h3>Unresolved and preserved perspectives</h3>
        {snapshot.itemOutcomes.flatMap((item) => item.preservedPerspectives.map((perspective) => ({ item, perspective }))).length === 0 ? (
          <p className="microcopy">No preserved perspective entries are attached to the snapshot.</p>
        ) : (
          <div className="item-outcome-list">
            {snapshot.itemOutcomes.flatMap((item) =>
              item.preservedPerspectives.map((perspective) => (
                <article className="report-row" key={`${item.itemId}-${perspective.summary}`}>
                  <strong>{item.finalText}</strong>
                  <span>{perspective.summary}</span>
                  {perspective.privacySuppressed && <small>Privacy detail suppressed: {perspective.privacySuppressionReason}</small>}
                </article>
              )),
            )}
          </div>
        )}
      </section>

      <section className="panel">
        <h3>Governance and integrity</h3>
        <Checklist
          items={[
            { id: "terminal", label: "Terminal round verified", detail: `Round ${snapshot.terminalRoundNumber} matches the study design.`, complete: true, risk: "success" },
            { id: "rule", label: "Consensus rule locked", detail: snapshot.consensusRule.description, complete: snapshot.consensusRule.lockStatus === "locked", risk: snapshot.consensusRule.lockStatus === "locked" ? "success" : "danger" },
            { id: "rates", label: "Response rates calculated", detail: `${snapshot.roundSummaries.length} rounds summarized.`, complete: snapshot.roundSummaries.length > 0, risk: "success" },
            { id: "non-consensus", label: "Non-consensus retained", detail: `${snapshot.aggregateCounts.noConsensus} no-consensus items are retained.`, complete: true, risk: "success" },
            { id: "limits", label: "Limitations included", detail: snapshot.requiredStatement, complete: snapshot.limitations.includes(snapshot.requiredStatement), risk: "success" },
            { id: "hashes", label: "Export hashes generated", detail: `Export hash ${snapshot.exportHash.slice(0, 12)}...`, complete: Boolean(snapshot.exportHash && snapshot.provenanceHash), risk: "locked" },
          ]}
        />
        {snapshot.methodWarnings.map((warning) => (
          <WarningBanner key={warning.code} title={warning.severity === "blocking" ? "Blocking warning" : "Method warning"} risk={warning.severity === "blocking" ? "danger" : "warning"}>
            {warning.message}
          </WarningBanner>
        ))}
        {blockers.length > 0 && (
          <WarningBanner title="Release blockers" risk="warning">
            {blockers.map((blocker) => blocker.replaceAll("_", " ")).join("; ")}
          </WarningBanner>
        )}
      </section>

      <section className="panel wide">
        <h3>Export and release actions</h3>
        <div className="action-row">
          <button type="button" onClick={() => onAction("signoff")} disabled={busy === "signoff"}>
            {busy === "signoff" ? "Signing..." : "Sign off closeout"}
          </button>
          <button type="button" onClick={() => onAction("release")} disabled={busy === "release" || blockers.length > 0}>
            Release to participants
          </button>
          <button type="button" onClick={() => onExportOutput("final-delphi-report")}>
            Export full methods report
          </button>
          <button type="button" onClick={() => onExportOutput("provenance-bundle")}>
            Export audit/provenance pack
          </button>
          <button type="button" onClick={() => onAction("archive")} disabled={busy === "archive"}>
            Archive study results
          </button>
        </div>
      </section>
    </div>
  );
}

export function FinalItemOutcomeCard({
  item,
  participantMode = false,
}: {
  item: FinalResultSnapshot["itemOutcomes"][number];
  participantMode?: boolean;
}) {
  const total = Object.values(item.distribution).reduce((sum, count) => sum + count, 0);
  return (
    <article className="final-item-card">
      <div className="feedback-card-topline">
        <StatusBadge risk={finalOutcomeRisks[item.outcome]} label={finalOutcomeLabels[item.outcome]} />
        <span className="microcopy">Item source: {item.provenance.replaceAll("_", " ")}</span>
      </div>
      <h4>{item.finalText}</h4>
      <div className="feedback-metrics">
        <span>Final N: <strong>{item.finalN}</strong></span>
        <span>Median: <strong>{item.median ?? "n/a"}</strong></span>
        <span>IQR: <strong>{item.iqr ?? "n/a"}</strong></span>
        <span>Agreement: <strong>{item.agreementPercent ?? "n/a"}%</strong></span>
      </div>
      <div className="compact-distribution" aria-label={`Distribution across ${total} responses`}>
        {Object.entries(item.distribution).map(([rating, count]) => (
          <span key={rating}>
            <small>{rating}</small>
            <i style={{ "--bar-height": `${Math.max(8, total ? (count / total) * 48 : 8)}px` } as CSSProperties} />
            <small>{count}</small>
          </span>
        ))}
      </div>
      {item.neutralSummary && <p>{item.neutralSummary}</p>}
      {!participantMode && item.roundTrend.length > 0 && (
        <details>
          <summary>Round-to-round movement</summary>
          <div className="detail-list">
            {item.roundTrend.map((trend) => (
              <div key={trend.roundNumber}>
                <dt>Round {trend.roundNumber}</dt>
                <dd>Median {trend.median ?? "n/a"}; IQR {trend.iqr ?? "n/a"}; agreement {trend.agreementPercent ?? "n/a"}%</dd>
              </div>
            ))}
          </div>
        </details>
      )}
      {item.preservedPerspectives.length > 0 && (
        <details>
          <summary>{participantMode ? "Preserved perspective summary" : "Dissent and preserved perspectives"}</summary>
          {item.preservedPerspectives.map((perspective) => (
            <p className="microcopy" key={perspective.summary}>
              {perspective.summary}
              {perspective.privacySuppressed && perspective.privacySuppressionReason ? ` ${perspective.privacySuppressionReason}` : ""}
            </p>
          ))}
        </details>
      )}
    </article>
  );
}
