/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import { useState } from "react";
import type { ParticipantInvitationContext } from "../core/api";
import type { StudyWizardState } from "../core/studyWizard";
import { WarningBanner } from "../components/ui/Primitives";
import {
  aiOrientationText,
  orientationContentVersion,
  studyOrientationFacts,
  tutorialSteps,
} from "../content/orientation";

export function ParticipantOrientationPanel({
  title,
  wizard,
  participantInvite,
  participantBusy,
  onComplete,
}: {
  title: string;
  wizard: StudyWizardState;
  participantInvite: ParticipantInvitationContext | null;
  participantBusy: boolean;
  onComplete: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const aiText = aiOrientationText({
    externalAiEnabled: wizard.aiEnabled,
    noExternalAiMode: !wizard.aiEnabled,
  });
  const facts = studyOrientationFacts({ title, wizard, aiText });
  const activeStep = tutorialSteps[stepIndex];
  const completed = participantInvite?.orientation_completion;

  return (
    <section className="orientation-panel" aria-labelledby="participant-orientation-title">
      <div className="section-heading">
        <span className="eyebrow">Required orientation</span>
        <h3 id="participant-orientation-title">Before Round 1, review how this Delphi study works</h3>
      </div>
      <WarningBanner title="Orientation supplements consent" risk="info">
        This short orientation helps explain the study process. It does not replace the consent information or your rights.
      </WarningBanner>

      <div className="orientation-fact-grid">
        {facts.map((fact) => (
          <article className="orientation-fact" key={fact.title}>
            <h4>{fact.title}</h4>
            <p>{fact.body}</p>
          </article>
        ))}
      </div>

      <div className="tutorial-card" aria-live="polite">
        <span className="eyebrow">60-90 second tutorial</span>
        <h4>{activeStep.title}</h4>
        <p>{activeStep.body}</p>
        <div className="tutorial-example">
          <strong>Fictional example only</strong>
          <p>Round 1: What matters most for a good policy?</p>
          <p>Group summary: Participants mentioned clarity, fairness, feasibility, and cost.</p>
          <p>Round 2: You may keep your view or update it after seeing the summary.</p>
        </div>
        <div className="tutorial-progress" aria-label={`Tutorial step ${stepIndex + 1} of ${tutorialSteps.length}`}>
          {tutorialSteps.map((step, index) => (
            <span className={index === stepIndex ? "active" : ""} key={step.title} />
          ))}
        </div>
        <div className="action-row">
          <button
            className="secondary-button"
            disabled={stepIndex === 0 || participantBusy}
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            type="button"
          >
            Previous
          </button>
          {stepIndex < tutorialSteps.length - 1 ? (
            <button
              className="primary-button"
              disabled={participantBusy}
              onClick={() => setStepIndex((current) => Math.min(tutorialSteps.length - 1, current + 1))}
              type="button"
            >
              Next
            </button>
          ) : (
            <button className="primary-button" disabled={participantBusy || Boolean(completed)} onClick={onComplete} type="button">
              {participantBusy ? "Saving..." : completed ? "Orientation completed" : "I understand and am ready to continue"}
            </button>
          )}
        </div>
      </div>
      <small>Orientation content version: {orientationContentVersion}</small>
    </section>
  );
}
