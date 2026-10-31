import React, { useEffect, useState } from 'react';
import {
  Scale,
  Plus,
  Edit,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  Calendar,
  Layers,
  ChevronRight,
  Save,
  X
} from 'lucide-react';
import { ApiService } from '../services/api';
import { ComplianceRule } from '../types';

export const RuleManagementPage: React.FC = () => {
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'history'>('rules');
  const [selectedRuleHistory, setSelectedRuleHistory] = useState<any[]>([]);
  const [historyRuleId, setHistoryRuleId] = useState<string>('');

  // Edit / Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ComplianceRule | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    rule_number: '',
    name: '',
    description: '',
    legal_reference: '',
    category_filter: 'ALL',
    required_declaration: '',
    validation_type: 'presence',
    severity: 'HIGH',
    is_active: true,
    effective_date: '2026-01-01',
    modification_reason: 'Statutory update to compliance provisions'
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getRules();
      setRules(data);
    } catch (err) {
      console.error('Failed to load rules', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormData({
      id: `LMR-RULE-${Date.now().toString().slice(-4)}`,
      rule_number: 'Rule 6(1)',
      name: '',
      description: '',
      legal_reference: 'The Legal Metrology (Packaged Commodities) Rules, 2011',
      category_filter: 'ALL',
      required_declaration: '',
      validation_type: 'presence',
      severity: 'HIGH',
      is_active: true,
      effective_date: '2026-01-01',
      modification_reason: 'Initial creation'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: ComplianceRule) => {
    setEditingRule(rule);
    setFormData({
      id: rule.id,
      rule_number: rule.rule_number,
      name: rule.name,
      description: rule.description,
      legal_reference: rule.legal_reference,
      category_filter: rule.category_filter,
      required_declaration: rule.required_declaration,
      validation_type: rule.validation_type,
      severity: rule.severity,
      is_active: rule.is_active,
      effective_date: rule.effective_date,
      modification_reason: 'Administrative amendment'
    });
    setIsModalOpen(true);
  };

  const handleViewHistory = async (ruleId: string) => {
    try {
      const hist = await ApiService.getRuleHistory(ruleId);
      setSelectedRuleHistory(hist);
      setHistoryRuleId(ruleId);
      setActiveTab('history');
    } catch (err) {
      console.error('Failed to load rule history', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await ApiService.updateRule(editingRule.id, formData);
        setFeedback(`Rule ${editingRule.id} updated to version ${editingRule.version + 1}.`);
      } else {
        await ApiService.createRule(formData);
        setFeedback(`Statutory Rule ${formData.id} successfully created.`);
      }
      setIsModalOpen(false);
      fetchRules();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to save rule');
    }
  };

  const toggleRuleActive = async (rule: ComplianceRule) => {
    try {
      await ApiService.updateRule(rule.id, {
        is_active: !rule.is_active,
        modification_reason: rule.is_active ? 'Deactivated by administrator' : 'Reactivated by administrator'
      });
      fetchRules();
    } catch (err) {
      console.error('Toggle failed', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-govNavy-900 dark:text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-deepBlue dark:text-cyanAccent" />
            Statutory Rule Management & Versioning
          </h2>
          <p className="text-xs text-slate-500">
            Configure legal provisions, gazetted amendments, category applicability, and audit version history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'rules' ? 'bg-white dark:bg-slate-900 text-deepBlue dark:text-cyanAccent shadow-sm' : 'text-slate-500'
              }`}
            >
              Active Rules ({rules.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'history' ? 'bg-white dark:bg-slate-900 text-deepBlue dark:text-cyanAccent shadow-sm' : 'text-slate-500'
              }`}
            >
              Amendment History
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-deepBlue hover:bg-deepBlue-hover text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Promulgate New Rule</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <RefreshCw className="w-7 h-7 text-deepBlue animate-spin" />
          <p className="text-xs text-slate-500">Loading statutory compliance rules catalog...</p>
        </div>
      ) : activeTab === 'rules' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((r) => (
            <div
              key={r.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                r.is_active
                  ? 'bg-white dark:bg-cardBgDark border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-card'
                  : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-70'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-deepBlue dark:text-cyanAccent">
                        {r.id}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        v{r.version}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {r.severity}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-govNavy-900 dark:text-white mt-1">
                      {r.name}
                    </h4>
                  </div>

                  <button
                    onClick={() => toggleRuleActive(r)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                      r.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {r.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {r.description}
                </p>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-[11px] text-slate-500 space-y-1">
                  <div>
                    <strong>Legal Reference:</strong> {r.legal_reference}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Applicability: <strong className="text-slate-700 dark:text-slate-300">{r.category_filter}</strong></span>
                    <span>Effective: <strong className="text-slate-700 dark:text-slate-300">{r.effective_date}</strong></span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleViewHistory(r.id)}
                  className="text-deepBlue dark:text-cyanAccent font-semibold flex items-center gap-1 hover:underline"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Version History</span>
                </button>

                <button
                  onClick={() => handleOpenEdit(r)}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Rule</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* History View */
        <div className="p-6 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-govNavy-900 dark:text-white">
                Statutory Amendment History {historyRuleId ? `for Rule [${historyRuleId}]` : ''}
              </h3>
              <p className="text-xs text-slate-500">Immutable regulatory audit trail of changes made to legal metrology rules.</p>
            </div>
            {historyRuleId && (
              <button
                onClick={() => {
                  setHistoryRuleId('');
                  setSelectedRuleHistory([]);
                }}
                className="text-xs text-deepBlue hover:underline"
              >
                Clear Filter
              </button>
            )}
          </div>

          {selectedRuleHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No historical amendments recorded yet for this rule.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedRuleHistory.map((h) => (
                <div key={h.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-deepBlue dark:text-cyanAccent">
                      Version {h.version} &bull; {h.rule_id}
                    </span>
                    <span className="text-slate-400 text-[11px]">{h.created_at}</span>
                  </div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{h.changes_summary}</p>
                  <p className="text-[11px] text-slate-500">Promulgated By: {h.modified_by}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal for Rule Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-cardBgDark rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-govNavy-900 dark:text-white">
                {editingRule ? `Edit Statutory Rule (${editingRule.id})` : 'Promulgate New Compliance Rule'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rule ID
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingRule}
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rule Provision Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rule 6(1)(a)"
                    value={formData.rule_number}
                    onChange={(e) => setFormData({ ...formData, rule_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rule Name / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Declaration of Generic Name of Commodity"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Statutory Description
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Legal Reference
                </label>
                <input
                  type="text"
                  required
                  value={formData.legal_reference}
                  onChange={(e) => setFormData({ ...formData, legal_reference: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Required Declaration Key
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. mrp, net_quantity, manufacturer"
                    value={formData.required_declaration}
                    onChange={(e) => setFormData({ ...formData, required_declaration: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Severity
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white outline-none"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              {editingRule && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reason for Amendment (Recorded in Audit History)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.modification_reason}
                    onChange={(e) => setFormData({ ...formData, modification_reason: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white outline-none"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-deepBlue text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingRule ? 'Save & Promulgate Version' : 'Create Rule'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

