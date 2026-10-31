import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Download,
  RefreshCw,
  ExternalLink,
  Layers,
  Eye
} from 'lucide-react';
import { ApiService } from '../services/api';

export const ProductRepositoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getInspectionHistory({
        search: search || undefined,
        status: statusFilter,
        category: categoryFilter,
        limit: 50
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load product repository', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-govNavy-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-deepBlue dark:text-cyanAccent" />
            Product Inspection Repository
          </h2>
          <p className="text-xs text-slate-500">
            Searchable statutory database of inspected packaged commodities, declarations, and certified reports.
          </p>
        </div>

        <button
          onClick={() => navigate('/scan')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-deepBlue hover:bg-deepBlue-hover text-white text-xs font-bold shadow-sm transition-all"
        >
          <span>Scan New Packaging</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft">
        <div className="md:col-span-6 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, brand, or inspection ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs text-govNavy-900 dark:text-white outline-none"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">All Compliance Statuses</option>
            <option value="COMPLIANT">Compliant Only</option>
            <option value="NON_COMPLIANT">Violations Only</option>
            <option value="NEEDS_REVIEW">Needs Review Only</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Food & Beverages">Food & Beverages</option>
            <option value="Edible Oils">Edible Oils</option>
            <option value="Confectionery">Confectionery</option>
            <option value="Cosmetics">Cosmetics</option>
          </select>
        </div>
      </form>

      {/* Repository Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <RefreshCw className="w-7 h-7 text-deepBlue animate-spin" />
          <p className="text-xs text-slate-500">Searching commodity records...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
          No packaged commodity records match your criteria.
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Inspection ID</th>
                  <th className="py-3.5 px-4">Product & Brand</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Net Qty / MRP</th>
                  <th className="py-3.5 px-4">Compliance Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => {
                  const isCompliant = item.overall_compliance === 'COMPLIANT';
                  const isViolation = item.overall_compliance === 'NON_COMPLIANT';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-deepBlue dark:text-cyanAccent">
                        {item.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-govNavy-900 dark:text-white">
                          {item.product_name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Brand: {item.brand}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {item.category}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {item.declared_net_quantity || 'N/A'} {item.declared_mrp ? `• ₹${item.declared_mrp}` : ''}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isCompliant
                              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300'
                              : isViolation
                              ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {item.overall_compliance.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {item.created_at}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/compliance?id=${item.id}`)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-deepBlue hover:text-white dark:bg-slate-800 text-xs font-medium transition-colors"
                            title="Inspect Compliance"
                          >
                            Review
                          </button>
                          {item.has_report && (
                            <a
                              href={`/api/reports/${item.id}/download`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

