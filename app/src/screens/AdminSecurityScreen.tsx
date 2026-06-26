/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import { useEffect, useState } from "react";
import {
  conductorApi,
  type AIConfigValidation,
  type AttritionSummary,
  type BackendUser,
  type NonResponseEscalation,
  type NonResponsePolicy,
  type ParticipantContactPreference,
  type ParticipantEnrollment,
  type PhoneVerificationChallengeResponse,
  type SmsNotification,
  type SmsPolicy,
  type SmsSetupStatus,
  type StudyAIConfig,
  type StudyAssignment,
} from "../core/api";
import type { ConductorWorkflow } from "../core/appTypes";
import { formatDateTime, humanizeBackendMessage } from "../core/appUtils";
import type { UserRole } from "../core/types";
import { canAccessIdentityMap } from "../core/permissions";
import { identityAccessDecision } from "../policies/governance";
import { StatusBadge, WarningBanner } from "../components/ui/Primitives";

const TWILIO_SETUP_FALLBACK_URL = "https://console.twilio.com/us1/develop/sms/services";

const aiFeatureLabels: Array<[keyof StudyAIConfig["featurePermissions"], string]> = [
  ["clustering", "Clustering"],
  ["item_drafting", "Item drafting"],
  ["neutrality_method_linting", "Neutrality / method linting"],
  ["reminders", "Reminders"],
  ["irb_export_drafting", "IRB export drafting"],
  ["report_drafting", "Report drafting"],
];

const studyRoleLabels: Record<StudyAssignment["role"], string> = {
  Owner: "Study Owner / PI",
  MethodsSteward: "Ethics & Methods Steward",
  PrivacyLead: "Security & Privacy Lead",
  DataCustodian: "Data Custodian",
  Maintainer: "Open Source Maintainer / Admin",
};

