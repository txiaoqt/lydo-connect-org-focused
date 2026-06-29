import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Bell, CalendarDays, ChevronRight, Download, ExternalLink, FileText, HelpCircle,
  MapPin, Medal, Megaphone, ReceiptText, Scale, ShieldCheck, UserRound, WalletCards,
} from "lucide-react";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { createInquiryInSupabase, resolveSupabaseFileUrl } from "@/lib/lydo-connect-supabase";
import type { usePwaPortalData } from "./hooks/usePwaPortalData";

type PortalData = ReturnType<typeof usePwaPortalData>;

const currency = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
const dateLabel = (value: string) => value ? new Date(value).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "Not set";

function FullTools({ path, label = "Open Full Workspace" }: { path: string; label?: string }) {
  const separator = path.includes("?") ? "&" : "?";
  return <a className="pwa-primary-link" href={`${path}${separator}webView=1`}>{label}<ChevronRight aria-hidden="true" /></a>;
}

function PageIntro({ icon: Icon, title, copy }: { icon: typeof FileText; title: string; copy: string }) {
  return <section className="pwa-page-intro"><span><Icon aria-hidden="true" /></span><div><h2>{title}</h2><p>{copy}</p></div></section>;
}

export function PwaDocuments({ data }: { data: PortalData }) {
  const byType = new Map(data.documentFiles.map((file) => [file.documentTypeId, file]));
  return <div className="pwa-stack">
    <PageIntro icon={FileText} title={`${data.approvedDocuments} of ${data.requiredTemplates.length} approved`} copy="Review every required file and open the full workspace to upload or replace documents." />
    <section className="pwa-card pwa-record-list">
      {data.requiredTemplates.map((template) => {
        const file = byType.get(template.id);
        return <article key={template.id}><span className="pwa-record-icon"><FileText /></span><div><strong>{template.name}</strong><small>{file?.fileName || "No file uploaded"}</small></div><StatusBadge status={file?.adminStatus ?? "missing"} /></article>;
      })}
    </section>
    <FullTools path="/document-submission" label="Upload or Manage Documents" />
  </div>;
}

export function PwaBudgets({ data }: { data: PortalData }) {
  return <div className="pwa-stack">
    <PageIntro icon={WalletCards} title={`${data.budgetRequests.length} budget request${data.budgetRequests.length === 1 ? "" : "s"}`} copy="Track requests and use the full workspace to create, revise, or submit one." />
    <section className="pwa-record-list pwa-stack">
      {data.budgetRequests.map((item) => <article className="pwa-card" key={item.id}><div className="pwa-record-heading"><div><h3>{item.activityTitle || "Untitled activity"}</h3><p>{currency.format(item.requestedAmount)} · {dateLabel(item.activityDate)}</p></div><StatusBadge status={item.status} /></div><dl><div><dt>Venue</dt><dd>{item.venue || "Not set"}</dd></div><div><dt>Updated</dt><dd>{dateLabel(item.updatedAt)}</dd></div></dl></article>)}
      {!data.budgetRequests.length ? <section className="pwa-card pwa-empty-copy">No budget requests yet.</section> : null}
    </section>
    <FullTools path="/budget-request" label="Create or Manage Budget Request" />
  </div>;
}

export function PwaLiquidations({ data }: { data: PortalData }) {
  return <div className="pwa-stack">
    <PageIntro icon={ReceiptText} title={`${data.liquidationReports.length} liquidation report${data.liquidationReports.length === 1 ? "" : "s"}`} copy="Deadlines turn red only when they are genuinely overdue." />
    <section className="pwa-record-list pwa-stack">
      {data.liquidationReports.map((item) => {
        const budget = data.budgetRequests.find((request) => request.id === item.budgetRequestId);
        const overdue = item.status === "overdue" || (item.deadlineAt && new Date(item.deadlineAt).getTime() < Date.now() && item.status !== "completed_liquidated");
        return <article className="pwa-card" key={item.id}><div className="pwa-record-heading"><div><h3>{budget?.activityTitle || "Liquidation Report"}</h3><p>{currency.format(budget?.releasedAmount ?? 0)}</p></div><StatusBadge status={item.status} /></div><dl><div><dt>Go Signal</dt><dd>{dateLabel(item.goSignalAt)}</dd></div><div className={overdue ? "is-danger" : ""}><dt>Deadline</dt><dd>{dateLabel(item.deadlineAt)}</dd></div></dl></article>;
      })}
      {!data.liquidationReports.length ? <section className="pwa-card pwa-empty-copy">No liquidation reports are available yet.</section> : null}
    </section>
    <FullTools path="/liquidation-reporting" label="Upload or Manage Liquidation" />
  </div>;
}

