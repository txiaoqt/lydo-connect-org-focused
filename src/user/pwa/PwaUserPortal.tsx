import type { UserPortalSection } from "@/user/UserPortalEntry";
import { PwaAppShell } from "./PwaAppShell";
import { PwaMorePage } from "./PwaMorePage";
import PwaDashboard from "./dashboard/PwaDashboard";
import { usePwaPortalData } from "./hooks/usePwaPortalData";
import {
  PwaBudgets, PwaCompliance, PwaDocuments, PwaInquiries, PwaLiquidations,
  PwaNews, PwaNotifications, PwaProfile, PwaTemplates, PwaTransparency, PwaYpop,
} from "./PwaResourcePages";
import "./styles/pwa-app.css";

const titles: Record<UserPortalSection, string> = {
  dashboard: "Dashboard",
  "organization-profile": "Organization Profile",
  "document-submission": "Documents",
  "budget-request": "Budget Requests",
  "liquidation-reporting": "Liquidation",
  "news-releases": "News Releases",
  "public-transparency": "Public Transparency",
  "compliance-status": "Compliance Status",
  notifications: "Notifications",
  ypop: "YPOP Incentive",
  templates: "Templates",
  more: "More",
  inquiries: "Inquiries",
};

export default function PwaUserPortal({ section }: { section: UserPortalSection }) {
  const data = usePwaPortalData();
  let content;

  switch (section) {
    case "dashboard": content = <PwaDashboard data={data} />; break;
    case "organization-profile": content = <PwaProfile data={data} />; break;
    case "document-submission": content = <PwaDocuments data={data} />; break;
    case "budget-request": content = <PwaBudgets data={data} />; break;
    case "liquidation-reporting": content = <PwaLiquidations data={data} />; break;
    case "news-releases": content = <PwaNews data={data} />; break;
    case "public-transparency": content = <PwaTransparency data={data} />; break;
    case "compliance-status": content = <PwaCompliance data={data} />; break;
    case "notifications": content = <PwaNotifications data={data} />; break;
    case "ypop": content = <PwaYpop data={data} />; break;
    case "templates": content = <PwaTemplates data={data} />; break;
    case "inquiries": content = <PwaInquiries data={data} />; break;
    case "more": content = <PwaMorePage onSignOut={data.signOut} />; break;
  }

  return (
    <PwaAppShell
      title={titles[section]}
      organizationName={data.organizationName}
      unreadCount={data.unreadCount}
      dashboard={section === "dashboard"}
    >
      {content}
    </PwaAppShell>
  );
}