function concentratedAssignments(assignments: StudyAssignment[]) {
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

function smsSetupProgress(setup: SmsSetupStatus | null): string {
  if (!setup) return "Not checked";
  const values = Object.values(setup.required);
  const complete = values.filter(Boolean).length;
  return `${complete}/${values.length} ready`;
}

// eslint-disable-next-line react-refresh/only-export-components
export function aiConfigStatusRisk(validation: AIConfigValidation | null): "success" | "warning" | "info" {
  if (!validation) return "info";
  if (validation.status === "ready" && validation.errors.length === 0) return "success";
  if (validation.status === "no_external_ai_mode") return "info";
  return "warning";
}

// eslint-disable-next-line react-refresh/only-export-components
export function aiConfigStatusLabel(validation: AIConfigValidation | null): string {
  if (!validation) return "Not loaded";
  if (validation.status === "no_external_ai_mode") return "No External AI mode";
  if (validation.status === "ready" && validation.errors.length === 0) return "Ready";
  return "Incomplete";
}

export function AdminSecurityScreen({ role, workflow }: { role: UserRole; workflow: ConductorWorkflow }) {
  const identityDecision = identityAccessDecision(role, "Review data subject withdrawal request");
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [assignments, setAssignments] = useState<StudyAssignment[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedStudyRole, setSelectedStudyRole] = useState<StudyAssignment["role"]>("MethodsSteward");
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [accessBusy, setAccessBusy] = useState(false);
  const [aiConfig, setAiConfig] = useState<StudyAIConfig | null>(null);
  const [aiValidation, setAiValidation] = useState<AIConfigValidation | null>(null);
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [attritionSummary, setAttritionSummary] = useState<AttritionSummary | null>(null);
  const [participantStatuses, setParticipantStatuses] = useState<ParticipantEnrollment[]>([]);
  const [nonResponseEscalations, setNonResponseEscalations] = useState<NonResponseEscalation[]>([]);
  const [nonResponsePolicy, setNonResponsePolicy] = useState<NonResponsePolicy | null>(null);
  const [nonResponseRound, setNonResponseRound] = useState(2);
  const [selectedAttritionParticipant, setSelectedAttritionParticipant] = useState("");
  const [attritionMessage, setAttritionMessage] = useState<string | null>(null);
  const [attritionError, setAttritionError] = useState<string | null>(null);
  const [attritionBusy, setAttritionBusy] = useState(false);
  const [smsPolicy, setSmsPolicy] = useState<SmsPolicy | null>(null);
  const [smsPreference, setSmsPreference] = useState<ParticipantContactPreference | null>(null);
  const [smsNotifications, setSmsNotifications] = useState<SmsNotification[]>([]);
  const [smsParticipantId, setSmsParticipantId] = useState("");
  const [smsPhoneDraft, setSmsPhoneDraft] = useState("");
  const [smsPreferenceDraft, setSmsPreferenceDraft] = useState<ParticipantContactPreference["notification_preference"]>("both");
  const [smsConsentDraft, setSmsConsentDraft] = useState(true);
  const [smsChallenge, setSmsChallenge] = useState<PhoneVerificationChallengeResponse | null>(null);
  const [smsOtpDraft, setSmsOtpDraft] = useState("");
  const [smsRoundNumber, setSmsRoundNumber] = useState(1);
  const [smsMessage, setSmsMessage] = useState<string | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [smsBusy, setSmsBusy] = useState(false);
  const [smsSetup, setSmsSetup] = useState<SmsSetupStatus | null>(null);
  const [smsSetupLoadError, setSmsSetupLoadError] = useState<string | null>(null);
  const activeStudyId = workflow.study?.id ?? null;
  const activeVersionId = workflow.version?.id ?? null;
  const canManageAccess = role === "study_owner" || role === "open_source_admin";
  const canManageAI = role === "study_owner" || role === "open_source_admin";
  const canViewAI = canManageAI || role === "ethics_methods_steward" || role === "security_privacy_lead";
  const canManageAttrition = canManageAccess || role === "ethics_methods_steward";
  const canManageSms = canManageAccess || role === "security_privacy_lead";

  async function loadSmsSetup() {
    if (!canManageSms) return;
    try {
      const result = await conductorApi.getSmsSetupStatus(role);
      setSmsSetup(result.setup);
      setSmsSetupLoadError(null);
    } catch (error) {
      setSmsSetupLoadError(error instanceof Error ? error.message : "Unable to load SMS setup status.");
    }
  }

  useEffect(() => {
    void loadSmsSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, canManageSms]);

  async function loadAccessReview() {
    if (!canManageAccess) return;
    setAccessBusy(true);
    setAccessError(null);
    try {
      const userResult = await conductorApi.listUsers(role);
      setUsers(userResult.users);
      if (!selectedUserId && userResult.users[0]) setSelectedUserId(userResult.users[0].user_id);
      if (activeStudyId) {
        const assignmentResult = await conductorApi.listAssignments(activeStudyId, role);
        setAssignments(assignmentResult.assignments);
      } else {
        setAssignments([]);
      }
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : "Unable to load users and role assignments.");
    } finally {
      setAccessBusy(false);
    }
  }

  useEffect(() => {
    void loadAccessReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, activeStudyId]);

  async function loadAIConfig() {
    if (!activeStudyId || !canViewAI) return;
    setAiBusy(true);
    setAiError(null);
    try {
      const result = await conductorApi.getAIConfig(activeStudyId, role);
      setAiConfig(result.ai_config);
      setAiValidation(result.validation);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Unable to load AI connector configuration.");
    } finally {
      setAiBusy(false);
    }
  }

  useEffect(() => {
    void loadAIConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, activeStudyId]);

  async function loadAttritionReview() {
    if (!activeStudyId || !activeVersionId || !canManageAttrition) return;
    setAttritionBusy(true);
    setAttritionError(null);
    try {
      const result = await conductorApi.getAttritionSummary(activeStudyId, activeVersionId, role);
      setAttritionSummary(result.attrition_summary);
      setParticipantStatuses(result.participant_statuses);
      setNonResponseEscalations(result.escalations);
      setNonResponsePolicy(result.policy);
      setSelectedAttritionParticipant((current) => current || result.participant_statuses[0]?.participant_id || "");
    } catch (error) {
      setAttritionError(error instanceof Error ? error.message : "Unable to load attrition review.");
    } finally {
      setAttritionBusy(false);
    }
  }

  useEffect(() => {
    void loadAttritionReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, activeStudyId, activeVersionId]);

  async function loadSmsReview() {
    if (!activeStudyId || !activeVersionId || !canManageSms) return;
    setSmsBusy(true);
    setSmsError(null);
    try {
      const [policyResult, notificationsResult] = await Promise.all([
        conductorApi.getSmsPolicy(activeStudyId, activeVersionId, role),
        conductorApi.listSmsNotifications(activeStudyId, activeVersionId, role),
      ]);
      setSmsPolicy(policyResult.policy);
      setSmsNotifications(notificationsResult.notifications);
      const firstParticipant = participantStatuses[0]?.participant_id ?? "";
      setSmsParticipantId((current) => current || firstParticipant);
    } catch (error) {
      setSmsError(error instanceof Error ? error.message : "Unable to load SMS notification settings.");
    } finally {
      setSmsBusy(false);
    }
  }

  useEffect(() => {
    void loadSmsReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, activeStudyId, activeVersionId, canManageSms, participantStatuses.length]);

  useEffect(() => {
    if (!activeStudyId || !activeVersionId || !smsParticipantId || !canManageSms) return;
    const studyId = activeStudyId;
    const versionId = activeVersionId;
    const participantId = smsParticipantId;
    async function loadPreference() {
      try {
        const result = await conductorApi.getContactPreference(studyId, versionId, participantId, role);
        setSmsPreference(result.contact_preference);
        setSmsPreferenceDraft(result.contact_preference?.notification_preference ?? "both");
        setSmsConsentDraft(Boolean(result.contact_preference?.sms_consent_at && !result.contact_preference?.sms_consent_revoked_at));
      } catch {
        setSmsPreference(null);
      }
    }
    void loadPreference();
  }, [activeStudyId, activeVersionId, smsParticipantId, role, canManageSms]);

  async function saveSmsPolicy() {
    if (!activeStudyId || !activeVersionId || !smsPolicy) return;
    setSmsBusy(true);
    setSmsError(null);
    setSmsMessage(null);
    try {
      const result = await conductorApi.updateSmsPolicy(activeStudyId, activeVersionId, role, smsPolicy);
      setSmsPolicy(result.policy);
      setSmsMessage("SMS policy saved. Round-open texts remain opt-in and neutral.");
      await loadSmsReview();
    } catch (error) {
      setSmsError(error instanceof Error ? error.message : "Unable to save SMS policy.");
    } finally {
      setSmsBusy(false);
    }
  }

  async function saveSmsPreference() {
    if (!activeStudyId || !activeVersionId || !smsParticipantId) return;
    setSmsBusy(true);
    setSmsError(null);
    setSmsMessage(null);
    try {
      const result = await conductorApi.updateContactPreference(activeStudyId, activeVersionId, smsParticipantId, role, {
        notification_preference: smsPreferenceDraft,
        phone: smsPhoneDraft,
        sms_consent_granted: smsConsentDraft,
      });
      setSmsPreference(result.contact_preference);
      setSmsMessage("Participant SMS preference saved with masked phone display.");
    } catch (error) {
      setSmsError(error instanceof Error ? error.message : "Unable to save participant SMS preference.");
    } finally {
      setSmsBusy(false);
    }
  }

  async function startSmsVerification() {
    if (!activeStudyId || !activeVersionId || !smsParticipantId) return;
    setSmsBusy(true);
    setSmsError(null);
    setSmsMessage(null);
    try {
      const challenge = await conductorApi.startPhoneVerification(activeStudyId, activeVersionId, smsParticipantId, role);
      setSmsChallenge(challenge);
      setSmsMessage(`Verification challenge created for ${challenge.masked_phone}.`);
    } catch (error) {
      setSmsError(error instanceof Error ? error.message : "Unable to start phone verification.");
    } finally {
      setSmsBusy(false);
    }
  }

  async function verifySmsPhone() {
    if (!activeStudyId || !activeVersionId || !smsParticipantId || !smsChallenge) return;
    setSmsBusy(true);
    setSmsError(null);
    setSmsMessage(null);
    try {
      const result = await conductorApi.verifyPhoneOtp(activeStudyId, activeVersionId, smsParticipantId, role, smsChallenge.challenge_id, smsOtpDraft);
      setSmsPreference(result.contact_preference);
      setSmsChallenge(null);
      setSmsOtpDraft("");
      setSmsMessage("Phone number verified. SMS remains optional and revocable.");
    } catch (error) {
      setSmsError(error instanceof Error ? error.message : "Unable to verify phone.");
    } finally {
      setSmsBusy(false);
    }
  }

  async function sendSmsForRound() {
    if (!activeStudyId || !activeVersionId) return;
    setSmsBusy(true);
    setSmsError(null);
    setSmsMessage(null);
    try {
      const result = await conductorApi.sendRoundOpenSms(activeStudyId, activeVersionId, smsRoundNumber, role);
      setSmsMessage(`${result.sms.sent} SMS notification${result.sms.sent === 1 ? "" : "s"} sent; ${result.sms.skipped} skipped with audit reasons.`);
      await loadSmsReview();
    } catch (error) {
      setSmsError(error instanceof Error ? error.message : "Unable to send round-open SMS.");
    } finally {
      setSmsBusy(false);
    }
  }

  async function runAttritionAction(action: "detect" | "reminder" | "final" | "expire" | "inactive" | "save-policy") {
    if (!activeStudyId || !activeVersionId) return;
    setAttritionBusy(true);
    setAttritionError(null);
    setAttritionMessage(null);
    try {
      if (action === "detect") {
        const result = await conductorApi.detectNonResponse(activeStudyId, activeVersionId, nonResponseRound, role);
        setAttritionMessage(`${result.flagged.length} participant status record${result.flagged.length === 1 ? "" : "s"} flagged for configured non-response review.`);
      } else if (action === "reminder" && selectedAttritionParticipant) {
        await conductorApi.queueParticipantReminder(activeStudyId, activeVersionId, nonResponseRound, selectedAttritionParticipant, role);
        setAttritionMessage("Neutral reminder queued and follow-up window started.");
      } else if (action === "final" && selectedAttritionParticipant) {
        await conductorApi.queueParticipantFinalNotice(activeStudyId, activeVersionId, nonResponseRound, selectedAttritionParticipant, role);
        setAttritionMessage("Final notice queued from the approved fixed template.");
      } else if (action === "expire" && selectedAttritionParticipant) {
        await conductorApi.expireParticipantFollowup(activeStudyId, activeVersionId, nonResponseRound, selectedAttritionParticipant, role);
        setAttritionMessage("Follow-up window marked expired for review.");
      } else if (action === "inactive" && selectedAttritionParticipant) {
        await conductorApi.markParticipantInactive(activeStudyId, activeVersionId, selectedAttritionParticipant, role, nonResponseRound + 1);
        setAttritionMessage("Participant marked inactive for future rounds only. Prior data remains preserved.");
      } else if (action === "save-policy" && nonResponsePolicy) {
        const result = await conductorApi.updateNonResponsePolicy(activeStudyId, activeVersionId, role, nonResponsePolicy);
        setNonResponsePolicy(result.policy);
        setAttritionMessage("Non-response policy saved. Launched studies lock this policy.");
      }
      await loadAttritionReview();
    } catch (error) {
      setAttritionError(error instanceof Error ? error.message : "Unable to complete attrition action.");
    } finally {
      setAttritionBusy(false);
    }
  }

  async function saveAIConfig(nextConfig = aiConfig) {
    if (!activeStudyId || !nextConfig || !canManageAI) return;
    setAiBusy(true);
    setAiError(null);
    setAiMessage(null);
    try {
      const result = await conductorApi.updateAIConfig(activeStudyId, role, {
        externalAiEnabled: nextConfig.externalAiEnabled,
        noExternalAiMode: nextConfig.noExternalAiMode,
        providerName: nextConfig.providerName,
        modelName: nextConfig.modelName,
        featurePermissions: nextConfig.featurePermissions,
        disclosure: nextConfig.disclosure,
      });
      setAiConfig(result.ai_config);
      setAiValidation(result.validation);
      setAiMessage("AI connector configuration saved and audit logged.");
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Unable to save AI connector configuration.");
    } finally {
      setAiBusy(false);
    }
  }

  async function saveApiKey() {
    if (!activeStudyId || !apiKeyDraft.trim() || !canManageAI) return;
    setAiBusy(true);
    setAiError(null);
    setAiMessage(null);
    try {
      const result = await conductorApi.setAIConfigApiKey(activeStudyId, role, apiKeyDraft);
      setAiConfig(result.ai_config);
      setAiValidation(result.validation);
      setApiKeyDraft("");
      setAiMessage("API key saved as encrypted server-side material. The plaintext key cannot be retrieved.");
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Unable to save API key.");
    } finally {
      setAiBusy(false);
    }
  }

  async function deleteApiKey() {
    if (!activeStudyId || !canManageAI) return;
    setAiBusy(true);
    setAiError(null);
    setAiMessage(null);
    try {
      const result = await conductorApi.deleteAIConfigApiKey(activeStudyId, role);
      setAiConfig(result.ai_config);
      setAiValidation(result.validation);
      setAiMessage("API key material deleted from the study AI configuration.");
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Unable to delete API key.");
    } finally {
      setAiBusy(false);
    }
  }

  async function assignRole() {
    if (!activeStudyId || !selectedUserId) return;
    setAccessBusy(true);
    setAccessError(null);
    setAccessMessage(null);
    try {
      await conductorApi.assignStudyRole(activeStudyId, selectedUserId, selectedStudyRole, role);
      const assignmentResult = await conductorApi.listAssignments(activeStudyId, role);
      setAssignments(assignmentResult.assignments);
      setAccessMessage("Study membership updated and audit logged.");
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : "Unable to update study membership.");
    } finally {
      setAccessBusy(false);
    }
  }

  async function removeRole(userId: string) {
    if (!activeStudyId) return;
    setAccessBusy(true);
    setAccessError(null);
    setAccessMessage(null);
    try {
      await conductorApi.removeStudyAssignment(activeStudyId, userId, role);
      const assignmentResult = await conductorApi.listAssignments(activeStudyId, role);
      setAssignments(assignmentResult.assignments);
      setAccessMessage("Study membership removed and audit logged.");
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : "Unable to remove study membership.");
    } finally {
      setAccessBusy(false);
    }
  }

  function userLabel(userId: string): string {
    const user = users.find((entry) => entry.user_id === userId);
    return user ? `${user.display_name} (${user.email})` : userId;
  }
  const roleConcentrations = concentratedAssignments(assignments);

  return (
    <div className="screen-grid">
      <section className="panel">
        <h3>Identity Separation</h3>
        <StatusBadge risk={canAccessIdentityMap(role) ? "warning" : "locked"} label={identityDecision === "allowed" ? "Purpose logged" : "Access blocked"} />
        <p>
          Identity data and response data remain separate in the interface. Access requires a privileged role and a specific purpose.
        </p>
      </section>

      <section className="panel">
        <h3>Security Console</h3>
        <ul className="plain-list">
          <li>Role management and access reviews are backend enforced and audit logged.</li>
          <li>AI connector configuration and disclosure status</li>
          <li>Retention and deletion request workflow</li>
          <li>Export permission policy</li>
          <li>Responsible disclosure pathway</li>
        </ul>
      </section>

      <section className="panel wide">
        <WarningBanner title="Zero-trust UI posture" risk="info">
          The interface hides unavailable actions, but backend authorization remains the enforcement point.
        </WarningBanner>
      </section>

      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">AI Connector & Compliance</span>
          <h2>Study-level AI assistance is permissioned, disclosed, and human-reviewed</h2>
        </div>
        {!canViewAI ? (
          <WarningBanner title="AI connector restricted" risk="locked">
            Panelists and ordinary participants cannot access AI provider settings or secret state.
          </WarningBanner>
        ) : !activeStudyId ? (
          <WarningBanner title="Open a backend study" risk="info">
            Open or create a saved study to configure study-level AI assistance.
          </WarningBanner>
        ) : !aiConfig ? (
          <WarningBanner title="AI connector loading" risk="info">
            {aiBusy ? "Loading AI connector configuration..." : "AI connector configuration is not loaded yet."}
          </WarningBanner>
        ) : (
          <>
            {aiMessage ? <WarningBanner title="AI connector update" risk="success">{aiMessage}</WarningBanner> : null}
            {aiError ? <WarningBanner title="AI connector blocked" risk="danger">{humanizeBackendMessage(aiError)}</WarningBanner> : null}
            <div className="summary-grid">
              <article className="summary-item">
                <strong>Status</strong>
                <div className="badge-line">
                  <StatusBadge risk={aiConfigStatusRisk(aiValidation)} label={aiConfigStatusLabel(aiValidation)} />
                  <StatusBadge risk={aiConfig.keyExists ? "success" : "locked"} label={aiConfig.maskedApiKey ?? "No API key stored"} />
                </div>
                <p>AI Suggestion (Not Final) outputs require human Accept/Edit/Reject action before study content changes.</p>
              </article>
              <article className="summary-item">
                <strong>Secret handling</strong>
                <p>Stored API keys are encrypted server-side. The plaintext key is never shown again, included in exports, or written to audit details.</p>
              </article>
            </div>

            <div className="form-grid">
              <div className="ai-mode-stack wide-field">
                <label className="check-field">
                  <input
                    checked={aiConfig.noExternalAiMode}
                    disabled={!canManageAI || aiBusy}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setAiConfig({
                        ...aiConfig,
                        noExternalAiMode: checked,
                        externalAiEnabled: checked ? false : aiConfig.externalAiEnabled,
                      });
                    }}
                    type="checkbox"
                  />
                  <span>No External AI mode</span>
                </label>
                <label className="check-field">
                  <input
                    checked={aiConfig.externalAiEnabled}
                    disabled={!canManageAI || aiBusy || aiConfig.noExternalAiMode}
                    onChange={(event) => setAiConfig({ ...aiConfig, externalAiEnabled: event.target.checked })}
                    type="checkbox"
                  />
                  <span>External AI enabled</span>
                </label>
                <p>
                  Turn off No External AI mode, then enable External AI to fill the provider, model, and API key fields.
                </p>
              </div>
              {aiConfig.noExternalAiMode ? (
                <div className="method-helper wide-field">
                  <p>When No External AI mode is active, study data will not be sent to external AI services.</p>
                </div>
              ) : null}
              <label className="field">
                <span>Provider name</span>
                <input
                  disabled={!canManageAI || aiBusy || aiConfig.noExternalAiMode || !aiConfig.externalAiEnabled}
                  onChange={(event) => setAiConfig({ ...aiConfig, providerName: event.target.value })}
                  placeholder="Example: OpenAI, Azure OpenAI, local"
                  value={aiConfig.providerName ?? ""}
                />
              </label>
              <label className="field">
                <span>Model name / version</span>
                <input
                  disabled={!canManageAI || aiBusy || aiConfig.noExternalAiMode || !aiConfig.externalAiEnabled}
                  onChange={(event) => setAiConfig({ ...aiConfig, modelName: event.target.value })}
                  placeholder="Configured model or deployment name"
                  value={aiConfig.modelName ?? ""}
                />
              </label>
              <label className="field">
                <span>API key</span>
                <input
                  autoComplete="off"
                  disabled={!canManageAI || aiBusy || aiConfig.noExternalAiMode || !aiConfig.externalAiEnabled}
                  onChange={(event) => setApiKeyDraft(event.target.value)}
                  placeholder={aiConfig.maskedApiKey ?? "Paste key to set or rotate"}
                  type="password"
                  value={apiKeyDraft}
                />
              </label>
              <div className="field">
                <span>Key lifecycle</span>
                <div className="action-row compact-actions">
                  <button className="secondary-button" disabled={!canManageAI || aiBusy || !apiKeyDraft.trim()} onClick={saveApiKey} type="button">
                    Save / rotate key
                  </button>
                  <button className="secondary-button danger-button" disabled={!canManageAI || aiBusy || !aiConfig.keyExists} onClick={deleteApiKey} type="button">
                    Delete key
                  </button>
                </div>
              </div>
            </div>

            <div className="check-stack ai-feature-grid" aria-label="AI feature permissions">
              {aiFeatureLabels.map(([feature, label]) => (
                <label className="check-field" key={feature}>
                  <input
                    checked={aiConfig.featurePermissions[feature]}
                    disabled={!canManageAI || aiBusy}
                    onChange={(event) => setAiConfig({
                      ...aiConfig,
                      featurePermissions: { ...aiConfig.featurePermissions, [feature]: event.target.checked },
                    })}
                    type="checkbox"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <div className="form-grid">
              {[
                ["dataMayBeSentDescription", "What data may be sent"],
                ["identifiersExcludedDescription", "Identifier and mapping exclusion"],
                ["optOutDescription", "Opt-out / No External AI language"],
                ["humanInTheLoopDescription", "Human-in-the-loop controls"],
              ].map(([key, label]) => (
                <label className="field wide-field" key={key}>
                  <span>{label}</span>
                  <textarea
                    disabled={!canManageAI || aiBusy}
                    onChange={(event) => setAiConfig({
                      ...aiConfig,
                      disclosure: { ...aiConfig.disclosure, [key]: event.target.value },
                    })}
                    value={aiConfig.disclosure[key as keyof StudyAIConfig["disclosure"]]}
                  />
                </label>
              ))}
            </div>

            {aiValidation && (aiValidation.errors.length > 0 || aiValidation.warnings.length > 0) ? (
              <WarningBanner title="Compliance review" risk={aiValidation.errors.length > 0 ? "warning" : "info"}>
                {[...aiValidation.errors, ...aiValidation.warnings].map(humanizeBackendMessage).join(" | ")}
              </WarningBanner>
            ) : null}

            <div className="action-row">
              <button className="primary-button" disabled={!canManageAI || aiBusy} onClick={() => saveAIConfig()} type="button">
                {aiBusy ? "Saving..." : "Save AI connector"}
              </button>
              <button className="secondary-button" disabled={aiBusy} onClick={loadAIConfig} type="button">
                Refresh status
              </button>
            </div>
          </>
        )}
      </section>

      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Governed Non-response</span>
          <h2>Attrition is visible, auditable, and preserved in reporting</h2>
        </div>
        {!canManageAttrition ? (
          <WarningBanner title="Attrition management restricted" risk="locked">
            Participant status review is available only to authorized study roles. It is not a participant-removal tool.
          </WarningBanner>
        ) : !activeStudyId || !activeVersionId ? (
          <WarningBanner title="Open a study" risk="warning">
            Open a backend study before reviewing non-response and withdrawal status.
          </WarningBanner>
        ) : (
          <>
            {attritionSummary ? (
              <div className="summary-grid compact-summary">
                <article className="summary-item">
                  <strong>Current active</strong>
                  <span>{attritionSummary.current_active_count}</span>
                </article>
                <article className="summary-item">
                  <strong>Non-responsive flagged</strong>
                  <span>{attritionSummary.non_responsive_flagged_count}</span>
                </article>
                <article className="summary-item">
                  <strong>Withdrawn / inactive</strong>
                  <span>{attritionSummary.participant_withdrawal_count + attritionSummary.pi_inactive_count}</span>
                </article>
                <article className="summary-item">
                  <strong>Attrition</strong>
                  <span>{attritionSummary.attrition_rate}%</span>
                </article>
              </div>
            ) : null}

            {attritionSummary?.warnings.length ? (
              <WarningBanner title="Method integrity prompt" risk="warning">
                {attritionSummary.warnings.join(" ")}
              </WarningBanner>
            ) : null}

            {nonResponsePolicy ? (
              <div className="form-grid">
                <label className="check-field">
                  <input
                    checked={nonResponsePolicy.missed_current_round_deadline}
                    disabled={attritionBusy}
                    onChange={(event) => setNonResponsePolicy({ ...nonResponsePolicy, missed_current_round_deadline: event.target.checked })}
                    type="checkbox"
                  />
                  <span>Flag missed current round deadline</span>
                </label>
                <label className="check-field">
                  <input
                    checked={nonResponsePolicy.incomplete_submission_counts_as_non_response}
                    disabled={attritionBusy}
                    onChange={(event) => setNonResponsePolicy({ ...nonResponsePolicy, incomplete_submission_counts_as_non_response: event.target.checked })}
                    type="checkbox"
                  />
                  <span>Incomplete submission counts as non-response after deadline</span>
                </label>
                <label className="field">
                  <span>Follow-up window days</span>
                  <input
                    disabled={attritionBusy}
                    min={1}
                    max={30}
                    onChange={(event) => setNonResponsePolicy({ ...nonResponsePolicy, follow_up_window_days: Number(event.target.value) })}
                    type="number"
                    value={nonResponsePolicy.follow_up_window_days}
                  />
                </label>
                <label className="check-field">
                  <input
                    checked={nonResponsePolicy.final_notice_enabled}
                    disabled={attritionBusy}
                    onChange={(event) => setNonResponsePolicy({ ...nonResponsePolicy, final_notice_enabled: event.target.checked })}
                    type="checkbox"
                  />
                  <span>Final notice enabled</span>
                </label>
                <label className="check-field">
                  <input
                    checked={nonResponsePolicy.auto_progression_enabled}
                    disabled={attritionBusy}
                    onChange={(event) => setNonResponsePolicy({ ...nonResponsePolicy, auto_progression_enabled: event.target.checked })}
                    type="checkbox"
                  />
                  <span>Auto-progression setting recorded; scheduler remains governed separately</span>
                </label>
              </div>
            ) : null}

            <div className="method-helper">
              <p>
                Marking a participant inactive affects future study progression only. Prior submitted responses remain in
                historical round data, audit logs, exports, and attrition reporting.
              </p>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>Round for review</span>
                <input
                  min={1}
                  max={4}
                  onChange={(event) => setNonResponseRound(Number(event.target.value))}
                  type="number"
                  value={nonResponseRound}
                />
              </label>
              <label className="field">
                <span>Participant status record</span>
                <select value={selectedAttritionParticipant} onChange={(event) => setSelectedAttritionParticipant(event.target.value)}>
                  {participantStatuses.map((entry) => (
                    <option key={entry.participant_id} value={entry.participant_id}>
                      {entry.participant_id.slice(0, 8)} - {entry.status.replaceAll("_", " ").toLowerCase()}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="action-row compact-actions">
              <button className="secondary-button" disabled={attritionBusy} onClick={() => runAttritionAction("save-policy")} type="button">
                Save policy
              </button>
              <button className="secondary-button" disabled={attritionBusy} onClick={() => runAttritionAction("detect")} type="button">
                Detect non-response
              </button>
              <button className="secondary-button" disabled={attritionBusy || !selectedAttritionParticipant} onClick={() => runAttritionAction("reminder")} type="button">
                Queue reminder
              </button>
              <button className="secondary-button" disabled={attritionBusy || !selectedAttritionParticipant} onClick={() => runAttritionAction("final")} type="button">
                Queue final notice
              </button>
              <button className="secondary-button" disabled={attritionBusy || !selectedAttritionParticipant} onClick={() => runAttritionAction("expire")} type="button">
                Expire follow-up
              </button>
              <button className="secondary-button danger-button" disabled={attritionBusy || !selectedAttritionParticipant} onClick={() => runAttritionAction("inactive")} type="button">
                Mark inactive for future rounds
              </button>
            </div>

            {attritionMessage ? <WarningBanner title="Attrition action recorded" risk="success">{attritionMessage}</WarningBanner> : null}
            {attritionError ? <WarningBanner title="Attrition action blocked" risk="warning">{humanizeBackendMessage(attritionError)}</WarningBanner> : null}

            <div className="review-stack">
              {participantStatuses.slice(0, 6).map((entry) => {
                const escalation = nonResponseEscalations.find((record) => record.participant_id === entry.participant_id);
                return (
                  <article className="review-row" key={entry.participant_id}>
                    <div>
                      <strong>{entry.participant_id.slice(0, 8)}</strong>
                      <p>Status timeline: {entry.timeline.map((step) => step.status.replaceAll("_", " ").toLowerCase()).join(" -> ")}</p>
                      {escalation ? <small>Follow-up state: {escalation.state.replaceAll("_", " ").toLowerCase()} {escalation.followup_window_ends_at ? `until ${new Date(escalation.followup_window_ends_at).toLocaleDateString()}` : ""}</small> : null}
                    </div>
                    <StatusBadge risk={entry.status === "ACTIVE" ? "success" : entry.status === "NON_RESPONSIVE_FLAGGED" ? "warning" : "locked"} label={entry.status.replaceAll("_", " ").toLowerCase()} />
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">SMS Round Notifications</span>
          <h2>Round-opening texts use opt-in consent, verified phones, and expiring secure links</h2>
        </div>
        {!canManageSms ? (
          <WarningBanner title="SMS settings restricted" risk="locked">
            SMS configuration is available to the Study Owner/Admin and Security/Privacy Lead.
          </WarningBanner>
        ) : !activeStudyId || !activeVersionId ? (
          <WarningBanner title="Open a backend study" risk="info">
            Open a saved study before configuring SMS notification policies.
          </WarningBanner>
        ) : (
          <>
            <div className="setup-status-grid">
              <article className="setup-status-card">
                <div>
                  <span className="eyebrow">Delivery provider</span>
                  <h3>{smsSetup?.provider === "twilio" ? "Twilio selected" : "SMS provider not connected"}</h3>
                  <p>Real texting requires Twilio account setup, an approved sender path, and configured public URLs.</p>
                </div>
                <StatusBadge risk={smsSetup?.ready_for_real_sms_attempt ? "success" : "warning"} label={smsSetupProgress(smsSetup)} />
              </article>
              <article className="setup-status-card">
                <div>
                  <span className="eyebrow">Connect</span>
                  <h3>Twilio setup</h3>
                  <p>Open Twilio to create or connect a Messaging Service before enabling real SMS.</p>
                </div>
                <div className="action-row compact-actions">
                  <a className="secondary-button link-button" href={smsSetup?.connect_url ?? TWILIO_SETUP_FALLBACK_URL} rel="noreferrer" target="_blank">
                    Open Twilio
                  </a>
                  <button className="secondary-button" onClick={loadSmsSetup} type="button">
                    Refresh setup
                  </button>
                </div>
              </article>
            </div>
            {smsSetupLoadError ? <WarningBanner title="SMS setup check blocked" risk="warning">{humanizeBackendMessage(smsSetupLoadError)}</WarningBanner> : null}
            <WarningBanner title="Neutral SMS wording" risk="info">
              Texts use generic session-link language, include HELP/STOP, and avoid study-sensitive content.
            </WarningBanner>
            {smsPolicy ? (
              <div className="form-grid">
                <label className="check-field">
                  <input checked={smsPolicy.sms_enabled} disabled={smsBusy} onChange={(event) => setSmsPolicy({ ...smsPolicy, sms_enabled: event.target.checked })} type="checkbox" />
                  <span>Permit SMS for this study</span>
                </label>
                <label className="field">
                  <span>Notification-safe study name</span>
                  <input disabled={smsBusy} onChange={(event) => setSmsPolicy({ ...smsPolicy, notification_safe_name: event.target.value })} placeholder="Example: Care Transitions Delphi" value={smsPolicy.notification_safe_name ?? ""} />
                </label>
                <label className="check-field">
                  <input checked={smsPolicy.safe_name_is_sensitive} disabled={smsBusy} onChange={(event) => setSmsPolicy({ ...smsPolicy, safe_name_is_sensitive: event.target.checked })} type="checkbox" />
                  <span>Use generic label because the study name is sensitive</span>
                </label>
                <label className="field">
                  <span>Magic link TTL minutes</span>
                  <input disabled={smsBusy} min={1} max={1440} onChange={(event) => setSmsPolicy({ ...smsPolicy, magic_link_ttl_minutes: Number(event.target.value) })} type="number" value={smsPolicy.magic_link_ttl_minutes} />
                </label>
              </div>
            ) : null}
            <div className="form-grid">
              <label className="field">
                <span>Participant</span>
                <select value={smsParticipantId} onChange={(event) => setSmsParticipantId(event.target.value)}>
                  {participantStatuses.map((entry) => (
                    <option key={entry.participant_id} value={entry.participant_id}>{entry.participant_id.slice(0, 8)} - {entry.status.replaceAll("_", " ").toLowerCase()}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Notification preference</span>
                <select value={smsPreferenceDraft} onChange={(event) => setSmsPreferenceDraft(event.target.value as ParticipantContactPreference["notification_preference"])}>
                  <option value="email_only">Email only</option>
                  <option value="sms_only">SMS only</option>
                  <option value="both">Email and SMS</option>
                  <option value="no_sms">No SMS / do not text</option>
                </select>
              </label>
              <label className="field">
                <span>Phone number</span>
                <input autoComplete="tel" disabled={smsBusy} onChange={(event) => setSmsPhoneDraft(event.target.value)} placeholder={smsPreference?.masked_phone ?? "+1 555 555 1234"} value={smsPhoneDraft} />
              </label>
              <label className="check-field">
                <input checked={smsConsentDraft} disabled={smsBusy} onChange={(event) => setSmsConsentDraft(event.target.checked)} type="checkbox" />
                <span>Participant has explicitly consented to receive study texts</span>
              </label>
              <label className="field">
                <span>OTP verification code</span>
                <input autoComplete="one-time-code" disabled={smsBusy || !smsChallenge} onChange={(event) => setSmsOtpDraft(event.target.value)} value={smsOtpDraft} />
              </label>
              <label className="field">
                <span>Round number for test send</span>
                <input min={1} max={4} onChange={(event) => setSmsRoundNumber(Number(event.target.value))} type="number" value={smsRoundNumber} />
              </label>
            </div>
            <div className="action-row compact-actions">
              <button className="secondary-button" disabled={smsBusy || !smsPolicy} onClick={saveSmsPolicy} type="button">Save SMS policy</button>
              <button className="secondary-button" disabled={smsBusy || !smsParticipantId} onClick={saveSmsPreference} type="button">Save preference</button>
              <button className="secondary-button" disabled={smsBusy || !smsParticipantId} onClick={startSmsVerification} type="button">Start phone verification</button>
              <button className="secondary-button" disabled={smsBusy || !smsChallenge || !smsOtpDraft.trim()} onClick={verifySmsPhone} type="button">Verify phone</button>
              <button className="primary-button" disabled={smsBusy || !smsPolicy?.sms_enabled} onClick={sendSmsForRound} type="button">Send round-open SMS</button>
            </div>
            {smsChallenge?.dev_otp ? <WarningBanner title="Development OTP" risk="info">Local development OTP: {smsChallenge.dev_otp}. Production builds do not expose OTP values.</WarningBanner> : null}
            {smsPreference ? <WarningBanner title="Masked phone display" risk={smsPreference.phone_verified_at ? "success" : "warning"}>{smsPreference.masked_phone ?? "No phone on file"}; preference {smsPreference.notification_preference.replaceAll("_", " ")}; verified {smsPreference.phone_verified_at ? "yes" : "no"}.</WarningBanner> : null}
            {smsMessage ? <WarningBanner title="SMS action recorded" risk="success">{smsMessage}</WarningBanner> : null}
            {smsError ? <WarningBanner title="SMS action blocked" risk="warning">{humanizeBackendMessage(smsError)}</WarningBanner> : null}
            <div className="review-stack">
              {smsNotifications.slice(0, 5).map((entry) => (
                <article className="review-row" key={entry.sms_notification_id}>
                  <div>
                    <strong>{entry.status.replaceAll("_", " ")}</strong>
                    <p>Participant {entry.participant_id.slice(0, 8)} for Round {entry.round_number}; provider {entry.provider}</p>
                    {entry.failure_code ? <small>Reason: {entry.failure_code}</small> : null}
                  </div>
                  <StatusBadge risk={entry.status === "sent" || entry.status === "delivered" ? "success" : entry.status === "skipped" ? "info" : "warning"} label={entry.status} />
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Role Assignment Review</span>
          <h2>Study membership is the backend source of truth</h2>
        </div>
        {!canManageAccess ? (
          <WarningBanner title="Access review restricted" risk="locked">
            Only Study Owners and Admins can manage study memberships from this console.
          </WarningBanner>
        ) : !activeStudyId ? (
          <WarningBanner title="Open a backend study" risk="info">
            Open or create a saved study to review and assign roles for that study.
          </WarningBanner>
        ) : (
          <>
            {accessMessage ? (
              <WarningBanner title="Access update" risk="success">
                {accessMessage}
              </WarningBanner>
            ) : null}
            {accessError ? (
              <WarningBanner title="Access update blocked" risk="danger">
                {humanizeBackendMessage(accessError)}
              </WarningBanner>
            ) : null}
            <div className="form-grid">
              <label className="field">
                <span>User</span>
                <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
                  {users.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.display_name} - {user.email}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Study role</span>
                <select
                  value={selectedStudyRole}
                  onChange={(event) => setSelectedStudyRole(event.target.value as StudyAssignment["role"])}
                >
                  <option value="Owner">Study Owner / PI</option>
                  <option value="MethodsSteward">Ethics & Methods Steward</option>
                  <option value="PrivacyLead">Security & Privacy Lead</option>
                  <option value="DataCustodian">Data Custodian</option>
                  <option value="Maintainer">Open Source Maintainer / Admin</option>
                </select>
              </label>
            </div>
            <div className="action-row">
              <button className="primary-button" disabled={accessBusy || !selectedUserId} onClick={assignRole} type="button">
                {accessBusy ? "Updating..." : "Assign or update role"}
              </button>
              <button className="secondary-button" disabled={accessBusy} onClick={loadAccessReview} type="button">
                Refresh review
              </button>
            </div>
            {roleConcentrations.length > 0 ? (
              <WarningBanner title="Multiple governance roles held by same user" risk="info">
                {roleConcentrations.map((entry) => {
                  const roles = entry.roles.map((assignmentRole) => studyRoleLabels[assignmentRole]).join(", ");
                  return `${userLabel(entry.userId)}: ${roles}`;
                }).join(" | ")}
              </WarningBanner>
            ) : null}
            <div className="assignment-list">
              {assignments.length === 0 ? (
                <WarningBanner title="No assignments yet" risk="warning">
                  Add at least a Study Owner and Ethics & Methods Steward before launch.
                </WarningBanner>
              ) : assignments.map((assignment) => (
                <article className="assignment-row" key={`${assignment.study_id}-${assignment.user_id}-${assignment.role}`}>
                  <div>
                    <strong>{userLabel(assignment.user_id)}</strong>
                    <small>{studyRoleLabels[assignment.role]} assigned {formatDateTime(assignment.created_at)}</small>
                  </div>
                  <button
                    className="secondary-button danger-button"
                    disabled={accessBusy || assignment.user_id === workflow.study?.created_by}
                    onClick={() => removeRole(assignment.user_id)}
                    type="button"
                  >
                    Remove user
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Persistence and Auth Roadmap</span>
          <h2>Next architecture move before multi-user studies</h2>
        </div>
        <div className="summary-grid">
          {[
            ["Database boundary", "Move file-store records into a relational model with migrations, backups, and tenant-aware study workspaces."],
            ["Real authentication", "Replace local role headers with sessions, participant tokens, passwordless links, and admin-managed roles."],
            ["Data separation", "Store identity, consent, responses, items, audit events, and exports in separately permissioned tables."],
            ["Export controls", "Make each export a persistent package with status, requester, approval state, hash, and download audit event."],
          ].map(([label, value]) => (
            <article className="summary-item" key={label}>
              <strong>{label}</strong>
              <p>{value}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
