import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  Search,
  ExternalLink,
  RefreshCw,
  Hash,
  Calendar,
  UserCheck
} from 'lucide-react';
import { ApiService } from '../services/api';

export const InspectionReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getInspectionHistory({ limit: 50 });
      setReports(res.items.filter((i: any) => i.has_report));
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      r.product_name.toLowerCase().includes(q) ||
      r.brand.toLowerCase().includes(q) ||
      (r.report_number && r.report_number.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-govNavy-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-deepBlue dark:text-cyanAccent" />
            Statutory Inspection Compliance Reports
          </h2>
          <p className="text-xs text-slate-500">
            Certified ReportLab PDF inspection reports with statutory references and SHA-256 integrity checksums.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={ApiService.exportCSVUrl}
            download="LegalMetrix_Inspections.csv"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV Summary</span>
          </a>

          <button
            onClick={fetchReports}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh reports"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search by Report Number, Inspection ID, Product Name, or Brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-xs text-govNavy-900 dark:text-white outline-none placeholder:text-slate-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-xs text-slate-400 hover:text-slate-600">
            Clear
          </button>
        )}
      </div>

      {/* Reports Table / Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <RefreshCw className="w-7 h-7 text-deepBlue animate-spin" />
          <p className="text-xs text-slate-500">Loading statutory PDF reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
          No generated inspection reports match your search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((r) => {
            const isCompliant = r.overall_compliance === 'COMPLIANT';
            const isViolation = r.overall_compliance === 'NON_COMPLIANT';

            return (
              <div
                key={r.id}
                className="p-5 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-card transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-deepBlue dark:text-cyanAccent block">
                        {r.report_number || `REP-${r.id.replace('INSP-', '')}`}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Inspection Ref: {r.id}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isCompliant
                          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300'
                          : isViolation
                          ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {r.overall_compliance.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-govNavy-900 dark:text-white line-clamp-1">
                      {r.product_name}
                    </h4>
                    <p className="text-xs text-slate-500">Brand: {r.brand} &bull; {r.category}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Inspection Date:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{r.created_at}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Statutory Rules Checked:</span>
                      <span>
                        <strong className="text-successGreen">{r.passed_rules} Passed</strong> / <strong className="text-errorRed">{r.violation_rules} Violations</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <a
                    href={`/api/reports/${r.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-deepBlue hover:bg-deepBlue-hover text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>

                  <button
                    onClick={() => window.open(`/api/reports/${r.id}/download`, '_blank')}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                    title="Print / View"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

