import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { createWorker } from "tesseract.js";
import tesseractWorkerUrl from "tesseract.js/dist/worker.min.js?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export type DocumentOcrIssueSeverity = "warning" | "error";

export type DocumentOcrIssue = {
  severity: DocumentOcrIssueSeverity;
  title: string;
  description: string;
};

export type DocumentOcrBoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DocumentOcrConfidenceBand = "green" | "yellow" | "red";

export type DocumentOcrFieldSection =
  | "Personal Information"
  | "Contact Information"
  | "Address Information"
  | "Employment Information"
  | "Government Identifiers"
  | "Financial Information"
  | "Organization Information"
  | "Other Information";

export type DocumentOcrField = {
  id: string;
  key: string;
  label: string;
  value: string;
  normalizedValue: string;
  confidence: number;
  confidenceBand: DocumentOcrConfidenceBand;
  source: string;
  sourceSnippet: string;
  sourcePage: number;
  pageNumber: number;
  boundingBox: DocumentOcrBoundingBox | null;
  section: DocumentOcrFieldSection;
  fieldType: "text" | "email" | "phone" | "date" | "address" | "id" | "number" | "url";
  validationErrors: string[];
  duplicateKeys: string[];
};

export type DocumentOcrAuditEntry = {
  id: string;
  action: "detected" | "edited" | "added" | "deleted" | "merged";
  fieldId: string;
  fieldLabel: string;
  previousValue: string;
  nextValue: string;
  timestamp: string;
  note?: string;
};

export type DocumentOcrPageResult = {
  pageNumber: number;
  text: string;
  confidence: number;
  confidenceBand: DocumentOcrConfidenceBand;
  width: number;
  height: number;
  previewDataUrl: string;
  tableCount: number;
  checkboxCount: number;
  signatureCount: number;
  dates: string[];
  numericValues: string[];
};

export type DocumentOcrStructuredData = Record<string, Record<string, string>>;

export type DocumentOcrScanResult = {
  text: string;
  confidence: number;
  confidenceBand: DocumentOcrConfidenceBand;
  pageCount: number;
  pageConfidenceScore: number;
  issues: DocumentOcrIssue[];
  canSubmit: boolean;
  extractedFields: DocumentOcrField[];
  pages: DocumentOcrPageResult[];
  documentType: string;
  documentTypeConfidence: number;
  structuredData: DocumentOcrStructuredData;
  duplicates: Array<{ key: string; values: string[] }>;
  auditTrail: DocumentOcrAuditEntry[];
};

type OcrWordLike = {
  text?: string;
  confidence?: number;
  bbox?: { x0?: number; y0?: number; x1?: number; y1?: number };
};

type OcrLineLike = {
  text?: string;
  confidence?: number;
  bbox?: { x0?: number; y0?: number; x1?: number; y1?: number };
};

type ExtractedFieldDefinition = {
  key: string;
  label: string;
  section: DocumentOcrFieldSection;
  fieldType: DocumentOcrField["fieldType"];
  labelPatterns: RegExp[];
};

const emailPattern = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/;
const phonePattern = /(?:\+?63|0)\s?\d[\d\s-]{7,}\d/;
const urlPattern = /https?:\/\/[^\s)]+/i;
const datePattern = /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{2,4})\b/;
const numericPattern = /\b\d[\d,]*(?:\.\d+)?\b/g;

