/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import { useState } from "react";
import { glossaryTerms } from "../content/orientation";

export function GlossaryScreen() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const visibleTerms = glossaryTerms.filter((entry) => {
    if (!normalized) return true;
    return [entry.term, entry.plain, entry.technical, ...(entry.aliases ?? [])]
      .some((value) => value.toLowerCase().includes(normalized));
  });

  return (
    <div className="screen-grid">
      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Glossary</span>
          <h2>Plain-language Delphi, ethics, AI, and reporting terms</h2>
        </div>
        <label className="field wide-field glossary-search">
          <span>Search terms</span>
          <input
            aria-label="Search glossary terms"
            placeholder="Search consensus, IQR, confidentiality, AI suggestion..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </section>

      <section className="glossary-grid wide" aria-live="polite">
        {visibleTerms.map((entry) => (
          <article className="panel glossary-term" key={entry.id}>
            <h3>{entry.term}</h3>
            <p>{entry.plain}</p>
            <small>{entry.technical}</small>
          </article>
        ))}
      </section>
    </div>
  );
}
