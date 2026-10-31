import React, { useState } from 'react';
import { BoundingBox } from '../types';
import { Eye, CheckCircle2, AlertTriangle } from 'lucide-react';

interface BoundingBoxOverlayProps {
  imageUrl: string;
  boxes: {
    id?: string | number;
    text: string;
    confidence: number;
    bounding_box?: BoundingBox | null;
    is_violation?: boolean;
    is_verified?: boolean;
    label?: string;
  }[];
  selectedBoxId?: string | number | null;
  onSelectBox?: (box: any) => void;
}

export const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({
  imageUrl,
  boxes,
  selectedBoxId,
  onSelectBox,
}) => {
  const [hoveredBox, setHoveredBox] = useState<any>(null);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-card">
      {/* Controls Bar */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50 text-xs text-slate-200">
        <button
          onClick={() => setShowBoxes(!showBoxes)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
            showBoxes ? 'bg-deepBlue text-white' : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          {showBoxes ? 'Hide Bounding Boxes' : 'Show Bounding Boxes'}
        </button>
        <span className="text-slate-500">|</span>
        <span className="text-slate-400">
          Detected: <strong className="text-white">{boxes.filter(b => b.bounding_box).length}</strong> regions
        </span>
      </div>

      {/* Main Image Container */}
      <div className="relative w-full flex items-center justify-center p-2 bg-slate-950/40 min-h-[460px]">
        <img
          src={imageUrl}
          alt="Packaging Specimen"
          className="max-h-[600px] w-auto object-contain rounded-lg select-none"
        />

        {/* Overlay Bounding Boxes */}
        {showBoxes && (
          <div className="absolute inset-2 pointer-events-none">
            {boxes.map((item, idx) => {
              if (!item.bounding_box) return null;
              const { x, y, width, height, readability_score } = item.bounding_box;
              const isSelected = selectedBoxId === (item.id || idx);
              const isHovered = hoveredBox === item;

              // Color determination
              let strokeColor = 'border-cyan-400 bg-cyan-500/10';
              let badgeColor = 'bg-cyan-600 text-white';

              if (item.is_violation) {
                strokeColor = 'border-errorRed bg-errorRed/15';
                badgeColor = 'bg-errorRed text-white';
              } else if (item.is_verified) {
                strokeColor = 'border-successGreen bg-successGreen/15';
                badgeColor = 'bg-successGreen text-white';
              } else if (item.confidence < 0.75) {
                strokeColor = 'border-warningAmber bg-warningAmber/15';
                badgeColor = 'bg-warningAmber text-slate-950';
              }

              return (
                <div
                  key={idx}
                  style={{
                    left: `${x * 100}%`,
                    top: `${y * 100}%`,
                    width: `${width * 100}%`,
                    height: `${height * 100}%`,
                  }}
                  onMouseEnter={() => setHoveredBox(item)}
                  onMouseLeave={() => setHoveredBox(null)}
                  onClick={() => onSelectBox && onSelectBox(item)}
                  className={`absolute pointer-events-auto border-2 rounded cursor-pointer transition-all duration-150 ${strokeColor} ${
                    isSelected ? 'ring-4 ring-electricBlue border-white z-10 scale-[1.01]' : 'hover:border-white hover:z-10'
                  }`}
                >
                  {/* Small Tag on top-left of box */}
                  <div
                    className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium flex items-center gap-1 shadow-sm whitespace-nowrap z-20 ${badgeColor}`}
                  >
                    {item.label ? item.label : `${Math.round(item.confidence * 100)}%`}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Hover Floating Details Card */}
        {hoveredBox && (
          <div className="absolute bottom-4 left-4 z-30 bg-slate-900/95 border border-slate-700 backdrop-blur-md rounded-xl p-3 max-w-sm shadow-xl text-left pointer-events-none animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-xs font-semibold text-electricBlue uppercase tracking-wider">
                {hoveredBox.label || 'Detected Text Region'}
              </span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                  hoveredBox.confidence > 0.85
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                Conf: {Math.round(hoveredBox.confidence * 100)}%
              </span>
            </div>
            <p className="text-sm font-medium text-white line-clamp-2">
              "{hoveredBox.text}"
            </p>
            {hoveredBox.bounding_box?.char_height_px && (
              <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Est. Char Height: <strong className="text-slate-200">{Math.round(hoveredBox.bounding_box.char_height_px)} px</strong></span>
                <span className="capitalize">Legibility: <strong className="text-slate-200">{hoveredBox.bounding_box.readability_score || 'GOOD'}</strong></span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

