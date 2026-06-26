/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import { platformAboutSections } from "../content/orientation";
import {
  buildBibtexCitation,
  buildPreferredCitation,
  citationFraming,
  citationMetadata,
} from "../content/citation";
import { WarningBanner } from "../components/ui/Primitives";

export function AboutScreen() {
  return (
    <div className="screen-grid">
      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">About the platform</span>
          <h2>Delphi Commons protects method, participants, and interpretation</h2>
        </div>
        <div className="orientation-fact-grid">
          {platformAboutSections.map((section) => (
            <article className="orientation-fact" key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Consensus Is Limited</h3>
        <p>
          Delphi consensus is structured expert or stakeholder agreement under a predefined rule. It preserves uncertainty,
          dissent, non-consensus, attrition, and methodological limits.
        </p>
        <WarningBanner title="Required interpretation" risk="info">
          Consensus indicates agreement among this panel; it does not establish correctness.
        </WarningBanner>
      </section>

      <section className="panel">
        <h3>AI Is Governed</h3>
        <p>
          AI may be configured as drafting or organizing assistance only. AI suggestions are non-final, require human review,
          and must never tell participants what to answer.
        </p>
      </section>

      <section className="panel wide" id="how-to-cite-this-tool">
        <div className="section-heading">
          <span className="eyebrow">Citation guidance</span>
          <h3>How to Cite This Tool</h3>
        </div>
        <p>{citationFraming}</p>
        <div className="citation-grid">
          <article className="orientation-fact">
            <h4>Preferred citation</h4>
            <p>{buildPreferredCitation()}</p>
          </article>
          <article className="orientation-fact">
            <h4>BibTeX</h4>
            <pre className="citation-code">{buildBibtexCitation()}</pre>
          </article>
        </div>
        <p className="microcopy">
          Software version: {citationMetadata.version}. DOI: {citationMetadata.doi ?? "Not assigned for this release."}
        </p>
        <p className="microcopy">
          Citing this tool supports transparency and reproducibility; it does not validate study findings or imply platform
          endorsement of a study's conclusions.
        </p>
      </section>
    </div>
  );
}
