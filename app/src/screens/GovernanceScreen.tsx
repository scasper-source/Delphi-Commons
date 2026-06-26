/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import type { ConductorWorkflow, WorkflowStep } from "../core/appTypes";
import type { GovernanceChecklistItem, UserRole } from "../core/types";
import {
  buildGovernanceSummary,
  consensusRuleSourceLabels,
  preRoundConsensusStatusLabels,
  validateWizardStep,
  type StudyWizardState,
} from "../core/studyWizard";
import { canEditConsensusRule } from "../policies/governance";
import {
  Checklist,
  LockedRule,
  SignoffGateList,
  WarningBanner,
} from "../components/ui/Primitives";
import { ConductorWorkflowPanel } from "./ConductorWorkflowPanel";
import { hasSignoff, workflowStepDone } from "../core/workflowHelpers";

// eslint-disable-next-line react-refresh/only-export-components
export function buildGovernanceChecklist(wizard: StudyWizardState, workflow: ConductorWorkflow): GovernanceChecklistItem[] {
  const purposeComplete = validateWizardStep("purpose", wizard).length === 0;
  const methodComplete = validateWizardStep("method", wizard).length === 0 && validateWizardStep("rounds", wizard).length === 0;
  const consentComplete = validateWizardStep("consent", wizard).length === 0;
  const feedbackComplete = validateWizardStep("feedback", wizard).length === 0;
  const aiComplete = validateWizardStep("ai", wizard).length === 0;
  const retentionComplete = validateWizardStep("retention", wizard).length === 0;
  const packetSaved = workflowStepDone(workflow, "save-wizard-packet");
  const methodApplied = workflowStepDone(workflow, "set-design");
  const thresholdLocked = workflowStepDone(workflow, "set-consensus");

  return [
    {
      id: "packet",
      label: "Study Builder packet saved",
      detail: packetSaved
        ? "The current study design packet is attached to this governed version."
        : "Save the study design packet before governance review.",
      complete: packetSaved,
      risk: "warning",
    },
    {
      id: "purpose",
      label: "Delphi suitability documented",
      detail: wizard.delphiSuitability,
      complete: purposeComplete,
      risk: "warning",
    },
    {
      id: "method-rounds",
      label: "Method and round plan ready",
      detail: `${wizard.studyFormat === "ClassicDelphi" ? "Classic Delphi" : "Modified Delphi"} with ${wizard.plannedRoundCount} planned rounds and terminal round ${wizard.terminalRoundNumber}.`,
      complete: methodComplete && methodApplied,
      risk: methodComplete ? "warning" : "danger",
    },
    {
      id: "consent",
      label: "Consent and withdrawal language ready",
      detail: `${wizard.consentVersion}: ${wizard.withdrawalProcess}`,
      complete: consentComplete,
      risk: "warning",
    },
    {
      id: "confidentiality",
      label: "Confidentiality language ready",
      detail: wizard.confidentialityStatement,
      complete: consentComplete,
      risk: "warning",
    },
    {
      id: "feedback",
      label: "Controlled feedback configured",
      detail: wizard.neutralFeedbackLanguage,
      complete: feedbackComplete,
      risk: "warning",
    },
    {
      id: "ai",
      label: "AI settings disclosed",
      detail: wizard.aiEnabled ? wizard.aiDisclosure : "AI disabled for this study.",
      complete: aiComplete,
      risk: "warning",
    },
    {
      id: "retention",
      label: "Retention and export review ready",
      detail: `${wizard.retentionSchedule} Export review: ${wizard.exportReviewRole}.`,
      complete: retentionComplete,
      risk: "warning",
    },
    {
      id: "threshold",
      label: "Consensus rule locked before launch",
      detail: `${wizard.consensusThreshold}% agreement at rating ${wizard.agreementMinRating}+; source: ${consensusRuleSourceLabels[wizard.consensusRuleSource]}.`,
      complete: thresholdLocked,
      risk: "locked",
    },
    {
      id: "consensus-source",
      label: "Consensus-setting process documented",
      detail: wizard.preRoundConsensusInputEnabled
        ? `${preRoundConsensusStatusLabels[wizard.preRoundConsensusInputStatus]} pre-round input documented.`
        : wizard.consensusRuleProcess,
      complete:
        Boolean(wizard.consensusRuleProcess.trim()) &&
        (!wizard.preRoundConsensusInputEnabled ||
          (["reviewed", "finalized"].includes(wizard.preRoundConsensusInputStatus) &&
            Boolean(wizard.preRoundConsensusSummary.trim()))),
      risk: wizard.preRoundConsensusInputEnabled ? "warning" : "info",
    },
  ];
}

