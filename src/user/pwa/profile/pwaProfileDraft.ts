import type { AuthUser } from "@/hooks/use-auth";
import type { OrganizationProfile } from "@/lib/lydo-connect-data";

type BlankProfileSource = {
  user: AuthUser | null;
  organizationName: string;
};

export const createBlankPwaOrganizationProfile = (
  data: BlankProfileSource,
  now = new Date().toISOString(),
): OrganizationProfile => ({
  id: `draft-${data.user?.id || "organization"}`,
  userId: data.user?.id || "",
  organizationName: data.organizationName === "Organization" ? "" : data.organizationName,
  organizationEmail: data.user?.email || "",
  contactNumber: data.user?.profileHints?.contactNumber?.trim() || "",
  district: data.user?.profileHints?.district || "",
  barangay: data.user?.profileHints?.barangay || "",
  isExistingOrganization: Boolean(data.user?.profileHints?.isExistingOrganization),
  organizationIdentifierNumber: data.user?.profileHints?.organizationIdentifierNumber || "",
  majorClassification: "",
  subClassification: "",
  advocacies: [],
  adviserName: "",
  representativeName: "",
  address: "",
  facebookPageUrl: "",
  profileStatus: "incomplete",
  verifiedAt: "",
  internalNotes: "",
  yorpRegisteredYear: null,
  yorpRenewedYear: null,
  createdAt: now,
  updatedAt: now,
});
