import { readFileSync } from "node:fs";

export type CitationCreator = {
  name: string;
  familyName: string;
  givenName: string;
  apaName: string;
};

export type CitationMetadata = {
  title: string;
  version: string;
  type: "Software";
  year: number;
  creators: CitationCreator[];
  repositoryUrl: string;
  projectUrl: string;
  doi: string | null;
};

export const citationFraming =
  "If this tool contributed to study design, data collection, analysis, reporting, or reproducible documentation, please cite it to support transparency and reproducibility.";

const repositoryUrl = "https://github.com/YOUR_ORG/YOUR_REPO"; // TODO: replace after the public repository URL is assigned.

function readPackageVersion(): string | null {
  try {
    const packageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as { version?: unknown };
    return typeof packageJson.version === "string" && packageJson.version.trim() ? packageJson.version.trim() : null;
  } catch {
    return null;
  }
}

export function resolveSoftwareVersion(): string {
  return readPackageVersion() ?? process.env.APP_VERSION ?? process.env.VITE_APP_VERSION ?? "development";
}

export function citationMetadata(input: Partial<CitationMetadata> = {}): CitationMetadata {
  const now = new Date();
  return {
    title: "eDelphi Platform",
    version: resolveSoftwareVersion(),
    type: "Software",
    year: now.getFullYear(),
    creators: [
      {
        name: "Casper, Stephen T.",
        familyName: "Casper",
        givenName: "Stephen T.",
        apaName: "Casper, S. T.",
      },
    ],
    repositoryUrl,
    projectUrl: repositoryUrl,
    doi: null,
    ...input,
  };
}

function primaryCreator(metadata: CitationMetadata): CitationCreator {
  return metadata.creators[0] ?? {
    name: "Casper, Stephen T.",
    familyName: "Casper",
    givenName: "Stephen T.",
    apaName: "Casper, S. T.",
  };
}

function doiOrUrl(metadata: CitationMetadata): string {
  return metadata.doi ? `https://doi.org/${metadata.doi}` : metadata.repositoryUrl;
}

export function buildPreferredCitation(metadata: CitationMetadata = citationMetadata()): string {
  const creator = primaryCreator(metadata);
  const locator = metadata.doi ? metadata.doi : `Available at: ${metadata.repositoryUrl}`;
  return `${creator.name} (${metadata.year}). ${metadata.title} (Version ${metadata.version}) [Software]. ${locator}`;
}

export function buildApaCitation(metadata: CitationMetadata = citationMetadata()): string {
  const creator = primaryCreator(metadata);
  return `${creator.apaName} (${metadata.year}). ${metadata.title} (Version ${metadata.version}) [Software]. ${doiOrUrl(metadata)}`;
}

export function buildChicagoCitation(metadata: CitationMetadata = citationMetadata()): string {
  const creator = primaryCreator(metadata);
  return `${creator.name} ${metadata.title}. Version ${metadata.version}. Software. ${metadata.year}. ${doiOrUrl(metadata)}.`;
}

export function buildMlaCitation(metadata: CitationMetadata = citationMetadata()): string {
  const creator = primaryCreator(metadata);
  return `${creator.name} ${metadata.title}. Version ${metadata.version}, ${metadata.year}, ${doiOrUrl(metadata)}.`;
}

export function buildBibtexCitation(metadata: CitationMetadata = citationMetadata()): string {
  const doiLine = metadata.doi ? `\n  doi = {${metadata.doi}},` : "";
  return `@software{casper_edelphi_${metadata.year},
  author = {Casper, Stephen T.},
  title = {${metadata.title}},
  year = {${metadata.year}},
  version = {${metadata.version}},
  url = {${metadata.repositoryUrl}},${doiLine}
  note = {Software}
}`;
}

export function buildCitationMarkdown(input: {
  metadata?: CitationMetadata;
  generatedAt?: Date | string;
  accessDate?: Date | string;
} = {}): string {
  const metadata = input.metadata ?? citationMetadata();
  const generatedAt = input.generatedAt ? new Date(input.generatedAt) : new Date();
  const accessDate = input.accessDate ? new Date(input.accessDate) : generatedAt;
  const generatedDate = generatedAt.toISOString().slice(0, 10);
  const accessDateText = accessDate.toISOString().slice(0, 10);
  const doiText = metadata.doi ? metadata.doi : "Not assigned for this release.";

  return [
    "# How to Cite This Tool",
    "",
    citationFraming,
    "",
    "## Preferred Citation",
    "",
    buildPreferredCitation(metadata),
    "",
    "## APA",
    "",
    buildApaCitation(metadata),
    "",
    "## Chicago",
    "",
    buildChicagoCitation(metadata),
    "",
    "## MLA",
    "",
    buildMlaCitation(metadata),
    "",
    "## BibTeX",
    "",
    "```bibtex",
    buildBibtexCitation(metadata),
    "```",
    "",
    "## Version and Access Information",
    "",
    `- Software version: ${metadata.version}`,
    `- Citation generated on: ${generatedDate}`,
    `- Access date: ${accessDateText}`,
    `- Repository URL: ${metadata.repositoryUrl}`,
    `- DOI: ${doiText}`,
  ].join("\n");
}
