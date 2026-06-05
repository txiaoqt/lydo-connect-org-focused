import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, ClipboardList, Download, Eye, FileText, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { adminNavigationGroups as baseAdminNavigationGroups, type NewsRelease, type TransparencyPost } from "@/lib/lydo-connect-data";
import { useLydoConnect } from "@/lib/lydo-connect-store";
import {
  createAdminActivityLogInSupabase,
  createNewsReleaseInSupabase,
  createTransparencyPostInSupabase,
  createTemplateRecordInSupabase,
  deleteNewsReleaseInSupabase,
  deleteTransparencyPostInSupabase,
  updateBudgetRequestInSupabase,
  deleteTemplateRecordInSupabase,
  loadAdminPortalSupabaseState,
  loadLydoConnectSupabaseState,
  resolveSupabaseFileUrl,
  updateDocumentSubmissionFileReviewInSupabase,
  updateTransparencyPostInSupabase,
  updateLiquidationReportInSupabase,
  updateNewsReleaseInSupabase,
  updateOrganizationProfileReviewInSupabase,
  updateTemplateRecordInSupabase,
  uploadTemplateDocumentToSupabase,
} from "@/lib/lydo-connect-supabase";

const routeMap: Record<string, string> = {
  overview: "/admin",
  registrations: "/admin/registrations",
  users: "/admin/users",
  "budget-utilization": "/admin/budget-utilization",
  "liquidation-monitoring": "/admin/liquidation-monitoring",
  "news-releases": "/admin/news-releases",
  "public-transparency-posts": "/admin/public-transparency-posts",
  templates: "/admin/templates",
  notifications: "/admin/notifications",
  "activity-logs": "/admin/activity-logs",
};

const adminId = "admin-demo";
const splitNotificationsGroup = baseAdminNavigationGroups.map((group) =>
  group.items.some((item) => item.id === "notifications-activity")
    ? {
        ...group,
        items: group.items.flatMap((item) =>
          item.id === "notifications-activity"
            ? [
                { id: "notifications", label: "Notifications", icon: Bell },
                { id: "activity-logs", label: "Activity Logs", icon: ClipboardList },
              ]
            : [item],
        ),
      }
    : group,
);

const renderAdvocacyChips = (advocacies: string[]) =>
  advocacies.length ? (
    <div className="flex flex-wrap gap-2">
      {advocacies.map((advocacy) => (
        <span
          key={advocacy}
          className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-[11px] font-medium text-primary"
        >
          {advocacy}
        </span>
      ))}
    </div>
  ) : (
    <span className="text-sm text-muted-foreground">N/A</span>
  );

const formatVerifiedDateLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(date).toUpperCase();
};

const canInlinePreviewFile = (value: string) => /\.(pdf|png|jpe?g|gif|webp|svg)$/i.test(value);
const isImagePreviewFile = (value: string) => /\.(png|jpe?g|gif|webp|svg)$/i.test(value);

const renderRegistrationDetailCard = (params: {
  title: string;
  value: string;
  className?: string;
  wrap?: boolean;
  linkHref?: string;
}) => (
  <div className={`min-w-0 rounded-xl border border-border/70 bg-card p-4 shadow-sm ${params.className ?? ""}`.trim()}>
    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">{params.title}</p>
    {params.linkHref && params.value !== "N/A" ? (
      <a
        href={params.linkHref}
        target="_blank"
        rel="noreferrer"
        className={`mt-2 block text-sm font-medium text-primary underline-offset-4 hover:underline ${params.wrap ? "break-all" : ""}`}
      >
        {params.value}
      </a>
    ) : (
      <p className={`mt-2 text-sm font-medium text-foreground ${params.wrap ? "break-all" : ""}`}>
        {params.value}
      </p>
    )}
  </div>
);

type PendingAdminConfirmation =
  | {
      kind: "document";
      action: "approve" | "needs_revision" | "reject";
      fileId: string;
      submissionId: string;
      organizationId: string;
      organizationName: string;
      fileName: string;
      currentAdminRemarks: string;
    }
  | {
      kind: "profile";
      action: "verify" | "needs_update";
      organizationId: string;
      organizationName: string;
      userId: string;
    };

type PendingDeleteConfirmation =
  | {
      kind: "news_release";
      id: string;
      title: string;
    }
  | {
      kind: "transparency_post";
      id: string;
      title: string;
    };

