/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParticipantIssueType } from "../core/api";

export const participantCopy = {
  portal: {
    heading: "Consent, confidentiality, rights, and current task",
    confidentialityTitle: "Confidentiality",
    confidentialityBody:
      "Responses are confidential to research team members with approved access and are linked across rounds through participant IDs.",
    invitationActiveTitle: "Invitation link active",
    invitationActiveBody:
      "You do not need an account, password, API key, or access code. This private invitation link identifies your study task.",
    draftPrivacyTitle: "Save and resume",
    draftPrivacyBody:
      "Draft responses are not stored in browser local storage. Use Save progress if you need to pause, and submit when you are ready for the study team to receive your response.",
    noBackendTitle: "No active study selected",
    noBackendBody: "Open a backend study workspace to show participant tasks.",
    waitingTitle: "Waiting for study team",
    waitingBody: "The next task will appear here when the research team opens the round and configures the participant task.",
    participantRightsTitle: "Participant Rights",
    rights: [
      "Participation is voluntary.",
      "You may withdraw from future rounds at any time.",
      "Depending on the study protocol and consent terms, prior submitted responses may remain in already aggregated or historical study data.",
      "You may contact the study team about data deletion where feasible.",
      "You may skip items where permitted by the study protocol.",
      "AI assistance, if offered, is optional and non-directive.",
    ],
  },
  taskSummary: {
    whatNext: "What to do next",
    saveResume: "Save and resume",
    ratingNext: "Review each statement, choose a response, add an optional rationale if useful, then submit.",
    roundOneNext: "Read the prompt, enter your response, save if you pause, and submit when ready.",
    waitNext: "Wait for the study team to open the next task.",
    saveResumeBody: "Saving progress is separate from final submission. Submitted responses can be reviewed before you finish the task.",
  },
  trouble: {
    button: "Having trouble?",
    title: "Having trouble?",
    intro:
      "Tell the study team what is not working. Do not include medical details, passwords, API keys, or anything you would not want in a support note.",
    typeLabel: "What kind of issue is this?",
    noteLabel: "Optional note",
    pageLabel: "Page or task",
    submit: "Send issue note",
    submitting: "Sending...",
    success: "Issue note sent to the study team.",
    localOnly:
      "Issue noted locally for this mock session. Open through an invitation or secure round link to send issue notes to the study team.",
  },
} as const;

export const participantIssueTypeOptions: Array<{ value: ParticipantIssueType; label: string }> = [
  { value: "button_or_textbox_not_working", label: "A button or text box is not working" },
  { value: "cannot_start_or_continue", label: "I cannot start or continue" },
  { value: "save_or_resume_problem", label: "Save or resume problem" },
  { value: "confusing_text", label: "Something is confusing" },
  { value: "accessibility_problem", label: "Accessibility problem" },
  { value: "other", label: "Other" },
];
