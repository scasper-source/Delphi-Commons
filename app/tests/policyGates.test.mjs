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
  return fs.readFileSync(path.join(appRoot, "src", "App.tsx"), "utf8");
}

function sourceSlice(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex);
  assert.notEqual(startIndex, -1, `missing source marker ${start}`);
  assert.notEqual(endIndex, -1, `missing source marker ${end}`);
  return source.slice(startIndex, endIndex);
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
  assert.match(cff, /title: "eDelphi Platform"/);
  assert.match(cff, /family-names: "Casper"/);
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
  assert.match(source, /headerModuleIds: ModuleId\[\] = \["about", "glossary"\]/);
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
  const source = appSource();
  const participantRights = sourceSlice(source, "Participant Rights", "function RoundContextPanel");
  assert.match(participantRights, /You may withdraw from future rounds at any time/);
  assert.match(participantRights, /prior submitted responses may remain in already aggregated or historical study data/);
  assert.match(participantRights, /You may contact the study team about data deletion where feasible/);
});
