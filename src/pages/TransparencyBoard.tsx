import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, CircleX, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { barangays } from "@/lib/mockData";

type DocState = "ok" | "issue" | "partial";

type BoardRow = {
  barangay: string;
  cbydp: DocState;
  abyip: DocState;
  annualBudget: DocState;
  rcb: DocState;
  mil: DocState;
  remarks: string;
};

type SubmissionState = "submitted" | "missing" | "late";
type MonthlyDocKey = "mfr" | "mil" | "rcb" | "accomplishment" | "census";
type MonthlyOverallStatus = "Open" | "Due Soon" | "Late" | "Completed";

type MonthlyComplianceItem = {
  month: string;
  monthIndex: number;
  barangay: string;
  dueDate: string;
  submissions: Record<MonthlyDocKey, SubmissionState>;
  reportPdf: string;
};

const rowData: BoardRow[] = [
  { barangay: "Ampid I", cbydp: "ok", abyip: "ok", annualBudget: "ok", rcb: "ok", mil: "ok", remarks: "Fully Compliant (1/20/2026)" },
  { barangay: "Ampid II", cbydp: "ok", abyip: "ok", annualBudget: "ok", rcb: "issue", mil: "partial", remarks: "Partially Compliant" },
  { barangay: "Banaba", cbydp: "ok", abyip: "ok", annualBudget: "ok", rcb: "ok", mil: "ok", remarks: "Fully Compliant" },
  { barangay: "Dulong Bayan I", cbydp: "ok", abyip: "ok", annualBudget: "ok", rcb: "ok", mil: "ok", remarks: "Fully Compliant" },
  { barangay: "Dulong Bayan II", cbydp: "ok", abyip: "ok", annualBudget: "ok", rcb: "ok", mil: "ok", remarks: "Fully Compliant" },
  { barangay: "Guinayang", cbydp: "ok", abyip: "ok", annualBudget: "ok", rcb: "ok", mil: "partial", remarks: "Partially Compliant" },
  { barangay: "Gulod Malaya", cbydp: "ok", abyip: "ok", annualBudget: "ok", rcb: "ok", mil: "ok", remarks: "Fully Compliant" },
  { barangay: "Guitnang Bayan I", cbydp: "ok", abyip: "ok", annualBudget: "ok", rcb: "ok", mil: "ok", remarks: "Fully Compliant (1/20/2026)" },
  { barangay: "Guitnang Bayan II", cbydp: "partial", abyip: "ok", annualBudget: "ok", rcb: "issue", mil: "issue", remarks: "Partially Compliant" },
  { barangay: "Malanday", cbydp: "ok", abyip: "ok", annualBudget: "ok", rcb: "issue", mil: "issue", remarks: "Partially Compliant" },
  { barangay: "Maly", cbydp: "ok", abyip: "ok", annualBudget: "ok", rcb: "ok", mil: "ok", remarks: "Fully Compliant" },
  { barangay: "Pintong Bocaue", cbydp: "ok", abyip: "ok", annualBudget: "ok", rcb: "ok", mil: "ok", remarks: "Fully Compliant (1/19/2026)" },
  { barangay: "San Jose", cbydp: "ok", abyip: "ok", annualBudget: "ok", rcb: "ok", mil: "ok", remarks: "Fully Compliant" },
  { barangay: "San Rafael", cbydp: "ok", abyip: "ok", annualBudget: "ok", rcb: "ok", mil: "ok", remarks: "Fully Compliant" },
  { barangay: "Santa Ana", cbydp: "ok", abyip: "ok", annualBudget: "ok", rcb: "ok", mil: "ok", remarks: "Fully Compliant" },
  { barangay: "Santo Nino", cbydp: "ok", abyip: "ok", annualBudget: "ok", rcb: "ok", mil: "partial", remarks: "Partially Compliant" },
];

const docKeys: MonthlyDocKey[] = ["mfr", "mil", "rcb", "accomplishment", "census"];

const sortRows = () => {
  const lookup = new Map(rowData.map((row) => [row.barangay, row]));
  return barangays.map((name) => lookup.get(name)).filter((row): row is BoardRow => Boolean(row));
};

