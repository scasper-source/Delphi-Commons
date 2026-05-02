import { createZip } from "../core/zip.js";

export type FinalItemResultRow = Record<string, unknown>;

type RenderFinalReportInput = {
  report: Record<string, unknown>;
  itemResults: FinalItemResultRow[];
  limitationsMarkdown: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function xml(value: unknown): string {
  return asText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function paragraph(text: string, style?: "Title" | "Heading1" | "Heading2"): string {
  const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
  return `<w:p>${styleXml}<w:r><w:t xml:space="preserve">${xml(text)}</w:t></w:r></w:p>`;
}

function table(rows: string[][]): string {
  const rowXml = rows.map((row) => (
    `<w:tr>${row.map((cell) => `<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr>${paragraph(cell)}</w:tc>`).join("")}</w:tr>`
  )).join("");

  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="C8D6D2"/><w:left w:val="single" w:sz="4" w:space="0" w:color="C8D6D2"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="C8D6D2"/><w:right w:val="single" w:sz="4" w:space="0" w:color="C8D6D2"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="C8D6D2"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="C8D6D2"/></w:tblBorders></w:tblPr>${rowXml}</w:tbl>`;
}

function docxStyles(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:rPr><w:b/><w:sz w:val="34"/><w:szCs w:val="34"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:rPr><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
  </w:style>
</w:styles>`;
}

export function renderFinalDelphiReportDocx(input: RenderFinalReportInput): Buffer {
  const study = asRecord(input.report.study);
  const studyVersion = asRecord(input.report.study_version);
  const summary = asRecord(input.report.summary);
  const methods = asRecord(input.report.methods);
  const preRoundConsensusInput = asRecord(methods.pre_round_consensus_input);
  const limitations = Array.isArray(input.report.limitations) ? input.report.limitations.map((entry) => asText(entry)) : [];

  const title = asText(study.title, "Final Delphi Report");
  const rows: string[][] = [
    ["Study format", asText(summary.study_format)],
    ["Planned rounds", asText(summary.planned_round_count)],
    ["Final round", asText(summary.final_round_number)],
    ["Consensus items", asText(summary.consensus_item_count)],
    ["Non-consensus items", asText(summary.non_consensus_item_count)],
    ["Undetermined items", asText(summary.undetermined_item_count)],
    ["Consensus rule source", asText(methods.consensus_rule_source_label)],
    ["Pre-round input status", asText(preRoundConsensusInput.status, "not_required")],
  ];

  const itemRows = input.itemResults.map((row) => [
    asText(row.item_id),
    asText(row.consensus_status),
    asText(row.median),
    asText(row.iqr),
    asText(row.percent_agree),
    asText(row.item_text),
  ]);

  const body = [
    paragraph(title, "Title"),
    paragraph("Final Delphi Report", "Heading1"),
    paragraph("Consensus indicates agreement among this panel; it does not establish correctness."),
    paragraph("Study Purpose", "Heading1"),
    paragraph(asText(study.description, "Study purpose was not provided in the structured record.")),
    paragraph("Method Configuration", "Heading1"),
    table(rows),
    paragraph("Consensus Rule", "Heading2"),
    paragraph(JSON.stringify(studyVersion.consensus_rule_json ?? methods.consensus_definition ?? {}, null, 2)),
    paragraph("Consensus Setting Process", "Heading2"),
    paragraph(asText(methods.consensus_setting_process)),
    paragraph(
      preRoundConsensusInput.counts_as_delphi_round === true
        ? "Pre-round consensus input was counted as a Delphi round."
        : "Pre-round consensus input was not counted as a Delphi round.",
    ),
    paragraph("Results", "Heading1"),
    table([["Item ID", "Classification", "Median", "IQR", "Percent agree", "Item text"], ...itemRows]),
    paragraph("Limitations and Disclosures", "Heading1"),
    ...limitations.map((entry) => paragraph(entry)),
    paragraph("Structured Disclosure Source", "Heading2"),
    ...input.limitationsMarkdown.split(/\r?\n/).filter(Boolean).map((line) => paragraph(line)),
  ].join("");

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${body}
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;

  return createZip([
    {
      path: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`,
    },
    {
      path: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`,
    },
    {
      path: "word/document.xml",
      content: document,
    },
    {
      path: "word/styles.xml",
      content: docxStyles(),
    },
    {
      path: "docProps/core.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${xml(title)}</dc:title>
  <dc:subject>Final Delphi Report</dc:subject>
  <dcterms:created xsi:type="dcterms:W3CDTF">${xml(asText(input.report.generated_at, new Date().toISOString()))}</dcterms:created>
</cp:coreProperties>`,
    },
  ]);
}

function columnName(index: number): string {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function worksheet(rows: unknown[][]): string {
  const rowXml = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
      if (typeof value === "number" && Number.isFinite(value)) {
        return `<c r="${ref}"><v>${value}</v></c>`;
      }
      if (typeof value === "boolean") {
        return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`;
      }
      return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rowXml}</sheetData>
</worksheet>`;
}

export function renderFinalItemResultsXlsx(input: RenderFinalReportInput): Buffer {
  const study = asRecord(input.report.study);
  const summary = asRecord(input.report.summary);
  const methods = asRecord(input.report.methods);
  const preRoundConsensusInput = asRecord(methods.pre_round_consensus_input);
  const headers = Object.keys(input.itemResults[0] ?? {
    study_id: "",
    study_version_id: "",
    item_id: "",
    item_text: "",
    consensus_status: "",
  });

  const studySummaryRows: unknown[][] = [
    ["Field", "Value"],
    ["Study title", asText(study.title)],
    ["Generated at", asText(input.report.generated_at)],
    ["Study format", asText(summary.study_format)],
    ["Planned rounds", summary.planned_round_count ?? ""],
    ["Final round", summary.final_round_number ?? ""],
    ["Consensus items", summary.consensus_item_count ?? ""],
    ["Non-consensus items", summary.non_consensus_item_count ?? ""],
    ["Consensus rule source", asText(methods.consensus_rule_source_label)],
    ["Consensus setting process", asText(methods.consensus_setting_process)],
    ["Pre-round consensus input status", asText(preRoundConsensusInput.status, "not_required")],
    ["Pre-round input counts as Delphi round", asText(preRoundConsensusInput.counts_as_delphi_round, "false")],
    ["Required statement", "Consensus indicates agreement among this panel; it does not establish correctness."],
  ];

  const itemResultRows: unknown[][] = [
    headers,
    ...input.itemResults.map((row) => headers.map((header) => row[header] ?? "")),
  ];

  const limitationRows: unknown[][] = [
    ["Limitations and disclosures"],
    ...input.limitationsMarkdown.split(/\r?\n/).map((line) => [line]),
  ];

  return createZip([
    {
      path: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`,
    },
    {
      path: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`,
    },
    {
      path: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Study Summary" sheetId="1" r:id="rId1"/>
    <sheet name="Item Results" sheetId="2" r:id="rId2"/>
    <sheet name="Limitations" sheetId="3" r:id="rId3"/>
  </sheets>
</workbook>`,
    },
    {
      path: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
</Relationships>`,
    },
    {
      path: "xl/worksheets/sheet1.xml",
      content: worksheet(studySummaryRows),
    },
    {
      path: "xl/worksheets/sheet2.xml",
      content: worksheet(itemResultRows),
    },
    {
      path: "xl/worksheets/sheet3.xml",
      content: worksheet(limitationRows),
    },
    {
      path: "docProps/core.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${xml(asText(study.title, "Final Delphi Report"))}</dc:title>
  <dc:subject>Final item results workbook</dc:subject>
  <dcterms:created xsi:type="dcterms:W3CDTF">${xml(asText(input.report.generated_at, new Date().toISOString()))}</dcterms:created>
</cp:coreProperties>`,
    },
  ]);
}
