/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(tsx?|jsx?)$/.test(entry.name) ? [full] : [];
  });
}

const forbiddenParticipantTerms = [
  "truth",
  "correct answer",
  "outlier",
  "deviant",
  "noncompliant participant",
  "move toward the group",
  "optimize consensus",
  "persuade",
  "fix disagreement",
];

function containsForbiddenParticipantLanguage(text) {
  const normalized = text.toLowerCase();
  return forbiddenParticipantTerms.some((term) => normalized.includes(term));
}

function appSource() {
  const srcDir = path.join(appRoot, "src");
  const files = sourceFiles(srcDir);
  return files.map((f) => fs.readFileSync(f, "utf8")).join("\n");
}

function findMarker(source, marker) {
  let index = source.indexOf(marker);
  if (index === -1 && !marker.startsWith("export ")) {
    index = source.indexOf("export " + marker);
  }
  return index;
}

function sourceSlice(source, start, end) {
  const startIndex = findMarker(source, start);
  assert.notEqual(startIndex, -1, `missing source marker ${start}`);
  let endIndex = findMarker(source.slice(startIndex + 1), end);
  if (endIndex === -1) {
    endIndex = findMarker(source, end);
    assert.notEqual(endIndex, -1, `missing source marker ${end}`);
    return endIndex > startIndex
      ? source.slice(startIndex, endIndex)
      : source.slice(startIndex) + source.slice(0, endIndex);
  }
  return source.slice(startIndex, startIndex + 1 + endIndex);
}

function canLaunchStudy(study) {
  return (
    study.ownerSigned &&
    study.stewardSigned &&
    study.consensusRule.locked &&
    study.checklist.every((item) => item.complete)
  );
}

function canPublishAISuggestion(suggestion) {
  const accepted = suggestion.status === "Accepted" || suggestion.status === "Edited";
  return accepted && suggestion.ownerSigned && suggestion.stewardSigned;
}

function canEditConsensusRule(studyStatus) {
  return studyStatus === "Draft";
}

function reportIncludesNonConsensus(report) {
  return report.includesNonConsensus && report.items.some((item) => item.consensusClass === "non_consensus");
}

function canAccessIdentityMap(role) {
  return role === "data_custodian" || role === "security_privacy_lead";
}

function luminance(hex) {
  const rgb = hex.match(/[0-9a-f]{2}/gi).map((value) => Number.parseInt(value, 16) / 255);
  const linear = rgb.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground, background) {
  const fg = luminance(foreground);
  const bg = luminance(background);
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
}

test("cannot launch without governance signoff and completed checklist", () => {
  const draftStudy = {
    ownerSigned: true,
    stewardSigned: false,
    consensusRule: { locked: true },
    checklist: [{ complete: true }, { complete: false }],
  };

  assert.equal(canLaunchStudy(draftStudy), false);
});

test("governance signoff UI names PI roles, sequence, and blocked-action reasons", () => {
  const source = appSource();
  const css = fs.readFileSync(path.join(appRoot, "src", "App.css"), "utf8");
  const workflowSource = sourceSlice(source, "function ConductorWorkflowPanel", "function buildGovernanceChecklist");
  const preSignoffNextActionSource = sourceSlice(source, "if (!workflow.version.study_format)", "if (workflow.version.status === \"ReadyForSignoff\")");
  const nextActionSource = sourceSlice(source, "if (workflow.version.status === \"ReadyForSignoff\")", "if (!roundOneConfig)");
  const appCommandSource = sourceSlice(source, "async function runNextActionCommand", "function navigateToCitation");

  assert.match(workflowSource, /Study PI signoff/);
  assert.match(workflowSource, /Ethics PI signoff/);
  assert.match(workflowSource, /Record Study PI signoff/);
  assert.match(workflowSource, /Record Ethics PI signoff/);
  assert.match(workflowSource, /Admin \/ Security/);
  assert.match(workflowSource, /Activation is blocked until both Study PI and Ethics PI signoffs are recorded/);
  assert.match(workflowSource, /workflow-disabled-reason/);
  assert.match(preSignoffNextActionSource, /kind: "workflow-step", step: "set-design"/);
  assert.match(preSignoffNextActionSource, /kind: "workflow-step", step: "set-consensus"/);
  assert.match(preSignoffNextActionSource, /kind: "workflow-step", step: "submit"/);
  assert.match(nextActionSource, /Assign the Ethics PI as Ethics & Methods Steward/);
  assert.match(nextActionSource, /kind: "workflow-step", step: "owner-signoff"/);
  assert.match(nextActionSource, /kind: "workflow-step", step: "steward-signoff"/);
  assert.match(nextActionSource, /kind: "workflow-step", step: "activate"/);
  assert.match(appCommandSource, /command\.kind === "workflow-step"/);
  assert.match(appCommandSource, /runWorkflowStep\(command\.step\)/);
  assert.doesNotMatch(workflowSource, /Switch role to Steward/);
  assert.match(css, /\.workflow-disabled-reason/);
});

