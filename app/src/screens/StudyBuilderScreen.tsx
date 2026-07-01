/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import { useEffect, useState } from "react";
import {
  conductorApi,
  type StudyContextDisclosure,
  type StudyContextValidation,
} from "../core/api";
import type { WorkflowStep } from "../core/appTypes";
import type { ModuleId } from "../core/types";
import { formatStatus, humanizeBackendMessage } from "../core/appUtils";
import { useAppContext } from "../core/AppContext";
import { methodRegistry } from "../methods/registry";
import {
  buildGovernanceSummary,
  consensusRuleSourceLabels,
  consensusSourceRequiresPreRoundInput,
  createResearchQuestionDraft,
  normalizeWizardForMethod,
  normalizeWizardResearchQuestions,
  preRoundConsensusStatusLabels,
  validateWizardStep,
  wizardSteps,
  type ResearchQuestion,
  type StudyWizardState,
  type StudyWizardStepId,
} from "../core/studyWizard";
import { DataBar, StatusBadge, WarningBanner } from "../components/ui/Primitives";
import { ConductorWorkflowPanel } from "./ConductorWorkflowPanel";
import { workflowStepDone } from "../core/workflowHelpers";

const ternaryOptions = [
  ["not_specified", "Not specified"],
  ["no", "No"],
  ["yes", "Yes"],
  ["not_applicable", "Not applicable"],
  ["unknown_needs_review", "Unknown / needs review"],
] as const;

