/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import { containsForbiddenParticipantLanguage } from "../policies/governance";
import { WarningBanner } from "../components/ui/Primitives";

export function FeedbackScreen() {
  const participantFacingCopy =
    "Review the group summary, median, IQR, distribution, and your prior response. You may retain response or revise response.";
  const hasForbiddenLanguage = containsForbiddenParticipantLanguage(participantFacingCopy);

  return (
    <div className="screen-grid">
      <section className="panel">
        <h3>Controlled Feedback Configuration</h3>
        <WarningBanner title="Neutral participant language" risk={hasForbiddenLanguage ? "danger" : "success"}>
          {participantFacingCopy}
        </WarningBanner>
        <div className="feedback-options">
          {["Median", "IQR / dispersion", "Distribution", "Your prior response", "Retain response", "Revise response"].map((option) => (
            <span className="option-pill" key={option}>{option}</span>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Example Group Summary</h3>
        <div className="distribution">
          {[1, 2, 4, 7, 9, 6, 3].map((height, index) => (
            <span key={`${height}-${index}`} style={{ height: `${height * 12}px` }} />
          ))}
        </div>
        <dl className="detail-list">
          <div>
            <dt>Median</dt>
            <dd>8</dd>
          </div>
          <div>
            <dt>IQR</dt>
            <dd>2</dd>
          </div>
          <div>
            <dt>Your prior response</dt>
            <dd>7, revise response</dd>
          </div>
        </dl>
      </section>

      <section className="panel wide">
        <h3>Method Guardrail</h3>
        <p className="callout-text">
          Controlled feedback summarizes this panel's responses. It does not define correctness and should not pressure any panelist to change a response.
        </p>
      </section>
    </div>
  );
}
