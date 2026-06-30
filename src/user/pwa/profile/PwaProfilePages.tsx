import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronRight, ExternalLink, Pencil } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { toast } from "@/hooks/use-toast";
import {
  advocacyOptions,
  formatSubClassificationLabel,
  majorClassificationOptions,
  subClassificationOptions,
  type OrganizationProfile,
} from "@/lib/lydo-connect-data";
import { upsertOrganizationProfileInSupabase } from "@/lib/lydo-connect-supabase";
import { organizationEmailPattern, philippineContactNumberPattern } from "@/lib/organization-profile-domain";
import type { usePwaPortalData } from "../hooks/usePwaPortalData";
import { usePwaNavigation } from "../hooks/usePwaNavigation";
import { PwaBackButton } from "../PwaBackButton";
import { PWA_ROUTES } from "../pwaRoutes";

type PortalData = ReturnType<typeof usePwaPortalData>;
type ProfileTab = "overview" | "details" | "activity";

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not provided";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const displayValue = (value?: string | null) => value?.trim() || "Not provided";
const requiredValue = (value?: string | null) => value?.trim() || "Missing information";
const classificationLabel = (profile: OrganizationProfile | null) =>
  [
    profile?.majorClassification,
    profile?.subClassification ? formatSubClassificationLabel(profile.subClassification) : "",
  ].filter(Boolean).join(" · ") || "Classification not provided";
const locationLabel = (profile: OrganizationProfile | null) =>
  [profile?.district, profile?.barangay].filter((value) => value?.trim()).join(" · ") || "Location not provided";

const statusCopy = (status?: OrganizationProfile["profileStatus"]) => {
  if (status === "verified") return "Your organization profile has been verified.";
  if (status === "pending_review") return "Your profile is complete and awaiting admin verification.";
  if (status === "needs_update") return "The admin requested changes to your organization profile.";
  return "Complete the required profile information and submit it for verification.";
};

function ProfileField({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div className="pwa-profile-field">
      <dt>{label}</dt>
      <dd>
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer">
            Open Facebook Page <ExternalLink aria-hidden="true" />
          </a>
        ) : value}
      </dd>
    </div>
  );
}

function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="pwa-card pwa-profile-section"><h2>{title}</h2>{children}</section>;
}

function ProfileSummary({ data, preview = false }: { data: PortalData; preview?: boolean }) {
  const { go } = usePwaNavigation();
  const profile = data.profile;
  return (
    <section className="pwa-card pwa-profile-summary">
      <div className="pwa-profile-identity">
        <span className="pwa-large-avatar" aria-hidden="true">{data.organizationName.charAt(0).toUpperCase()}</span>
        <div>
          <h2>{data.organizationName}</h2>
          <div className="pwa-profile-status-line">
            <StatusBadge status={profile?.profileStatus ?? "incomplete"} />
            <span>{data.profilePercent}% complete</span>
          </div>
          <p>{classificationLabel(profile)}</p>
          <p>{locationLabel(profile)}</p>
        </div>
      </div>
      <div className="pwa-profile-completeness">
        <div><span>Profile completeness</span><strong>{data.profilePercent}%</strong></div>
        <div className="pwa-profile-progress" role="progressbar" aria-label="Profile completeness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={data.profilePercent}>
          <span style={{ width: `${data.profilePercent}%` }} />
        </div>
      </div>
      {!preview ? (
        <div className="pwa-profile-actions">
          <Button onClick={() => go(PWA_ROUTES.profileEdit)}><Pencil aria-hidden="true" />Edit Profile</Button>
          <Button variant="outline" onClick={() => go(PWA_ROUTES.profilePublic)}>View Public Profile</Button>
        </div>
      ) : null}
      <p className="pwa-profile-updated">Last updated: {formatDateTime(profile?.updatedAt)}</p>
    </section>
  );
}

