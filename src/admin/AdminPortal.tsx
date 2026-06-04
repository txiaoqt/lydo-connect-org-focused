import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ArrowLeft, Eye, FileText, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PortalEmptyState, PortalMetricCard, PortalSection, PortalStatusBadge } from "@/components/portal/portal-ui";
import { PortalShell } from "@/components/portal/PortalShell";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { adminNavigationGroups } from "@/lib/lydo-connect-data";
import { useLydoConnect } from "@/lib/lydo-connect-store";
import {
  createTemplateRecordInSupabase,
  deleteTemplateRecordInSupabase,
  loadLydoConnectSupabaseState,
  resolveSupabaseFileUrl,
  updateTemplateRecordInSupabase,
  uploadTemplateDocumentToSupabase,
} from "@/lib/lydo-connect-supabase";

const routeMap: Record<string, string> = {
  overview: "/admin",
  registrations: "/admin/registrations",
  users: "/admin/users",
  "budget-utilization": "/admin/budget-utilization",
  "liquidation-monitoring": "/admin/liquidation-monitoring",
  "remarks-consequences": "/admin/remarks-consequences",
  "news-releases": "/admin/news-releases",
  "public-transparency-posts": "/admin/public-transparency-posts",
  templates: "/admin/templates",
  "notifications-activity": "/admin/notifications-activity",
};

const adminId = "admin-demo";

