import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  type ActivityLog,
  type BudgetRequest,
  type BudgetRequestFile,
  type ComplianceRemark,
  type DocumentSubmission,
  type DocumentSubmissionStatus,
  type LiquidationReport,
  type LiquidationReportFile,
  type LydoSeedState,
  type NewsRelease,
  type NotificationRecord,
  type OrganizationProfile,
  type SubmissionFile,
  type TemplateRecord,
  type TransparencyPost,
  legacyRemovedTemplateNames,
  seedState,
} from "./lydo-connect-data";
import { loadLydoConnectSupabaseState } from "./lydo-connect-supabase";
import { supabase } from "./supabase";

const STORAGE_KEY = "lydo-connect-state-v1";

type LydoConnectState = LydoSeedState;

type UpdatePatch<T> = Partial<T> | ((current: T) => T);

type LydoConnectContextValue = {
  state: LydoConnectState;
  mergeRemoteState: (snapshot: Partial<LydoConnectState>) => void;
  createTemplate: (template: TemplateRecord) => void;
  removeTemplate: (id: string) => void;
  updateOrganizationProfile: (id: string, patch: UpdatePatch<OrganizationProfile>) => void;
  updateDocumentSubmission: (id: string, patch: UpdatePatch<DocumentSubmission>) => void;
  updateDocumentFile: (id: string, patch: UpdatePatch<SubmissionFile>) => void;
  updateBudgetRequest: (id: string, patch: UpdatePatch<BudgetRequest>) => void;
  updateBudgetRequestFile: (id: string, patch: UpdatePatch<BudgetRequestFile>) => void;
  updateLiquidationReport: (id: string, patch: UpdatePatch<LiquidationReport>) => void;
  updateLiquidationReportFile: (id: string, patch: UpdatePatch<LiquidationReportFile>) => void;
  updateNewsRelease: (id: string, patch: UpdatePatch<NewsRelease>) => void;
  updateTransparencyPost: (id: string, patch: UpdatePatch<TransparencyPost>) => void;
  updateComplianceRemark: (id: string, patch: UpdatePatch<ComplianceRemark>) => void;
  updateNotification: (id: string, patch: UpdatePatch<NotificationRecord>) => void;
  updateActivityLog: (id: string, patch: UpdatePatch<ActivityLog>) => void;
  updateTemplate: (id: string, patch: UpdatePatch<TemplateRecord>) => void;
  createNotification: (notification: NotificationRecord) => void;
  createActivityLog: (activity: ActivityLog) => void;
  markNotificationRead: (id: string) => void;
  setDocumentSubmissionStatus: (id: string, status: DocumentSubmissionStatus, remarks?: string) => void;
};

const LydoConnectContext = createContext<LydoConnectContextValue | undefined>(undefined);

const readState = (): LydoConnectState => {
  if (typeof window === "undefined") return seedState;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedState;

  try {
    const parsed = JSON.parse(raw) as Partial<LydoConnectState>;
    return {
      ...seedState,
      ...parsed,
      organizationProfiles: parsed.organizationProfiles ?? seedState.organizationProfiles,
      documentSubmissions: parsed.documentSubmissions ?? seedState.documentSubmissions,
      documentSubmissionFiles: parsed.documentSubmissionFiles ?? seedState.documentSubmissionFiles,
      budgetRequests: parsed.budgetRequests ?? seedState.budgetRequests,
      budgetRequestFiles: parsed.budgetRequestFiles ?? seedState.budgetRequestFiles,
      liquidationReports: parsed.liquidationReports ?? seedState.liquidationReports,
      liquidationReportFiles: parsed.liquidationReportFiles ?? seedState.liquidationReportFiles,
      newsReleases: parsed.newsReleases ?? seedState.newsReleases,
      transparencyPosts: parsed.transparencyPosts ?? seedState.transparencyPosts,
      complianceRemarks: parsed.complianceRemarks ?? seedState.complianceRemarks,
      notifications: parsed.notifications ?? seedState.notifications,
      activityLogs: parsed.activityLogs ?? seedState.activityLogs,
      templates: (parsed.templates ?? seedState.templates).filter((template) => !legacyRemovedTemplateNames.has(template.name)),
    };
  } catch {
    return seedState;
  }
};

const applyPatch = <T extends { id: string }>(items: T[], id: string, patch: UpdatePatch<T>) =>
  items.map((item) => {
    if (item.id !== id) return item;
    return typeof patch === "function" ? patch(item) : { ...item, ...patch };
  });

