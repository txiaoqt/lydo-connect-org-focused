import type { OrganizationProfile } from "@/lib/lydo-connect-data";

export const getProfileCompletionCount = (profile: OrganizationProfile | null) =>
  profile
    ? [
        profile.organizationName.trim(),
        profile.organizationEmail.trim(),
        profile.contactNumber.trim(),
        profile.district.trim(),
        profile.barangay.trim(),
        profile.isExistingOrganization ? profile.organizationIdentifierNumber.trim() : "",
        profile.majorClassification.trim(),
        profile.subClassification.trim(),
        profile.advocacies.length ? "advocacies" : "",
        profile.adviserName.trim(),
        profile.representativeName.trim(),
        profile.address.trim(),
      ].filter(Boolean).length
    : 0;

export const getProfileCompletionTarget = (profile: OrganizationProfile | null) =>
  11 + (profile?.isExistingOrganization ? 1 : 0);

export const getProfileCompletionPercent = (profile: OrganizationProfile | null) => {
  if (!profile) return 0;
  const target = getProfileCompletionTarget(profile);
  const calculated = target ? Math.round((getProfileCompletionCount(profile) / target) * 100) : 0;
  return Math.min(100, Math.max(0, calculated));
};

