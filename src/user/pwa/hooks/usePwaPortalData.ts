import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLydoConnect } from "@/lib/lydo-connect-store";
import {
  markAllNotificationsReadInSupabase,
  markNotificationReadInSupabase,
} from "@/lib/lydo-connect-supabase";

const approvedBudgetStatuses = new Set(["approved_for_ftf_green", "hard_copy_submitted", "budget_released", "completed"]);
const unlockedLiquidationStatuses = new Set(["budget_released", "completed"]);

const completionCount = (profile: ReturnType<typeof useLydoConnect>["state"]["organizationProfiles"][number] | null) =>
  profile
    ? [
        profile.organizationName.trim(),
        profile.organizationEmail.trim(),
        profile.contactNumber.trim(),
        profile.district.trim(),
        profile.barangay.trim(),
        profile.isExistingOrganization ? profile.organizationIdentifierNumber.trim() : "not-required",
        profile.majorClassification.trim(),
        profile.subClassification.trim(),
        profile.advocacies.length ? "advocacies" : "",
        profile.adviserName.trim(),
        profile.representativeName.trim(),
        profile.address.trim(),
      ].filter(Boolean).length
    : 0;

export function usePwaPortalData() {
  const { user, signOut } = useAuth();
  const store = useLydoConnect();
  const { state } = store;
  const profile = state.organizationProfiles.find((item) => item.userId === user?.id) ?? null;
  const organizationId = profile?.id ?? "";

  const data = useMemo(() => {
    const templates = [...state.templates]
      .filter((item) => item.isActive && item.templateActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const requiredTemplates = templates.filter((item) => item.templateScope === "document_submission");
    const submission = state.documentSubmissions.find((item) => item.organizationId === organizationId) ?? null;
    const documentFiles = submission
      ? state.documentSubmissionFiles.filter((item) => item.submissionId === submission.id)
      : [];
    const approvedDocuments = documentFiles.filter((item) => item.adminStatus === "approved_green").length;
    const revisionDocuments = documentFiles.filter((item) =>
      item.adminStatus === "needs_revision" || item.adminStatus === "rejected_red",
    );
    const missingDocuments = Math.max(requiredTemplates.length - documentFiles.length, 0);
    const documentPercent = requiredTemplates.length
      ? Math.round((approvedDocuments / requiredTemplates.length) * 100)
      : 0;

    const budgetRequests = [...state.budgetRequests]
      .filter((item) => item.organizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const latestBudget = budgetRequests[0] ?? null;
    const releasedBudget = budgetRequests.reduce((sum, item) => sum + Number(item.releasedAmount || 0), 0);
    const budgetPercent = latestBudget && approvedBudgetStatuses.has(latestBudget.status) ? 100 : 0;

    const liquidationReports = [...state.liquidationReports]
      .filter((item) => item.organizationId === organizationId)
      .filter((item) => {
        const budget = budgetRequests.find((request) => request.id === item.budgetRequestId);
        return budget ? unlockedLiquidationStatuses.has(budget.status) : false;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const latestLiquidation = liquidationReports[0] ?? null;
    const liquidationPercent = latestLiquidation?.status === "completed_liquidated" ? 100 : 0;
    const now = Date.now();
    const overdueLiquidations = liquidationReports.filter((item) =>
      item.status === "overdue" ||
      (item.deadlineAt && new Date(item.deadlineAt).getTime() < now && item.status !== "completed_liquidated"),
    );
    const upcomingLiquidations = liquidationReports
      .filter((item) => item.deadlineAt && new Date(item.deadlineAt).getTime() >= now && item.status !== "completed_liquidated")
      .sort((a, b) => a.deadlineAt.localeCompare(b.deadlineAt));
    const nextDeadline = upcomingLiquidations[0]?.deadlineAt ?? "";
    const daysUntilDeadline = nextDeadline
      ? Math.max(0, Math.ceil((new Date(nextDeadline).getTime() - now) / 86_400_000))
      : null;

    const profileTarget = 11 + (profile?.isExistingOrganization ? 1 : 0);
    const profilePercent = profileTarget ? Math.round((completionCount(profile) / profileTarget) * 100) : 0;
    const notifications = [...state.notifications]
      .filter((item) => item.userId === user?.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const activities = [...state.activityLogs]
      .filter((item) => item.organizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const inquiries = [...state.inquiries]
      .filter((item) => item.organizationId === organizationId || item.submittedBy === user?.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const ypopEntries = [...state.ypopEntries]
      .filter((item) => item.organizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const pendingActions =
      (profile?.profileStatus === "incomplete" ? 1 : 0) +
      revisionDocuments.length +
      missingDocuments +
      (latestBudget?.status === "needs_revision" ? 1 : 0) +
      liquidationReports.filter((item) => ["not_started", "draft", "needs_revision", "overdue"].includes(item.status)).length;

    let briefing = {
      title: "Your organization is on track.",
      description: "Keep up the great work. There are no overdue records requiring action.",
      tone: "success" as "success" | "warning" | "danger" | "info",
    };
    if (overdueLiquidations.length) {
      briefing = { title: "A liquidation report is overdue.", description: "Open Liquidation and complete the required report as soon as possible.", tone: "danger" };
    } else if (revisionDocuments.length || latestBudget?.status === "needs_revision") {
      briefing = { title: "A submission needs revision.", description: "Review the latest admin remarks and update the flagged record.", tone: "warning" };
    } else if (profile?.profileStatus === "incomplete" || !profile) {
      briefing = { title: "Complete your organization profile.", description: "Your profile must be complete before the full workflow can proceed.", tone: "warning" };
    } else if (missingDocuments) {
      briefing = { title: `${missingDocuments} required document${missingDocuments === 1 ? " is" : "s are"} missing.`, description: "Continue your document submission to prepare for review.", tone: "warning" };
    } else if (daysUntilDeadline !== null && daysUntilDeadline <= 7) {
      briefing = { title: "A liquidation deadline is approaching.", description: `${daysUntilDeadline} day${daysUntilDeadline === 1 ? "" : "s"} remaining before the next deadline.`, tone: "warning" };
    } else if (pendingActions) {
      briefing = { title: `You have ${pendingActions} action${pendingActions === 1 ? "" : "s"} that need attention.`, description: "Use the recommended next steps below to keep your records moving.", tone: "info" };
    }

    const actions: Array<{ title: string; detail: string; path: string; kind: string }> = [];
    if (!profile || profile.profileStatus === "incomplete") actions.push({ title: "Complete Profile", detail: "Finish your organization information.", path: "/organization-profile", kind: "profile" });
    if (revisionDocuments.length) actions.push({ title: "Review Admin Remarks", detail: "Correct the flagged document files.", path: "/document-submission", kind: "documents" });
    else if (missingDocuments) actions.push({ title: "Continue Submission", detail: `${missingDocuments} required file${missingDocuments === 1 ? "" : "s"} remaining.`, path: "/document-submission", kind: "documents" });
    if (latestBudget?.status === "needs_revision") actions.push({ title: "Revise Budget Request", detail: "Address the latest review feedback.", path: "/budget-request", kind: "budget" });
    if (latestLiquidation && ["not_started", "draft", "needs_revision", "overdue"].includes(latestLiquidation.status)) actions.push({ title: "Upload Liquidation", detail: "Complete the current liquidation report.", path: "/liquidation-reporting", kind: "liquidation" });
    if (actions.length < 3) actions.push({ title: "View News Releases", detail: "Read the latest official updates.", path: "/news-releases", kind: "news" });

    return {
      templates, requiredTemplates, submission, documentFiles, approvedDocuments, revisionDocuments,
      missingDocuments, documentPercent, budgetRequests, latestBudget, releasedBudget, budgetPercent,
      liquidationReports, latestLiquidation, liquidationPercent, overdueLiquidations, daysUntilDeadline,
      profilePercent, notifications, unreadCount: notifications.filter((item) => !item.isRead).length,
      activities, inquiries, ypopEntries, pendingActions, briefing, actions: actions.slice(0, 3),
      news: [...state.newsReleases].filter((item) => item.visibilityStatus === "published").sort((a, b) => b.datePosted.localeCompare(a.datePosted)),
      transparency: [...state.transparencyPosts].filter((item) => item.visibilityStatus === "published").sort((a, b) => b.postDate.localeCompare(a.postDate)),
      compliance: state.complianceRemarks.filter((item) => item.organizationId === organizationId),
    };
  }, [organizationId, profile, state, user?.id]);

  const markRead = async (id: string) => {
    await markNotificationReadInSupabase(id);
    store.markNotificationRead(id);
  };
  const markAllRead = async () => {
    await markAllNotificationsReadInSupabase();
    store.markAllNotificationsRead();
  };

  return {
    ...data,
    profile,
    user,
    organizationName: profile?.organizationName || user?.displayName || "Organization",
    store,
    signOut,
    markRead,
    markAllRead,
  };
}
