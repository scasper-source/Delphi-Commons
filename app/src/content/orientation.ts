/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import type { StudyWizardState } from "../core/studyWizard";

export const orientationContentVersion = "participant-orientation-v1";

export type GlossaryTerm = {
  id: string;
  term: string;
  plain: string;
  technical: string;
  aliases?: string[];
};

export type AboutSection = {
  title: string;
  body: string;
};

export const glossaryTerms: GlossaryTerm[] = [
  {
    id: "delphi-commons",
    term: "Delphi Commons",
    plain: "Delphi Commons is software for running Delphi studies online.",
    technical:
      "The platform supports study design, consent, rounds, controlled feedback, curation, reporting, audit logs, exports, and governance checks.",
  },
  {
    id: "delphi-method",
    term: "Delphi method",
    plain:
      "A Delphi study asks a panel to respond over more than one round, then shares summaries so people can reconsider or keep their views.",
    technical:
      "Delphi methods use structured iteration, controlled feedback, predefined rules, and transparent reporting of agreement, disagreement, and limits.",
  },
  {
    id: "consensus",
    term: "Consensus",
    plain: "Consensus means enough people in this study gave similar answers under the study rule.",
    technical:
      "Consensus is agreement among this panel under a predefined threshold or statistical rule. It does not establish correctness.",
  },
  {
    id: "consensus-threshold",
    term: "Consensus threshold",
    plain: "The consensus threshold is the study rule for deciding when enough people agree.",
    technical:
      "A threshold may be set as a percentage agreement level, such as 70% or 80%, and must be defined before the relevant results are known.",
  },
  {
    id: "median",
    term: "Median",
    plain: "The median is the middle response after responses are ordered.",
    technical: "Half of responses are at or below the median and half are at or above it, when ordered numerically.",
  },
  {
    id: "iqr",
    term: "Interquartile range / IQR",
    plain: "IQR shows the middle range of responses.",
    technical:
      "The interquartile range is the distance between the 25th and 75th percentiles. It describes response spread without identifying individuals.",
    aliases: ["interquartile range"],
  },
  {
    id: "round",
    term: "Round",
    plain: "A round is one step of the study where participants respond to prompts or items.",
    technical:
      "Round 1 often collects open-ended ideas. Later rounds may ask participants to rate, rank, or review candidate statements with controlled feedback.",
  },
  {
    id: "panel",
    term: "Panel",
    plain: "The panel is the group invited to take part in the study.",
    technical: "A Delphi panel is usually selected for relevant experience, expertise, or stakeholder perspective.",
    aliases: ["expert panel"],
  },
  {
    id: "expert-panel",
    term: "Expert panel",
    plain: "An expert panel is a group invited because their knowledge or experience is relevant to the study question.",
    technical:
      "Expertise can include professional, lived, stakeholder, policy, operational, or methodological experience, depending on the protocol.",
  },
  {
    id: "group-summary",
    term: "Group summary",
    plain: "A group summary describes what the panel said without naming individual people.",
    technical:
      "Group summaries may include themes, medians, IQR, distributions, or approved anonymized rationales, depending on the locked feedback configuration.",
  },
  {
    id: "controlled-feedback",
    term: "Controlled feedback",
    plain: "Controlled feedback is a neutral summary from earlier rounds.",
    technical:
      "Controlled feedback is configured before a round opens and may include aggregate statistics, summaries, prior responses, or approved anonymized rationale excerpts.",
  },
  {
    id: "participant-prior-response",
    term: "Your previous response",
    plain: "Your previous response is what you submitted for the same or related item in an earlier round.",
    technical:
      "Prior responses are shown only when the study feedback configuration allows it and only to the participant who submitted them.",
  },
  {
    id: "attrition",
    term: "Attrition",
    plain: "Attrition means some participants stop responding or withdraw before the study ends.",
    technical: "Attrition is reported because it can affect interpretation of consensus and response rates.",
  },
  {
    id: "response-rate",
    term: "Response rate",
    plain: "Response rate shows how many invited or active participants responded in a round.",
    technical: "The denominator should remain transparent so participants are not silently removed from historical calculations.",
  },
  {
    id: "anonymity",
    term: "Anonymity",
    plain: "Anonymity means a person cannot reasonably be identified.",
    technical: "This platform does not promise absolute anonymity when the research team must link responses across rounds.",
  },
  {
    id: "confidentiality",
    term: "Confidentiality",
    plain: "Confidentiality means the research team protects information and limits who can see it.",
    technical: "Responses are confidential to approved research team members and are linked across rounds using participant IDs.",
  },
  {
    id: "anonymity-confidentiality",
    term: "Anonymity vs confidentiality",
    plain: "Other participants should not see who you are, but the research team may need to link your responses across rounds.",
    technical: "This is confidentiality to the research team, not absolute anonymity.",
  },
  {
    id: "non-consensus",
    term: "Non-consensus",
    plain: "Non-consensus means an item did not meet the study's agreement rule.",
    technical: "Non-consensus items are meaningful findings and should remain visible in reporting.",
  },
  {
    id: "dissent",
    term: "Dissent",
    plain: "Dissent means a different view or disagreement.",
    technical: "Dissent and uncertainty are retained as part of methodological transparency.",
  },
  {
    id: "withdrawal",
    term: "Withdrawal",
    plain: "Withdrawal means choosing to stop future participation.",
    technical: "Prior submitted responses may remain in historical or aggregated data depending on the study protocol and consent terms.",
  },
  {
    id: "voluntary-participation",
    term: "Voluntary participation",
    plain: "Participation is your choice.",
    technical: "Participants may stop future participation without penalty, subject to the approved consent and retention process.",
  },
  {
    id: "ai-suggestion",
    term: "AI suggestion",
    plain: "An AI suggestion is draft help for researchers, not a decision.",
    technical: "AI Suggestion (Not Final) outputs require human accept, edit, or reject action before affecting study content.",
  },
  {
    id: "human-review",
    term: "Human review",
    plain: "A person on the study team checks and approves content before it is used.",
    technical: "Participant-facing AI-assisted content requires explicit human review and signoff under the governance rules.",
  },
  {
    id: "provenance",
    term: "Provenance",
    plain: "Provenance explains where an item came from.",
    technical: "Provenance links raw anonymized responses, clusters, AI suggestions, human edits, and final wording.",
  },
  {
    id: "audit-trail",
    term: "Audit trail",
    plain: "An audit trail records important actions so they can be reviewed later.",
    technical: "Audit logs include signoffs, exports, AI operations, status changes, and sensitive actions without exposing unnecessary secrets.",
  },
  {
    id: "data-retention",
    term: "Data retention",
    plain: "Data retention means how long study records are kept.",
    technical: "Retention follows the study protocol, consent terms, and governance settings.",
  },
  {
    id: "participant-id",
    term: "Participant ID",
    plain: "A participant ID lets the research team connect your study activity across rounds without showing your name to other participants.",
    technical: "Participant IDs support longitudinal linkage while keeping identity records separate from response records where feasible.",
  },
  {
    id: "identity-response-mapping",
    term: "Identity-response mapping",
    plain: "Identity-response mapping is the link between a participant's identity and their study responses.",
    technical: "Access to this mapping is restricted because it is sensitive human-subjects research information.",
  },
  {
    id: "redaction",
    term: "Redaction",
    plain: "Redaction means removing or replacing details that could identify someone.",
    technical: "Redaction may remove names, emails, organizations, locations, or rare contextual details before exports or summaries are shared.",
  },
  {
    id: "irb-ethics",
    term: "IRB / ethics review",
    plain: "Ethics review checks that the study protects participants.",
    technical: "IRB or ethics materials may include protocol, consent, confidentiality, AI disclosure, retention, safeguards, and signoff history.",
  },
  {
    id: "export-package",
    term: "Export package",
    plain: "An export package is a governed set of study output files.",
    technical: "Export packages include manifests, hashes, review status, redaction status, and required disclosures.",
  },
  {
    id: "governance-signoff",
    term: "Governance signoff",
    plain: "Governance signoff means required study roles have reviewed and approved key safeguards before launch.",
    technical: "Signoff gates can cover method rules, consent, confidentiality, AI disclosure, retention, feedback, and launch readiness.",
  },
  {
    id: "study-owner",
    term: "Study Owner",
    plain: "The Study Owner is responsible for running the study under the approved protocol.",
    technical: "This role may configure studies, request signoffs, open rounds, and review outputs subject to backend authorization.",
  },
  {
    id: "ethics-methods-steward",
    term: "Ethics & Methods Steward",
    plain: "The Ethics & Methods Steward reviews whether the study protects participants and follows the method.",
    technical: "This role helps verify consent language, feedback neutrality, AI governance, reporting limits, and signoff readiness.",
  },
  {
    id: "no-external-ai-mode",
    term: "No External AI mode",
    plain: "No External AI mode means the study is configured so study data is not sent to external AI services.",
    technical: "External AI calls are blocked server-side when this mode is active.",
  },
  {
    id: "ai-connector",
    term: "AI connector",
    plain: "An AI connector is a study setting for whether an external AI provider may be used.",
    technical: "Provider, model, feature permissions, API key state, disclosures, and human review rules are governed per study.",
  },
];

