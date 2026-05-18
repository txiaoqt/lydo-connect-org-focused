import React from "react";
import { DisclosureDocType, DisclosureDocument } from "../types";

const DOC_TYPE_STYLES: Record<string, string> = {
  program_outcome: "bg-primary/10 text-primary border-primary/20",
  ordinance: "bg-amber-100 text-amber-700 border-amber-200/80",
  financial_statement: "bg-emerald-100 text-emerald-700 border-emerald-200/80",
  resolution: "bg-violet-100 text-violet-700 border-violet-200/80",
  bac_document: "bg-destructive/10 text-destructive border-destructive/20",
  executive_order: "bg-cyan-100 text-cyan-700 border-cyan-200/80",
  other: "bg-muted text-muted-foreground border-border",
};

export const DOCUMENT_TYPE_LABELS: Record<DisclosureDocType, string> = {
  ordinance: "Ordinance",
  resolution: "Resolution",
  executive_order: "Executive Order",
  bac_document: "BAC Document",
  financial_statement: "Financial Statement",
  program_outcome: "Program Outcome",
  other: "Other",
};

export function getDocumentTypeLabel(doc: DisclosureDocument) {
  if (doc.document_type === "other") {
    return doc.document_type_other?.trim() || "Other / Custom Type";
  }
  return DOCUMENT_TYPE_LABELS[doc.document_type] || "Other / Custom Type";
}

export function getDocumentTypeBadgeClasses(documentType: string) {
  return DOC_TYPE_STYLES[documentType] ?? DOC_TYPE_STYLES.other;
}

type DocumentTypeBadgeProps = {
  doc: DisclosureDocument;
};

export function DocumentTypeBadge({ doc }: DocumentTypeBadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold uppercase ${getDocumentTypeBadgeClasses(
        doc.document_type,
      )}`}
    >
      {getDocumentTypeLabel(doc)}
    </span>
  );
}

