/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

export const citationFraming =
  "If this tool contributed to study design, data collection, analysis, reporting, or reproducible documentation, please cite it to support transparency and reproducibility.";

export const citationMetadata = {
  title: "eDelphi Platform",
  version: import.meta.env.VITE_APP_VERSION ?? "1.0.0",
  year: new Date().getFullYear(),
  creator: "Casper, Stephen T.",
  apaCreator: "Casper, S. T.",
  repositoryUrl: "https://github.com/YOUR_ORG/YOUR_REPO", // TODO: replace after the public repository URL is assigned.
  doi: null as string | null,
};

export function buildPreferredCitation() {
  const locator = citationMetadata.doi ? citationMetadata.doi : `Available at: ${citationMetadata.repositoryUrl}`;
  return `${citationMetadata.creator} (${citationMetadata.year}). ${citationMetadata.title} (Version ${citationMetadata.version}) [Software]. ${locator}`;
}

export function buildBibtexCitation() {
  return `@software{casper_edelphi_${citationMetadata.year},
  author = {Casper, Stephen T.},
  title = {${citationMetadata.title}},
  year = {${citationMetadata.year}},
  version = {${citationMetadata.version}},
  url = {${citationMetadata.repositoryUrl}},
  note = {Software}
}`;
}
