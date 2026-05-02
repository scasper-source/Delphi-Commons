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
