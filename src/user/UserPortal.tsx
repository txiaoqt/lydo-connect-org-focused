import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, Download, Eye, FileUp, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PortalEmptyState, PortalMetricCard, PortalSection, PortalStatusBadge } from "@/components/portal/portal-ui";
import { UserPortalShell } from "@/components/portal/UserPortalShell";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { useLydoConnect } from "@/lib/lydo-connect-store";
import {
  type BudgetRequest,
  advocacyOptions,
  majorClassificationOptions,
  type LiquidationReport,
  type LiquidationReportFile,
  statusLabelMap,
  subClassificationOptions,
  type OrganizationProfile,
  userNavigationGroups,
  userRouteMap,
} from "@/lib/lydo-connect-data";
import {
  loadLydoConnectSupabaseState,
  createBudgetRequestInSupabase,
  updateBudgetRequestInSupabase,
  deleteBudgetRequestInSupabase,
  uploadBudgetRequestFileToSupabase,
  createLiquidationReportFileInSupabase,
  resolveSupabaseFileUrl,
  upsertOrganizationProfileInSupabase,
  submitOrganizationDocumentToSupabase,
} from "@/lib/lydo-connect-supabase";
import { scanPdfForOcr, type DocumentOcrIssue, type DocumentOcrScanResult } from "@/lib/document-ocr";

const getReadiness = (filled: number, total: number) => (total === 0 ? 0 : Math.round((filled / total) * 100));
const hasUploadedTemplateFile = (fileUrl?: string, fileName?: string) =>
  Boolean(fileName?.trim() && fileUrl?.trim() && !fileUrl.startsWith("#"));
const formatStatusLabel = (status: string) => statusLabelMap[status] ?? status.replaceAll("_", " ");
const formatCurrency = (value: number) => `PHP ${value.toLocaleString()}`;
const approvedBudgetStatuses = new Set<BudgetRequest["status"]>([
  "approved_for_ftf_green",
  "budget_released",
  "completed",
]);

