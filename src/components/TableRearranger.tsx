import React, { useState } from 'react';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  RotateCcw,
  SlidersHorizontal,
  X,
  Check,
  MoveUp,
  MoveDown,
  LayoutGrid,
  Columns3,
  ListFilter
} from 'lucide-react';

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  fixed?: boolean; // If true, cannot be hidden (e.g. key identifier)
}

export interface SectionTableConfig {
  id: string;
  label: string;
  visible: boolean;
  description?: string;
  badge?: string;
}

// ---------------------------------------------------------------------------
// Column Customizer Popover / Modal
// ---------------------------------------------------------------------------
interface ColumnRearrangerProps {
  columns: ColumnConfig[];
  onChange: (newColumns: ColumnConfig[]) => void;
  onReset: () => void;
  density?: 'compact' | 'standard' | 'spacious';
  onChangeDensity?: (density: 'compact' | 'standard' | 'spacious') => void;
  isOpen: boolean;
  onClose: () => void;
  tableName?: string;
}

export const ColumnRearranger: React.FC<ColumnRearrangerProps> = ({
  columns,
  onChange,
  onReset,
  density = 'standard',
  onChangeDensity,
  isOpen,
  onClose,
  tableName = 'Data Table'
}) => {
  if (!isOpen) return null;

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newCols = [...columns];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCols.length) return;

    const [removed] = newCols.splice(index, 1);
    newCols.splice(targetIndex, 0, removed);
    onChange(newCols);
  };

  const toggleVisibility = (id: string) => {
    const newCols = columns.map((col) => {
      if (col.id === id) {
        if (col.fixed) return col; // Cannot hide fixed column
        return { ...col, visible: !col.visible };
      }
      return col;
    });
    onChange(newCols);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden text-slate-900 font-sans">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Columns3 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Rearrange Columns: {tableName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-slate-500 font-mono">
            Reorder table columns using the arrows or toggle column visibility. Order updates immediately.
          </p>

          {/* Density Selector */}
          {onChangeDensity && (
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 font-mono text-[11px]">Table Density:</span>
              <div className="flex items-center gap-1">
                {(['compact', 'standard', 'spacious'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => onChangeDensity(d)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold capitalize transition-all cursor-pointer ${
                      density === d
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Columns List */}
          <div className="space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
            {columns.map((col, idx) => (
              <div
                key={col.id}
                className={`flex items-center justify-between p-2 rounded-lg text-xs font-mono border transition-all ${
                  col.visible
                    ? 'bg-slate-50 border-slate-200 shadow-2xs'
                    : 'bg-slate-100/70 border-dashed border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-slate-400 font-bold text-xs w-4">{idx + 1}.</span>
                  <button
                    type="button"
                    onClick={() => toggleVisibility(col.id)}
                    disabled={col.fixed}
                    className={`p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer ${
                      col.fixed ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                    title={col.visible ? 'Hide column' : 'Show column'}
                  >
                    {col.visible ? (
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                  <span className={`font-semibold truncate ${col.visible ? 'text-slate-800' : 'text-slate-500 line-through'}`}>
                    {col.label}
                  </span>
                  {col.fixed && (
                    <span className="text-[11px] px-1 bg-slate-100 text-slate-500 rounded border border-slate-200 font-bold">
                      Fixed
                    </span>
                  )}
                </div>

                {/* Move Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveColumn(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-20 text-slate-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Move column up / left"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveColumn(idx, 'down')}
                    disabled={idx === columns.length - 1}
                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-20 text-slate-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Move column down / right"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-mono font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Columns</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Dashboard / View Table Sections Rearranger Modal
// ---------------------------------------------------------------------------
interface TableSectionsRearrangerProps {
  sections: SectionTableConfig[];
  onChange: (newSections: SectionTableConfig[]) => void;
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
  viewTitle?: string;
}

export const TableSectionsRearranger: React.FC<TableSectionsRearrangerProps> = ({
  sections,
  onChange,
  onReset,
  isOpen,
  onClose,
  viewTitle = 'Dashboard Tables & Sections'
}) => {
  if (!isOpen) return null;

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSecs = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSecs.length) return;

    const [removed] = newSecs.splice(index, 1);
    newSecs.splice(targetIndex, 0, removed);
    onChange(newSecs);
  };

  const moveToEdge = (index: number, to: 'top' | 'bottom') => {
    const newSecs = [...sections];
    const [removed] = newSecs.splice(index, 1);
    if (to === 'top') {
      newSecs.unshift(removed);
    } else {
      newSecs.push(removed);
    }
    onChange(newSecs);
  };

  const toggleVisibility = (id: string) => {
    const newSecs = sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s));
    onChange(newSecs);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-slate-900 font-sans">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Rearrange Tables & Layout Modules
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">{viewTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="bg-indigo-50/50 border border-indigo-200/70 p-3 rounded-xl text-xs font-mono text-indigo-900">
            <span className="font-bold block text-[11px] text-indigo-800 uppercase tracking-wider mb-0.5">
              Live Table Reordering
            </span>
            Customize which tables appear first on your dashboard. Use Up/Down buttons or send a table directly to the top/bottom.
          </div>

          <div className="space-y-2 mt-2">
            {sections.map((sec, idx) => (
              <div
                key={sec.id}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  sec.visible
                    ? 'bg-slate-50 border-slate-200 shadow-xs'
                    : 'bg-slate-50 border-dashed border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleVisibility(sec.id)}
                    className="p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer text-slate-500 hover:text-slate-900 shrink-0"
                    title={sec.visible ? 'Hide section' : 'Show section'}
                  >
                    {sec.visible ? (
                      <Eye className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold truncate ${sec.visible ? 'text-slate-900' : 'text-slate-500 line-through'}`}>
                        {sec.label}
                      </span>
                      {sec.badge && (
                        <span className="text-xs font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200">
                          {sec.badge}
                        </span>
                      )}
                    </div>
                    {sec.description && (
                      <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                        {sec.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Move buttons */}
                <div className="flex items-center gap-1 shrink-0 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => moveToEdge(idx, 'top')}
                    disabled={idx === 0}
                    className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-20 text-slate-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Send to very top"
                  >
                    <MoveUp className="w-3.5 h-3.5 text-indigo-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-20 text-slate-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Move up one position"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(idx, 'down')}
                    disabled={idx === sections.length - 1}
                    className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-20 text-slate-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Move down one position"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveToEdge(idx, 'bottom')}
                    disabled={idx === sections.length - 1}
                    className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-20 text-slate-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Send to very bottom"
                  >
                    <MoveDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-mono font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Table Order</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Apply Layout
          </button>
        </div>
      </div>
    </div>
  );
};