const fieldDefinitions: ExtractedFieldDefinition[] = [
  {
    key: "organization_name",
    label: "Organization Name",
    section: "Organization Information",
    fieldType: "text",
    labelPatterns: [/^(?:organization\s*name|name\s*of\s*organization)\s*[:\-–]?\s*(.+)$/i],
  },
  {
    key: "first_name",
    label: "First Name",
    section: "Personal Information",
    fieldType: "text",
    labelPatterns: [/^(?:first\s*name)\s*[:\-–]?\s*(.+)$/i],
  },
  {
    key: "middle_name",
    label: "Middle Name",
    section: "Personal Information",
    fieldType: "text",
    labelPatterns: [/^(?:middle\s*name)\s*[:\-–]?\s*(.+)$/i],
  },
  {
    key: "last_name",
    label: "Last Name",
    section: "Personal Information",
    fieldType: "text",
    labelPatterns: [/^(?:last\s*name|surname)\s*[:\-–]?\s*(.+)$/i],
  },
  {
    key: "date_of_birth",
    label: "Date of Birth",
    section: "Personal Information",
    fieldType: "date",
    labelPatterns: [/^(?:date\s+of\s+birth|birth\s+date)\s*[:\-–]?\s*(.+)$/i],
  },
  {
    key: "gender",
    label: "Gender",
    section: "Personal Information",
    fieldType: "text",
    labelPatterns: [/^(?:gender|sex)\s*[:\-–]?\s*(.+)$/i],
  },
  {
    key: "organization_email",
    label: "Email Address",
    section: "Contact Information",
    fieldType: "email",
    labelPatterns: [/^(?:official\s+organizational\s+email\s+address|organization\s+email\s+address|email\s+address)\s*[:\-–]?\s*(.+)$/i],
  },
  {
    key: "contact_number",
    label: "Contact Number",
    section: "Contact Information",
    fieldType: "phone",
    labelPatterns: [/^(?:contact\s+number|telephone|cellphone|mobile\s+number)\s*[:\-–]?\s*(.+)$/i],
  },
  {
    key: "website",
    label: "Website",
    section: "Contact Information",
    fieldType: "url",
    labelPatterns: [/^(?:organization\s+website|website)\s*[:\-–]?\s*(.+)$/i],
  },
  {
    key: "address",
    label: "Address",
    section: "Address Information",
    fieldType: "address",
    labelPatterns: [/^(?:complete\s+address|address|organization\s+address)\s*[:\-–]?\s*(.+)$/i],
  },
  {
    key: "barangay",
    label: "Barangay",
    section: "Address Information",
    fieldType: "address",
    labelPatterns: [/^(?:barangay|organization\s+address\s+barangay)\s*[:\-–]?\s*(.+)$/i],
  },
  {
    key: "district",
    label: "District",
    section: "Address Information",
    fieldType: "address",
    labelPatterns: [/^(?:district|organization\s+address\s+district)\s*[:\-–]?\s*(.+)$/i],
  },
  {
    key: "city",
    label: "Municipality / City",
    section: "Address Information",
    fieldType: "address",
    labelPatterns: [/^(?:municipality\s*\/?\s*city|city)\s*[:\-–]?\s*(.+)$/i],
  },
  {
    key: "position",
    label: "Position / Designation",
    section: "Employment Information",
    fieldType: "text",
    labelPatterns: [/^(?:position|designation|job\s+title)\s*[:\-–]?\s*(.+)$/i],
  },
  {
    key: "government_id",
    label: "Government ID",
    section: "Government Identifiers",
    fieldType: "id",
    labelPatterns: [/^(?:government\s+id|id\s+number|identification\s+number)\s*[:\-–]?\s*(.+)$/i],
  },
  {
    key: "amount",
    label: "Amount",
    section: "Financial Information",
    fieldType: "number",
    labelPatterns: [/^(?:amount|total\s+amount|budget)\s*[:\-–]?\s*(.+)$/i],
  },
];

const documentTypeDefinitions = [
  { type: "Organization Registration Form", patterns: [/organization registration program form/i, /\byorp\b/i, /form\s+b/i] },
  { type: "Data Request Form", patterns: [/data request form/i, /nature of request/i] },
  { type: "Constitution and By-Laws", patterns: [/constitution/i, /by-laws/i] },
  { type: "Directory of Officers and Adviser", patterns: [/officers/i, /adviser/i] },
  { type: "Members in Good Standing", patterns: [/members in good standing/i, /membership/i] },
];

const normalizeOcrLine = (value: string) => value.replace(/\s+/g, " ").trim();
const splitOcrLines = (value: string) =>
  value
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((line) => normalizeOcrLine(line))
    .filter(Boolean);

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;

const toConfidenceBand = (confidence: number): DocumentOcrConfidenceBand =>
  confidence >= 95 ? "green" : confidence >= 80 ? "yellow" : "red";

export const normalizeOcrFieldValue = (field: Pick<DocumentOcrField, "fieldType" | "value" | "label" | "key">) => {
  const trimmed = normalizeOcrLine(field.value);
  if (!trimmed) return "";

  if (field.fieldType === "email") return trimmed.toLowerCase();
  if (field.fieldType === "phone") {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.startsWith("63") && digits.length === 12) return `0${digits.slice(2)}`;
    return digits;
  }
  if (field.fieldType === "date") {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString().slice(0, 10);
  }
  if (field.fieldType === "number") return trimmed.replace(/,/g, "");
  return trimmed;
};