export default function AdminPortal({ section }: { section: string }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { state, mergeRemoteState, createTemplate, removeTemplate, updateOrganizationProfile, updateDocumentSubmission, updateBudgetRequest, updateLiquidationReport, updateNewsRelease, updateTransparencyPost, updateComplianceRemark, updateTemplate, markNotificationRead, createNotification, createActivityLog } =
    useLydoConnect();
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string | null>(null);
  const [uploadingTemplateId, setUploadingTemplateId] = useState<string | null>(null);
  const [templateModalMode, setTemplateModalMode] = useState<"create" | "edit" | "delete" | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateNameDraft, setTemplateNameDraft] = useState("");
  const [templateDescriptionDraft, setTemplateDescriptionDraft] = useState("");
  const [templateFileDraft, setTemplateFileDraft] = useState<File | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  const profile = state.organizationProfiles[0];
  const submission = state.documentSubmissions[0];
  const budget = state.budgetRequests[0];
  const liquidation = state.liquidationReports[0];
  const unread = state.notifications.filter((item) => !item.isRead).length;
  const templateDocuments = useMemo(
    () =>
      [...state.templates]
        .filter((template) => template.templateActive && template.isActive)
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [state.templates],
  );
  const validDocumentTypeIds = useMemo(
    () => new Set(templateDocuments.map((documentType) => documentType.id)),
    [templateDocuments],
  );
  const overviewStats = useMemo(
    () => ({
      organizations: state.organizationProfiles.length,
      pendingProfiles: state.organizationProfiles.filter((item) => item.profileStatus === "pending_review" || item.profileStatus === "incomplete").length,
      pendingDocuments: state.documentSubmissions.filter((item) => item.status === "submitted" || item.status === "under_admin_review").length,
      revisions: state.documentSubmissions.filter((item) => item.status === "needs_revision").length,
      approvedDocs: state.documentSubmissions.filter((item) => item.status === "approved_green").length,
      pendingBudget: state.budgetRequests.filter((item) => item.status === "submitted" || item.status === "under_review").length,
      approvedBudget: state.budgetRequests.filter((item) => item.status === "approved_for_ftf_green").length,
      releasedBudget: state.budgetRequests.filter((item) => item.status === "budget_released").length,
      pendingLiquidation: state.liquidationReports.filter((item) => item.status === "submitted" || item.status === "under_review").length,
      overdueLiquidation: state.liquidationReports.filter((item) => item.status === "overdue").length,
      nonCompliant: state.organizationProfiles.filter((item) => item.profileStatus === "suspended_inactive").length,
    }),
    [state],
  );

  const resetTemplateForm = () => {
    setTemplateModalMode(null);
    setEditingTemplateId(null);
    setTemplateNameDraft("");
    setTemplateDescriptionDraft("");
    setTemplateFileDraft(null);
  };

  const startEditingTemplate = (templateId: string) => {
    const template = templateDocuments.find((entry) => entry.id === templateId);
    if (!template) return;
    setTemplateModalMode("edit");
    setEditingTemplateId(templateId);
    setTemplateNameDraft(template.name);
    setTemplateDescriptionDraft(template.description);
    setTemplateFileDraft(null);
  };

  const handleCreateTemplate = async () => {
    if (!templateNameDraft.trim()) {
      toast({ title: "Template name required", description: "Please enter a document name.", variant: "destructive" });
      return;
    }
    if (!templateFileDraft) {
      toast({ title: "Template file required", description: "Please upload the document file for this template.", variant: "destructive" });
      return;
    }

    setSavingTemplate(true);
    try {
      const newTemplate = await createTemplateRecordInSupabase({
        name: templateNameDraft,
        description: templateDescriptionDraft,
        templateDescription: templateDescriptionDraft || `Template for ${templateNameDraft.trim()}.`,
      });
      createTemplate(newTemplate);
      if (templateFileDraft) {
        setUploadingTemplateId(newTemplate.id);
        const uploadedTemplate = await uploadTemplateDocumentToSupabase({
          documentTypeName: newTemplate.name,
          file: templateFileDraft,
        });
        updateTemplate(newTemplate.id, uploadedTemplate);
        setUploadingTemplateId(null);
      }
      const remoteSnapshot = await loadLydoConnectSupabaseState();
      if (remoteSnapshot) mergeRemoteState(remoteSnapshot);
      resetTemplateForm();
      toast({ title: "Template created", description: `${newTemplate.name} was added successfully.` });
    } catch (error) {
      toast({
        title: "Create failed",
        description: error instanceof Error ? error.message : "The template could not be created.",
        variant: "destructive",
      });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleUpdateTemplate = async () => {
    const template = templateDocuments.find((entry) => entry.id === editingTemplateId);
    if (!template) return;
    if (!templateNameDraft.trim()) {
      toast({ title: "Template name required", description: "Please enter a document name.", variant: "destructive" });
      return;
    }

    setSavingTemplate(true);
    try {
      const updatedTemplate = await updateTemplateRecordInSupabase({
        databaseId: template.databaseId,
        name: templateNameDraft,
        description: templateDescriptionDraft,
        templateDescription: templateDescriptionDraft || `Template for ${templateNameDraft.trim()}.`,
      });
      updateTemplate(template.id, updatedTemplate);
      if (templateFileDraft) {
        setUploadingTemplateId(template.id);
        const uploadedTemplate = await uploadTemplateDocumentToSupabase({
          documentTypeName: updatedTemplate.name,
          file: templateFileDraft,
        });
        updateTemplate(template.id, uploadedTemplate);
        setUploadingTemplateId(null);
      }
      const remoteSnapshot = await loadLydoConnectSupabaseState();
      if (remoteSnapshot) mergeRemoteState(remoteSnapshot);
      resetTemplateForm();
      toast({ title: "Template updated", description: `${updatedTemplate.name} was updated successfully.` });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "The template could not be updated.",
        variant: "destructive",
      });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const template = templateDocuments.find((entry) => entry.id === templateId);
    if (!template) return;

    try {
      await deleteTemplateRecordInSupabase(template.databaseId);
      removeTemplate(template.id);
      const remoteSnapshot = await loadLydoConnectSupabaseState();
      if (remoteSnapshot) mergeRemoteState(remoteSnapshot);
      if (editingTemplateId === template.id || templateModalMode === "delete") {
        resetTemplateForm();
      }
      toast({ title: "Template deleted", description: `${template.name} was removed from the active template list.` });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "The template could not be deleted.",
        variant: "destructive",
      });
    }
  };

  const openFile = async (fileUrl: string, downloadName?: string) => {
    try {
      const resolvedUrl = await resolveSupabaseFileUrl(fileUrl);
      if (!resolvedUrl) {
        throw new Error("No file is available yet.");
      }

      if (downloadName) {
        const link = document.createElement("a");
        link.href = resolvedUrl;
        link.download = downloadName;
        link.target = "_blank";
        link.rel = "noreferrer";
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }

      window.open(resolvedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast({
        title: "Unable to open file",
        description: error instanceof Error ? error.message : "The file could not be opened right now.",
        variant: "destructive",
      });
    }
  };

  const openPreview = async (fileUrl: string, title: string) => {
    try {
      const resolvedUrl = await resolveSupabaseFileUrl(fileUrl);
      if (!resolvedUrl) {
        throw new Error("No file is available yet.");
      }

      setPreviewUrl(resolvedUrl);
      setPreviewTitle(title);
      setPreviewModalOpen(true);
    } catch (error) {
      toast({
        title: "Unable to open preview",
        description: error instanceof Error ? error.message : "The file preview could not be opened right now.",
        variant: "destructive",
      });
    }
  };

  const selectedTemplate = editingTemplateId
    ? templateDocuments.find((template) => template.id === editingTemplateId) ?? null
    : null;

  const activeContent = useMemo(() => {
    switch (section) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <PortalMetricCard label="Registered Organizations" value={overviewStats.organizations} />
              <PortalMetricCard label="Pending Profiles" value={overviewStats.pendingProfiles} />
              <PortalMetricCard label="Pending Documents" value={overviewStats.pendingDocuments} />
              <PortalMetricCard label="Overdue Liquidations" value={overviewStats.overdueLiquidation} />
            </div>
            <PortalSection title="Operational Summary" description="Everything the admin side needs to monitor at a glance.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <PortalMetricCard label="Document Revisions" value={overviewStats.revisions} />
                <PortalMetricCard label="Approved Documents" value={overviewStats.approvedDocs} />
                <PortalMetricCard label="Budget Go Signals" value={overviewStats.approvedBudget} />
                <PortalMetricCard label="Budget Released" value={overviewStats.releasedBudget} />
                <PortalMetricCard label="Pending Liquidation" value={overviewStats.pendingLiquidation} />
                <PortalMetricCard label="Non-compliant Orgs" value={overviewStats.nonCompliant} />
              </div>
            </PortalSection>
            <PortalSection title="Recent Activity" description="Latest activity log entries and unread notifications.">
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-3">
                  {state.activityLogs.slice(0, 4).map((log) => (
                    <div key={log.id} className="rounded-xl border border-border/70 bg-background p-4 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{log.action}</p>
                        <PortalStatusBadge status="under_review" />
                      </div>
                      <p className="mt-1 text-muted-foreground">{log.description}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {state.notifications.slice(0, 4).map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      className="w-full rounded-xl border border-border/70 bg-background p-4 text-left text-sm transition-colors hover:bg-muted/40"
                      onClick={() => markNotificationRead(notification.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{notification.title}</p>
                        <PortalStatusBadge status={notification.isRead ? "verified" : "pending_review"} />
                      </div>
                      <p className="mt-1 text-muted-foreground">{notification.message}</p>
                    </button>
                  ))}
                </div>
              </div>
            </PortalSection>
          </div>
        );
      case "registrations": {
        const selectedOrg =
          state.organizationProfiles.find((org) => org.id === selectedRegistrationId) ?? null;
        const selectedSubmission = selectedOrg
          ? state.documentSubmissions.find((item) => item.organizationId === selectedOrg.id) ?? null
          : null;
        const selectedFiles = selectedSubmission
          ? state.documentSubmissionFiles.filter(
              (file) => file.submissionId === selectedSubmission.id && validDocumentTypeIds.has(file.documentTypeId),
            )
          : [];

        if (selectedOrg) {
          return (
            <div className="space-y-6">
              <PortalSection
                title={selectedOrg.organizationName}
                description="Registration details and submitted documents for validation."
                action={<PortalStatusBadge status={selectedSubmission?.status ?? selectedOrg.profileStatus} />}
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <Button size="sm" variant="outline" onClick={() => setSelectedRegistrationId(null)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to registrations
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateOrganizationProfile(selectedOrg.id, { profileStatus: "verified" })}>
                      Mark Verified
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateOrganizationProfile(selectedOrg.id, { profileStatus: "needs_update" })}>
                      Needs Update
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Email", selectedOrg.organizationEmail],
                    ["Contact Number", selectedOrg.contactNumber],
                    ["Barangay", selectedOrg.barangay],
                    ["Organization Type", selectedOrg.organizationType],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md border border-border/70 bg-muted/20 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">{label}</p>
                      <p className="mt-1 text-sm font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </PortalSection>

              <PortalSection
                title="Submitted Documents"
                description={`${selectedFiles.length}/${templateDocuments.length} files submitted from the organization user side.`}
                action={selectedSubmission ? <PortalStatusBadge status={selectedSubmission.status} /> : null}
              >
                {selectedSubmission ? (
                  <div className="space-y-3">
                    {templateDocuments.map((documentType) => {
                      const file = selectedFiles.find((entry) => entry.documentTypeId === documentType.id);
                      return (
                        <Card key={documentType.id} className="border-border/70">
                          <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.5fr_1fr]">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <p className="font-medium">{documentType.name}</p>
                                <PortalStatusBadge status={file ? file.validationStatus === "correct" ? "ready_for_review" : "needs_revision" : "not_started"} />
                              </div>
                              <p className="text-sm text-muted-foreground">{file?.fileName ?? "No file submitted yet."}</p>
                              <p className="rounded-md bg-muted/30 p-3 text-sm text-muted-foreground">
                                {file?.ocrText || "No OCR text available yet."}
                              </p>
                            </div>
                            <div className="space-y-2 rounded-md border border-border/70 bg-muted/20 p-3 text-sm">
                              <p>OCR status: {file?.ocrStatus ?? "pending"}</p>
                              <p>OCR confidence: {file?.ocrConfidence ? `${file.ocrConfidence}%` : "n/a"}</p>
                              <p>Admin remarks: {file?.adminRemarks || "None"}</p>
                              <div className="flex flex-wrap gap-2 pt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={!file}
                                  onClick={() => {
                                    updateDocumentSubmission(selectedSubmission.id, {
                                      status: "approved_green",
                                      reviewedAt: new Date().toISOString(),
                                      reviewedBy: adminId,
                                    });
                                    createNotification({
                                      id: `notif-${Date.now()}`,
                                      userId: selectedOrg.userId,
                                      organizationId: selectedOrg.id,
                                      title: "Document submission approved",
                                      message: "Your submitted documents have been marked approved / green.",
                                      type: "document_green",
                                      relatedType: "document_submission",
                                      relatedId: selectedSubmission.id,
                                      isRead: false,
                                      createdAt: new Date().toISOString(),
                                    });
                                    createActivityLog({
                                      id: `log-${Date.now()}`,
                                      actorUserId: adminId,
                                      organizationId: selectedOrg.id,
                                      action: "approved_document_submission",
                                      relatedType: "document_submission",
                                      relatedId: selectedSubmission.id,
                                      description: "Document submission approved from the registration detail view.",
                                      createdAt: new Date().toISOString(),
                                    });
                                  }}
                                >
                                  Approve / Green
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={!file}
                                  onClick={() => updateDocumentSubmission(selectedSubmission.id, { status: "needs_revision" })}
                                >
                                  Needs Revision
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <PortalEmptyState
                    title="No document submission yet"
                    description="Once this organization submits files on the user side, the same files will appear here."
                  />
                )}
              </PortalSection>
            </div>
          );
        }

        return (
          <PortalSection
            title="Registrations"
            description="Click a registered organization to view profile details and submitted documents."
            action={<PortalStatusBadge status={profile.profileStatus} />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {state.organizationProfiles.map((org) => {
                const orgSubmission = state.documentSubmissions.find((item) => item.organizationId === org.id);
                const submittedCount = orgSubmission
                  ? state.documentSubmissionFiles.filter(
                      (file) => file.submissionId === orgSubmission.id && validDocumentTypeIds.has(file.documentTypeId),
                    ).length
                  : 0;
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => setSelectedRegistrationId(org.id)}
                    className="rounded-md border border-border/70 bg-card p-0 text-left transition-colors hover:bg-muted/30"
                  >
                    <Card className="border-0 shadow-none">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="text-base">{org.organizationName}</CardTitle>
                          <PortalStatusBadge status={orgSubmission?.status ?? org.profileStatus} />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>{org.organizationEmail}</p>
                        <p>{org.contactNumber}</p>
                        <p>{org.barangay}</p>
                        <p>{org.organizationType}</p>
                          <p className="pt-2 font-medium text-foreground">
                          Documents submitted: {submittedCount}/{templateDocuments.length}
                        </p>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>
          </PortalSection>
        );
      }
      case "users":
        return (
          <PortalSection title="Users" description="Linked accounts and access levels.">
            <Card className="border-border/70">
              <CardContent className="p-0">
                <div className="grid gap-3 p-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Name / Email</p>
                    <p className="mt-1 font-medium">{profile.organizationName}</p>
                    <p className="text-sm text-muted-foreground">{profile.organizationEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Role</p>
                    <p className="mt-1 font-medium">Organization User</p>
                    <p className="text-sm text-muted-foreground">Linked organization account</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PortalSection>
        );
      case "budget-utilization":
        return (
          <PortalSection title="Budget Utilization" description="Budget request review and go-signal control.">
            <div className="grid gap-4">
              {state.budgetRequests.map((request) => (
                <Card key={request.id} className="border-border/70">
                  <CardContent className="grid gap-4 p-4 md:grid-cols-[1.5fr_1fr]">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{request.activityTitle}</p>
                          <p className="text-sm text-muted-foreground">{request.activityDescription}</p>
                        </div>
                        <PortalStatusBadge status={request.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">Requested: PHP {request.requestedAmount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Venue: {request.venue}</p>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
                      <p>Remarks: {request.remarks || "None"}</p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            updateBudgetRequest(request.id, {
                              status: "approved_for_ftf_green",
                              goSignalAt: new Date().toISOString(),
                              approvedAmount: request.requestedAmount,
                            });
                            createNotification({
                              id: `notif-${Date.now()}`,
                              userId: profile.userId,
                              organizationId: profile.id,
                              title: "Budget go signal issued",
                              message: "Your soft copy requirements have been pre-checked. You may now submit the hard copies face-to-face.",
                              type: "budget_go_signal",
                              relatedType: "budget_request",
                              relatedId: request.id,
                              isRead: false,
                              createdAt: new Date().toISOString(),
                            });
                          }}
                        >
                          Mark Green
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateBudgetRequest(request.id, { status: "needs_revision" })}>
                          Needs Revision
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateBudgetRequest(request.id, { status: "rejected_red" })}>
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </PortalSection>
        );
      case "liquidation-monitoring":
        return (
          <PortalSection title="Liquidation Monitoring" description="Track deadlines and go-signal dates.">
            <div className="grid gap-4">
              {state.liquidationReports.map((record) => (
                <Card key={record.id} className="border-border/70">
                  <CardContent className="grid gap-4 p-4 md:grid-cols-[1.5fr_1fr]">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{state.budgetRequests.find((item) => item.id === record.budgetRequestId)?.activityTitle ?? "Liquidation item"}</p>
                          <p className="text-sm text-muted-foreground">Go signal: {record.goSignalAt || "Pending"}</p>
                        </div>
                        <PortalStatusBadge status={record.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">Deadline: {record.deadlineAt || "Pending"}</p>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
                      <p>Remarks: {record.remarks || "None"}</p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => updateLiquidationReport(record.id, { status: "approved_for_ftf_green", goSignalAt: new Date().toISOString() })}>
                          Mark Green
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateLiquidationReport(record.id, { status: "needs_revision" })}>
                          Needs Revision
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateLiquidationReport(record.id, { status: "overdue" })}>
                          Mark Overdue
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </PortalSection>
        );
      case "remarks-consequences":
        return (
          <PortalSection title="Remarks and Consequences" description="Resolve compliance remarks and internal consequences.">
            <div className="space-y-3">
              {state.complianceRemarks.map((remark) => (
                <Card key={remark.id} className="border-border/70">
                  <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{remark.message}</p>
                        <PortalStatusBadge status={remark.status === "open" ? "needs_revision" : "verified"} />
                      </div>
                      <p className="text-sm text-muted-foreground">Consequence: {remark.consequenceType}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateComplianceRemark(remark.id, {
                          status: "resolved",
                          resolvedAt: new Date().toISOString(),
                          resolvedBy: adminId,
                        })
                      }
                    >
                      Resolve
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </PortalSection>
        );
      case "news-releases":
        return (
          <PortalSection title="News Releases" description="Admin-created news and Facebook post links.">
            <div className="grid gap-4 md:grid-cols-2">
              {state.newsReleases.map((news) => (
                <Card key={news.id} className="border-border/70">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{news.title}</p>
                      <PortalStatusBadge status={news.visibilityStatus} />
                    </div>
                    <p className="text-sm text-muted-foreground">{news.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateNewsRelease(news.id, { visibilityStatus: "published" })}>
                        Publish
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateNewsRelease(news.id, { visibilityStatus: "hidden" })}>
                        Hide
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </PortalSection>
        );
      case "public-transparency-posts":
        return (
          <PortalSection title="Public Transparency Posts" description="Simplified transparency content for public-facing visibility.">
            <div className="grid gap-4 md:grid-cols-2">
              {state.transparencyPosts.map((post) => (
                <Card key={post.id} className="border-border/70">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{post.title}</p>
                      <PortalStatusBadge status={post.visibilityStatus} />
                    </div>
                    <p className="text-sm text-muted-foreground">{post.category}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateTransparencyPost(post.id, { visibilityStatus: "published" })}>
                        Publish
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateTransparencyPost(post.id, { visibilityStatus: "hidden" })}>
                        Hide
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </PortalSection>
        );
      case "templates":
        return (
          <PortalSection
            title="Template Management"
            description="Create, edit, upload, and remove document templates. The active list here is the same list used on the user side."
            action={
              <Button
                type="button"
                onClick={() => {
                  setTemplateModalMode("create");
                  setEditingTemplateId(null);
                  setTemplateNameDraft("");
                  setTemplateDescriptionDraft("");
                  setTemplateFileDraft(null);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Document
              </Button>
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              {templateDocuments.map((template) => (
                <Card key={template.id} className="border-border/70">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{template.name}</p>
                      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">
                        {template.templateFileName ? "Uploaded" : "No file yet"}
                      </span>
                    </div>
                    <div className="rounded-md border border-border/70 bg-muted/20 p-3 text-sm">
                      <p className="font-medium text-foreground">
                        {template.templateFileName || "No template uploaded yet."}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {template.templateUploadedAt
                          ? `Uploaded ${new Date(template.templateUploadedAt).toLocaleString()}`
                          : "Upload a file so organization users can view and download it."}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button type="button" variant="outline" size="sm" onClick={() => startEditingTemplate(template.id)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      {template.templateFileUrl ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void openPreview(template.templateFileUrl, template.templateFileName || template.name)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      ) : (
                        <Button type="button" variant="outline" size="sm" disabled>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTemplateId(template.id);
                          setTemplateModalMode("delete");
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Dialog open={templateModalMode === "create" || templateModalMode === "edit"} onOpenChange={(open) => (!open ? resetTemplateForm() : undefined)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{templateModalMode === "edit" ? "Edit Template" : "Add Document Template"}</DialogTitle>
                  <DialogDescription>
                    {templateModalMode === "edit"
                      ? "Update the document information and replace the uploaded file if needed."
                      : "Create a new template record and upload the document file that users will access."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Document Name</label>
                    <Input value={templateNameDraft} onChange={(event) => setTemplateNameDraft(event.target.value)} placeholder="Enter document name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Document Description</label>
                    <Textarea
                      value={templateDescriptionDraft}
                      onChange={(event) => setTemplateDescriptionDraft(event.target.value)}
                      placeholder="Explain what the organization should upload for this document."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {templateModalMode === "edit" ? "Replace Template File" : "Upload Template File"}
                    </label>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(event) => setTemplateFileDraft(event.target.files?.[0] ?? null)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {templateModalMode === "edit"
                        ? "Leave this empty if you only want to update the title or description."
                        : "Upload the actual template file here so organization users can view and download it."}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetTemplateForm}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void (templateModalMode === "edit" ? handleUpdateTemplate() : handleCreateTemplate())}
                    disabled={savingTemplate || uploadingTemplateId !== null}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {savingTemplate || uploadingTemplateId !== null
                      ? "Saving..."
                      : templateModalMode === "edit"
                        ? "Save Changes"
                        : "Create Template"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={templateModalMode === "delete"} onOpenChange={(open) => (!open ? resetTemplateForm() : undefined)}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Delete Template</DialogTitle>
                  <DialogDescription>
                    {selectedTemplate
                      ? `Are you sure you want to delete ${selectedTemplate.name}?`
                      : "Are you sure you want to delete this template?"}
                  </DialogDescription>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  This removes the template from the active user-side document list.
                </p>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetTemplateForm}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => void (editingTemplateId ? handleDeleteTemplate(editingTemplateId) : Promise.resolve())}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog
              open={previewModalOpen}
              onOpenChange={(open) => {
                setPreviewModalOpen(open);
                if (!open) {
                  setPreviewUrl("");
                  setPreviewTitle("");
                }
              }}
            >
              <DialogContent className="max-w-5xl">
                <DialogHeader>
                  <DialogTitle>{previewTitle || "Template Preview"}</DialogTitle>
                  <DialogDescription>Preview the uploaded template file here.</DialogDescription>
                </DialogHeader>
                <div className="h-[70vh] overflow-hidden rounded-md border border-border/70 bg-muted/20">
                  {previewUrl ? (
                    <iframe
                      src={previewUrl}
                      title={previewTitle || "Template preview"}
                      className="h-full w-full"
                    />
                  ) : null}
                </div>
              </DialogContent>
            </Dialog>
          </PortalSection>
        );
      case "notifications-activity":
        return (
          <div className="space-y-6">
            <PortalSection title="Notifications" description="Admin and user notifications in one place." action={<BadgePanel count={unread} />}>
              <div className="space-y-3">
                {state.notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    className="w-full rounded-xl border border-border/70 bg-background p-4 text-left text-sm transition-colors hover:bg-muted/40"
                    onClick={() => markNotificationRead(notification.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{notification.title}</p>
                      <PortalStatusBadge status={notification.isRead ? "verified" : "pending_review"} />
                    </div>
                    <p className="mt-1 text-muted-foreground">{notification.message}</p>
                  </button>
                ))}
              </div>
            </PortalSection>
            <PortalSection title="Activity Logs" description="Audit-friendly event trail.">
              <div className="space-y-3">
                {state.activityLogs.map((activity) => (
                  <div key={activity.id} className="rounded-xl border border-border/70 bg-background p-4 text-sm">
                    <p className="font-medium">{activity.action}</p>
                    <p className="mt-1 text-muted-foreground">{activity.description}</p>
                  </div>
                ))}
              </div>
            </PortalSection>
          </div>
        );
      default:
        return (
          <PortalEmptyState
            title="Section not found"
            description="This admin section has not been configured yet."
            action={
              <Button variant="outline" onClick={() => navigate(routeMap.overview)}>
                Go to overview
              </Button>
            }
          />
        );
    }
  }, [
    createActivityLog,
    createTemplate,
    createNotification,
    editingTemplateId,
    handleCreateTemplate,
    handleDeleteTemplate,
    mergeRemoteState,
    markNotificationRead,
    navigate,
    openFile,
    openPreview,
    overviewStats,
    profile,
    previewModalOpen,
    previewTitle,
    previewUrl,
    section,
    selectedRegistrationId,
    state.activityLogs,
    state.budgetRequests,
    state.complianceRemarks,
    state.documentSubmissionFiles,
    state.liquidationReports,
    state.newsReleases,
    state.notifications,
    state.organizationProfiles,
    state.templates,
    state.transparencyPosts,
    selectedTemplate,
    submission.status,
    templateDescriptionDraft,
    templateDocuments,
    templateFileDraft,
    templateNameDraft,
    templateModalMode,
    updateBudgetRequest,
    updateComplianceRemark,
    updateDocumentSubmission,
    updateLiquidationReport,
    updateNewsRelease,
    updateOrganizationProfile,
    updateTemplate,
    updateTransparencyPost,
    validDocumentTypeIds,
    savingTemplate,
    uploadingTemplateId,
  ]);

  return (
    <PortalShell
      title="Admin Portal"
      subtitle="LYDO / PCYDO Admin"
      groups={adminNavigationGroups}
      activeId={section}
      onNavigate={(id) => navigate(routeMap[id] ?? routeMap.overview)}
      onSignOut={() => void signOut()}
    >
      {activeContent}
    </PortalShell>
  );
}

function BadgePanel({ count }: { count: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/20 px-3 py-1 text-sm">
      <Bell className="h-4 w-4" />
      <span>{count} unread</span>
    </div>
  );
}
