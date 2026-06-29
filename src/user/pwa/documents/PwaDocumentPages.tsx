import { useMemo, useRef, useState, type DragEvent } from "react";
import JSZip from "jszip";
import {
  ChevronRight, Download, Eye, FileArchive, FileText, Loader2, Trash2, UploadCloud,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { toast } from "@/hooks/use-toast";
import {
  removeOrganizationDocumentFromSupabase,
  resolveSupabaseFileUrl,
  submitOrganizationDocumentsBatchToSupabase,
} from "@/lib/lydo-connect-supabase";
import type { SubmissionFile } from "@/lib/lydo-connect-data";
import { PwaBackButton } from "../PwaBackButton";
import { usePwaNavigation } from "../hooks/usePwaNavigation";
import type { usePwaPortalData } from "../hooks/usePwaPortalData";
import { PWA_ROUTES, pwaDocumentDetailRoute } from "../pwaRoutes";

type PortalData = ReturnType<typeof usePwaPortalData>;
type PendingFile = { id: string; file: File; documentTypeId: string };

const approvedStatuses = new Set(["approved", "approved_green"]);
const editableStatuses = new Set(["draft", "needs_revision", "rejected_red"]);

const saveBlob = (blob: Blob, name: string) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

const downloadReference = async (reference: string, name: string) => {
  const resolved = await resolveSupabaseFileUrl(reference);
  const response = await fetch(resolved);
  if (!response.ok) throw new Error(`Unable to download ${name}.`);
  saveBlob(await response.blob(), name);
};

const validateFile = (documentTypeId: string, file: File) => {
  const pdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  const spreadsheet = /\.(xlsx|xls)$/i.test(file.name);
  if (pdf || (documentTypeId === "yorp-members" && spreadsheet)) return "";
  return documentTypeId === "yorp-members"
    ? "The members list must be a PDF or XLSX file."
    : "This document must be a PDF file.";
};

export function PwaDocumentList({ data }: { data: PortalData }) {
  const { go } = usePwaNavigation();
  const byType = new Map(data.documentFiles.map((file) => [file.documentTypeId, file]));
  const total = data.requiredTemplates.length;
  const helper = data.underReviewDocuments
    ? `${data.underReviewDocuments} under admin review`
    : data.revisionDocuments.length
      ? `${data.revisionDocuments.length} need revision`
      : data.missingDocuments
        ? `${data.missingDocuments} files still missing`
        : "Track required files and review their current status.";

  return (
    <div className="pwa-stack">
      <section className="pwa-card pwa-document-summary">
        <div className="pwa-document-summary-heading">
          <span className="pwa-record-icon"><FileText aria-hidden="true" /></span>
          <div><h2>{data.approvedDocuments} of {total} documents approved</h2><p>{helper}</p></div>
        </div>
        <div className="pwa-progress" aria-label={`${data.documentPercent}% approved`}>
          <span style={{ width: `${data.documentPercent}%` }} />
        </div>
      </section>

      <section className="pwa-document-list" aria-label="Required documents">
        {data.requiredTemplates.map((template) => {
          const file = byType.get(template.id);
          return (
            <button
              key={template.id}
              type="button"
              className="pwa-card pwa-document-item"
              onClick={() => go(pwaDocumentDetailRoute(template.id))}
            >
              <span className="pwa-record-icon"><FileText aria-hidden="true" /></span>
              <span className="pwa-document-copy">
                <strong>{template.name}</strong>
                <small>{file?.fileName || "No file uploaded"}</small>
                <StatusBadge className="pwa-document-status" status={file?.adminStatus ?? "missing"} />
              </span>
              <ChevronRight className="pwa-document-chevron" aria-hidden="true" />
            </button>
          );
        })}
        {!total ? <div className="pwa-card pwa-empty-copy">No required documents are configured.</div> : null}
      </section>

      <button type="button" className="pwa-primary-button" onClick={() => go(PWA_ROUTES.documentsManage)}>
        <UploadCloud aria-hidden="true" /> Upload or Manage Documents
      </button>
    </div>
  );
}

export function PwaDocumentDetail({ data }: { data: PortalData }) {
  const { documentId = "" } = useParams();
  const { go } = usePwaNavigation();
  const template = data.requiredTemplates.find((item) => item.id === documentId);
  const file = data.documentFiles.find((item) => item.documentTypeId === documentId);
  if (!template) {
    return <div className="pwa-stack"><PwaBackButton fallback={PWA_ROUTES.documents} /><section className="pwa-card pwa-empty-copy">Document requirement not found.</section></div>;
  }

  const openReference = async (reference: string) => {
    try {
      const resolved = await resolveSupabaseFileUrl(reference);
      window.open(resolved, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast({ title: "Unable to open file", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="pwa-stack">
      <PwaBackButton fallback={PWA_ROUTES.documents} label="Documents" />
      <section className="pwa-card pwa-detail-hero">
        <span className="pwa-record-icon"><FileText aria-hidden="true" /></span>
        <div><h2>{template.name}</h2><StatusBadge status={file?.adminStatus ?? "missing"} /></div>
      </section>
      <section className="pwa-card pwa-detail-list">
        <div><FileText /><span><small>Attached file</small><strong>{file?.fileName || "No file uploaded"}</strong></span></div>
        <div><Eye /><span><small>Admin remarks</small><strong>{file?.adminRemarks || "No admin remarks."}</strong></span></div>
      </section>
      <div className="pwa-button-stack">
        {file?.fileUrl ? <button type="button" className="pwa-secondary-button" onClick={() => void openReference(file.fileUrl)}><Eye /> View Attached File</button> : null}
        {template.templateFileUrl ? <button type="button" className="pwa-secondary-button" onClick={() => void openReference(template.templateFileUrl)}><Download /> View Template</button> : null}
        {!file || editableStatuses.has(file.adminStatus) ? <button type="button" className="pwa-primary-button" onClick={() => go(PWA_ROUTES.documentsManage)}><UploadCloud /> {file ? "Replace in Document Manager" : "Upload in Document Manager"}</button> : null}
      </div>
    </div>
  );
}

export function PwaDocumentManager({ data }: { data: PortalData }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const fileByType = useMemo(() => new Map(data.documentFiles.map((file) => [file.documentTypeId, file])), [data.documentFiles]);
  const assignedTypes = new Set(pending.map((item) => item.documentTypeId).filter(Boolean));
  const submissionLocked = data.submission?.status === "approved_green" || (data.submission?.status as string | undefined) === "approved";

  const appendFiles = (files: File[]) => {
    setPending((current) => [
      ...current,
      ...files.map((file) => {
        const normalized = file.name.toLowerCase().replace(/[^a-z0-9]+/g, " ");
        const suggestion = data.requiredTemplates.find((template) =>
          normalized.includes(template.name.toLowerCase().replace(/[^a-z0-9]+/g, " ")),
        );
        return { id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`, file, documentTypeId: suggestion?.id ?? "" };
      }),
    ]);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    appendFiles(Array.from(event.dataTransfer.files));
  };

  const submit = async (mode: "draft" | "review") => {
    if (!pending.length) {
      toast({ title: "Select files first", description: "Choose the documents you want to upload.", variant: "destructive" });
      return;
    }
    if (submissionLocked) {
      toast({ title: "Submission locked", description: "Approved document submissions can no longer be changed.", variant: "destructive" });
      return;
    }
    const selectedTypes = pending.map((item) => item.documentTypeId);
    if (selectedTypes.some((item) => !item) || new Set(selectedTypes).size !== selectedTypes.length) {
      toast({ title: "Assign every file", description: "Each file needs one unique document type.", variant: "destructive" });
      return;
    }
    for (const item of pending) {
      const existing = fileByType.get(item.documentTypeId);
      if (existing && approvedStatuses.has(existing.adminStatus)) {
        toast({ title: "Approved document locked", description: "Approved documents cannot be replaced.", variant: "destructive" });
        return;
      }
      const issue = validateFile(item.documentTypeId, item.file);
      if (issue) {
        toast({ title: "Unsupported file", description: issue, variant: "destructive" });
        return;
      }
    }

    setSaving(true);
    try {
      const result = await submitOrganizationDocumentsBatchToSupabase({
        submitMode: mode,
        documents: pending.map((item) => {
          const template = data.requiredTemplates.find((entry) => entry.id === item.documentTypeId)!;
          return {
            documentTypeId: template.id,
            documentTypeName: template.name,
            file: item.file,
            validationStatus: "correct",
            adminRemarks: mode === "draft" ? "Saved as draft." : "Awaiting admin review.",
          };
        }),
      });
      await data.refresh();
      if (result.failureCount) {
        toast({ title: `${result.successCount} uploaded, ${result.failureCount} failed`, description: result.results.find((item) => !item.success)?.error || "Review the failed files.", variant: "destructive" });
      } else {
        toast({ title: mode === "draft" ? "Drafts saved" : "Documents submitted", description: `${result.successCount} document${result.successCount === 1 ? "" : "s"} uploaded successfully.` });
        setPending([]);
      }
    } catch (error) {
      toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const removeExisting = async (file: SubmissionFile) => {
    if (submissionLocked || approvedStatuses.has(file.adminStatus)) return;
    try {
      await removeOrganizationDocumentFromSupabase(file.id);
      await data.refresh();
      toast({ title: "Document removed" });
    } catch (error) {
      toast({ title: "Remove failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  };

  const downloadAll = async () => {
    const available = data.requiredTemplates.filter((item) => item.templateFileUrl);
    if (available.length !== data.requiredTemplates.length) {
      toast({ title: "Some templates are unavailable", description: "All required templates need a file before a ZIP can be prepared.", variant: "destructive" });
      return;
    }
    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      await Promise.all(available.map(async (template) => {
        const resolved = await resolveSupabaseFileUrl(template.templateFileUrl);
        const response = await fetch(resolved);
        if (!response.ok) throw new Error(`Unable to download ${template.name}.`);
        zip.file(template.templateFileName || `${template.name}.pdf`, await response.blob());
      }));
      saveBlob(await zip.generateAsync({ type: "blob" }), "Y-TRACE-Required-Templates.zip");
    } catch (error) {
      toast({ title: "ZIP download failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="pwa-stack">
      <PwaBackButton fallback={PWA_ROUTES.documents} label="Documents" />
      <section className="pwa-card pwa-workspace-intro">
        <h2>Bulk document workspace</h2>
        <p>Select several files, then assign each one to a unique required document type.</p>
      </section>
      <div
        className="pwa-upload-dropzone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <UploadCloud aria-hidden="true" />
        <strong>Select or drop files</strong>
        <small>PDF files; the members list also accepts XLS/XLSX.</small>
        <input ref={inputRef} type="file" multiple accept=".pdf,.xls,.xlsx,application/pdf" onChange={(event) => {
          appendFiles(Array.from(event.target.files ?? []));
          event.currentTarget.value = "";
        }} />
      </div>

      {pending.length ? (
        <section className="pwa-stack" aria-label="Selected files">
          {pending.map((item) => (
            <article className="pwa-card pwa-pending-file" key={item.id}>
              <div><FileText /><span><strong>{item.file.name}</strong><small>{Math.max(1, Math.round(item.file.size / 1024))} KB</small></span></div>
              <label>
                Document type
                <select
                  value={item.documentTypeId}
                  onChange={(event) => setPending((current) => current.map((entry) => entry.id === item.id ? { ...entry, documentTypeId: event.target.value } : entry))}
                >
                  <option value="">Select a document type</option>
                  {data.requiredTemplates.map((template) => {
                    const existing = fileByType.get(template.id);
                    const locked = submissionLocked || Boolean(existing && approvedStatuses.has(existing.adminStatus));
                    return <option key={template.id} value={template.id} disabled={locked || (assignedTypes.has(template.id) && item.documentTypeId !== template.id)}>{template.name}{locked ? " (Approved)" : ""}</option>;
                  })}
                </select>
              </label>
              <button type="button" className="pwa-text-button is-danger" onClick={() => setPending((current) => current.filter((entry) => entry.id !== item.id))}><Trash2 /> Remove</button>
            </article>
          ))}
        </section>
      ) : null}

      <section className="pwa-card pwa-manage-list">
        <div className="pwa-inline-heading"><strong>Required documents</strong><button type="button" onClick={() => void downloadAll()} disabled={downloadingZip}><FileArchive /> {downloadingZip ? "Preparing..." : "Download ZIP"}</button></div>
        {data.requiredTemplates.map((template) => {
          const file = fileByType.get(template.id);
          return (
            <article key={template.id}>
              <div className="pwa-manage-copy"><strong>{template.name}</strong><small>{file?.fileName || "No file uploaded"}</small>{file ? <StatusBadge status={file.adminStatus} /> : null}{file?.adminRemarks ? <p>{file.adminRemarks}</p> : null}</div>
              <div className="pwa-manage-actions">
                {template.templateFileUrl ? <button type="button" aria-label={`Download ${template.name} template`} onClick={() => void downloadReference(template.templateFileUrl, template.templateFileName || `${template.name}.pdf`)}><Download /></button> : null}
                {file?.fileUrl ? <button type="button" aria-label={`View ${template.name}`} onClick={() => void resolveSupabaseFileUrl(file.fileUrl).then((url) => window.open(url, "_blank", "noopener,noreferrer"))}><Eye /></button> : null}
                {file && !submissionLocked && !approvedStatuses.has(file.adminStatus) ? <button type="button" aria-label={`Remove ${template.name}`} onClick={() => void removeExisting(file)}><Trash2 /></button> : null}
              </div>
            </article>
          );
        })}
      </section>

      <div className="pwa-sticky-actions">
        <button type="button" className="pwa-secondary-button" disabled={saving || !pending.length} onClick={() => void submit("draft")}>{saving ? <Loader2 className="pwa-spin" /> : null} Save as Draft</button>
        <button type="button" className="pwa-primary-button" disabled={saving || !pending.length} onClick={() => void submit("review")}>{saving ? <Loader2 className="pwa-spin" /> : null} Submit Selected Files</button>
      </div>
    </div>
  );
}