export const validateOcrFieldValue = (field: Pick<DocumentOcrField, "fieldType" | "value" | "label" | "key">) => {
  const value = normalizeOcrFieldValue(field);
  const errors: string[] = [];

  if (!value) {
    errors.push("Value is required.");
    return errors;
  }

  if (field.fieldType === "email" && !emailPattern.test(value)) {
    errors.push("Enter a valid email address.");
  }
  if (field.fieldType === "phone" && !/^09\d{9}$/.test(value) && !/^\+?63\d{10}$/.test(value)) {
    errors.push("Enter a valid PH mobile number.");
  }
  if (field.fieldType === "date" && Number.isNaN(new Date(value).getTime())) {
    errors.push("Enter a valid date.");
  }
  if (field.fieldType === "url") {
    try {
      new URL(value);
    } catch {
      errors.push("Enter a valid URL.");
    }
  }
  if (field.fieldType === "id" && value.length < 4) {
    errors.push("Identification number looks incomplete.");
  }

  return errors;
};

export const buildStructuredOcrData = (fields: DocumentOcrField[]): DocumentOcrStructuredData =>
  fields.reduce<DocumentOcrStructuredData>((sections, field) => {
    const sectionKey = field.section.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    if (!sections[sectionKey]) sections[sectionKey] = {};
    sections[sectionKey][field.key] = normalizeOcrFieldValue(field);
    return sections;
  }, {});

const buildSnippetFromLine = (line: string) => normalizeOcrLine(line).slice(0, 240);

const bboxFromAny = (bbox?: { x0?: number; y0?: number; x1?: number; y1?: number } | null): DocumentOcrBoundingBox | null => {
  if (!bbox) return null;
  const x0 = Number(bbox.x0 ?? 0);
  const y0 = Number(bbox.y0 ?? 0);
  const x1 = Number(bbox.x1 ?? 0);
  const y1 = Number(bbox.y1 ?? 0);
  if (!Number.isFinite(x0) || !Number.isFinite(y0) || !Number.isFinite(x1) || !Number.isFinite(y1)) return null;
  return {
    x: x0,
    y: y0,
    width: Math.max(0, x1 - x0),
    height: Math.max(0, y1 - y0),
  };
};

const inferDocumentType = (text: string) => {
  let winner = { type: "General Form", confidence: 72 };
  for (const definition of documentTypeDefinitions) {
    const hits = definition.patterns.filter((pattern) => pattern.test(text)).length;
    if (!hits) continue;
    const confidence = Math.min(99, 75 + hits * 10);
    if (confidence > winner.confidence) {
      winner = { type: definition.type, confidence };
    }
  }
  return winner;
};

const extractStandaloneMatch = (
  pageNumber: number,
  lineText: string,
  lineBox: DocumentOcrBoundingBox | null,
  key: string,
  label: string,
  section: DocumentOcrFieldSection,
  fieldType: DocumentOcrField["fieldType"],
  pattern: RegExp,
  confidence: number,
): DocumentOcrField | null => {
  const match = lineText.match(pattern);
  if (!match) return null;
  const value = normalizeOcrLine(match[1] ?? match[0]);
  if (!value) return null;
  const provisional = {
    id: createId("ocr-field"),
    key,
    label,
    value,
    normalizedValue: "",
    confidence,
    confidenceBand: toConfidenceBand(confidence),
    source: lineText,
    sourceSnippet: buildSnippetFromLine(lineText),
    sourcePage: pageNumber,
    pageNumber,
    boundingBox: lineBox,
    section,
    fieldType,
    validationErrors: [],
    duplicateKeys: [],
  } satisfies DocumentOcrField;

  return {
    ...provisional,
    normalizedValue: normalizeOcrFieldValue(provisional),
    validationErrors: validateOcrFieldValue(provisional),
  };
};

