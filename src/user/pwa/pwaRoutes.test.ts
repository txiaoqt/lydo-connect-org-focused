import { describe, expect, it } from "vitest";
import {
  getPwaEquivalentRoute,
  getPwaParentRoute,
  getPwaRelatedRecordRoute,
  isPwaRoute,
  PWA_ROUTES,
  pwaBudgetDetailRoute,
  pwaDocumentDetailRoute,
  pwaLiquidationManageRoute,
  pwaNewsDetailRoute,
} from "./pwaRoutes";

describe("PWA routes", () => {
  it("keeps core operations in the /app namespace", () => {
    expect(pwaDocumentDetailRoute("doc 1")).toBe("/app/documents/doc%201");
    expect(pwaBudgetDetailRoute("budget")).toBe("/app/budgets/budget");
    expect(pwaLiquidationManageRoute("report")).toBe("/app/liquidations/report/manage");
    expect(pwaNewsDetailRoute("news")).toBe("/app/news/news");
  });

  it("maps legacy installed-app routes to native PWA routes", () => {
    expect(getPwaEquivalentRoute("/dashboard")).toBe(PWA_ROUTES.home);
    expect(getPwaEquivalentRoute("/document-submission")).toBe(PWA_ROUTES.documents);
    expect(getPwaEquivalentRoute("/budget-request")).toBe(PWA_ROUTES.budgets);
    expect(getPwaEquivalentRoute("/liquidation-reporting")).toBe(PWA_ROUTES.liquidations);
    expect(getPwaEquivalentRoute("/news-releases/abc")).toBe("/app/news/abc");
  });

  it("provides PWA-only detail fallbacks", () => {
    expect(getPwaParentRoute("/app/documents/manage")).toBe(PWA_ROUTES.documents);
    expect(getPwaParentRoute("/app/budgets/123/edit")).toBe(PWA_ROUTES.budgets);
    expect(getPwaParentRoute("/app/liquidations/123")).toBe(PWA_ROUTES.liquidations);
  });

  it("does not classify ordinary website paths as PWA routes", () => {
    expect(isPwaRoute("/app/documents")).toBe(true);
    expect(isPwaRoute("/dashboard")).toBe(false);
    expect(isPwaRoute("/admin")).toBe(false);
  });

  it("routes notification records to native PWA details", () => {
    expect(getPwaRelatedRecordRoute("budget_request", "budget")).toBe("/app/budgets/budget");
    expect(getPwaRelatedRecordRoute("liquidation_report", "report")).toBe("/app/liquidations/report");
    expect(getPwaRelatedRecordRoute("document_submission", "submission")).toBe(PWA_ROUTES.documents);
  });
});
