import test from "node:test";
import assert from "node:assert/strict";

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
