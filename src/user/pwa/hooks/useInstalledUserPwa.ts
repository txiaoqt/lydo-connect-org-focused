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
  "/app",
];

export type InstalledUserPwaDecision = {
  enabled: boolean;
  adminSurface: boolean;
  userRoute: boolean;
  compact: boolean;
  standalone: boolean;
  developmentPreview: boolean;
};

export const shouldUseInstalledUserPwa = ({
  enabled,
  adminSurface,
  userRoute,
  compact,
  standalone,
  developmentPreview,
}: InstalledUserPwaDecision) =>
  enabled &&
  !adminSurface &&
  userRoute &&
  compact &&
  (standalone || developmentPreview);

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
  const previewRequested = import.meta.env.DEV && params.get("pwaPreview") === "1";
  const [previewSession, setPreviewSession] = useState(() =>
    import.meta.env.DEV && typeof window !== "undefined"
      ? window.sessionStorage.getItem("ytrace-pwa-preview") === "1"
      : false,
  );
  useEffect(() => {
    if (!previewRequested) return;
    window.sessionStorage.setItem("ytrace-pwa-preview", "1");
    setPreviewSession(true);
  }, [previewRequested]);
  const developmentPreview = previewRequested || previewSession;
  const enabled = import.meta.env.VITE_ENABLE_STANDALONE_USER_PWA_UI === "true";
  const isUserRoute = USER_PWA_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  return shouldUseInstalledUserPwa({
    enabled,
    adminSurface: IS_ADMIN_SURFACE,
    userRoute: isUserRoute,
    compact,
    standalone,
    developmentPreview,
  });
}
