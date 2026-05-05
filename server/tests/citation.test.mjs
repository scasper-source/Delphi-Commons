/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import test from "node:test";
import assert from "node:assert/strict";

const {
  buildApaCitation,
  buildBibtexCitation,
  buildChicagoCitation,
  buildCitationMarkdown,
  buildMlaCitation,
  buildPreferredCitation,
  citationMetadata,
} = await import("../dist/core/citation.js");

const metadata = citationMetadata({
  version: "0.10.0",
  year: 2026,
  repositoryUrl: "https://github.com/example/delphi-commons",
  projectUrl: "https://github.com/example/delphi-commons",
  doi: null,
});

test("citation builders render preferred, APA, Chicago, MLA, BibTeX, and Markdown without DOI", () => {
  assert.equal(
    buildPreferredCitation(metadata),
    "Casper, Stephen T. (2026). Delphi Commons (Version 0.10.0) [Software]. Available at: https://github.com/example/delphi-commons",
  );
  assert.equal(
    buildApaCitation(metadata),
    "Casper, S. T. (2026). Delphi Commons (Version 0.10.0) [Software]. https://github.com/example/delphi-commons",
  );
  assert.equal(
    buildChicagoCitation(metadata),
    "Casper, Stephen T. Delphi Commons. Version 0.10.0. Software. 2026. https://github.com/example/delphi-commons.",
  );
  assert.equal(
    buildMlaCitation(metadata),
    "Casper, Stephen T. Delphi Commons. Version 0.10.0, 2026, https://github.com/example/delphi-commons.",
  );
  assert.match(buildBibtexCitation(metadata), /@software\{casper_delphi_commons_2026/);
  assert.match(buildBibtexCitation(metadata), /version = \{0\.10\.0\}/);

  const markdown = buildCitationMarkdown({ metadata, generatedAt: "2026-05-04T12:00:00.000Z" });
  assert.match(markdown, /# How to Cite This Tool/);
  assert.match(markdown, /BibTeX/);
  assert.match(markdown, /Software version: 0\.10\.0/);
  assert.match(markdown, /Citation generated on: 2026-05-04/);
  assert.match(markdown, /DOI: Not assigned for this release\./);
});

test("citation builders render DOI when supplied", () => {
  const withDoi = citationMetadata({
    ...metadata,
    doi: "10.1234/delphi-commons.test",
  });
  assert.match(buildApaCitation(withDoi), /https:\/\/doi\.org\/10\.1234\/delphi-commons\.test/);
  assert.match(buildBibtexCitation(withDoi), /doi = \{10\.1234\/delphi-commons\.test\}/);
  assert.match(buildCitationMarkdown({ metadata: withDoi }), /DOI: 10\.1234\/delphi-commons\.test/);
});
