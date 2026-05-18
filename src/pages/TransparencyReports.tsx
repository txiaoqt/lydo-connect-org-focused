import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Filter, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DisclosureDocument } from "@/lib/transparencyPortalData";
import { fetchDisclosureRegistry, fetchTransparencyKpis } from "@/lib/data-api";

const quarters = ["All", "Q1", "Q2", "Q3", "Q4"];

const downloadFile = (fileName: string, data: string, mimeType: string) => {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

export default function TransparencyReports() {
  const [documents, setDocuments] = useState<DisclosureDocument[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [kpis, setKpis] = useState({
    disclosuresPublished: 0,
    reportsReceived: 0,
    reportsResolved: 0,
    avgResponseHours: 0,
    pendingTickets: 0,
  });
  const [search, setSearch] = useState("");
  const [docType, setDocType] = useState("All");
  const [fiscalYear, setFiscalYear] = useState("All");
  const [quarter, setQuarter] = useState("All");
  const [barangay, setBarangay] = useState("All");
  const [office, setOffice] = useState("All");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoadingData(true);
      const [registry, portalKpis] = await Promise.all([fetchDisclosureRegistry(), fetchTransparencyKpis()]);
      if (!mounted) return;
      setDocuments(registry);
      setKpis(portalKpis);
      setIsLoadingData(false);
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const docTypes = ["All", ...Array.from(new Set(documents.map((d) => d.documentType)))];
  const years = ["All", ...Array.from(new Set(documents.map((d) => String(d.fiscalYear))))];
  const barangays = ["All", ...Array.from(new Set(documents.map((d) => d.barangay)))];
  const offices = ["All", ...Array.from(new Set(documents.map((d) => d.office)))];

  const filtered = useMemo(
    () =>
      documents.filter((doc) => {
        const matchSearch = doc.title.toLowerCase().includes(search.toLowerCase());
        const matchType = docType === "All" || doc.documentType === docType;
        const matchYear = fiscalYear === "All" || String(doc.fiscalYear) === fiscalYear;
        const matchQuarter = quarter === "All" || doc.quarter === quarter;
        const matchBarangay = barangay === "All" || doc.barangay === barangay;
        const matchOffice = office === "All" || doc.office === office;
        return matchSearch && matchType && matchYear && matchQuarter && matchBarangay && matchOffice;
      }),
    [documents, search, docType, fiscalYear, quarter, barangay, office],
  );

  const exportCsv = () => {
    const header = ["Title", "Document Type", "Fiscal Year", "Quarter", "Barangay", "Office", "Published Date", "Size", "PDF URL"];
    const rows = filtered.map((doc) => [doc.title, doc.documentType, doc.fiscalYear, doc.quarter, doc.barangay, doc.office, doc.publishedDate, doc.size, doc.pdfUrl]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    downloadFile("disclosure-registry.csv", csv, "text/csv;charset=utf-8;");
  };

  const exportJson = () => {
    downloadFile("disclosure-registry.json", JSON.stringify(filtered, null, 2), "application/json;charset=utf-8;");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <section className="hero-gradient py-10 sm:py-12">
          <div className="container">
            <h1 className="text-[1.85rem] sm:text-3xl md:text-4xl font-bold text-secondary-foreground">Disclosure Registry</h1>
            <p className="text-secondary-foreground/70 mt-2 max-w-xl md:max-w-2xl text-sm leading-relaxed">
              Structured full-disclosure records by type, fiscal year, quarter, office, and barangay.
            </p>
          </div>
        </section>

        <section className="container py-6 sm:py-8 space-y-4 sm:space-y-6">
          <div className="bg-card border rounded-xl p-3.5 sm:p-6 card-shadow">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Transparency Board Snapshot</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-4">
              <div className="rounded-md border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Disclosures Published</p><p className="text-xl font-semibold">{kpis.disclosuresPublished}</p></div>
              <div className="rounded-md border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Reports Received</p><p className="text-xl font-semibold">{kpis.reportsReceived}</p></div>
              <div className="rounded-md border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Reports Resolved</p><p className="text-xl font-semibold">{kpis.reportsResolved}</p></div>
              <div className="rounded-md border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Avg Response (hrs)</p><p className="text-xl font-semibold">{kpis.avgResponseHours}</p></div>
              <div className="rounded-md border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Pending Tickets</p><p className="text-xl font-semibold">{kpis.pendingTickets}</p></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-3">
            <div className="relative md:col-span-3 lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input placeholder="Search disclosure title..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 sm:h-11 text-sm" />
            </div>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>{docTypes.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={fiscalYear} onValueChange={setFiscalYear}>
              <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>{years.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={quarter} onValueChange={setQuarter}>
              <SelectTrigger><SelectValue placeholder="Quarter" /></SelectTrigger>
              <SelectContent>{quarters.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={barangay} onValueChange={setBarangay}>
              <SelectTrigger><SelectValue placeholder="Barangay" /></SelectTrigger>
              <SelectContent>{barangays.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={office} onValueChange={setOffice}>
              <SelectTrigger><SelectValue placeholder="Office" /></SelectTrigger>
              <SelectContent>{offices.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
            <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
            <Button variant="outline" onClick={exportJson}><Download className="h-4 w-4 mr-1" />Export JSON</Button>
          </div>

          <div className="bg-card rounded-lg border overflow-hidden card-shadow">
            {isLoadingData ? (
              <div className="p-6 text-sm text-muted-foreground">Loading disclosure registry...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-left">
                      <th className="px-3 sm:px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">FY</th>
                      <th className="px-4 py-3 font-medium">Qtr</th>
                      <th className="px-4 py-3 font-medium">Barangay</th>
                      <th className="px-4 py-3 font-medium">Office</th>
                      <th className="px-4 py-3 font-medium">Published</th>
                      <th className="px-4 py-3 font-medium">PDF Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((doc) => (
                      <tr key={doc.id} className="border-t">
                        <td className="px-3 sm:px-4 py-3 min-w-72">
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 mt-0.5 text-primary" />
                            {doc.pdfUrl ? (
                              <a href={doc.pdfUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                {doc.title}
                              </a>
                            ) : (
                              <span>{doc.title}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">{doc.documentType}</td>
                        <td className="px-4 py-3">{doc.fiscalYear}</td>
                        <td className="px-4 py-3">{doc.quarter}</td>
                        <td className="px-4 py-3">{doc.barangay}</td>
                        <td className="px-4 py-3">{doc.office}</td>
                        <td className="px-4 py-3">{doc.publishedDate}</td>
                        <td className="px-4 py-3">{doc.size}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!isLoadingData && filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No disclosure documents found for selected filters.</p>
            </div>
          )}
        </section>
      </div>
      <Footer />
    </div>
  );
}
