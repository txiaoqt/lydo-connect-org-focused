import { readAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export type OrganizationDeletionCounts = {
  documentSubmissions: number;
  documentFiles: number;
  budgetRequests: number;
  budgetFiles: number;
  liquidationReports: number;
  liquidationFiles: number;
  ypopEntries: number;
  ypopFiles: number;
  ypopParticipations: number;
  ypopActivities: number;
  inquiries: number;
  notifications: number;
  complianceRemarks: number;
  activityLogs: number;
  storageObjects: number;
};

export type OrganizationDeletionPreflight = {
  organization: { id: string; name: string };
  counts: OrganizationDeletionCounts;
};

export type OrganizationDeletionResult = {
  success: true;
  organizationId: string;
  counts: OrganizationDeletionCounts;
  auditRecorded: boolean;
};

type DeletionErrorPayload = {
  error?: string;
  stage?: string;
  retryable?: boolean;
};

export class OrganizationDeletionError extends Error {
  constructor(
    message: string,
    readonly stage = "request",
    readonly retryable = false,
  ) {
    super(message);
  }
}

export const normalizeOrganizationDeletionConfirmation = (value: string) =>
  value.trim().replace(/\s+/g, " ");

export const organizationDeletionConfirmationMatches = (entered: string, organizationName: string) =>
  normalizeOrganizationDeletionConfirmation(entered) ===
  normalizeOrganizationDeletionConfirmation(organizationName);

export const getOrganizationDeletionServiceError = (
  status: number | null,
  payload: DeletionErrorPayload | null,
  fallbackMessage: string,
) => {
  if (status === 404) {
    return "The account deletion service is not deployed. Deploy the delete-organization-account server function, then retry.";
  }
  return payload?.error || fallbackMessage;
};

const invokeDeletionFunction = async <T>(
  body: Record<string, unknown>,
  fallbackMessage: string,
): Promise<T> => {
  if (!supabase) throw new OrganizationDeletionError("Supabase is not configured.");
  const adminSession = readAdminSession();
  if (!adminSession?.sessionToken) {
    throw new OrganizationDeletionError(
      "You are not authorized to delete organization accounts.",
      "authorization",
    );
  }

  const { data, error } = await supabase.functions.invoke("delete-organization-account", {
    body,
    headers: { "x-admin-session-token": adminSession.sessionToken },
  });
  if (!error) return data as T;

  let payload: DeletionErrorPayload | null = data && typeof data === "object"
    ? data as DeletionErrorPayload
    : null;
  const context = (error as { context?: unknown }).context;
  const responseStatus = context instanceof Response ? context.status : null;
  if (!payload && context instanceof Response) {
    try {
      payload = await context.clone().json() as DeletionErrorPayload;
    } catch {
      payload = null;
    }
  }
  throw new OrganizationDeletionError(
    getOrganizationDeletionServiceError(responseStatus, payload, fallbackMessage),
    payload?.stage,
    payload?.retryable,
  );
};

export const fetchOrganizationDeletionPreflight = (organizationId: string) =>
  invokeDeletionFunction<OrganizationDeletionPreflight>(
    { action: "preflight", organizationId },
    "The organization deletion summary could not be loaded.",
  );

export const permanentlyDeleteOrganizationAccount = (
  organizationId: string,
  confirmationName: string,
) =>
  invokeDeletionFunction<OrganizationDeletionResult>(
    { action: "delete", organizationId, confirmationName, acknowledged: true },
    "The organization account could not be deleted. Please try again.",
  );