export const inlineHelp = {
  median: glossaryTerms.find((term) => term.id === "median")!.plain,
  iqr: glossaryTerms.find((term) => term.id === "iqr")!.plain,
  groupSummary: glossaryTerms.find((term) => term.id === "group-summary")!.plain,
  consensusThreshold: glossaryTerms.find((term) => term.id === "consensus-threshold")!.plain,
  consensus: glossaryTerms.find((term) => term.id === "consensus")!.plain,
  nonConsensus: glossaryTerms.find((term) => term.id === "non-consensus")!.plain,
  round: glossaryTerms.find((term) => term.id === "round")!.plain,
  anonymityConfidentiality: glossaryTerms.find((term) => term.id === "anonymity-confidentiality")!.plain,
  priorResponse: glossaryTerms.find((term) => term.id === "participant-prior-response")!.plain,
};

export const platformAboutSections: AboutSection[] = [
  {
    title: "What Delphi Commons is",
    body:
      "Delphi Commons is an open-source platform for designing, conducting, analyzing, and reporting Delphi studies with clear consent, neutral feedback, audit trails, and transparent limits.",
  },
  {
    title: "What Delphi Commons is not",
    body:
      "It is not a voting machine, a proof engine, or a tool for pushing participants to conform. Delphi consensus is structured agreement among a panel, not proof of truth.",
  },
  {
    title: "Participant protections",
    body:
      "The platform is designed around voluntariness, confidentiality, honest anonymity limits, dissent preservation, data minimization, accessibility, and visible study methods.",
  },
  {
    title: "AI boundaries",
    body:
      "If AI is enabled, it may assist researchers with drafting or organizing. AI does not decide outcomes, determine consensus, replace researchers, or tell participants what to answer. Humans review participant-facing study content.",
  },
];

