import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit3,
  RefreshCw,
  Eye,
  Check,
  X,
  FileSearch,
  ChevronRight
} from 'lucide-react';
import { ApiService } from '../services/api';
import { VerificationItem } from '../types';

export const VerificationQueuePage: React.FC = () => {
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<VerificationItem | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await ApiService.getPendingVerifications();
      setItems(data);
      if (data.length > 0 && !activeItem) {
        setActiveItem(data[0]);
        setEditValue(data[0].normalized_value || data[0].raw_value || '');
      }
    } catch (err) {
      console.error('Failed to load verification items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleSelect = (item: VerificationItem) => {
    setActiveItem(item);
    setEditValue(item.normalized_value || item.raw_value || '');
    setComments('');
    setFeedback(null);
  };

  const handleApprove = async () => {
    if (!activeItem) return;
    try {
      await ApiService.approveVerification(activeItem.id, editValue, comments);
      setFeedback(`Approved declaration '${activeItem.declaration_label}'. Legal compliance updated.`);
      setItems((prev) => prev.filter((i) => i.id !== activeItem.id));
      setActiveItem(null);
    } catch (err) {
      console.error('Approval failed', err);
    }
  };

  const handleReject = async () => {
    if (!activeItem) return;
    try {
      await ApiService.rejectVerification(activeItem.id, comments || 'Confirmed violation by inspector');
      setFeedback(`Rejected '${activeItem.declaration_label}'. Violation logged in inspection audit.`);
      setItems((prev) => prev.filter((i) => i.id !== activeItem.id));
      setActiveItem(null);
    } catch (err) {
      console.error('Rejection failed', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-govNavy-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-deepBlue dark:text-cyanAccent" />
            Human Verification & Adjudication Queue
          </h2>
          <p className="text-xs text-slate-500">
            Review uncertain OCR detections, verify borderline postal addresses, and confirm statutory violations.
          </p>
        </div>

        <button
          onClick={fetchPending}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue ({items.length})</span>
        </button>
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
          <p className="text-xs text-slate-500">Loading pending verification items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-successGreen mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-govNavy-900 dark:text-white">
            Verification Queue is Clear!
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All AI-extracted declarations meet statutory confidence thresholds and passed automated legal checks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Queue List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Review Items ({items.length})
            </h3>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {items.map((item) => {
                const isSelected = activeItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-deepBlue bg-blue-50/60 dark:bg-blue-950/30 shadow-md ring-2 ring-deepBlue/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-cardBgDark hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-deepBlue dark:text-cyanAccent">
                        {item.inspection_id}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        {Math.round(item.confidence * 100)}% conf
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-govNavy-900 dark:text-white">
                      {item.declaration_label}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {item.product_name} &bull; <span className="text-slate-500">{item.brand}</span>
                    </p>

                    <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-400 leading-snug line-clamp-2">
                      &bull; {item.review_reason}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Adjudication Card & Image Preview (7 cols) */}
          <div className="lg:col-span-7">
            {activeItem ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft space-y-5">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-deepBlue dark:text-cyanAccent">
                      {activeItem.inspection_id} &bull; {activeItem.declaration_key}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Readability: <strong className="text-slate-700 dark:text-slate-200">{activeItem.readability_score}</strong>
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-govNavy-900 dark:text-white mt-1">
                    Adjudicate: {activeItem.declaration_label}
                  </h3>
                  <p className="text-xs text-slate-500">{activeItem.product_name} ({activeItem.brand})</p>
                </div>

                {/* Evidence Image Preview */}
                {activeItem.image_url && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 h-52 flex items-center justify-center">
                    <img
                      src={activeItem.image_url}
                      alt="Packaging Evidence"
                      className="max-h-full w-auto object-contain"
                    />
                    <div className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-950/80 text-[10px] text-slate-300 font-mono">
                      Original Packaging Photo
                    </div>
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-500 font-semibold uppercase text-[10px] mb-1">
                      Raw Optical Character Detection:
                    </label>
                    <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 font-mono text-slate-700 dark:text-slate-300">
                      {activeItem.raw_value || '[NO CHARACTERS DETECTED BY OCR ENGINE]'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] mb-1">
                      Inspector Verified / Corrected Value:
                    </label>
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Enter verified declaration text..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-deepBlue"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] mb-1">
                      Officer Audit Comments:
                    </label>
                    <textarea
                      rows={2}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Add regulatory reason, rule exemption citation, or compounding remarks..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-deepBlue"
                    />
                  </div>
                </div>

                {/* Decision Action Buttons */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleReject}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-errorRed border border-red-200 dark:bg-red-950/40 dark:border-red-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Confirm Statutory Violation (Reject)</span>
                  </button>

                  <button
                    onClick={handleApprove}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-successGreen hover:bg-successGreen-dark text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Validate as Compliant</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-sm">
                Select an item from the pending list on the left to review.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

