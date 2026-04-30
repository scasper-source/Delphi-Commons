import type { MethodDefinition } from "../core/types";

export const methodRegistry: MethodDefinition[] = [
  {
    id: "modified-delphi",
    label: "Modified Delphi",
    status: "available",
    roundPlan: "Round 1 open-ended elicitation followed by two structured rating rounds.",
    requiredSetupFields: [
      "Documented reason for modified design",
      "Panel criteria",
      "Consent version",
      "Locked consensus threshold",
      "Controlled feedback settings",
    ],
    feedbackRules: [
      "Show group summary, median, IQR/dispersion, distribution, and your prior response.",
      "Offer retain response and revise response with equal weight.",
      "Do not frame disagreement as a defect.",
    ],
    reportingRequirements: [
      "Consensus, near-consensus, and non-consensus item tables",
      "Attrition and response-rate summary",
      "Methodological limitations",
    ],
    launchBlockers: [
      "Missing consensus rule",
      "Missing dual governance signoff",
      "Missing confidentiality and withdrawal language",
    ],
  },
  {
    id: "classic-delphi",
    label: "Classic Delphi",
    status: "available",
    roundPlan: "Round 1 open-ended elicitation followed by up to three structured rating rounds.",
    requiredSetupFields: [
      "Research question",
      "Panel criteria",
      "Recruitment plan",
      "Locked consensus threshold",
      "Round timeline",
    ],
    feedbackRules: [
      "Use neutral controlled feedback only.",
      "Preserve unique or minority statements through curation review.",
    ],
    reportingRequirements: [
      "All terminal-round item classifications",
      "Consensus threshold and justification",
      "Non-consensus and limitation sections",
    ],
    launchBlockers: [
      "Missing Round 1 elicitation plan",
      "Missing consent version",
      "Missing retention schedule",
    ],
  },
  {
    id: "policy-delphi",
    label: "Policy Delphi",
    status: "planned",
    roundPlan: "Future method model for exploring policy options and structured disagreement.",
    requiredSetupFields: ["Position framing", "Stakeholder balance", "Dissent preservation plan"],
    feedbackRules: ["Show ranges of judgment without nudging convergence."],
    reportingRequirements: ["Areas of agreement, disagreement, and unresolved tradeoffs."],
    launchBlockers: ["Policy Delphi module not enabled."],
  },
  {
    id: "real-time-delphi",
    label: "Real-Time Delphi",
    status: "planned",
    roundPlan: "Future method model for iterative participation without fixed sequential rounds.",
    requiredSetupFields: ["Iteration window", "Feedback refresh rules", "Participation cadence"],
    feedbackRules: ["Display changes over time without implying expected movement."],
    reportingRequirements: ["Iteration history, stability indicators, and attrition."],
    launchBlockers: ["Real-time Delphi module not enabled."],
  },
];
