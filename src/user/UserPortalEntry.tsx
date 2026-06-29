import { lazy, Suspense, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import UserPortal from "@/user/UserPortal";
import { useInstalledUserPwa } from "@/user/pwa/hooks/useInstalledUserPwa";
import PwaInitialLoadingScreen from "@/user/pwa/PwaInitialLoadingScreen";
import { PwaErrorBoundary } from "@/user/pwa/PwaErrorBoundary";

const PwaUserPortal = lazy(() => import("@/user/pwa/PwaUserPortal"));

export type UserPortalSection =
  | "dashboard"
  | "organization-profile"
  | "document-submission"
  | "budget-request"
  | "liquidation-reporting"
  | "news-releases"
  | "public-transparency"
  | "compliance-status"
  | "notifications"
  | "ypop"
  | "templates"
  | "more"
  | "inquiries";

export default function UserPortalEntry({ section, browserElement }: { section: UserPortalSection; browserElement?: ReactNode }) {
  const usePwaUi = useInstalledUserPwa();

  if (!usePwaUi) {
    if (section === "more" || section === "inquiries") return <Navigate to="/dashboard" replace />;
    return browserElement ?? <UserPortal section={section} />;
  }

  return (
    <PwaErrorBoundary>
      <Suspense fallback={<PwaInitialLoadingScreen />}>
        <PwaUserPortal section={section} />
      </Suspense>
    </PwaErrorBoundary>
  );
}