export function PwaProfile({ data }: { data: PortalData }) {
  const profile = data.profile;
  return <div className="pwa-stack">
    <section className="pwa-card pwa-profile-hero"><span className="pwa-large-avatar">{data.organizationName.charAt(0).toUpperCase()}</span><div><h2>{data.organizationName}</h2><StatusBadge status={profile?.profileStatus ?? "incomplete"} /><strong>{data.profilePercent}% complete</strong></div></section>
    <section className="pwa-card pwa-detail-list">
      <div><UserRound /><span><small>Representative</small><strong>{profile?.representativeName || "Not set"}</strong></span></div>
      <div><ShieldCheck /><span><small>Classification</small><strong>{[profile?.majorClassification, profile?.subClassification].filter(Boolean).join(" · ") || "Not set"}</strong></span></div>
      <div><MapPin /><span><small>Location</small><strong>{[profile?.barangay, profile?.district].filter(Boolean).join(" · ") || "Not set"}</strong></span></div>
      <div><Medal /><span><small>Advocacy Areas</small><strong>{profile?.advocacies.join(", ") || "Not set"}</strong></span></div>
    </section>
    <FullTools path="/organization-profile" label="Edit Organization Profile" />
  </div>;
}

export function PwaYpop({ data }: { data: PortalData }) {
  return <div className="pwa-stack"><PageIntro icon={Medal} title="YPOP Incentive" copy="Review semesters, qualification results, and current scoring." /><section className="pwa-record-list pwa-stack">{data.ypopEntries.map((item) => <article className="pwa-card" key={item.id}><div className="pwa-record-heading"><div><h3>{item.semesterLabel}</h3><p>{item.pointsEarned} of {item.pointsRequired} required points</p></div><StatusBadge status={item.status} /></div><div className="pwa-progress"><span style={{ width: `${Math.min(100, item.pointsRequired ? (item.pointsEarned / item.pointsRequired) * 100 : 0)}%` }} /></div></article>)}{!data.ypopEntries.length ? <section className="pwa-card pwa-empty-copy">No YPOP semester records yet.</section> : null}</section><FullTools path="/ypop" label="Open YPOP Workspace" /></div>;
}

export function PwaTemplates({ data }: { data: PortalData }) {
  const open = async (url: string) => {
    const resolved = await resolveSupabaseFileUrl(url);
    window.open(resolved, "_blank", "noopener,noreferrer");
  };
  return <div className="pwa-stack"><PageIntro icon={FileText} title="Official Templates" copy="View or download active templates published for your organization." /><section className="pwa-record-list pwa-stack">{data.templates.map((item) => <article className="pwa-card" key={item.id}><div className="pwa-record-heading"><div><h3>{item.name}</h3><p>{item.description || "Official reference file"}</p></div><StatusBadge status={item.templateFileUrl ? "active" : "draft"} /></div><Button variant="outline" disabled={!item.templateFileUrl} onClick={() => void open(item.templateFileUrl)}><Download className="mr-2 h-4 w-4" />View or Download</Button></article>)}</section></div>;
}

export function PwaNews({ data }: { data: PortalData }) {
  const { newsReleaseId } = useParams();
  const navigate = useNavigate();
  const selected = newsReleaseId ? data.news.find((item) => item.id === newsReleaseId) : null;
  if (selected) {
    return <article className="pwa-card pwa-news-detail">{selected.previewImageUrl ? <img src={selected.previewImageUrl} alt="" /> : null}<StatusBadge status={selected.visibilityStatus} /><h2>{selected.title}</h2><time>{dateLabel(selected.datePosted)}</time><p>{selected.description}</p>{selected.facebookPostUrl ? <a className="pwa-primary-link" href={selected.facebookPostUrl} target="_blank" rel="noreferrer">Open Facebook Post <ExternalLink /></a> : null}</article>;
  }
  return <div className="pwa-stack"><PageIntro icon={Megaphone} title="News Releases" copy="Official announcements and updates from the LYDO." /><section className="pwa-news-list">{data.news.map((item) => <button key={item.id} type="button" className="pwa-card" onClick={() => item.facebookPostUrl ? window.open(item.facebookPostUrl, "_blank", "noopener,noreferrer") : navigate(`/news-releases/${item.id}`)}>{item.previewImageUrl ? <img src={item.previewImageUrl} alt="" /> : <span className="pwa-news-placeholder"><Megaphone /></span>}<span><strong>{item.title}</strong><small>{dateLabel(item.datePosted)}</small><p>{item.description}</p></span><ExternalLink /></button>)}</section></div>;
}

