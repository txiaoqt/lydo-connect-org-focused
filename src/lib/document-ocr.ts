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

export type DocumentOcrField = {
  key: string;
  label: string;
  value: string;
  confidence: number;
  source: string;
};

export type DocumentOcrScanResult = {
  text: string;
  confidence: number;
  pageCount: number;
  issues: DocumentOcrIssue[];
  canSubmit: boolean;
  extractedFields: DocumentOcrField[];
};

const commonOcrTypos = [
  "teh",
  "recieve",
  "seperate",
  "occured",
  "adress",
  "thier",
  "definately",
  "acommodate",
  "agian",
  "wich",
];

const normalizeOcrLine = (value: string) => value.replace(/\s+/g, " ").trim();
const compactText = (value: string) => normalizeOcrLine(value);
const splitOcrLines = (value: string) =>
  value
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((line) => normalizeOcrLine(line))
    .filter(Boolean);

type ExtractedFieldDefinition = {
  key: string;
  label: string;
  labelPatterns: RegExp[];
};

const fieldDefinitions: ExtractedFieldDefinition[] = [
  {
    key: "organizationName",
    label: "Organization Name",
    labelPatterns: [/^(?:organization\s*name|name\s*of\s*organization)\s*[:\-–]?\s*(.+)$/i],
  },
  {
    key: "organizationEmail",
    label: "Email Address",
    labelPatterns: [
      /^(?:official\s+organizational\s+email\s+address|organization\s+email\s+address|email\s+address)\s*[:\-–]?\s*(.+)$/i,
    ],
  },
  {
    key: "contactNumber",
    label: "Contact Number",
    labelPatterns: [
      /^(?:contact\s+number|telephone|cellphone|mobile\s+number)\s*[:\-–]?\s*(.+)$/i,
    ],
  },
  {
    key: "addressBuildingNo",
    label: "Building No.",
    labelPatterns: [
      /^(?:organization\s+address\s+building\s+no\.?|building\s+no\.?|house\s+no\.?|bldg\.?\s+no\.?)\s*[:\-–]?\s*(.+)$/i,
    ],
  },
  {
    key: "addressStreet",
    label: "Street",
    labelPatterns: [/^(?:organization\s+address\s+street|street)\s*[:\-–]?\s*(.+)$/i],
  },
  {
    key: "addressBarangay",
    label: "Barangay",
    labelPatterns: [/^(?:organization\s+address\s+barangay|barangay)\s*[:\-–]?\s*(.+)$/i],
  },
  {
    key: "addressDistrict",
    label: "District",
    labelPatterns: [/^(?:organization\s+address\s+district|district)\s*[:\-–]?\s*(.+)$/i],
  },
  {
    key: "addressCity",
    label: "Municipality / City",
    labelPatterns: [/^(?:organization\s+address\s+municipality\s*\/?\s*city|municipality\s*\/?\s*city|city)\s*[:\-–]?\s*(.+)$/i],
  },
  {
    key: "website",
    label: "Website",
    labelPatterns: [/^(?:organization\s+website|website)\s*[:\-–]?\s*(.+)$/i],
  },
];

const emailPattern = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/;
const phonePattern = /(?:\+?63|0)\s?\d[\d\s-]{7,}\d/;
const urlPattern = /https?:\/\/[^\s)]+/i;

const extractFieldValue = (lines: string[], definition: ExtractedFieldDefinition): DocumentOcrField | null => {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    for (const pattern of definition.labelPatterns) {
      const match = line.match(pattern);
      if (!match) continue;

      const inlineValue = compactText(match[1] ?? "");
      if (inlineValue) {
        return {
          key: definition.key,
          label: definition.label,
          value: inlineValue,
          confidence: 96,
          source: line,
        };
      }

      for (let nextIndex = index + 1; nextIndex < Math.min(lines.length, index + 4); nextIndex += 1) {
        const candidate = lines[nextIndex];
        if (!candidate || candidate === line) continue;
        if (definition.labelPatterns.some((otherPattern) => otherPattern.test(candidate))) continue;
        if (candidate.length < 2) continue;

        return {
          key: definition.key,
          label: definition.label,
          value: candidate,
          confidence: 90,
          source: line,
        };
      }
    }
  }

  return null;
};