function ProfileOverview({ data }: { data: PortalData }) {
  const profile = data.profile;
  return (
    <div className="pwa-stack">
      <ProfileSection title="Verification Status">
        <div className="pwa-profile-verification">
          <StatusBadge status={profile?.profileStatus ?? "incomplete"} />
          <p>{statusCopy(profile?.profileStatus)}</p>
          {profile?.verifiedAt
            ? <time>Verified {formatDateTime(profile.verifiedAt)}</time>
            : profile?.updatedAt && profile.profileStatus !== "incomplete"
              ? <time>Submitted {formatDateTime(profile.updatedAt)}</time>
              : null}
        </div>
      </ProfileSection>
      <ProfileSection title="Organization Snapshot">
        <dl className="pwa-profile-fields">
          <ProfileField label="Organization Type" value={profile?.isExistingOrganization ? "Existing organization" : "New organization"} />
          <ProfileField label="Location" value={locationLabel(profile)} />
          <ProfileField label="Classification" value={classificationLabel(profile)} />
          <ProfileField label="Organization Identifier Number" value={profile?.isExistingOrganization ? requiredValue(profile.organizationIdentifierNumber) : "Not required for this organization type"} />
        </dl>
      </ProfileSection>
      <ProfileSection title="Leadership">
        <dl className="pwa-profile-fields">
          <ProfileField label="Representative" value={displayValue(profile?.representativeName)} />
          <ProfileField label="Adviser" value={displayValue(profile?.adviserName)} />
        </dl>
      </ProfileSection>
      <ProfileSection title="Contact Snapshot">
        <dl className="pwa-profile-fields">
          <ProfileField label="Organization Email" value={displayValue(profile?.organizationEmail)} />
          <ProfileField label="Contact Number" value={displayValue(profile?.contactNumber)} />
          <ProfileField label="Complete Address" value={displayValue(profile?.address)} />
        </dl>
      </ProfileSection>
      <ProfileSection title="Advocacy Focus Areas">
        {profile?.advocacies.length ? (
          <div className="pwa-profile-chips">{profile.advocacies.map((item) => <span key={item}>{item}</span>)}</div>
        ) : <p className="pwa-profile-empty">Missing information. Add at least one advocacy in Edit Profile.</p>}
      </ProfileSection>
    </div>
  );
}

function ProfileDetails({ data }: { data: PortalData }) {
  const profile = data.profile;
  const groups = [
    ["Organization Information", [
      ["Organization Name", requiredValue(profile?.organizationName)],
      ["Organization Type", profile?.isExistingOrganization ? "Existing organization" : "New organization"],
      ["Organization Identifier Number", profile?.isExistingOrganization ? requiredValue(profile.organizationIdentifierNumber) : "Not required for this organization type"],
    ]],
    ["Contact & Location", [
      ["Organization Email", requiredValue(profile?.organizationEmail)],
      ["Contact Number", requiredValue(profile?.contactNumber)],
      ["District", requiredValue(profile?.district)],
      ["Barangay", requiredValue(profile?.barangay)],
      ["Complete Address", displayValue(profile?.address)],
    ]],
    ["Classification", [
      ["Major Classification", requiredValue(profile?.majorClassification)],
      ["Sub-classification", profile?.subClassification ? formatSubClassificationLabel(profile.subClassification) : "Missing information"],
    ]],
    ["Leadership", [
      ["Representative", displayValue(profile?.representativeName)],
      ["Adviser", displayValue(profile?.adviserName)],
    ]],
  ] as const;
  return (
    <div className="pwa-stack">
      {groups.map(([title, fields]) => (
        <ProfileSection key={title} title={title}>
          <dl className="pwa-profile-fields">{fields.map(([label, value]) => <ProfileField key={label} label={label} value={value} />)}</dl>
        </ProfileSection>
      ))}
      <ProfileSection title="Contacts & Socials">
        <dl className="pwa-profile-fields">
          <ProfileField label="Facebook Page" value={profile?.facebookPageUrl ? "Open Facebook Page" : "Not provided"} link={profile?.facebookPageUrl || undefined} />
        </dl>
      </ProfileSection>
      <ProfileSection title="Record Information">
        <dl className="pwa-profile-fields">
          <ProfileField label="Profile Status" value={(profile?.profileStatus ?? "incomplete").replaceAll("_", " ")} />
          <ProfileField label="Date Created" value={formatDateTime(profile?.createdAt)} />
          <ProfileField label="Last Updated" value={formatDateTime(profile?.updatedAt)} />
          {profile?.verifiedAt ? <ProfileField label="Verification Date" value={formatDateTime(profile.verifiedAt)} /> : null}
        </dl>
      </ProfileSection>
    </div>
  );
}

