import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { PwaAppShell } from "./PwaAppShell";
import { PwaMorePage } from "./PwaMorePage";
import PwaDashboard from "./dashboard/PwaDashboard";
import { usePwaPortalData } from "./hooks/usePwaPortalData";
import {
  PwaActivity, PwaCompliance, PwaInquiries, PwaNews, PwaNotifications,
  PwaTransparency,
} from "./PwaResourcePages";
import { PwaProfileEdit, PwaProfilePage, PwaProfilePublicPreview } from "./profile/PwaProfilePages";
import { PwaTemplateLibrary, PwaTemplatePreview } from "./templates/PwaTemplatePages";
import { PwaYpopPage } from "./ypop/PwaYpopPage";
import { PwaYpopPpaEditor, PwaYpopWorkspace } from "./ypop/PwaYpopWorkspace";
import {
  PwaDocumentDetail, PwaDocumentList, PwaDocumentManager,
} from "./documents/PwaDocumentPages";
import {
  PwaBudgetDetail, PwaBudgetForm, PwaBudgetList,
} from "./budgets/PwaBudgetPages";
import {
  PwaLiquidationDetail, PwaLiquidationList, PwaLiquidationManager,
} from "./liquidations/PwaLiquidationPages";
import { getPwaPageTitle, PWA_ROUTES } from "./pwaRoutes";
import "./styles/pwa-app.css";

export default function PwaUserPortal() {
  const data = usePwaPortalData();
  const { pathname } = useLocation();
  const title = getPwaPageTitle(pathname);

  return (
    <PwaAppShell
      title={title}
      organizationName={data.organizationName}
      unreadCount={data.unreadCount}
      dashboard={pathname === PWA_ROUTES.home}
    >
      <Routes>
        <Route index element={<PwaDashboard data={data} />} />
        <Route path="documents" element={<PwaDocumentList data={data} />} />
        <Route path="documents/manage" element={<PwaDocumentManager data={data} />} />
        <Route path="documents/:documentId" element={<PwaDocumentDetail data={data} />} />
        <Route path="budgets" element={<PwaBudgetList data={data} />} />
        <Route path="budgets/new" element={<PwaBudgetForm data={data} mode="new" />} />
        <Route path="budgets/:requestId" element={<PwaBudgetDetail data={data} />} />
        <Route path="budgets/:requestId/edit" element={<PwaBudgetForm data={data} mode="edit" />} />
        <Route path="liquidations" element={<PwaLiquidationList data={data} />} />
        <Route path="liquidations/:reportId" element={<PwaLiquidationDetail data={data} />} />
        <Route path="liquidations/:reportId/manage" element={<PwaLiquidationManager data={data} />} />
        <Route path="notifications" element={<PwaNotifications data={data} />} />
        <Route path="activity" element={<PwaActivity data={data} />} />
        <Route path="profile" element={<PwaProfilePage data={data} />} />
        <Route path="profile/edit" element={<PwaProfileEdit data={data} />} />
        <Route path="profile/public" element={<PwaProfilePublicPreview data={data} />} />
        <Route path="ypop" element={<PwaYpopPage data={data} />} />
        <Route path="ypop/period/:periodId" element={<PwaYpopWorkspace data={data} />} />
        <Route path="ypop/:entryId/ppa/new" element={<PwaYpopPpaEditor data={data} />} />
        <Route path="ypop/:entryId/ppa/:activityId" element={<PwaYpopPpaEditor data={data} />} />
        <Route path="ypop/:entryId" element={<PwaYpopWorkspace data={data} />} />
        <Route path="templates" element={<PwaTemplateLibrary data={data} />} />
        <Route path="templates/:templateId" element={<PwaTemplatePreview data={data} />} />
        <Route path="news" element={<PwaNews data={data} />} />
        <Route path="news/:newsReleaseId" element={<PwaNews data={data} />} />
        <Route path="transparency" element={<PwaTransparency data={data} />} />
        <Route path="compliance" element={<PwaCompliance data={data} />} />
        <Route path="inquiries" element={<PwaInquiries data={data} />} />
        <Route path="more" element={<PwaMorePage onSignOut={data.signOut} />} />
        <Route path="*" element={<Navigate to={PWA_ROUTES.home} replace />} />
      </Routes>
    </PwaAppShell>
  );
}