export function GovernanceScreen({
  role,
  workflow,
  wizard,
  onWorkflowStep,
}: {
  role: UserRole;
  workflow: ConductorWorkflow;
  wizard: StudyWizardState;
  onWorkflowStep: (step: WorkflowStep) => void;
}) {
  const governedStatus = workflow.version?.status ?? "Draft";
  const editAllowed = canEditConsensusRule(governedStatus);
  const checklist = buildGovernanceChecklist(wizard, workflow);
  const reviewBlockers = validateWizardStep("review", wizard);
  const readyForReview = checklist.every((item) => item.complete) && reviewBlockers.length === 0;
  const signoffs = [
    {
      id: "owner-live",
      label: "Owner launch approval",
      requiredRole: "study_owner" as const,
      status: hasSignoff(workflow, "Owner") ? "Signed" as const : "Pending" as const,
      signedBy: workflow.signoffs.find((signoff) => signoff.required_role === "Owner")?.signed_by_user_id,
    },
    {
      id: "steward-live",
      label: "Ethics & methods approval",
      requiredRole: "ethics_methods_steward" as const,
      status: hasSignoff(workflow, "MethodsSteward") ? "Signed" as const : "Pending" as const,
      signedBy: workflow.signoffs.find((signoff) => signoff.required_role === "MethodsSteward")?.signed_by_user_id,
    },
  ];
  const ownerSignoffUser = workflow.signoffs.find((signoff) => signoff.required_role === "Owner")?.signed_by_user_id;
  const stewardSignoffUser = workflow.signoffs.find((signoff) => signoff.required_role === "MethodsSteward")?.signed_by_user_id;
  const sameUserSignedGovernance = Boolean(ownerSignoffUser && stewardSignoffUser && ownerSignoffUser === stewardSignoffUser);

  return (
    <div className="screen-grid">
      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Governance Review</span>
          <h2>Review the saved study design packet before launch signoff</h2>
        </div>
        <WarningBanner title={readyForReview ? "Ready for governance action" : "Governance blockers remain"} risk={readyForReview ? "success" : "warning"}>
          {readyForReview
            ? "The saved packet, method rules, consensus threshold, and policy checklist are ready for signoff."
            : "Complete the open checklist items before submitting the version for governance signoff."}
        </WarningBanner>
      </section>

      <section className="panel">
        <h3>Locked Method Rules</h3>
        <LockedRule
          title="Consensus threshold"
          value={`${wizard.consensusThreshold}% agreement at rating ${wizard.agreementMinRating}+ (${consensusRuleSourceLabels[wizard.consensusRuleSource]})`}
          locked={Boolean(workflow.version?.consensus_rule_json)}
        />
        <dl className="detail-list">
          <div>
            <dt>Setting process</dt>
            <dd>{wizard.consensusRuleProcess}</dd>
          </div>
          <div>
            <dt>Pre-round input</dt>
            <dd>
              {wizard.preRoundConsensusInputEnabled
                ? `${preRoundConsensusStatusLabels[wizard.preRoundConsensusInputStatus]} before Round 1`
              : "Not required"}
            </dd>
          </div>
        </dl>
        <WarningBanner title={editAllowed ? "Draft rule" : "Locked against mid-study change"} risk={editAllowed ? "warning" : "locked"}>
          Consensus rules must be predefined before Round 1 and cannot be changed mid-study.
        </WarningBanner>
      </section>

      <section className="panel">
        <h3>Packet Snapshot</h3>
        <dl className="detail-list">
          <div>
            <dt>Study title</dt>
            <dd>{wizard.title}</dd>
          </div>
          <div>
            <dt>Consent version</dt>
            <dd>{wizard.consentVersion}</dd>
          </div>
          <div>
            <dt>Round plan</dt>
            <dd>{wizard.plannedRoundCount} rounds</dd>
          </div>
          <div>
            <dt>AI</dt>
            <dd>{wizard.aiEnabled ? "Enabled with human approval" : "Disabled"}</dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <h3>Governance Checklist</h3>
        <Checklist items={checklist} />
      </section>

      <section className="panel">
        <h3>Governance Packet Details</h3>
        <div className="review-stack">
          {buildGovernanceSummary(wizard).map((item) => (
            <article className="summary-item" key={item.label}>
              <strong>{item.label}</strong>
              <p>{item.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <h3>Required Signoff</h3>
        <SignoffGateList signoffs={signoffs} />
        {sameUserSignedGovernance ? (
          <WarningBanner title="Multiple governance roles held by same user" risk="info">
            Study Owner and Ethics & Methods Steward signoffs were recorded by the same account. Responsibilities remain separately logged.
          </WarningBanner>
        ) : null}
      </section>

      <section className="panel wide">
        <ConductorWorkflowPanel role={role} workflow={workflow} wizard={wizard} onWorkflowStep={onWorkflowStep} />
      </section>
    </div>
  );
}