const extractStandaloneField = (
  text: string,
  key: string,
  label: string,
  pattern: RegExp,
  confidence = 84,
): DocumentOcrField | null => {
  const match = text.match(pattern);
  if (!match) return null;

  const value = compactText(match[1] ?? match[0]);
  if (!value) return null;

  return {
    key,
    label,
    value,
    confidence,
    source: match[0],
  };
};

const extractOcrFields = (text: string): DocumentOcrField[] => {
  const lines = splitOcrLines(text);
  const extracted: DocumentOcrField[] = [];
  const seenKeys = new Set<string>();

  for (const definition of fieldDefinitions) {
    const field = extractFieldValue(lines, definition);
    if (!field || seenKeys.has(field.key)) continue;
    extracted.push(field);
    seenKeys.add(field.key);
  }

  const fallbackFields = [
    extractStandaloneField(text, "organizationEmail", "Email Address", emailPattern, 82),
    extractStandaloneField(text, "contactNumber", "Contact Number", phonePattern, 78),
    extractStandaloneField(text, "website", "Website", urlPattern, 78),
  ].filter((field): field is DocumentOcrField => Boolean(field) && !seenKeys.has(field.key));

  for (const field of fallbackFields) {
    extracted.push(field);
    seenKeys.add(field.key);
  }

  return extracted;
};

const buildIssues = (text: string, confidence: number): DocumentOcrIssue[] => {
  const issues: DocumentOcrIssue[] = [];
  const cleanedText = compactText(text);

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
      description: "The OCR confidence is below 90%. Reupload a clearer PDF before submitting.",
    });
  }

  if (cleanedText.length < 40) {
    issues.push({
      severity: "error",
      title: "Text too short",
      description: "The extracted text is too short to validate reliably. Reupload the document.",
    });
  }

  const excessivePunctuation = cleanedText.match(/[!?.,;:]{3,}/g) ?? [];
  if (excessivePunctuation.length) {
    issues.push({
      severity: "warning",
      title: "Excessive punctuation detected",
      description: "The OCR result contains repeated punctuation that may indicate scan noise or formatting errors.",
    });
  }

  const repeatedWords = Array.from(cleanedText.matchAll(/\b([A-Za-z0-9]+)\s+\1\b/gi));
  if (repeatedWords.length) {
    issues.push({
      severity: "warning",
      title: "Repeated words detected",
      description: "The OCR result contains repeated words that should be checked before submission.",
    });
  }

  const repeatedCharacters = cleanedText.match(/\b\w*([A-Za-z])\1{3,}\w*\b/g) ?? [];
  if (repeatedCharacters.length) {
    issues.push({
      severity: "warning",
      title: "Suspicious character repeats",
      description: "The scan includes repeated characters that may be OCR mistakes.",
    });
  }

  const typoHits = commonOcrTypos.filter((typo) => new RegExp(`\\b${typo}\\b`, "i").test(cleanedText));
  if (typoHits.length) {
    issues.push({
      severity: "warning",
      title: "Possible typo detected",
      description: `Possible spelling issues were detected (${typoHits.slice(0, 3).join(", ")}). Please review the document carefully.`,
    });
  }

  const unusualSymbolCount = (cleanedText.match(/[^a-zA-Z0-9\s.,;:'"()\-\/&%]/g) ?? []).length;
  if (unusualSymbolCount > 6) {
    issues.push({
      severity: "warning",
      title: "Unusual symbols detected",
      description: "The OCR output includes unusual symbols that may need another scan.",
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
    const pageTextParts: string[] = [];
    const pageConfidences: number[] = [];

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

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      onProgress?.({ stage: "ocr", page: pageNumber, totalPages: pdfDocument.numPages });
      const result = await worker.recognize(canvas);
      const text = (result.data.text || "").replace(/\r/g, "").trim();

      if (text) {
        pageTextParts.push(text);
      }

      if (Number.isFinite(result.data.confidence)) {
        pageConfidences.push(Number(result.data.confidence));
      }
    }

    const text = pageTextParts.join("\n\n").trim();
    const confidence = pageConfidences.length
      ? Math.round(pageConfidences.reduce((sum, value) => sum + value, 0) / pageConfidences.length)
      : 0;
    const issues = buildIssues(text, confidence);
    const extractedFields = extractOcrFields(text);

    return {
      text,
      confidence,
      pageCount: pdfDocument.numPages,
      issues,
      canSubmit: confidence >= 90 && !issues.some((issue) => issue.severity === "error"),
      extractedFields,
    };
  } finally {
    await worker.terminate();
  }
};