export function PwaCompliance({ data }: { data: PortalData }) {
  return <div className="pwa-stack"><PageIntro icon={ShieldCheck} title="Compliance Status" copy="Current remarks and consequences linked to your organization records." /><section className="pwa-record-list pwa-stack">{data.compliance.map((item) => <article className="pwa-card" key={item.id}><div className="pwa-record-heading"><div><h3>{item.relatedType.replaceAll("_", " ")}</h3><p>{item.message}</p></div><StatusBadge status={item.status || "pending"} /></div></article>)}{!data.compliance.length ? <section className="pwa-card pwa-empty-copy">No active compliance remarks.</section> : null}</section></div>;
}

export function PwaTransparency({ data }: { data: PortalData }) {
  return <div className="pwa-stack"><PageIntro icon={Scale} title="Public Transparency" copy="Published financial and program records." /><section className="pwa-record-list pwa-stack">{data.transparency.map((item) => <article className="pwa-card" key={item.id}><div className="pwa-record-heading"><div><h3>{item.title}</h3><p>{item.category} · {dateLabel(item.postDate)}</p></div><StatusBadge status={item.visibilityStatus} /></div><p>{item.description}</p>{item.attachmentUrl ? <a href={item.attachmentUrl} target="_blank" rel="noreferrer">Open attachment <ExternalLink /></a> : null}</article>)}</section></div>;
}

export function PwaNotifications({ data }: { data: PortalData }) {
  return <div className="pwa-stack"><div className="pwa-inline-heading"><span>{data.unreadCount} unread</span>{data.unreadCount ? <button type="button" onClick={() => void data.markAllRead()}>Mark all read</button> : null}</div><section className="pwa-notification-list">{data.notifications.map((item) => <button key={item.id} type="button" className={`pwa-card ${item.isRead ? "" : "is-unread"}`} onClick={() => !item.isRead && void data.markRead(item.id)}><span className="pwa-record-icon"><Bell /></span><span><strong>{item.title}</strong><p>{item.message}</p><small>{dateLabel(item.createdAt)}</small></span></button>)}{!data.notifications.length ? <section className="pwa-card pwa-empty-copy">You&apos;re all caught up.</section> : null}</section></div>;
}

export function PwaInquiries({ data }: { data: PortalData }) {
  const [form, setForm] = useState({ subject: "", description: "" });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!form.subject.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      const saved = await createInquiryInSupabase({
        submitterName: data.organizationName,
        organizationName: data.organizationName,
        email: data.profile?.organizationEmail || data.user?.email || "",
        subject: form.subject,
        description: form.description,
      });
      data.store.createInquiry(saved);
      setForm({ subject: "", description: "" });
      toast({ title: "Inquiry sent", description: "Your inquiry is now pending review." });
    } catch (error) {
      toast({ title: "Unable to send inquiry", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  return <div className="pwa-stack"><PageIntro icon={HelpCircle} title="Inquiries" copy="Send a question to the LYDO and track earlier submissions." /><section className="pwa-card pwa-form-card"><label>Subject<Input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} /></label><label>Description<Textarea rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label><Button disabled={saving || !form.subject.trim() || !form.description.trim()} onClick={() => void submit()}>{saving ? "Sending..." : "Send Inquiry"}</Button></section><section className="pwa-record-list pwa-stack">{data.inquiries.map((item) => <article className="pwa-card" key={item.id}><div className="pwa-record-heading"><div><h3>{item.subject}</h3><p>{dateLabel(item.createdAt)}</p></div><StatusBadge status={item.status} /></div><p>{item.description}</p>{item.adminRemarks ? <small className="pwa-admin-note">Admin: {item.adminRemarks}</small> : null}</article>)}</section></div>;
}
