import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  FileText,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info,
  Scale,
  Download,
  CheckSquare
} from 'lucide-react';
import { ApiService } from '../services/api';
import { ComplianceResultItem, InspectionDetail } from '../types';

export const ComplianceAnalysisPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inspectionIdFromUrl = searchParams.get('id');

  const [inspectionsList, setInspectionsList] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>(inspectionIdFromUrl || '');
  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeModalItem, setActiveModalItem] = useState<ComplianceResultItem | null>(null);

  useEffect(() => {
    ApiService.getInspectionHistory({ limit: 20 })
      .then((res) => {
        setInspectionsList(res.items);
        if (!selectedId && res.items.length > 0) {
          setSelectedId(res.items[0].id);
        }
      })
      .catch((err) => console.error('Failed to load inspections', err));
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadInspection(selectedId);
    }
  }, [selectedId]);

  const loadInspection = async (id: string) => {
    setLoading(true);
    try {
      const data = await ApiService.getInspectionDetail(id);
      setInspection(data);
    } catch (err) {
      console.error('Failed to load inspection details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRerun = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      await ApiService.rerunComplianceCheck(selectedId);
      loadInspection(selectedId);
    } catch (err) {
      console.error('Re-run failed', err);
      setLoading(false);
    }
  };

  const overall = inspection?.overall_compliance || 'NEEDS_REVIEW';
  const overallConfig = {
    COMPLIANT: {
      label: 'COMPLIANT (ALL STATUTORY RULES PASSED)',
      color: 'text-successGreen dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950/40',
      border: 'border-green-200 dark:border-green-800',
      icon: CheckCircle2,
      desc: 'All visible mandatory declarations meet requirements under the Legal Metrology (Packaged Commodities) Rules, 2011.'
    },
    NON_COMPLIANT: {
      label: 'NON-COMPLIANT (STATUTORY VIOLATION CONFIRMED)',
      color: 'text-errorRed dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/40',
      border: 'border-red-200 dark:border-red-800',
      icon: XCircle,
      desc: 'One or more mandatory statutory declarations are missing or defective on the packaging specimen.'
    },
    NEEDS_REVIEW: {
      label: 'NEEDS HUMAN REVIEW & ADJUDICATION',
      color: 'text-warningAmber dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800',
      icon: AlertTriangle,
      desc: 'Probabilistic or borderline declarations detected (e.g. uncalibrated font size or incomplete postal address). Human verification required.'
    },
    NOT_APPLICABLE: {
      label: 'NOT APPLICABLE / EXEMPT COMMODITY',
      color: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-800/40',
      border: 'border-slate-300 dark:border-slate-700',
      icon: HelpCircle,
      desc: 'Packaged commodity qualifies for statutory exemption under Rule 26 of Packaged Commodities Rules 2011.'
    }
  }[overall] || {
    label: overall,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    icon: HelpCircle,
    desc: 'Statutory compliance status evaluation.'
  };

  const OverallIcon = overallConfig.icon;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Top Selector & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-govNavy-900 dark:text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-deepBlue dark:text-cyanAccent" />
            Legal Metrology Compliance Analysis
          </h2>
          <p className="text-xs text-slate-500">
            Automated statutory adjudication against The Legal Metrology (Packaged Commodities) Rules, 2011.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="text-xs font-mono font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-deepBlue dark:text-cyanAccent shadow-sm outline-none focus:ring-2 focus:ring-deepBlue"
          >
            {inspectionsList.map((insp) => (
              <option key={insp.id} value={insp.id}>
                {insp.id} - {insp.product_name} ({insp.brand})
              </option>
            ))}
          </select>

          <button
            onClick={handleRerun}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-evaluate</span>
          </button>

          <a
            href={`/api/reports/${selectedId}/download`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-deepBlue hover:bg-deepBlue-hover text-white text-xs font-bold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Official PDF Report</span>
          </a>
        </div>
      </div>

      {loading && !inspection ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <RefreshCw className="w-8 h-8 text-deepBlue animate-spin" />
          <p className="text-xs text-slate-500">Loading statutory rule evaluation results...</p>
        </div>
      ) : (
        <>
          {/* Overall Status Banner */}
          <div className={`p-6 rounded-2xl border ${overallConfig.border} ${overallConfig.bg} shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4`}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 shadow-sm shrink-0">
                <OverallIcon className={`w-8 h-8 ${overallConfig.color}`} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-base font-extrabold uppercase tracking-tight ${overallConfig.color}`}>
                    {overallConfig.label}
                  </span>
                  <span className="text-xs font-mono text-slate-500 bg-white/60 dark:bg-slate-900/60 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
                    ID: {inspection?.id}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 max-w-2xl">
                  {overallConfig.desc}
                </p>
                <div className="text-[11px] text-slate-500 flex items-center gap-4 pt-1">
                  <span>Product: <strong className="text-slate-800 dark:text-slate-200">{inspection?.product?.name}</strong></span>
                  <span>Brand: <strong className="text-slate-800 dark:text-slate-200">{inspection?.product?.brand}</strong></span>
                  <span>Category: <strong className="text-slate-800 dark:text-slate-200">{inspection?.product?.category}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Pills */}
            <div className="flex items-center gap-3">
              <div className="text-center px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-xs text-slate-400 font-semibold uppercase">Passed</div>
                <div className="text-lg font-extrabold text-successGreen">{inspection?.passed_rules}</div>
              </div>
              <div className="text-center px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-xs text-slate-400 font-semibold uppercase">Violations</div>
                <div className="text-lg font-extrabold text-errorRed">{inspection?.violation_rules}</div>
              </div>
              <div className="text-center px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-xs text-slate-400 font-semibold uppercase">Review</div>
                <div className="text-lg font-extrabold text-warningAmber">{inspection?.review_rules}</div>
              </div>
            </div>
          </div>

          {/* Statutory Scope & Disclaimer Alert */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
            <Info className="w-5 h-5 text-deepBlue shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong>Statutory Inspection Scope & Limitations:</strong>
              <p className="leading-relaxed text-blue-800 dark:text-blue-300">
                Do not treat every declaration as universally mandatory for every product. Exemptions apply under Rule 26 (e.g. packages &le; 10g/10ml, institutional packs). Uncalibrated photographic images estimate visual contrast and character readability, but cannot legally certify physical millimetre dimensions without a certified calibration scale.
              </p>
            </div>
          </div>

          {/* Statutory Rule Checks Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-govNavy-900 dark:text-white">
                Statutory Rule-by-Rule Compliance Findings ({inspection?.compliance_results?.length || 0} Rules Evaluated)
              </h3>
              <span className="text-xs text-slate-500">
                Packaged Commodities Rules, 2011
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(inspection?.compliance_results || []).map((res) => {
                const statusConfig = {
                  COMPLIANT: {
                    badge: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800',
                    icon: CheckCircle2,
                    color: 'text-successGreen'
                  },
                  NON_COMPLIANT: {
                    badge: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800',
                    icon: XCircle,
                    color: 'text-errorRed'
                  },
                  NEEDS_REVIEW: {
                    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                    icon: AlertTriangle,
                    color: 'text-warningAmber'
                  },
                  NOT_APPLICABLE: {
                    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
                    icon: HelpCircle,
                    color: 'text-slate-400'
                  }
                }[res.status] || {
                  badge: 'bg-slate-100 text-slate-700',
                  icon: HelpCircle,
                  color: 'text-slate-400'
                };

                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={res.rule_id}
                    onClick={() => setActiveModalItem(res)}
                    className="p-5 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-card hover:border-deepBlue/50 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-deepBlue dark:text-cyanAccent">
                              {res.rule_id}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              Severity: <strong className={res.severity === 'CRITICAL' ? 'text-errorRed' : 'text-slate-600 dark:text-slate-300'}>{res.severity}</strong>
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-govNavy-900 dark:text-white mt-0.5">
                            {res.rule_name}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            {res.legal_reference}
                          </p>
                        </div>

                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusConfig.badge}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{res.status.replace('_', ' ')}</span>
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold uppercase text-[10px]">Stated Value:</span>
                          <span className="font-semibold text-govNavy-900 dark:text-white line-clamp-1">
                            {res.extracted_value || 'None / Not Detected'}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                          {res.evidence_reason}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>Confidence: <strong className="text-slate-700 dark:text-slate-300">{res.confidence}%</strong></span>
                      <span className="text-deepBlue dark:text-cyanAccent font-semibold flex items-center gap-1 hover:underline">
                        <span>Inspect Evidence</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Detail Modal for Bounding Box & Evidence Inspection */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-cardBgDark rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-deepBlue dark:text-cyanAccent">
                  {activeModalItem.rule_id}
                </span>
                <h3 className="font-bold text-base text-govNavy-900 dark:text-white">
                  {activeModalItem.rule_name}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <strong className="text-slate-500 uppercase tracking-wider text-[10px] block">Statutory Reference</strong>
                <p className="font-medium text-govNavy-900 dark:text-slate-200">{activeModalItem.legal_reference}</p>
              </div>

              <div>
                <strong className="text-slate-500 uppercase tracking-wider text-[10px] block">Extracted Declaration</strong>
                <p className="font-bold text-govNavy-900 dark:text-white p-2 rounded-lg bg-slate-100 dark:bg-slate-900">
                  {activeModalItem.extracted_value || 'Declaration Not Found in OCR stream'}
                </p>
              </div>

              <div>
                <strong className="text-slate-500 uppercase tracking-wider text-[10px] block">Legal Metrology Adjudication Reason</strong>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{activeModalItem.evidence_reason}</p>
              </div>

              {activeModalItem.requires_human_review && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                  <strong>Human Review Trigger:</strong> This item has been routed to the inspector adjudication queue for manual confirmation.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => {
                  navigate(`/ocr?id=${selectedId}`);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                View in OCR Screen
              </button>
              <button
                onClick={() => setActiveModalItem(null)}
                className="px-4 py-1.5 rounded-lg bg-deepBlue text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
