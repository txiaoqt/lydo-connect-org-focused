import type { ActivityLog } from "@/lib/lydo-connect-data";
import type { ReportExportConfig } from "@/lib/report-export";

export type ExportActivityRow = {
  logId: string;
  timestamp: string;
  date: string;
  time: string;
  action: string;
  category: string;
  description: string;
  affectedRecord: string;
  actor: string;
  organization: string;
  additionalDetails: string;
};

const actionLabels: Record<string, string> = {
  reviewed_budget: "Reviewed budget request",
  review_budget_request: "Reviewed budget request",
  reviewed_liquidation: "Reviewed liquidation report",
  review_liquidation_report: "Reviewed liquidation report",
  document_submission_file: "Document submission",
  approve_document_submission: "Approved document submission",
  ypop_event_participation: "YPOP event participation",
  budget_cash_release: "Released budget funds",
  release_budget: "Released budget funds",
  verify_organization_profile: "Verified organization profile",
  create_news_release: "Created news release",
  reject_budget_request: "Rejected budget request",
};

const categoryLabels: Record<string, string> = {
  organization_profile: "Organization",
  registration: "Registration",
  budget_request: "Budget",
  document_submission: "Document",
  news_release: "News Release",
  liquidation_report: "Liquidation",
  ypop: "YPOP",
  ypop_entry: "YPOP",
  ypop_event_participation: "YPOP",
  inquiry: "Inquiry",
  template: "Template",
};

const titleCaseAuditValue = (value: string) =>
  value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const getFriendlyAuditAction = (action: string) =>
  actionLabels[action] ?? titleCaseAuditValue(action);

export const getFriendlyAuditCategory = (category: string) =>
  categoryLabels[category] ?? titleCaseAuditValue(category);

export const mapAuditLogToExportRow = (
  log: ActivityLog,
  context?: { actor?: string; organization?: string; additionalDetails?: string },
): ExportActivityRow => {
  const parsed = new Date(log.createdAt);
  const validDate = !Number.isNaN(parsed.getTime());
  const date = validDate
    ? new Intl.DateTimeFormat("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(parsed)
    : "";
  const time = validDate
    ? new Intl.DateTimeFormat("en-PH", {
        timeZone: "Asia/Manila",
        hour: "numeric",
        minute: "2-digit",
      }).format(parsed)
    : "";

  return {
    logId: log.id,
    timestamp: log.createdAt,
    date,
    time,
    action: getFriendlyAuditAction(log.action),
    category: getFriendlyAuditCategory(log.relatedType),
    description: log.description,
    affectedRecord: log.relatedId,
    actor: context?.actor ?? "",
    organization: context?.organization ?? "",
    additionalDetails: context?.additionalDetails ?? "",
  };
};

export const activityLogExportConfig: ReportExportConfig<ExportActivityRow> = {
  title: "Admin Activity Log Report",
  filenamePrefix: "Y-TRACE-Activity-Logs",
  orientation: "landscape",
  logoUrl: "/y-trace-logo.png",
  headerTitle: "Y-TRACE / ADMIN ACTIVITY LOG REPORT",
  footerText: "Y-TRACE Admin Audit Report",
  xlsxSheetName: "Activity Logs",
  pdfUseUnicodeFont: true,
  columns: [
    { label: "Log ID", value: (row) => row.logId, pdfWidth: 64, xlsxWidth: 24 },
    { label: "Date", value: (row) => row.date, xlsxValue: (row) => row.timestamp, xlsxType: "date", pdfWidth: 62, xlsxWidth: 16 },
    { label: "Time", value: (row) => row.time, pdfWidth: 48, xlsxWidth: 14 },
    { label: "Action", value: (row) => row.action, pdfWidth: 105, xlsxWidth: 30, xlsxWrap: true },
    { label: "Category", value: (row) => row.category, pdfWidth: 66, xlsxWidth: 20 },
    { label: "Description", value: (row) => row.description, csvPreserveLineBreaks: true, pdfWidth: 168, xlsxWidth: 55, xlsxWrap: true },
    { label: "Affected Record", value: (row) => row.affectedRecord, pdfWidth: 85, xlsxWidth: 35, xlsxWrap: true },
    { label: "Actor", value: (row) => row.actor, pdfWidth: 64, xlsxWidth: 24 },
    { label: "Organization", value: (row) => row.organization, pdfWidth: 82, xlsxWidth: 28, xlsxWrap: true },
    { label: "Additional Details", value: (row) => row.additionalDetails, csvPreserveLineBreaks: true, pdfWidth: 88, xlsxWidth: 32, xlsxWrap: true },
  ],
};