export const tutorialSteps = [
  {
    title: "You'll answer questions in multiple rounds.",
    body: "Round 1 usually asks for your independent ideas or concerns.",
  },
  {
    title: "You'll see summaries of group responses.",
    body: "Fictional example only: participants mentioned clarity, fairness, feasibility, and cost.",
  },
  {
    title: "You can revise or keep your answer.",
    body: "Seeing a summary gives context. It does not tell you what to answer.",
  },
  {
    title: "Different opinions are valuable.",
    body: "Agreement, uncertainty, and disagreement all help the study team understand the topic.",
  },
  {
    title: "Let's begin.",
    body: "Continue when you understand the study process and your choices.",
  },
] as const;

export function roundReminder(roundNumber: number): string {
  if (roundNumber <= 1) return "You are giving your independent judgment. There are no correct answers.";
  return "You are seeing anonymized summaries from the previous round. You may keep or revise your response. There is no correct answer.";
}

export function consensusReminder(): string {
  return "Consensus means agreement among this panel under this study's rule. It does not establish correctness.";
}

export function aiOrientationText(input: { externalAiEnabled?: boolean; noExternalAiMode?: boolean } | null | undefined): string {
  if (input?.externalAiEnabled && !input.noExternalAiMode) {
    return "AI may assist researchers in organizing, grouping, summarizing, or drafting materials. AI does not decide outcomes, determine consensus, or tell participants what to answer. Humans review participant-facing study content before use.";
  }
  return "AI assistance is not being used for this study's participant-facing process based on the current study configuration.";
}

export function studyOrientationFacts(input: {
  title: string;
  wizard: StudyWizardState;
  aiText: string;
}) {
  return [
    {
      title: "What Delphi is",
      body:
        "A Delphi study is a multi-round expert or stakeholder process. Participants answer questions over rounds, and structured feedback may be shared between rounds to explore agreement and disagreement.",
    },
    {
      title: "What will happen in this study",
      body: `${input.title} is planned for ${input.wizard.plannedRoundCount} rounds. Round 1 asks for open-ended input. Later rounds may ask you to rate or review candidate statements and may show group summaries.`,
    },
    {
      title: "What consensus means",
      body: `Consensus means agreement among this study's panel under its predefined rule, such as ${input.wizard.consensusThreshold}% agreement. It does not establish correctness, and it does not require everyone to agree.`,
    },
    {
      title: "Your role",
      body:
        "Please provide your independent judgment. Do not try to match others. In later rounds, retaining your answer and revising your answer are both legitimate choices.",
    },
    {
      title: "Anonymity and confidentiality",
      body:
        "Other participants will not see your identity. The research team may need to link your responses across rounds using participant IDs, so this is confidentiality to the research team rather than absolute anonymity.",
    },
    {
      title: "Voluntary participation",
      body: input.wizard.withdrawalProcess,
    },
    {
      title: "AI disclosure",
      body: input.aiText,
    },
  ];
}
