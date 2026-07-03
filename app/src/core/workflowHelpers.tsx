/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import type { BackendSignoff, RoundConfig, StudyAssignment } from "./api";
import type {
  ActionChecklistItem,
  ConductorWorkflow,
  NextAction,
  RuntimeStudyData,
  WorkflowStep,
} from "./appTypes";
import { responseOpenText } from "./appUtils";
import type { ModuleId, UserRole } from "./types";
import { validateWizardStep, type StudyWizardState } from "./studyWizard";

export function NextActionPanel({
  nextAction,
  onNavigate,
  onRunCommand,
}: {
  nextAction: NextAction;
  onNavigate: (module: ModuleId) => void;
  onRunCommand: (command: NonNullable<NextAction["command"]>) => void;
}) {
  function runPrimaryAction() {
    if (nextAction.command) {
      onRunCommand(nextAction.command);
      return;
    }
    onNavigate(nextAction.module);
  }

  return (
    <section className={`next-action next-action-${nextAction.risk}`} aria-label="Next required action">
      <div>
        <span className="eyebrow">Next required action</span>
        <h2>{nextAction.title}</h2>
        <p>{nextAction.detail}</p>
      </div>
      <button className="primary-button" onClick={runPrimaryAction} type="button">
        {nextAction.actionLabel}
      </button>
    </section>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function hasSignoff(workflow: ConductorWorkflow, requiredRole: BackendSignoff["required_role"]): boolean {
  return workflow.signoffs.some((signoff) => signoff.required_role === requiredRole);
}

// eslint-disable-next-line react-refresh/only-export-components
export const studyRoleLabels: Record<StudyAssignment["role"], string> = {
  Owner: "Study Owner / PI",
  MethodsSteward: "Ethics & Methods Steward",
  PrivacyLead: "Security & Privacy Lead",
  DataCustodian: "Data Custodian",
  Maintainer: "Open Source Maintainer / Admin",
};

// eslint-disable-next-line react-refresh/only-export-components
export function concentratedAssignments(assignments: StudyAssignment[]) {
  const rolesByUser = new Map<string, Set<StudyAssignment["role"]>>();
  for (const assignment of assignments) {
    const roles = rolesByUser.get(assignment.user_id) ?? new Set<StudyAssignment["role"]>();
    roles.add(assignment.role);
    rolesByUser.set(assignment.user_id, roles);
  }

  return Array.from(rolesByUser.entries())
    .map(([userId, roles]) => ({ userId, roles: Array.from(roles).sort() }))
    .filter((entry) => entry.roles.length > 1);
}

// eslint-disable-next-line react-refresh/only-export-components
export function workflowStepDone(workflow: ConductorWorkflow, step: WorkflowStep): boolean {
  switch (step) {
    case "create-study":
      return Boolean(workflow.study);
    case "create-version":
      return Boolean(workflow.version);
    case "save-wizard-packet":
      return Boolean(workflow.version?.study_design_packet_json);
    case "set-design":
      return Boolean(workflow.version?.study_format);
    case "set-consensus":
      return Boolean(workflow.version?.consensus_rule_json);
    case "submit":
      return workflow.version?.status === "ReadyForSignoff" || workflow.version?.status === "Active";
    case "owner-signoff":
      return hasSignoff(workflow, "Owner");
    case "steward-signoff":
      return hasSignoff(workflow, "MethodsSteward");
    case "activate":
      return workflow.version?.status === "Active";
    case "open-round-1":
      return Boolean(workflow.version?.opened_round1_at);
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function buildNextAction(input: {
  role: UserRole;
  workflow: ConductorWorkflow;
  wizard: StudyWizardState;
  roundConfigs: RoundConfig[];
  runtimeData: RuntimeStudyData;
}): NextAction {
  const { role, workflow, wizard, roundConfigs, runtimeData } = input;
  const roundOneConfig = roundConfigs.find((config) => config.round_number === 1);
  const roundTwoConfig = roundConfigs.find((config) => config.round_number === 2);
  const openResponses = runtimeData.responses.filter((response) => responseOpenText(response.response_json));
  const publishedRoundTwoItems = runtimeData.items.filter((item) => item.round_number === 2 && item.status === "Published");
  const roundTwoSubmissionCount = runtimeData.roundReport?.summary.round_submission_count ?? 0;

  if (!workflow.study) {
    return {
      title: "Create or open a study",
      detail: "Start a backend study workspace from Study Builder, or open an existing saved study from the Dashboard.",
      module: "study-builder",
      actionLabel: "Go to Study Builder",
      risk: "warning",
    };
  }

  if (!workflow.version) {
    return {
      title: "Create the governed study version",
      detail: "The study exists, but it needs a draft StudyVersion before design, governance, and round setup can be saved.",
      module: "study-builder",
      actionLabel: "Continue setup",
      risk: "warning",
    };
  }

  if (!workflow.version.study_design_packet_json || validateWizardStep("review", wizard).length > 0) {
    return {
      title: "Complete and save the study design",
      detail: "Finish the Study Builder wizard so panel criteria, consent, feedback, AI, retention, and method settings travel together.",
      module: "study-builder",
      actionLabel: "Review design",
      risk: "warning",
    };
  }

  if (!workflow.version.study_format) {
    return {
      title: "Apply method design",
      detail: "Save the declared method, round count, terminal round, and method rationale before locking the consensus threshold.",
      module: "governance",
      actionLabel: "Apply method design",
      risk: "warning",
      command: { kind: "workflow-step", step: "set-design" },
    };
  }

  if (!workflow.version.consensus_rule_json) {
    return {
      title: "Lock consensus threshold",
      detail: "Save the predefined consensus threshold before governance signoff.",
      module: "governance",
      actionLabel: "Set consensus threshold",
      risk: "warning",
      command: { kind: "workflow-step", step: "set-consensus" },
    };
  }

  if (workflow.version.status === "Draft") {
    return {
      title: "Submit for governance signoff",
      detail: "The study design is ready for Study Owner and Ethics & Methods Steward review.",
      module: "governance",
      actionLabel: "Submit for signoff",
      risk: "warning",
      command: { kind: "workflow-step", step: "submit" },
    };
  }

  if (workflow.version.status === "ReadyForSignoff") {
    const missing = [
      hasSignoff(workflow, "Owner") ? null : "Study PI",
      hasSignoff(workflow, "MethodsSteward") ? null : "Ethics PI",
    ].filter(Boolean).join(" and ");

    return {
      title: missing ? `${missing} signoff required` : "Activate the governed version",
      detail: missing
        ? "Use Current role: Study Owner / PI for the Study PI signoff. Assign the Ethics PI as Ethics & Methods Steward in Admin / Security, then switch Current role to Ethics & Methods Steward for the second signoff."
        : "Both governance signoffs are recorded; the Study Owner / PI can activate the version before round setup.",
      module: "governance",
      actionLabel: !hasSignoff(workflow, "Owner") && role === "study_owner"
        ? "Record Study PI signoff"
        : !hasSignoff(workflow, "MethodsSteward") && role === "ethics_methods_steward"
          ? "Record Ethics PI signoff"
          : !missing && role === "study_owner"
            ? "Activate version"
            : "Open signoff gate",
      risk: "warning",
      command: !hasSignoff(workflow, "Owner") && role === "study_owner"
        ? { kind: "workflow-step", step: "owner-signoff" }
        : !hasSignoff(workflow, "MethodsSteward") && role === "ethics_methods_steward"
          ? { kind: "workflow-step", step: "steward-signoff" }
          : !missing && role === "study_owner"
            ? { kind: "workflow-step", step: "activate" }
            : undefined,
    };
  }

  if (!roundOneConfig) {
    return {
      title: "Configure Round 1",
      detail: "Set the open-ended prompt, participant instructions, response window, reminder language, and consent text.",
      module: "round-manager",
      actionLabel: "Configure Round 1",
      risk: "warning",
    };
  }

  if (roundOneConfig.status !== "Open" && roundOneConfig.status !== "Closed") {
    return {
      title: "Open Round 1",
      detail: "Round 1 is configured and ready. Opening it makes the participant task available.",
      module: "round-manager",
      actionLabel: "Open round controls",
      risk: "warning",
    };
  }

  if (roundOneConfig.status === "Open" && openResponses.length === 0) {
    return {
      title: "Collect Round 1 responses",
      detail: "The participant portal is open for Round 1. Responses will feed the Curation Desk.",
      module: "participant",
      actionLabel: "View participant task",
      risk: "info",
    };
  }

  if (roundOneConfig.status === "Open") {
    return {
      title: "Close Round 1 when collection is complete",
      detail: `${openResponses.length} Round 1 response${openResponses.length === 1 ? "" : "s"} are available for curation. Close Round 1 before opening Round 2.`,
      module: "round-manager",
      actionLabel: "Close Round 1",
      risk: "info",
      command: {
        kind: "transition-round",
        roundNumber: 1,
        action: "close",
      },
    };
  }

  if (publishedRoundTwoItems.length === 0) {
    return {
      title: "Curate and publish Round 2 items",
      detail: "Create traceable candidate items from Round 1 responses, handle AI suggestions with human decisions, and publish participant-facing items.",
      module: "curation",
      actionLabel: "Open Curation",
      risk: "warning",
    };
  }

  if (!roundTwoConfig) {
    return {
      title: "Configure Round 2",
      detail: "Set the structured rating instructions, response window, reminders, and controlled feedback posture.",
      module: "round-manager",
      actionLabel: "Configure Round 2",
      risk: "warning",
    };
  }

  if (roundTwoConfig.status !== "Open" && roundTwoConfig.status !== "Closed") {
    return {
      title: "Open Round 2",
      detail: `${publishedRoundTwoItems.length} published item${publishedRoundTwoItems.length === 1 ? "" : "s"} are ready for participant rating.`,
      module: "round-manager",
      actionLabel: "Open Round 2",
      risk: "warning",
      command: {
        kind: "transition-round",
        roundNumber: 2,
        action: "open",
      },
    };
  }

  if (roundTwoConfig.status === "Open" && roundTwoSubmissionCount === 0) {
    return {
      title: "Collect Round 2 ratings",
      detail: "Round 2 is open. Participant ratings will populate the real reporting dashboard.",
      module: "participant",
      actionLabel: "View rating task",
      risk: "info",
    };
  }

  return {
    title: "Review real reporting",
    detail: "Ratings are available. Review consensus, non-consensus, limitations, and export permissions.",
    module: "reporting",
    actionLabel: "Open Reporting",
    risk: "success",
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function buildActionableChecklist(input: {
  workflow: ConductorWorkflow;
  roundConfigs: RoundConfig[];
  runtimeData: RuntimeStudyData;
}): ActionChecklistItem[] {
  const { workflow, roundConfigs, runtimeData } = input;
  const roundOneConfig = roundConfigs.find((config) => config.round_number === 1);
  const roundTwoConfig = roundConfigs.find((config) => config.round_number === 2);
  const openResponses = runtimeData.responses.filter((response) => responseOpenText(response.response_json));
  const publishedRoundTwoItems = runtimeData.items.filter((item) => item.round_number === 2 && item.status === "Published");
  const roundTwoSubmissionCount = runtimeData.roundReport?.summary.round_submission_count ?? 0;

  return [
    {
      label: "Study design saved",
      detail: "Study Builder packet is attached to the version.",
      complete: Boolean(workflow.version?.study_design_packet_json),
    },
    {
      label: "Governance complete",
      detail: "Method, consensus threshold, dual signoff, and activation are complete.",
      complete: workflow.version?.status === "Active",
    },
    {
      label: "Round 1 configured",
      detail: "Prompt, instructions, consent, window, and reminders are ready.",
      complete: Boolean(roundOneConfig),
    },
    {
      label: "Round 1 collection complete",
      detail: "Round 1 has collected responses and is closed before curation release.",
      complete: roundOneConfig?.status === "Closed" && openResponses.length > 0,
    },
    {
      label: "Round 2 items published",
      detail: "Traceable candidate statements are participant-facing.",
      complete: publishedRoundTwoItems.length > 0,
    },
    {
      label: "Round 2 configured and open",
      detail: "Structured rating task is available to participants.",
      complete: roundTwoConfig?.status === "Open" || roundTwoConfig?.status === "Closed",
    },
    {
      label: "Round 2 ratings received",
      detail: "Real ratings are available for reporting.",
      complete: roundTwoSubmissionCount > 0,
    },
    {
      label: "Reporting review ready",
      detail: "Consensus, non-consensus, limitations, and export permissions can be reviewed.",
      complete: Boolean(runtimeData.roundReport ?? runtimeData.exportReport),
    },
  ];
}
