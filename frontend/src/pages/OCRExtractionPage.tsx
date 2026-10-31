import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Save,
  RefreshCw,
  Eye,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Check,
  Info
} from 'lucide-react';
import { ApiService } from '../services/api';
import { BoundingBoxOverlay } from '../components/BoundingBoxOverlay';

export const OCRExtractionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inspectionIdFromUrl = searchParams.get('id');

  const [inspectionsList, setInspectionsList] = useState<any[]>([]);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string>(inspectionIdFromUrl || '');
  const [ocrData, setOcrData] = useState<any>(null);
  const [inspectionDetail, setInspectionDetail] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedBoxId, setSelectedBoxId] = useState<any>(null);

  // Manual editing state
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Fetch recent inspections for dropdown selector
    ApiService.getInspectionHistory({ limit: 20 })
      .then((res) => {
        setInspectionsList(res.items);
        if (!selectedInspectionId && res.items.length > 0) {
          setSelectedInspectionId(res.items[0].id);
        }
      })
      .catch((err) => console.error('Failed to load history', err));
  }, []);

  useEffect(() => {
    if (selectedInspectionId) {
      loadInspectionOCR(selectedInspectionId);
    }
  }, [selectedInspectionId]);

  const loadInspectionOCR = async (id: string) => {
    setLoading(true);
    setSaveSuccess(null);
    try {
      const [ocr, detail] = await Promise.all([
        ApiService.getOCRResults(id),
        ApiService.getInspectionDetail(id)
      ]);
      setOcrData(ocr);
      setInspectionDetail(detail);
    } catch (err) {
      console.error('Failed to load OCR results', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCorrection = async (key: string) => {
    if (!selectedInspectionId) return;
    try {
      await ApiService.correctOCRDeclaration(selectedInspectionId, key, editValue, 'Manually corrected by inspector');
      setSaveSuccess(`Field '${key}' updated and saved to audit log.`);
      setEditingKey(null);
      // Refresh
      loadInspectionOCR(selectedInspectionId);
    } catch (err) {
      console.error('Correction failed', err);
    }
  };

  const activeImage = inspectionDetail?.images?.[0];
  const imageUrl = activeImage?.file_path || '/backend/sample_images/sample_chips_compliant.jpg';

  // Format bounding boxes for overlay
  const overlayBoxes = (ocrData?.lines || []).map((l: any, idx: number) => ({
    id: idx,
    text: l.text,
    confidence: l.confidence,
    bounding_box: l.bounding_box,
    label: `${Math.round(l.confidence * 100)}%`
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-govNavy-900 dark:text-white flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-deepBlue dark:text-cyanAccent" />
            OCR Text Extraction & Visual Bounding Boxes
          </h2>
          <p className="text-xs text-slate-500">
            Computer vision neural text detection, character height estimation, and confidence auditing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Inspection ID:
          </label>
          <select
            value={selectedInspectionId}
            onChange={(e) => setSelectedInspectionId(e.target.value)}
            className="text-xs font-mono font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-deepBlue dark:text-cyanAccent shadow-sm outline-none focus:ring-2 focus:ring-deepBlue"
          >
            {inspectionsList.map((insp) => (
              <option key={insp.id} value={insp.id}>
                {insp.id} - {insp.product_name} ({insp.brand})
              </option>
            ))}
          </select>

          <button
            onClick={() => loadInspectionOCR(selectedInspectionId)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            title="Reload OCR Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <RefreshCw className="w-7 h-7 text-deepBlue animate-spin" />
          <p className="text-xs text-slate-500">Rendering visual bounding boxes & confidence scores...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Interactive Bounding Box Viewer (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <BoundingBoxOverlay
              imageUrl={imageUrl}
              boxes={overlayBoxes}
              selectedBoxId={selectedBoxId}
              onSelectBox={(box) => setSelectedBoxId(box.id)}
            />

            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
              <Info className="w-4 h-4 text-deepBlue shrink-0 mt-0.5" />
              <div>
                <strong>Interactive Bounding Box Inspection:</strong> Hover over any detected bounding box region to view extracted characters, estimated character height (px), and OCR confidence. Click on a declaration on the right to focus.
              </div>
            </div>
          </div>

          {/* Right: Classified Declarations & Raw Lines (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Classified Fields Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-govNavy-900 dark:text-white">
                    Classified Mandatory Declarations
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Engine: <strong className="text-deepBlue dark:text-cyanAccent">{ocrData?.engine_used || 'winocr'}</strong> &bull; Avg Conf: <strong>{Math.round((ocrData?.confidence_avg || 0.85) * 100)}%</strong>
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/compliance?id=${selectedInspectionId}`)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-deepBlue text-white text-xs font-semibold hover:bg-deepBlue-hover transition-colors"
                >
                  <span>View Compliance</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {(ocrData?.declarations || []).map((decl: any) => {
                  const isEditing = editingKey === decl.declaration_key;
                  const isLowConf = decl.confidence < 0.75;
                  const valueToDisplay = decl.is_manually_corrected
                    ? decl.corrected_value
                    : (decl.normalized_value || decl.raw_value || 'NOT DETECTED');

                  return (
                    <div
                      key={decl.declaration_key}
                      className={`p-3 rounded-xl border transition-all ${
                        decl.is_manually_corrected
                          ? 'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20'
                          : isLowConf
                          ? 'border-amber-200 bg-amber-50/40 dark:bg-amber-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {decl.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                              decl.confidence > 0.85
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : decl.confidence > 0.6
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            }`}
                          >
                            {Math.round(decl.confidence * 100)}% conf
                          </span>

                          {!isEditing ? (
                            <button
                              onClick={() => {
                                setEditingKey(decl.declaration_key);
                                setEditValue(valueToDisplay);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-deepBlue hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                              title="Manually correct field"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSaveCorrection(decl.declaration_key)}
                              className="p-1 rounded text-emerald-600 hover:bg-emerald-100 transition-colors"
                              title="Save correction"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-deepBlue bg-white dark:bg-cardBgDark text-govNavy-900 dark:text-white outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveCorrection(decl.declaration_key)}
                            className="px-2.5 py-1 rounded-lg bg-deepBlue text-white text-xs font-semibold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingKey(null)}
                            className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs font-medium text-govNavy-900 dark:text-white break-words">
                          {valueToDisplay}
                          {decl.is_manually_corrected && (
                            <span className="ml-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              (Verified by Inspector)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Raw OCR Text Viewer */}
            <div className="p-5 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Raw Optical Text Stream
                </h4>
                <span className="text-[11px] text-slate-400">
                  {ocrData?.lines?.length || 0} Lines Extracted
                </span>
              </div>
              <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] max-h-48 overflow-y-auto leading-relaxed select-all">
                {ocrData?.raw_text || 'No raw text stream available'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