export function StudyBuilderScreen({
  activeWizardStep,
  onWizardChange,
  onWizardStepChange,
  onWorkflowStep,
  onStartNewStudyDraft,
  onNavigateModule,
}: {
  activeWizardStep: StudyWizardStepId;
  onWizardChange: (state: StudyWizardState) => void;
  onWizardStepChange: (step: StudyWizardStepId) => void;
  onWorkflowStep: (step: WorkflowStep) => void;
  onStartNewStudyDraft: () => void;
  onNavigateModule?: (module: ModuleId) => void;
}) {
  const { role, workflow, wizard } = useAppContext();
  const selectedMethod = methodRegistry.find((method) =>
    wizard.studyFormat === "ModifiedDelphi" ? method.id === "modified-delphi" : method.id === "classic-delphi",
  );
  const activeIndex = wizardSteps.findIndex((step) => step.id === activeWizardStep);
  const activeStep = wizardSteps[activeIndex] ?? wizardSteps[0];
  const activeBlockers = validateWizardStep(activeStep.id, wizard);
  const reviewBlockers = validateWizardStep("review", wizard);
  const wizardProgress = Math.round(((activeIndex + 1) / wizardSteps.length) * 100);
  const governanceSummary = buildGovernanceSummary(wizard);
  const saveButtonLabel = activeStep.id === "review" ? "Save study design" : "Save section";
  const saveBlocked =
    role !== "study_owner" ||
    (workflow.version !== null && workflow.version.status !== "Draft") ||
    workflow.busyStep !== null;
  const instrumentLocked = Boolean(workflow.version && workflow.version.status !== "Draft");
  const designSaved = workflowStepDone(workflow, "save-wizard-packet");
  const governanceReady = designSaved && reviewBlockers.length === 0 && !workflowStepDone(workflow, "activate");
  const [contextOpen, setContextOpen] = useState(false);
  const [contextRecord, setContextRecord] = useState<StudyContextDisclosure | null>(null);
  const [contextValidation, setContextValidation] = useState<StudyContextValidation | null>(null);
  const [contextBusy, setContextBusy] = useState<string | null>(null);
  const [contextMessage, setContextMessage] = useState<string | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const [proposalSourceName, setProposalSourceName] = useState("");
  const [proposalSourceText, setProposalSourceText] = useState("");

  useEffect(() => {
    if (!contextOpen) return;
    if (!workflow.study || !workflow.version) {
      setContextRecord((current) => current ?? createDraftStudyContext(wizard));
      setContextValidation((current) => current ?? validateDraftStudyContext(createDraftStudyContext(wizard)));
      setContextError(null);
      setContextBusy(null);
      return;
    }
    let cancelled = false;
    setContextBusy("load");
    setContextError(null);
    conductorApi
      .getStudyContextDisclosure(workflow.study.id, workflow.version.id, role)
      .then((result) => {
        if (cancelled) return;
        setContextRecord(result.context);
        setContextValidation(result.validation);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Unable to load study context.";
        if (message === "study_version_not_found" || message === "Not Found") {
          const draft = createDraftStudyContext(wizard);
          setContextRecord((current) => current ?? draft);
          setContextValidation(validateDraftStudyContext(draft));
          setContextMessage("Draft preview mode is available. Create or open the backend study before saving audited context.");
          return;
        }
        setContextError(message);
      })
      .finally(() => {
        if (!cancelled) setContextBusy(null);
      });
    return () => {
      cancelled = true;
    };
  }, [contextOpen, role, workflow.study, workflow.version, wizard]);

  async function saveContext(record = contextRecord) {
    if (!record) return;
    if (!workflow.study || !workflow.version) {
      const validation = validateDraftStudyContext(record);
      setContextRecord({ ...record, status: contextHasSuppliedDraft(record) ? "draft" : "optional" });
      setContextValidation(validation);
      setContextError(null);
      setContextMessage("Draft kept in this Study Builder session. Create or open the backend study before saving audited context.");
      return;
    }
    setContextBusy("save");
    setContextError(null);
    setContextMessage(null);
    try {
      const result = await conductorApi.updateStudyContextDisclosure(workflow.study.id, workflow.version.id, role, record);
      setContextRecord(result.context);
      setContextValidation(result.validation);
      setContextMessage("Study context saved. Blank optional fields remain non-blocking.");
    } catch (error) {
      setContextError(error instanceof Error ? error.message : "Unable to save study context.");
    } finally {
      setContextBusy(null);
    }
  }

  async function generateContextDisclosure() {
    if (!contextRecord) return;
    if (!workflow.study || !workflow.version) {
      const generated = generateDraftParticipantDisclosure(contextRecord);
      setContextRecord(generated);
      setContextValidation(validateDraftStudyContext(generated));
      setContextError(null);
      setContextMessage("Draft participant disclosure preview generated. Save a backend study to include it in audited exports.");
      return;
    }
    setContextBusy("generate");
    setContextError(null);
    setContextMessage(null);
    try {
      const result = await conductorApi.generateStudyContextParticipantDisclosure(workflow.study.id, workflow.version.id, role);
      setContextRecord(result.context);
      setContextValidation(result.validation);
      setContextMessage("Participant-facing disclosure preview generated from supplied metadata.");
    } catch (error) {
      setContextError(error instanceof Error ? error.message : "Unable to generate disclosure.");
    } finally {
      setContextBusy(null);
    }
  }

  async function runProposalImport() {
    if (!proposalSourceText.trim()) return;
    if (!workflow.study || !workflow.version) {
      setContextError(null);
      setContextMessage("Create or open the backend study before running audited proposal extraction. The proposal text is not uploaded in draft preview mode.");
      return;
    }
    setContextBusy("import");
    setContextError(null);
    setContextMessage(null);
    try {
      const result = await conductorApi.importStudyContextProposal(
        workflow.study.id,
        workflow.version.id,
        role,
        proposalSourceName || "pasted proposal text",
        proposalSourceText,
      );
      setContextRecord(result.context);
      setContextValidation(result.validation);
      setContextMessage("AI extraction suggestions created for human review. Nothing is final until accepted or edited.");
    } catch (error) {
      setContextError(error instanceof Error ? error.message : "Unable to import proposal text.");
    } finally {
      setContextBusy(null);
    }
  }

  async function decideContextSuggestion(
    suggestionId: string,
    action: "accept" | "edit" | "reject",
    editedValue?: string | boolean | null,
  ) {
    if (!workflow.study || !workflow.version) return;
    setContextBusy(suggestionId);
    setContextError(null);
    setContextMessage(null);
    try {
      const result = await conductorApi.decideStudyContextSuggestion(
        workflow.study.id,
        workflow.version.id,
        role,
        suggestionId,
        action,
        editedValue,
      );
      setContextRecord(result.context);
      setContextValidation(result.validation);
      setContextMessage(`Suggestion ${action === "reject" ? "rejected" : action === "edit" ? "edited and applied" : "accepted and applied"}.`);
    } catch (error) {
      setContextError(error instanceof Error ? error.message : "Unable to update suggestion.");
    } finally {
      setContextBusy(null);
    }
  }

  function updateContextDraft(nextContext: StudyContextDisclosure | null) {
    setContextRecord(nextContext);
    if (!workflow.study || !workflow.version) {
      setContextValidation(nextContext ? validateDraftStudyContext(nextContext) : null);
    }
  }

  const contextStatusLabel = contextRecord?.proposal_import.suggestions.some((suggestion) => suggestion.status === "pending")
    ? "AI suggestions pending review"
    : contextValidation?.status === "review_recommended"
      ? "Steward review recommended"
      : contextRecord?.status === "supplied" || contextRecord?.status === "draft"
        ? "Draft context added"
        : "Optional";

  function updateWizard(patch: Partial<StudyWizardState>) {
    onWizardChange(normalizeWizardResearchQuestions({ ...wizard, ...patch }));
  }

  function updateMethod(studyFormat: StudyWizardState["studyFormat"]) {
    onWizardChange(normalizeWizardResearchQuestions(normalizeWizardForMethod({ ...wizard, studyFormat })));
  }

  function moveWizard(delta: number) {
    const nextStep = wizardSteps[Math.min(Math.max(activeIndex + delta, 0), wizardSteps.length - 1)];
    onWizardStepChange(nextStep.id);
  }

  return (
    <div className="wizard-layout">
      <section className="panel wide">
        <div className="section-heading builder-heading">
          <div>
            <span className="eyebrow">Study Builder</span>
            <h2>Design the study once, then carry it into governance and launch</h2>
          </div>
          <div className="compact-actions">
            {role === "study_owner" && workflow.study ? (
              <button className="secondary-button" onClick={onStartNewStudyDraft} type="button">
                Start new study
              </button>
            ) : null}
            <button className="context-sidecar-trigger" onClick={() => setContextOpen(true)} type="button">
              <span>Study Context & Disclosures</span>
              <small>{contextStatusLabel}</small>
            </button>
          </div>
        </div>
        <div className="wizard-stepper" role="tablist" aria-label="Study builder steps">
          {wizardSteps.map((step, index) => {
            const complete = validateWizardStep(step.id, wizard).length === 0;

            return (
            <button
              aria-selected={activeWizardStep === step.id}
              className={activeWizardStep === step.id ? "step-chip active" : "step-chip"}
              key={step.id}
              onClick={() => onWizardStepChange(step.id)}
              role="tab"
              type="button"
            >
              <span>{index + 1}</span>
              <strong>{step.label}</strong>
              <small>{complete ? "Complete" : "Needs input"}</small>
            </button>
            );
          })}
        </div>
      </section>

      <section className="panel wizard-main">
        <div className="split-line">
          <div>
            <span className="eyebrow">Step {activeIndex + 1} of {wizardSteps.length}</span>
            <h3>{activeStep.label}</h3>
            <p className="muted">{activeStep.description}</p>
          </div>
          <StatusBadge risk={activeBlockers.length === 0 ? "success" : "warning"} label={activeBlockers.length === 0 ? "Complete" : `${activeBlockers.length} blocker${activeBlockers.length === 1 ? "" : "s"}`} />
        </div>

        <WizardStepFields
          step={activeStep.id}
          wizard={wizard}
          selectedMethodLabel={selectedMethod?.label ?? "Delphi"}
          instrumentLocked={instrumentLocked}
          onChange={updateWizard}
          onMethodChange={updateMethod}
        />

        {activeBlockers.length > 0 ? (
          <WarningBanner title="Missing requirement" risk="warning">
            <ul className="compact-list">
              {activeBlockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </WarningBanner>
        ) : null}


        <div className="wizard-actions">
          <button className="secondary-button" disabled={activeIndex === 0} onClick={() => moveWizard(-1)} type="button">
            Previous
          </button>
          <button
            className={activeStep.id === "review" ? "primary-button" : "secondary-button"}
            disabled={saveBlocked}
            onClick={() => onWorkflowStep("save-wizard-packet")}
            type="button"
          >
            {workflow.busyStep === "save-wizard-packet" ? "Saving..." : saveButtonLabel}
          </button>
          <button
            className="primary-button"
            disabled={activeIndex === wizardSteps.length - 1}
            onClick={() => moveWizard(1)}
            type="button"
          >
            Next
          </button>
        </div>

        {governanceReady && onNavigateModule ? (
          <WarningBanner title="Design saved — governance signoff is next" risk="info">
            The study design packet is saved. Continue to the Governance screen to apply method design, set the consensus threshold, submit for signoff, and record Study PI and Ethics PI approvals.
            <div style={{ marginTop: "0.5rem" }}>
              <button className="primary-button" onClick={() => onNavigateModule("governance")} type="button">
                Continue to Governance
              </button>
            </div>
          </WarningBanner>
        ) : null}
      </section>

      <section className="panel wizard-side">
        <h3>Readiness</h3>
        <DataBar value={wizardProgress} label="Wizard progress" />
        <dl className="detail-list">
          <div>
            <dt>Current step</dt>
            <dd>{activeIndex + 1} of {wizardSteps.length}</dd>
          </div>
          <div>
            <dt>Governance readiness</dt>
            <dd>{reviewBlockers.length === 0 ? "Ready" : "Needs input"}</dd>
          </div>
          <div>
            <dt>Backend study</dt>
            <dd>{workflow.study ? "Saved" : "Not saved"}</dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd>{workflow.version ? formatStatus(workflow.version.status) : "Not created"}</dd>
          </div>
          <div>
            <dt>Governance blockers</dt>
            <dd>{reviewBlockers.length}</dd>
          </div>
        </dl>
        <WarningBanner title="Method guardrail" risk="info">
          Round 1 should collect open-ended input unless a modified Delphi design is explicitly documented with a bias warning.
        </WarningBanner>
      </section>

      <section className="panel wide">
        <div className="split-line">
          <div>
            <h3>Governance and IRB Study Summary</h3>
            <p className="muted">This is the working summary produced by the wizard. It is ready to become the governance packet once blockers are cleared.</p>
          </div>
          <StatusBadge risk={reviewBlockers.length === 0 ? "success" : "warning"} label={reviewBlockers.length === 0 ? "Ready for backend save" : "Draft"} />
        </div>
        <div className="summary-grid">
          {governanceSummary.map((item) => (
            <article className="summary-item" key={item.label}>
              <strong>{item.label}</strong>
              <p>{item.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <ConductorWorkflowPanel onWorkflowStep={onWorkflowStep} />
      </section>

      {contextOpen ? (
        <StudyContextSidecar
          busy={contextBusy}
          context={contextRecord}
          error={contextError}
          hasBackendStudy={Boolean(workflow.study && workflow.version)}
          message={contextMessage}
          proposalSourceName={proposalSourceName}
          proposalSourceText={proposalSourceText}
          validation={contextValidation}
          onClose={() => setContextOpen(false)}
          onContextChange={updateContextDraft}
          onGenerateDisclosure={generateContextDisclosure}
          onImportProposal={runProposalImport}
          onProposalSourceNameChange={setProposalSourceName}
          onProposalSourceTextChange={setProposalSourceText}
          onSave={saveContext}
          onSuggestionDecision={decideContextSuggestion}
        />
      ) : null}
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function createDraftStudyContext(wizard: StudyWizardState): StudyContextDisclosure {
  const now = new Date().toISOString();
  return {
    study_id: "draft",
    version_id: "draft",
    status: "optional",
    basic_context: {
      study_title: wizard.title,
      study_short_name: "",
      pi_or_study_owner: "",
      institution_or_organization: "",
    },
    funding: {
      funding_status: "not_specified",
      funder_name: "",
      sponsor_name: "",
      grant_or_contract_number: "",
      sponsor_roles: [],
      role_details: "",
    },
    data_access: {
      sponsor_can_access_raw_responses: "not_specified",
      sponsor_can_access_identifiable_data: "not_specified",
      sponsor_can_access_aggregate_results: "not_specified",
      sponsor_has_report_review_rights: "not_specified",
      sponsor_has_report_approval_rights: "not_specified",
      sponsor_has_publication_approval_rights: "not_specified",
      dissemination_constraints: "",
      data_ownership_statement: "",
    },
    coi: {
      no_known_coi: false,
      coi_statement: "",
      required_disclosure_language: "",
      reviewer_notes: "",
    },
    participant_disclosure: {
      generated_text: "",
      last_generated_at: null,
      edited_text: "",
      requires_review: false,
      review_reasons: [],
    },
    proposal_import: {
      source_document_name: "",
      source_text_hash: "",
      source_text_excerpt: "",
      extraction_mode: "none",
      extraction_invoked_at: now,
      suggestions: [],
    },
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function contextHasSuppliedDraft(context: StudyContextDisclosure): boolean {
  return Boolean(
    context.basic_context.study_short_name.trim() ||
      context.basic_context.pi_or_study_owner.trim() ||
      context.basic_context.institution_or_organization.trim() ||
      context.funding.funding_status !== "not_specified" ||
      context.funding.funder_name.trim() ||
      context.funding.sponsor_name.trim() ||
      context.funding.grant_or_contract_number.trim() ||
      context.funding.role_details.trim() ||
      context.data_access.sponsor_can_access_raw_responses !== "not_specified" ||
      context.data_access.sponsor_can_access_identifiable_data !== "not_specified" ||
      context.data_access.sponsor_can_access_aggregate_results !== "not_specified" ||
      context.data_access.sponsor_has_report_review_rights !== "not_specified" ||
      context.data_access.sponsor_has_report_approval_rights !== "not_specified" ||
      context.data_access.sponsor_has_publication_approval_rights !== "not_specified" ||
      context.data_access.dissemination_constraints.trim() ||
      context.data_access.data_ownership_statement.trim() ||
      context.coi.no_known_coi ||
      context.coi.coi_statement.trim() ||
      context.coi.required_disclosure_language.trim() ||
      context.participant_disclosure.generated_text.trim() ||
      context.participant_disclosure.edited_text.trim(),
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function draftMaterialConditions(context: StudyContextDisclosure): string[] {
  const conditions: string[] = [];
  if (context.data_access.sponsor_can_access_raw_responses === "yes") conditions.push("sponsor_raw_response_access");
  if (context.data_access.sponsor_can_access_identifiable_data === "yes") conditions.push("sponsor_identifiable_data_access");
  if (context.data_access.sponsor_has_report_approval_rights === "yes") conditions.push("sponsor_report_approval_rights");
  if (context.data_access.sponsor_has_publication_approval_rights === "yes") conditions.push("sponsor_publication_control");
  if (!context.coi.no_known_coi && context.coi.coi_statement.trim()) conditions.push("material_coi_statement");
  return conditions;
}

// eslint-disable-next-line react-refresh/only-export-components
export function validateDraftStudyContext(context: StudyContextDisclosure): StudyContextValidation {
  const materialConditions = draftMaterialConditions(context);
  const warnings = materialConditions.length > 0 && !(
    context.participant_disclosure.edited_text.trim() ||
    context.participant_disclosure.generated_text.trim()
  )
    ? ["Supplied sponsor, data-access, publication-control, or COI conditions should be reflected in the participant-facing disclosure."]
    : [];

  return {
    status: materialConditions.length > 0 ? "review_recommended" : contextHasSuppliedDraft(context) ? "ready" : "optional",
    warnings,
    material_conditions: materialConditions,
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function generateDraftParticipantDisclosure(context: StudyContextDisclosure): StudyContextDisclosure {
  const conductor = context.basic_context.institution_or_organization.trim()
    || context.basic_context.pi_or_study_owner.trim()
    || "the study team";
  const funderOrSponsor = context.funding.sponsor_name.trim() || context.funding.funder_name.trim();
  const hasNoExternal = context.funding.funding_status === "no_external_funding_or_sponsor";
  const sentences = [`This study is conducted by ${conductor}.`];

  if (hasNoExternal || !funderOrSponsor) {
    sentences.push("No external funder or sponsor has been listed for this study.");
  } else {
    sentences.push(`It is supported by ${funderOrSponsor}.`);
    if (context.data_access.sponsor_can_access_identifiable_data === "yes") {
      sentences.push("The sponsor/funder may access identifiable data as described in this study's confidentiality and data-use terms.");
    } else if (context.data_access.sponsor_can_access_raw_responses === "yes") {
      sentences.push("The sponsor/funder may access individual responses as described in this study's confidentiality and data-use terms.");
    } else if (context.data_access.sponsor_can_access_aggregate_results === "yes") {
      sentences.push("The sponsor/funder may receive aggregate results, but individual responses will not be shared.");
    } else {
      sentences.push("No additional sponsor role has been specified.");
    }
    if (
      context.data_access.sponsor_has_report_approval_rights === "yes" ||
      context.data_access.sponsor_has_publication_approval_rights === "yes"
    ) {
      sentences.push("The sponsor/funder has a review or approval role in dissemination, as described in this study's disclosure materials.");
    }
  }

  if (!context.coi.no_known_coi && context.coi.coi_statement.trim()) {
    sentences.push(context.coi.required_disclosure_language.trim() || context.coi.coi_statement.trim());
  }

  const materialConditions = draftMaterialConditions(context);
  return {
    ...context,
    status: contextHasSuppliedDraft(context) ? "draft" : "optional",
    participant_disclosure: {
      ...context.participant_disclosure,
      generated_text: sentences.join(" "),
      last_generated_at: new Date().toISOString(),
      requires_review: materialConditions.length > 0,
      review_reasons: materialConditions,
    },
  };
}

export function StudyContextSidecar({
  busy,
  context,
  error,
  hasBackendStudy,
  message,
  proposalSourceName,
  proposalSourceText,
  validation,
  onClose,
  onContextChange,
  onGenerateDisclosure,
  onImportProposal,
  onProposalSourceNameChange,
  onProposalSourceTextChange,
  onSave,
  onSuggestionDecision,
}: {
  busy: string | null;
  context: StudyContextDisclosure | null;
  error: string | null;
  hasBackendStudy: boolean;
  message: string | null;
  proposalSourceName: string;
  proposalSourceText: string;
  validation: StudyContextValidation | null;
  onClose: () => void;
  onContextChange: (context: StudyContextDisclosure | null) => void;
  onGenerateDisclosure: () => void;
  onImportProposal: () => void;
  onProposalSourceNameChange: (value: string) => void;
  onProposalSourceTextChange: (value: string) => void;
  onSave: (context?: StudyContextDisclosure | null) => void;
  onSuggestionDecision: (suggestionId: string, action: "accept" | "edit" | "reject", editedValue?: string | boolean | null) => void;
}) {
  const pendingSuggestions = context?.proposal_import.suggestions.filter((suggestion) => suggestion.status === "pending") ?? [];
  const hasSponsorContext =
    context?.funding.funding_status === "externally_funded" ||
    context?.funding.funding_status === "sponsor_corporate_partner_involved";
  const hasMaterialContext = (validation?.material_conditions.length ?? 0) > 0;

  function patchContext(patch: Partial<StudyContextDisclosure>) {
    if (!context) return;
    onContextChange({ ...context, ...patch });
  }

  function patchBasic(patch: Partial<StudyContextDisclosure["basic_context"]>) {
    if (!context) return;
    patchContext({ basic_context: { ...context.basic_context, ...patch } });
  }

  function patchFunding(patch: Partial<StudyContextDisclosure["funding"]>) {
    if (!context) return;
    patchContext({ funding: { ...context.funding, ...patch } });
  }

  function patchDataAccess(patch: Partial<StudyContextDisclosure["data_access"]>) {
    if (!context) return;
    patchContext({ data_access: { ...context.data_access, ...patch } });
  }

  function patchCoi(patch: Partial<StudyContextDisclosure["coi"]>) {
    if (!context) return;
    patchContext({ coi: { ...context.coi, ...patch } });
  }

  function patchParticipantDisclosure(patch: Partial<StudyContextDisclosure["participant_disclosure"]>) {
    if (!context) return;
    patchContext({ participant_disclosure: { ...context.participant_disclosure, ...patch } });
  }

  return (
    <div className="sidecar-backdrop" role="presentation">
      <aside aria-label="Study Context & Disclosures" className="sidecar-panel">
        <div className="sidecar-header">
          <div>
            <span className="eyebrow">Optional sidecar</span>
            <h3>Study Context & Disclosures</h3>
            <p className="muted">Add funding, sponsorship, COI, and proposal context only when useful. Blank fields do not block launch.</p>
          </div>
          <button className="secondary-button icon-text" onClick={onClose} type="button">Close</button>
        </div>

        {!hasBackendStudy ? (
          <WarningBanner title="Draft preview mode" risk="info">
            You can draft context and preview participant disclosure now. Create or open the backend study before audited saving, proposal extraction, or export inclusion.
          </WarningBanner>
        ) : null}

        {busy === "load" ? <WarningBanner title="Loading" risk="info">Loading optional context.</WarningBanner> : null}
        {message ? <WarningBanner title="Context update" risk="success">{message}</WarningBanner> : null}
        {error ? <WarningBanner title="Context action blocked" risk="danger">{humanizeBackendMessage(error)}</WarningBanner> : null}

        {context ? (
          <>
            <div className="context-status-grid">
              <StatusBadge risk={validation?.status === "review_recommended" ? "warning" : context.status === "supplied" ? "success" : "info"} label={validation?.status === "review_recommended" ? "Steward review recommended" : context.status === "supplied" ? "Draft context added" : "Optional"} />
              <StatusBadge risk={pendingSuggestions.length > 0 ? "warning" : "info"} label={pendingSuggestions.length > 0 ? "AI suggestions pending review" : "No pending AI suggestions"} />
              <StatusBadge risk={hasMaterialContext ? "warning" : "info"} label={hasMaterialContext ? "COI/sponsor detail added" : "No material sponsor/COI condition supplied"} />
            </div>

            <section className="sidecar-section">
              <h4>Basic context</h4>
              <div className="form-grid compact-form-grid">
                <label className="field">
                  <span>Study short name</span>
                  <input value={context.basic_context.study_short_name} onChange={(event) => patchBasic({ study_short_name: event.target.value })} />
                </label>
                <label className="field">
                  <span>PI / study owner</span>
                  <input value={context.basic_context.pi_or_study_owner} onChange={(event) => patchBasic({ pi_or_study_owner: event.target.value })} />
                </label>
                <label className="field wide-field">
                  <span>Institution or organization</span>
                  <input value={context.basic_context.institution_or_organization} onChange={(event) => patchBasic({ institution_or_organization: event.target.value })} />
                </label>
              </div>
            </section>

            <section className="sidecar-section">
              <h4>Funding and sponsorship</h4>
              <div className="form-grid compact-form-grid">
                <label className="field wide-field">
                  <span>Funding/sponsorship status</span>
                  <select value={context.funding.funding_status} onChange={(event) => patchFunding({ funding_status: event.target.value as StudyContextDisclosure["funding"]["funding_status"] })}>
                    <option value="not_specified">Not specified</option>
                    <option value="no_external_funding_or_sponsor">No external funding or sponsor</option>
                    <option value="internally_supported">Internally supported</option>
                    <option value="externally_funded">Externally funded</option>
                    <option value="sponsor_corporate_partner_involved">Sponsor/corporate partner involved</option>
                    <option value="other_needs_explanation">Other / needs explanation</option>
                  </select>
                </label>
                {hasSponsorContext ? (
                  <>
                    <label className="field">
                      <span>Funder name</span>
                      <input value={context.funding.funder_name} onChange={(event) => patchFunding({ funder_name: event.target.value })} />
                    </label>
                    <label className="field">
                      <span>Sponsor/corporate partner</span>
                      <input value={context.funding.sponsor_name} onChange={(event) => patchFunding({ sponsor_name: event.target.value })} />
                    </label>
                    <label className="field">
                      <span>Grant or contract number</span>
                      <input value={context.funding.grant_or_contract_number} onChange={(event) => patchFunding({ grant_or_contract_number: event.target.value })} />
                    </label>
                    <label className="field">
                      <span>Sponsor/funder role</span>
                      <select
                        value={context.funding.sponsor_roles[0] ?? "not_specified"}
                        onChange={(event) => patchFunding({ sponsor_roles: [event.target.value] })}
                      >
                        <option value="not_specified">Not specified</option>
                        <option value="no_role_after_funding">No role after funding</option>
                        <option value="study_design_input">Study design input</option>
                        <option value="recruitment_support">Recruitment support</option>
                        <option value="data_access">Data access</option>
                        <option value="report_review">Report review</option>
                        <option value="publication_approval">Publication approval</option>
                        <option value="other_needs_explanation">Other / needs explanation</option>
                      </select>
                    </label>
                    <label className="field wide-field">
                      <span>Role details</span>
                      <textarea value={context.funding.role_details} onChange={(event) => patchFunding({ role_details: event.target.value })} />
                    </label>
                  </>
                ) : (
                  <WarningBanner title="Lean default" risk="info">
                    Sponsor details stay hidden unless external funding or sponsor involvement is selected.
                  </WarningBanner>
                )}
              </div>
            </section>

            {hasSponsorContext ? (
              <section className="sidecar-section">
                <h4>Data access and dissemination</h4>
                <div className="form-grid compact-form-grid">
                  <TernarySelect label="Sponsor/funder can access raw responses" value={context.data_access.sponsor_can_access_raw_responses} onChange={(value) => patchDataAccess({ sponsor_can_access_raw_responses: value })} />
                  <TernarySelect label="Sponsor/funder can access identifiable data" value={context.data_access.sponsor_can_access_identifiable_data} onChange={(value) => patchDataAccess({ sponsor_can_access_identifiable_data: value })} />
                  <TernarySelect label="Sponsor/funder can access aggregate results" value={context.data_access.sponsor_can_access_aggregate_results} onChange={(value) => patchDataAccess({ sponsor_can_access_aggregate_results: value })} />
                  <TernarySelect label="Report review rights" value={context.data_access.sponsor_has_report_review_rights} onChange={(value) => patchDataAccess({ sponsor_has_report_review_rights: value })} />
                  <TernarySelect label="Report approval rights" value={context.data_access.sponsor_has_report_approval_rights} onChange={(value) => patchDataAccess({ sponsor_has_report_approval_rights: value })} />
                  <TernarySelect label="Publication approval/control rights" value={context.data_access.sponsor_has_publication_approval_rights} onChange={(value) => patchDataAccess({ sponsor_has_publication_approval_rights: value })} />
                  <label className="field wide-field">
                    <span>Publication / dissemination constraints</span>
                    <textarea value={context.data_access.dissemination_constraints} onChange={(event) => patchDataAccess({ dissemination_constraints: event.target.value })} />
                  </label>
                  <label className="field wide-field">
                    <span>Data ownership statement</span>
                    <textarea value={context.data_access.data_ownership_statement} onChange={(event) => patchDataAccess({ data_ownership_statement: event.target.value })} />
                  </label>
                </div>
              </section>
            ) : null}

            <section className="sidecar-section">
              <h4>COI and disclosure</h4>
              <label className="checkbox-row">
                <input checked={context.coi.no_known_coi} onChange={(event) => patchCoi({ no_known_coi: event.target.checked })} type="checkbox" />
                <span>No known conflict of interest</span>
              </label>
              {!context.coi.no_known_coi ? (
                <div className="form-grid compact-form-grid">
                  <label className="field wide-field">
                    <span>Conflict-of-interest statement</span>
                    <textarea value={context.coi.coi_statement} onChange={(event) => patchCoi({ coi_statement: event.target.value })} />
                  </label>
                  <label className="field wide-field">
                    <span>Required disclosure language</span>
                    <textarea value={context.coi.required_disclosure_language} onChange={(event) => patchCoi({ required_disclosure_language: event.target.value })} />
                  </label>
                </div>
              ) : null}
            </section>

            <section className="sidecar-section">
              <h4>Participant disclosure preview</h4>
              {validation?.warnings.length ? (
                <WarningBanner title="Disclosure consistency safeguard" risk="warning">
                  {validation.warnings.join(" ")}
                </WarningBanner>
              ) : null}
              <div className="disclosure-preview">
                {context.participant_disclosure.edited_text || context.participant_disclosure.generated_text || "No participant-facing disclosure preview generated yet."}
              </div>
              <label className="field wide-field">
                <span>Edit concise participant-facing disclosure</span>
                <textarea value={context.participant_disclosure.edited_text} onChange={(event) => patchParticipantDisclosure({ edited_text: event.target.value })} />
              </label>
              <div className="button-row">
                <button className="secondary-button" disabled={busy !== null} onClick={onGenerateDisclosure} type="button">Generate disclosure preview</button>
                <button className="primary-button" disabled={busy !== null} onClick={() => onSave(context)} type="button">{busy === "save" ? "Saving..." : hasBackendStudy ? "Save context" : "Keep draft"}</button>
              </div>
            </section>

            <section className="sidecar-section">
              <h4>Import from funded proposal</h4>
              <p className="muted">Paste proposal, award, sponsorship, or contract summary text. Extraction is optional. AI suggestions are never final until accepted or edited.</p>
              <div className="form-grid compact-form-grid">
                <label className="field wide-field">
                  <span>Source document name</span>
                  <input value={proposalSourceName} onChange={(event) => onProposalSourceNameChange(event.target.value)} placeholder="Example: Award summary or sponsor agreement" />
                </label>
                <label className="field wide-field">
                  <span>Pasted source text</span>
                  <textarea value={proposalSourceText} onChange={(event) => onProposalSourceTextChange(event.target.value)} />
                </label>
              </div>
              <button className="secondary-button" disabled={busy !== null || !proposalSourceText.trim()} onClick={onImportProposal} type="button">Run optional extraction</button>
              {!hasBackendStudy ? (
                <p className="muted">Audited extraction is available after the study exists in the backend. Pasted text is not uploaded in draft preview mode.</p>
              ) : null}
              <div className="suggestion-list">
                {context.proposal_import.suggestions.map((suggestion) => (
                  <article className="suggestion-card" key={suggestion.suggestion_id}>
                    <div className="split-line">
                      <div>
                        <strong>{suggestion.label}</strong>
                        <p className="muted">{suggestion.field_path} · Confidence {suggestion.confidence} · {formatStatus(suggestion.status)}</p>
                      </div>
                      <StatusBadge risk={suggestion.status === "pending" ? "warning" : suggestion.status === "rejected" ? "danger" : "success"} label={formatStatus(suggestion.status)} />
                    </div>
                    <p><strong>Proposed value:</strong> {String(suggestion.proposed_value ?? "Not found / needs human review")}</p>
                    {suggestion.evidence_snippet ? <p className="muted">Evidence: {suggestion.evidence_snippet}</p> : null}
                    <p className="muted">{suggestion.rationale}</p>
                    {suggestion.status === "pending" ? (
                      <div className="button-row">
                        <button className="secondary-button" disabled={busy !== null} onClick={() => onSuggestionDecision(suggestion.suggestion_id, "accept")} type="button">Accept</button>
                        <button
                          className="secondary-button"
                          disabled={busy !== null}
                          onClick={() => {
                            const edited = window.prompt("Edit suggested value before applying it.", String(suggestion.proposed_value ?? ""));
                            if (edited !== null) onSuggestionDecision(suggestion.suggestion_id, "edit", edited);
                          }}
                          type="button"
                        >
                          Edit
                        </button>
                        <button className="secondary-button danger-text" disabled={busy !== null} onClick={() => onSuggestionDecision(suggestion.suggestion_id, "reject")} type="button">Reject</button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>

            <section className="sidecar-section">
              <h4>Export impact</h4>
              <p className="muted">Supplied context can improve IRB exports, final reports, reproducibility metadata, audit/export metadata, and the study manifest. Participants receive only the concise disclosure snippet.</p>
            </section>
          </>
        ) : null}
      </aside>
    </div>
  );
}

export function TernarySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: StudyContextDisclosure["data_access"]["sponsor_can_access_raw_responses"];
  onChange: (value: StudyContextDisclosure["data_access"]["sponsor_can_access_raw_responses"]) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as typeof value)}>
        {ternaryOptions.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

export function WizardStepFields({
  step,
  wizard,
  selectedMethodLabel,
  instrumentLocked,
  onChange,
  onMethodChange,
}: {
  step: StudyWizardStepId;
  wizard: StudyWizardState;
  selectedMethodLabel: string;
  instrumentLocked: boolean;
  onChange: (patch: Partial<StudyWizardState>) => void;
  onMethodChange: (studyFormat: StudyWizardState["studyFormat"]) => void;
}) {
  if (step === "purpose") {
    const normalizedWizard = normalizeWizardResearchQuestions(wizard);
    const questions = normalizedWizard.researchQuestions;
    const activeQuestions = questions.filter((question) => question.active);
    const commitQuestions = (nextQuestions: ResearchQuestion[]) => {
      const normalized = normalizeWizardResearchQuestions({ ...wizard, researchQuestions: nextQuestions });
      onChange({
        researchQuestion: normalized.researchQuestion,
        researchQuestions: normalized.researchQuestions,
      });
    };
    const updateQuestion = (questionId: string, patch: Partial<ResearchQuestion>) => {
      const now = new Date().toISOString();
      commitQuestions(questions.map((question) =>
        question.id === questionId ? { ...question, ...patch, updatedAt: now } : question
      ));
    };
    const addQuestion = () => {
      const nextQuestion = createResearchQuestionDraft(activeQuestions.length + 1);
      commitQuestions([...questions, nextQuestion]);
    };
    const removeQuestion = (questionId: string) => {
      if (activeQuestions.length <= 1) return;
      updateQuestion(questionId, { active: false });
    };
    const isDefaultQuestionLabel = (value?: string) => !value?.trim() || /^Research question\s*\d+$/i.test(value.trim());
    const moveQuestion = (questionId: string, delta: -1 | 1) => {
      const fromIndex = activeQuestions.findIndex((question) => question.id === questionId);
      const toIndex = fromIndex + delta;
      if (fromIndex < 0 || toIndex < 0 || toIndex >= activeQuestions.length) return;
      const now = new Date().toISOString();
      const reorderedActiveQuestions = [...activeQuestions];
      const [movedQuestion] = reorderedActiveQuestions.splice(fromIndex, 1);
      reorderedActiveQuestions.splice(toIndex, 0, movedQuestion);
      const orderedActiveQuestions = reorderedActiveQuestions.map((question, index) => ({
        ...question,
        displayOrder: index + 1,
        shortLabel: isDefaultQuestionLabel(question.shortLabel) ? `Research question ${index + 1}` : question.shortLabel,
        updatedAt: now,
      }));
      const inactiveQuestions = questions
        .filter((question) => !question.active)
        .map((question, index) => ({ ...question, displayOrder: orderedActiveQuestions.length + index + 1 }));
      commitQuestions([...orderedActiveQuestions, ...inactiveQuestions]);
    };

    return (
      <div className="form-grid">
        <label className="field wide-field">
          <span>Study title</span>
          <input disabled={instrumentLocked} value={wizard.title} onChange={(event) => onChange({ title: event.target.value })} />
        </label>
        <label className="field wide-field">
          <span>Short description</span>
          <textarea disabled={instrumentLocked} value={wizard.description} onChange={(event) => onChange({ description: event.target.value })} />
        </label>
        <fieldset className="field wide-field research-question-manager">
          <legend>Research questions</legend>
          <p className="muted">
            Most Delphi studies have one central aim. You may add multiple related research questions when they help structure Round 1 collection, item curation, and final reporting.
          </p>
          {instrumentLocked ? (
            <WarningBanner title="Research questions locked" risk="locked">
              Research questions are part of the study instrument and cannot be changed after governance launch for this version.
            </WarningBanner>
          ) : null}
          {activeQuestions.length > 5 ? (
            <WarningBanner title="Participant burden warning" risk="warning">
              Many research questions can increase participant burden, attrition risk, and analytic complexity. Consider whether these are related sub-questions of one Delphi study or should be separate studies.
            </WarningBanner>
          ) : null}
          <div className="research-question-list">
            {activeQuestions.map((question, index) => (
              <article className="research-question-card" key={question.id}>
                <div className="question-card-header">
                  <strong>Question {index + 1}</strong>
                  <div className="icon-button-row" aria-label={`Question ${index + 1} order and removal controls`}>
                    <button
                      aria-label={`Move question ${index + 1} up`}
                      className="secondary-button"
                      disabled={instrumentLocked || index === 0}
                      onClick={() => moveQuestion(question.id, -1)}
                      type="button"
                    >
                      Move question up
                    </button>
                    <button
                      aria-label={`Move question ${index + 1} down`}
                      className="secondary-button"
                      disabled={instrumentLocked || index === activeQuestions.length - 1}
                      onClick={() => moveQuestion(question.id, 1)}
                      type="button"
                    >
                      Move question down
                    </button>
                    <button
                      aria-label={`Remove question ${index + 1}`}
                      className="secondary-button danger-button"
                      disabled={instrumentLocked || activeQuestions.length <= 1}
                      onClick={() => removeQuestion(question.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <label className="field">
                  <span>Question text</span>
                  <textarea
                    disabled={instrumentLocked}
                    value={question.text}
                    onChange={(event) => updateQuestion(question.id, { text: event.target.value })}
                  />
                </label>
                <div className="two-column-fields">
                  <label className="field">
                    <span>Short label</span>
                    <input
                      disabled={instrumentLocked}
                      value={question.shortLabel ?? ""}
                      onChange={(event) => updateQuestion(question.id, { shortLabel: event.target.value })}
                    />
                  </label>
                  <label className="check-field question-required-row">
                    <input
                      checked={question.requiredForRound1Response}
                      disabled={instrumentLocked}
                      onChange={(event) => updateQuestion(question.id, { requiredForRound1Response: event.target.checked })}
                      type="checkbox"
                    />
                    <span>Required in Round 1</span>
                  </label>
                </div>
                <label className="field">
                  <span>Optional participant-facing description</span>
                  <textarea
                    disabled={instrumentLocked}
                    value={question.description ?? ""}
                    onChange={(event) => updateQuestion(question.id, { description: event.target.value })}
                  />
                  <small>Keep this neutral. Do not imply a preferred answer or expected agreement.</small>
                </label>
              </article>
            ))}
          </div>
          <button className="secondary-button" disabled={instrumentLocked} onClick={addQuestion} type="button">
            Add research question
          </button>
        </fieldset>
        <label className="field wide-field">
          <span>Objective</span>
          <textarea disabled={instrumentLocked} value={wizard.objective} onChange={(event) => onChange({ objective: event.target.value })} />
        </label>
        <label className="field wide-field">
          <span>Why Delphi is suitable</span>
          <textarea disabled={instrumentLocked} value={wizard.delphiSuitability} onChange={(event) => onChange({ delphiSuitability: event.target.value })} />
        </label>
      </div>
    );
  }

  if (step === "method") {
    return (
      <div className="form-grid">
        <fieldset className="field wide-field">
          <legend>Method model</legend>
          <div className="segmented-control">
            <button
              className={wizard.studyFormat === "ModifiedDelphi" ? "active" : ""}
              onClick={() => onMethodChange("ModifiedDelphi")}
              type="button"
            >
              Modified Delphi
            </button>
            <button
              className={wizard.studyFormat === "ClassicDelphi" ? "active" : ""}
              onClick={() => onMethodChange("ClassicDelphi")}
              type="button"
            >
              Classic Delphi
            </button>
          </div>
          <p className="muted">Selected: {selectedMethodLabel}</p>
        </fieldset>
        <fieldset className="field wide-field">
          <legend>Round 1 mode</legend>
          <div className="segmented-control">
            <button
              className={wizard.roundOneMode === "open-ended" ? "active" : ""}
              onClick={() => onChange({ roundOneMode: "open-ended", modifiedDesignAcknowledged: true })}
              type="button"
            >
              Open-ended elicitation
            </button>
            <button
              className={wizard.roundOneMode === "structured" ? "active" : ""}
              onClick={() => onChange({ roundOneMode: "structured", modifiedDesignAcknowledged: false })}
              type="button"
            >
              Structured elicitation
            </button>
          </div>
        </fieldset>
        <label className="field wide-field">
          <span>Method rationale</span>
          <textarea value={wizard.modifiedDesignRationale} onChange={(event) => onChange({ modifiedDesignRationale: event.target.value })} />
        </label>
        <label className="check-field wide-field">
          <input
            checked={wizard.modifiedDesignAcknowledged}
            onChange={(event) => onChange({ modifiedDesignAcknowledged: event.target.checked })}
            type="checkbox"
          />
          <span>Bias warning acknowledged and documented for any structured Round 1 design.</span>
        </label>
      </div>
    );
  }

  if (step === "panel") {
    return (
      <div className="form-grid">
        <label className="field wide-field">
          <span>Panel inclusion criteria</span>
          <textarea value={wizard.panelCriteria} onChange={(event) => onChange({ panelCriteria: event.target.value })} />
        </label>
        <label className="field wide-field">
          <span>Recruitment plan</span>
          <textarea value={wizard.recruitmentPlan} onChange={(event) => onChange({ recruitmentPlan: event.target.value })} />
        </label>
        <label className="field">
          <span>Target panel size</span>
          <input
            min={3}
            type="number"
            value={wizard.targetPanelSize}
            onChange={(event) => onChange({ targetPanelSize: Number(event.target.value) })}
          />
        </label>
      </div>
    );
  }

  if (step === "consent") {
    return (
      <div className="form-grid">
        <label className="field">
          <span>Consent version</span>
          <input value={wizard.consentVersion} onChange={(event) => onChange({ consentVersion: event.target.value })} />
        </label>
        <label className="field wide-field">
          <span>Consent summary</span>
          <textarea value={wizard.consentSummary} onChange={(event) => onChange({ consentSummary: event.target.value })} />
        </label>
        <label className="field wide-field">
          <span>Confidentiality language</span>
          <textarea value={wizard.confidentialityStatement} onChange={(event) => onChange({ confidentialityStatement: event.target.value })} />
        </label>
        <label className="field wide-field">
          <span>Withdrawal process</span>
          <textarea value={wizard.withdrawalProcess} onChange={(event) => onChange({ withdrawalProcess: event.target.value })} />
        </label>
      </div>
    );
  }

  if (step === "rounds") {
    const preRoundInputRequired = consensusSourceRequiresPreRoundInput(wizard.consensusRuleSource);

    return (
      <div className="form-grid">
        <label className="field">
          <span>Planned rounds</span>
          <input min={2} type="number" value={wizard.plannedRoundCount} onChange={(event) => onChange({ plannedRoundCount: Number(event.target.value) })} />
        </label>
        <label className="field">
          <span>Terminal round</span>
          <input min={2} type="number" value={wizard.terminalRoundNumber} onChange={(event) => onChange({ terminalRoundNumber: Number(event.target.value) })} />
        </label>
        <label className="field">
          <span>Consensus threshold</span>
          <select value={wizard.consensusThreshold} onChange={(event) => onChange({ consensusThreshold: Number(event.target.value) })}>
            {[60, 70, 80, 90].map((threshold) => (
              <option key={threshold} value={threshold}>{threshold}%</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Agreement minimum rating</span>
          <input min={1} max={9} type="number" value={wizard.agreementMinRating} onChange={(event) => onChange({ agreementMinRating: Number(event.target.value) })} />
        </label>
        <div className="method-helper wide-field">
          <strong>Why these settings are locked before Round 1</strong>
          <p>
            The threshold is the percentage of respondents who must agree. The minimum rating defines which ratings count as agreement. For example, 80% at rating 7+ means an item reaches consensus only when at least 80% of respondents rate it 7, 8, or 9.
          </p>
        </div>
        <label className="field">
          <span>Consensus rule source</span>
          <select
            value={wizard.consensusRuleSource}
            onChange={(event) => {
              const source = event.target.value as StudyWizardState["consensusRuleSource"];
              const requiresInput = consensusSourceRequiresPreRoundInput(source);
              onChange({
                consensusRuleSource: source,
                preRoundConsensusInputEnabled: requiresInput,
                preRoundConsensusInputStatus: requiresInput ? "planned" : "not_required",
              });
            }}
          >
            {Object.entries(consensusRuleSourceLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="field wide-field">
          <span>Consensus setting process</span>
          <textarea value={wizard.consensusRuleProcess} onChange={(event) => onChange({ consensusRuleProcess: event.target.value })} />
        </label>
        {preRoundInputRequired ? (
          <>
            <WarningBanner title="Pre-round input, not a Delphi round" risk="info">
              This optional setup activity helps document how the threshold was considered before Round 1. It does not count as Round 1 and cannot change the locked rule after launch.
            </WarningBanner>
            <label className="field">
              <span>Pre-round input status</span>
              <select
                value={wizard.preRoundConsensusInputStatus}
                onChange={(event) => onChange({ preRoundConsensusInputStatus: event.target.value as StudyWizardState["preRoundConsensusInputStatus"] })}
              >
                {Object.entries(preRoundConsensusStatusLabels)
                  .filter(([value]) => value !== "not_required")
                  .map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
              </select>
            </label>
            <label className="field wide-field">
              <span>Neutral pre-round prompt</span>
              <textarea value={wizard.preRoundConsensusPrompt} onChange={(event) => onChange({ preRoundConsensusPrompt: event.target.value })} />
            </label>
            <label className="field wide-field">
              <span>How input was considered</span>
              <textarea value={wizard.preRoundConsensusSummary} onChange={(event) => onChange({ preRoundConsensusSummary: event.target.value })} />
            </label>
          </>
        ) : null}
        <div className="wide-field">
          <WarningBanner title="Locked before launch" risk="locked">
            Consensus rules are predefined before Round 1 and locked against mid-study changes.
          </WarningBanner>
        </div>
      </div>
    );
  }

  if (step === "feedback") {
    return (
      <div className="form-grid">
        <div className="check-stack wide-field">
          {[
            ["feedbackMedian", "Median"],
            ["feedbackIqr", "IQR / dispersion"],
            ["feedbackDistribution", "Distribution"],
            ["feedbackPriorResponse", "Your prior response"],
          ].map(([key, label]) => (
            <label className="check-field" key={key}>
              <input
                checked={Boolean(wizard[key as keyof StudyWizardState])}
                onChange={(event) => onChange({ [key]: event.target.checked } as Partial<StudyWizardState>)}
                type="checkbox"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <label className="field wide-field">
          <span>Neutral participant language</span>
          <textarea value={wizard.neutralFeedbackLanguage} onChange={(event) => onChange({ neutralFeedbackLanguage: event.target.value })} />
        </label>
      </div>
    );
  }

  if (step === "ai") {
    return (
      <div className="form-grid">
        <label className="check-field wide-field">
          <input checked={wizard.aiEnabled} onChange={(event) => onChange({ aiEnabled: event.target.checked })} type="checkbox" />
          <span>Enable AI drafting and organizing assistance for research-team materials.</span>
        </label>
        <label className="field wide-field">
          <span>AI disclosure</span>
          <textarea value={wizard.aiDisclosure} onChange={(event) => onChange({ aiDisclosure: event.target.value })} />
        </label>
        <label className="check-field wide-field">
          <input
            checked={wizard.aiHumanApprovalRequired}
            onChange={(event) => onChange({ aiHumanApprovalRequired: event.target.checked })}
            type="checkbox"
          />
          <span>Require explicit human Accept/Edit/Reject before participant-facing use.</span>
        </label>
      </div>
    );
  }

  if (step === "retention") {
    return (
      <div className="form-grid">
        <label className="field wide-field">
          <span>Retention schedule</span>
          <textarea value={wizard.retentionSchedule} onChange={(event) => onChange({ retentionSchedule: event.target.value })} />
        </label>
        <label className="field">
          <span>Export review role</span>
          <select value={wizard.exportReviewRole} onChange={(event) => onChange({ exportReviewRole: event.target.value as StudyWizardState["exportReviewRole"] })}>
            <option>Data Custodian</option>
            <option>Security & Privacy Lead</option>
          </select>
        </label>
        <label className="check-field wide-field">
          <input
            checked={wizard.dataSeparationConfirmed}
            onChange={(event) => onChange({ dataSeparationConfirmed: event.target.checked })}
            type="checkbox"
          />
          <span>Identity data and response data remain separated; identity-response mapping access is privileged and purpose logged.</span>
        </label>
      </div>
    );
  }

  return (
    <div className="review-stack">
      {buildGovernanceSummary(wizard).map((item) => (
        <article className="summary-item" key={item.label}>
          <strong>{item.label}</strong>
          <p>{item.value}</p>
        </article>
      ))}
    </div>
  );
}
