import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ShieldAlert,
  Globe,
  Radio,
  FileCode,
  Sparkles,
  ExternalLink,
  Tag,
  ArrowUpRight
} from 'lucide-react';
import { IOC } from '../types';

interface IOCDetailModalProps {
  ioc: IOC | null;
  onClose: () => void;
  onAIEnrich: (ioc: IOC) => Promise<void>;
  isEnriching: boolean;
}

export const IOCDetailModal: React.FC<IOCDetailModalProps> = ({
  ioc,
  onClose,
  onAIEnrich,
  isEnriching
}) => {
  const [copied, setCopied] = useState(false);

  if (!ioc) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(ioc.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const detectionPercent = Math.round(
    (ioc.detectionStats.malicious / (ioc.detectionStats.total || 72)) * 100
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 font-mono">
      <div className="bg-[#0C1222] border border-[#1E2D4A] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#1A253D] flex items-center justify-between bg-[#090E1A]">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-[#141E33] text-cyan-300 font-bold uppercase text-xs border border-cyan-800/40">
              {ioc.type}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60 font-bold uppercase">
                  {ioc.severity}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-bold">
                  {ioc.tlp}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAIEnrich(ioc)}
              disabled={isEnriching}
              className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-950/60 border border-red-400/40 transition-all cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isEnriching ? 'animate-spin' : ''}`} />
              <span>{isEnriching ? 'Enriching via Gemini...' : 'Mandiant AI Enrichment'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#162238] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* IOC Value Box */}
          <div className="bg-[#080D18] p-4 rounded-xl border border-[#1C2B47] flex items-center justify-between gap-3">
            <div className="font-mono text-sm sm:text-base font-bold text-white break-all select-all">
              {ioc.value}
            </div>
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-[#141E33] border border-[#1E2D4A] hover:bg-[#1C2A47] text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
              title="Copy value"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Key Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#0E1628] p-3 rounded-xl border border-[#1C2B47]">
              <span className="text-xs uppercase text-slate-400 font-bold block">Risk Score</span>
              <span className="text-xl font-bold text-red-400">{ioc.riskScore}/100</span>
            </div>
            <div className="bg-[#0E1628] p-3 rounded-xl border border-[#1C2B47]">
              <span className="text-xs uppercase text-slate-400 font-bold block">Confidence</span>
              <span className="text-xl font-bold text-emerald-400">{ioc.confidenceScore}%</span>
            </div>
            <div className="bg-[#0E1628] p-3 rounded-xl border border-[#1C2B47]">
              <span className="text-xs uppercase text-slate-400 font-bold block">Engine Detections</span>
              <span className="text-xl font-bold text-amber-400">
                {ioc.detectionStats.malicious}/{ioc.detectionStats.total} ({detectionPercent}%)
              </span>
            </div>
            <div className="bg-[#0E1628] p-3 rounded-xl border border-[#1C2B47]">
              <span className="text-xs uppercase text-slate-400 font-bold block">Category</span>
              <span className="text-sm font-bold text-purple-400 uppercase">{ioc.category}</span>
            </div>
          </div>

          {/* Description & Technical Summary */}
          <div>
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] mb-1.5">
              Threat Intelligence Description
            </h4>
            <p className="text-slate-200 leading-relaxed bg-[#0E1628] p-3.5 rounded-xl border border-[#1C2B47] font-sans text-xs">
              {ioc.description}
            </p>
          </div>

          {/* Attribution & Malware */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#0E1628] p-3.5 rounded-xl border border-[#1C2B47] space-y-1">
              <span className="text-xs uppercase text-slate-400 font-bold block">Attributed Threat Actor</span>
              <span className="text-sm font-bold text-cyan-400">{ioc.threatActor || 'Attribution Pending / Under Mandiant Investigation'}</span>
            </div>
            <div className="bg-[#0E1628] p-3.5 rounded-xl border border-[#1C2B47] space-y-1">
              <span className="text-xs uppercase text-slate-400 font-bold block">Malware Family</span>
              <span className="text-sm font-bold text-purple-400">{ioc.malwareFamily || 'Generic Threat Payload'}</span>
            </div>
          </div>

          {/* Passive DNS & WHOIS (if applicable) */}
          {ioc.passiveDns && ioc.passiveDns.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Passive DNS History & Resolutions</span>
              </h4>
              <div className="bg-[#0E1628] p-3 rounded-xl border border-[#1C2B47] space-y-1 text-[11px]">
                {ioc.passiveDns.map((domain, i) => (
                  <div key={i} className="text-slate-200 flex items-center justify-between">
                    <span>{domain}</span>
                    <span className="text-slate-500 text-xs">A Record Resolution</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MITRE ATT&CK Mapping */}
          {ioc.mitreTechniques && ioc.mitreTechniques.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] mb-1.5">
                Observed MITRE ATT&CK Techniques
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {ioc.mitreTechniques.map((tech, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-[#141E33] border border-cyan-800/40 text-cyan-300 text-[11px] font-bold"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Incident Response Playbook */}
          {ioc.recommendedAction && (
            <div>
              <h4 className="font-bold text-red-400 uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                <span>Recommended Mandiant Containment & SOC Action</span>
              </h4>
              <div className="bg-red-950/40 border border-red-800/50 p-3.5 rounded-xl text-slate-200 leading-relaxed font-sans text-xs">
                {ioc.recommendedAction}
              </div>
            </div>
          )}

          {/* Tags */}
          {ioc.tags && ioc.tags.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-[#1A253D]">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <div className="flex flex-wrap gap-1">
                {ioc.tags.map((t, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-[#141E33] border border-[#1E2D4A] rounded text-xs text-slate-400">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#1A253D] bg-[#090E1A] flex items-center justify-between text-xs text-slate-400">
          <div>First Seen: {new Date(ioc.firstSeen).toLocaleDateString()} | Last Seen: {new Date(ioc.lastSeen).toLocaleDateString()}</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1E2D4A] hover:bg-[#283C63] text-white rounded-xl font-medium transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