const createBlankOrganizationProfile = (userId: string): OrganizationProfile => ({
  id: `draft-${userId || "organization"}`,
  userId,
  organizationName: "",
  organizationEmail: "",
  contactNumber: "",
  barangay: "",
  majorClassification: "",
  subClassification: "",
  advocacies: [],
  adviserName: "",
  representativeName: "",
  address: "",
  facebookPageUrl: "",
  profileStatus: "incomplete",
  internalNotes: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createBlankBudgetRequest = (organizationId: string, submittedBy: string): BudgetRequest => ({
  id: `budget-${organizationId || "draft"}-${Date.now()}`,
  organizationId,
  submittedBy,
  activityTitle: "",
  activityDescription: "",
  activityDate: "",
  venue: "",
  requestedAmount: 0,
  approvedAmount: 0,
  releasedAmount: 0,
  releaseDate: "",
  purposeCategory: "",
  status: "draft",
  remarks: "",
  goSignalAt: "",
  hardCopySubmittedAt: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export default function UserPortal({ section }: { section: string }) {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const {
    state,
    mergeRemoteState,
    upsertOrganizationProfile,
    updateDocumentFile,
    updateDocumentSubmission,
    markNotificationRead,
  } = useLydoConnect();
  const [scanningDocumentId, setScanningDocumentId] = useState<string | null>(null);
  const [submittingDocumentId, setSubmittingDocumentId] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [ocrPreviewOpen, setOcrPreviewOpen] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [submissionSuccessOpen, setSubmissionSuccessOpen] = useState(false);
  const [savingBudgetRequest, setSavingBudgetRequest] = useState(false);
  const [budgetFileDraft, setBudgetFileDraft] = useState<File | null>(null);
  const [budgetForm, setBudgetForm] = useState<BudgetRequest>(() =>
    createBlankBudgetRequest(user?.id ?? "", user?.id ?? ""),
  );
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewEmptyMessage, setPreviewEmptyMessage] = useState("");
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState("");
  const [pendingDocumentScan, setPendingDocumentScan] = useState<{
    documentTypeId: string;
    documentTypeName: string;
    file: File;
    result: DocumentOcrScanResult;
  } | null>(null);
  const currentProfile = state.organizationProfiles.find((item) => item.userId === user?.id) ?? null;
  const [profileDraft, setProfileDraft] = useState<OrganizationProfile>(
    currentProfile ? { ...currentProfile, advocacies: [...currentProfile.advocacies] } : createBlankOrganizationProfile(user?.id ?? ""),
  );

  useEffect(() => {
    setProfileDraft(
      currentProfile
        ? { ...currentProfile, advocacies: [...currentProfile.advocacies] }
        : createBlankOrganizationProfile(user?.id ?? ""),
    );
  }, [currentProfile, user?.id]);

  useEffect(() => {
    if (!user) return;
    setBudgetForm((current) =>
      current.organizationId === (currentProfile?.id ?? "")
        ? current
        : createBlankBudgetRequest(currentProfile?.id ?? "", user.id),
    );
  }, [currentProfile?.id, user]);

  useEffect(() => {
    return () => {
      if (ocrPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(ocrPreviewUrl);
      }
    };
  }, [ocrPreviewUrl]);

  useEffect(() => {
    if (!ocrPreviewOpen || ocrPreviewUrl || !pendingDocumentScan) return;
    setOcrPreviewUrl(URL.createObjectURL(pendingDocumentScan.file));
  }, [ocrPreviewOpen, ocrPreviewUrl, pendingDocumentScan]);

  const profile = currentProfile ?? createBlankOrganizationProfile(user?.id ?? "");
  const submission = state.documentSubmissions[0] ?? null;
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
  const submissionId = submission?.id ?? "";
  const docFiles = state.documentSubmissionFiles.filter(
    (file) => file.submissionId === submissionId && validDocumentTypeIds.has(file.documentTypeId),
  );
  const budgetRequests = useMemo(
    () =>
      state.budgetRequests
        .filter((request) => request.organizationId === currentProfile?.id)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [currentProfile?.id, state.budgetRequests],
  );
  const latestBudget = budgetRequests[0] ?? null;
  const liquidationReports = useMemo(
    () =>
      state.liquidationReports
        .filter(
          (report) =>
            report.organizationId === currentProfile?.id &&
            budgetRequests.some(
              (request) =>
                request.id === report.budgetRequestId && approvedBudgetStatuses.has(request.status),
            ),
        )
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [budgetRequests, currentProfile?.id, state.liquidationReports],
  );
  const latestLiquidation = liquidationReports[0] ?? null;
  const budgetRequestFilesByBudgetId = useMemo(
    () => new Map(state.budgetRequestFiles.map((file) => [file.budgetRequestId, file])),
    [state.budgetRequestFiles],
  );
  const liquidationFilesByReportId = useMemo(() => {
    const map = new Map<string, LiquidationReportFile[]>();
    state.liquidationReportFiles.forEach((file) => {
      const files = map.get(file.liquidationReportId) ?? [];
      files.push(file);
      map.set(file.liquidationReportId, files);
    });
    return map;
  }, [state.liquidationReportFiles]);
  const templatesById = useMemo(
    () => Object.fromEntries(templateDocuments.map((template) => [template.id, template])),
    [templateDocuments],
  );
  const completedDocs = docFiles.filter((file) => file.validationStatus === "correct").length;
  const profilePercent = currentProfile
    ? getReadiness(
        [
          currentProfile.organizationName,
          currentProfile.organizationEmail,
          currentProfile.contactNumber,
          currentProfile.barangay,
          currentProfile.majorClassification,
          currentProfile.subClassification,
          currentProfile.advocacies.length > 0 ? "advocacies" : "",
          currentProfile.adviserName,
          currentProfile.representativeName,
          currentProfile.address,
        ].filter(Boolean).length,
        10,
      )
    : 0;
  const profileDraftPercent = getReadiness(
    [
      profileDraft.organizationName,
      profileDraft.organizationEmail,
      profileDraft.contactNumber,
      profileDraft.barangay,
      profileDraft.majorClassification,
      profileDraft.subClassification,
      profileDraft.advocacies.length > 0 ? "advocacies" : "",
      profileDraft.adviserName,
      profileDraft.representativeName,
      profileDraft.address,
    ].filter(Boolean).length,
    10,
  );
  const documentsPercent = getReadiness(completedDocs, templateDocuments.length);
  const budgetPercent = latestBudget ? getReadiness(approvedBudgetStatuses.has(latestBudget.status) ? 1 : 0, 1) : 0;
  const liquidationPercent = latestLiquidation ? getReadiness(latestLiquidation.status === "completed_liquidated" ? 1 : 0, 1) : 0;

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

  const resetDocumentScan = () => {
    setPendingDocumentScan(null);
    setConfirmSubmitOpen(false);
    setOcrPreviewOpen(false);
    setSubmissionSuccessOpen(false);
    setOcrPreviewUrl("");
  };

  const handleDocumentUpload = async (documentTypeName: string, file: File | null) => {
    if (!file) return;

    const localDocumentType = templateDocuments.find((documentType) => documentType.name === documentTypeName);
    if (!localDocumentType) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast({
        title: "PDF only",
        description: "Please upload a PDF file. Other file types are not accepted for document submission.",
        variant: "destructive",
      });
      return;
    }

    setScanningDocumentId(localDocumentType.id);
    const previewObjectUrl = URL.createObjectURL(file);

    try {
      const result = await scanPdfForOcr(file);
      setPendingDocumentScan({
        documentTypeId: localDocumentType.id,
        documentTypeName,
        file,
        result,
      });
      setOcrPreviewUrl(previewObjectUrl);
      setOcrPreviewOpen(true);
      setConfirmSubmitOpen(false);
      setSubmissionSuccessOpen(false);
    } catch (error) {
      URL.revokeObjectURL(previewObjectUrl);
      toast({
        title: "OCR scan failed",
        description: error instanceof Error ? error.message : "The PDF could not be scanned right now.",
        variant: "destructive",
      });
    } finally {
      setScanningDocumentId(null);
    }
  };

  const submitScannedDocument = async () => {
    if (!pendingDocumentScan || !user) return;
    if (!pendingDocumentScan.result.canSubmit) {
      toast({
        title: "Reupload required",
        description: "The OCR scan did not meet the approval threshold. Please upload a cleaner PDF.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingDocumentId(pendingDocumentScan.documentTypeId);

    try {
      const warningNotes = pendingDocumentScan.result.issues
        .filter((issue) => issue.severity === "warning")
        .map((issue) => issue.title)
        .join("; ");

      const submissionResult = await submitOrganizationDocumentToSupabase({
        documentTypeName: pendingDocumentScan.documentTypeName,
        file: pendingDocumentScan.file,
        ocrText: pendingDocumentScan.result.text,
        ocrConfidence: pendingDocumentScan.result.confidence,
        validationStatus: "correct",
        adminRemarks: warningNotes ? `OCR review notes: ${warningNotes}` : "Awaiting admin review.",
      });

      updateDocumentFile(submissionResult.file.id, submissionResult.file);
      const remoteSnapshot = await loadLydoConnectSupabaseState();
      if (remoteSnapshot) {
        mergeRemoteState(remoteSnapshot);
      }

      setConfirmSubmitOpen(false);
      setOcrPreviewOpen(false);
      setSubmissionSuccessOpen(true);
      toast({
        title: "Document submitted",
        description: "The OCR-checked PDF has been submitted for admin approval.",
      });
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "The document could not be submitted.",
        variant: "destructive",
      });
    } finally {
      setSubmittingDocumentId(null);
    }
  };

  const handleProfileFieldChange = <K extends keyof OrganizationProfile>(field: K, value: OrganizationProfile[K]) => {
    setProfileDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleAdvocacy = (advocacy: OrganizationProfile["advocacies"][number]) => {
    setProfileDraft((current) => ({
      ...current,
      advocacies: current.advocacies.includes(advocacy)
        ? current.advocacies.filter((item) => item !== advocacy)
        : [...current.advocacies, advocacy],
    }));
  };

  const saveOrganizationProfile = async () => {
    if (!user) return;

    const trimmedProfile: OrganizationProfile = {
      ...profileDraft,
      userId: user.id,
      organizationName: profileDraft.organizationName.trim(),
      organizationEmail: profileDraft.organizationEmail.trim(),
      contactNumber: profileDraft.contactNumber.trim(),
      barangay: profileDraft.barangay.trim(),
      majorClassification: profileDraft.majorClassification,
      subClassification: profileDraft.subClassification,
      advocacies: [...profileDraft.advocacies],
      adviserName: profileDraft.adviserName.trim(),
      representativeName: profileDraft.representativeName.trim(),
      address: profileDraft.address.trim(),
      facebookPageUrl: profileDraft.facebookPageUrl.trim(),
      profileStatus: "pending_review",
      internalNotes: profileDraft.internalNotes.trim(),
      updatedAt: new Date().toISOString(),
      createdAt: currentProfile?.createdAt ?? profileDraft.createdAt ?? new Date().toISOString(),
    };

    if (
      !trimmedProfile.organizationName ||
      !trimmedProfile.organizationEmail ||
      !trimmedProfile.contactNumber ||
      !trimmedProfile.barangay ||
      !trimmedProfile.majorClassification ||
      !trimmedProfile.subClassification ||
      trimmedProfile.advocacies.length === 0
    ) {
      toast({
        title: "Complete the profile",
        description: "Please fill in the required organization details, classifications, and at least one advocacy.",
        variant: "destructive",
      });
      return;
    }

    setSavingProfile(true);
    try {
      const savedProfile = await upsertOrganizationProfileInSupabase(trimmedProfile);
      upsertOrganizationProfile(savedProfile);
      setProfileDraft(savedProfile);

      toast({
        title: "Profile saved",
        description: "Your organization profile has been updated and sent for admin review.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "The organization profile could not be saved.",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const resetBudgetForm = () => {
    setBudgetForm(createBlankBudgetRequest(currentProfile?.id ?? "", user?.id ?? ""));
    setBudgetFileDraft(null);
  };

  const startEditingBudgetRequest = (request: BudgetRequest) => {
    setBudgetForm({ ...request });
    setBudgetFileDraft(null);
  };

  const saveBudgetRequest = async (status: BudgetRequest["status"] = budgetForm.status) => {
    if (!user || !currentProfile) {
      toast({
        title: "Complete your organization profile first",
        description: "Budget requests need an organization profile before they can be saved.",
        variant: "destructive",
      });
      return;
    }

    const nextBudgetRequest: BudgetRequest = {
      ...budgetForm,
      organizationId: currentProfile.id,
      submittedBy: user.id,
      activityTitle: budgetForm.activityTitle.trim(),
      activityDescription: budgetForm.activityDescription.trim(),
      activityDate: budgetForm.activityDate,
      venue: budgetForm.venue.trim(),
      requestedAmount: Number(budgetForm.requestedAmount || 0),
      approvedAmount: Number(budgetForm.approvedAmount || 0),
      releasedAmount: Number(budgetForm.releasedAmount || 0),
      releaseDate: budgetForm.releaseDate,
      purposeCategory: budgetForm.purposeCategory.trim(),
      status,
      remarks: budgetForm.remarks.trim(),
      goSignalAt: budgetForm.goSignalAt,
      hardCopySubmittedAt: budgetForm.hardCopySubmittedAt,
      updatedAt: new Date().toISOString(),
      createdAt: budgetForm.createdAt || new Date().toISOString(),
    };

    if (
      !nextBudgetRequest.activityTitle ||
      !nextBudgetRequest.activityDescription ||
      !nextBudgetRequest.activityDate ||
      !nextBudgetRequest.venue ||
      !nextBudgetRequest.requestedAmount ||
      !nextBudgetRequest.purposeCategory
    ) {
      toast({
        title: "Complete the budget form",
        description: "Activity title, description, proposed date, venue, requested amount, and purpose/category are required.",
        variant: "destructive",
      });
      return;
    }

    setSavingBudgetRequest(true);
    try {
      const isExisting = budgetRequests.some((request) => request.id === nextBudgetRequest.id);
      const file = budgetFileDraft;

      if (isExisting) {
        await updateBudgetRequestInSupabase(nextBudgetRequest.id, nextBudgetRequest);
        if (file) {
          await uploadBudgetRequestFileToSupabase(nextBudgetRequest.id, file);
        }
      } else {
        await createBudgetRequestInSupabase({
          budgetRequest: nextBudgetRequest,
          file,
        });
      }

      const remoteSnapshot = await loadLydoConnectSupabaseState();
      if (remoteSnapshot) {
        mergeRemoteState(remoteSnapshot);
      }
      resetBudgetForm();
      toast({
        title: isExisting ? "Budget request updated" : "Budget request saved",
        description:
          status === "submitted"
            ? "The budget request is now ready for admin review."
            : "The budget request has been saved as a draft.",
      });
    } catch (error) {
      toast({
        title: "Unable to save budget request",
        description: error instanceof Error ? error.message : "The budget request could not be saved right now.",
        variant: "destructive",
      });
    } finally {
      setSavingBudgetRequest(false);
    }
  };

  const handleDeleteBudgetRequest = (request: BudgetRequest) => {
    if (!window.confirm(`Delete budget request "${request.activityTitle}"?`)) return;
    void (async () => {
      try {
        await deleteBudgetRequestInSupabase(request.id);
        const remoteSnapshot = await loadLydoConnectSupabaseState();
        if (remoteSnapshot) {
          mergeRemoteState(remoteSnapshot);
        }
        if (budgetForm.id === request.id) {
          resetBudgetForm();
        }
        toast({
          title: "Budget request deleted",
          description: "The request and its attached files were removed.",
        });
      } catch (error) {
        toast({
          title: "Delete failed",
          description: error instanceof Error ? error.message : "The budget request could not be deleted right now.",
          variant: "destructive",
        });
      }
    })();
  };

  const handleLiquidationFileUpload = async (report: LiquidationReport, fileList: FileList | null) => {
    if (!fileList?.length) return;

    try {
      for (const file of Array.from(fileList)) {
        await createLiquidationReportFileInSupabase({
          liquidationReportId: report.id,
          file,
        });
      }

      const remoteSnapshot = await loadLydoConnectSupabaseState();
      if (remoteSnapshot) {
        mergeRemoteState(remoteSnapshot);
      }

      toast({
        title: "Liquidation files uploaded",
        description: "The post-activity documents were attached to the liquidation record.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "The liquidation files could not be uploaded.",
        variant: "destructive",
      });
    }
  };

  const activeContent = useMemo(() => {
    switch (section) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <PortalMetricCard label="Profile" value={`${profilePercent}%`} helper={formatStatusLabel(profile.profileStatus)} />
              <PortalMetricCard label="Documents" value={`${documentsPercent}%`} helper={`${completedDocs}/${templateDocuments.length} checked`} />
              <PortalMetricCard label="Budget" value={`${budgetPercent}%`} helper={formatStatusLabel(latestBudget?.status ?? "draft")} />
              <PortalMetricCard
                label="Liquidation"
                value={`${liquidationPercent}%`}
                helper={formatStatusLabel(latestLiquidation?.status ?? "pending_activity_completion")}
              />
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
                  <Button key={id} type="button" variant="outline" className="w-full justify-between" onClick={() => navigate(userRouteMap[id])}>
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
                    <p>{submission?.status === "under_admin_review" ? "Wait for admin review remarks." : "Complete the remaining required documents."}</p>
                    <p>
                      {latestBudget?.status === "approved_for_ftf_green"
                        ? "Prepare hard copies for face-to-face submission."
                        : latestBudget
                          ? "Budget request is ready for administrative review."
                          : "Create your first budget request to start the review flow."}
                    </p>
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
                      {submission ? <PortalStatusBadge status={submission.status} /> : <span className="text-muted-foreground">No submission yet</span>}
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span>Budget</span>
                      {latestBudget ? <PortalStatusBadge status={latestBudget.status} /> : <span className="text-muted-foreground">No request yet</span>}
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span>Liquidation</span>
                      {latestLiquidation ? <PortalStatusBadge status={latestLiquidation.status} /> : <span className="text-muted-foreground">Locked</span>}
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
            description="Edit the organization profile linked to your account. Save changes to update the admin dashboard review record."
            action={<PortalStatusBadge status={profileDraft.profileStatus} />}
          >
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="border-border/70">
                <CardContent className="space-y-5 p-4 sm:p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldGroup label="Organization Name" required>
                      <input
                        value={profileDraft.organizationName}
                        onChange={(event) => handleProfileFieldChange("organizationName", event.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                        placeholder="Enter organization name"
                      />
                    </FieldGroup>
                    <FieldGroup label="Organization Email" required>
                      <input
                        type="email"
                        value={profileDraft.organizationEmail}
                        onChange={(event) => handleProfileFieldChange("organizationEmail", event.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                        placeholder="Enter organization email"
                      />
                    </FieldGroup>
                    <FieldGroup label="Contact Number" required>
                      <input
                        value={profileDraft.contactNumber}
                        onChange={(event) => handleProfileFieldChange("contactNumber", event.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                        placeholder="09XXXXXXXXX"
                      />
                    </FieldGroup>
                    <FieldGroup label="Barangay" required>
                      <input
                        value={profileDraft.barangay}
                        onChange={(event) => handleProfileFieldChange("barangay", event.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                        placeholder="Enter barangay"
                      />
                    </FieldGroup>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldGroup label="Major Classification" required>
                      <select
                        value={profileDraft.majorClassification}
                        onChange={(event) =>
                          handleProfileFieldChange("majorClassification", event.target.value as OrganizationProfile["majorClassification"])
                        }
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                      >
                        <option value="">Select major classification</option>
                        {majorClassificationOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </FieldGroup>
                    <FieldGroup label="Sub Classification" required>
                      <select
                        value={profileDraft.subClassification}
                        onChange={(event) =>
                          handleProfileFieldChange("subClassification", event.target.value as OrganizationProfile["subClassification"])
                        }
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                      >
                        <option value="">Select sub classification</option>
                        {subClassificationOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </FieldGroup>
                  </div>

                  <FieldGroup label="Advocacies" required>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {advocacyOptions.map((advocacy) => (
                        <label
                          key={advocacy}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 text-sm transition-colors hover:bg-muted/40"
                        >
                          <input
                            type="checkbox"
                            checked={profileDraft.advocacies.includes(advocacy)}
                            onChange={() => toggleAdvocacy(advocacy)}
                            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <span className="capitalize">{advocacy}</span>
                        </label>
                      ))}
                    </div>
                  </FieldGroup>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldGroup label="Representative">
                      <input
                        value={profileDraft.representativeName}
                        onChange={(event) => handleProfileFieldChange("representativeName", event.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                        placeholder="Enter representative name"
                      />
                    </FieldGroup>
                    <FieldGroup label="Adviser">
                      <input
                        value={profileDraft.adviserName}
                        onChange={(event) => handleProfileFieldChange("adviserName", event.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                        placeholder="Enter adviser name"
                      />
                    </FieldGroup>
                  </div>

                  <FieldGroup label="Address">
                    <textarea
                      value={profileDraft.address}
                      onChange={(event) => handleProfileFieldChange("address", event.target.value)}
                      className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                      placeholder="Enter organization address"
                    />
                  </FieldGroup>

                  <FieldGroup label="Facebook Page">
                    <input
                      value={profileDraft.facebookPageUrl}
                      onChange={(event) => handleProfileFieldChange("facebookPageUrl", event.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                      placeholder="https://facebook.com/..."
                    />
                  </FieldGroup>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Save changes to update the shared profile record seen by the admin dashboard.
                    </p>
                    <Button type="button" onClick={() => void saveOrganizationProfile()} disabled={savingProfile}>
                      {savingProfile ? "Saving..." : "Save Profile"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Profile readiness</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Progress className="mt-1" value={profileDraftPercent} />
                    <p className="mt-3 text-sm text-muted-foreground">
                      {profileDraftPercent}% complete. Required details should stay updated so the organization can submit documents and budget requests.
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Saved Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0 text-sm">
                    {currentProfile ? (
                      <>
                        <p><span className="text-muted-foreground">Status:</span> {currentProfile.profileStatus.replaceAll("_", " ")}</p>
                        <p><span className="text-muted-foreground">Major:</span> {currentProfile.majorClassification || "N/A"}</p>
                        <p><span className="text-muted-foreground">Sub:</span> {currentProfile.subClassification || "N/A"}</p>
                        <div>
                          <p className="text-muted-foreground">Advocacies:</p>
                          {currentProfile.advocacies.length ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {currentProfile.advocacies.map((advocacy) => (
                                <span
                                  key={advocacy}
                                  className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-[11px] font-medium text-primary"
                                >
                                  {advocacy}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">N/A</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No saved profile yet. Fill out the form and save it to create the organization record.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </PortalSection>
        );
      case "document-submission":
        return (
          <div className="space-y-6">
            <PortalSection
              title="Document Submission"
              description="Upload a PDF, review the OCR preview, and submit only after you confirm the extracted details."
              action={submission ? <PortalStatusBadge status={submission.status} /> : null}
            >
              <div className="grid gap-4">
                {templateDocuments.map((documentType) => {
                  const file = docFiles.find((entry) => entry.documentTypeId === documentType.id);
                  const template = templatesById[documentType.id];
                  return (
                    <Card key={documentType.id} className="border-border/70">
                      <CardContent className="grid gap-4 p-4 sm:p-5 md:grid-cols-[1.7fr_1fr]">
                        <div className="space-y-2">
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                            <p className="font-medium leading-snug">{documentType.name}</p>
                            {file ? (
                              <PortalStatusBadge status={file.validationStatus === "correct" ? "ready_for_review" : "needs_revision"} />
                            ) : (
                              <span className="text-xs text-muted-foreground">No file uploaded yet</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{documentType.description}</p>
                          <p className="text-xs text-muted-foreground">Primary file type: PDF</p>
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            {hasUploadedTemplateFile(template?.templateFileUrl, template?.templateFileName) ? (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full sm:w-auto"
                                  onClick={() => void openPreview(template.templateFileUrl, template.templateFileName || documentType.name)}
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Template
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full sm:w-auto"
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
                                className="w-full sm:w-auto"
                                onClick={() => void openPreview(template?.templateFileUrl ?? "", template?.templateFileName || documentType.name)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Template
                              </Button>
                            )}
                            <label>
                              <input
                                type="file"
                                accept=".pdf,application/pdf"
                                className="sr-only"
                                onChange={(event) => {
                                  void handleDocumentUpload(documentType.name, event.target.files?.[0] ?? null);
                                  event.currentTarget.value = "";
                                }}
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                asChild
                                disabled={scanningDocumentId === documentType.id || submittingDocumentId === documentType.id}
                                className="w-full sm:w-auto"
                              >
                                <span>
                                  <FileUp className="mr-2 h-4 w-4" />
                                  {scanningDocumentId === documentType.id ? "Scanning..." : "Upload PDF"}
                                </span>
                              </Button>
                            </label>
                          </div>
                        </div>
                        {file ? (
                          <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                              <span className="text-muted-foreground">OCR status</span>
                              <span className="text-right">{formatStatusLabel(file.ocrStatus)}</span>
                            </div>
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                              <span className="text-muted-foreground">Confidence</span>
                              <span className="text-right">{file.ocrConfidence ? `${file.ocrConfidence}%` : "n/a"}</span>
                            </div>
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                              <span className="text-muted-foreground">Submission state</span>
                              <span className="text-right">{formatStatusLabel(submission?.status ?? "draft")}</span>
                            </div>
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                              <span className="text-muted-foreground">Admin remarks</span>
                              <span className="text-right">{file.adminRemarks || "Awaiting admin review."}</span>
                            </div>
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                              <span className="text-muted-foreground">Template</span>
                              <span className="break-all text-right">{template?.templateFileName || "Not uploaded yet"}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 p-4 text-sm text-muted-foreground">
                            No submitted file yet. Upload a PDF to run the OCR scanner and open the preview modal.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </PortalSection>

            <PortalSection
              title="Submission Flow"
              description="After OCR scans the file, a preview modal will show the extracted text, flags, and confidence. You must confirm before the PDF is submitted to LYDO."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">What happens next</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm text-muted-foreground">
                    Upload a PDF, inspect the OCR preview, confirm the details, and submit only when the confidence reaches 90% or higher.
                  </CardContent>
                </Card>
                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Current state</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm text-muted-foreground">
                    {submission ? (
                      <p>{formatStatusLabel(submission.status)}</p>
                    ) : (
                      <p>No submission has been created yet. It will appear automatically after the first confirmed PDF upload.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </PortalSection>
          </div>
        );
      case "budget-request":
        return (
          <div className="space-y-6">
            <PortalSection
              title="Budget Request"
              description="Create, edit, delete, and submit allocation requests from one page."
              action={<PortalStatusBadge status={latestBudget?.status ?? "draft"} />}
            >
              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <Card className="border-border/70">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {budgetRequests.some((request) => request.id === budgetForm.id) ? "Edit Budget Request" : "New Budget Request"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="budget-title">Activity Title</Label>
                        <Input
                          id="budget-title"
                          value={budgetForm.activityTitle}
                          onChange={(event) => setBudgetForm((current) => ({ ...current, activityTitle: event.target.value }))}
                          placeholder="Youth leadership training"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="budget-description">Description</Label>
                        <Textarea
                          id="budget-description"
                          value={budgetForm.activityDescription}
                          onChange={(event) => setBudgetForm((current) => ({ ...current, activityDescription: event.target.value }))}
                          placeholder="Explain the activity, expected participants, and goals."
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="budget-date">Proposed Date</Label>
                        <Input
                          id="budget-date"
                          type="date"
                          value={budgetForm.activityDate}
                          onChange={(event) => setBudgetForm((current) => ({ ...current, activityDate: event.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="budget-venue">Venue</Label>
                        <Input
                          id="budget-venue"
                          value={budgetForm.venue}
                          onChange={(event) => setBudgetForm((current) => ({ ...current, venue: event.target.value }))}
                          placeholder="LYDO Hall"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="budget-amount">Requested Amount</Label>
                        <Input
                          id="budget-amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={budgetForm.requestedAmount || ""}
                          onChange={(event) =>
                            setBudgetForm((current) => ({
                              ...current,
                              requestedAmount: Number(event.target.value || 0),
                            }))
                          }
                          placeholder="15000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="budget-category">Purpose and Category</Label>
                        <Input
                          id="budget-category"
                          value={budgetForm.purposeCategory}
                          onChange={(event) => setBudgetForm((current) => ({ ...current, purposeCategory: event.target.value }))}
                          placeholder="Capacity building / training"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="budget-remarks">Remarks</Label>
                        <Textarea
                          id="budget-remarks"
                          value={budgetForm.remarks}
                          onChange={(event) => setBudgetForm((current) => ({ ...current, remarks: event.target.value }))}
                          placeholder="Optional notes for the reviewer."
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="budget-file">Detailed Document</Label>
                        <Input
                          id="budget-file"
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                          onChange={(event) => setBudgetFileDraft(event.target.files?.[0] ?? null)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Upload the detailed budget document that contains the full breakdown and supporting details.
                        </p>
                        {budgetFileDraft ? <p className="text-xs text-foreground">Selected file: {budgetFileDraft.name}</p> : null}
                        {!budgetFileDraft && budgetRequestFilesByBudgetId.get(budgetForm.id) ? (
                          <p className="text-xs text-foreground">
                            Current file: {budgetRequestFilesByBudgetId.get(budgetForm.id)?.fileName}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        className="sm:w-auto"
                        disabled={savingBudgetRequest}
                        onClick={() => void saveBudgetRequest("draft")}
                      >
                        {savingBudgetRequest ? "Saving..." : "Save Draft"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="sm:w-auto"
                        disabled={savingBudgetRequest}
                        onClick={() => void saveBudgetRequest("submitted")}
                      >
                        Submit for Review
                      </Button>
                      <Button type="button" variant="ghost" className="sm:w-auto" onClick={resetBudgetForm}>
                        Reset
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {budgetRequests.length ? (
                    budgetRequests.map((request) => {
                      const attachedFile = budgetRequestFilesByBudgetId.get(request.id);
                      return (
                        <Card key={request.id} className="border-border/70">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <CardTitle className="text-base">{request.activityTitle || "Untitled request"}</CardTitle>
                                <p className="mt-1 text-sm text-muted-foreground">{request.purposeCategory || "No category yet"}</p>
                              </div>
                              <PortalStatusBadge status={request.status} />
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <p>{request.activityDescription || "No description provided yet."}</p>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <p>Proposed Date: {request.activityDate || "Pending"}</p>
                              <p>Venue: {request.venue || "Pending"}</p>
                              <p>Requested Amount: {formatCurrency(request.requestedAmount || 0)}</p>
                              <p>Approved Amount: {formatCurrency(request.approvedAmount || 0)}</p>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs">
                              {attachedFile ? (
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span>{attachedFile.fileName}</span>
                                  <Button type="button" size="sm" variant="outline" onClick={() => void openFile(attachedFile.fileUrl, attachedFile.fileName)}>
                                    Open File
                                  </Button>
                                </div>
                              ) : (
                                <p>No detailed document uploaded yet.</p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" size="sm" variant="outline" onClick={() => startEditingBudgetRequest(request)}>
                                Edit
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void (async () => {
                                    try {
                                      await updateBudgetRequestInSupabase(request.id, { status: "submitted" });
                                      const remoteSnapshot = await loadLydoConnectSupabaseState();
                                      if (remoteSnapshot) {
                                        mergeRemoteState(remoteSnapshot);
                                      }
                                    } catch (error) {
                                      toast({
                                        title: "Unable to update budget",
                                        description: error instanceof Error ? error.message : "The budget request could not be submitted right now.",
                                        variant: "destructive",
                                      });
                                    }
                                  })()
                                }
                                disabled={savingBudgetRequest}
                              >
                                Submit
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => handleDeleteBudgetRequest(request)}>
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <PortalEmptyState
                      title="No budget requests yet"
                      description="Create the first request using the form on the left. Once approved, the liquidation page will unlock automatically."
                    />
                  )}
                </div>
              </div>
            </PortalSection>
          </div>
        );
      case "liquidation-reporting":
        return (
          <PortalSection
            title="Liquidation and Reporting"
            description="Post-activity documents appear only after an approved budget request exists."
            action={<PortalStatusBadge status={latestLiquidation?.status ?? "pending_activity_completion"} />}
          >
            {liquidationReports.length ? (
              <div className="space-y-4">
                {liquidationReports.map((report) => {
                  const relatedBudget = budgetRequests.find((request) => request.id === report.budgetRequestId) ?? null;
                  const attachedFiles = liquidationFilesByReportId.get(report.id) ?? [];
                  return (
                    <Card key={report.id} className="border-border/70">
                      <CardHeader>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-base">{relatedBudget?.activityTitle || "Approved budget"}</CardTitle>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {relatedBudget?.purposeCategory || "No category"} | {relatedBudget ? formatCurrency(relatedBudget.approvedAmount || relatedBudget.requestedAmount || 0) : "PHP 0"}
                            </p>
                          </div>
                          <PortalStatusBadge status={report.status} />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm">
                        <div className="grid gap-3 md:grid-cols-2">
                          <Card className="bg-muted/20">
                            <CardContent className="p-4">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Go Signal Date</p>
                              <p className="mt-2 text-sm">{report.goSignalAt || "Pending"}</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-muted/20">
                            <CardContent className="p-4">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Deadline</p>
                              <p className="mt-2 text-sm">{report.deadlineAt || "Pending"}</p>
                            </CardContent>
                          </Card>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                          <Label htmlFor={`liquidation-upload-${report.id}`} className="text-sm font-medium text-foreground">
                            Upload post-activity documents
                          </Label>
                          <Input
                            id={`liquidation-upload-${report.id}`}
                            type="file"
                            multiple
                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                            className="mt-2"
                            onChange={async (event) => {
                              await handleLiquidationFileUpload(report, event.target.files);
                              event.currentTarget.value = "";
                            }}
                          />
                          <p className="mt-2 text-xs text-muted-foreground">
                            Upload attendance sheets, photos, narrative reports, and other post-activity proof.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">Uploaded files</p>
                          {attachedFiles.length ? (
                            <div className="space-y-2">
                              {attachedFiles.map((file) => (
                                <div key={file.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 p-3">
                                  <div>
                                    <p className="font-medium text-foreground">{file.fileName}</p>
                                    <p className="text-xs text-muted-foreground">{file.fileType}</p>
                                  </div>
                                  <Button type="button" size="sm" variant="outline" onClick={() => void openFile(file.fileUrl, file.fileName)}>
                                    Open File
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground">No post-activity files uploaded yet.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <PortalEmptyState
                title="No approved budget yet"
                description="Once the admin approves a budget request, its liquidation record will appear here for post-activity uploads."
              />
            )}
          </PortalSection>
        );
      case "news-releases":
        return (
          <PortalSection title="News Releases" description="Announcements and Facebook post previews.">
            <div className="grid gap-4 md:grid-cols-2">
              {state.newsReleases.map((news) => (
                <Link
                  key={news.id}
                  to={`/news-releases/${news.id}`}
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
                  <p className="mt-2 text-sm font-medium text-primary">Click to preview the source post</p>
                </Link>
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
                <PortalMetricCard label="Budget" value={formatStatusLabel(latestBudget?.status ?? "draft")} />
                <PortalMetricCard
                  label="Liquidation"
                  value={formatStatusLabel(latestLiquidation?.status ?? "pending_activity_completion")}
                />
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
    approvedBudgetStatuses,
    budgetFileDraft,
    budgetForm,
    budgetRequestFilesByBudgetId,
    budgetRequests,
    completedDocs,
    currentProfile,
    documentsPercent,
    docFiles,
    handleDeleteBudgetRequest,
    handleLiquidationFileUpload,
    latestBudget,
    latestLiquidation,
    liquidationFilesByReportId,
    liquidationPercent,
    liquidationReports,
    markNotificationRead,
    majorClassificationOptions,
    mergeRemoteState,
    navigate,
    openFile,
    openPreview,
    previewEmptyMessage,
    previewModalOpen,
    previewTitle,
    previewUrl,
    profile.address,
    profile.adviserName,
    profile.barangay,
    profile.contactNumber,
    profile.facebookPageUrl,
    profile.organizationEmail,
    profile.organizationName,
    profile.profileStatus,
    profile.representativeName,
    profileDraft,
    profilePercent,
    resetBudgetForm,
    saveBudgetRequest,
    savingBudgetRequest,
    savingProfile,
    section,
    state.newsReleases,
    state.notifications,
    state.templates,
    state.transparencyPosts,
    startEditingBudgetRequest,
    submission?.id,
    submission?.status,
    subClassificationOptions,
    templateDocuments,
    templatesById,
    toggleAdvocacy,
    updateDocumentFile,
    updateDocumentSubmission,
    user,
    validDocumentTypeIds,
    advocacyOptions,
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
        <DialogContent className="h-[100dvh] max-w-none overflow-hidden rounded-none border-0 p-0 sm:h-auto sm:max-w-5xl sm:rounded-xl sm:border">
          <div className="flex h-full flex-col sm:h-auto sm:max-h-[90vh]">
            <div className="border-b border-border/70 px-4 pb-3 pt-5 sm:px-6 sm:pb-4 sm:pt-6">
              <DialogHeader>
                <DialogTitle className="max-w-[calc(100vw-5rem)] break-words text-lg leading-tight sm:max-w-none sm:text-xl">
                  {previewTitle || "Template Preview"}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Preview the uploaded template file here.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="flex-1 overflow-hidden p-4 sm:p-6">
              <div className="h-[calc(100dvh-11rem)] overflow-hidden rounded-md border border-border/70 bg-muted/20 sm:h-[70vh]">
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={ocrPreviewOpen && Boolean(pendingDocumentScan)}
        onOpenChange={(open) => {
          setOcrPreviewOpen(open);
          if (!open) {
            setConfirmSubmitOpen(false);
            setOcrPreviewUrl("");
          }
        }}
      >
        <DialogContent className="max-w-[96vw] sm:max-w-6xl p-0 overflow-hidden">
          <div className="max-h-[92vh] overflow-y-auto">
            <div className="border-b border-border/70 px-4 pb-4 pt-5 sm:px-6 sm:pb-5">
              <DialogHeader>
                <DialogTitle>OCR Preview</DialogTitle>
                <DialogDescription>
                  Review the uploaded PDF, the fields we detected automatically, and any issues before you submit it to LYDO.
                </DialogDescription>
              </DialogHeader>
            </div>

            {pendingDocumentScan ? (
              <div className="space-y-5 px-4 py-5 sm:px-6">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Card className="bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Document</p>
                      <p className="mt-2 text-sm font-medium">{pendingDocumentScan.documentTypeName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{pendingDocumentScan.file.name}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Confidence</p>
                      <p className="mt-2 text-2xl font-semibold">{pendingDocumentScan.result.confidence}%</p>
                      <p className="mt-1 text-xs text-muted-foreground">Only 90% and above can be submitted.</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Pages scanned</p>
                      <p className="mt-2 text-2xl font-semibold">{pendingDocumentScan.result.pageCount}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {pendingDocumentScan.result.canSubmit ? "Ready for confirmation." : "Reupload is required."}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Fields detected</p>
                      <p className="mt-2 text-2xl font-semibold">{pendingDocumentScan.result.extractedFields.length}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {pendingDocumentScan.result.extractedFields.length ? "Structured values were found automatically." : "No structured fields were detected yet."}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                  <Card className="border-border/70">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Document Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
                        {ocrPreviewUrl ? (
                          <iframe
                            src={ocrPreviewUrl}
                            title={pendingDocumentScan.documentTypeName}
                            className="h-[28rem] w-full sm:h-[36rem] lg:h-[42rem]"
                          />
                        ) : (
                          <div className="grid h-[28rem] place-items-center p-6 text-center text-sm text-muted-foreground sm:h-[36rem] lg:h-[42rem]">
                            Preview unavailable.
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Tip: on mobile, scroll this dialog vertically and use the preview pane first before checking the extracted fields.
                      </p>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <Card className="border-border/70">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Extracted Fields</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {pendingDocumentScan.result.extractedFields.length ? (
                          <div className="space-y-3">
                            {pendingDocumentScan.result.extractedFields.map((field) => (
                              <div key={field.key} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{field.label}</p>
                                    <p className="mt-1 text-sm text-foreground/90 break-words">{field.value}</p>
                                  </div>
                                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                                    {field.confidence}%
                                  </span>
                                </div>
                                <p className="mt-2 text-[11px] text-muted-foreground">
                                  Auto-detected from: <span className="break-words">{field.source}</span>
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                            No structured fields were detected automatically yet. The raw OCR text is still available below for review.
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-border/70">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Flags and Review Notes</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {pendingDocumentScan.result.issues.length ? (
                          <div className="space-y-2">
                            {pendingDocumentScan.result.issues.map((issue, index) => (
                              <div
                                key={`${issue.title}-${index}`}
                                className={`rounded-xl border p-3 text-sm ${
                                  issue.severity === "error"
                                    ? "border-destructive/30 bg-destructive/5 text-destructive"
                                    : "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300"
                                }`}
                              >
                                <p className="font-medium">{issue.title}</p>
                                <p className="mt-1 text-sm opacity-90">{issue.description}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                            No OCR issues were detected. The file is ready for your confirmation.
                          </div>
                        )}
                        <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
                          If anything looks wrong, close this preview and reupload a cleaner PDF. The file will not be submitted until you confirm it.
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/70">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Raw OCR Text</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-border/70 bg-muted/20 p-4 text-xs leading-relaxed sm:text-sm">
                          {pendingDocumentScan.result.text || "No readable text was extracted."}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setOcrPreviewOpen(false)}>
                    Review Later
                  </Button>
                  <Button
                    type="button"
                    className="w-full sm:w-auto"
                    disabled={!pendingDocumentScan.result.canSubmit || submittingDocumentId === pendingDocumentScan.documentTypeId}
                    onClick={() => setConfirmSubmitOpen(true)}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Submit for Review
                  </Button>
                </DialogFooter>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={confirmSubmitOpen && Boolean(pendingDocumentScan)} onOpenChange={setConfirmSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Submission</DialogTitle>
            <DialogDescription>Are you sure the details are correct and checked by you?</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
            {pendingDocumentScan
              ? `${pendingDocumentScan.documentTypeName} will be submitted to LYDO and marked under review for admin approval.`
              : "The selected PDF will be submitted for admin approval."}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setConfirmSubmitOpen(false)}>
              No
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={submittingDocumentId === pendingDocumentScan?.documentTypeId}
              onClick={() => void submitScannedDocument()}
            >
              {submittingDocumentId === pendingDocumentScan?.documentTypeId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Yes, submit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={submissionSuccessOpen}
        onOpenChange={(open) => {
          setSubmissionSuccessOpen(open);
          if (!open) {
            resetDocumentScan();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Document Submitted</DialogTitle>
            <DialogDescription>
              The documents have been submitted to the LYDO. This will be subjected for approval.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
            Your submission is now under admin review. You can continue checking the other portal sections while the admin evaluates the file.
          </div>
          <DialogFooter>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => {
                setSubmissionSuccessOpen(false);
                resetDocumentScan();
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FieldGroup({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </label>
      {children}
    </div>
  );
}
