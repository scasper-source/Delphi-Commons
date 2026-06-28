/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import type { WorkflowStep } from "../core/appTypes";
import { formatStatus } from "../core/appUtils";
import { useAppContext } from "../core/AppContext";
import { validateWizardStep } from "../core/studyWizard";
import { StatusBadge, WarningBanner } from "../components/ui/Primitives";
import { hasSignoff, workflowStepDone } from "../core/workflowHelpers";

export function ConductorWorkflowPanel({
  onWorkflowStep,
}: {
  onWorkflowStep: (step: WorkflowStep) => void;
}) {
  const { role, workflow, wizard } = useAppContext();
  const version = workflow.version;
  const ownerCanAct = role === "study_owner";
  const stewardCanAct = role === "ethics_methods_steward";
  const methodBlockers = validateWizardStep("method", wizard);
  const roundBlockers = validateWizardStep("rounds", wizard);
  const reviewBlockers = validateWizardStep("review", wizard);
  const purposeBlockers = validateWizardStep("purpose", wizard);
  const workflowBusy = workflow.busyStep !== null;
  const hasOwnerApproval = hasSignoff(workflow, "Owner");
  const hasStewardApproval = hasSignoff(workflow, "MethodsSteward");
  const ownerRoleRequired = "Change Current role to Study Owner / PI.";
  const stewardRoleRequired = "Change Current role to Ethics & Methods Steward after that user has been assigned to this study in Admin / Security.";

  const steps: Array<{
    id: WorkflowStep;
    label: string;
    detail: string;
    roleNote: string;
    disabled: boolean;
    disabledReason: string | null;
    actionLabel: string;
  }> = [
    {
      id: "create-study",
      label: "Create study",
      detail: workflow.study ? workflow.study.id : `Creates "${wizard.title}" in the backend.`,
      roleNote: "Study Owner",
      disabled: !ownerCanAct || Boolean(workflow.study) || purposeBlockers.length > 0,
      disabledReason: !ownerCanAct
        ? ownerRoleRequired
        : workflow.study
          ? "A backend study is already current; use Start new study for a separate workspace."
          : purposeBlockers.length > 0
            ? "Complete the Study Builder purpose fields first."
            : null,
      actionLabel: "Create study",
    },
    {
      id: "create-version",
      label: "Create draft version",
      detail: version ? `Version ${version.version_number}: ${formatStatus(version.status)}` : "Creates the governed StudyVersion.",
      roleNote: "Study Owner",
      disabled: !ownerCanAct || !workflow.study || Boolean(version),
      disabledReason: !ownerCanAct
        ? ownerRoleRequired
        : !workflow.study
          ? "Create or open a backend study first."
          : version
            ? "This study already has a current version open."
            : null,
      actionLabel: "Create draft version",
    },
    {
      id: "save-wizard-packet",
      label: "Save wizard progress",
      detail: workflowStepDone(workflow, "save-wizard-packet")
        ? "Full Study Builder packet is stored with this version."
        : "Creates a draft workspace if needed, then stores panel, consent, feedback, AI, retention, and governance inputs.",
      roleNote: "Study Owner",
      disabled: !ownerCanAct || (version !== null && version.status !== "Draft"),
      disabledReason: !ownerCanAct
        ? ownerRoleRequired
        : version !== null && version.status !== "Draft"
          ? "The saved packet is locked after governance submission; create a new version for changes."
          : null,
      actionLabel: workflowStepDone(workflow, "save-wizard-packet") ? "Save study design again" : "Save study design",
    },
    {
      id: "set-design",
      label: "Apply method design",
      detail: version?.study_format ?? `Stores ${wizard.studyFormat}, round count, terminal round, and rationale.`,
      roleNote: "Study Owner",
      disabled:
        !ownerCanAct ||
        !version ||
        !workflowStepDone(workflow, "save-wizard-packet") ||
        methodBlockers.length > 0 ||
        workflowStepDone(workflow, "set-design"),
      disabledReason: !ownerCanAct
        ? ownerRoleRequired
        : !version
          ? "Create the draft StudyVersion first."
          : !workflowStepDone(workflow, "save-wizard-packet")
            ? "Save the Study Builder packet before applying method design."
            : methodBlockers.length > 0
              ? "Complete the method rationale and method-specific fields first."
              : workflowStepDone(workflow, "set-design")
                ? "Method design is already applied."
                : null,
      actionLabel: "Apply method design",
    },
    {
      id: "set-consensus",
      label: "Set consensus threshold",
      detail: version?.consensus_rule_json
        ? `${wizard.consensusThreshold}% agreement at rating ${wizard.agreementMinRating}+`
        : "Locks the predefined rule before Round 1.",
      roleNote: "Study Owner",
      disabled:
        !ownerCanAct ||
        !version ||
        roundBlockers.length > 0 ||
        !workflowStepDone(workflow, "set-design") ||
        workflowStepDone(workflow, "set-consensus"),
      disabledReason: !ownerCanAct
        ? ownerRoleRequired
        : !version
          ? "Create the draft StudyVersion first."
          : roundBlockers.length > 0
            ? "Complete the round plan and consensus settings first."
            : !workflowStepDone(workflow, "set-design")
              ? "Apply method design before locking the consensus rule."
              : workflowStepDone(workflow, "set-consensus")
                ? "Consensus threshold is already saved for this version."
                : null,
      actionLabel: "Set consensus threshold",
    },
    {
      id: "submit",
      label: "Submit for signoff",
      detail: version?.config_hash ? `Config hash: ${version.config_hash.slice(0, 12)}...` : "Computes the governed configuration hash.",
      roleNote: "Study Owner",
      disabled:
        !ownerCanAct ||
        !version ||
        reviewBlockers.length > 0 ||
        !workflowStepDone(workflow, "save-wizard-packet") ||
        !workflowStepDone(workflow, "set-consensus") ||
        workflowStepDone(workflow, "submit"),
      disabledReason: !ownerCanAct
        ? ownerRoleRequired
        : !version
          ? "Create and save the draft StudyVersion first."
          : reviewBlockers.length > 0
            ? "Complete every Study Builder review requirement before signoff."
            : !workflowStepDone(workflow, "save-wizard-packet")
              ? "Save the full Study Builder packet first."
              : !workflowStepDone(workflow, "set-consensus")
                ? "Apply method design and consensus threshold before submission."
                : workflowStepDone(workflow, "submit")
                  ? "This version is already submitted for governance signoff."
                  : null,
      actionLabel: "Submit for signoff",
    },
    {
      id: "owner-signoff",
      label: "Study PI signoff",
      detail: hasOwnerApproval
        ? "Study PI signoff recorded for this StudyVersion."
        : "The Study Owner / PI records approval after the version is submitted for governance signoff.",
      roleNote: "Study Owner / PI",
      disabled: !ownerCanAct || version?.status !== "ReadyForSignoff" || hasOwnerApproval,
      disabledReason: !ownerCanAct
        ? ownerRoleRequired
        : version?.status !== "ReadyForSignoff"
          ? "Submit the completed StudyVersion for governance signoff first."
          : hasOwnerApproval
            ? "Study PI signoff is already recorded."
            : null,
      actionLabel: "Record Study PI signoff",
    },
    {
      id: "steward-signoff",
      label: "Ethics PI signoff",
      detail: hasStewardApproval
        ? "Ethics PI / Ethics & Methods Steward signoff recorded for this StudyVersion."
        : "Assign the Ethics PI as Ethics & Methods Steward in Admin / Security, then use Current role: Ethics & Methods Steward to approve.",
      roleNote: "Ethics PI / Ethics & Methods Steward",
      disabled: !stewardCanAct || version?.status !== "ReadyForSignoff" || hasStewardApproval,
      disabledReason: !stewardCanAct
        ? stewardRoleRequired
        : version?.status !== "ReadyForSignoff"
          ? "Submit the completed StudyVersion for governance signoff first."
          : hasStewardApproval
            ? "Ethics PI signoff is already recorded."
            : null,
      actionLabel: "Record Ethics PI signoff",
    },
    {
      id: "activate",
      label: "Activate version",
      detail: version?.status === "Active" ? "StudyVersion is active." : "Requires Study PI and Ethics PI signoffs.",
      roleNote: "Study Owner / PI",
      disabled: !ownerCanAct || version?.status !== "ReadyForSignoff" || !hasOwnerApproval || !hasStewardApproval,
      disabledReason: !ownerCanAct
        ? ownerRoleRequired
        : version?.status !== "ReadyForSignoff"
          ? "The version must be Ready for signoff before activation."
          : !hasOwnerApproval || !hasStewardApproval
            ? "Activation is blocked until both Study PI and Ethics PI signoffs are recorded."
            : null,
      actionLabel: "Activate version",
    },
    {
      id: "open-round-1",
      label: "Open Round 1",
      detail: version?.opened_round1_at ? `Opened ${new Date(version.opened_round1_at).toLocaleString()}` : "Makes the open-ended round available.",
      roleNote: "Study Owner / PI",
      disabled: !ownerCanAct || version?.status !== "Active" || Boolean(version.opened_round1_at),
      disabledReason: !ownerCanAct
        ? ownerRoleRequired
        : version?.status !== "Active"
          ? "Activate the governed version before opening Round 1."
          : version.opened_round1_at
            ? "Round 1 is already open."
            : null,
      actionLabel: "Open Round 1",
    },
  ];

  return (
    <div className="workflow-panel">
      <div className="split-line">
        <div>
          <span className="eyebrow">Backend-backed vertical slice</span>
          <h3>Study setup and launch workflow</h3>
        </div>
        <StatusBadge risk={workflow.version?.opened_round1_at ? "success" : "warning"} label={workflow.version?.opened_round1_at ? "Round 1 open" : "In progress"} />
      </div>

      <WarningBanner title="Governance signoff sequence" risk="info">
        Save the design, apply method and consensus settings, submit for governance signoff, record the Study PI signoff, record the Ethics PI signoff as the assigned Ethics & Methods Steward, then activate the version as Study Owner / PI.
      </WarningBanner>

      <div className="workflow-steps">
        {steps.map((step, index) => {
          const done = workflowStepDone(workflow, step.id);
          const busy = workflow.busyStep === step.id;
          const unavailable = step.disabled || busy || workflowBusy;

          return (
            <article className="workflow-step" key={step.id}>
              <div className="workflow-index">{index + 1}</div>
              <div>
                <div className="split-line">
                  <strong>{step.label}</strong>
                  <StatusBadge risk={done ? "success" : "info"} label={done ? "Done" : step.roleNote} />
                </div>
                <p>{step.detail}</p>
                {unavailable && !done && step.disabledReason ? (
                  <small className="workflow-disabled-reason">{step.disabledReason}</small>
                ) : null}
              </div>
              <button
                className="secondary-button"
                disabled={unavailable}
                onClick={() => onWorkflowStep(step.id)}
                type="button"
              >
                {busy ? "Working..." : done ? "Complete" : step.actionLabel}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
