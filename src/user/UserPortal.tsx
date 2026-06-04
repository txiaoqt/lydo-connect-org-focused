import { useEffect, useMemo, useState } from "react";
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
import {
  advocacyOptions,
  majorClassificationOptions,
  subClassificationOptions,
  type OrganizationProfile,
  userNavigationGroups,
  userRouteMap,
} from "@/lib/lydo-connect-data";
import {
  loadLydoConnectSupabaseState,
  resolveSupabaseFileUrl,
  upsertOrganizationProfileInSupabase,
  uploadOrganizationDocumentToSupabase,
} from "@/lib/lydo-connect-supabase";

const getReadiness = (filled: number, total: number) => (total === 0 ? 0 : Math.round((filled / total) * 100));
const hasUploadedTemplateFile = (fileUrl?: string, fileName?: string) =>
  Boolean(fileName?.trim() && fileUrl?.trim() && !fileUrl.startsWith("#"));

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

export default function UserPortal({ section }: { section: string }) {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const {
    state,
    mergeRemoteState,
    upsertOrganizationProfile,
    updateDocumentFile,
    updateDocumentSubmission,
    setDocumentSubmissionStatus,
    markNotificationRead,
  } = useLydoConnect();
  const [uploadingDocumentId, setUploadingDocumentId] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewEmptyMessage, setPreviewEmptyMessage] = useState("");
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

  const profile = currentProfile ?? createBlankOrganizationProfile(user?.id ?? "");
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
                        <p>
                          <span className="text-muted-foreground">Advocacies:</span>{" "}
                          {currentProfile.advocacies.length ? currentProfile.advocacies.join(", ") : "N/A"}
                        </p>
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
    currentProfile,
    profileDraft,
    savingProfile,
    advocacyOptions,
    majorClassificationOptions,
    subClassificationOptions,
    handleProfileFieldChange,
    toggleAdvocacy,
    saveOrganizationProfile,
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