export default function AdminPortal({ section }: { section: string }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { state, mergeRemoteState, createTemplate, removeTemplate, createNewsRelease, removeNewsRelease, updateNewsRelease, updateTransparencyPost, updateComplianceRemark, updateTemplate, createNotification, markNotificationRead } =
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
  const [previewEmptyMessage, setPreviewEmptyMessage] = useState("");
  const [previewCanInline, setPreviewCanInline] = useState(false);
  const [newsModalMode, setNewsModalMode] = useState<"create" | "edit" | null>(null);
  const [editingNewsReleaseId, setEditingNewsReleaseId] = useState<string | null>(null);
  const [newsTitleDraft, setNewsTitleDraft] = useState("");
  const [newsDescriptionDraft, setNewsDescriptionDraft] = useState("");
  const [newsFacebookPostUrlDraft, setNewsFacebookPostUrlDraft] = useState("");
  const [newsDatePostedDraft, setNewsDatePostedDraft] = useState("");
  const [newsVisibilityDraft, setNewsVisibilityDraft] = useState<NewsRelease["visibilityStatus"]>("draft");
  const [savingNewsRelease, setSavingNewsRelease] = useState(false);
  const [transparencyModalMode, setTransparencyModalMode] = useState<"create" | "edit" | null>(null);
  const [editingTransparencyPostId, setEditingTransparencyPostId] = useState<string | null>(null);
  const [transparencyTitleDraft, setTransparencyTitleDraft] = useState("");
  const [transparencyDescriptionDraft, setTransparencyDescriptionDraft] = useState("");
  const [transparencyCategoryDraft, setTransparencyCategoryDraft] = useState("");
  const [transparencyAttachmentUrlDraft, setTransparencyAttachmentUrlDraft] = useState("");
  const [transparencyPostDateDraft, setTransparencyPostDateDraft] = useState("");
  const [transparencyVisibilityDraft, setTransparencyVisibilityDraft] = useState<TransparencyPost["visibilityStatus"]>("draft");
  const [savingTransparencyPost, setSavingTransparencyPost] = useState(false);
  const [pendingAdminConfirmation, setPendingAdminConfirmation] = useState<PendingAdminConfirmation | null>(null);
  const [pendingDeleteConfirmation, setPendingDeleteConfirmation] = useState<PendingDeleteConfirmation | null>(null);
  const [approvalAcknowledged, setApprovalAcknowledged] = useState(false);
  const [processingAdminConfirmation, setProcessingAdminConfirmation] = useState(false);
  const [expandedRegistrationIds, setExpandedRegistrationIds] = useState<string[]>([]);
  const [expandedUserIds, setExpandedUserIds] = useState<string[]>([]);
  const [expandedDocumentFileIds, setExpandedDocumentFileIds] = useState<string[]>([]);
  const [documentReviewRemarksByFileId, setDocumentReviewRemarksByFileId] = useState<Record<string, string>>({});
  const [selectedBudgetRequestId, setSelectedBudgetRequestId] = useState<string | null>(null);
  const [selectedBudgetFileId, setSelectedBudgetFileId] = useState<string | null>(null);
  const [budgetPreviewUrl, setBudgetPreviewUrl] = useState("");
  const [budgetPreviewTitle, setBudgetPreviewTitle] = useState("");
  const [budgetPreviewEmptyMessage, setBudgetPreviewEmptyMessage] = useState("");
  const [budgetPreviewCanInline, setBudgetPreviewCanInline] = useState(false);
  const [budgetPreviewLoading, setBudgetPreviewLoading] = useState(false);
  const [selectedLiquidationReportId, setSelectedLiquidationReportId] = useState<string | null>(null);
  const [selectedLiquidationFileId, setSelectedLiquidationFileId] = useState<string | null>(null);
  const [liquidationPreviewUrl, setLiquidationPreviewUrl] = useState("");
  const [liquidationPreviewTitle, setLiquidationPreviewTitle] = useState("");
  const [liquidationPreviewEmptyMessage, setLiquidationPreviewEmptyMessage] = useState("");
  const [liquidationPreviewCanInline, setLiquidationPreviewCanInline] = useState(false);
  const [liquidationPreviewLoading, setLiquidationPreviewLoading] = useState(false);
  const [documentPreviewUrls, setDocumentPreviewUrls] = useState<Record<string, string>>({});
  const documentPreviewSourceRef = useRef<Record<string, string>>({});

  const profile = state.organizationProfiles[0] ?? null;
  const adminNotifications = state.notifications.filter((item) => item.userId === adminId);
  const unread = adminNotifications.filter((item) => !item.isRead).length;
  const templateDocuments = useMemo(
    () =>
      [...state.templates]
        .filter((template) => template.templateActive && template.isActive)
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [state.templates],
  );
  const newsReleases = useMemo(
    () =>
      [...state.newsReleases].sort((left, right) => {
        const dateDelta = new Date(right.datePosted).getTime() - new Date(left.datePosted).getTime();
        if (dateDelta !== 0) return dateDelta;
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }),
    [state.newsReleases],
  );
  const transparencyPosts = useMemo(
    () =>
      [...state.transparencyPosts].sort((left, right) => {
        const dateDelta = new Date(right.postDate).getTime() - new Date(left.postDate).getTime();
        if (dateDelta !== 0) return dateDelta;
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }),
    [state.transparencyPosts],
  );
  const selectedBudgetRequest = useMemo(
    () => state.budgetRequests.find((item) => item.id === selectedBudgetRequestId) ?? null,
    [selectedBudgetRequestId, state.budgetRequests],
  );
  const selectedBudgetRequestFiles = useMemo(
    () =>
      selectedBudgetRequest
        ? [...state.budgetRequestFiles]
            .filter((file) => file.budgetRequestId === selectedBudgetRequest.id)
            .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        : [],
    [selectedBudgetRequest, state.budgetRequestFiles],
  );
  const selectedBudgetRequestFile = useMemo(
    () => selectedBudgetRequestFiles.find((file) => file.id === selectedBudgetFileId) ?? selectedBudgetRequestFiles[0] ?? null,
    [selectedBudgetRequestFiles, selectedBudgetFileId],
  );
  const selectedBudgetOrganization = useMemo(
    () => state.organizationProfiles.find((org) => org.id === selectedBudgetRequest?.organizationId) ?? null,
    [selectedBudgetRequest?.organizationId, state.organizationProfiles],
  );
  const selectedLiquidationReport = useMemo(
    () => state.liquidationReports.find((item) => item.id === selectedLiquidationReportId) ?? null,
    [selectedLiquidationReportId, state.liquidationReports],
  );
  const selectedLiquidationReportFiles = useMemo(
    () =>
      selectedLiquidationReport
        ? [...state.liquidationReportFiles]
            .filter((file) => file.liquidationReportId === selectedLiquidationReport.id)
            .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        : [],
    [selectedLiquidationReport, state.liquidationReportFiles],
  );
  const selectedLiquidationReportFile = useMemo(
    () => selectedLiquidationReportFiles.find((file) => file.id === selectedLiquidationFileId) ?? selectedLiquidationReportFiles[0] ?? null,
    [selectedLiquidationReportFiles, selectedLiquidationFileId],
  );
  const selectedLiquidationBudgetRequest = useMemo(
    () => state.budgetRequests.find((item) => item.id === selectedLiquidationReport?.budgetRequestId) ?? null,
    [selectedLiquidationReport?.budgetRequestId, state.budgetRequests],
  );
  const selectedLiquidationOrganization = useMemo(
    () => state.organizationProfiles.find((org) => org.id === selectedLiquidationReport?.organizationId) ?? null,
    [selectedLiquidationReport?.organizationId, state.organizationProfiles],
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

  useEffect(() => {
    let isActive = true;
    const filesWithUploads = state.documentSubmissionFiles.filter((file) => file.fileUrl.trim());

    if (!filesWithUploads.length) {
      documentPreviewSourceRef.current = {};
      if (Object.keys(documentPreviewUrls).length > 0) {
        setDocumentPreviewUrls({});
      }
      return;
    }

    void (async () => {
      const nextUrls: Record<string, string> = {};
      const nextSources: Record<string, string> = {};
      const filesToResolve = filesWithUploads.filter((file) => {
        const existingSource = documentPreviewSourceRef.current[file.id];
        if (existingSource === file.fileUrl && documentPreviewUrls[file.id]) {
          nextUrls[file.id] = documentPreviewUrls[file.id];
          nextSources[file.id] = existingSource;
          return false;
        }
        return true;
      });

      const resolvedEntries = await Promise.all(
        filesToResolve.map(async (file) => {
          try {
            const resolvedUrl = await resolveSupabaseFileUrl(file.fileUrl);
            return [file.id, file.fileUrl, resolvedUrl ?? ""] as const;
          } catch {
            return [file.id, file.fileUrl, ""] as const;
          }
        }),
      );

      if (!isActive) return;
      for (const [fileId, sourceUrl, resolvedUrl] of resolvedEntries) {
        nextUrls[fileId] = resolvedUrl;
        nextSources[fileId] = sourceUrl;
      }
      const hasChanged =
        Object.keys(nextUrls).length !== Object.keys(documentPreviewUrls).length ||
        Object.entries(nextUrls).some(([fileId, resolvedUrl]) => documentPreviewUrls[fileId] !== resolvedUrl);
      if (!hasChanged) {
        documentPreviewSourceRef.current = nextSources;
        return;
      }
      documentPreviewSourceRef.current = nextSources;
      setDocumentPreviewUrls(nextUrls);
    })();

    return () => {
      isActive = false;
    };
  }, [documentPreviewUrls, state.documentSubmissionFiles]);

  useEffect(() => {
    let isActive = true;

    if (!selectedBudgetRequestFile) {
      setBudgetPreviewUrl("");
      setBudgetPreviewEmptyMessage(selectedBudgetRequest ? "No budget request file was uploaded." : "");
      setBudgetPreviewCanInline(false);
      setBudgetPreviewLoading(false);
      return;
    }

    const previewTitle = selectedBudgetRequestFile.fileName || selectedBudgetRequest.activityTitle || "Budget Request File";
    setBudgetPreviewTitle(previewTitle);

    if (!selectedBudgetRequestFile.fileUrl.trim()) {
      setBudgetPreviewUrl("");
      setBudgetPreviewEmptyMessage("No budget request file was uploaded.");
      setBudgetPreviewCanInline(false);
      setBudgetPreviewLoading(false);
      return;
    }

    setBudgetPreviewLoading(true);
    setBudgetPreviewEmptyMessage("");

    void (async () => {
      try {
        const resolvedUrl = await resolveSupabaseFileUrl(selectedBudgetRequestFile.fileUrl);
        if (!isActive) return;
        const finalUrl = resolvedUrl ?? "";
        setBudgetPreviewUrl(finalUrl);
        setBudgetPreviewCanInline(canInlinePreviewFile(previewTitle) || canInlinePreviewFile(finalUrl));
      } catch (error) {
        if (!isActive) return;
        setBudgetPreviewUrl("");
        setBudgetPreviewCanInline(false);
        setBudgetPreviewEmptyMessage(
          error instanceof Error ? error.message : "The budget request file preview could not be loaded right now.",
        );
      } finally {
        if (isActive) setBudgetPreviewLoading(false);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [selectedBudgetRequest?.id, selectedBudgetRequest?.activityTitle, selectedBudgetRequestFile?.id, selectedBudgetRequestFile?.fileUrl]);

  useEffect(() => {
    let isActive = true;

    if (!selectedLiquidationReportFile) {
      setLiquidationPreviewUrl("");
      setLiquidationPreviewEmptyMessage(selectedLiquidationReport ? "No liquidation file was uploaded." : "");
      setLiquidationPreviewCanInline(false);
      setLiquidationPreviewLoading(false);
      return;
    }

    const previewTitle =
      selectedLiquidationReportFile.fileName || selectedLiquidationBudgetRequest?.activityTitle || "Liquidation File";
    setLiquidationPreviewTitle(previewTitle);

    if (!selectedLiquidationReportFile.fileUrl.trim()) {
      setLiquidationPreviewUrl("");
      setLiquidationPreviewEmptyMessage("No liquidation file was uploaded.");
      setLiquidationPreviewCanInline(false);
      setLiquidationPreviewLoading(false);
      return;
    }

    setLiquidationPreviewLoading(true);
    setLiquidationPreviewEmptyMessage("");

    void (async () => {
      try {
        const resolvedUrl = await resolveSupabaseFileUrl(selectedLiquidationReportFile.fileUrl);
        if (!isActive) return;
        const finalUrl = resolvedUrl ?? "";
        setLiquidationPreviewUrl(finalUrl);
        setLiquidationPreviewCanInline(canInlinePreviewFile(previewTitle) || canInlinePreviewFile(finalUrl));
      } catch (error) {
        if (!isActive) return;
        setLiquidationPreviewUrl("");
        setLiquidationPreviewCanInline(false);
        setLiquidationPreviewEmptyMessage(
          error instanceof Error ? error.message : "The liquidation file preview could not be loaded right now.",
        );
      } finally {
        if (isActive) setLiquidationPreviewLoading(false);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [
    selectedLiquidationBudgetRequest?.activityTitle,
    selectedLiquidationReport?.id,
    selectedLiquidationReportFile?.id,
    selectedLiquidationReportFile?.fileUrl,
  ]);

  const refreshAdminState = async () => {
    const remoteSnapshot = (await loadAdminPortalSupabaseState()) ?? (await loadLydoConnectSupabaseState());
    if (remoteSnapshot) {
      mergeRemoteState(remoteSnapshot);
    }
  };

  const appendAuditLog = async (
    action: string,
    relatedType: string,
    relatedId: string,
    description: string,
    organizationId = profile?.id ?? "",
  ) => {
    await createAdminActivityLogInSupabase({
      organizationId,
      action,
      relatedType,
      relatedId,
      description,
    });
  };

  const notifyOrganizationUser = (params: {
    userId: string;
    organizationId: string;
    title: string;
    message: string;
    type: string;
    relatedType: string;
    relatedId: string;
  }) => {
    createNotification({
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: params.userId,
      organizationId: params.organizationId,
      title: params.title,
      message: params.message,
      type: params.type,
      relatedType: params.relatedType,
      relatedId: params.relatedId,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  };

  const openAdminConfirmation = (params: PendingAdminConfirmation) => {
    setPendingAdminConfirmation(params);
    setApprovalAcknowledged(false);
  };

  const closeAdminConfirmation = () => {
    if (processingAdminConfirmation) return;
    setPendingAdminConfirmation(null);
    setApprovalAcknowledged(false);
  };

  const toggleRegistrationCard = (organizationId: string) => {
    setExpandedRegistrationIds((current) =>
      current.includes(organizationId)
        ? current.filter((id) => id !== organizationId)
        : [...current, organizationId],
    );
  };

  const toggleUserCard = (organizationId: string) => {
    setExpandedUserIds((current) =>
      current.includes(organizationId)
        ? current.filter((id) => id !== organizationId)
        : [...current, organizationId],
    );
  };

  const toggleDocumentCard = (fileId: string) => {
    setExpandedDocumentFileIds((current) =>
      current.includes(fileId)
        ? current.filter((id) => id !== fileId)
        : [...current, fileId],
    );
  };

  const getDocumentReviewCommentDraft = (file: { id: string; adminStatus?: string | null; adminRemarks?: string | null }) => {
    const storedDraft = documentReviewRemarksByFileId[file.id];
    if (typeof storedDraft === "string") {
      return storedDraft;
    }

    if (file.adminStatus === "needs_revision" || file.adminStatus === "rejected_red") {
      return file.adminRemarks?.trim() || "";
    }

    return "";
  };

  const getAdminConfirmationCopy = () => {
    if (!pendingAdminConfirmation) {
      return {
        title: "",
        description: "",
        checkboxLabel: "",
        confirmLabel: "",
      };
    }

    if (pendingAdminConfirmation.kind === "document") {
      if (pendingAdminConfirmation.action === "approve") {
        return {
          title: "Confirm Document Approval",
          description: `Click the checkbox to acknowledge this approval before marking ${pendingAdminConfirmation.fileName} as approved.`,
          checkboxLabel: "I acknowledge this approval action.",
          confirmLabel: "Approve Submission",
        };
      }
      if (pendingAdminConfirmation.action === "needs_revision") {
        return {
          title: "Confirm Revision Request",
          description: `Click the checkbox to acknowledge this revision request before returning ${pendingAdminConfirmation.fileName} to the organization user.`,
          checkboxLabel: "I acknowledge this revision request.",
          confirmLabel: "Request Revision",
        };
      }
      return {
        title: "Confirm Document Rejection",
        description: `Click the checkbox to acknowledge this rejection before marking ${pendingAdminConfirmation.fileName} as rejected.`,
        checkboxLabel: "I acknowledge this rejection action.",
        confirmLabel: "Reject Submission",
      };
    }

    if (pendingAdminConfirmation.action === "verify") {
      return {
        title: "Confirm Organization Verification",
        description: `Click the checkbox to acknowledge this approval before verifying ${pendingAdminConfirmation.organizationName}.`,
        checkboxLabel: "I acknowledge this verification action.",
        confirmLabel: "Mark Verified",
      };
    }

    return {
      title: "Confirm Needs Update Status",
      description: `Click the checkbox to acknowledge this update request before marking ${pendingAdminConfirmation.organizationName} as needing changes.`,
      checkboxLabel: "I acknowledge this needs update action.",
      confirmLabel: "Mark Needs Update",
    };
  };

  const executeAdminConfirmation = async () => {
    if (!pendingAdminConfirmation) return;

    setProcessingAdminConfirmation(true);
    try {
      if (pendingAdminConfirmation.kind === "document") {
        const status =
          pendingAdminConfirmation.action === "approve"
            ? "approved_green"
            : pendingAdminConfirmation.action === "needs_revision"
              ? "needs_revision"
              : "rejected_red";
        const adminRemarks = (
          documentReviewRemarksByFileId[pendingAdminConfirmation.fileId] ?? pendingAdminConfirmation.currentAdminRemarks
        ).trim();

        if (pendingAdminConfirmation.action !== "approve" && !adminRemarks) {
          toast({
            title: "Comment required",
            description: "Please add a short comment before requesting a revision or rejection.",
            variant: "destructive",
          });
          return;
        }

        await updateDocumentSubmissionFileReviewInSupabase({
          fileId: pendingAdminConfirmation.fileId,
          status,
          adminRemarks: pendingAdminConfirmation.action === "approve" ? undefined : adminRemarks,
        });
        await refreshAdminState();

        if (pendingAdminConfirmation.action === "approve") {
          await appendAuditLog(
            "Approved document submission",
            "document_submission_file",
            pendingAdminConfirmation.fileId,
            `Approved ${pendingAdminConfirmation.fileName} from the registration detail view.`,
            pendingAdminConfirmation.organizationId,
          );
          toast({
            title: "Submission approved",
            description: `${pendingAdminConfirmation.organizationName}'s document submission is now approved.`,
          });
        } else if (pendingAdminConfirmation.action === "needs_revision") {
          await appendAuditLog(
            "Document revision requested",
            "document_submission_file",
            pendingAdminConfirmation.fileId,
            `Requested revisions for ${pendingAdminConfirmation.fileName} from the registration detail view.`,
            pendingAdminConfirmation.organizationId,
          );
          toast({
            title: "Revision requested",
            description: `${pendingAdminConfirmation.organizationName} was asked to revise the document submission.`,
          });
        } else {
          await appendAuditLog(
            "Rejected document submission",
            "document_submission_file",
            pendingAdminConfirmation.fileId,
            `Rejected ${pendingAdminConfirmation.fileName} from the registration detail view.`,
            pendingAdminConfirmation.organizationId,
          );
          toast({
            title: "Submission rejected",
            description: `${pendingAdminConfirmation.organizationName}'s document submission is now rejected.`,
          });
        }
      } else {
        if (pendingAdminConfirmation.action === "verify") {
          const verifiedAt = new Date().toISOString();
          await updateOrganizationProfileReviewInSupabase(pendingAdminConfirmation.organizationId, {
            profileStatus: "verified",
            verifiedAt,
          });
          await refreshAdminState();
          await appendAuditLog(
            "Verified organization",
            "organization_profile",
            pendingAdminConfirmation.organizationId,
            `Marked ${pendingAdminConfirmation.organizationName} as verified on ${formatVerifiedDateLabel(verifiedAt)}.`,
            pendingAdminConfirmation.organizationId,
          );
          toast({
            title: "Organization verified",
            description: `${pendingAdminConfirmation.organizationName} is now marked as verified.`,
          });
        } else {
          await updateOrganizationProfileReviewInSupabase(pendingAdminConfirmation.organizationId, {
            profileStatus: "needs_update",
            verifiedAt: "",
          });
          await refreshAdminState();
          await appendAuditLog(
            "Marked needs update",
            "organization_profile",
            pendingAdminConfirmation.organizationId,
            `Marked ${pendingAdminConfirmation.organizationName} for an organization profile update.`,
            pendingAdminConfirmation.organizationId,
          );
          toast({
            title: "Organization marked for update",
            description: `${pendingAdminConfirmation.organizationName} needs to update the submitted profile details.`,
          });
        }
      }

      setPendingAdminConfirmation(null);
      setApprovalAcknowledged(false);
    } catch (error) {
      toast({
        title: "Status update failed",
        description: error instanceof Error ? error.message : "The review action could not be completed right now.",
        variant: "destructive",
      });
    } finally {
      setProcessingAdminConfirmation(false);
    }
  };

  const resetTemplateForm = () => {
    setTemplateModalMode(null);
    setEditingTemplateId(null);
    setTemplateNameDraft("");
    setTemplateDescriptionDraft("");
    setTemplateFileDraft(null);
  };

  const resetNewsReleaseForm = () => {
    setNewsModalMode(null);
    setEditingNewsReleaseId(null);
    setNewsTitleDraft("");
    setNewsDescriptionDraft("");
    setNewsFacebookPostUrlDraft("");
    setNewsDatePostedDraft("");
    setNewsVisibilityDraft("draft");
  };

  const resetTransparencyForm = () => {
    setTransparencyModalMode(null);
    setEditingTransparencyPostId(null);
    setTransparencyTitleDraft("");
    setTransparencyDescriptionDraft("");
    setTransparencyCategoryDraft("");
    setTransparencyAttachmentUrlDraft("");
    setTransparencyPostDateDraft("");
    setTransparencyVisibilityDraft("draft");
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

  const startEditingNewsRelease = (newsReleaseId: string) => {
    const newsRelease = newsReleases.find((entry) => entry.id === newsReleaseId);
    if (!newsRelease) return;
    setNewsModalMode("edit");
    setEditingNewsReleaseId(newsReleaseId);
    setNewsTitleDraft(newsRelease.title);
    setNewsDescriptionDraft(newsRelease.description);
    setNewsFacebookPostUrlDraft(newsRelease.facebookPostUrl);
    setNewsDatePostedDraft(newsRelease.datePosted);
    setNewsVisibilityDraft(newsRelease.visibilityStatus);
  };

  const startEditingTransparencyPost = (postId: string) => {
    const post = transparencyPosts.find((entry) => entry.id === postId);
    if (!post) return;
    setTransparencyModalMode("edit");
    setEditingTransparencyPostId(postId);
    setTransparencyTitleDraft(post.title);
    setTransparencyDescriptionDraft(post.description);
    setTransparencyCategoryDraft(post.category);
    setTransparencyAttachmentUrlDraft(post.attachmentUrl);
    setTransparencyPostDateDraft(post.postDate);
    setTransparencyVisibilityDraft(post.visibilityStatus);
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
      await appendAuditLog("Created template", "template", newTemplate.databaseId, `Created template "${newTemplate.name}" and uploaded a new file.`);
      await refreshAdminState();
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

  const handleSaveNewsRelease = async () => {
    if (!newsTitleDraft.trim()) {
      toast({ title: "News title required", description: "Please enter a news release title.", variant: "destructive" });
      return;
    }
    if (!newsDescriptionDraft.trim()) {
      toast({ title: "Description required", description: "Please enter a news release description.", variant: "destructive" });
      return;
    }
    if (!newsFacebookPostUrlDraft.trim()) {
      toast({ title: "Facebook URL required", description: "Please enter the source post URL.", variant: "destructive" });
      return;
    }
    if (!newsDatePostedDraft) {
      toast({ title: "Date required", description: "Please select the posting date.", variant: "destructive" });
      return;
    }

    setSavingNewsRelease(true);
    try {
      if (newsModalMode === "edit" && editingNewsReleaseId) {
        const updatedNewsRelease = await updateNewsReleaseInSupabase(editingNewsReleaseId, {
          title: newsTitleDraft,
          description: newsDescriptionDraft,
          facebookPostUrl: newsFacebookPostUrlDraft,
          datePosted: newsDatePostedDraft,
          visibilityStatus: newsVisibilityDraft,
        });
        updateNewsRelease(editingNewsReleaseId, updatedNewsRelease);
        await appendAuditLog("Updated news release", "news_release", updatedNewsRelease.id, `Updated news release "${updatedNewsRelease.title}".`);
        await refreshAdminState();
        toast({ title: "News release updated", description: `${updatedNewsRelease.title} was updated successfully.` });
      } else {
        const createdNewsRelease = await createNewsReleaseInSupabase({
          title: newsTitleDraft,
          description: newsDescriptionDraft,
          facebookPostUrl: newsFacebookPostUrlDraft,
          datePosted: newsDatePostedDraft,
          visibilityStatus: newsVisibilityDraft,
        });
        createNewsRelease(createdNewsRelease);
        await appendAuditLog("Created news release", "news_release", createdNewsRelease.id, `Created news release "${createdNewsRelease.title}".`);
        await refreshAdminState();
        toast({ title: "News release created", description: `${createdNewsRelease.title} was added successfully.` });
      }
      resetNewsReleaseForm();
    } catch (error) {
      toast({
        title: newsModalMode === "edit" ? "Update failed" : "Create failed",
        description: error instanceof Error ? error.message : "The news release could not be saved.",
        variant: "destructive",
      });
    } finally {
      setSavingNewsRelease(false);
    }
  };

  const handleDeleteNewsRelease = async (newsReleaseId: string) => {
    const newsRelease = newsReleases.find((entry) => entry.id === newsReleaseId);
    if (!newsRelease) return;
    setPendingDeleteConfirmation({ kind: "news_release", id: newsReleaseId, title: newsRelease.title });
  };

  const handleDeleteTransparencyPost = async (postId: string) => {
    const post = transparencyPosts.find((entry) => entry.id === postId);
    if (!post) return;
    setPendingDeleteConfirmation({ kind: "transparency_post", id: postId, title: post.title });
  };

  const confirmDeleteRecord = async () => {
    const pending = pendingDeleteConfirmation;
    if (!pending) return;

    setPendingDeleteConfirmation(null);

    try {
      if (pending.kind === "news_release") {
        const newsRelease = newsReleases.find((entry) => entry.id === pending.id);
        if (!newsRelease) return;
        await deleteNewsReleaseInSupabase(pending.id);
        removeNewsRelease(pending.id);
        await appendAuditLog("Deleted news release", "news_release", newsRelease.id, `Deleted news release "${newsRelease.title}".`);
        await refreshAdminState();
        if (editingNewsReleaseId === pending.id) {
          resetNewsReleaseForm();
        }
        toast({ title: "News release deleted", description: `${newsRelease.title} was removed successfully.` });
        return;
      }

      const post = transparencyPosts.find((entry) => entry.id === pending.id);
      if (!post) return;
      await deleteTransparencyPostInSupabase(pending.id);
      await appendAuditLog("Deleted transparency post", "transparency_post", post.id, `Deleted transparency post "${post.title}".`);
      await refreshAdminState();
      if (editingTransparencyPostId === pending.id) {
        resetTransparencyForm();
      }
      toast({ title: "Transparency post deleted", description: `${post.title} was removed successfully.` });
    } catch (error) {
      toast({
        title: "Delete failed",
        description:
          error instanceof Error
            ? error.message
            : pending.kind === "news_release"
              ? "The news release could not be deleted."
              : "The transparency post could not be deleted.",
        variant: "destructive",
      });
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
        lookupName: template.name,
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
      await appendAuditLog("Updated template", "template", template.databaseId, `Updated template "${template.name}" to "${updatedTemplate.name}".`);
      await refreshAdminState();
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
      await deleteTemplateRecordInSupabase(template.databaseId, template.name);
      removeTemplate(template.id);
      await appendAuditLog("Deleted template", "template", template.databaseId, `Deleted template "${template.name}" from the active list.`);
      await refreshAdminState();
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
    if (!fileUrl.trim() || fileUrl.startsWith("#")) {
      setPreviewUrl("");
      setPreviewTitle(title);
      setPreviewEmptyMessage("No file uploaded yet.");
      setPreviewCanInline(false);
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
      setPreviewCanInline(canInlinePreviewFile(title) || canInlinePreviewFile(resolvedUrl));
      setPreviewModalOpen(true);
    } catch (error) {
      toast({
        title: "Unable to open preview",
        description: error instanceof Error ? error.message : "The file preview could not be opened right now.",
        variant: "destructive",
      });
    }
  };

  const openBudgetRequestDetails = (requestId: string) => {
    const requestFiles = [...state.budgetRequestFiles]
      .filter((file) => file.budgetRequestId === requestId)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

    setSelectedBudgetRequestId(requestId);
    setSelectedBudgetFileId(requestFiles[0]?.id ?? null);
  };

  const closeBudgetRequestDetails = () => {
    setSelectedBudgetRequestId(null);
    setSelectedBudgetFileId(null);
    setBudgetPreviewUrl("");
    setBudgetPreviewTitle("");
    setBudgetPreviewEmptyMessage("");
    setBudgetPreviewCanInline(false);
    setBudgetPreviewLoading(false);
  };

  const openLiquidationDetails = (reportId: string) => {
    const reportFiles = [...state.liquidationReportFiles]
      .filter((file) => file.liquidationReportId === reportId)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

    setSelectedLiquidationReportId(reportId);
    setSelectedLiquidationFileId(reportFiles[0]?.id ?? null);
  };

  const closeLiquidationDetails = () => {
    setSelectedLiquidationReportId(null);
    setSelectedLiquidationFileId(null);
    setLiquidationPreviewUrl("");
    setLiquidationPreviewTitle("");
    setLiquidationPreviewEmptyMessage("");
    setLiquidationPreviewCanInline(false);
    setLiquidationPreviewLoading(false);
  };

  const performBudgetRequestStatusUpdate = async (
    request: {
      id: string;
      organizationId: string;
      organizationName: string;
      submittedBy: string;
      activityTitle: string;
      requestedAmount: number;
    },
    action: "approve" | "needs_revision" | "reject",
  ) => {
    try {
      if (action === "approve") {
        await updateBudgetRequestInSupabase(request.id, {
          status: "approved_for_ftf_green",
          goSignalAt: new Date().toISOString(),
          approvedAmount: request.requestedAmount,
        });
        await refreshAdminState();
        notifyOrganizationUser({
          userId: request.submittedBy,
          organizationId: request.organizationId,
          title: "Budget request approved",
          message: "The admin approved your budget request and issued the go signal for the next step.",
          type: "budget_go_signal",
          relatedType: "budget_request",
          relatedId: request.id,
        });
        await appendAuditLog(
          "Approved budget request",
          "budget_request",
          request.id,
          `Marked budget request "${request.activityTitle}" as approved for face-to-face green.`,
          request.organizationId,
        );
        toast({
          title: "Budget approved",
          description: `${request.organizationName}'s budget request is now marked green.`,
        });
        return;
      }

      if (action === "needs_revision") {
        await updateBudgetRequestInSupabase(request.id, { status: "needs_revision" });
        await refreshAdminState();
        notifyOrganizationUser({
          userId: request.submittedBy,
          organizationId: request.organizationId,
          title: "Budget request needs revision",
          message: "The admin reviewed your budget request and requested revisions before approval.",
          type: "budget_revision",
          relatedType: "budget_request",
          relatedId: request.id,
        });
        await appendAuditLog(
          "Budget request needs revision",
          "budget_request",
          request.id,
          `Marked budget request "${request.activityTitle}" as needing revision.`,
          request.organizationId,
        );
        toast({
          title: "Revision requested",
          description: `${request.organizationName} was asked to revise the budget request.`,
        });
        return;
      }

      await updateBudgetRequestInSupabase(request.id, { status: "rejected_red" });
      await refreshAdminState();
      notifyOrganizationUser({
        userId: request.submittedBy,
        organizationId: request.organizationId,
        title: "Budget request rejected",
        message: "The admin rejected your budget request. Please review the requirements and submit an updated request if needed.",
        type: "budget_rejected",
        relatedType: "budget_request",
        relatedId: request.id,
      });
      await appendAuditLog(
        "Rejected budget request",
        "budget_request",
        request.id,
        `Rejected budget request "${request.activityTitle}".`,
        request.organizationId,
      );
      toast({
        title: "Budget rejected",
        description: `${request.organizationName}'s budget request was rejected.`,
      });
    } catch (error) {
      toast({
        title: "Unable to update budget",
        description: error instanceof Error ? error.message : "The budget request could not be updated right now.",
        variant: "destructive",
      });
    }
  };

  const selectedTemplate = editingTemplateId
    ? templateDocuments.find((template) => template.id === editingTemplateId) ?? null
    : null;

  const handleSaveTransparencyPost = async () => {
    if (!transparencyTitleDraft.trim()) {
      toast({ title: "Title required", description: "Please enter a transparency post title.", variant: "destructive" });
      return;
    }
    if (!transparencyDescriptionDraft.trim()) {
      toast({ title: "Description required", description: "Please enter a transparency post description.", variant: "destructive" });
      return;
    }
    if (!transparencyCategoryDraft.trim()) {
      toast({ title: "Category required", description: "Please enter a transparency category.", variant: "destructive" });
      return;
    }
    if (!transparencyPostDateDraft) {
      toast({ title: "Post date required", description: "Please select a post date.", variant: "destructive" });
      return;
    }

    setSavingTransparencyPost(true);
    try {
      if (transparencyModalMode === "edit" && editingTransparencyPostId) {
        const updatedPost = await updateTransparencyPostInSupabase(editingTransparencyPostId, {
          title: transparencyTitleDraft,
          description: transparencyDescriptionDraft,
          category: transparencyCategoryDraft,
          attachmentUrl: transparencyAttachmentUrlDraft,
          postDate: transparencyPostDateDraft,
          visibilityStatus: transparencyVisibilityDraft,
        });
        updateTransparencyPost(editingTransparencyPostId, updatedPost);
        await appendAuditLog("Updated transparency post", "transparency_post", updatedPost.id, `Updated transparency post "${updatedPost.title}".`);
        await refreshAdminState();
        toast({ title: "Transparency post updated", description: `${updatedPost.title} was updated successfully.` });
      } else {
        const createdPost = await createTransparencyPostInSupabase({
          title: transparencyTitleDraft,
          description: transparencyDescriptionDraft,
          category: transparencyCategoryDraft,
          attachmentUrl: transparencyAttachmentUrlDraft,
          postDate: transparencyPostDateDraft,
          visibilityStatus: transparencyVisibilityDraft,
        });
        await appendAuditLog("Created transparency post", "transparency_post", createdPost.id, `Created transparency post "${createdPost.title}".`);
        await refreshAdminState();
        toast({ title: "Transparency post created", description: `${createdPost.title} was added successfully.` });
      }
      resetTransparencyForm();
    } catch (error) {
      toast({
        title: transparencyModalMode === "edit" ? "Update failed" : "Create failed",
        description: error instanceof Error ? error.message : "The transparency post could not be saved.",
        variant: "destructive",
      });
    } finally {
      setSavingTransparencyPost(false);
    }
  };

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
                action={<PortalStatusBadge status={selectedOrg.profileStatus} />}
              >
                <div className="mb-6 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                      <Button size="sm" variant="outline" onClick={() => setSelectedRegistrationId(null)} className="w-full sm:w-auto">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to registrations
                      </Button>
                      {selectedOrg.profileStatus === "verified" && selectedOrg.verifiedAt ? (
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                          VERIFIED ON {formatVerifiedDateLabel(selectedOrg.verifiedAt)}
                        </div>
                      ) : selectedOrg.profileStatus === "needs_update" ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
                          Needs update
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border/80 bg-background px-4 py-2 text-sm text-muted-foreground">
                          Pending verification
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() =>
                          openAdminConfirmation({
                            kind: "profile",
                            action: "verify",
                            organizationId: selectedOrg.id,
                            organizationName: selectedOrg.organizationName,
                            userId: selectedOrg.userId,
                          })
                        }
                      >
                        Mark Verified
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() =>
                          openAdminConfirmation({
                            kind: "profile",
                            action: "needs_update",
                            organizationId: selectedOrg.id,
                            organizationName: selectedOrg.organizationName,
                            userId: selectedOrg.userId,
                          })
                        }
                      >
                        Needs Update
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border/70 bg-muted/15 p-4 sm:p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/75">Organization Contact</p>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {renderRegistrationDetailCard({ title: "Email", value: selectedOrg.organizationEmail })}
                        {renderRegistrationDetailCard({ title: "Contact Number", value: selectedOrg.contactNumber })}
                        {renderRegistrationDetailCard({ title: "Barangay", value: selectedOrg.barangay })}
                        {renderRegistrationDetailCard({
                          title: "Facebook Page",
                          value: selectedOrg.facebookPageUrl || "N/A",
                          wrap: true,
                          linkHref: selectedOrg.facebookPageUrl || undefined,
                        })}
                        {renderRegistrationDetailCard({
                          title: "Address",
                          value: selectedOrg.address || "N/A",
                          className: "md:col-span-2",
                          wrap: true,
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-muted/15 p-4 sm:p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/75">Classification</p>
                      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {renderRegistrationDetailCard({ title: "Major Classification", value: selectedOrg.majorClassification || "N/A" })}
                        {renderRegistrationDetailCard({ title: "Sub Classification", value: selectedOrg.subClassification || "N/A" })}
                        {renderRegistrationDetailCard({
                          title: "Date of Creation",
                          value: selectedOrg.verifiedAt ? formatVerifiedDateLabel(selectedOrg.verifiedAt) : "Pending verification",
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border/70 bg-muted/15 p-4 sm:p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/75">Leadership</p>
                      <div className="mt-4 grid gap-4">
                        {renderRegistrationDetailCard({ title: "Representative", value: selectedOrg.representativeName || "N/A" })}
                        {renderRegistrationDetailCard({ title: "Adviser", value: selectedOrg.adviserName || "N/A" })}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-muted/15 p-4 sm:p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/75">Advocacies</p>
                      <div className="mt-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                        {renderAdvocacyChips(selectedOrg.advocacies)}
                      </div>
                    </div>
                  </div>
                </div>
              </PortalSection>

              <PortalSection
                title="Submitted Documents"
                description={`${selectedFiles.length}/${templateDocuments.length} files submitted from the organization user side.`}
              >
                {selectedSubmission ? (
                  <div className="space-y-3">
                    {templateDocuments.map((documentType) => {
                      const file = selectedFiles.find((entry) => entry.documentTypeId === documentType.id);
                      const previewUrl = file ? documentPreviewUrls[file.id] ?? "" : "";
                      const isExpanded = file ? expandedDocumentFileIds.includes(file.id) : false;
                      return (
                        <Card key={documentType.id} className="border-border/70">
                          <CardHeader className="pb-3">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <CardTitle className="text-base">{documentType.name}</CardTitle>
                                </div>
                                <p className="text-sm text-muted-foreground">{file?.fileName ?? "No file submitted yet."}</p>
                                {file ? (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <PortalStatusBadge status={file.adminStatus ?? "submitted"} />
                                    <span className="text-xs text-muted-foreground">
                                      {file.adminStatus === "approved_green"
                                        ? "Approved"
                                        : file.adminStatus === "needs_revision"
                                          ? "Needs revision"
                                          : file.adminStatus === "rejected_red"
                                            ? "Rejected"
                                            : "Pending review"}
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="w-full sm:w-auto"
                                  disabled={!file}
                                  onClick={() => file && toggleDocumentCard(file.id)}
                                >
                                  {isExpanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                                  {isExpanded ? "Hide details" : "Show details"}
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          {isExpanded ? (
                            <CardContent className="space-y-4 border-t border-border/70 pt-4">
                              {file ? (
                                <>
                                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
                                    <div className="space-y-3">
                                      <div className="overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm">
                                        {previewUrl ? (
                                          <iframe
                                            src={previewUrl}
                                            title={file.fileName}
                                            className="h-[24rem] w-full sm:h-[28rem] xl:h-[32rem]"
                                          />
                                        ) : (
                                          <div className="grid h-[24rem] place-items-center p-6 text-center text-sm text-muted-foreground sm:h-[28rem] xl:h-[32rem]">
                                            Preview unavailable. Use the buttons below to open the uploaded file.
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="rounded-xl border border-border/70 bg-background p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                          <div className="min-w-0">
                                            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Admin Comment</p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                              Add a note only when the submission needs revision or is rejected.
                                            </p>
                                          </div>
                                          <span className="inline-flex w-fit max-w-full items-center rounded-lg border border-border/70 bg-muted/40 px-3 py-1.5 text-xs leading-tight text-muted-foreground sm:ml-auto sm:text-right">
                                            Comment required for revision or rejection
                                          </span>
                                        </div>
                                        <Textarea
                                          id={`document-admin-comment-${file.id}`}
                                          name={`documentAdminComment-${file.id}`}
                                          value={getDocumentReviewCommentDraft(file)}
                                          onChange={(event) =>
                                            setDocumentReviewRemarksByFileId((current) => ({
                                              ...current,
                                              [file.id]: event.target.value,
                                            }))
                                          }
                                          placeholder="Explain what should be changed, or why the file was rejected."
                                          className="mt-3 min-h-32"
                                        />
                                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full sm:w-auto"
                                            onClick={() =>
                                              openAdminConfirmation({
                                                kind: "document",
                                                action: "approve",
                                                fileId: file.id,
                                                submissionId: selectedSubmission.id,
                                                organizationId: selectedOrg.id,
                                                organizationName: selectedOrg.organizationName,
                                                fileName: file.fileName,
                                                currentAdminRemarks: getDocumentReviewCommentDraft(file),
                                              })
                                            }
                                          >
                                            Approve
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full sm:w-auto"
                                            onClick={() =>
                                              openAdminConfirmation({
                                                kind: "document",
                                                action: "needs_revision",
                                                fileId: file.id,
                                                submissionId: selectedSubmission.id,
                                                organizationId: selectedOrg.id,
                                                organizationName: selectedOrg.organizationName,
                                                fileName: file.fileName,
                                                currentAdminRemarks: getDocumentReviewCommentDraft(file),
                                              })
                                            }
                                          >
                                            Needs Revision
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full sm:w-auto"
                                            onClick={() =>
                                              openAdminConfirmation({
                                                kind: "document",
                                                action: "reject",
                                                fileId: file.id,
                                                submissionId: selectedSubmission.id,
                                                organizationId: selectedOrg.id,
                                                organizationName: selectedOrg.organizationName,
                                                fileName: file.fileName,
                                                currentAdminRemarks: getDocumentReviewCommentDraft(file),
                                              })
                                            }
                                          >
                                            Reject
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="grid min-h-[12rem] place-items-center rounded-xl border border-dashed border-border/70 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                                  No uploaded file submitted yet for this requirement.
                                </div>
                              )}
                            </CardContent>
                          ) : null}
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
            description="Use the dropdown to inspect card details, then open the full review page when needed."
            action={state.organizationProfiles.length ? <PortalStatusBadge status="pending_review" /> : null}
          >
            {state.organizationProfiles.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {state.organizationProfiles.map((org) => {
                  const orgSubmission = state.documentSubmissions.find((item) => item.organizationId === org.id);
                  const submittedCount = orgSubmission
                    ? state.documentSubmissionFiles.filter(
                        (file) => file.submissionId === orgSubmission.id && validDocumentTypeIds.has(file.documentTypeId),
                      ).length
                    : 0;
                  const isExpanded = expandedRegistrationIds.includes(org.id);
                  return (
                    <Card key={org.id} className="border-border/70 shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base">{org.organizationName}</CardTitle>
                            <p className="text-sm text-muted-foreground">{org.organizationEmail}</p>
                            <p className="text-sm text-muted-foreground">
                              Documents submitted: {submittedCount}/{templateDocuments.length}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 sm:items-end">
                            <PortalStatusBadge status={org.profileStatus} />
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => toggleRegistrationCard(org.id)}
                              >
                                {isExpanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                                {isExpanded ? "Hide details" : "Show details"}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className="w-full sm:w-auto"
                                onClick={() => setSelectedRegistrationId(org.id)}
                              >
                                Review
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      {isExpanded ? (
                        <CardContent className="space-y-4 border-t border-border/70 pt-4 text-sm text-muted-foreground">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Contact Number</p>
                              <p className="mt-1 font-medium text-foreground">{org.contactNumber}</p>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Barangay</p>
                              <p className="mt-1 font-medium text-foreground">{org.barangay}</p>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Major Classification</p>
                              <p className="mt-1 font-medium text-foreground">{org.majorClassification || "N/A"}</p>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Sub Classification</p>
                              <p className="mt-1 font-medium text-foreground">{org.subClassification || "N/A"}</p>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Representative</p>
                              <p className="mt-1 font-medium text-foreground">{org.representativeName || "N/A"}</p>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Adviser</p>
                              <p className="mt-1 font-medium text-foreground">{org.adviserName || "N/A"}</p>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3 sm:col-span-2">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Facebook</p>
                              <p className="mt-1 break-all font-medium text-foreground">{org.facebookPageUrl || "N/A"}</p>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3 sm:col-span-2">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Date of Creation</p>
                              <p className="mt-1 font-medium text-foreground">
                                {org.verifiedAt ? formatVerifiedDateLabel(org.verifiedAt) : "Pending verification"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Advocacies</p>
                            <div className="mt-2">{renderAdvocacyChips(org.advocacies)}</div>
                          </div>
                        </CardContent>
                      ) : null}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <PortalEmptyState
                title="No registrations yet"
                description="Organization profiles will appear here after users complete and save them from the user portal."
              />
            )}
          </PortalSection>
        );
      }
      case "users":
        return (
          <PortalSection title="Users" description="Linked accounts and access levels.">
            {state.organizationProfiles.length ? (
              <div className="space-y-3">
                {state.organizationProfiles.map((organization) => {
                  const isExpanded = expandedUserIds.includes(organization.id);
                  return (
                    <Card key={organization.id} className="border-border/70 shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Name / Email</p>
                            <CardTitle className="text-base">{organization.organizationName}</CardTitle>
                            <p className="text-sm text-muted-foreground">{organization.organizationEmail}</p>
                          </div>
                          <div className="flex flex-col gap-2 sm:items-end">
                            <div>
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Role</p>
                              <p className="mt-1 font-medium text-foreground">Organization User</p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="w-full sm:w-auto"
                              onClick={() => toggleUserCard(organization.id)}
                            >
                              {isExpanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                              {isExpanded ? "Hide details" : "Show details"}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {isExpanded ? (
                        <CardContent className="space-y-4 border-t border-border/70 pt-4 text-sm text-muted-foreground">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Contact Number</p>
                              <p className="mt-1 font-medium text-foreground">{organization.contactNumber}</p>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Barangay</p>
                              <p className="mt-1 font-medium text-foreground">{organization.barangay}</p>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Representative</p>
                              <p className="mt-1 font-medium text-foreground">{organization.representativeName || "N/A"}</p>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Adviser</p>
                              <p className="mt-1 font-medium text-foreground">{organization.adviserName || "N/A"}</p>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3 sm:col-span-2">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Address</p>
                              <p className="mt-1 font-medium text-foreground">{organization.address || "N/A"}</p>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3 sm:col-span-2">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Facebook</p>
                              <p className="mt-1 break-all font-medium text-foreground">{organization.facebookPageUrl || "N/A"}</p>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3 sm:col-span-2">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/75">Date of Creation</p>
                              <p className="mt-1 font-medium text-foreground">
                                {organization.verifiedAt ? formatVerifiedDateLabel(organization.verifiedAt) : "Pending verification"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      ) : null}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <PortalEmptyState
                title="No users yet"
                description="Linked organization accounts will appear here after users register and save their organization profiles."
              />
            )}
          </PortalSection>
        );
      case "budget-utilization":
        return (
          <>
            <PortalSection title="Budget Utilization" description="Budget request review and go-signal control.">
              <div className="grid gap-4">
                {state.budgetRequests.length ? (
                  state.budgetRequests.map((request) => {
                    const requestOrganization = state.organizationProfiles.find((org) => org.id === request.organizationId) ?? null;
                    const requestFiles = state.budgetRequestFiles
                      .filter((file) => file.budgetRequestId === request.id)
                      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

                    return (
                      <Card key={request.id} className="border-border/70">
                        <CardContent className="grid gap-4 p-4 md:grid-cols-[1.6fr_0.9fr]">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium">{request.activityTitle}</p>
                                <p className="text-sm text-muted-foreground">{request.activityDescription || "No description provided."}</p>
                              </div>
                              <PortalStatusBadge status={request.status} />
                            </div>
                            <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                              <p>Organization: {requestOrganization?.organizationName ?? "Unknown organization"}</p>
                              <p>Requested: PHP {request.requestedAmount.toLocaleString()}</p>
                              <p>Venue: {request.venue}</p>
                              <p>Attached files: {requestFiles.length}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">Remarks: {request.remarks || "None"}</p>
                          </div>
                          <div className="flex items-start justify-end">
                            <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => openBudgetRequestDetails(request.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <PortalEmptyState title="No budget requests yet" description="Budget requests will appear here after an organization creates one." />
                )}
              </div>
            </PortalSection>

            <Dialog open={selectedBudgetRequest !== null} onOpenChange={(open) => { if (!open) closeBudgetRequestDetails(); }}>
              <DialogContent className="h-[100dvh] w-[calc(100vw-1rem)] max-w-none overflow-hidden rounded-none border-0 p-0 sm:h-[92dvh] sm:w-[min(96vw,96rem)] sm:max-w-none sm:rounded-2xl sm:border">
                <div className="flex h-full min-h-0 flex-col">
                  <div className="border-b border-border/70 px-4 pb-3 pt-5 sm:px-6 sm:pb-4 sm:pt-6">
                    <DialogHeader className="text-left sm:text-left">
                      <DialogTitle className="text-xl leading-tight sm:text-2xl">
                        {selectedBudgetRequest?.activityTitle ?? "Budget Request Details"}
                      </DialogTitle>
                      <DialogDescription className="max-w-2xl text-sm sm:text-base">
                        Review organization details and attached files before updating the request status.
                      </DialogDescription>
                    </DialogHeader>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                    {selectedBudgetRequest ? (
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4 sm:p-5">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/75">Organization Details</p>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                              {renderRegistrationDetailCard({
                                title: "Organization Name",
                                value: selectedBudgetOrganization?.organizationName ?? "N/A",
                                className: "sm:col-span-2",
                              })}
                              {renderRegistrationDetailCard({
                                title: "Organization Email",
                                value: selectedBudgetOrganization?.organizationEmail ?? "N/A",
                              })}
                              {renderRegistrationDetailCard({
                                title: "Contact Number",
                                value: selectedBudgetOrganization?.contactNumber ?? "N/A",
                              })}
                              {renderRegistrationDetailCard({
                                title: "Barangay",
                                value: selectedBudgetOrganization?.barangay ?? "N/A",
                              })}
                              {renderRegistrationDetailCard({
                                title: "District",
                                value: selectedBudgetOrganization?.district || "N/A",
                              })}
                              {renderRegistrationDetailCard({
                                title: "Submitted By",
                                value: selectedBudgetRequest.submittedBy,
                                wrap: true,
                                className: "sm:col-span-2",
                              })}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4 sm:p-5">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/75">Request Details</p>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                              {renderRegistrationDetailCard({ title: "Requested Amount", value: `PHP ${selectedBudgetRequest.requestedAmount.toLocaleString()}` })}
                              {renderRegistrationDetailCard({
                                title: "Approved Amount",
                                value: `PHP ${selectedBudgetRequest.approvedAmount.toLocaleString()}`,
                              })}
                              {renderRegistrationDetailCard({
                                title: "Released Amount",
                                value: `PHP ${selectedBudgetRequest.releasedAmount.toLocaleString()}`,
                              })}
                              {renderRegistrationDetailCard({
                                title: "Activity Date",
                                value: selectedBudgetRequest.activityDate || "N/A",
                              })}
                              {renderRegistrationDetailCard({
                                title: "Venue",
                                value: selectedBudgetRequest.venue,
                                wrap: true,
                                className: "sm:col-span-2",
                              })}
                              {renderRegistrationDetailCard({
                                title: "Purpose Category",
                                value: selectedBudgetRequest.purposeCategory || "N/A",
                              })}
                              {renderRegistrationDetailCard({
                                title: "Go Signal",
                                value: selectedBudgetRequest.goSignalAt || "Pending",
                              })}
                              {renderRegistrationDetailCard({
                                title: "Hard Copy Submitted",
                                value: selectedBudgetRequest.hardCopySubmittedAt || "Pending",
                              })}
                              {renderRegistrationDetailCard({
                                title: "Release Date",
                                value: selectedBudgetRequest.releaseDate || "Pending",
                              })}
                              {renderRegistrationDetailCard({
                                title: "Remarks",
                                value: selectedBudgetRequest.remarks || "None",
                                wrap: true,
                                className: "sm:col-span-2",
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4 sm:p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/75">Attached Files</p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                  {selectedBudgetRequestFiles.length
                                    ? `${selectedBudgetRequestFiles.length} file${selectedBudgetRequestFiles.length === 1 ? "" : "s"} uploaded.`
                                    : "No attached files were uploaded for this request."}
                                </p>
                              </div>
                              <div className="self-start">
                                <PortalStatusBadge status={selectedBudgetRequest.status} />
                              </div>
                            </div>

                            {selectedBudgetRequestFiles.length ? (
                              <div className="mt-4 space-y-3">
                                <div className="flex flex-wrap gap-2">
                                  {selectedBudgetRequestFiles.map((file) => (
                                    <Button
                                      key={file.id}
                                      type="button"
                                      size="sm"
                                      variant={selectedBudgetRequestFile?.id === file.id ? "default" : "outline"}
                                      className="max-w-full"
                                      onClick={() => setSelectedBudgetFileId(file.id)}
                                    >
                                      <span className="max-w-[12rem] truncate">{file.fileName}</span>
                                    </Button>
                                  ))}
                                </div>

                                <div className="rounded-xl border border-border/70 bg-background p-3">
                                  {budgetPreviewLoading ? (
                                    <p className="p-3 text-sm text-muted-foreground">Loading preview...</p>
                                  ) : budgetPreviewUrl && budgetPreviewCanInline ? (
                                    isImagePreviewFile(budgetPreviewTitle) || isImagePreviewFile(budgetPreviewUrl) ? (
                                      <div className="flex max-h-[24rem] min-h-[16rem] items-center justify-center overflow-hidden rounded-md bg-background sm:max-h-[32rem]">
                                        <img
                                          src={budgetPreviewUrl}
                                          alt={budgetPreviewTitle || "Budget request preview"}
                                          className="max-h-[24rem] w-full object-contain sm:max-h-[32rem]"
                                        />
                                      </div>
                                    ) : (
                                      <iframe
                                        title={budgetPreviewTitle || "Budget Request Preview"}
                                        src={budgetPreviewUrl}
                                        className="h-[24rem] w-full rounded-md border-0 bg-background sm:h-[32rem]"
                                        loading="eager"
                                      />
                                    )
                                  ) : budgetPreviewUrl ? (
                                    <div className="space-y-3 p-3 text-sm text-muted-foreground">
                                      <p>This uploaded file cannot be shown inline. You can open it in a new tab if needed.</p>
                                      <Button type="button" variant="outline" onClick={() => window.open(budgetPreviewUrl, "_blank", "noopener,noreferrer")}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Open File
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="grid min-h-[16rem] place-items-center rounded-md border border-dashed border-border/70 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
                                      {budgetPreviewEmptyMessage || "No budget request file was uploaded."}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="mt-4 rounded-xl border border-dashed border-border/70 bg-muted/10 p-6 text-sm text-muted-foreground">
                                No attached budget request files were submitted.
                              </div>
                            )}
                          </div>

                          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4 sm:p-5">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/75">Status Controls</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              Current status: <span className="font-medium text-foreground">{selectedBudgetRequest.status}</span>
                            </p>
                            <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() =>
                                  void performBudgetRequestStatusUpdate(
                                    {
                                      id: selectedBudgetRequest.id,
                                      organizationId: selectedBudgetRequest.organizationId,
                                      organizationName: selectedBudgetOrganization?.organizationName ?? "Unknown organization",
                                      submittedBy: selectedBudgetRequest.submittedBy,
                                      activityTitle: selectedBudgetRequest.activityTitle,
                                      requestedAmount: selectedBudgetRequest.requestedAmount,
                                    },
                                    "approve",
                                  )
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() =>
                                  void performBudgetRequestStatusUpdate(
                                    {
                                      id: selectedBudgetRequest.id,
                                      organizationId: selectedBudgetRequest.organizationId,
                                      organizationName: selectedBudgetOrganization?.organizationName ?? "Unknown organization",
                                      submittedBy: selectedBudgetRequest.submittedBy,
                                      activityTitle: selectedBudgetRequest.activityTitle,
                                      requestedAmount: selectedBudgetRequest.requestedAmount,
                                    },
                                    "needs_revision",
                                  )
                                }
                              >
                                Needs Revision
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() =>
                                  void performBudgetRequestStatusUpdate(
                                    {
                                      id: selectedBudgetRequest.id,
                                      organizationId: selectedBudgetRequest.organizationId,
                                      organizationName: selectedBudgetOrganization?.organizationName ?? "Unknown organization",
                                      submittedBy: selectedBudgetRequest.submittedBy,
                                      activityTitle: selectedBudgetRequest.activityTitle,
                                      requestedAmount: selectedBudgetRequest.requestedAmount,
                                    },
                                    "reject",
                                  )
                                }
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="border-t border-border/70 px-4 py-4 sm:px-6">
                    <DialogFooter>
                      <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={closeBudgetRequestDetails}>
                        Close
                      </Button>
                    </DialogFooter>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={selectedLiquidationReport !== null} onOpenChange={(open) => { if (!open) closeLiquidationDetails(); }}>
              <DialogContent className="h-[100dvh] w-[calc(100vw-1rem)] max-w-none overflow-hidden rounded-none border-0 p-0 sm:h-[92dvh] sm:w-[min(96vw,96rem)] sm:max-w-none sm:rounded-2xl sm:border">
                <div className="flex h-full min-h-0 flex-col">
                  <div className="border-b border-border/70 px-4 pb-3 pt-5 sm:px-6 sm:pb-4 sm:pt-6">
                    <DialogHeader className="text-left sm:text-left">
                      <DialogTitle className="text-xl leading-tight sm:text-2xl">
                        {selectedLiquidationBudgetRequest?.activityTitle ?? "Liquidation Details"}
                      </DialogTitle>
                      <DialogDescription className="max-w-2xl text-sm sm:text-base">
                        Review the liquidation record, attached files, and linked budget request before updating its status.
                      </DialogDescription>
                    </DialogHeader>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                    {selectedLiquidationReport ? (
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4 sm:p-5">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/75">Organization Details</p>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                              {renderRegistrationDetailCard({
                                title: "Organization Name",
                                value: selectedLiquidationOrganization?.organizationName ?? "N/A",
                                className: "sm:col-span-2",
                              })}
                              {renderRegistrationDetailCard({
                                title: "Organization Email",
                                value: selectedLiquidationOrganization?.organizationEmail ?? "N/A",
                              })}
                              {renderRegistrationDetailCard({
                                title: "Contact Number",
                                value: selectedLiquidationOrganization?.contactNumber ?? "N/A",
                              })}
                              {renderRegistrationDetailCard({
                                title: "Barangay",
                                value: selectedLiquidationOrganization?.barangay ?? "N/A",
                              })}
                              {renderRegistrationDetailCard({
                                title: "District",
                                value: selectedLiquidationOrganization?.district || "N/A",
                              })}
                              {renderRegistrationDetailCard({
                                title: "Submitted By",
                                value: selectedLiquidationReport.submittedBy,
                                wrap: true,
                                className: "sm:col-span-2",
                              })}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4 sm:p-5">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/75">Liquidation Details</p>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                              {renderRegistrationDetailCard({
                                title: "Linked Budget Request",
                                value: selectedLiquidationBudgetRequest?.activityTitle ?? "N/A",
                                wrap: true,
                                className: "sm:col-span-2",
                              })}
                              {renderRegistrationDetailCard({
                                title: "Go Signal",
                                value: selectedLiquidationReport.goSignalAt || "Pending",
                              })}
                              {renderRegistrationDetailCard({
                                title: "Deadline",
                                value: selectedLiquidationReport.deadlineAt || "Pending",
                              })}
                              {renderRegistrationDetailCard({
                                title: "Hard Copy Submitted",
                                value: selectedLiquidationReport.hardCopySubmittedAt || "Pending",
                              })}
                              {renderRegistrationDetailCard({
                                title: "Completed At",
                                value: selectedLiquidationReport.completedAt || "Pending",
                              })}
                              {renderRegistrationDetailCard({
                                title: "Remarks",
                                value: selectedLiquidationReport.remarks || "None",
                                wrap: true,
                                className: "sm:col-span-2",
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4 sm:p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/75">Attached Files</p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                  {selectedLiquidationReportFiles.length
                                    ? `${selectedLiquidationReportFiles.length} file${selectedLiquidationReportFiles.length === 1 ? "" : "s"} uploaded.`
                                    : "No attached files were uploaded for this liquidation report."}
                                </p>
                              </div>
                              <div className="self-start">
                                <PortalStatusBadge status={selectedLiquidationReport.status} />
                              </div>
                            </div>

                            {selectedLiquidationReportFiles.length ? (
                              <div className="mt-4 space-y-3">
                                <div className="flex flex-wrap gap-2">
                                  {selectedLiquidationReportFiles.map((file) => (
                                    <Button
                                      key={file.id}
                                      type="button"
                                      size="sm"
                                      variant={selectedLiquidationReportFile?.id === file.id ? "default" : "outline"}
                                      className="max-w-full"
                                      onClick={() => setSelectedLiquidationFileId(file.id)}
                                    >
                                      <span className="max-w-[12rem] truncate">{file.fileName}</span>
                                    </Button>
                                  ))}
                                </div>

                                <div className="rounded-xl border border-border/70 bg-background p-3">
                                  {liquidationPreviewLoading ? (
                                    <p className="p-3 text-sm text-muted-foreground">Loading preview...</p>
                                  ) : liquidationPreviewUrl && liquidationPreviewCanInline ? (
                                    isImagePreviewFile(liquidationPreviewTitle) || isImagePreviewFile(liquidationPreviewUrl) ? (
                                      <div className="flex max-h-[24rem] min-h-[16rem] items-center justify-center overflow-hidden rounded-md bg-background sm:max-h-[32rem]">
                                        <img
                                          src={liquidationPreviewUrl}
                                          alt={liquidationPreviewTitle || "Liquidation file preview"}
                                          className="max-h-[24rem] w-full object-contain sm:max-h-[32rem]"
                                        />
                                      </div>
                                    ) : (
                                      <iframe
                                        title={liquidationPreviewTitle || "Liquidation Preview"}
                                        src={liquidationPreviewUrl}
                                        className="h-[24rem] w-full rounded-md border-0 bg-background sm:h-[32rem]"
                                        loading="eager"
                                      />
                                    )
                                  ) : liquidationPreviewUrl ? (
                                    <div className="space-y-3 p-3 text-sm text-muted-foreground">
                                      <p>This uploaded file cannot be shown inline. You can open it in a new tab if needed.</p>
                                      <Button type="button" variant="outline" onClick={() => window.open(liquidationPreviewUrl, "_blank", "noopener,noreferrer")}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Open File
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="grid min-h-[16rem] place-items-center rounded-md border border-dashed border-border/70 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
                                      {liquidationPreviewEmptyMessage || "No liquidation file was uploaded."}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="mt-4 rounded-xl border border-dashed border-border/70 bg-muted/10 p-6 text-sm text-muted-foreground">
                                No attached liquidation files were submitted.
                              </div>
                            )}
                          </div>

                          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4 sm:p-5">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/75">Status Controls</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              Current status: <span className="font-medium text-foreground">{selectedLiquidationReport.status}</span>
                            </p>
                            <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() =>
                                  void (async () => {
                                    try {
                                      await updateLiquidationReportInSupabase(selectedLiquidationReport.id, {
                                        status: "approved_for_ftf_green",
                                        goSignalAt: new Date().toISOString(),
                                      });
                                      await refreshAdminState();
                                      await appendAuditLog(
                                        "Approved liquidation report",
                                        "liquidation_report",
                                        selectedLiquidationReport.id,
                                        "Marked liquidation report as approved for face-to-face green.",
                                        selectedLiquidationReport.organizationId,
                                      );
                                    } catch (error) {
                                      toast({
                                        title: "Unable to update liquidation",
                                        description:
                                          error instanceof Error ? error.message : "The liquidation report could not be updated right now.",
                                        variant: "destructive",
                                      });
                                    }
                                  })()
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() =>
                                  void (async () => {
                                    try {
                                      await updateLiquidationReportInSupabase(selectedLiquidationReport.id, { status: "needs_revision" });
                                      await refreshAdminState();
                                      await appendAuditLog(
                                        "Liquidation needs revision",
                                        "liquidation_report",
                                        selectedLiquidationReport.id,
                                        "Marked liquidation report as needing revision.",
                                        selectedLiquidationReport.organizationId,
                                      );
                                    } catch (error) {
                                      toast({
                                        title: "Unable to update liquidation",
                                        description:
                                          error instanceof Error ? error.message : "The liquidation report could not be updated right now.",
                                        variant: "destructive",
                                      });
                                    }
                                  })()
                                }
                              >
                                Needs Revision
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() =>
                                  void (async () => {
                                    try {
                                      await updateLiquidationReportInSupabase(selectedLiquidationReport.id, { status: "overdue" });
                                      await refreshAdminState();
                                      await appendAuditLog(
                                        "Marked liquidation overdue",
                                        "liquidation_report",
                                        selectedLiquidationReport.id,
                                        "Marked liquidation report as overdue.",
                                        selectedLiquidationReport.organizationId,
                                      );
                                    } catch (error) {
                                      toast({
                                        title: "Unable to update liquidation",
                                        description:
                                          error instanceof Error ? error.message : "The liquidation report could not be updated right now.",
                                        variant: "destructive",
                                      });
                                    }
                                  })()
                                }
                              >
                                Mark Overdue
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="border-t border-border/70 px-4 py-4 sm:px-6">
                    <DialogFooter>
                      <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={closeLiquidationDetails}>
                        Close
                      </Button>
                    </DialogFooter>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        );
      case "liquidation-monitoring":
        return (
          <PortalSection title="Liquidation Monitoring" description="Track deadlines and go-signal dates.">
            <div className="grid gap-4">
              {state.liquidationReports.length ? (
                state.liquidationReports.map((record) => (
                  <Card key={record.id} className="border-border/70">
                    <CardContent className="grid gap-4 p-4 md:grid-cols-[1.6fr_0.9fr]">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium">
                              {state.budgetRequests.find((item) => item.id === record.budgetRequestId)?.activityTitle ?? "Liquidation item"}
                            </p>
                            <p className="text-sm text-muted-foreground">Go signal: {record.goSignalAt || "Pending"}</p>
                          </div>
                          <PortalStatusBadge status={record.status} />
                        </div>
                        <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                          <p>Organization: {state.organizationProfiles.find((item) => item.id === record.organizationId)?.organizationName ?? "Unknown organization"}</p>
                          <p>Attached files: {state.liquidationReportFiles.filter((file) => file.liquidationReportId === record.id).length}</p>
                          <p>Deadline: {record.deadlineAt || "Pending"}</p>
                          <p>Hard copy submitted: {record.hardCopySubmittedAt || "Pending"}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">Remarks: {record.remarks || "None"}</p>
                      </div>
                      <div className="flex flex-col items-stretch gap-2">
                        <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => openLiquidationDetails(record.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() =>
                              void (async () => {
                                try {
                                  await updateLiquidationReportInSupabase(record.id, {
                                    status: "approved_for_ftf_green",
                                    goSignalAt: new Date().toISOString(),
                                  });
                                  await refreshAdminState();
                                  await appendAuditLog(
                                    "Approved liquidation report",
                                    "liquidation_report",
                                    record.id,
                                    "Marked liquidation report as approved for face-to-face green.",
                                    record.organizationId,
                                  );
                                } catch (error) {
                                  toast({
                                    title: "Unable to update liquidation",
                                    description:
                                      error instanceof Error ? error.message : "The liquidation report could not be updated right now.",
                                    variant: "destructive",
                                  });
                                }
                              })()
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() =>
                              void (async () => {
                                try {
                                  await updateLiquidationReportInSupabase(record.id, { status: "needs_revision" });
                                  await refreshAdminState();
                                  await appendAuditLog(
                                    "Liquidation needs revision",
                                    "liquidation_report",
                                    record.id,
                                    "Marked liquidation report as needing revision.",
                                    record.organizationId,
                                  );
                                } catch (error) {
                                  toast({
                                    title: "Unable to update liquidation",
                                    description:
                                      error instanceof Error ? error.message : "The liquidation report could not be updated right now.",
                                    variant: "destructive",
                                  });
                                }
                              })()
                            }
                          >
                            Needs Revision
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() =>
                              void (async () => {
                                try {
                                  await updateLiquidationReportInSupabase(record.id, { status: "overdue" });
                                  await refreshAdminState();
                                  await appendAuditLog(
                                    "Marked liquidation overdue",
                                    "liquidation_report",
                                    record.id,
                                    "Marked liquidation report as overdue.",
                                    record.organizationId,
                                  );
                                } catch (error) {
                                  toast({
                                    title: "Unable to update liquidation",
                                    description:
                                      error instanceof Error ? error.message : "The liquidation report could not be updated right now.",
                                    variant: "destructive",
                                  });
                                }
                              })()
                            }
                          >
                            Mark Overdue
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <PortalEmptyState title="No liquidation records yet" description="Approved budgets create liquidation records automatically." />
              )}
            </div>
          </PortalSection>
        );
      case "news-releases":
        return (
          <>
            <PortalSection
              title="News Releases"
              description="Admin-created news and Facebook post links."
              action={
                <Button
                  type="button"
                  onClick={() => {
                    setNewsModalMode("create");
                    setEditingNewsReleaseId(null);
                    setNewsTitleDraft("");
                    setNewsDescriptionDraft("");
                    setNewsFacebookPostUrlDraft("");
                    setNewsDatePostedDraft(new Date().toISOString().slice(0, 10));
                    setNewsVisibilityDraft("draft");
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add News Release
                </Button>
              }
            >
              {newsReleases.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {newsReleases.map((news) => (
                  <Card key={news.id} className="border-border/70">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{news.title}</p>
                        <PortalStatusBadge status={news.visibilityStatus} />
                      </div>
                      <p className="text-sm text-muted-foreground">{news.description}</p>
                      <div className="rounded-md border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">Posted {news.datePosted}</p>
                        <p className="mt-1 break-all">{news.facebookPostUrl}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/admin/news-releases/${news.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void (async () => {
                              try {
                                const updatedNewsRelease = await updateNewsReleaseInSupabase(news.id, {
                                  visibilityStatus: "published",
                                });
                                updateNewsRelease(news.id, updatedNewsRelease);
                                await appendAuditLog("Published news release", "news_release", news.id, `Published news release "${updatedNewsRelease.title}".`);
                                await refreshAdminState();
                              } catch (error) {
                                toast({
                                  title: "Unable to update news release",
                                  description: error instanceof Error ? error.message : "The news release could not be updated.",
                                  variant: "destructive",
                                });
                              }
                            })()
                          }
                        >
                          Publish
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void (async () => {
                              try {
                                const updatedNewsRelease = await updateNewsReleaseInSupabase(news.id, {
                                  visibilityStatus: "hidden",
                                });
                                updateNewsRelease(news.id, updatedNewsRelease);
                                await appendAuditLog("Hidden news release", "news_release", news.id, `Hidden news release "${updatedNewsRelease.title}".`);
                                await refreshAdminState();
                              } catch (error) {
                                toast({
                                  title: "Unable to update news release",
                                  description: error instanceof Error ? error.message : "The news release could not be updated.",
                                  variant: "destructive",
                                });
                              }
                            })()
                          }
                        >
                          Hide
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => startEditingNewsRelease(news.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => void handleDeleteNewsRelease(news.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                </div>
              ) : (
                <PortalEmptyState
                  title="No news releases yet"
                  description="Create the first news release so both admin and users can preview the source post."
                />
              )}
            </PortalSection>
            <Dialog open={newsModalMode === "create" || newsModalMode === "edit"} onOpenChange={(open) => (!open ? resetNewsReleaseForm() : undefined)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{newsModalMode === "edit" ? "Edit News Release" : "Add News Release"}</DialogTitle>
                  <DialogDescription>
                    {newsModalMode === "edit"
                      ? "Update the public news release details and source post link."
                      : "Create a news release record that can be previewed on the public and admin sides."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="news-release-title" className="text-sm font-medium">Title</label>
                    <Input id="news-release-title" name="newsReleaseTitle" value={newsTitleDraft} onChange={(event) => setNewsTitleDraft(event.target.value)} placeholder="Enter news release title" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="news-release-description" className="text-sm font-medium">Description</label>
                    <Textarea
                      id="news-release-description"
                      name="newsReleaseDescription"
                      value={newsDescriptionDraft}
                      onChange={(event) => setNewsDescriptionDraft(event.target.value)}
                      placeholder="Write the summary shown in the preview page."
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="news-release-facebook-url" className="text-sm font-medium">Facebook Post URL</label>
                    <Input
                      id="news-release-facebook-url"
                      name="newsReleaseFacebookPostUrl"
                      value={newsFacebookPostUrlDraft}
                      onChange={(event) => setNewsFacebookPostUrlDraft(event.target.value)}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="news-release-date-posted" className="text-sm font-medium">Date Posted</label>
                      <Input
                        id="news-release-date-posted"
                        name="newsReleaseDatePosted"
                        type="date"
                        value={newsDatePostedDraft}
                        onChange={(event) => setNewsDatePostedDraft(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="news-release-visibility" className="text-sm font-medium">Visibility</label>
                      <select
                        id="news-release-visibility"
                        name="newsReleaseVisibility"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={newsVisibilityDraft}
                        onChange={(event) => setNewsVisibilityDraft(event.target.value as NewsRelease["visibilityStatus"])}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetNewsReleaseForm}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={() => void handleSaveNewsRelease()} disabled={savingNewsRelease}>
                    <Save className="mr-2 h-4 w-4" />
                    {savingNewsRelease ? "Saving..." : newsModalMode === "edit" ? "Save Changes" : "Create News Release"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        );
      case "public-transparency-posts":
        return (
          <>
            <PortalSection
              title="Public Transparency Posts"
              description="Simplified transparency content for public-facing visibility."
              action={
                <Button
                  type="button"
                  onClick={() => {
                    setTransparencyModalMode("create");
                    setEditingTransparencyPostId(null);
                    setTransparencyTitleDraft("");
                    setTransparencyDescriptionDraft("");
                    setTransparencyCategoryDraft("");
                    setTransparencyAttachmentUrlDraft("");
                    setTransparencyPostDateDraft(new Date().toISOString().slice(0, 10));
                    setTransparencyVisibilityDraft("draft");
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transparency Post
                </Button>
              }
            >
              {transparencyPosts.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {transparencyPosts.map((post) => (
                    <Card key={post.id} className="border-border/70">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{post.title}</p>
                          <PortalStatusBadge status={post.visibilityStatus} />
                        </div>
                        <p className="text-sm text-muted-foreground">{post.description}</p>
                        <div className="rounded-md border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
                          <p className="font-medium text-foreground">{post.category}</p>
                          <p className="mt-1">Posted {post.postDate}</p>
                          <p className="mt-1 break-all">{post.attachmentUrl || "No attachment URL provided."}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              void (async () => {
                                try {
                                  const updatedPost = await updateTransparencyPostInSupabase(post.id, {
                                    visibilityStatus: "published",
                                  });
                                  updateTransparencyPost(post.id, updatedPost);
                                  await appendAuditLog("Published transparency post", "transparency_post", post.id, `Published transparency post "${updatedPost.title}".`);
                                  await refreshAdminState();
                                } catch (error) {
                                  toast({
                                    title: "Unable to update transparency post",
                                    description: error instanceof Error ? error.message : "The transparency post could not be updated.",
                                    variant: "destructive",
                                  });
                                }
                              })()
                            }
                          >
                            Publish
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              void (async () => {
                                try {
                                  const updatedPost = await updateTransparencyPostInSupabase(post.id, {
                                    visibilityStatus: "hidden",
                                  });
                                  updateTransparencyPost(post.id, updatedPost);
                                  await appendAuditLog("Hidden transparency post", "transparency_post", post.id, `Hidden transparency post "${updatedPost.title}".`);
                                  await refreshAdminState();
                                } catch (error) {
                                  toast({
                                    title: "Unable to update transparency post",
                                    description: error instanceof Error ? error.message : "The transparency post could not be updated.",
                                    variant: "destructive",
                                  });
                                }
                              })()
                            }
                          >
                            Hide
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => startEditingTransparencyPost(post.id)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => void handleDeleteTransparencyPost(post.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <PortalEmptyState
                  title="No transparency posts yet"
                  description="Create the first public transparency post so it appears on the user-facing side."
                />
              )}
            </PortalSection>
            <Dialog open={transparencyModalMode === "create" || transparencyModalMode === "edit"} onOpenChange={(open) => (!open ? resetTransparencyForm() : undefined)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{transparencyModalMode === "edit" ? "Edit Transparency Post" : "Add Transparency Post"}</DialogTitle>
                  <DialogDescription>
                    {transparencyModalMode === "edit"
                      ? "Update the public transparency details and visibility."
                      : "Create a transparency post that will also appear on the user side."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="transparency-post-title" className="text-sm font-medium">Title</label>
                    <Input
                      id="transparency-post-title"
                      name="transparencyPostTitle"
                      value={transparencyTitleDraft}
                      onChange={(event) => setTransparencyTitleDraft(event.target.value)}
                      placeholder="Enter transparency post title"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="transparency-post-description" className="text-sm font-medium">Description</label>
                    <Textarea
                      id="transparency-post-description"
                      name="transparencyPostDescription"
                      value={transparencyDescriptionDraft}
                      onChange={(event) => setTransparencyDescriptionDraft(event.target.value)}
                      placeholder="Write the transparency summary shown to users."
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="transparency-post-category" className="text-sm font-medium">Category</label>
                    <Input
                      id="transparency-post-category"
                      name="transparencyPostCategory"
                      value={transparencyCategoryDraft}
                      onChange={(event) => setTransparencyCategoryDraft(event.target.value)}
                      placeholder="Approved registrations"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="transparency-post-attachment-url" className="text-sm font-medium">Attachment URL</label>
                    <Input
                      id="transparency-post-attachment-url"
                      name="transparencyPostAttachmentUrl"
                      value={transparencyAttachmentUrlDraft}
                      onChange={(event) => setTransparencyAttachmentUrlDraft(event.target.value)}
                      placeholder="https://example.com/file.pdf"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="transparency-post-date" className="text-sm font-medium">Post Date</label>
                      <Input
                        id="transparency-post-date"
                        name="transparencyPostDate"
                        type="date"
                        value={transparencyPostDateDraft}
                        onChange={(event) => setTransparencyPostDateDraft(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="transparency-post-visibility" className="text-sm font-medium">Visibility</label>
                      <select
                        id="transparency-post-visibility"
                        name="transparencyPostVisibility"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={transparencyVisibilityDraft}
                        onChange={(event) => setTransparencyVisibilityDraft(event.target.value as TransparencyPost["visibilityStatus"])}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetTransparencyForm}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={() => void handleSaveTransparencyPost()} disabled={savingTransparencyPost}>
                    <Save className="mr-2 h-4 w-4" />
                    {savingTransparencyPost ? "Saving..." : transparencyModalMode === "edit" ? "Save Changes" : "Create Transparency Post"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
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
                    <label htmlFor="template-document-name" className="text-sm font-medium">Document Name</label>
                    <Input
                      id="template-document-name"
                      name="templateDocumentName"
                      value={templateNameDraft}
                      onChange={(event) => setTemplateNameDraft(event.target.value)}
                      placeholder="Enter document name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="template-document-description" className="text-sm font-medium">Document Description</label>
                    <Textarea
                      id="template-document-description"
                      name="templateDocumentDescription"
                      value={templateDescriptionDraft}
                      onChange={(event) => setTemplateDescriptionDraft(event.target.value)}
                      placeholder="Explain what the organization should upload for this document."
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="template-document-file" className="text-sm font-medium">
                      {templateModalMode === "edit" ? "Replace Template File" : "Upload Template File"}
                    </label>
                    <Input
                      id="template-document-file"
                      name="templateDocumentFile"
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={(event) => setTemplateFileDraft(event.target.files?.[0] ?? null)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {templateModalMode === "edit"
                        ? "Leave this empty if you only want to update the title or description."
                        : "Upload a Word, PDF, XLS, or XLSX template file here so organization users can view and download it."}
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
                  setPreviewEmptyMessage("");
                  setPreviewCanInline(false);
                }
              }}
            >
              <DialogContent className="h-[100dvh] max-w-none overflow-hidden rounded-none border-0 p-0 sm:h-auto sm:max-w-5xl sm:rounded-xl sm:border">
                <div className="flex h-full flex-col sm:h-auto sm:max-h-[90vh]">
                  <div className="border-b border-border/70 px-4 pb-3 pt-5 sm:px-6 sm:pb-4 sm:pt-6">
                    <DialogHeader>
                      <DialogTitle className="max-w-[calc(100vw-5rem)] break-words text-lg leading-tight sm:max-w-none sm:text-xl">
                        {previewTitle || "File Preview"}
                      </DialogTitle>
                      <DialogDescription className="text-sm">
                        Preview the uploaded file here.
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                  <div className="flex-1 overflow-hidden p-4 sm:p-6">
                    <div className="h-[calc(100dvh-11rem)] overflow-hidden rounded-md border border-border/70 bg-muted/20 sm:h-[70vh]">
                      {previewUrl && previewCanInline ? (
                        <iframe
                          src={previewUrl}
                          title={previewTitle || "File preview"}
                          className="h-full w-full"
                        />
                      ) : previewUrl ? (
                        <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                          <div className="space-y-2">
                            <p className="text-base font-medium text-foreground">Preview not available in the browser</p>
                            <p className="max-w-md text-sm text-muted-foreground">
                              This file type cannot be shown inline. Open or download the file to review it in a compatible app.
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Button type="button" variant="outline" onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}>
                              <Eye className="mr-2 h-4 w-4" />
                              Open File
                            </Button>
                            <Button type="button" onClick={() => void openFile(previewUrl, previewTitle || "uploaded-file")}>
                              <Download className="mr-2 h-4 w-4" />
                              Download File
                            </Button>
                          </div>
                        </div>
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
          </PortalSection>
        );
      case "notifications":
        return (
          <PortalSection title="Notifications" description="User-side changes that need admin attention." action={<BadgePanel count={unread} />}>
            <div className="space-y-3">
              {adminNotifications.map((notification) => (
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
        );
      case "activity-logs":
        return (
          <PortalSection title="Activity Logs" description="Audit trail of admin-side edits and review actions.">
            <div className="space-y-3">
              {state.activityLogs.map((activity) => (
                <div key={activity.id} className="rounded-xl border border-border/70 bg-background p-4 text-sm">
                  <p className="font-medium">{activity.action}</p>
                  <p className="mt-1 text-muted-foreground">{activity.description}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground/75">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </PortalSection>
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
    createNotification,
    createNewsRelease,
    createTemplate,
    deleteNewsReleaseInSupabase,
    editingTemplateId,
    editingTransparencyPostId,
    handleCreateTemplate,
    handleDeleteTemplate,
    handleDeleteNewsRelease,
    handleDeleteTransparencyPost,
    handleSaveNewsRelease,
    handleSaveTransparencyPost,
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
    newsDatePostedDraft,
    newsDescriptionDraft,
    newsFacebookPostUrlDraft,
    newsModalMode,
    newsReleases,
    newsTitleDraft,
    newsVisibilityDraft,
    section,
    selectedRegistrationId,
    state.activityLogs,
    state.budgetRequests,
    state.complianceRemarks,
    state.documentSubmissionFiles,
    state.liquidationReports,
    state.notifications,
    state.organizationProfiles,
    state.templates,
    state.transparencyPosts,
    selectedTemplate,
    templateDescriptionDraft,
    templateDocuments,
    templateFileDraft,
    templateNameDraft,
    templateModalMode,
    transparencyAttachmentUrlDraft,
    transparencyCategoryDraft,
    transparencyDescriptionDraft,
    transparencyModalMode,
    transparencyPostDateDraft,
    transparencyPosts,
    transparencyTitleDraft,
    transparencyVisibilityDraft,
    openAdminConfirmation,
    removeNewsRelease,
    updateComplianceRemark,
    updateNewsRelease,
    updateTemplate,
    updateTransparencyPost,
    updateNewsReleaseInSupabase,
    resetNewsReleaseForm,
    resetTransparencyForm,
    savingNewsRelease,
    savingTransparencyPost,
    startEditingNewsRelease,
    startEditingTransparencyPost,
    validDocumentTypeIds,
    savingTemplate,
    uploadingTemplateId,
  ]);

  const adminConfirmationCopy = getAdminConfirmationCopy();

  return (
    <>
      <PortalShell
        title="Admin Portal"
        subtitle="LYDO / PCYDO Admin"
        groups={splitNotificationsGroup}
        activeId={section}
        onNavigate={(id) => navigate(routeMap[id] ?? routeMap.overview)}
        onSignOut={() => void signOut()}
      >
        {activeContent}
      </PortalShell>
      <Dialog open={Boolean(pendingAdminConfirmation)} onOpenChange={(open) => (!open ? closeAdminConfirmation() : undefined)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{adminConfirmationCopy.title}</DialogTitle>
            <DialogDescription>{adminConfirmationCopy.description}</DialogDescription>
          </DialogHeader>
          <label htmlFor="admin-confirmation-checkbox" className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 text-sm">
            <input
              id="admin-confirmation-checkbox"
              name="adminConfirmationAcknowledged"
              type="checkbox"
              checked={approvalAcknowledged}
              onChange={(event) => setApprovalAcknowledged(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary"
            />
            <span>{adminConfirmationCopy.checkboxLabel}</span>
          </label>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={closeAdminConfirmation} disabled={processingAdminConfirmation}>
              Cancel
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => void executeAdminConfirmation()}
              disabled={!approvalAcknowledged || processingAdminConfirmation}
            >
              {processingAdminConfirmation ? "Updating..." : adminConfirmationCopy.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(pendingDeleteConfirmation)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteConfirmation(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDeleteConfirmation?.kind === "news_release" ? "Delete News Release" : "Delete Transparency Post"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteConfirmation
                ? `Delete "${pendingDeleteConfirmation.title}"? This action cannot be undone.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingAdminConfirmation}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDeleteRecord()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
