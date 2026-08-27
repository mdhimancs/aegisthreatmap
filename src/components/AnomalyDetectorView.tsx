import React, { useState } from 'react';
import {
  AlertTriangle,
  Activity,
  Zap,
  ShieldAlert,
  Search,
  Filter,
  Brain,
  Sliders,
  CheckCircle2,
  XCircle,
  Copy,
  ChevronRight,
  TrendingUp,
  Cpu,
  Globe,
  Radio,
  FileCode,
  Sparkles,
  RefreshCw,
  EyeOff
} from 'lucide-react';
import {
  BehavioralAnomaly,
  AnomalyCategory,
  AnomalyAnalysisResult,
  SeverityLevel
} from '../types';

interface AnomalyDetectorViewProps {
  anomalies: BehavioralAnomaly[];
  onUpdateAnomalyStatus: (id: string, status: BehavioralAnomaly['status']) => void;
  onRunAiEvaluation: (anomaly: BehavioralAnomaly) => Promise<AnomalyAnalysisResult | null>;
}

export const AnomalyDetectorView: React.FC<AnomalyDetectorViewProps> = ({
  anomalies,
  onUpdateAnomalyStatus,
  onRunAiEvaluation
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnomaly, setSelectedAnomaly] = useState<BehavioralAnomaly | null>(anomalies[0] || null);

  // AI Evaluation state
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiResult, setAiResult] = useState<AnomalyAnalysisResult | null>(null);
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);

  // Threshold controls
  const [zScoreThreshold, setZScoreThreshold] = useState<number>(3.0);
  const [jitterThreshold, setJitterThreshold] = useState<number>(5.0);

  const categories: { id: AnomalyCategory; label: string; icon: any }[] = [
    { id: 'beaconing', label: 'C2 Beaconing Jitter', icon: Radio },
    { id: 'exfiltration_spike', label: 'Exfiltration Data Spike', icon: TrendingUp },
    { id: 'process_lineage', label: 'Process Lineage Rare', icon: Cpu },
    { id: 'geo_impossible_travel', label: 'Impossible Travel Jump', icon: Globe },
    { id: 'privilege_escalation', label: 'Kerberos / Priv Escalation', icon: ShieldAlert },
    { id: 'living_off_the_land', label: 'LOLBin Execution', icon: FileCode }
  ];

  const filteredAnomalies = anomalies.filter((a) => {
    const matchCat = selectedCategory === 'all' || a.category === selectedCategory;
    const matchSev = selectedSeverity === 'all' || a.severity === selectedSeverity;
    const matchSearch =
      !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.affectedEntity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.observedDeviation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.mitreTechnique.toLowerCase().includes(searchQuery.toLowerCase());
    const matchZScore = a.zScore >= zScoreThreshold;
    return matchCat && matchSev && matchSearch && matchZScore;
  });

  const handleSelectAnomaly = (anomaly: BehavioralAnomaly) => {
    setSelectedAnomaly(anomaly);
    setAiResult(null);
  };

  const handleTriggerAiAnalysis = async (anomaly: BehavioralAnomaly) => {
    setIsEvaluating(true);
    try {
      const result = await onRunAiEvaluation(anomaly);
      if (result) {
        setAiResult(result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(id);
    setTimeout(() => setCopiedQuery(null), 2000);
  };

  const getSeverityBadge = (sev: SeverityLevel) => {
    switch (sev) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      default:
        return 'bg-sky-50 text-sky-700 border-sky-200';
    }
  };

  const getStatusBadge = (status: BehavioralAnomaly['status']) => {
    switch (status) {
      case 'confirmed_threat':
        return 'bg-red-50 text-red-700 border-red-200 font-bold';
      case 'investigating':
        return 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
      case 'benign_baseline':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
      case 'suppressed':
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Top Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-mono">
              Aegis Behavioral Telemetry & Outlier Detection Engine
              <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-[11px] text-red-700 font-mono font-medium">
                {anomalies.filter((a) => a.status === 'investigating' || a.status === 'confirmed_threat').length} Actionable Outliers
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Heuristic Z-Score calculation, periodic network beaconing jitter, abnormal egress spikes, and LOLBin telemetry deviations.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-center">
            <span className="text-xs text-slate-500 block">Avg Z-Score</span>
            <span className="font-bold text-indigo-700">4.33 σ</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-center">
            <span className="text-xs text-slate-500 block">Active Probes</span>
            <span className="font-bold text-amber-700">6 Telemetry Sensors</span>
          </div>
        </div>
      </div>

      {/* Threshold & Filter Controls Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 font-mono">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            All Categories ({anomalies.length})
          </button>

          {categories.map((cat) => {
            const Icon = cat.icon;
            const count = anomalies.filter((a) => a.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span className="text-xs opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Z-Score Slider */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700">Min Z-Score:</span>
          <input
            type="range"
            min="2.0"
            max="6.0"
            step="0.5"
            value={zScoreThreshold}
            onChange={(e) => setZScoreThreshold(parseFloat(e.target.value))}
            className="w-20 accent-red-600 cursor-pointer"
          />
          <span className="font-mono font-bold text-indigo-700">{zScoreThreshold.toFixed(1)}σ</span>
        </div>
      </div>

      {/* Main Grid: Left Anomalies List + Right Dossier & AI Evaluator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Anomaly List (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-1">
            <span>SHOWING {filteredAnomalies.length} DETECTED BEHAVIORAL OUTLIERS</span>
            <span>SORTED BY ANOMALY SCORE</span>
          </div>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1 font-mono">
            {filteredAnomalies.map((anom) => {
              const isSelected = selectedAnomaly?.id === anom.id;
              return (
                <div
                  key={anom.id}
                  onClick={() => handleSelectAnomaly(anom)}
                  className={`bg-slate-50 border rounded-xl p-4 transition-all cursor-pointer shadow-xs ${
                    isSelected
                      ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/20'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {/* Anomaly Score Badge */}
                      <div className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-center font-mono">
                        <span className="text-xs text-red-700 block uppercase leading-none font-bold">SCORE</span>
                        <span className="text-sm font-black text-red-900">{anom.anomalyScore}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase border ${getSeverityBadge(
                              anom.severity
                            )}`}
                          >
                            {anom.severity}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-mono uppercase border ${getStatusBadge(
                              anom.status
                            )}`}
                          >
                            {anom.status.replace('_', ' ')}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-mono font-semibold border border-indigo-200">
                            Z = +{anom.zScore.toFixed(2)}σ
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-1 font-sans">
                          {anom.title}
                        </h3>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                      {new Date(anom.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Entity Box */}
                  <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase font-mono">
                        Affected Endpoint / Entity:
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {anom.affectedEntity}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-sans">
                      <span className="font-semibold text-slate-500 font-mono">Observed Deviation: </span>
                      {anom.observedDeviation}
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[11px] font-mono text-indigo-700 font-semibold">
                      MITRE {anom.mitreTechnique}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateAnomalyStatus(anom.id, 'confirmed_threat');
                        }}
                        className="px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-semibold border border-red-200 cursor-pointer"
                      >
                        Confirm Threat
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateAnomalyStatus(anom.id, 'benign_baseline');
                        }}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium border border-slate-200 cursor-pointer"
                      >
                        Baseline Ok
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Anomaly Dossier & AI Evaluator (5 cols) */}
        <div className="lg:col-span-5 space-y-4 font-mono">
          {selectedAnomaly ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 sticky top-20">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs font-mono font-bold">
                      Anomaly Score: {selectedAnomaly.anomalyScore}/100
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {new Date(selectedAnomaly.detectedAt).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1.5 font-sans">
                    {selectedAnomaly.title}
                  </h3>
                </div>

                <button
                  onClick={() => handleTriggerAiAnalysis(selectedAnomaly)}
                  disabled={isEvaluating}
                  className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs border border-red-500/40 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
                  <span>{isEvaluating ? 'Evaluating...' : 'Mandiant AI Triage'}</span>
                </button>
              </div>

              {/* Baseline vs Observed Deviation */}
              <div className="space-y-2 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono block mb-1">
                    Historical Baseline Normal
                  </span>
                  <p className="text-slate-700 leading-relaxed font-sans">{selectedAnomaly.baselineNorm}</p>
                </div>

                <div className="bg-red-50/50 border border-red-200 rounded-xl p-3">
                  <span className="text-xs font-bold text-red-700 uppercase tracking-wider font-mono block mb-1">
                    Observed Anomaly Outlier
                  </span>
                  <p className="text-red-900 font-medium leading-relaxed font-sans">
                    {selectedAnomaly.observedDeviation}
                  </p>
                </div>
              </div>

              {/* Raw Telemetry Snippet */}
              {selectedAnomaly.rawTelemetrySnippet && (
                <div>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono block mb-1">
                    Raw Telemetry & NetFlow Stream
                  </span>
                  <pre className="bg-slate-900 text-sky-300 p-3 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed max-h-36 border border-slate-800">
                    {selectedAnomaly.rawTelemetrySnippet}
                  </pre>
                </div>
              )}

              {/* Recommended Response */}
              <div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono block mb-1">
                  Mandiant Threat Containment Directive
                </span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed font-sans">
                  {selectedAnomaly.recommendedResponse}
                </p>
              </div>

              {/* AI Evaluation Output Pane */}
              {aiResult && (
                <div className="bg-indigo-50/40 border border-indigo-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Brain className="w-4 h-4 text-indigo-600" />
                      <span>Gemini AI Threat Triage Assessment</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                        aiResult.threatStatus === 'MALICIOUS_OUTLIER'
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {aiResult.threatStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-sans">
                    {aiResult.aiExplanation}
                  </p>

                  {/* Remediation Playbook */}
                  <div className="space-y-1 font-sans">
                    <span className="text-xs font-bold text-indigo-900 uppercase font-mono">
                      Immediate Containment Steps:
                    </span>
                    <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                      {aiResult.remediationPlaybook.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Splunk / KQL Hunt Queries */}
                  {aiResult.investigationQueries && (
                    <div className="space-y-2 pt-2 border-t border-indigo-100">
                      <span className="text-xs font-bold text-indigo-900 uppercase font-mono block">
                        Hunting Queries (SIEM / EDR)
                      </span>

                      {aiResult.investigationQueries.kql && (
                        <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg text-xs font-mono relative border border-slate-800">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                            <span>KQL (Sentinel / M365 Defender)</span>
                            <button
                              onClick={() => handleCopy(aiResult.investigationQueries.kql!, 'kql')}
                              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedQuery === 'kql' ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                          <code className="text-cyan-300">{aiResult.investigationQueries.kql}</code>
                        </div>
                      )}

                      {aiResult.investigationQueries.splunk && (
                        <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg text-xs font-mono relative border border-slate-800">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                            <span>SPL (Splunk Enterprise Security)</span>
                            <button
                              onClick={() => handleCopy(aiResult.investigationQueries.splunk!, 'splunk')}
                              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedQuery === 'splunk' ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                          <code className="text-amber-300">{aiResult.investigationQueries.splunk}</code>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-mono shadow-xs">
              Select any behavioral anomaly to inspect the full baseline analysis and run AI triage.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