const monthLabel = (year: number, monthIndex: number) =>
  new Date(year, monthIndex, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

const dueDateIso = (year: number, monthIndex: number) => {
  const due = new Date(year, monthIndex + 1, 5);
  return due.toISOString().slice(0, 10);
};

const generateSubmissions = (bIndex: number, mIndex: number): Record<MonthlyDocKey, SubmissionState> => {
  const map = {} as Record<MonthlyDocKey, SubmissionState>;
  docKeys.forEach((key, keyIndex) => {
    const seed = bIndex * 13 + mIndex * 7 + keyIndex * 5;
    if (seed % 11 === 0) map[key] = "missing";
    else if (seed % 7 === 0) map[key] = "late";
    else map[key] = "submitted";
  });
  return map;
};

const buildMonthlyItems = (): MonthlyComplianceItem[] => {
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth();
  const items: MonthlyComplianceItem[] = [];

  for (let m = 0; m <= currentMonth; m += 1) {
    const label = monthLabel(year, m);
    const dueDate = dueDateIso(year, m);
    barangays.forEach((barangay, bIndex) => {
      items.push({
        month: label,
        monthIndex: m,
        barangay,
        dueDate,
        submissions: generateSubmissions(bIndex + 1, m + 1),
        reportPdf: "/disclosure-registry-test.pdf",
      });
    });
  }

  return items;
};

const monthlyComplianceItems = buildMonthlyItems();

const statusIcon = (state: DocState) => {
  if (state === "ok") return <CheckCircle2 className="h-5 w-5 text-accent mx-auto" />;
  if (state === "issue") return <CircleX className="h-5 w-5 text-destructive mx-auto" />;
  return <AlertCircle className="h-5 w-5 text-warning mx-auto" />;
};

const statusBadge = (remarks: string) => {
  const partial = remarks.toLowerCase().includes("partially");
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        partial
          ? "bg-warning/15 text-warning border border-warning/40"
          : "bg-accent/20 text-accent border border-accent/40"
      }`}
    >
      {remarks}
    </span>
  );
};

const docIcon = (state: SubmissionState) => {
  if (state === "submitted") return <CheckCircle2 className="h-4 w-4 text-accent mx-auto" />;
  if (state === "late") return <AlertCircle className="h-4 w-4 text-warning mx-auto" />;
  return <CircleX className="h-4 w-4 text-destructive mx-auto" />;
};

const computeMonthlyStatus = (item: MonthlyComplianceItem): MonthlyOverallStatus => {
  const values = Object.values(item.submissions);
  const total = values.length;
  const complete = values.filter((v) => v !== "missing").length;
  const hasLate = values.includes("late");
  const due = new Date(`${item.dueDate}T23:59:59`);
  const now = new Date();
  const msLeft = due.getTime() - now.getTime();
  const daysLeft = msLeft / (1000 * 60 * 60 * 24);
  const allDone = complete === total;

  if (hasLate || (!allDone && now > due)) return "Late";
  if (allDone) return "Completed";
  if (daysLeft <= 3) return "Due Soon";
  return "Open";
};

const monthlyStatusBadge = (status: MonthlyOverallStatus) => {
  if (status === "Completed") return <Badge className="bg-accent text-accent-foreground">Completed</Badge>;
  if (status === "Late") return <Badge variant="outline" className="border-destructive text-destructive">Late</Badge>;
  if (status === "Due Soon") return <Badge variant="outline" className="border-warning text-warning">Due Soon</Badge>;
  return <Badge variant="outline" className="border-primary text-primary">Open</Badge>;
};

const completionScore = (submissions: Record<MonthlyDocKey, SubmissionState>) => {
  const values = Object.values(submissions);
  return Math.round((values.filter((state) => state !== "missing").length / values.length) * 100);
};

type MonthlyComputedRow = MonthlyComplianceItem & { overallStatus: MonthlyOverallStatus; completion: number };

const MonthlyTable = ({ rows, showMonth = true }: { rows: MonthlyComputedRow[]; showMonth?: boolean }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[920px] text-xs sm:text-sm">
      <thead>
        <tr className="bg-muted/60 border-b">
          {showMonth ? <th className="px-4 py-3 text-left font-semibold">Month</th> : null}
          <th className="px-3 sm:px-4 py-3 text-left font-semibold">Barangay</th>
          <th className="px-3 sm:px-4 py-3 text-left font-semibold">Due Date</th>
          <th className="px-4 py-3 text-center font-semibold">MFR</th>
          <th className="px-4 py-3 text-center font-semibold">MIL</th>
          <th className="px-4 py-3 text-center font-semibold">RCB</th>
          <th className="px-4 py-3 text-center font-semibold">Accomplishment</th>
          <th className="px-4 py-3 text-center font-semibold">Youth Census</th>
          <th className="px-4 py-3 text-center font-semibold">Completion</th>
          <th className="px-4 py-3 text-center font-semibold">Overall Status</th>
          <th className="px-4 py-3 text-center font-semibold">Report</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.month}-${row.barangay}`} className="border-b last:border-b-0">
            {showMonth ? <td className="px-3 sm:px-4 py-3">{row.month}</td> : null}
            <td className="px-3 sm:px-4 py-3 font-medium">{row.barangay}</td>
            <td className="px-3 sm:px-4 py-3">{row.dueDate}</td>
            <td className="px-4 py-3 text-center">{docIcon(row.submissions.mfr)}</td>
            <td className="px-4 py-3 text-center">{docIcon(row.submissions.mil)}</td>
            <td className="px-4 py-3 text-center">{docIcon(row.submissions.rcb)}</td>
            <td className="px-4 py-3 text-center">{docIcon(row.submissions.accomplishment)}</td>
            <td className="px-4 py-3 text-center">{docIcon(row.submissions.census)}</td>
            <td className="px-4 py-3 text-center font-semibold">{row.completion}%</td>
            <td className="px-4 py-3 text-center">{monthlyStatusBadge(row.overallStatus)}</td>
            <td className="px-4 py-3 text-center">
              <a href={row.reportPdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                <FileText className="h-4 w-4" />
                PDF
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function TransparencyBoard() {
  const [view, setView] = useState<"board" | "monthly">("board");
  const [monthFilter, setMonthFilter] = useState("All");
  const [barangayFilter, setBarangayFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | MonthlyOverallStatus>("All");

  const rows = sortRows();
  const fullyCompliant = rows.filter((row) => !row.remarks.toLowerCase().includes("partially")).length;
  const partiallyCompliant = rows.length - fullyCompliant;

  const monthlyRows = useMemo(() => {
    const withComputed = monthlyComplianceItems.map((item) => ({
      ...item,
      overallStatus: computeMonthlyStatus(item),
      completion: completionScore(item.submissions),
    }));

    return withComputed.filter((item) => {
      const monthMatch = monthFilter === "All" || item.month === monthFilter;
      const barangayMatch = barangayFilter === "All" || item.barangay === barangayFilter;
      const statusMatch = statusFilter === "All" || item.overallStatus === statusFilter;
      return monthMatch && barangayMatch && statusMatch;
    });
  }, [monthFilter, barangayFilter, statusFilter]);

  const monthOptions = monthlyComplianceItems
    .reduce((acc, item) => {
      if (!acc.some((entry) => entry.label === item.month)) {
        acc.push({ label: item.month, index: item.monthIndex });
      }
      return acc;
    }, [] as { label: string; index: number }[])
    .sort((a, b) => a.index - b.index);

  const monthlyTotals = {
    total: monthlyRows.length,
    completed: monthlyRows.filter((row) => row.overallStatus === "Completed").length,
    late: monthlyRows.filter((row) => row.overallStatus === "Late").length,
    avgCompletion:
      monthlyRows.length > 0
        ? Math.round(monthlyRows.reduce((sum, row) => sum + row.completion, 0) / monthlyRows.length)
        : 0,
  };

  const groupedByMonth = monthOptions.map((option) => {
    const rowsForMonth = monthlyRows.filter((row) => row.month === option.label);
    const averageCompletion =
      rowsForMonth.length > 0
        ? Math.round(rowsForMonth.reduce((sum, row) => sum + row.completion, 0) / rowsForMonth.length)
        : 0;
    return {
      month: option.label,
      rows: rowsForMonth,
      averageCompletion,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <section className="container py-8 md:py-10 space-y-6">
          <div className="text-center">
            <div className="inline-flex flex-wrap justify-center items-center gap-2 rounded-full bg-muted p-1 mb-4">
              {[{ label: "SM", active: false }, { label: "LYDO", active: false }, { label: "LYDC", active: false }, { label: "SK", active: true }].map((item) => (
                <span key={item.label} className={`rounded-full px-4 py-1.5 text-sm font-medium ${item.active ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
              ))}
            </div>
            <h1 className="text-2xl md:text-5xl font-heading font-extrabold text-foreground">SK Full Disclosure Board</h1>
            <p className="text-muted-foreground mt-2">October - December 2025</p>
          </div>

          <div className="flex justify-center">
            <div className="inline-flex flex-col sm:flex-row rounded-lg border bg-card p-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setView("board")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === "board" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Full Disclosure Board
              </button>
              <button
                type="button"
                onClick={() => setView("monthly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Monthly Compliance
              </button>
            </div>
          </div>

          {view === "board" ? (
            <>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-xl border bg-card p-5 card-shadow"><p className="text-sm text-muted-foreground">Total Barangays</p><p className="text-3xl font-bold mt-1">{rows.length}</p></div>
                <div className="rounded-xl border bg-card p-5 card-shadow"><p className="text-sm text-muted-foreground">Fully Compliant</p><p className="text-3xl font-bold mt-1 text-accent">{fullyCompliant}</p></div>
                <div className="rounded-xl border bg-card p-5 card-shadow"><p className="text-sm text-muted-foreground">Partially Compliant</p><p className="text-3xl font-bold mt-1 text-warning">{partiallyCompliant}</p></div>
              </div>

              <div className="rounded-xl border bg-card overflow-hidden card-shadow">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-muted/60 border-b">
                        <th className="px-4 py-3 text-left font-semibold">Barangay</th>
                        <th className="px-4 py-3 text-center font-semibold">CBYDP</th>
                        <th className="px-4 py-3 text-center font-semibold">ABYIP</th>
                        <th className="px-4 py-3 text-center font-semibold">Annual Budget</th>
                        <th className="px-4 py-3 text-center font-semibold">RCB</th>
                        <th className="px-4 py-3 text-center font-semibold">MIL / PR</th>
                        <th className="px-4 py-3 text-center font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.barangay} className="border-b last:border-b-0">
                          <td className="px-4 py-3 font-medium">{row.barangay}</td>
                          <td className="px-4 py-3 text-center">{statusIcon(row.cbydp)}</td>
                          <td className="px-4 py-3 text-center">{statusIcon(row.abyip)}</td>
                          <td className="px-4 py-3 text-center">{statusIcon(row.annualBudget)}</td>
                          <td className="px-4 py-3 text-center">{statusIcon(row.rcb)}</td>
                          <td className="px-4 py-3 text-center">{statusIcon(row.mil)}</td>
                          <td className="px-4 py-3 text-center">{statusBadge(row.remarks)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border bg-card p-4 card-shadow"><p className="text-sm text-muted-foreground">Rows</p><p className="text-2xl font-bold">{monthlyTotals.total}</p></div>
                <div className="rounded-xl border bg-card p-4 card-shadow"><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold text-accent">{monthlyTotals.completed}</p></div>
                <div className="rounded-xl border bg-card p-4 card-shadow"><p className="text-sm text-muted-foreground">Late</p><p className="text-2xl font-bold text-destructive">{monthlyTotals.late}</p></div>
                <div className="rounded-xl border bg-card p-4 card-shadow"><p className="text-sm text-muted-foreground">Avg Completion</p><p className="text-2xl font-bold">{monthlyTotals.avgCompletion}%</p></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Months</SelectItem>
                    {monthOptions.map((month) => <SelectItem key={month.label} value={month.label}>{month.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={barangayFilter} onValueChange={setBarangayFilter}>
                  <SelectTrigger><SelectValue placeholder="Barangay" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Barangays</SelectItem>
                    {barangays.map((barangay) => <SelectItem key={barangay} value={barangay}>{barangay}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "All" | MonthlyOverallStatus)}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Due Soon">Due Soon</SelectItem>
                    <SelectItem value="Late">Late</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {monthFilter === "All" ? (
                <Accordion type="multiple" className="space-y-3">
                  {groupedByMonth.map((group) => (
                    <AccordionItem key={group.month} value={group.month} className="rounded-xl border bg-card card-shadow px-3 sm:px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 pr-1 sm:pr-3">
                          <div className="flex items-center gap-3 text-left">
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-semibold">{group.month}</p>
                              <p className="text-xs text-muted-foreground">
                                {group.rows.length} barangays with records
                              </p>
                            </div>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            Avg Completion: <span className="font-semibold text-foreground">{group.averageCompletion}%</span>
                          </p>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {group.rows.length > 0 ? (
                          <div className="rounded-lg border overflow-hidden">
                            <MonthlyTable rows={group.rows} showMonth={false} />
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground p-2">No rows found for current filters.</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="rounded-xl border bg-card overflow-hidden card-shadow">
                  <div className="p-5 border-b">
                    <h2 className="font-semibold text-lg">Monthly Compliance Turnover</h2>
                    <p className="text-sm text-muted-foreground">Per-barangay checklist of monthly required SK submissions</p>
                  </div>
                  <MonthlyTable rows={monthlyRows} showMonth={false} />
                </div>
              )}
            </div>
          )}
        </section>
      </div>
      <Footer />
    </div>
  );
}
