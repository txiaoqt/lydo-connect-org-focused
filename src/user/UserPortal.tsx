import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, Download, Eye, FileUp, MessageSquare, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { PortalEmptyState, PortalMetricCard, PortalSection, PortalStatusBadge } from "@/components/portal/portal-ui";
import { UserPortalShell } from "@/components/portal/UserPortalShell";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { useLydoConnect } from "@/lib/lydo-connect-store";
import { userNavigationGroups, userRouteMap } from "@/lib/lydo-connect-data";
import { loadLydoConnectSupabaseState, resolveSupabaseFileUrl, uploadOrganizationDocumentToSupabase } from "@/lib/lydo-connect-supabase";

const getReadiness = (filled: number, total: number) => (total === 0 ? 0 : Math.round((filled / total) * 100));
const hasUploadedTemplateFile = (fileUrl?: string, fileName?: string) =>
  Boolean(fileName?.trim() && fileUrl?.trim() && !fileUrl.startsWith("#"));

export default function UserPortal({ section }: { section: string }) {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { state, mergeRemoteState, updateDocumentFile, updateDocumentSubmission, setDocumentSubmissionStatus, markNotificationRead } = useLydoConnect();
  const [uploadingDocumentId, setUploadingDocumentId] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewEmptyMessage, setPreviewEmptyMessage] = useState("");

  const profile = state.organizationProfiles[0];
  const submission = state.documentSubmissions[0];
  const budget = state.budgetRequests[0];
  const liquidation = state.liquidationReports[0];
  const unreadNotifications = state.notifications.filter((notification) => notification.userId === user?.id && !notification.isRead);
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
  const docFiles = state.documentSubmissionFiles.filter(
    (file) => file.submissionId === submission.id && validDocumentTypeIds.has(file.documentTypeId),
  );
  const templatesById = useMemo(
    () => Object.fromEntries(templateDocuments.map((template) => [template.id, template])),
    [templateDocuments],
  );
  const completedDocs = docFiles.filter((file) => file.validationStatus === "correct").length;
  const profilePercent = profile
    ? getReadiness(
        [profile.organizationName, profile.organizationEmail, profile.contactNumber, profile.barangay].filter(Boolean).length,
        4,
      )
    : 0;
  const documentsPercent = getReadiness(completedDocs, templateDocuments.length);
  const budgetPercent = budget ? getReadiness(budget.status === "approved_for_ftf_green" || budget.status === "budget_released" ? 1 : 0, 1) : 0;
  const liquidationPercent = liquidation ? getReadiness(liquidation.status === "completed_liquidated" ? 1 : 0, 1) : 0;

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
    if (!fileUrl.trim() || fileUrl.startsWith("#")) {
      setPreviewUrl("");
      setPreviewTitle(title);
      setPreviewEmptyMessage("No file uploaded yet.");
      setPreviewModalOpen(true);
      return;
    }

    try {
      const resolvedUrl = await resolveSupabaseFileUrl(fileUrl);
      if (!resolvedUrl) {
        throw new Error("No file is available yet.");
      }

      setPreviewUrl(resolvedUrl);
      setPreviewTitle(title);
      setPreviewEmptyMessage("");
      setPreviewModalOpen(true);
    } catch (error) {
      toast({
        title: "Unable to open preview",
        description: error instanceof Error ? error.message : "The file preview could not be opened right now.",
        variant: "destructive",
      });
    }
  };

  const handleDocumentUpload = async (documentTypeName: string, file: File | null) => {
    if (!file) return;

    const localDocumentType = templateDocuments.find((documentType) => documentType.name === documentTypeName);
    if (!localDocumentType) return;

    setUploadingDocumentId(localDocumentType.id);

    try {
      const uploadResult = await uploadOrganizationDocumentToSupabase({
        documentTypeName,
        file,
      });

      updateDocumentFile(uploadResult.file.id, uploadResult.file);
      updateDocumentSubmission(uploadResult.submissionId, {
        status: "uploaded",
        userConfirmed: false,
        updatedAt: new Date().toISOString(),
      });

      const remoteSnapshot = await loadLydoConnectSupabaseState();
      if (remoteSnapshot) {
        mergeRemoteState(remoteSnapshot);
      }

      toast({
        title: "Document uploaded",
        description: `${documentTypeName} was saved to Supabase successfully.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "The document could not be uploaded.",
        variant: "destructive",
      });
    } finally {
      setUploadingDocumentId(null);
    }
  };

  const activeContent = useMemo(() => {
    switch (section) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <PortalMetricCard label="Profile" value={`${profilePercent}%`} helper={profile.profileStatus.replaceAll("_", " ")} />
              <PortalMetricCard label="Documents" value={`${documentsPercent}%`} helper={`${completedDocs}/${templateDocuments.length} checked`} />
              <PortalMetricCard label="Budget" value={`${budgetPercent}%`} helper={budget.status.replaceAll("_", " ")} />
              <PortalMetricCard label="Liquidation" value={`${liquidationPercent}%`} helper={liquidation.status.replaceAll("_", " ")} />
            </div>

            <PortalSection
              title="Quick Actions"
              description="Move through the organization compliance workflow."
              action={<Sparkles className="h-5 w-5 text-primary" />}
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  ["document-submission", "Submit Documents"],
                  ["budget-request", "Request Budget"],
                  ["liquidation-reporting", "Submit Liquidation"],
                  ["compliance-status", "View Compliance"],
                  ["news-releases", "View News"],
                ].map(([id, label]) => (
                  <Button key={id} type="button" variant="outline" className="justify-between" onClick={() => navigate(userRouteMap[id])}>
                    <span>{label}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </PortalSection>

            <PortalSection title="Compliance Summary" description="A quick look at the organization standing.">
              <div className="grid gap-3 md:grid-cols-2">
                <Card className="bg-muted/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Next Action Needed</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>{submission.status === "under_admin_review" ? "Wait for admin review remarks." : "Complete the remaining required documents."}</p>
                    <p>{budget.status === "approved_for_ftf_green" ? "Prepare hard copies for face-to-face submission." : "Budget request is ready for administrative review."}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Recent Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span>Profile</span>
                      <PortalStatusBadge status={profile.profileStatus} />
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span>Documents</span>
                      <PortalStatusBadge status={submission.status} />
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span>Budget</span>
                      <PortalStatusBadge status={budget.status} />
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span>Liquidation</span>
                      <PortalStatusBadge status={liquidation.status} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </PortalSection>

            <PortalSection title="Pending Notifications" description="Important admin messages and workflow updates.">
              {unreadNotifications.length ? (
                <div className="space-y-3">
                  {unreadNotifications.slice(0, 3).map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      className="w-full rounded-xl border border-border/70 bg-background p-4 text-left transition-colors hover:bg-muted/40"
                      onClick={() => markNotificationRead(notification.id)}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{notification.title}</p>
                        <PortalStatusBadge status={notification.type === "overdue" ? "overdue" : "under_review"} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <PortalEmptyState
                  title="No unread notifications"
                  description="You are all caught up."
                  action={
                    <Button variant="outline" onClick={() => navigate(userRouteMap.notifications)}>
                      View all notifications
                    </Button>
                  }
                />
              )}
            </PortalSection>
          </div>
        );
      case "organization-profile":
        return (
          <PortalSection
            title="Organization Profile Setup"
            description="This is the primary profile record linked to the authenticated account."
            action={<PortalStatusBadge status={profile.profileStatus} />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Organization Name", profile.organizationName],
                ["Organization Email", profile.organizationEmail],
                ["Contact Number", profile.contactNumber],
                ["Barangay", profile.barangay],
                ["Organization Type", profile.organizationType],
                ["Representative", profile.representativeName],
                ["Adviser", profile.adviserName],
                ["Address", profile.address],
                ["Facebook Page", profile.facebookPageUrl],
              ].map(([label, value]) => (
                <Card key={label} className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm">{value}</CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-border/70 bg-background p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Profile readiness</p>
              <Progress className="mt-3" value={profilePercent} />
              <p className="mt-2">{profilePercent}% complete. Critical fields should stay accurate so the organization can submit documents and budget requests.</p>
            </div>
          </PortalSection>
        );
      case "document-submission":
        return (
          <div className="space-y-6">
            <PortalSection
              title="Document Submission"
              description="Live template-driven upload slots with templates and admin remarks."
              action={<PortalStatusBadge status={submission.status} />}
            >
              <div className="grid gap-4">
                {templateDocuments.map((documentType) => {
                  const file = docFiles.find((entry) => entry.documentTypeId === documentType.id);
                  const template = templatesById[documentType.id];
                  return (
                    <Card key={documentType.id} className="border-border/70">
                      <CardContent className="grid gap-4 p-4 md:grid-cols-[1.7fr_1fr]">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{documentType.name}</p>
                            <PortalStatusBadge status={file?.validationStatus === "correct" ? "approved_green" : file ? "needs_revision" : "not_started"} />
                          </div>
                          <p className="text-sm text-muted-foreground">{documentType.description}</p>
                          <p className="text-xs text-muted-foreground">Primary file type: PDF</p>
                          <div className="flex flex-wrap gap-2">
                            {hasUploadedTemplateFile(template?.templateFileUrl, template?.templateFileName) ? (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => void openPreview(template.templateFileUrl, template.templateFileName || documentType.name)}
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Template
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    void openFile(
                                      template.templateFileUrl,
                                      template.templateFileName || `${documentType.id}.file`,
                                    )
                                  }
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Template
                                </Button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => void openPreview(template?.templateFileUrl ?? "", template?.templateFileName || documentType.name)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Template
                              </Button>
                            )}
                            <label>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                className="sr-only"
                                onChange={(event) => {
                                  void handleDocumentUpload(documentType.name, event.target.files?.[0] ?? null);
                                  event.currentTarget.value = "";
                                }}
                              />
                              <Button type="button" variant="secondary" size="sm" asChild disabled={uploadingDocumentId === documentType.id}>
                                <span>
                                  <FileUp className="mr-2 h-4 w-4" />
                                  {uploadingDocumentId === documentType.id ? "Uploading..." : "Upload File"}
                                </span>
                              </Button>
                            </label>
                          </div>
                        </div>
                        <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">Admin remark</span>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p>{file?.adminRemarks || "No remarks yet."}</p>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">Admin template</span>
                            <span>{template?.templateFileName || "Not uploaded yet"}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">OCR</span>
                            <span>{file?.ocrStatus ?? "pending"}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">Confidence</span>
                            <span>{file?.ocrConfidence ? `${file.ocrConfidence}%` : "n/a"}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </PortalSection>

            <PortalSection title="Submission Controls" description="Final submission is unlocked once the checklist is complete.">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {completedDocs}/{templateDocuments.length} documents reviewed by the user.
                </p>
                <Button
                  type="button"
                  onClick={() =>
                    setDocumentSubmissionStatus(
                      submission.id,
                      completedDocs === templateDocuments.length ? "submitted" : "needs_revision",
                      completedDocs === templateDocuments.length
                        ? "User confirmed that all uploaded files and OCR details are ready for LYDO/PCYDO review."
                        : "Please complete the missing document slots before final submission.",
                    )
                  }
                >
                  Confirm Final Submission
                </Button>
              </div>
            </PortalSection>
          </div>
        );
      case "validation-review":
        return (
          <PortalSection
            title="Validation and Review"
            description="Review OCR output and mark whether the files are correct or need re-upload."
            action={<PortalStatusBadge status={submission.status} />}
          >
            <div className="grid gap-4 xl:grid-cols-2">
              {docFiles.map((file) => (
                <Card key={file.id} className="border-border/70">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{templatesById[file.documentTypeId]?.name ?? file.documentTypeId}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Readable</span>
                      <PortalStatusBadge status={file.ocrStatus === "completed" ? "approved_green" : "under_review"} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">OCR confidence</span>
                      <span>{file.ocrConfidence ? `${file.ocrConfidence}%` : "n/a"}</span>
                    </div>
                    <p className="rounded-lg bg-muted/30 p-3 text-muted-foreground">{file.ocrText || "No extracted text yet."}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Details are correct
                      </Button>
                      <Button variant="outline" size="sm">
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Needs re-upload
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </PortalSection>
        );
      case "budget-request":
        return (
          <div className="space-y-6">
            <PortalSection
              title="Budget Request / Allocation Tracking"
              description="Soft copy pre-checking before the face-to-face hard copy submission."
              action={<PortalStatusBadge status={budget.status} />}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["Activity Title", budget.activityTitle],
                  ["Description", budget.activityDescription],
                  ["Proposed Date", budget.activityDate],
                  ["Venue", budget.venue],
                  ["Requested Amount", `PHP ${budget.requestedAmount.toLocaleString()}`],
                  ["Purpose / Category", budget.purposeCategory],
                ].map(([label, value]) => (
                  <Card key={label} className="bg-muted/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm">{value}</CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
                <p className="font-medium text-foreground">Go signal</p>
                <p className="mt-1 text-muted-foreground">
                  {budget.status === "approved_for_ftf_green"
                    ? "Your soft copy requirements have been pre-checked. You may now submit the hard copies face-to-face."
                    : "Awaiting admin review."}
                </p>
              </div>
            </PortalSection>
          </div>
        );
      case "liquidation-reporting":
        return (
          <PortalSection
            title="Liquidation and Reporting"
            description="Post-activity requirements tied to the approved budget request."
            action={<PortalStatusBadge status={liquidation.status} />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Related Budget", budget.activityTitle],
                ["Approved Amount", `PHP ${budget.approvedAmount.toLocaleString()}`],
                ["Budget Release Date", budget.releaseDate || "Pending"],
                ["Go Signal Date", liquidation.goSignalAt || "Pending"],
                ["Deadline", liquidation.deadlineAt || "Pending"],
                ["Hard Copy Submitted", liquidation.hardCopySubmittedAt || "Not yet"],
              ].map(([label, value]) => (
                <Card key={label} className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm">{value}</CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-border/70 bg-background p-4 text-sm text-muted-foreground">
              <AlertTriangle className="mb-2 h-4 w-4 text-amber-500" />
              Submit within one month from the go signal date once the soft copy has been approved.
            </div>
          </PortalSection>
        );
      case "news-releases":
        return (
          <PortalSection title="News Releases" description="Announcements and Facebook post previews.">
            <div className="grid gap-4 md:grid-cols-2">
              {state.newsReleases.map((news) => (
                <a
                  key={news.id}
                  href={news.facebookPostUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group block rounded-2xl border border-border/70 bg-card p-5 transition-transform hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold group-hover:text-primary">{news.title}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{news.description}</p>
                    </div>
                    <PortalStatusBadge status={news.visibilityStatus} />
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted-foreground/70">{news.datePosted}</p>
                </a>
              ))}
            </div>
          </PortalSection>
        );
      case "public-transparency":
        return (
          <PortalSection title="Public Transparency Posting" description="Simplified public transparency posts.">
            <div className="grid gap-4 md:grid-cols-2">
              {state.transparencyPosts.map((post) => (
                <Card key={post.id} className="border-border/70">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-base">{post.title}</CardTitle>
                      <PortalStatusBadge status={post.visibilityStatus} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>{post.description}</p>
                    <p>Category: {post.category}</p>
                    <p>Date: {post.postDate}</p>
                    <Button variant="outline" size="sm" asChild>
                      <a href={post.attachmentUrl} target="_blank" rel="noreferrer">
                        View Attachment
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </PortalSection>
        );
      case "compliance-status":
        return (
          <div className="space-y-6">
            <PortalSection title="Compliance Status" description="Your organization standing across all modules.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <PortalMetricCard label="Profile" value={`${profilePercent}%`} />
                <PortalMetricCard label="Documents" value={`${documentsPercent}%`} />
                <PortalMetricCard label="Budget" value={budget.status} />
                <PortalMetricCard label="Liquidation" value={liquidation.status} />
              </div>
            </PortalSection>
            <PortalSection title="Missing Requirements" description="Items that need attention before you can move forward.">
              <ul className="space-y-3 text-sm text-muted-foreground">
                {docFiles.filter((file) => file.validationStatus !== "correct").map((file) => (
                  <li key={file.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3">
                    <span>{templatesById[file.documentTypeId]?.name ?? file.documentTypeId}</span>
                    <PortalStatusBadge status="needs_revision" />
                  </li>
                ))}
                {!docFiles.some((file) => file.validationStatus !== "correct") ? (
                  <li>
                    <PortalEmptyState title="All required documents are in good standing." description="No missing requirements detected." />
                  </li>
                ) : null}
              </ul>
            </PortalSection>
          </div>
        );
      case "notifications":
        return (
          <PortalSection title="Notifications" description="Admin remarks, go signals, revisions, and deadlines.">
            <div className="space-y-3">
              {state.notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className="w-full rounded-xl border border-border/70 bg-background p-4 text-left transition-colors hover:bg-muted/40"
                  onClick={() => markNotificationRead(notification.id)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{notification.title}</p>
                    <PortalStatusBadge status={notification.isRead ? "verified" : "pending_review"} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                </button>
              ))}
            </div>
          </PortalSection>
        );
      default:
        return (
          <PortalEmptyState
            title="Section not found"
            description="This portal section has not been configured yet."
            action={
              <Button variant="outline" onClick={() => navigate(userRouteMap.dashboard)}>
                Go to dashboard
              </Button>
            }
          />
        );
    }
  }, [
    budget.activityDescription,
    budget.activityTitle,
    budget.approvedAmount,
    budget.purposeCategory,
    budget.releaseDate,
    budget.requestedAmount,
    budget.status,
    budget.venue,
    completedDocs,
    docFiles,
    liquidation.deadlineAt,
    liquidation.goSignalAt,
    liquidation.hardCopySubmittedAt,
    liquidation.status,
    markNotificationRead,
    navigate,
    profile.address,
    profile.adviserName,
    profile.barangay,
    profile.contactNumber,
    profile.facebookPageUrl,
    profile.organizationEmail,
    profile.organizationName,
    profile.organizationType,
    profile.profileStatus,
    profile.representativeName,
    profilePercent,
    section,
    setDocumentSubmissionStatus,
    mergeRemoteState,
    openFile,
    openPreview,
    previewEmptyMessage,
    previewModalOpen,
    previewTitle,
    previewUrl,
    state.templates,
    state.notifications,
    state.newsReleases,
    state.transparencyPosts,
    submission.id,
    submission.status,
    updateDocumentFile,
    updateDocumentSubmission,
    user,
    validDocumentTypeIds,
    templateDocuments,
    templatesById,
    uploadingDocumentId,
    documentsPercent,
    budgetPercent,
    liquidationPercent,
  ]);

  return (
    <>
      <UserPortalShell
        title="Organization Portal"
        subtitle="Organization User"
        groups={userNavigationGroups}
        activeId={section}
        onNavigate={(id) => navigate(userRouteMap[id] ?? userRouteMap.dashboard)}
        onSignOut={() => void signOut()}
      >
        {activeContent}
      </UserPortalShell>
      <Dialog
        open={previewModalOpen}
        onOpenChange={(open) => {
          setPreviewModalOpen(open);
          if (!open) {
            setPreviewUrl("");
            setPreviewTitle("");
            setPreviewEmptyMessage("");
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
            ) : (
              <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">
                {previewEmptyMessage || "No file uploaded yet."}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