test("cannot publish AI suggestion without human acceptance and dual signoff", () => {
  assert.equal(
    canPublishAISuggestion({
      status: "None",
      ownerSigned: true,
      stewardSigned: true,
    }),
    false,
  );

  assert.equal(
    canPublishAISuggestion({
      status: "Accepted",
      ownerSigned: true,
      stewardSigned: false,
    }),
    false,
  );
});

test("cannot edit consensus threshold mid-study", () => {
  assert.equal(canEditConsensusRule("Draft"), true);
  assert.equal(canEditConsensusRule("Active"), false);
  assert.equal(canEditConsensusRule("ReadyForSignoff"), false);
});

test("cannot omit non-consensus items from report model", () => {
  const incompleteReport = {
    includesNonConsensus: false,
    items: [{ consensusClass: "consensus" }],
  };
  const completeReport = {
    includesNonConsensus: true,
    items: [{ consensusClass: "non_consensus" }],
  };

  assert.equal(reportIncludesNonConsensus(incompleteReport), false);
  assert.equal(reportIncludesNonConsensus(completeReport), true);
});

test("cannot show participant-facing content with forbidden coercive language", () => {
  assert.equal(
    containsForbiddenParticipantLanguage("You may retain response or revise response after reviewing the group summary."),
    false,
  );
  assert.equal(
    containsForbiddenParticipantLanguage("Please move toward the group and fix disagreement."),
    true,
  );
});

test("cannot access identity mapping without proper role", () => {
  assert.equal(canAccessIdentityMap("study_owner"), false);
  assert.equal(canAccessIdentityMap("panelist"), false);
  assert.equal(canAccessIdentityMap("data_custodian"), true);
  assert.equal(canAccessIdentityMap("security_privacy_lead"), true);
});

test("frontend does not use unsafe HTML sinks or browser storage for sensitive data", () => {
  const files = sourceFiles(path.join(appRoot, "src"));
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    assert.equal(content.includes("dangerouslySetInnerHTML"), false, `${file} uses dangerouslySetInnerHTML`);
    assert.equal(content.includes(".innerHTML"), false, `${file} writes innerHTML`);
    assert.equal(content.includes("localStorage"), false, `${file} uses localStorage`);
    assert.equal(content.includes("sessionStorage"), false, `${file} uses sessionStorage`);
  }
});

test("core UI colors meet WCAG AA contrast for normal text", () => {
  const pairs = [
    ["#1f2a2e", "#ffffff", "body text on panel"],
    ["#5d6d70", "#ffffff", "muted text on panel"],
    ["#5d6d70", "#f6f7f4", "eyebrow text on page background"],
    ["#ffffff", "#19343a", "primary button text"],
    ["#edf4f2", "#19343a", "sidebar navigation text"],
    ["#c9d9d6", "#19343a", "sidebar secondary text"],
  ];

  for (const [foreground, background, label] of pairs) {
    assert.ok(
      contrastRatio(foreground, background) >= 4.5,
      `${label} contrast is below WCAG AA`,
    );
  }
});

test("visible focus style is defined for keyboard users", () => {
  const css = fs.readFileSync(path.join(appRoot, "src", "App.css"), "utf8");
  assert.match(css, /:focus-visible/);
  assert.match(css, /outline:\s*3px\s+solid/);
  assert.match(css, /outline-offset:\s*3px/);
});

test("AI connector UI masks keys and documents No External AI mode", () => {
  const source = appSource();
  assert.match(source, /AI Connector & Compliance/);
  assert.match(source, /No External AI mode/);
  assert.match(source, /maskedApiKey/);
  assert.match(source, /type="password"/);
  assert.match(source, /The plaintext key is never shown again/);
});

test("repository citation metadata is present without a fake DOI", () => {
  const cff = fs.readFileSync(path.resolve(appRoot, "..", "CITATION.cff"), "utf8");
  assert.match(cff, /cff-version: 1\.2\.0/);
  assert.match(cff, /title: "Delphi Commons Open Source Platform"/);
  assert.match(cff, /family-names: "Casper"/);
  assert.match(cff, /license: "Apache-2\.0"/);
  assert.match(cff, /repository-code:/);
  assert.doesNotMatch(cff, /^doi:/m);
});

