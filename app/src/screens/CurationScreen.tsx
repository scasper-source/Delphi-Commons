/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import type { AISuggestionRecord, ItemRecord, ResponseRecord } from "../core/api";
import type { RoundOneResponseEntry } from "../core/appTypes";
import { humanizeBackendMessage, roundOneQuestions, roundOneResponseEntries, shortId } from "../core/appUtils";
import { wizardFromBackendPacket } from "../core/studyWizard";
import { useAppContext } from "../core/AppContext";
import {
  AISuggestionCard,
  ProvenanceList,
  StatusBadge,
  WarningBanner,
} from "../components/ui/Primitives";

export function CurationScreen({
  runtimeActionBusy,
  onRefreshRuntimeData,
  onCreateManualItemFromResponse,
  onSynthesizeRoundTwoCandidates,
  onSynthesizeRoundCandidates,
  onAcceptSuggestion,
  onMaterializeSuggestion,
  onSignoffSuggestionRelease,
  onPublishItem,
  onEditItemText,
  onRejectItem,
  onSplitItem,
  onMergeItemInto,
}: {
  runtimeActionBusy: string | null;
  onRefreshRuntimeData: () => void;
  onCreateManualItemFromResponse: (response: ResponseRecord, entry?: RoundOneResponseEntry) => void;
  onSynthesizeRoundTwoCandidates: () => void;
  onSynthesizeRoundCandidates: (targetRoundNumber: number) => void;
  onAcceptSuggestion: (suggestion: AISuggestionRecord) => void;
  onMaterializeSuggestion: (suggestion: AISuggestionRecord) => void;
  onSignoffSuggestionRelease: (suggestion: AISuggestionRecord) => void;
  onPublishItem: (item: ItemRecord) => void;
  onEditItemText: (item: ItemRecord) => void;
  onRejectItem: (item: ItemRecord) => void;
  onSplitItem: (item: ItemRecord) => void;
  onMergeItemInto: (item: ItemRecord, target: ItemRecord) => void;
}) {
  const { study, workflow, runtimeData } = useAppContext();

  const hasBackendStudy = Boolean(workflow.study && workflow.version);
  const curationWizard = wizardFromBackendPacket(workflow.version?.study_design_packet_json, workflow.study ?? undefined);
  const curationQuestions = roundOneQuestions(curationWizard);
  const openResponseEntries = runtimeData.responses.flatMap((response) =>
    roundOneResponseEntries(response.response_json, curationQuestions).map((entry) => ({ response, entry }))
  );
  const roundTwoItems = runtimeData.items.filter((item) => item.round_number >= 2);
  const interRoundSuggestions = runtimeData.aiSuggestions.filter((suggestion) => suggestion.feature === "inter_round_synthesis");
  const terminalRound = workflow.version?.terminal_round_number ?? 2;
  const carryForwardTargets = Array.from({ length: Math.max(terminalRound - 2, 0) }, (_, index) => index + 3);

  if (!hasBackendStudy) {
    return (
      <div className="curation-layout">
        <section className="panel">
          <h3>Raw Anonymized Responses</h3>
          {study.candidates.flatMap((candidate) => candidate.provenance).map((link) => (
            <article className="response-snippet" key={link.sourceId}>
              <StatusBadge risk="info" label={`Round ${link.roundNumber}`} />
              <p>{link.excerpt}</p>
            </article>
          ))}
        </section>

        <section className="panel">
          <h3>AI / Human Clusters</h3>
          {study.aiSuggestions.map((suggestion) => (
            <AISuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))}
        </section>

        <section className="panel">
          <h3>Candidate Statements</h3>
          {study.candidates.map((candidate) => (
            <article className="candidate" key={candidate.id}>
              <div className="split-line">
                <StatusBadge risk={candidate.preservesMinorityView ? "info" : "warning"} label={candidate.preservesMinorityView ? "Preserves minority view" : candidate.status} />
                <StatusBadge risk={candidate.requiresHumanRationale ? "warning" : "success"} label={candidate.requiresHumanRationale ? "Rationale required" : "Traceable"} />
              </div>
              <p>{candidate.text}</p>
              <ProvenanceList item={candidate} />
            </article>
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="curation-layout">
      <section className="panel">
        <div className="split-line">
          <h3>Raw Anonymized Responses</h3>
          <button className="secondary-button" onClick={onRefreshRuntimeData} type="button">Refresh</button>
        </div>
        {runtimeData.loading ? <p className="muted">Loading study data...</p> : null}
        {runtimeData.error ? (
          <WarningBanner title="Curation data issue" risk="danger">
            {humanizeBackendMessage(runtimeData.error)}
          </WarningBanner>
        ) : null}
        {runtimeData.message ? (
          <WarningBanner title="Curation updated" risk="success">
            {runtimeData.message}
          </WarningBanner>
        ) : null}
        {openResponseEntries.length === 0 ? (
          <WarningBanner title="No Round 1 responses yet" risk="info">
            Round 1 participant responses will appear here after consent and submission.
          </WarningBanner>
        ) : null}
        {openResponseEntries.map(({ response, entry }) => {
          return (
            <article className="response-snippet" key={`${response.response_id}-${entry.researchQuestionId}`}>
              <div className="split-line">
                <StatusBadge risk="info" label={entry.researchQuestionLabel} />
                <small>{shortId(response.response_id)}</small>
              </div>
              <p>{entry.text}</p>
              <button
                className="secondary-button"
                disabled={runtimeActionBusy === `manual-${response.response_id}-${entry.researchQuestionId}`}
                onClick={() => onCreateManualItemFromResponse(response, entry)}
                type="button"
              >
                Create candidate
              </button>
            </article>
          );
        })}
      </section>

      <section className="panel">
        <div className="split-line">
          <h3>AI / Human Clusters</h3>
          <button
            className="primary-button"
            disabled={runtimeActionBusy === "synthesize-r2" || openResponseEntries.length === 0}
            onClick={onSynthesizeRoundTwoCandidates}
            type="button"
          >
            Draft Round 2
          </button>
        </div>
        {interRoundSuggestions.length === 0 ? (
          <WarningBanner title="No AI suggestions yet" risk="info">
            Create an AI Suggestion (Not Final) after Round 1 responses are available, or create candidate items manually from responses.
          </WarningBanner>
        ) : null}
        <div className="candidate-actions">
          {carryForwardTargets.map((targetRound) => (
            <button
              className="secondary-button"
              disabled={runtimeActionBusy === `synthesize-r${targetRound}`}
              key={targetRound}
              onClick={() => onSynthesizeRoundCandidates(targetRound)}
              type="button"
            >
              Draft Round {targetRound}
            </button>
          ))}
        </div>
        {interRoundSuggestions.map((suggestion) => {
          const output = suggestion.output_json && typeof suggestion.output_json === "object" ? suggestion.output_json as Record<string, unknown> : {};
          const candidates = Array.isArray(output.candidates) ? output.candidates : [];

          return (
            <article className="candidate" key={suggestion.suggestion_id}>
              <div className="split-line">
                <StatusBadge risk="warning" label="AI Suggestion (Not Final)" />
                <StatusBadge risk={suggestion.decision === "None" ? "locked" : "success"} label={suggestion.decision} />
              </div>
              <p>{candidates.length} candidate statements from Round 1 material.</p>
              <dl className="detail-list">
                <div>
                  <dt>Output hash</dt>
                  <dd>{shortId(suggestion.output_hash)}</dd>
                </div>
                <div>
                  <dt>Source responses</dt>
                  <dd>{suggestion.input_scope_ids.length}</dd>
                </div>
              </dl>
              <div className="candidate-actions">
                <button
                  className="secondary-button"
                  disabled={suggestion.decision !== "None" || runtimeActionBusy === `accept-${suggestion.suggestion_id}`}
                  onClick={() => onAcceptSuggestion(suggestion)}
                  type="button"
                >
                  Accept
                </button>
                <button
                  className="secondary-button"
                  disabled={suggestion.decision === "None" || runtimeActionBusy === `materialize-${suggestion.suggestion_id}`}
                  onClick={() => onMaterializeSuggestion(suggestion)}
                  type="button"
                >
                  Create items
                </button>
                <button
                  className="secondary-button"
                  disabled={suggestion.decision === "None" || runtimeActionBusy === `signoff-${suggestion.suggestion_id}`}
                  onClick={() => onSignoffSuggestionRelease(suggestion)}
                  type="button"
                >
                  Sign release
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="panel">
        <h3>Candidate Statements</h3>
        {roundTwoItems.length === 0 ? (
          <WarningBanner title="No candidate items yet" risk="info">
            Candidate items created here will keep provenance links and can be published for Round 2 rating.
          </WarningBanner>
        ) : null}
        {roundTwoItems.map((item, index) => (
          <article className="candidate" key={item.item_id}>
            <div className="split-line">
              <StatusBadge risk={item.status === "Published" ? "success" : "warning"} label={item.status} />
              <StatusBadge risk={item.ai_provenance_links.length > 0 ? "success" : "warning"} label={item.ai_provenance_links.length > 0 ? "Traceable" : "Needs provenance"} />
            </div>
            <p>{item.text}</p>
            <div className="provenance">
              {item.ai_provenance_links.map((link) => (
                <div className="provenance-row" key={`${item.item_id}-${link.source_id}`}>
                  <span>{link.source_type} - Round {link.source_round_number}</span>
                  <p>{link.excerpt}</p>
                  <small>{shortId(link.source_id)}</small>
                </div>
              ))}
            </div>
            <button
              className="primary-button"
              disabled={item.status !== "Draft" || runtimeActionBusy === `publish-${item.item_id}`}
              onClick={() => onPublishItem(item)}
              type="button"
            >
              Publish for Round {item.round_number}
            </button>
            <div className="candidate-actions">
              <button className="secondary-button" disabled={runtimeActionBusy === `edit-${item.item_id}`} onClick={() => onEditItemText(item)} type="button">
                Edit
              </button>
              <button className="secondary-button" disabled={runtimeActionBusy === `split-${item.item_id}`} onClick={() => onSplitItem(item)} type="button">
                Split
              </button>
              <button className="secondary-button danger-button" disabled={item.status === "Rejected" || runtimeActionBusy === `reject-${item.item_id}`} onClick={() => onRejectItem(item)} type="button">
                Reject
              </button>
              {index > 0 ? (
                <button className="secondary-button" disabled={runtimeActionBusy === `merge-${item.item_id}`} onClick={() => onMergeItemInto(item, roundTwoItems[index - 1])} type="button">
                  Merge into previous
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
