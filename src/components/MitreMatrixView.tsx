import React, { useState } from 'react';
import {
  Grid,
  Shield,
  Layers,
  Search,
  ExternalLink,
  Sparkles,
  ChevronRight,
  Terminal,
  Activity,
  Users,
  Globe2,
  X
} from 'lucide-react';
import { MitreTactic, MitreTechnique } from '../types';

interface MitreMatrixViewProps {
  tactics: MitreTactic[];
  onGenerateRuleForTechnique: (tech: MitreTechnique) => void;
}

export const MitreMatrixView: React.FC<MitreMatrixViewProps> = ({
  tactics,
  onGenerateRuleForTechnique
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTechnique, setSelectedTechnique] = useState<MitreTechnique | null>(null);

  // Filter tactics and techniques
  const filteredTactics = tactics.map((tactic) => {
    const matchingTechs = tactic.techniques.filter(
      (tech) =>
        !searchQuery ||
        tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tech.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tech.activeActors.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return { ...tactic, techniques: matchingTechs };
  });

  const getDifficultyColor = (diff: 'low' | 'moderate' | 'high') => {
    switch (diff) {
      case 'low':
        return 'text-emerald-700 border-emerald-200 bg-emerald-50';
      case 'moderate':
        return 'text-amber-700 border-amber-200 bg-amber-50';
      case 'high':
        return 'text-red-700 border-red-200 bg-red-50';
    }
  };

  return (
    <div className="space-y-4 text-slate-900 font-sans">
      {/* Header Bar */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">
                Unified Offensive Intelligence
              </h2>
              <p className="text-xs font-bold text-slate-900 font-mono">
                Mandiant Global ATT&CK Enterprise Matrix <span className="text-indigo-600 font-black">v15.1</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 mr-2 font-mono text-[9px] font-bold">
            <span className="px-2 py-0.5 bg-white text-slate-900 rounded shadow-2xs border border-slate-200">TACTICAL</span>
            <span className="px-2 py-0.5 text-slate-500 hover:text-slate-700 cursor-pointer">PREDICTIVE</span>
          </div>
          <div className="relative w-48">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter TTPs..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 py-1 text-[11px] text-slate-900 focus:outline-none focus:border-red-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Interactive Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {filteredTactics.map((tactic) => (
          <div
            key={tactic.id}
            className="bg-slate-50 border border-slate-200 rounded-2xl flex flex-col shadow-xs overflow-hidden"
          >
            {/* Tactic Column Header */}
            <div className="p-2.5 bg-slate-50 border-b border-slate-200">
              <span className="text-[10px] font-mono text-indigo-700 font-bold uppercase block leading-none mb-1">
                {tactic.id}
              </span>
              <h3 className="text-[11px] font-bold text-slate-900 tracking-wide font-mono leading-tight">{tactic.name}</h3>
            </div>

            {/* Techniques List */}
            <div className="p-1.5 space-y-1.5 flex-1 overflow-y-auto max-h-[600px]">
              {tactic.techniques.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-[10px] font-mono">
                  No matches
                </div>
              ) : (
                tactic.techniques.map((tech) => (
                  <div
                    key={tech.id}
                    onClick={() => setSelectedTechnique(tech)}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-50 border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-[10px] font-bold text-indigo-700 group-hover:text-indigo-900">
                        {tech.id}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1 py-0.2 rounded border font-bold uppercase ${getDifficultyColor(
                          tech.detectionDifficulty
                        )}`}
                      >
                        {tech.detectionDifficulty.charAt(0)}
                      </span>
                    </div>

                    <h4 className="text-[10px] font-bold text-slate-800 group-hover:text-red-600 transition-colors font-mono leading-tight">
                      {tech.name}
                    </h4>

                    <p className="text-[9px] text-slate-500 mt-1 line-clamp-1 font-sans opacity-70">
                      {tech.description}
                    </p>

                    {/* Meta Info Grid */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[8px] font-mono border-t border-slate-100 pt-1">
                      <div className="flex items-center gap-1">
                        <Users className="w-2 h-2 text-red-600" />
                        <span className="text-red-700 font-bold">{tech.activeActors[0]?.split(' ')[0] || 'APT'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe2 className="w-2 h-2 text-sky-600" />
                        <span className="text-slate-500">{tech.platforms[0]?.charAt(0)}</span>
                      </div>
                      <div className="flex-1 text-right">
                        <span className="text-slate-900 font-black">{tech.prevalenceScore}% Prev</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Technique Inspection Modal in Light Theme */}
      {selectedTechnique && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 font-mono">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-xs font-bold">
                  {selectedTechnique.id}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-mono">{selectedTechnique.name}</h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Tactic: {selectedTechnique.tacticName} ({selectedTechnique.tacticId})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const t = selectedTechnique;
                    setSelectedTechnique(null);
                    onGenerateRuleForTechnique(t);
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs border border-red-500/40 transition-all cursor-pointer font-mono"
                >
                  <Sparkles className="w-3.5 h-3.5 text-pink-200" />
                  <span>Synthesize Rule</span>
                </button>
                <button
                  onClick={() => setSelectedTechnique(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              <div>
                <h4 className="font-bold text-slate-600 uppercase tracking-wider text-[11px] mb-1">
                  Technique Description
                </h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-sans">
                  {selectedTechnique.description}
                </p>
              </div>

              {/* Supported Platforms & Prevalence */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs uppercase text-slate-500 font-mono font-bold block mb-1">
                    Target Platforms
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedTechnique.platforms.map((p, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs uppercase text-slate-500 font-mono font-bold block mb-1">
                    Observed Prevalence
                  </span>
                  <span className="text-lg font-bold text-red-700 font-mono">
                    {selectedTechnique.prevalenceScore}% of Campaigns
                  </span>
                </div>
              </div>

              {/* Threat Actors */}
              <div>
                <h4 className="font-bold text-slate-600 uppercase tracking-wider text-[11px] mb-1.5">
                  Observed Threat Actors
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTechnique.activeActors.map((actor, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-xs font-bold text-red-700"
                    >
                      {actor}
                    </span>
                  ))}
                </div>
              </div>

              {/* Mitigation Advice */}
              <div>
                <h4 className="font-bold text-emerald-700 uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mandiant Defensive Mitigation & Sensor Visibility</span>
                </h4>
                <p className="text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-sans">
                  {selectedTechnique.mitigationSummary}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
