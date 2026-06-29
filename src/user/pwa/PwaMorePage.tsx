import {
  Bell, ChevronRight, FileText, HelpCircle, LogOut, Medal, Megaphone,
  Scale, ShieldCheck, UserRound,
} from "lucide-react";
import { usePwaNavigation } from "./hooks/usePwaNavigation";
import { PWA_ROUTES } from "./pwaRoutes";

const links = [
  { label: "Organization Profile", detail: "Identity, classification and contacts", path: PWA_ROUTES.profile, icon: UserRound },
  { label: "Compliance Status", detail: "Review requirements and remarks", path: PWA_ROUTES.compliance, icon: ShieldCheck },
  { label: "YPOP Incentive", detail: "Semesters, scores and proof records", path: PWA_ROUTES.ypop, icon: Medal },
  { label: "Templates", detail: "View and download official files", path: PWA_ROUTES.templates, icon: FileText },
  { label: "News Releases", detail: "Official LYDO updates", path: PWA_ROUTES.news, icon: Megaphone },
  { label: "Public Transparency", detail: "Published budget information", path: PWA_ROUTES.transparency, icon: Scale },
  { label: "Notifications", detail: "Updates about your records", path: PWA_ROUTES.notifications, icon: Bell },
  { label: "Inquiries", detail: "Send and review inquiries", path: PWA_ROUTES.inquiries, icon: HelpCircle },
];

export function PwaMorePage({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const { go } = usePwaNavigation();
  return (
    <div className="pwa-stack">
      <section className="pwa-card pwa-menu-card">
        {links.map(({ label, detail, path, icon: Icon }) => (
          <button key={path} type="button" onClick={() => go(path)}>
            <span className="pwa-menu-icon"><Icon aria-hidden="true" /></span>
            <span className="pwa-menu-copy"><strong>{label}</strong><small>{detail}</small></span>
            <ChevronRight aria-hidden="true" className="pwa-chevron" />
          </button>
        ))}
      </section>
      <button type="button" className="pwa-signout-button" onClick={() => void onSignOut()}>
        <LogOut aria-hidden="true" /> Sign Out
      </button>
    </div>
  );
}