const extractFieldsFromPage = (
  pageNumber: number,
  lines: Array<{ text: string; bbox: DocumentOcrBoundingBox | null; confidence: number }>,
): DocumentOcrField[] => {
  const fields: DocumentOcrField[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const definition of fieldDefinitions) {
      for (const pattern of definition.labelPatterns) {
        const match = line.text.match(pattern);
        if (!match) continue;
        const inlineValue = normalizeOcrLine(match[1] ?? "");
        const value = inlineValue || normalizeOcrLine(lines[index + 1]?.text ?? "");
        if (!value) continue;
        const confidence = inlineValue ? 96 : 90;
        const provisional = {
          id: createId("ocr-field"),
          key: definition.key,
          label: definition.label,
          value,
          normalizedValue: "",
          confidence,
          confidenceBand: toConfidenceBand(confidence),
          source: line.text,
          sourceSnippet: buildSnippetFromLine(line.text),
          sourcePage: pageNumber,
          pageNumber,
          boundingBox: line.bbox,
          section: definition.section,
          fieldType: definition.fieldType,
          validationErrors: [],
          duplicateKeys: [],
        } satisfies DocumentOcrField;
        fields.push({
          ...provisional,
          normalizedValue: normalizeOcrFieldValue(provisional),
          validationErrors: validateOcrFieldValue(provisional),
        });
      }
    }

    const standaloneCandidates = [
      extractStandaloneMatch(pageNumber, line.text, line.bbox, "organization_email", "Email Address", "Contact Information", "email", emailPattern, 86),
      extractStandaloneMatch(pageNumber, line.text, line.bbox, "contact_number", "Contact Number", "Contact Information", "phone", phonePattern, 82),
      extractStandaloneMatch(pageNumber, line.text, line.bbox, "website", "Website", "Contact Information", "url", urlPattern, 80),
      extractStandaloneMatch(pageNumber, line.text, line.bbox, "date", "Date", "Other Information", "date", datePattern, 84),
    ].filter((field): field is DocumentOcrField => Boolean(field));

    fields.push(...standaloneCandidates);
  }

  return fields;
};

const mergeDuplicateFields = (fields: DocumentOcrField[]) => {
  const byKey = new Map<string, DocumentOcrField[]>();
  for (const field of fields) {
    const key = `${field.key}:${field.normalizedValue || field.value}`.toLowerCase();
    const list = byKey.get(key) ?? [];
    list.push(field);
    byKey.set(key, list);
  }

  const merged: DocumentOcrField[] = [];
  const duplicates: Array<{ key: string; values: string[] }> = [];
  const auditTrail: DocumentOcrAuditEntry[] = [];

  for (const group of byKey.values()) {
    const winner = [...group].sort((left, right) => {
      if (right.confidence !== left.confidence) return right.confidence - left.confidence;
      return right.value.length - left.value.length;
    })[0];

    if (group.length > 1) {
      duplicates.push({
        key: winner.key,
        values: Array.from(new Set(group.map((entry) => entry.value))),
      });
      auditTrail.push({
        id: createId("ocr-audit"),
        action: "merged",
        fieldId: winner.id,
        fieldLabel: winner.label,
        previousValue: group.map((entry) => entry.value).join(" | "),
        nextValue: winner.value,
        timestamp: new Date().toISOString(),
        note: "Duplicate values were merged automatically.",
      });
    }

    merged.push({
      ...winner,
      duplicateKeys: group.filter((entry) => entry.id !== winner.id).map((entry) => entry.id),
    });
  }

  return { merged, duplicates, auditTrail };
};

const buildIssues = (text: string, confidence: number, fields: DocumentOcrField[]) => {
  const issues: DocumentOcrIssue[] = [];
  const cleanedText = normalizeOcrLine(text);

  if (!cleanedText) {
    issues.push({
      severity: "error",
      title: "No readable text",
      description: "The OCR scan did not extract readable content. Reupload a clearer PDF file.",
    });
    return issues;
  }

  if (confidence < 90) {
    issues.push({
      severity: "error",
      title: "Confidence below threshold",
      description: "The page-level OCR confidence is below 90%. Reupload a clearer PDF before submitting.",
    });
  }

  const lowConfidenceFields = fields.filter((field) => field.confidence < 80);
  if (lowConfidenceFields.length) {
    issues.push({
      severity: "warning",
      title: "Manual review required",
      description: `${lowConfidenceFields.length} field(s) are below the 80% confidence threshold and need manual review.`,
    });
  }

  const invalidFields = fields.filter((field) => field.validationErrors.length);
  if (invalidFields.length) {
    issues.push({
      severity: "warning",
      title: "Validation issues found",
      description: `${invalidFields.length} extracted field(s) need correction before submission.`,
    });
  }

  return issues;
};

