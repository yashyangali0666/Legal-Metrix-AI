import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  FileText,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ScanLine,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { ApiService } from '../services/api';
import { DashboardAnalytics } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = () => {
    setLoading(true);
    ApiService.getDashboardAnalytics()
      .then((res) => setData(res))
      .catch((err) => console.error('Failed to load dashboard', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 text-deepBlue animate-spin" />
        <p className="text-sm text-slate-500">Loading statutory inspection records...</p>
      </div>
    );
  }

  const summary = data?.summary || {
    total_products_scanned: 0,
    compliant_products: 0,
    products_requiring_review: 0,
    potential_violations_detected: 0,
    pending_inspections: 0,
    total_inspection_reports: 0
  };

  const kpiCards = [
    {
      title: 'Total Products Scanned',
      value: summary.total_products_scanned,
      icon: Boxes,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-100 dark:border-blue-900/40'
    },
    {
      title: 'Compliant Products',
      value: summary.compliant_products,
      icon: CheckCircle2,
      color: 'text-successGreen',
      bgColor: 'bg-green-50 dark:bg-green-950/40',
      border: 'border-green-100 dark:border-green-900/40'
    },
    {
      title: 'Requiring Officer Review',
      value: summary.products_requiring_review,
      icon: AlertTriangle,
      color: 'text-warningAmber',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-100 dark:border-amber-900/40'
    },
    {
      title: 'Violations Detected',
      value: summary.potential_violations_detected,
      icon: XCircle,
      color: 'text-errorRed',
      bgColor: 'bg-red-50 dark:bg-red-950/40',
      border: 'border-red-100 dark:border-red-900/40'
    },
    {
      title: 'Pending Inspections',
      value: summary.pending_inspections,
      icon: Clock,
      color: 'text-slate-600 dark:text-slate-300',
      bgColor: 'bg-slate-100 dark:bg-slate-800/40',
      border: 'border-slate-200 dark:border-slate-700/40'
    },
    {
      title: 'Total Inspection Reports',
      value: summary.total_inspection_reports,
      icon: FileText,
      color: 'text-cyanAccent',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/40',
      border: 'border-cyan-100 dark:border-cyan-900/40'
    },
  ];

  const complianceColors: { [key: string]: string } = {
    COMPLIANT: '#16A34A',
    NON_COMPLIANT: '#DC2626',
    NEEDS_REVIEW: '#F59E0B',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-govNavy-900 via-deepBlue to-cyanAccent-dark text-white shadow-card">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-cyan-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Legal Metrology Act, 2009 & Packaged Commodities Rules 2011
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            AI Automated Label Compliance Monitoring
          </h2>
          <p className="text-xs md:text-sm text-blue-100 max-w-2xl leading-relaxed">
            Real-time inspection analytics, statutory declaration verification, and violation detection for pre-packaged commodities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/scan')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-deepBlue font-bold text-sm shadow-md hover:bg-blue-50 transition-all hover:scale-105 active:scale-95"
          >
            <ScanLine className="w-4 h-4 text-deepBlue" />
            <span>Scan Product Now</span>
          </button>
          <button
            onClick={fetchDashboard}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
            title="Refresh analytics data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl bg-white dark:bg-cardBgDark border ${kpi.border} shadow-soft hover:shadow-card transition-all`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider line-clamp-1">
                  {kpi.title}
                </span>
                <div className={`p-1.5 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-govNavy-900 dark:text-white">
                {kpi.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Distribution Donut */}
        <div className="p-5 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-govNavy-900 dark:text-white">
              Compliance Status Distribution
            </h3>
            <span className="text-xs text-slate-400">Statutory Triage</span>
          </div>
          <div className="h-60 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.compliance_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(data?.compliance_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Category Distribution Bar Chart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-govNavy-900 dark:text-white">
              Inspections by Product Category
            </h3>
            <span className="text-xs text-slate-400">Industry Breakdown</span>
          </div>
          <div className="h-60 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.category_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend Area Chart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-govNavy-900 dark:text-white">
              Monthly Inspection Volume
            </h3>
            <span className="text-xs text-slate-400">Trend & Violations</span>
          </div>
          <div className="h-60 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthly_trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#3B82F6" fillOpacity={1} fill="url(#totalColor)" />
                <Area type="monotone" dataKey="violations" stroke="#DC2626" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-base text-govNavy-900 dark:text-white">
              Recent Packaging Label Inspections
            </h3>
            <p className="text-xs text-slate-500">Live records from legal metrology database</p>
          </div>
          <button
            onClick={() => navigate('/repository')}
            className="flex items-center gap-1.5 text-xs font-semibold text-deepBlue dark:text-cyanAccent hover:underline"
          >
            <span>View All in Repository</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {(!data?.recent_inspections || data.recent_inspections.length === 0) ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No inspection records currently in database. Click "Scan Product Now" to run your first inspection!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3">Inspection ID</th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Brand</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {data.recent_inspections.map((item) => {
                  const statusBadge =
                    item.compliance_status === 'COMPLIANT'
                      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800'
                      : item.compliance_status === 'NON_COMPLIANT'
                      ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono text-xs font-semibold text-deepBlue dark:text-cyanAccent">
                        {item.id}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                        {item.product_name}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {item.brand}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-xs">
                        {item.category}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-xs">
                        {item.inspection_date}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge}`}>
                          {item.compliance_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => navigate(`/compliance?id=${item.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 hover:bg-deepBlue hover:text-white dark:bg-slate-800 dark:hover:bg-deepBlue text-xs font-medium transition-colors"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

