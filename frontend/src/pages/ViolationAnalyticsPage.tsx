import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingDown,
  AlertOctagon,
  FileSpreadsheet,
  RefreshCw,
  PieChart as PieIcon,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { ApiService } from '../services/api';
import { DashboardAnalytics } from '../types';

export const ViolationAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getDashboardAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load violation analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const COLORS = ['#DC2626', '#F59E0B', '#3B82F6', '#06B6D4', '#8B5CF6'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-govNavy-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-deepBlue dark:text-cyanAccent" />
            Statutory Violation & Trend Analytics
          </h2>
          <p className="text-xs text-slate-500">
            Enforcement pattern intelligence under Legal Metrology (Packaged Commodities) Rules, 2011.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={ApiService.exportCSVUrl}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Analytics CSV</span>
          </a>

          <button
            onClick={fetchAnalytics}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <RefreshCw className="w-7 h-7 text-deepBlue animate-spin" />
          <p className="text-xs text-slate-500">Aggregating violation statistics...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Frequently Detected Violations */}
            <div className="p-6 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-govNavy-900 dark:text-white">
                    Most Frequently Detected Deficiencies / Violations
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mandatory declarations omitted or incorrectly formatted
                  </p>
                </div>
                <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 text-errorRed">
                  <AlertOctagon className="w-4 h-4" />
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data?.frequent_violations || []}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="declaration" type="category" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#DC2626" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* State-wise Inspection Enforcement Distribution */}
            <div className="p-6 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-govNavy-900 dark:text-white">
                    State & Jurisdiction Enforcement Activity
                  </h3>
                  <p className="text-xs text-slate-400">
                    Geographic distribution of packaged commodity scans
                  </p>
                </div>
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-deepBlue">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data?.state_statistics || []}
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="state" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="inspections" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Row: Category Risk & Inspection Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="p-6 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-govNavy-900 dark:text-white">
                  Compliance Percentage by Category
                </h3>
                <span className="text-xs text-slate-400">Category Risk Triage</span>
              </div>

              <div className="space-y-3">
                {(data?.category_distribution || []).map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">{cat.category}</span>
                      <span className="text-deepBlue dark:text-cyanAccent">{cat.count} scanned</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-deepBlue to-cyanAccent"
                        style={{ width: `${Math.min(100, cat.count * 25)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Trend Line */}
            <div className="p-6 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-govNavy-900 dark:text-white">
                  Monthly Violations vs Compliant Trend
                </h3>
                <span className="text-xs text-slate-400">Compliance Trajectory</span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.monthly_trends || []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="compliant" stroke="#16A34A" strokeWidth={2} name="Compliant" />
                    <Line type="monotone" dataKey="violations" stroke="#DC2626" strokeWidth={2} name="Violations" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