export const scanPdfForOcr = async (
  file: File,
  onProgress?: (state: { stage: "loading" | "rendering" | "ocr"; page: number; totalPages: number; progress?: number }) => void,
): Promise<DocumentOcrScanResult> => {
  const worker = await createWorker("eng", 1, {
    workerPath: tesseractWorkerUrl,
    logger: (message) => {
      if (message.status !== "recognizing text" && message.status !== "loading tesseract core" && message.status !== "initializing api") {
        return;
      }
      onProgress?.({
        stage: "ocr",
        page: 0,
        totalPages: 0,
        progress: message.progress,
      });
    },
  });

  try {
    const pdfBuffer = new Uint8Array(await file.arrayBuffer());
    const pdfDocument = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
    const pages: DocumentOcrPageResult[] = [];
    const extractedFields: DocumentOcrField[] = [];
    const pageTextParts: string[] = [];
    const pageConfidences: number[] = [];
    const detectionAuditTrail: DocumentOcrAuditEntry[] = [];

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      onProgress?.({ stage: "rendering", page: pageNumber, totalPages: pdfDocument.numPages });
      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.8 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas context is unavailable in this browser.");
      }

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      await page.render({ canvasContext: context, viewport }).promise;

      onProgress?.({ stage: "ocr", page: pageNumber, totalPages: pdfDocument.numPages });
      const result = await worker.recognize(canvas);
      const text = (result.data.text || "").replace(/\r/g, "").trim();
      const confidence = Number.isFinite(result.data.confidence) ? Math.round(Number(result.data.confidence)) : 0;
      const linesSource = ((result.data as { lines?: OcrLineLike[] }).lines ?? []).map((line) => ({
        text: normalizeOcrLine(line.text ?? ""),
        bbox: bboxFromAny(line.bbox ?? null),
        confidence: Number.isFinite(line.confidence) ? Math.round(Number(line.confidence)) : confidence,
      })).filter((line) => line.text);

      const words = (((result.data as { words?: OcrWordLike[] }).words ?? []).map((word) => normalizeOcrLine(word.text ?? ""))).filter(Boolean);
      const dates = Array.from(new Set((text.match(new RegExp(datePattern, "g")) ?? []).map(normalizeOcrLine)));
      const numericValues = Array.from(new Set(text.match(numericPattern) ?? []));
      const checkboxCount = (text.match(/[☑☐□■✓]/g) ?? []).length;
      const tableCount = Math.max(0, splitOcrLines(text).filter((line) => /\s{2,}|\|/.test(line)).length);
      const signatureCount = /\bsignature\b/i.test(text) ? 1 : 0;

      if (text) {
        pageTextParts.push(text);
      }
      if (confidence) {
        pageConfidences.push(confidence);
      }

      const pageFields = extractFieldsFromPage(pageNumber, linesSource);
      for (const field of pageFields) {
        detectionAuditTrail.push({
          id: createId("ocr-audit"),
          action: "detected",
          fieldId: field.id,
          fieldLabel: field.label,
          previousValue: "",
          nextValue: field.value,
          timestamp: new Date().toISOString(),
          note: `Detected on page ${pageNumber}.`,
        });
      }
      extractedFields.push(...pageFields);

      pages.push({
        pageNumber,
        text,
        confidence,
        confidenceBand: toConfidenceBand(confidence),
        width: canvas.width,
        height: canvas.height,
        previewDataUrl: canvas.toDataURL("image/jpeg", 0.86),
        tableCount,
        checkboxCount,
        signatureCount,
        dates,
        numericValues,
      });

      if (!linesSource.length && words.length) {
        const syntheticField = extractStandaloneMatch(
          pageNumber,
          words.join(" "),
          null,
          "document_text",
          "Detected Text",
          "Other Information",
          "text",
          /(.{12,})/,
          Math.max(60, confidence),
        );
        if (syntheticField) {
          extractedFields.push(syntheticField);
        }
      }
    }

    const text = pageTextParts.join("\n\n").trim();
    const confidence = pageConfidences.length
      ? Math.round(pageConfidences.reduce((sum, value) => sum + value, 0) / pageConfidences.length)
      : 0;
    const { type: documentType, confidence: documentTypeConfidence } = inferDocumentType(text);
    const { merged, duplicates, auditTrail } = mergeDuplicateFields(extractedFields);
    const issues = buildIssues(text, confidence, merged);

    return {
      text,
      confidence,
      confidenceBand: toConfidenceBand(confidence),
      pageCount: pdfDocument.numPages,
      pageConfidenceScore: confidence,
      issues,
      canSubmit: confidence >= 90 && !issues.some((issue) => issue.severity === "error"),
      extractedFields: merged,
      pages,
      documentType,
      documentTypeConfidence,
      structuredData: buildStructuredOcrData(merged),
      duplicates,
      auditTrail: [...detectionAuditTrail, ...auditTrail],
    };
  } finally {
    await worker.terminate();
  }
};