export const LydoConnectProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<LydoConnectState>(() => readState());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    const syncState = async () => {
      try {
        const snapshot = await loadLydoConnectSupabaseState();
        if (!active || !snapshot) return;
        setState((current) => ({
          ...current,
          ...snapshot,
        }));
      } catch (error) {
        console.error("Failed to sync LYDO Connect state from Supabase:", error);
      }
    };

    void syncState();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void syncState();
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<LydoConnectContextValue>(
    () => ({
      state,
      mergeRemoteState: (snapshot) =>
        setState((current) => ({
          ...current,
          ...snapshot,
        })),
      createTemplate: (template) =>
        setState((current) => ({
          ...current,
          templates: [...current.templates, template].sort((left, right) => left.sortOrder - right.sortOrder),
        })),
      removeTemplate: (id) =>
        setState((current) => ({
          ...current,
          templates: current.templates.filter((template) => template.id !== id),
        })),
      updateOrganizationProfile: (id, patch) =>
        setState((current) => ({
          ...current,
          organizationProfiles: applyPatch(current.organizationProfiles, id, patch),
        })),
      updateDocumentSubmission: (id, patch) =>
        setState((current) => ({
          ...current,
          documentSubmissions: applyPatch(current.documentSubmissions, id, patch),
        })),
      updateDocumentFile: (id, patch) =>
        setState((current) => ({
          ...current,
          documentSubmissionFiles: applyPatch(current.documentSubmissionFiles, id, patch),
        })),
      updateBudgetRequest: (id, patch) =>
        setState((current) => ({
          ...current,
          budgetRequests: applyPatch(current.budgetRequests, id, patch),
        })),
      updateBudgetRequestFile: (id, patch) =>
        setState((current) => ({
          ...current,
          budgetRequestFiles: applyPatch(current.budgetRequestFiles, id, patch),
        })),
      updateLiquidationReport: (id, patch) =>
        setState((current) => ({
          ...current,
          liquidationReports: applyPatch(current.liquidationReports, id, patch),
        })),
      updateLiquidationReportFile: (id, patch) =>
        setState((current) => ({
          ...current,
          liquidationReportFiles: applyPatch(current.liquidationReportFiles, id, patch),
        })),
      updateNewsRelease: (id, patch) =>
        setState((current) => ({
          ...current,
          newsReleases: applyPatch(current.newsReleases, id, patch),
        })),
      updateTransparencyPost: (id, patch) =>
        setState((current) => ({
          ...current,
          transparencyPosts: applyPatch(current.transparencyPosts, id, patch),
        })),
      updateComplianceRemark: (id, patch) =>
        setState((current) => ({
          ...current,
          complianceRemarks: applyPatch(current.complianceRemarks, id, patch),
        })),
      updateNotification: (id, patch) =>
        setState((current) => ({
          ...current,
          notifications: applyPatch(current.notifications, id, patch),
        })),
      updateActivityLog: (id, patch) =>
        setState((current) => ({
          ...current,
          activityLogs: applyPatch(current.activityLogs, id, patch),
        })),
      updateTemplate: (id, patch) =>
        setState((current) => ({
          ...current,
          templates: applyPatch(current.templates, id, patch),
        })),
      createNotification: (notification) =>
        setState((current) => ({
          ...current,
          notifications: [notification, ...current.notifications],
        })),
      createActivityLog: (activity) =>
        setState((current) => ({
          ...current,
          activityLogs: [activity, ...current.activityLogs],
        })),
      markNotificationRead: (id) =>
        setState((current) => ({
          ...current,
          notifications: current.notifications.map((notification) =>
            notification.id === id ? { ...notification, isRead: true } : notification,
          ),
        })),
      setDocumentSubmissionStatus: (id, status, remarks) =>
        setState((current) => ({
          ...current,
          documentSubmissions: current.documentSubmissions.map((submission) =>
            submission.id === id
              ? {
                  ...submission,
                  status,
                  overallRemarks: remarks ?? submission.overallRemarks,
                  updatedAt: new Date().toISOString(),
                }
              : submission,
          ),
        })),
    }),
    [state],
  );

  return <LydoConnectContext.Provider value={value}>{children}</LydoConnectContext.Provider>;
};

export const useLydoConnect = () => {
  const context = useContext(LydoConnectContext);
  if (!context) {
    throw new Error("useLydoConnect must be used within LydoConnectProvider");
  }
  return context;
};