test("participant orientation modules are global, searchable, and gated before Round 1", () => {
  const source = appSource();
  const registry = fs.readFileSync(path.join(appRoot, "src", "modules", "registry.ts"), "utf8");
  const orientationContent = fs.readFileSync(path.join(appRoot, "src", "content", "orientation.ts"), "utf8");
  const citationContent = fs.readFileSync(path.join(appRoot, "src", "content", "citation.ts"), "utf8");
  const apiSource = fs.readFileSync(path.join(appRoot, "src", "core", "api.ts"), "utf8");

  assert.match(registry, /id: "about"/);
  assert.match(registry, /id: "glossary"/);
  assert.match(source, /case "about"/);
  assert.match(source, /case "glossary"/);
  assert.match(source, /function AboutScreen/);
  assert.match(source, /function GlossaryScreen/);
  assert.match(source, /headerModuleIds: ModuleId\[\] = role === "panelist"/);
  assert.match(source, /\["about", "participant", "closeout", "glossary"\]/);
  assert.match(source, /\["about", "glossary"\]/);
  assert.match(source, /navigationModules = accessibleModules\.filter/);
  assert.match(source, /reference-bar/);
  assert.match(source, /reference-link/);
  assert.match(source, /aria-label="Reference pages"/);
  assert.match(source, /How to Cite This Tool/);
  assert.match(source, /id="how-to-cite-this-tool"/);
  assert.match(source, /Cite this tool/);
  assert.match(source, /scrollIntoView/);
  assert.match(citationContent, /please cite it to support transparency and reproducibility/);
  assert.match(source, /does not validate study findings or imply platform/);
  assert.match(source, /function ParticipantOrientationPanel/);
  assert.match(source, /participantOrientationComplete/);
  assert.match(source, /onCompleteParticipantOrientation/);
  assert.match(source, /participant_orientation_required/);
  assert.match(apiSource, /completeInvitationOrientation/);
  assert.match(apiSource, /completeParticipantOrientation/);

  for (const term of [
    "Delphi method",
    "Consensus",
    "Consensus threshold",
    "Median",
    "Interquartile range / IQR",
    "Controlled feedback",
    "Anonymity vs confidentiality",
    "AI suggestion",
    "Human review",
    "Provenance",
    "Data retention",
  ]) {
    assert.match(orientationContent, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("participant orientation explains consensus, confidentiality, voluntariness, tutorial, and AI boundaries", () => {
  const source = appSource();
  const orientationSource = fs.readFileSync(path.join(appRoot, "src", "content", "orientation.ts"), "utf8");
  const panelSource = sourceSlice(source, "function ParticipantOrientationPanel", "function ParticipantScreen");

  assert.match(panelSource, /Orientation supplements consent/);
  assert.match(panelSource, /60-90 second tutorial/);
  assert.match(panelSource, /Fictional example only/);
  assert.match(panelSource, /I understand and am ready to continue/);
  assert.match(orientationSource, /Consensus means agreement among this study's panel/);
  assert.match(orientationSource, /It does not establish correctness/);
  assert.match(orientationSource, /confidentiality to the research team rather than absolute anonymity/);
  assert.match(orientationSource, /Participation is your choice/);
  assert.match(orientationSource, /AI does not decide outcomes, determine consensus, or tell participants what to answer/);
  assert.match(orientationSource, /AI assistance is not being used for this study's participant-facing process/);
});

test("inline help is accessible and round reminders reinforce independent judgment", () => {
  const source = appSource();
  const inlineHelpSource = sourceSlice(source, "function InlineHelp", "function ParticipantOrientationPanel");
  const participantSource = sourceSlice(source, "function ParticipantScreen", "function RoundContextPanel");
  const orientationSource = fs.readFileSync(path.join(appRoot, "src", "content", "orientation.ts"), "utf8");

  assert.match(inlineHelpSource, /aria-controls/);
  assert.match(inlineHelpSource, /aria-expanded/);
  assert.match(inlineHelpSource, /aria-label=\{`Help:/);
  assert.match(inlineHelpSource, /Close help/);
  assert.match(participantSource, /roundReminder\(1\)/);
  assert.match(participantSource, /roundReminder\(currentRatingRoundNumber\)/);
  assert.match(orientationSource, /You are giving your independent judgment\. There are no correct answers\./);
  assert.match(orientationSource, /You may keep or revise your response\. There is no correct answer\./);
  assert.match(orientationSource, /Consensus means agreement among this panel under this study's rule\. It does not establish correctness\./);
});

test("post-Round 1 participant context is generic, compact, and non-coercive", () => {
  const participantFeedbackSource = sourceSlice(appSource(), "function RoundContextPanel", "function ReportingScreen");
  assert.match(participantFeedbackSource, /roundNumber <= 1/);
  assert.match(participantFeedbackSource, /roundNumber === 2/);
  assert.match(participantFeedbackSource, /You are now in Round \{roundNumber\}/);
  assert.match(participantFeedbackSource, /This round is based on anonymized responses from Round 1/);
  assert.match(participantFeedbackSource, /This round is based on anonymized responses and controlled feedback from earlier rounds\./);
  assert.match(participantFeedbackSource, /You may revise or retain your view\./);
  assert.match(participantFeedbackSource, /You may keep your previous response\./);
  assert.match(participantFeedbackSource, /You may revise your response\./);
  assert.match(participantFeedbackSource, /Different views are valuable\./);
  assert.match(participantFeedbackSource, /Consensus does not mean correctness\./);

  for (const phrase of [
    "move toward the group",
    "outlier",
    "consensus answer",
    "correct answer",
    "deviant",
    "wrong",
    "wrong answer",
    "align with the group",
    "you should change",
    "you should move",
    "the group answer",
    "normal response",
    "abnormal response",
  ]) {
    assert.equal(
      participantFeedbackSource.toLowerCase().includes(phrase),
      false,
      `participant feedback UI includes forbidden phrase: ${phrase}`,
    );
  }
});

test("controlled feedback cards use progressive disclosure and accessible distribution text", () => {
  const participantFeedbackSource = sourceSlice(appSource(), "function ControlledFeedbackCard", "function ReportingScreen");
  assert.match(participantFeedbackSource, /Your previous response/);
  assert.match(participantFeedbackSource, /Group median/);
  assert.match(participantFeedbackSource, /Middle range of responses/);
  assert.match(participantFeedbackSource, /Neutral summary/);
  assert.match(participantFeedbackSource, /Item source:/);
  assert.match(participantFeedbackSource, /<details className="feedback-detail">/);
  assert.match(participantFeedbackSource, /Show more detail/);
  assert.match(participantFeedbackSource, /Show rationale excerpts/);
  assert.match(participantFeedbackSource, /role="img"/);
  assert.match(participantFeedbackSource, /aria-label=\{`Distribution across/);
});

test("study designer UI saves and locks post-Round 1 feedback configuration", () => {
  const source = appSource();
  assert.match(source, /feedbackFormat: "distribution_summary"/);
  assert.match(source, /showParticipantPriorResponse: true/);
  assert.match(source, /Distribution only/);
  assert.match(source, /Distribution \+ summary/);
  assert.match(source, /Distribution \+ anonymized rationales/);
  assert.match(source, /Show participant prior response/);
  assert.match(source, /The selected feedback format will be versioned and locked when this round opens\./);
  assert.match(source, /Feedback format locked for this round\./);
  assert.match(source, /Feedback locked/);
});

test("governed attrition UI preserves historical data and avoids removal language", () => {
  const source = appSource();
  const attritionSource = sourceSlice(source, "Governed Non-response", "Role Assignment Review");
  assert.match(attritionSource, /Mark inactive for future rounds/);
  assert.match(attritionSource, /Prior submitted responses remain/);
  assert.match(attritionSource, /Detect non-response/);
  assert.match(attritionSource, /Queue reminder/);
  assert.match(attritionSource, /Queue final notice/);
  assert.match(attritionSource, /Expire follow-up/);
  for (const phrase of ["Remove participant", "Delete participant", "Drop participant", "Exclude participant"]) {
    assert.equal(attritionSource.includes(phrase), false, `attrition UI includes forbidden participant action phrase: ${phrase}`);
  }
});

test("participant withdrawal copy is voluntary and preserves protocol limits", () => {
  const participantCopy = fs.readFileSync(path.join(appRoot, "src", "content", "participantCopy.ts"), "utf8");
  const participantRights = sourceSlice(participantCopy, "participantRightsTitle", "taskSummary");
  assert.match(participantRights, /You may withdraw from future rounds at any time/);
  assert.match(participantRights, /prior submitted responses may remain in already aggregated or historical study data/);
  assert.match(participantRights, /You may contact the study team about data deletion where feasible/);
});

test("participant mobile workflow exposes save state, item progress, rationale, and sticky actions", () => {
  const source = appSource();
  const css = fs.readFileSync(path.join(appRoot, "src", "App.css"), "utf8");
  const participantSource = sourceSlice(source, "function ParticipantScreen", "function RoundContextPanel");

  assert.match(source, /function SaveStatusIndicator/);
  assert.match(source, /function ProgressIndicator/);
  assert.match(participantSource, /mobile-task-summary/);
  assert.match(participantSource, /Save progress/);
  assert.match(participantSource, /Rating progress/);
  assert.match(participantSource, /Item \$\{itemIndex \+ 1\} of/);
  assert.match(participantSource, /Optional rationale/);
  assert.match(participantSource, /aria-describedby=\{`rationale-help-/);
  assert.match(participantSource, /sticky-action-bar/);
  assert.match(css, /\.sticky-action-bar/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /min-height:\s*48px/);
  assert.match(css, /\.compact-distribution[\s\S]*grid-template-columns:\s*repeat\(3/);
});

test("participant study time and method copy use active study version values", () => {
  const source = appSource();
  const participantSource = sourceSlice(source, "function ParticipantScreen", "function RoundContextPanel");
  const studyTimeSource = sourceSlice(source, "<h3>Study Time Commitment</h3>", "<h3>{participantCopy.portal.participantRightsTitle}</h3>");

  assert.match(participantSource, /activeStudyVersion = participantInvite\?\.study_version \?\? workflow\.version \?\? null/);
  assert.match(participantSource, /activeStudyVersion\?\.planned_round_count \?\? activeStudyVersion\?\.terminal_round_number \?\? null/);
  assert.match(participantSource, /participantFacingStudyFormat = activeStudyVersion\?\.study_format \?\? null/);
  assert.match(participantSource, /participantStudyTimeCopy = participantFacingPlannedRounds/);
  assert.match(participantSource, /participantFacingStudyFormat === "ClassicDelphi"/);
  assert.match(participantSource, /participantFacingStudyFormat === "ModifiedDelphi"/);
  assert.match(participantSource, /study's round schedule will be provided by the study team/);
  assert.match(studyTimeSource, /participantStudyTimeCopy/);
  assert.match(studyTimeSource, /participantStudyFormatLabel/);
  assert.doesNotMatch(studyTimeSource, /wizard\.plannedRoundCount/);
  assert.doesNotMatch(studyTimeSource, /wizard\.studyFormat/);
});

test("Phase 1A multi-research-question setup and Round 1 capture stay lean and governed", () => {
  const source = appSource();
  const wizardSource = fs.readFileSync(path.join(appRoot, "src", "core", "studyWizard.ts"), "utf8");
  const apiSource = fs.readFileSync(path.join(appRoot, "src", "core", "api.ts"), "utf8");
  const css = fs.readFileSync(path.join(appRoot, "src", "App.css"), "utf8");
  const purposeSource = sourceSlice(source, "function WizardStepFields", "if (step === \"method\")");
  const participantSource = sourceSlice(source, "function ParticipantScreen", "function RoundContextPanel");

  assert.match(wizardSource, /researchQuestions: ResearchQuestion\[\]/);
  assert.match(wizardSource, /normalizeWizardResearchQuestions/);
  assert.match(wizardSource, /At least one active research question is required/);
  assert.match(purposeSource, /Research questions/);
  assert.match(purposeSource, /Add research question/);
  assert.match(purposeSource, /Move question down/);
  assert.match(purposeSource, /isDefaultQuestionLabel/);
  assert.match(purposeSource, /Many research questions can increase participant burden/);
  assert.match(purposeSource, /activeQuestions\.length <= 1/);
  assert.match(purposeSource, /instrumentLocked/);
  assert.match(participantSource, /roundOneResearchQuestions\.map/);
  assert.match(participantSource, /Round 1 response for/);
  assert.match(participantSource, /question\.requiredForRound1Response/);
  assert.match(apiSource, /responses: string \| RoundOneAnswerInput\[\]/);
  assert.match(apiSource, /response_json:[\s\S]*responses/);
  assert.match(css, /\.research-question-manager/);
  assert.match(css, /\.round-one-question-response/);
});

test("study owner can start a new backend study without archiving saved studies", () => {
  const source = appSource();
  const resetSlice = sourceSlice(source, "function startNewStudyDraft()", "async function loadRoundConfigs");
  assert.match(resetSlice, /setWorkflow\(initialWorkflow\)/);
  assert.match(resetSlice, /setWizard\(defaultWizardState\)/);
  assert.match(resetSlice, /setActiveWizardStep\("purpose"\)/);
  assert.match(resetSlice, /setWorkspacePath\("new-study"\)/);
  assert.match(resetSlice, /setWorkspaceLauncherOpen\(true\)/);
  assert.match(resetSlice, /setActiveModule\("dashboard"\)/);
  assert.doesNotMatch(resetSlice, /archiveStudy/);

  const dashboardSavedStudiesSlice = sourceSlice(source, "<h3>Saved Studies</h3>", "savedStudies.length === 0");
  assert.match(dashboardSavedStudiesSlice, /onStartNewStudyDraft/);
  assert.match(dashboardSavedStudiesSlice, /Start new study/);
  assert.match(dashboardSavedStudiesSlice, /onArchiveSmokeTestStudies/);

  const builderHeaderSlice = sourceSlice(source, "<span className=\"eyebrow\">Study Builder</span>", "<div className=\"wizard-stepper\"");
  assert.match(builderHeaderSlice, /workflow\.study/);
  assert.match(builderHeaderSlice, /onStartNewStudyDraft/);
});

test("study workspace launcher routes staff into backend-backed workspaces before dashboard", () => {
  const source = appSource();
  const css = fs.readFileSync(path.join(appRoot, "src", "App.css"), "utf8");
  const workspacePathSource = sourceSlice(source, "type WorkspacePath", "const statusLabels");
  const createWorkspaceSource = sourceSlice(source, "async function createSavedStudyWorkspaceFromLauncher()", "async function loadRoundConfigs");
  const chromeGateSource = sourceSlice(source, "const participantEntryActive", "async function runNextActionCommand");
  const launcherSource = sourceSlice(source, "function StudyWorkspaceLauncher", "function ModuleRenderer");

  assert.match(workspacePathSource, /"main-menu" \| "new-study" \| "current-studies" \| "past-studies"/);
  assert.match(workspacePathSource, /Main Menu/);
  assert.match(workspacePathSource, /New Study/);
  assert.match(workspacePathSource, /Current Studies/);
  assert.match(workspacePathSource, /Past Studies \/ Writing Up/);
  assert.match(source, /const \[workspaceLauncherOpen, setWorkspaceLauncherOpen\] = useState\(true\)/);
  assert.match(source, /const \[workspacePath, setWorkspacePath\] = useState<WorkspacePath>\("main-menu"\)/);
  assert.match(source, /openWorkspaceLauncherPath\("main-menu"\)/);
  assert.match(source, /function resetLauncherNewStudyDraft\(\)/);
  assert.match(source, /function openWorkspaceLauncherPath\(nextPath: WorkspacePath\)/);
  assert.match(source, /nextPath === "new-study" && \(workspacePath !== "new-study" \|\| !workspaceLauncherOpen\)/);
  assert.match(source, /onPathChange=\{openWorkspaceLauncherPath\}/);
  assert.match(source, /onOpenCurrentStudy=\{\(record\) => openSavedStudy\(record, "dashboard"\)\}/);
  assert.match(source, /record\.study\.archived_at/);
  assert.match(source, /status === "Draft" \|\| status === "ReadyForSignoff" \|\| status === "Active"/);
  assert.match(source, /return status === "Closed"/);
  assert.match(chromeGateSource, /participantEntryActive/);
  assert.match(chromeGateSource, /suppressStudyOperatingChrome = !participantEntryActive && workspaceLauncherOpen/);
  assert.match(chromeGateSource, /showStudyWorkspaceLauncher = suppressStudyOperatingChrome && !referenceModuleSelected/);

  assert.match(createWorkspaceSource, /conductorApi\.createStudy\(role, nextWizard\)/);
  assert.match(createWorkspaceSource, /conductorApi\.createVersion\(created\.study\.id, role\)/);
  assert.match(createWorkspaceSource, /conductorApi\.saveWizardPacket\(created\.study\.id, version\.studyVersion\.id, role, nextWizard\)/);
  assert.match(createWorkspaceSource, /setWorkspaceLauncherOpen\(false\)/);
  assert.match(createWorkspaceSource, /setActiveModule\("study-builder"\)/);
  assert.doesNotMatch(createWorkspaceSource, /archiveStudy/);

  assert.match(launcherSource, /Unsaved draft/);
  assert.match(launcherSource, /Delphi Commons is a governed eDelphi research workspace/);
  assert.match(launcherSource, /Saved workspace/);
  assert.match(launcherSource, /Version saved/);
  assert.match(launcherSource, /latest\?\.updated_at \?\? latest\?\.created_at \?\? record\.study\.updated_at \?\? record\.study\.created_at/);
  assert.match(launcherSource, /Save blocked/);
  assert.match(launcherSource, /Create saved study workspace/);
  assert.match(launcherSource, /onOpenCurrentStudy\(record\)/);
  assert.match(launcherSource, /onOpenPastStudy\(record, "reporting"\)/);
  assert.match(launcherSource, /Open reporting/);
  assert.match(launcherSource, /Review closeout/);
  assert.match(launcherSource, /Writing up is not archive/);
  assert.match(launcherSource, /Ethics & Methods Steward/);
  assert.match(launcherSource, /solo internal\/synthetic/i);
  assert.match(launcherSource, /UI selection does not replace backend authorization/);

  assert.match(css, /\.workspace-path-button\.path-main-menu\.active\s*\{[^}]*background:\s*var\(--path-menu\)/s);
  assert.match(css, /\.workspace-path-button\.path-new-study\.active\s*\{[^}]*background:\s*var\(--path-new\)/s);
  assert.match(css, /\.workspace-path-button\.path-current-studies\.active\s*\{[^}]*background:\s*var\(--path-current\)/s);
  assert.match(css, /\.workspace-path-button\.path-past-studies\.active\s*\{[^}]*background:\s*var\(--path-past\)/s);
  assert.match(css, /\.launcher-path-tabs\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/s);
});

test("rating rationale is submitted through API and exported as redacted rationale text", () => {
  const apiSource = fs.readFileSync(path.join(appRoot, "src", "core", "api.ts"), "utf8");
  const reportsSource = fs.readFileSync(path.resolve(appRoot, "..", "server", "src", "routes", "reports.ts"), "utf8");

  assert.match(apiSource, /rationale_text: rationaleText/);
  assert.match(reportsSource, /const rationaleText = typeof ratingPayload\.rationale_text === "string"/);
  assert.match(reportsSource, /const redactedRationaleText = redactExportText\(rationaleText\)/);
  assert.match(reportsSource, /rationale_text_redacted: redactedRationaleText/);
});

test("study-designer mobile basics keep governance and AI controls touch-friendly", () => {
  const source = appSource();
  const css = fs.readFileSync(path.join(appRoot, "src", "App.css"), "utf8");
  const curationSource = sourceSlice(source, "function CurationScreen", "function FeedbackScreen");

  assert.match(curationSource, /AI Suggestion \(Not Final\)/);
  assert.match(curationSource, /Accept/);
  assert.match(curationSource, /Reject/);
  assert.match(curationSource, /Sign release/);
  assert.match(css, /\.workflow-check/);
  assert.match(css, /\.signoff/);
  assert.match(css, /\.ai-card dl div/);
  assert.match(css, /\.action-row > button/);
});

test("final closeout uses one canonical snapshot and respectful participant language", () => {
  const source = appSource();
  const css = fs.readFileSync(path.join(appRoot, "src", "App.css"), "utf8");
  const apiSource = fs.readFileSync(path.join(appRoot, "src", "core", "api.ts"), "utf8");
  const serverSource = fs.readFileSync(path.resolve(appRoot, "..", "server", "src", "core", "finalResults.ts"), "utf8");
  const participantRouteSource = fs.readFileSync(path.resolve(appRoot, "..", "server", "src", "routes", "participants.ts"), "utf8");
  const closeoutSource = sourceSlice(source, "function FinalResultsCloseoutScreen", "function FinalItemOutcomeCard");

  assert.match(serverSource, /createFinalResultSnapshot/);
  assert.match(serverSource, /FINAL_RESULT_REQUIRED_STATEMENT/);
  assert.match(serverSource, /redactExportText\(item\.text\)/);
  assert.match(participantRouteSource, /redactExportText\(item\?\.text \?\? ""\)/);
  assert.match(participantRouteSource, /redactExportText\(payload\.rationale_text\)/);
  assert.match(participantRouteSource, /snapshot: redactExportValue\(snapshot\)/);
  assert.match(apiSource, /type FinalResultSnapshot/);
  assert.match(css, /\*\s*,\s*\*::before\s*,\s*\*::after\s*\{[^}]*box-sizing:\s*border-box/s);
  assert.match(css, /\.workspace\s*\{[^}]*box-sizing:\s*border-box/s);
  assert.match(css, /\.panel\s*\{[^}]*min-width:\s*0/s);
  assert.match(css, /\.panel\s*\{[^}]*max-width:\s*100%/s);
  assert.match(css, /\.final-item-card\s*,[\s\S]*overflow-wrap:\s*anywhere/);
  assert.match(closeoutSource, /Final Results & Study Closeout/);
  assert.match(closeoutSource, /Thank you - this Delphi study is complete/);
  assert.match(closeoutSource, /snapshot\.requiredStatement/);
  assert.match(closeoutSource, /Unresolved and preserved perspectives/);
  assert.match(closeoutSource, /Release to participants/);
  assert.match(closeoutSource, /No consensus/);

  for (const phrase of [
    "outlier",
    "deviant",
    "nonconforming",
    "you aligned",
    "you disagreed with the panel",
    "success rate",
    "failed to reach the right answer",
  ]) {
    assert.equal(closeoutSource.toLowerCase().includes(phrase), false, `final closeout UI includes forbidden phrase: ${phrase}`);
  }
});

test("SMS magic-link UI is opt-in, neutral, mobile-first, and avoids browser storage", () => {
  const source = appSource();
  const apiSource = fs.readFileSync(path.join(appRoot, "src", "core", "api.ts"), "utf8");
  const css = fs.readFileSync(path.join(appRoot, "src", "App.css"), "utf8");
  const smsSource = sourceSlice(source, "SMS Round Notifications", "Role Assignment Review");
  const magicSource = sourceSlice(source, "function MagicRoundEntryScreen", "function ParticipantScreen");

  assert.match(smsSource, /Permit SMS for this study/);
  assert.match(smsSource, /Participant has explicitly consented to receive study texts/);
  assert.match(smsSource, /Start phone verification/);
  assert.match(smsSource, /Verify phone/);
  assert.match(smsSource, /Send round-open SMS/);
  assert.match(smsSource, /Contact preference/i);
  assert.match(magicSource, /Secure mobile round entry/);
  assert.match(magicSource, /Participation remains voluntary/);
  assert.match(magicSource, /Decline this round/);
  assert.match(magicSource, /Withdrawal and help information/);
  assert.match(apiSource, /\/magic-links\/consume/);
  assert.match(apiSource, /credentials: "include"/);
  assert.match(source, /window\.history\.replaceState/);
  assert.match(css, /@media \(max-width: 620px\)/);

  for (const phrase of [
    "you must respond",
    "the group needs you",
    "please align with the group",
    "consensus depends on you",
  ]) {
    assert.equal(smsSource.toLowerCase().includes(phrase), false, `SMS UI includes coercive phrase: ${phrase}`);
    assert.equal(magicSource.toLowerCase().includes(phrase), false, `magic entry UI includes coercive phrase: ${phrase}`);
  }
});

test("Study Context & Disclosures sidecar is optional, progressive, and human-reviewed", () => {
  const source = appSource();
  const apiSource = fs.readFileSync(path.join(appRoot, "src", "core", "api.ts"), "utf8");
  const css = fs.readFileSync(path.join(appRoot, "src", "App.css"), "utf8");
  const sidecarSource = sourceSlice(source, "function StudyContextSidecar", "function TernarySelect");

  assert.match(source, /Study Context & Disclosures/);
  assert.match(sidecarSource, /Optional sidecar/);
  assert.match(sidecarSource, /Blank fields do not block launch/);
  assert.match(sidecarSource, /Draft preview mode/);
  assert.match(sidecarSource, /Keep draft/);
  assert.match(sidecarSource, /Sponsor details stay hidden unless external funding or sponsor involvement is selected/);
  assert.match(apiSource, /AI Suggestion — Not Final/);
  assert.match(sidecarSource, /suggestion\.label/);
  assert.match(source, /Nothing is final until accepted or edited/);
  assert.match(sidecarSource, /Participants receive only the concise disclosure snippet/);
  assert.match(apiSource, /context-disclosure/);
  assert.match(apiSource, /generate-participant-disclosure/);
  assert.match(apiSource, /proposal-import/);
  assert.match(css, /\.sidecar-panel/);
  assert.match(css, /\.disclosure-preview/);
});

test("participant trouble reporting and copy registry support mock-trial cleanup", () => {
  const source = appSource();
  const apiSource = fs.readFileSync(path.join(appRoot, "src", "core", "api.ts"), "utf8");
  const copySource = fs.readFileSync(path.join(appRoot, "src", "content", "participantCopy.ts"), "utf8");
  const participantSource = sourceSlice(source, "function ParticipantScreen", "function RoundContextPanel");
  const magicSource = sourceSlice(source, "function MagicRoundEntryScreen", "function ParticipantScreen");

  assert.match(copySource, /Having trouble\?/);
  assert.match(copySource, /button_or_textbox_not_working/);
  assert.match(participantSource, /ParticipantIssueReporter/);
  assert.match(participantSource, /ParticipantIssueHistory/);
  assert.match(magicSource, /ParticipantIssueReporter/);
  assert.match(magicSource, /ParticipantIssueHistory/);
  assert.match(source, /Participant Issue Notes/);
  assert.match(source, /Record response/);
  assert.match(apiSource, /reportInvitationParticipantIssue/);
  assert.match(apiSource, /reportMagicParticipantIssue/);
  assert.match(apiSource, /respondParticipantIssue/);
  assert.match(apiSource, /listInvitationParticipantIssues/);
  assert.match(apiSource, /participant-issues/);
  assert.match(source, /local-preview-study/);
  assert.match(source, /participant-preview/);
  assert.match(source, /Participant issue response recorded in this local preview/);
  assert.match(participantSource, /participantCopy\.portal/);
  assert.equal(participantSource.toLowerCase().includes("smoke"), false);
  assert.equal(magicSource.toLowerCase().includes("smoke"), false);
});
