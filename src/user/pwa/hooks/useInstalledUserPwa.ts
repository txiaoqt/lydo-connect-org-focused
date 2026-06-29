import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { IS_ADMIN_SURFACE } from "@/lib/deployment-surface";
import { useStandalonePwa } from "./useStandalonePwa";

const USER_PWA_ROUTES = [
  "/dashboard",
  "/organization-profile",
  "/document-submission",
  "/budget-request",
  "/liquidation-reporting",
  "/news-releases",
  "/public-transparency",
  "/compliance-status",
  "/notifications",
  "/ypop",
  "/templates",
  "/app-more",
  "/app-inquiries",
];

export type InstalledUserPwaDecision = {
  enabled: boolean;
  adminSurface: boolean;
  userRoute: boolean;
  compact: boolean;
  standalone: boolean;
  developmentPreview: boolean;
  forceWebView: boolean;
};

export const shouldUseInstalledUserPwa = ({
  enabled,
  adminSurface,
  userRoute,
  compact,
  standalone,
  developmentPreview,
  forceWebView,
}: InstalledUserPwaDecision) =>
  enabled &&
  !adminSurface &&
  userRoute &&
  compact &&
  (standalone || developmentPreview) &&
  !forceWebView;

export function useInstalledUserPwa() {
  const { pathname, search } = useLocation();
  const standalone = useStandalonePwa();
  const [compact, setCompact] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false,
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  const params = new URLSearchParams(search);
  const developmentPreview = import.meta.env.DEV && params.get("pwaPreview") === "1";
  const forceWebView = params.get("webView") === "1";
  const enabled = import.meta.env.VITE_ENABLE_STANDALONE_USER_PWA_UI === "true";
  const isUserRoute = USER_PWA_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  return shouldUseInstalledUserPwa({
    enabled,
    adminSurface: IS_ADMIN_SURFACE,
    userRoute: isUserRoute,
    compact,
    standalone,
    developmentPreview,
    forceWebView,
  });
}
