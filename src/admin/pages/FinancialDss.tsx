import { FormEvent, useEffect, useMemo, useState } from "react";
import { BarChart3, MapPin, Plus, Search } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DataTable } from "../components/DataTable";
import { Barangay, BarangayComplianceStatus, BarangayFinancialRow, BarangayYouthMetricRow } from "../types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type FinancialRow = BarangayFinancialRow & { barangay_name: string };
type MetricsRow = BarangayYouthMetricRow & { barangay_name: string };
type Option = { id: string; name: string };
type BudgetRow = {
  id: string;
  barangay_id: string;
  barangay_name: string;
  fiscal_year: number;
  total_budget: number;
  row_count: number;
};
type FinancialForm = {
  barangayId: string;
  fiscalYear: string;
  monthNo: string;
  totalBudget: string;
  allocatedAmount: string;
  utilizedAmount: string;
};
type BudgetForm = {
  barangayId: string;
  fiscalYear: string;
  totalBudget: string;
};
type MetricsForm = {
  barangayId: string; fiscalYear: string; activities: string; participants: string; organizations: string; complianceStatus: BarangayComplianceStatus;
};

const COMPLIANCE: BarangayComplianceStatus[] = ["compliant", "pending", "overdue"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PIE_COLORS = ["#0f766e", "#ca8a04", "#b91c1c"];

const financialDefaults: FinancialForm = {
  barangayId: "", fiscalYear: String(new Date().getFullYear()), monthNo: String(new Date().getMonth() + 1),
  totalBudget: "0", allocatedAmount: "0", utilizedAmount: "0",
};
const budgetDefaults: BudgetForm = {
  barangayId: "",
  fiscalYear: String(new Date().getFullYear()),
  totalBudget: "0",
};
const metricsDefaults: MetricsForm = {
  barangayId: "", fiscalYear: String(new Date().getFullYear()), activities: "0", participants: "0", organizations: "0", complianceStatus: "pending",
};

const asCurrency = (value: number) => `PHP ${Number(value || 0).toLocaleString()}`;
const budgetKey = (barangayId: string, fiscalYear: number | string) => `${barangayId}::${fiscalYear}`;

export const FinancialDss = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [financialRows, setFinancialRows] = useState<FinancialRow[]>([]);
  const [metricsRows, setMetricsRows] = useState<MetricsRow[]>([]);
  const [barangayRows, setBarangayRows] = useState<Barangay[]>([]);
  const [barangayOptions, setBarangayOptions] = useState<Option[]>([]);
  const [financialSearch, setFinancialSearch] = useState("");
  const [metricsSearch, setMetricsSearch] = useState("");

  const [isFinancialDialog, setIsFinancialDialog] = useState(false);
  const [editingFinancial, setEditingFinancial] = useState<FinancialRow | null>(null);
  const [financialForm, setFinancialForm] = useState<FinancialForm>(financialDefaults);
  const [isSavingFinancial, setIsSavingFinancial] = useState(false);
  const [deletingFinancial, setDeletingFinancial] = useState<FinancialRow | null>(null);
  const [isDeletingFinancial, setIsDeletingFinancial] = useState(false);
  const [isBudgetDialog, setIsBudgetDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetRow | null>(null);
  const [budgetForm, setBudgetForm] = useState<BudgetForm>(budgetDefaults);
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  const [isMetricsDialog, setIsMetricsDialog] = useState(false);
  const [editingMetrics, setEditingMetrics] = useState<MetricsRow | null>(null);
  const [metricsForm, setMetricsForm] = useState<MetricsForm>(metricsDefaults);
  const [isSavingMetrics, setIsSavingMetrics] = useState(false);
  const [deletingMetrics, setDeletingMetrics] = useState<MetricsRow | null>(null);
  const [isDeletingMetrics, setIsDeletingMetrics] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured || !supabase) {
      setFinancialRows([]); setMetricsRows([]); setBarangayRows([]); setBarangayOptions([]); setIsLoading(false); return;
    }
    const [financialResp, metricsResp, barangayResp] = await Promise.all([
      supabase.from("barangay_financials").select("*,barangays(name)").order("fiscal_year", { ascending: false }).order("month_no", { ascending: false }),
      supabase.from("barangay_youth_metrics").select("*,barangays(name)").order("fiscal_year", { ascending: false }),
      supabase.from("barangays").select("*").order("name", { ascending: true }),
    ]);
    const err = financialResp.error || metricsResp.error || barangayResp.error;
    if (err) { toast({ title: "Load Failed", description: err.message }); setIsLoading(false); return; }

    setFinancialRows(((financialResp.data ?? []) as Array<BarangayFinancialRow & { barangays?: { name?: string } | Array<{ name?: string }> }>).map((row) => {
      const b = Array.isArray(row.barangays) ? row.barangays[0] : row.barangays;
      return { ...row, barangay_name: b?.name ?? "Unknown Barangay" };
    }));
    setMetricsRows(((metricsResp.data ?? []) as Array<BarangayYouthMetricRow & { barangays?: { name?: string } | Array<{ name?: string }> }>).map((row) => {
      const b = Array.isArray(row.barangays) ? row.barangays[0] : row.barangays;
      return { ...row, barangay_name: b?.name ?? "Unknown Barangay" };
    }));
    const bs = (barangayResp.data ?? []) as Barangay[];
    setBarangayRows(bs);
    setBarangayOptions(bs.map((b) => ({ id: b.id, name: b.name })));
    setIsLoading(false);
  };

  useEffect(() => { void loadData(); }, []);

  const totalBudgetByKey = useMemo(() => {
    const map = new Map<string, number>();
    const countMap = new Map<string, number>();
    const sorted = [...financialRows].sort((a, b) => {
      if (a.fiscal_year !== b.fiscal_year) return b.fiscal_year - a.fiscal_year;
      return b.month_no - a.month_no;
    });
    for (const row of sorted) {
      const key = budgetKey(row.barangay_id, row.fiscal_year);
      if (!map.has(key)) {
        map.set(key, Number(row.sk_budget ?? 0));
      }
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }
    return { map, countMap };
  }, [financialRows]);

  const resolveBudgetFromDashboard = (barangayId: string, fiscalYear: string | number) => {
    const year = Number(fiscalYear);
    if (!barangayId || !Number.isInteger(year)) return 0;
    return totalBudgetByKey.map.get(budgetKey(barangayId, year)) ?? 0;
  };

  const budgetRows = useMemo<BudgetRow[]>(() => {
    const barangayNameById = new Map(barangayOptions.map((option) => [option.id, option.name]));
    return Array.from(totalBudgetByKey.map.entries())
      .map(([key, totalBudget]) => {
        const [barangayId, fiscalYearText] = key.split("::");
        const fiscalYear = Number(fiscalYearText);
        return {
          id: key,
          barangay_id: barangayId,
          barangay_name: barangayNameById.get(barangayId) ?? "Unknown Barangay",
          fiscal_year: fiscalYear,
          total_budget: totalBudget,
          row_count: totalBudgetByKey.countMap.get(key) ?? 0,
        };
      })
      .sort((a, b) => {
        if (a.barangay_name !== b.barangay_name) return a.barangay_name.localeCompare(b.barangay_name);
        return b.fiscal_year - a.fiscal_year;
      });
  }, [barangayOptions, totalBudgetByKey]);

  const openCreateFinancialDialog = () => {
    setEditingFinancial(null);
    setFinancialForm(financialDefaults);
    setIsFinancialDialog(true);
  };

  const openEditFinancialDialog = (row: FinancialRow) => {
    const totalBudget = resolveBudgetFromDashboard(row.barangay_id, row.fiscal_year) || Number(row.sk_budget ?? 0);
    setEditingFinancial(row);
    setFinancialForm({
      barangayId: row.barangay_id,
      fiscalYear: String(row.fiscal_year),
      monthNo: String(row.month_no),
      totalBudget: String(totalBudget),
      allocatedAmount: String(row.allocated_amount ?? 0),
      utilizedAmount: String(row.utilized_amount ?? 0),
    });
    setIsFinancialDialog(true);
  };

  const openCreateBudgetDialog = () => {
    setEditingBudget(null);
    setBudgetForm(budgetDefaults);
    setIsBudgetDialog(true);
  };

  const openEditBudgetDialog = (row: BudgetRow) => {
    setEditingBudget(row);
    setBudgetForm({
      barangayId: row.barangay_id,
      fiscalYear: String(row.fiscal_year),
      totalBudget: String(row.total_budget),
    });
    setIsBudgetDialog(true);
  };

  const saveFinancial = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !financialForm.barangayId) return;
    const fy = Number(financialForm.fiscalYear);
    const month = Number(financialForm.monthNo);
    const totalBudget = Number(financialForm.totalBudget);
    const allocated = Number(financialForm.allocatedAmount);
    const utilized = Number(financialForm.utilizedAmount);
    if (!Number.isInteger(fy) || fy < 2000 || fy > 2100) { toast({ title: "Invalid Fiscal Year", description: "Fiscal year must be 2000-2100." }); return; }
    if (!Number.isInteger(month) || month < 1 || month > 12) { toast({ title: "Invalid Month", description: "Month must be 1-12." }); return; }
    if ([totalBudget, allocated, utilized].some((n) => !Number.isFinite(n) || n < 0)) { toast({ title: "Invalid Amount", description: "All amounts must be non-negative numbers." }); return; }
    if (allocated > totalBudget) {
      toast({ title: "Invalid Allocation", description: "Allocated amount cannot exceed total budget." });
      return;
    }
    if (utilized > allocated) {
      toast({ title: "Invalid Utilization", description: "Utilized amount cannot exceed allocated amount." });
      return;
    }
    setIsSavingFinancial(true);
    const payload = {
      barangay_id: financialForm.barangayId,
      fiscal_year: fy,
      month_no: month,
      sk_budget: totalBudget,
      allocated_amount: allocated,
      utilized_amount: utilized,
    };
    const resp = editingFinancial
      ? await supabase.from("barangay_financials").update(payload).eq("id", editingFinancial.id)
      : await supabase.from("barangay_financials").insert(payload);
    setIsSavingFinancial(false);
    if (resp.error) { toast({ title: "Save Failed", description: resp.error.code === "23505" ? "Duplicate row for this barangay, fiscal year and month." : resp.error.message }); return; }
    setIsFinancialDialog(false); setEditingFinancial(null); setFinancialForm(financialDefaults); toast({ title: "Saved", description: "Financial row saved." }); void loadData();
  };

  const saveBudget = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !budgetForm.barangayId) return;

    const fy = Number(budgetForm.fiscalYear);
    const totalBudget = Number(budgetForm.totalBudget);

    if (!Number.isInteger(fy) || fy < 2000 || fy > 2100) {
      toast({ title: "Invalid Fiscal Year", description: "Fiscal year must be 2000-2100." });
      return;
    }
    if (!Number.isFinite(totalBudget) || totalBudget < 0) {
      toast({ title: "Invalid Amount", description: "Total budget must be a non-negative number." });
      return;
    }

    setIsSavingBudget(true);

    const existingResp = await supabase
      .from("barangay_financials")
      .select("id,allocated_amount")
      .eq("barangay_id", budgetForm.barangayId)
      .eq("fiscal_year", fy);

    if (existingResp.error) {
      setIsSavingBudget(false);
      toast({ title: "Save Failed", description: existingResp.error.message });
      return;
    }

    const existingRows = existingResp.data ?? [];
    if (existingRows.length === 0) {
      setIsSavingBudget(false);
      toast({
        title: "No Financial Rows Yet",
        description: "Create at least one financial row for this barangay and fiscal year before setting total budget.",
      });
      return;
    }

    const exceedsBudget = existingRows.some((row) => Number(row.allocated_amount ?? 0) > totalBudget);
    if (exceedsBudget) {
      setIsSavingBudget(false);
      toast({
        title: "Invalid Budget",
        description: "Total budget cannot be lower than an existing allocated amount for this barangay and fiscal year.",
      });
      return;
    }

    const updateResp = await supabase
      .from("barangay_financials")
      .update({ sk_budget: totalBudget })
      .eq("barangay_id", budgetForm.barangayId)
      .eq("fiscal_year", fy);

    setIsSavingBudget(false);
    if (updateResp.error) {
      toast({ title: "Save Failed", description: updateResp.error.message });
      return;
    }

    toast({ title: "Total Budget Updated", description: "Budget was applied to all matching financial rows." });
    setIsBudgetDialog(false);
    setEditingBudget(null);
    setBudgetForm(budgetDefaults);
    void loadData();
  };

  const saveMetrics = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !metricsForm.barangayId) return;
    const fy = Number(metricsForm.fiscalYear);
    const activities = Number(metricsForm.activities);
    const participants = Number(metricsForm.participants);
    const organizations = Number(metricsForm.organizations);
    if (!Number.isInteger(fy) || fy < 2000 || fy > 2100) { toast({ title: "Invalid Fiscal Year", description: "Fiscal year must be 2000-2100." }); return; }
    if ([activities, participants, organizations].some((n) => !Number.isFinite(n) || n < 0 || !Number.isInteger(n))) { toast({ title: "Invalid Metric", description: "Activities, participants and organizations must be whole non-negative numbers." }); return; }
    setIsSavingMetrics(true);
    const payload = { barangay_id: metricsForm.barangayId, fiscal_year: fy, activities, participants, organizations, compliance_status: metricsForm.complianceStatus };
    const resp = editingMetrics
      ? await supabase.from("barangay_youth_metrics").update(payload).eq("id", editingMetrics.id)
      : await supabase.from("barangay_youth_metrics").insert(payload);
    setIsSavingMetrics(false);
    if (resp.error) { toast({ title: "Save Failed", description: resp.error.code === "23505" ? "Duplicate row for this barangay and fiscal year." : resp.error.message }); return; }
    setIsMetricsDialog(false); setEditingMetrics(null); setMetricsForm(metricsDefaults); toast({ title: "Saved", description: "Youth metrics row saved." }); void loadData();
  };

  const deleteFinancial = async () => {
    if (!supabase || !deletingFinancial) return;
    setIsDeletingFinancial(true);
    const resp = await supabase.from("barangay_financials").delete().eq("id", deletingFinancial.id);
    setIsDeletingFinancial(false);
    if (resp.error) { toast({ title: "Delete Failed", description: resp.error.message }); return; }
    setDeletingFinancial(null); toast({ title: "Deleted", description: "Financial row deleted." }); void loadData();
  };

  const deleteMetrics = async () => {
    if (!supabase || !deletingMetrics) return;
    setIsDeletingMetrics(true);
    const resp = await supabase.from("barangay_youth_metrics").delete().eq("id", deletingMetrics.id);
    setIsDeletingMetrics(false);
    if (resp.error) { toast({ title: "Delete Failed", description: resp.error.message }); return; }
    setDeletingMetrics(null); toast({ title: "Deleted", description: "Metrics row deleted." }); void loadData();
  };

  const filteredFinancial = useMemo(() => financialRows.filter((r) => {
    const q = financialSearch.toLowerCase();
    return r.barangay_name.toLowerCase().includes(q) || String(r.fiscal_year).includes(q) || String(r.month_no).includes(q);
  }), [financialRows, financialSearch]);
  const filteredMetrics = useMemo(() => metricsRows.filter((r) => {
    const q = metricsSearch.toLowerCase();
    return r.barangay_name.toLowerCase().includes(q) || String(r.fiscal_year).includes(q) || r.compliance_status.toLowerCase().includes(q);
  }), [metricsRows, metricsSearch]);
  const formTotalBudget = Number(financialForm.totalBudget || 0);
  const formAllocated = Number(financialForm.allocatedAmount || 0);
  const formUtilized = Number(financialForm.utilizedAmount || 0);
  const remainingAfterAllocation = Number.isFinite(formTotalBudget) && Number.isFinite(formAllocated) ? formTotalBudget - formAllocated : 0;
  const notUtilized = Number.isFinite(formAllocated) && Number.isFinite(formUtilized) ? formAllocated - formUtilized : 0;

  const analytics = useMemo(() => {
    const latestFinancial = new Map<string, FinancialRow>();
    for (const row of financialRows) if (!latestFinancial.has(row.barangay_id)) latestFinancial.set(row.barangay_id, row);
    const latestMetric = new Map<string, MetricsRow>();
    for (const row of metricsRows) if (!latestMetric.has(row.barangay_id)) latestMetric.set(row.barangay_id, row);
    const latestFinancialRows = Array.from(latestFinancial.values());
    const totalBudget = latestFinancialRows.reduce((s, r) => s + Number(r.sk_budget ?? 0), 0);
    const utilized = latestFinancialRows.reduce((s, r) => s + Number(r.utilized_amount ?? 0), 0);
    const allocated = latestFinancialRows.reduce((s, r) => s + Number(r.allocated_amount ?? 0), 0);
    const rate = totalBudget > 0 ? Math.round((utilized / totalBudget) * 100) : 0;
    const year = financialRows.length ? Math.max(...financialRows.map((r) => r.fiscal_year)) : new Date().getFullYear();
    const trendMap = new Map<number, { allocated: number; utilized: number }>();
    financialRows.filter((r) => r.fiscal_year === year).forEach((r) => {
      const prev = trendMap.get(r.month_no) ?? { allocated: 0, utilized: 0 };
      trendMap.set(r.month_no, { allocated: prev.allocated + Number(r.allocated_amount ?? 0), utilized: prev.utilized + Number(r.utilized_amount ?? 0) });
    });
    const trend = Array.from(trendMap.entries()).sort((a, b) => a[0] - b[0]).map(([m, v]) => ({ month: MONTH_NAMES[m - 1] ?? `M${m}`, allocated: v.allocated, utilized: v.utilized }));
    const compliance = { compliant: 0, pending: 0, overdue: 0 };
    latestMetric.forEach((r) => { compliance[r.compliance_status] += 1; });
    const mapConfigured = barangayRows.filter((b) => b.latitude != null && b.longitude != null).length;
    return {
      totalBudget, utilized, allocated, rate, latestYear: year, trend, mapConfigured,
      complianceData: [
        { name: "Compliant", value: compliance.compliant },
        { name: "Pending", value: compliance.pending },
        { name: "Overdue", value: compliance.overdue },
      ],
    };
  }, [financialRows, metricsRows, barangayRows]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Financial DSS and Map Config</h1>
        <p className="text-muted-foreground mt-1 font-medium">Configure Financial Disclosure and Barangay Map datasets, with analytics for decision support.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Total Budget (Latest)</p><p className="text-2xl font-bold mt-2">{asCurrency(analytics.totalBudget)}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Utilized (Latest)</p><p className="text-2xl font-bold mt-2">{asCurrency(analytics.utilized)}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Utilization Rate</p><p className="text-2xl font-bold mt-2">{analytics.rate}%</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">Map Coordinates Set</p><p className="text-2xl font-bold mt-2">{analytics.mapConfigured}/{barangayRows.length}</p></div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold">Monthly Budget Trend (FY {analytics.latestYear})</h2>
          <p className="text-sm text-muted-foreground mb-3">Allocated vs utilized amount</p>
          <div className="h-64">
            {analytics.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => asCurrency(value)} />
                  <Legend />
                  <Bar dataKey="allocated" name="Allocated" fill="#1B4F72" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="utilized" name="Utilized" fill="#0f766e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full grid place-items-center text-sm text-muted-foreground">No trend data yet.</div>}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold">Compliance Distribution</h2>
          <p className="text-sm text-muted-foreground mb-3">Latest barangay youth metrics status</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.complianceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {analytics.complianceData.map((_, idx) => <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Total Budget Setup</h2>
          <Button type="button" onClick={openCreateBudgetDialog} className="gap-2">
            <Plus size={16} />
            Set Total Budget
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage total budget by barangay and fiscal year. Financial row forms will reflect this value as read-only.
        </p>
        <DataTable
          columns={[
            {
              header: "Barangay / Fiscal Year",
              accessor: (row: BudgetRow) => (
                <div>
                  <p className="font-semibold">{row.barangay_name}</p>
                  <p className="text-xs text-muted-foreground">FY {row.fiscal_year}</p>
                </div>
              ),
            },
            { header: "Total Budget", accessor: (row: BudgetRow) => asCurrency(row.total_budget) },
            { header: "Rows Covered", accessor: (row: BudgetRow) => row.row_count.toLocaleString() },
          ]}
          data={budgetRows}
          isLoading={isLoading}
          onEdit={openEditBudgetDialog}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Financial Rows</h2><Button type="button" onClick={openCreateFinancialDialog} className="gap-2"><Plus size={16} />Add Financial Row</Button></div>
        <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={financialSearch} onChange={(e) => setFinancialSearch(e.target.value)} placeholder="Search financial rows..." className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm" /></div>
        <DataTable
          columns={[
            { header: "Barangay / Period", accessor: (r: FinancialRow) => <div><p className="font-semibold">{r.barangay_name}</p><p className="text-xs text-muted-foreground">FY {r.fiscal_year} - {MONTH_NAMES[r.month_no - 1] ?? r.month_no}</p></div> },
            { header: "Total Budget", accessor: (r: FinancialRow) => asCurrency(Number(r.sk_budget ?? 0)) },
            { header: "Allocated", accessor: (r: FinancialRow) => asCurrency(Number(r.allocated_amount ?? 0)) },
            { header: "Remaining (Total-Allocated)", accessor: (r: FinancialRow) => asCurrency(Number(r.sk_budget ?? 0) - Number(r.allocated_amount ?? 0)) },
            { header: "Utilized", accessor: (r: FinancialRow) => asCurrency(Number(r.utilized_amount ?? 0)) },
            { header: "Not Utilized", accessor: (r: FinancialRow) => asCurrency(Number(r.allocated_amount ?? 0) - Number(r.utilized_amount ?? 0)) },
          ]}
          data={filteredFinancial}
          isLoading={isLoading}
          onEdit={openEditFinancialDialog}
          onDelete={setDeletingFinancial}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Youth Metrics Rows</h2><Button type="button" onClick={() => { setEditingMetrics(null); setMetricsForm(metricsDefaults); setIsMetricsDialog(true); }} className="gap-2"><Plus size={16} />Add Metrics Row</Button></div>
        <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={metricsSearch} onChange={(e) => setMetricsSearch(e.target.value)} placeholder="Search metrics rows..." className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm" /></div>
        <DataTable
          columns={[
            { header: "Barangay / Fiscal Year", accessor: (r: MetricsRow) => <div><p className="font-semibold">{r.barangay_name}</p><p className="text-xs text-muted-foreground">FY {r.fiscal_year}</p></div> },
            { header: "Activities", accessor: (r: MetricsRow) => Number(r.activities ?? 0).toLocaleString() },
            { header: "Participants", accessor: (r: MetricsRow) => Number(r.participants ?? 0).toLocaleString() },
            { header: "Organizations", accessor: (r: MetricsRow) => Number(r.organizations ?? 0).toLocaleString() },
            { header: "Compliance", accessor: (r: MetricsRow) => <span className="capitalize">{r.compliance_status}</span> },
          ]}
          data={filteredMetrics}
          isLoading={isLoading}
          onEdit={(row) => { setEditingMetrics(row); setMetricsForm({ barangayId: row.barangay_id, fiscalYear: String(row.fiscal_year), activities: String(row.activities ?? 0), participants: String(row.participants ?? 0), organizations: String(row.organizations ?? 0), complianceStatus: row.compliance_status }); setIsMetricsDialog(true); }}
          onDelete={setDeletingMetrics}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2"><MapPin size={18} /><h2 className="text-xl font-bold">Barangay Map Source Data</h2></div>
        <p className="text-sm text-muted-foreground">These rows power map markers and profile cards. Edit coordinates, SK chairperson, and youth population in the existing Barangay Map Data tab.</p>
        <DataTable
          columns={[
            { header: "Barangay", accessor: (r: Barangay) => r.name },
            { header: "Latitude", accessor: (r: Barangay) => (r.latitude ?? "-") as string | number },
            { header: "Longitude", accessor: (r: Barangay) => (r.longitude ?? "-") as string | number },
            { header: "Youth Population", accessor: (r: Barangay) => Number(r.youth_population ?? 0).toLocaleString() },
            { header: "SK Chairperson", accessor: (r: Barangay) => r.sk_chairperson || "-" },
          ]}
          data={barangayRows}
          isLoading={isLoading}
        />
      </section>

      <Dialog open={isBudgetDialog} onOpenChange={setIsBudgetDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingBudget ? "Edit Total Budget" : "Set Total Budget"}</DialogTitle>
            <DialogDescription>Applies to all financial rows of the selected barangay and fiscal year.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveBudget} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Barangay</Label>
                <select
                  value={budgetForm.barangayId}
                  onChange={(e) => setBudgetForm((p) => ({ ...p, barangayId: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">Select barangay</option>
                  {barangayOptions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Fiscal Year</Label>
                <Input
                  type="number"
                  min={2000}
                  max={2100}
                  value={budgetForm.fiscalYear}
                  onChange={(e) => setBudgetForm((p) => ({ ...p, fiscalYear: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Total Budget</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={budgetForm.totalBudget}
                  onChange={(e) => setBudgetForm((p) => ({ ...p, totalBudget: e.target.value }))}
                  required
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              If no financial rows exist yet for this barangay and fiscal year, create one row first so this budget can be applied.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsBudgetDialog(false)} disabled={isSavingBudget}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingBudget}>
                {isSavingBudget ? "Saving..." : editingBudget ? "Save Budget" : "Set Budget"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isFinancialDialog} onOpenChange={setIsFinancialDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editingFinancial ? "Edit Financial Row" : "Create Financial Row"}</DialogTitle><DialogDescription>Used by Financial Disclosure and Barangay Map pages.</DialogDescription></DialogHeader>
          <form onSubmit={saveFinancial} className="space-y-4">
            <div className="space-y-4">
              <div className="rounded-xl border border-border p-4 space-y-4">
                <p className="text-sm font-semibold text-foreground">Editable Inputs</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Barangay</Label>
                    <select
                      value={financialForm.barangayId}
                      onChange={(e) =>
                        setFinancialForm((p) => ({
                          ...p,
                          barangayId: e.target.value,
                          totalBudget: String(resolveBudgetFromDashboard(e.target.value, p.fiscalYear)),
                        }))
                      }
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      required
                    >
                      <option value="">Select barangay</option>
                      {barangayOptions.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fiscal Year</Label>
                    <Input
                      type="number"
                      min={2000}
                      max={2100}
                      value={financialForm.fiscalYear}
                      onChange={(e) =>
                        setFinancialForm((p) => ({
                          ...p,
                          fiscalYear: e.target.value,
                          totalBudget: String(resolveBudgetFromDashboard(p.barangayId, e.target.value)),
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Month</Label>
                    <Input type="number" min={1} max={12} value={financialForm.monthNo} onChange={(e) => setFinancialForm((p) => ({ ...p, monthNo: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Allocated Amount</Label>
                    <Input type="number" min={0} step="0.01" value={financialForm.allocatedAmount} onChange={(e) => setFinancialForm((p) => ({ ...p, allocatedAmount: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Utilized Amount</Label>
                    <Input type="number" min={0} step="0.01" value={financialForm.utilizedAmount} onChange={(e) => setFinancialForm((p) => ({ ...p, utilizedAmount: e.target.value }))} required />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 space-y-4">
                <p className="text-sm font-semibold text-foreground">Auto-Computed (Read-only)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Total Budget (From Dashboard Setup)</Label>
                    <Input type="number" value={Number.isFinite(formTotalBudget) ? formTotalBudget.toFixed(2) : "0.00"} readOnly className="bg-muted/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Remaining Budget (Total - Allocated)</Label>
                    <Input type="number" value={Number.isFinite(remainingAfterAllocation) ? remainingAfterAllocation.toFixed(2) : "0.00"} readOnly className="bg-muted/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Not Utilized (Allocated - Utilized)</Label>
                    <Input type="number" value={Number.isFinite(notUtilized) ? notUtilized.toFixed(2) : "0.00"} readOnly className="bg-muted/50" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Total budget is configured in the "Total Budget Setup" section above.
                </p>
              </div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsFinancialDialog(false)} disabled={isSavingFinancial}>Cancel</Button><Button type="submit" disabled={isSavingFinancial}>{isSavingFinancial ? "Saving..." : editingFinancial ? "Save Changes" : "Create Row"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isMetricsDialog} onOpenChange={setIsMetricsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editingMetrics ? "Edit Metrics Row" : "Create Metrics Row"}</DialogTitle><DialogDescription>Used by Financial Disclosure and Barangay Map pages.</DialogDescription></DialogHeader>
          <form onSubmit={saveMetrics} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2"><Label>Barangay</Label><select value={metricsForm.barangayId} onChange={(e) => setMetricsForm((p) => ({ ...p, barangayId: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" required><option value="">Select barangay</option>{barangayOptions.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              <div className="space-y-2"><Label>Fiscal Year</Label><Input type="number" min={2000} max={2100} value={metricsForm.fiscalYear} onChange={(e) => setMetricsForm((p) => ({ ...p, fiscalYear: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Activities</Label><Input type="number" min={0} value={metricsForm.activities} onChange={(e) => setMetricsForm((p) => ({ ...p, activities: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Participants</Label><Input type="number" min={0} value={metricsForm.participants} onChange={(e) => setMetricsForm((p) => ({ ...p, participants: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Organizations</Label><Input type="number" min={0} value={metricsForm.organizations} onChange={(e) => setMetricsForm((p) => ({ ...p, organizations: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Compliance Status</Label><select value={metricsForm.complianceStatus} onChange={(e) => setMetricsForm((p) => ({ ...p, complianceStatus: e.target.value as BarangayComplianceStatus }))} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">{COMPLIANCE.map((status) => <option key={status} value={status} className="capitalize">{status}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsMetricsDialog(false)} disabled={isSavingMetrics}>Cancel</Button><Button type="submit" disabled={isSavingMetrics}>{isSavingMetrics ? "Saving..." : editingMetrics ? "Save Changes" : "Create Row"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingFinancial)} onOpenChange={(open) => { if (!open) setDeletingFinancial(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Financial Row</AlertDialogTitle><AlertDialogDescription>{deletingFinancial ? `Delete ${deletingFinancial.barangay_name} FY ${deletingFinancial.fiscal_year} month ${deletingFinancial.month_no}?` : "This cannot be undone."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isDeletingFinancial}>Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteFinancial} disabled={isDeletingFinancial} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{isDeletingFinancial ? "Deleting..." : "Delete"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deletingMetrics)} onOpenChange={(open) => { if (!open) setDeletingMetrics(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Metrics Row</AlertDialogTitle><AlertDialogDescription>{deletingMetrics ? `Delete ${deletingMetrics.barangay_name} FY ${deletingMetrics.fiscal_year}?` : "This cannot be undone."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isDeletingMetrics}>Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteMetrics} disabled={isDeletingMetrics} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{isDeletingMetrics ? "Deleting..." : "Delete"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
