import React, { useState } from 'react';
import {
  Power,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Download,
  X,
  Lock,
  Radio,
  CheckCircle2,
  FileText,
  Clock
} from 'lucide-react';

interface AppExitStandbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterStandby: () => void;
  onExportAndClose: () => void;
  isStandby: boolean;
  onResume: () => void;
}

export const AppExitStandbyModal: React.FC<AppExitStandbyModalProps> = ({
  isOpen,
  onClose,
  onEnterStandby,
  onExportAndClose,
  isStandby,
  onResume
}) => {
  const [selectedAction, setSelectedAction] = useState<'standby' | 'close' | 'export'>('standby');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-50 border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400">
              <Power className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Aegis SOC Session Control
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Pause telemetry stream or safely disconnect session
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 font-mono text-xs text-slate-700">
          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            Select an action to manage your active intelligence session, pause background sensor streaming, or securely close the console.
          </p>

          <div className="space-y-2.5">
            {/* Option 1: Standby Mode */}
            <div
              onClick={() => setSelectedAction('standby')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                selectedAction === 'standby'
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-2xs'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-xl mt-0.5 ${selectedAction === 'standby' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Radio className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Enter SOC Standby & Pause</span>
                  {selectedAction === 'standby' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal font-sans">
                  Suspends real-time telemetry polling, frees container resources, and maintains your active workspace state.
                </p>
              </div>
            </div>

            {/* Option 2: Export & Disconnect */}
            <div
              onClick={() => setSelectedAction('export')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                selectedAction === 'export'
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-2xs'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-xl mt-0.5 ${selectedAction === 'export' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Download className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Export STIX 2.1 & Standby</span>
                  {selectedAction === 'export' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal font-sans">
                  Downloads current campaign intelligence bundle as standardized STIX JSON before entering standby.
                </p>
              </div>
            </div>

            {/* Option 3: Disconnect & Close Session */}
            <div
              onClick={() => setSelectedAction('close')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                selectedAction === 'close'
                  ? 'border-red-600 bg-red-50/70 shadow-2xs'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-xl mt-0.5 ${selectedAction === 'close' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Power className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Gracefully Disconnect Console</span>
                  {selectedAction === 'close' && <CheckCircle2 className="w-4 h-4 text-red-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal font-sans">
                  Terminates the live telemetry session, shuts down active stream listeners, and secures the console interface.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-2.5 font-mono text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedAction === 'standby') {
                onEnterStandby();
              } else if (selectedAction === 'export') {
                onExportAndClose();
              } else {
                onEnterStandby();
              }
              onClose();
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Confirm Action
          </button>
        </div>
      </div>
    </div>
  );
};

export const StandbyScreenOverlay: React.FC<{
  onResume: () => void;
}> = ({ onResume }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-slate-100 font-mono text-center animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-3xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mb-5 shadow-2xl">
        <Power className="w-8 h-8 animate-pulse" />
      </div>

      <h2 className="text-xl font-bold text-white font-sans tracking-tight">
        Aegis Threat Intelligence Console In Standby
      </h2>
      <p className="text-xs text-slate-400 max-w-md mt-2 font-mono leading-relaxed">
        Live telemetry streaming and background polling have been safely paused. Workspace session data is preserved in secure state.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={onResume}
          className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs rounded-xl shadow-lg border border-red-500/40 transition-all cursor-pointer flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Resume Active SOC Console</span>
        </button>
      </div>

      <div className="mt-8 text-[11px] text-slate-600 font-mono">
        Aegis Cyber Threat Intelligence Engine &bull; Version 4.2.8 &bull; Defcon 2 Standby
      </div>
    </div>
  );
};
