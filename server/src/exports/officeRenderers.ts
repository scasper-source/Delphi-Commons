import { createZip } from "../core/officeZip.js";

type FinalReportDocxInput = {
  title: string;
  purpose: string;
  methodRationale: string;
  panelCriteria: string;
  recruitmentDescription: string;
  finalRoundNumber: number;
  responseSummary: string;
  consensusRule: string;
  limitations: string[];
  itemRows: Array<Record<string, unknown>>;
};

type WorkbookSheet = {
  name: string;
  rows: unknown[][];
};

function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function paragraph(text: unknown, style?: string): string {
  const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
  return `<w:p>${styleXml}<w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function docxContentTypes(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
}

function docxRelationships(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
}

function docxStyles(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:pPr><w:spacing w:after="240"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:pPr><w:spacing w:before="180" w:after="80"/></w:pPr></w:style>
</w:styles>`;
}

function docxTable(rows: unknown[][]): string {
  const tableRows = rows.map((row, rowIndex) => {
    const cells = row.map((cell) => `
      <w:tc>
        <w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr>
        <w:p><w:r>${rowIndex === 0 ? "<w:b/>" : ""}<w:t xml:space="preserve">${escapeXml(cell)}</w:t></w:r></w:p>
      </w:tc>`).join("");
    return `<w:tr>${cells}</w:tr>`;
  }).join("");

  return `<w:tbl>
    <w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>
      <w:top w:val="single" w:sz="4" w:space="0" w:color="B7C8C2"/>
      <w:left w:val="single" w:sz="4" w:space="0" w:color="B7C8C2"/>
      <w:bottom w:val="single" w:sz="4" w:space="0" w:color="B7C8C2"/>
      <w:right w:val="single" w:sz="4" w:space="0" w:color="B7C8C2"/>
      <w:insideH w:val="single" w:sz="4" w:space="0" w:color="D7E1DD"/>
      <w:insideV w:val="single" w:sz="4" w:space="0" w:color="D7E1DD"/>
    </w:tblBorders></w:tblPr>
    ${tableRows}
  </w:tbl>`;
}

export function renderFinalReportDocx(input: FinalReportDocxInput): Buffer {
  const topItems = input.itemRows.slice(0, 20).map((row) => [
    row.item_id,
    row.consensus_status,
    row.median,
    row.iqr,
    row.item_text,
  ]);

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraph(input.title, "Title")}
    ${paragraph("Final Delphi Report", "Heading1")}
    ${paragraph("Consensus indicates agreement among this panel; it does not establish correctness.")}
    ${paragraph("Study Purpose", "Heading1")}
    ${paragraph(input.purpose)}
    ${paragraph("Why Delphi Was Appropriate", "Heading1")}
    ${paragraph(input.methodRationale)}
    ${paragraph("Panel Definition and Recruitment", "Heading1")}
    ${paragraph(`Panel criteria: ${input.panelCriteria}`)}
    ${paragraph(`Recruitment description: ${input.recruitmentDescription}`)}
    ${paragraph("Round Structure and Response Summary", "Heading1")}
    ${paragraph(`Final summarized round: Round ${input.finalRoundNumber}. ${input.responseSummary}`)}
    ${paragraph("Consensus Rule and Statistical Methods", "Heading1")}
    ${paragraph(input.consensusRule)}
    ${paragraph("Item Results", "Heading1")}
    ${docxTable([["Item ID", "Status", "Median", "IQR", "Item text"], ...topItems])}
    ${paragraph("Limitations", "Heading1")}
    ${input.limitations.map((limit) => paragraph(limit)).join("")}
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/></w:sectPr>
  </w:body>
</w:document>`;

  return createZip([
    { path: "[Content_Types].xml", data: Buffer.from(docxContentTypes(), "utf8") },
    { path: "_rels/.rels", data: Buffer.from(docxRelationships(), "utf8") },
    { path: "word/document.xml", data: Buffer.from(documentXml, "utf8") },
    { path: "word/styles.xml", data: Buffer.from(docxStyles(), "utf8") },
  ]);
}

function columnName(index: number): string {
  let name = "";
  let n = index + 1;
  while (n > 0) {
    const mod = (n - 1) % 26;
    name = String.fromCharCode(65 + mod) + name;
    n = Math.floor((n - mod) / 26);
  }
  return name;
}

function sheetXml(sheet: WorkbookSheet): string {
  const rows = sheet.rows.map((row, rowIndex) => {
    const cells = row.map((cell, columnIndex) => {
      const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
      if (typeof cell === "number" && Number.isFinite(cell)) {
        return `<c r="${ref}"><v>${cell}</v></c>`;
      }
      return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(cell)}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rows}</sheetData>
</worksheet>`;
}

function workbookXml(sheets: WorkbookSheet[]): string {
  const sheetEntries = sheets.map((sheet, index) =>
    `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheetEntries}</sheets>
</workbook>`;
}

function workbookRelationships(sheets: WorkbookSheet[]): string {
  const relationships = sheets.map((_, index) =>
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships}</Relationships>`;
}

function xlsxContentTypes(sheets: WorkbookSheet[]): string {
  const worksheets = sheets.map((_, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${worksheets}
</Types>`;
}

function xlsxRelationships(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

export function renderWorkbookXlsx(sheets: WorkbookSheet[]): Buffer {
  const entries = [
    { path: "[Content_Types].xml", data: Buffer.from(xlsxContentTypes(sheets), "utf8") },
    { path: "_rels/.rels", data: Buffer.from(xlsxRelationships(), "utf8") },
    { path: "xl/workbook.xml", data: Buffer.from(workbookXml(sheets), "utf8") },
    { path: "xl/_rels/workbook.xml.rels", data: Buffer.from(workbookRelationships(sheets), "utf8") },
    ...sheets.map((sheet, index) => ({
      path: `xl/worksheets/sheet${index + 1}.xml`,
      data: Buffer.from(sheetXml(sheet), "utf8"),
    })),
  ];
  return createZip(entries);
}
