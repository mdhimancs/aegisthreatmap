import React, { useState } from 'react';
import {
  Terminal,
  FileCode,
  Search,
  Plus,
  Copy,
  Check,
  Sparkles,
  Download,
  Shield,
  Layers,
  ExternalLink,
  Code
} from 'lucide-react';
import { DetectionRule, SeverityLevel } from '../types';

interface DetectionRulesViewProps {
  rules: DetectionRule[];
  onAddRule: (rule: DetectionRule) => void;
}

export const DetectionRulesView: React.FC<DetectionRulesViewProps> = ({
  rules,
  onAddRule
}) => {
  const [selectedRuleType, setSelectedRuleType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Rule Generator Form State
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [genType, setGenType] = useState<'YARA' | 'Sigma' | 'Snort'>('YARA');
  const [genThreat, setGenThreat] = useState('');
  const [genDesc, setGenDesc] = useState('');
  const [genTTP, setGenTTP] = useState('');
  const [genArtifacts, setGenArtifacts] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredRules = rules.filter((rule) => {
    const matchType = selectedRuleType === 'all' || rule.type === selectedRuleType;
    const matchSearch =
      !searchQuery ||
      rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.targetThreat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.ruleContent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSynthesizeRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genThreat.trim()) return;

    try {
      setIsGenerating(true);
      const res = await fetch('/api/threat-intel/generate-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleType: genType,
          threatName: genThreat.trim(),
          description: genDesc.trim(),
          ttp: genTTP.trim(),
          targetArtifacts: genArtifacts.trim()
        })
      });

      if (!res.ok) throw new Error('Failed to generate rule');
      const data = await res.json();

      const newRule: DetectionRule = {
        id: `rule-${Date.now()}`,
        title: data.title || `${genThreat.replace(/\s+/g, '_')}_Detection`,
        type: genType,
        severity: (data.severity as SeverityLevel) || 'high',
        author: data.author || 'Mandiant Threat Intelligence Studio',
        targetThreat: genThreat.trim(),
        targetTTP: data.targetTTP || genTTP.trim() || 'T1059',
        ruleContent: data.ruleContent || '# Rule synthesized',
        dateCreated: new Date().toISOString().split('T')[0],
        description: data.description || genDesc || 'Synthesized detection rule.',
        status: 'production'
      };

      onAddRule(newRule);
      setIsSynthesizing(false);
      setGenThreat('');
      setGenDesc('');
      setGenTTP('');
      setGenArtifacts('');
    } catch (err) {
      console.error('Rule synthesis failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const getRuleTypeBadge = (type: string) => {
    switch (type) {
      case 'YARA':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Sigma':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Snort':
      case 'Suricata':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Header Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 font-mono">
              Mandiant Threat Hunting & Detection Engineering Rules
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Production YARA memory/binary signatures, generic Sigma SIEM rules, and Snort/Suricata network IDS signatures
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSynthesizing(!isSynthesizing)}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs border border-red-500/40 transition-all cursor-pointer font-mono"
          >
            <Sparkles className="w-4 h-4 text-pink-200" />
            <span>Synthesize Custom Rule (AI)</span>
          </button>
        </div>
      </div>

      {/* Synthesis Modal / Expanded Form */}
      {isSynthesizing && (
        <form
          onSubmit={handleSynthesizeRule}
          className="bg-slate-50 border border-purple-300 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-200 font-mono"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>AI Detection Rule Generator</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsSynthesizing(false)}
              className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs uppercase font-mono text-slate-500 font-bold block mb-1">
                Rule Format
              </label>
              <select
                value={genType}
                onChange={(e) => setGenType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-slate-50 focus:outline-none focus:border-red-500"
              >
                <option value="YARA">YARA (Memory / Binary / PE Strings)</option>
                <option value="Sigma">Sigma (Generic SIEM / Sysmon / EDR)</option>
                <option value="Snort">Snort / Suricata (Network IDS)</option>
              </select>
            </div>

            <div>
              <label className="text-xs uppercase font-mono text-slate-500 font-bold block mb-1">
                Target Threat / Malware Family *
              </label>
              <input
                type="text"
                required
                value={genThreat}
                onChange={(e) => setGenThreat(e.target.value)}
                placeholder="e.g. Cobalt Strike 4.9 Beacon or LockBit Black"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 font-mono focus:bg-slate-50 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-xs uppercase font-mono text-slate-500 font-bold block mb-1">
                MITRE Technique / TTP
              </label>
              <input
                type="text"
                value={genTTP}
                onChange={(e) => setGenTTP(e.target.value)}
                placeholder="e.g. T1059.001 PowerShell"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 font-mono focus:bg-slate-50 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase font-mono text-slate-500 font-bold block mb-1">
                Key Artifacts / Strings / Signatures to Match
              </label>
              <textarea
                value={genArtifacts}
                onChange={(e) => setGenArtifacts(e.target.value)}
                rows={3}
                placeholder="Hex bytes, unique DLL exports, command flags, regex patterns..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 font-mono resize-none focus:bg-slate-50 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-xs uppercase font-mono text-slate-500 font-bold block mb-1">
                Behavioral Description / Context
              </label>
              <textarea
                value={genDesc}
                onChange={(e) => setGenDesc(e.target.value)}
                rows={3}
                placeholder="Explain the adversary technique, false positive avoidance, and environment assumptions..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 font-mono resize-none focus:bg-slate-50 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={isGenerating || !genThreat.trim()}
              className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs border border-red-500/40 cursor-pointer font-mono"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Synthesizing Rule with AI...' : 'Generate & Save Rule'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 font-mono">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rule title, target threat, or rule contents..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-slate-50 focus:outline-none focus:border-red-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setSelectedRuleType('all')}
            className={`px-3 py-1.5 rounded-xl font-mono transition-colors cursor-pointer ${
              selectedRuleType === 'all'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            All Formats ({rules.length})
          </button>
          <button
            onClick={() => setSelectedRuleType('YARA')}
            className={`px-3 py-1.5 rounded-xl font-mono transition-colors cursor-pointer ${
              selectedRuleType === 'YARA'
                ? 'bg-purple-50 text-purple-700 font-bold border border-purple-200'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            YARA
          </button>
          <button
            onClick={() => setSelectedRuleType('Sigma')}
            className={`px-3 py-1.5 rounded-xl font-mono transition-colors cursor-pointer ${
              selectedRuleType === 'Sigma'
                ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Sigma
          </button>
          <button
            onClick={() => setSelectedRuleType('Snort')}
            className={`px-3 py-1.5 rounded-xl font-mono transition-colors cursor-pointer ${
              selectedRuleType === 'Snort'
                ? 'bg-amber-50 text-amber-800 font-bold border border-amber-200'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Snort / Suricata
          </button>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="space-y-4 font-mono">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2 py-0.5 rounded border text-xs font-mono font-bold uppercase ${getRuleTypeBadge(
                    rule.type
                  )}`}
                >
                  {rule.type}
                </span>
                <h3 className="text-sm font-bold text-slate-900 font-mono">{rule.title}</h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500">
                  Target: <strong className="text-indigo-700">{rule.targetThreat}</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-[11px] font-mono text-indigo-700 font-semibold">{rule.targetTTP}</span>
                <button
                  onClick={() => handleCopy(rule.id, rule.ruleContent)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors ml-2 cursor-pointer border border-slate-200"
                  title="Copy Rule Syntax"
                >
                  {copiedId === rule.id ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-sans">{rule.description}</p>

            {/* Rule Code Container */}
            <div className="relative">
              <pre className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto max-h-72 leading-relaxed selection:bg-purple-900">
                {rule.ruleContent}
              </pre>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
              <span>Author: {rule.author}</span>
              <span>Created: {rule.dateCreated}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