function CityLedActivityList({ data }: { data: PortalData }) {
  return data.cityLedParticipations.slice(0, 3).length ? (
    <div className="pwa-profile-activity-list">
      {data.cityLedParticipations.slice(0, 3).map((item) => (
        <article key={item.id}>
          <div>
            <strong>{item.activityName}</strong>
            <time>{formatDateTime(item.joinedAt || item.activityDate)}</time>
            {item.venue ? <p>{item.venue}</p> : null}
          </div>
          <StatusBadge status={item.status} />
        </article>
      ))}
    </div>
  ) : <p className="pwa-profile-empty">No recent city-led activities.</p>;
}

function ProfileActivity({ data }: { data: PortalData }) {
  const { go } = usePwaNavigation();
  return (
    <div className="pwa-stack">
      <ProfileSection title="Recent City-Led Activities">
        <CityLedActivityList data={data} />
        {data.cityLedParticipations.length > 3 ? (
          <button type="button" className="pwa-profile-section-link" onClick={() => go(PWA_ROUTES.ypop)}>View all activities <ChevronRight aria-hidden="true" /></button>
        ) : null}
      </ProfileSection>
      <ProfileSection title="Recent Activity">
        {data.profileActivities.slice(0, 3).length ? (
          <div className="pwa-profile-audit-list">
            {data.profileActivities.slice(0, 3).map((item) => (
              <article key={item.id}>
                <span />
                <div>
                  <strong>{item.action.replaceAll("_", " ")}</strong>
                  {item.description ? <p>{item.description}</p> : null}
                  <time>{formatDateTime(item.createdAt)}</time>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="pwa-profile-empty">No profile activity recorded yet.</p>}
        {data.profileActivities.length ? (
          <button type="button" className="pwa-profile-section-link" onClick={() => go(PWA_ROUTES.activity)}>View full activity log <ChevronRight aria-hidden="true" /></button>
        ) : null}
      </ProfileSection>
    </div>
  );
}

export function PwaProfilePage({ data }: { data: PortalData }) {
  const [tab, setTab] = useState<ProfileTab>("overview");
  return (
    <div className="pwa-stack pwa-profile-page">
      <ProfileSummary data={data} />
      <div className="pwa-profile-tabs" role="tablist" aria-label="Organization profile sections">
        {(["overview", "details", "activity"] as const).map((item) => (
          <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? "is-active" : ""} onClick={() => setTab(item)}>
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === "overview" ? <ProfileOverview data={data} /> : null}
        {tab === "details" ? <ProfileDetails data={data} /> : null}
        {tab === "activity" ? <ProfileActivity data={data} /> : null}
      </div>
    </div>
  );
}

const blankProfile = (data: PortalData): OrganizationProfile => ({
  id: `draft-${data.user?.id || "organization"}`,
  userId: data.user?.id || "",
  organizationName: data.organizationName === "Organization" ? "" : data.organizationName,
  organizationEmail: data.user?.email || "",
  contactNumber: "",
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
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

function EditorField({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return <label className="pwa-profile-editor-field"><span>{label}{required ? " *" : ""}</span>{children}</label>;
}

export function PwaProfileEdit({ data }: { data: PortalData }) {
  const { go } = usePwaNavigation();
  const [draft, setDraft] = useState<OrganizationProfile>(() => data.profile ? { ...data.profile, advocacies: [...data.profile.advocacies] } : blankProfile(data));
  const [openSection, setOpenSection] = useState("basic");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data.profile) setDraft({ ...data.profile, advocacies: [...data.profile.advocacies] });
  }, [data.profile]);

  const setField = <K extends keyof OrganizationProfile>(field: K, value: OrganizationProfile[K]) =>
    setDraft((current) => ({ ...current, [field]: value }));
  const toggleAdvocacy = (advocacy: OrganizationProfile["advocacies"][number]) =>
    setDraft((current) => ({ ...current, advocacies: current.advocacies.includes(advocacy) ? current.advocacies.filter((item) => item !== advocacy) : [...current.advocacies, advocacy] }));

  const sectionSummary = useMemo(() => ({
    basic: draft.organizationName && draft.organizationEmail && draft.contactNumber ? "Complete" : "Missing information",
    location: draft.majorClassification && draft.subClassification ? "Complete" : "Missing information",
    advocacy: `${draft.advocacies.length} selected`,
    leadership: draft.representativeName && draft.adviserName ? "Complete" : "Missing information",
    contact: draft.address ? (draft.facebookPageUrl ? "Complete" : "1 field missing") : "Missing information",
  }), [draft]);

  const save = async () => {
    if (!data.user) return;
    const next: OrganizationProfile = {
      ...draft,
      userId: data.user.id,
      organizationName: draft.organizationName.trim(),
      organizationEmail: draft.organizationEmail.trim(),
      contactNumber: draft.contactNumber.trim(),
      district: draft.district.trim(),
      barangay: draft.barangay.trim(),
      organizationIdentifierNumber: draft.organizationIdentifierNumber.trim(),
      adviserName: draft.adviserName.trim(),
      representativeName: draft.representativeName.trim(),
      address: draft.address.trim(),
      facebookPageUrl: draft.facebookPageUrl.trim(),
      internalNotes: draft.internalNotes.trim(),
      profileStatus: "pending_review",
      verifiedAt: "",
      createdAt: data.profile?.createdAt || draft.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!next.organizationName || !next.organizationEmail || !next.contactNumber || !next.district || !next.barangay ||
      (next.isExistingOrganization && !next.organizationIdentifierNumber) || !next.majorClassification || !next.subClassification || !next.advocacies.length) {
      toast({ title: "Complete the profile", description: "Fill in all required organization, location, classification, and advocacy information.", variant: "destructive" });
      return;
    }
    if (!organizationEmailPattern.test(next.organizationEmail)) {
      toast({ title: "Invalid organization email", description: "Enter a valid organization email address.", variant: "destructive" });
      return;
    }
    if (!philippineContactNumberPattern.test(next.contactNumber)) {
      toast({ title: "Invalid contact number", description: "Enter an 11-digit Philippine mobile number starting with 09.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const saved = await upsertOrganizationProfileInSupabase(next);
      data.store.upsertOrganizationProfile(saved);
      await data.refresh();
      toast({ title: "Profile saved", description: "Your profile was updated and sent for admin review." });
      go(PWA_ROUTES.profile, { replace: true });
    } catch (error) {
      toast({ title: "Save failed", description: error instanceof Error ? error.message : "The profile could not be saved.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: "basic", label: "Basic Information" },
    { id: "location", label: "Location & Classification" },
    { id: "advocacy", label: "Advocacy Focus Areas" },
    { id: "leadership", label: "Leadership" },
    { id: "contact", label: "Contact & Social" },
  ] as const;
  return (
    <div className="pwa-stack pwa-profile-editor">
      <PwaBackButton fallback={PWA_ROUTES.profile} label="Organization Profile" />
      <section className="pwa-card pwa-profile-editor-intro"><Pencil aria-hidden="true" /><div><h2>Edit Profile</h2><p>Update the editable organization information below.</p></div></section>
      <Accordion type="single" collapsible value={openSection} onValueChange={setOpenSection} className="pwa-profile-editor-sections">
        {sections.map((section) => (
          <AccordionItem key={section.id} value={section.id} className="pwa-card">
            <AccordionTrigger><span>{section.label}<small>{sectionSummary[section.id]}</small></span></AccordionTrigger>
            <AccordionContent>
              {section.id === "basic" ? (
                <div className="pwa-profile-editor-grid">
                  <EditorField label="Organization Name" required><Input value={draft.organizationName} readOnly /></EditorField>
                  <EditorField label="Organization Email" required><Input value={draft.organizationEmail} readOnly /></EditorField>
                  <EditorField label="Contact Number" required><Input value={draft.contactNumber} readOnly /></EditorField>
                </div>
              ) : null}
              {section.id === "location" ? (
                <div className="pwa-profile-editor-grid">
                  <EditorField label="District" required><Input value={draft.district} readOnly /></EditorField>
                  <EditorField label="Barangay" required><Input value={draft.barangay} readOnly /></EditorField>
                  <EditorField label="Organization Type"><Input value={draft.isExistingOrganization ? "Existing organization" : "New organization"} readOnly /></EditorField>
                  <EditorField label="Organization Identifier Number"><Input value={draft.isExistingOrganization ? draft.organizationIdentifierNumber : "Not required"} readOnly /></EditorField>
                  <EditorField label="Major Classification" required>
                    <select value={draft.majorClassification} onChange={(event) => setField("majorClassification", event.target.value as OrganizationProfile["majorClassification"])}>
                      <option value="">Select major classification</option>
                      {majorClassificationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </EditorField>
                  <EditorField label="Sub-classification" required>
                    <select value={draft.subClassification} onChange={(event) => setField("subClassification", event.target.value as OrganizationProfile["subClassification"])}>
                      <option value="">Select sub-classification</option>
                      {subClassificationOptions.map((option) => <option key={option} value={option}>{formatSubClassificationLabel(option)}</option>)}
                    </select>
                  </EditorField>
                </div>
              ) : null}
              {section.id === "advocacy" ? (
                <div className="pwa-profile-advocacy-options">
                  {advocacyOptions.map((item) => <label key={item}><input type="checkbox" checked={draft.advocacies.includes(item)} onChange={() => toggleAdvocacy(item)} /><span>{item}</span></label>)}
                </div>
              ) : null}
              {section.id === "leadership" ? (
                <div className="pwa-profile-editor-grid">
                  <EditorField label="Representative"><Input value={draft.representativeName} onChange={(event) => setField("representativeName", event.target.value)} /></EditorField>
                  <EditorField label="Adviser"><Input value={draft.adviserName} onChange={(event) => setField("adviserName", event.target.value)} /></EditorField>
                </div>
              ) : null}
              {section.id === "contact" ? (
                <div className="pwa-profile-editor-grid">
                  <EditorField label="Complete Address"><Textarea rows={4} value={draft.address} onChange={(event) => setField("address", event.target.value)} /></EditorField>
                  <EditorField label="Facebook Page"><Input type="url" value={draft.facebookPageUrl} onChange={(event) => setField("facebookPageUrl", event.target.value)} placeholder="https://facebook.com/..." /></EditorField>
                </div>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="pwa-profile-editor-actions">
        <Button variant="outline" disabled={saving} onClick={() => go(PWA_ROUTES.profile)}>Cancel</Button>
        <Button disabled={saving} onClick={() => void save()}>{saving ? "Saving..." : "Save Profile"}</Button>
      </div>
    </div>
  );
}

export function PwaProfilePublicPreview({ data }: { data: PortalData }) {
  const profile = data.profile;
  return (
    <div className="pwa-stack pwa-profile-public">
      <PwaBackButton fallback={PWA_ROUTES.profile} label="Organization Profile" />
      <ProfileSummary data={data} preview />
      <ProfileSection title="Public Organization Information">
        <dl className="pwa-profile-fields">
          <ProfileField label="Representative" value={displayValue(profile?.representativeName)} />
          <ProfileField label="Adviser" value={displayValue(profile?.adviserName)} />
          <ProfileField label="Classification" value={classificationLabel(profile)} />
          <ProfileField label="Location" value={locationLabel(profile)} />
          <ProfileField label="Facebook Page" value={profile?.facebookPageUrl ? "Open Facebook Page" : "Not provided"} link={profile?.facebookPageUrl || undefined} />
        </dl>
      </ProfileSection>
      <ProfileSection title="Recent City-Led Activities"><CityLedActivityList data={data} /></ProfileSection>
    </div>
  );
}
