import React, { useState } from 'react';
import {
  Compass,
  ShieldAlert,
  Radio,
  Flame,
  Globe2,
  TrendingUp,
  Layers,
  Sparkles,
  ExternalLink,
  Filter,
  Search,
  ArrowRight,
  FileDown,
  Users,
  Target,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Calendar,
  X,
  Server,
  Lock,
  RefreshCw,
  Cpu,
  Activity,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import {
  ThreatCampaign,
  ThreatActor,
  TelemetryMetrics,
  IOC,
  VulnerabilityCVE,
  ExecutiveBriefing
} from '../types';

interface CTIDashboardViewProps {
  campaigns: ThreatCampaign[];
  actors: ThreatActor[];
  telemetry: TelemetryMetrics;
  iocs: IOC[];
  cves: VulnerabilityCVE[];
  onSelectActor: (actor: ThreatActor) => void;
  onSelectIOC: (ioc: IOC) => void;
  onNavigateTab: (tab: any) => void;
  onExportSTIX: () => void;
}

export const CTIDashboardView: React.FC<CTIDashboardViewProps> = ({
  campaigns = [],
  actors = [],
  telemetry,
  iocs = [],
  cves = [],
  onSelectActor,
  onSelectIOC,
  onNavigateTab,
  onExportSTIX
}) => {
  // Filters
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedMotivation, setSelectedMotivation] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Campaign Modal
  const [selectedCampaign, setSelectedCampaign] = useState<ThreatCampaign | null>(null);

  // Executive AI Briefing State
  const [briefingModalOpen, setBriefingModalOpen] = useState(false);
  const [briefing, setBriefing] = useState<ExecutiveBriefing | null>(null);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [briefingRegion, setBriefingRegion] = useState('Global');
  const [briefingSector, setBriefingSector] = useState('Critical Infrastructure & Telecom');

  // Filtered Campaigns
  const filteredCampaigns = campaigns.filter((camp) => {
    const matchesSearch =
      searchQuery === '' ||
      camp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      camp.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      camp.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      camp.attackVector.toLowerCase().includes(searchQuery.toLowerCase()) ||
      camp.targetedSectors.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSeverity =
      selectedSeverity === 'all' || camp.severity === selectedSeverity;

    const matchesRegion =
      selectedRegion === 'all' ||
      (selectedRegion === 'americas' && camp.targetedCountries.some((c) => ['United States', 'Canada', 'Guam'].includes(c))) ||
      (selectedRegion === 'emea' && camp.targetedCountries.some((c) => ['United Kingdom', 'Germany', 'France', 'Ukraine', 'Poland', 'Estonia', 'Switzerland'].includes(c))) ||
      (selectedRegion === 'apac' && camp.targetedCountries.some((c) => ['Japan', 'Singapore', 'South Korea', 'Australia', 'Guam'].includes(c)));

    const matchesMotivation =
      selectedMotivation === 'all' ||
      (selectedMotivation === 'espionage' && (camp.actorName.includes('APT29') || camp.actorName.includes('Volt') || camp.actorName.includes('UNC3886') || camp.actorName.includes('Salt'))) ||
      (selectedMotivation === 'financial' && (camp.actorName.includes('BlackCat') || camp.actorName.includes('Lazarus') || camp.actorName.includes('LockBit') || camp.actorName.includes('Scattered Spider') || camp.actorName.includes('FIN11'))) ||
      (selectedMotivation === 'sabotage' && (camp.actorName.includes('Sandworm') || camp.actorName.includes('Volt')));

    return matchesSearch && matchesSeverity && matchesRegion && matchesMotivation;
  });

  // Trigger Gemini AI Executive Briefing
  const handleGenerateBriefing = async () => {
    try {
      setIsGeneratingBriefing(true);
      setBriefingModalOpen(true);
      const res = await fetch('/api/threat-intel/executive-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: briefingRegion,
          sector: briefingSector,
          timeRange: 'Current Active Landscape'
        })
      });

      if (!res.ok) throw new Error('Failed to generate executive briefing');
      const data = await res.json();
      setBriefing(data);
    } catch (err) {
      console.error('Error generating executive briefing:', err);
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  return (
    <div className="space-y-3 text-slate-900 font-sans">
      {/* Aegis CTI Command Header & KPIs */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-xs space-y-3">
        {/* Top: Title & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 via-rose-700 to-red-800 text-white flex items-center justify-center shadow-md shadow-red-500/20 border border-red-500/40 shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900 font-sans tracking-tight">
                  Strategic Threat Landscape & Campaign Intelligence
                </h1>
                <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[9px] font-mono font-bold border border-red-200 tracking-wider">
                  TACTICAL CTI
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 relative z-10 shrink-0">
            <button
              onClick={handleGenerateBriefing}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-[10px] font-bold shadow-md shadow-red-500/20 border border-red-500/40 transition-all cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-pink-200" />
              <span>Briefing</span>
            </button>

            <button
              onClick={onExportSTIX}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[10px] font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
              title="Export full campaign and adversary bundle to STIX 2.1"
            >
              <FileDown className="w-3 h-3 text-indigo-600" />
              <span className="font-mono font-bold uppercase">STIX</span>
            </button>
          </div>
        </div>

        {/* Bottom: Strategic Threat Posture KPI Grid (Compact inline) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 hover:border-red-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-500 text-[9px] font-mono font-bold uppercase">
              <span>DEFCON Level</span>
              <Radio className="w-2.5 h-2.5 text-red-600 animate-pulse" />
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-base font-black text-red-600 font-mono">2</span>
              <span className="text-[9px] px-1 py-0.2 rounded font-bold border border-red-200 bg-red-50 text-red-700">ELEVATED</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 hover:border-sky-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-500 text-[9px] font-mono font-bold uppercase">
              <span>Active Ops</span>
              <Layers className="w-2.5 h-2.5 text-sky-600" />
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-base font-black text-sky-700 font-mono">{campaigns.length}</span>
              <span className="text-[9px] font-mono text-slate-400">INGESTED</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-500 text-[9px] font-mono font-bold uppercase">
              <span>APT & UNCs</span>
              <Users className="w-2.5 h-2.5 text-purple-600" />
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-base font-black text-purple-700 font-mono">{actors.length}</span>
              <span className="text-[9px] font-mono text-slate-400">TRACKED</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 hover:border-amber-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-500 text-[9px] font-mono font-bold uppercase">
              <span>High-Risk</span>
              <Target className="w-2.5 h-2.5 text-amber-600" />
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-base font-black text-amber-700 font-mono">5</span>
              <span className="text-[9px] font-mono text-slate-400">SECTORS</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 hover:border-rose-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-500 text-[9px] font-mono font-bold uppercase">
              <span>Weaponized</span>
              <Zap className="w-2.5 h-2.5 text-rose-600" />
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-base font-black text-rose-700 font-mono">{cves.length}</span>
              <span className="text-[9px] font-mono text-slate-400">CVEs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Campaign Intelligence Hub */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-xs space-y-3">
        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-red-600" />
              <span>Frontline Campaign Operations Central</span>
              <span className="text-[10px] font-mono font-normal text-slate-500">
                ({filteredCampaigns.length} ops)
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
            {/* Search */}
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-2 py-1 text-[10px] text-slate-900 focus:outline-none focus:border-red-500 font-mono w-32"
              />
            </div>

            {/* Region Filter */}
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-[10px] focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="all">Geos</option>
              <option value="americas">AMER</option>
              <option value="emea">EMEA</option>
              <option value="apac">APAC</option>
            </select>

            {/* Motivation Filter */}
            <select
              value={selectedMotivation}
              onChange={(e) => setSelectedMotivation(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-[10px] focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="all">Motivations</option>
              <option value="espionage">Espionage</option>
              <option value="financial">Financial</option>
              <option value="sabotage">Sabotage</option>
            </select>
          </div>
        </div>

        {/* Campaign Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5">
          {filteredCampaigns.map((camp) => {
            const actorObj = actors.find((a) => a.id === camp.actorId || a.name.includes(camp.actorName.split(' ')[0]));
            return (
              <div
                key={camp.id}
                className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-red-500/60 rounded-xl p-2.5 transition-all shadow-2xs hover:shadow-md flex flex-col justify-between group cursor-pointer"
                onClick={() => setSelectedCampaign(camp)}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1">
                      <span
                        className={`px-1 py-0.2 rounded text-[8px] font-mono font-bold uppercase ${
                          camp.severity === 'critical'
                            ? 'bg-red-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {camp.severity}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">#{camp.id.split('-')[1]}</span>
                  </div>

                  <h3 className="text-[11px] font-bold text-slate-900 group-hover:text-red-700 transition-colors leading-tight mb-1">
                    {camp.title}
                  </h3>

                  <div className="flex items-center gap-1 mb-1.5 pb-1.5 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-indigo-600 font-mono">
                      {camp.actorName}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {camp.mitreTactics.slice(0, 2).map((tactic, idx) => (
                      <span key={idx} className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 text-[8px] font-bold uppercase">
                        {tactic}
                      </span>
                    ))}
                  </div>

                  <div className="mb-2 bg-red-50/50 p-1.5 rounded-lg border border-red-100/50">
                    <span className="text-slate-800 font-mono font-bold text-[9px] leading-tight block">
                      {camp.attackVector}
                    </span>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                  <div className="font-mono text-[8px] font-bold text-slate-400">
                    <span className="text-red-600">{camp.iocCount} IOCs</span>
                  </div>
                  <div className="flex items-center gap-1 text-indigo-600 text-[9px] font-bold font-mono">
                    Dive <ChevronRight className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strategic Attribution & Industry Sectors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Targeted Industry Sector Exposure (6 cols) */}
        <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                <span>Targeted Industry Threat Exposure</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Adversary targeting density across commercial & critical infrastructure sectors
              </p>
            </div>
            <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold border border-indigo-200">
              CROSS-SECTOR
            </span>
          </div>

          <div className="space-y-3.5">
            {telemetry.topTargetedSectors.map((sec, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-800 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    {sec.sector}
                  </span>
                  <span className="text-indigo-700 font-bold">
                    {sec.attacks.toLocaleString()} incursions ({sec.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 h-full rounded-full"
                    style={{ width: `${sec.percentage * 2.6}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Sovereign State Attribution & Threat Origin Matrix (6 cols) */}
        <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-red-600" />
                <span>Geopolitical Threat Attribution Matrix</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                Identified state intelligence organs and cybercrime safe-harbors
              </p>
            </div>
            <span className="text-[9px] font-mono bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold border border-red-100">
              HIGH VOLATILITY
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {telemetry.topSourceCountries.map((c, i) => (
              <div key={i} className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between hover:border-red-300 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-base flex items-center gap-1.5 font-bold text-slate-900">
                    <span className="text-lg">{c.flag}</span>
                    <span className="text-[11px] font-mono uppercase tracking-tight">{c.country}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[9px] font-mono text-red-600 font-bold">LIVE</span>
                  </div>
                </div>
                
                <div className="flex items-baseline justify-between text-[10px] mb-1">
                  <span className="text-slate-400 font-mono uppercase font-bold tracking-tighter">Volume (24h)</span>
                  <span className="font-mono text-slate-900 font-black">{(c.count / 1000).toFixed(1)}K PKTS</span>
                </div>

                <div className="w-full bg-slate-100 h-1.5 rounded-full mb-2 overflow-hidden">
                  <div 
                    className="bg-red-500 h-full rounded-full" 
                    style={{ width: `${Math.min(100, (c.count / 50000) * 100)}%` }} 
                  />
                </div>

                <div className="flex flex-col gap-0.5 pt-1.5 border-t border-slate-50">
                  <span className="text-[8px] font-mono text-slate-400 uppercase font-bold">Active Directives:</span>
                  <div className="flex flex-wrap gap-1">
                    {(c.country === 'Russia'
                      ? ['APT29', 'APT28', 'FIN11']
                      : c.country === 'China'
                      ? ['UNC3886', 'APT41', 'Volt Typhoon']
                      : c.country === 'North Korea'
                      ? ['Lazarus', 'APT43']
                      : ['MuddyWater', 'Charming Kitten']
                    ).map(actor => (
                      <span key={actor} className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1 py-0 rounded">
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dominant Attack Vectors & MITRE TTP Breakdown */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span>Adversary Attack Vector & TTP Dominance (Last 30 Days)</span>
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">
              Dominance of Living-off-the-Land (LotL), edge hypervisor weaponization, and cloud token replay
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('mitre')}
            className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-mono font-bold cursor-pointer bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100"
          >
            ATT&CK MATRIX <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {telemetry.attackVectorBreakdown.map((vec, i) => (
            <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 hover:border-purple-300 transition-colors">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 text-[11px] truncate uppercase tracking-tight">{vec.vector}</span>
                <span className="font-black text-red-600 text-xs">{vec.percentage}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full"
                  style={{ width: `${vec.percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[8px] text-slate-400 font-mono font-bold uppercase">Trend</span>
                <span className="text-[8px] text-emerald-600 font-bold uppercase flex items-center gap-0.5">
                  <TrendingUp className="w-2 h-2" /> +{(Math.random() * 5).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CAMPAIGN DRILL-DOWN MODAL */}
      {/* ========================================================================= */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold border border-red-200">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold uppercase">
                      {selectedCampaign.severity}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                      {selectedCampaign.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedCampaign.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedCampaign(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs font-mono">
              {/* Core Attribution Banner */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-xs uppercase text-slate-500 font-bold block">Attributed Actor</span>
                  <span className="text-sm font-bold text-indigo-600">{selectedCampaign.actorName}</span>
                </div>
                <div>
                  <span className="text-xs uppercase text-slate-500 font-bold block">First Identified</span>
                  <span className="text-xs font-bold text-slate-800">{selectedCampaign.startDate}</span>
                </div>
                <div>
                  <span className="text-xs uppercase text-slate-500 font-bold block">Latest Telemetry</span>
                  <span className="text-xs font-bold text-emerald-700">{selectedCampaign.lastActivity}</span>
                </div>
                <div>
                  <span className="text-xs uppercase text-slate-500 font-bold block">Tracked IOCs</span>
                  <span className="text-sm font-bold text-red-600">{selectedCampaign.iocCount} indicators</span>
                </div>
              </div>

              {/* Threat Summary */}
              <div>
                <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[11px] mb-1.5">
                  Strategic Threat Assessment
                </h4>
                <p className="text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-sans text-xs">
                  {selectedCampaign.summary}
                </p>
              </div>

              {/* Primary Attack Vector & Tradecraft */}
              <div>
                <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[11px] mb-1.5">
                  Primary Delivery & Exploitation Mechanics
                </h4>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-indigo-700 font-semibold text-[11px]">
                  {selectedCampaign.attackVector}
                </div>
              </div>

              {/* MITRE ATT&CK Tactics */}
              <div>
                <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[11px] mb-1.5">
                  Observed MITRE ATT&CK Tactics
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCampaign.mitreTactics.map((tactic, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-[11px] font-bold shadow-2xs"
                    >
                      {tactic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Targeted Sectors & Geographies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs uppercase text-slate-500 font-bold block mb-1">
                    Targeted Industry Sectors
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedCampaign.targetedSectors.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs uppercase text-slate-500 font-bold block mb-1">
                    Targeted Countries & Territories
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedCampaign.targetedCountries.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedCampaign(null);
                  onNavigateTab('actors');
                }}
                className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5 font-mono text-xs"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Pivot to Threat Actor Dossier</span>
              </button>

              <button
                onClick={() => setSelectedCampaign(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors cursor-pointer text-xs font-mono"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EXECUTIVE CTI BRIEFING MODAL */}
      {/* ========================================================================= */}
      {briefingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-700 text-white flex items-center justify-center shadow-md shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Aegis Executive Intelligence Briefing
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    AI-Synthesized Strategic Intelligence for CISOs & SOC Leadership
                  </p>
                </div>
              </div>

              <button
                onClick={() => setBriefingModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs font-mono">
              {isGeneratingBriefing ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
                  <Sparkles className="w-8 h-8 text-red-600 animate-spin" />
                  <p className="font-bold text-slate-900 text-sm">
                    Synthesizing Strategic CTI Telemetry & Adversary Dossiers...
                  </p>
                  <p className="text-xs text-slate-500 max-w-md font-mono">
                    Correlating nation-state campaign logs, zero-day weaponization trends, and cross-sector impact forecasts via Gemini.
                  </p>
                </div>
              ) : briefing ? (
                <div className="space-y-5">
                  {/* Title & Posture Banner */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-mono uppercase text-slate-500 font-bold block">
                        Briefing Subject
                      </span>
                      <h4 className="text-base font-bold text-slate-900">{briefing.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded bg-red-50 text-red-700 font-mono font-bold text-xs border border-red-200">
                        {briefing.defconLevel}
                      </span>
                      <span className="px-2.5 py-1 rounded bg-purple-50 text-purple-700 font-mono font-bold text-xs border border-purple-200">
                        {briefing.threatPosture}
                      </span>
                    </div>
                  </div>

                  {/* Executive Summary */}
                  <div>
                    <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[11px] mb-1.5">
                      Executive Summary
                    </h4>
                    <p className="text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-sans text-xs">
                      {briefing.executiveSummary}
                    </p>
                  </div>

                  {/* Strategic Threat Trends */}
                  <div>
                    <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-2 font-mono">
                      Strategic Threat Landscape Trends
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {briefing.strategicThreatTrends.map((trend, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 hover:border-red-300 transition-colors">
                          <div className="flex items-center justify-between">
                            <h5 className="font-bold text-slate-900 text-[11px] leading-tight">{trend.title}</h5>
                            <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                              trend.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              {trend.severity}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[10px] leading-relaxed font-sans">{trend.description}</p>
                          <div className="text-[9px] text-indigo-600 font-bold pt-1 border-t border-slate-50">Impact: {trend.impact}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Targeted Sector Impacts */}
                  <div>
                    <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-2 font-mono">
                      Targeted Sector Exposure Breakdown
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {briefing.targetedSectorImpacts.map((sec, idx) => (
                        <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-[11px] uppercase tracking-tight">{sec.sector}</span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold border ${
                                sec.riskLevel === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                {sec.riskLevel}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 font-mono font-bold uppercase tracking-tighter">Dominant Adversary:</span>
                              <span className="font-bold text-slate-900">{sec.dominantActor}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 font-mono font-bold uppercase tracking-tighter">Primary Vector:</span>
                              <span className="font-mono text-indigo-600 font-bold">{sec.primaryVector}</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 font-sans italic leading-snug">
                            <span className="font-bold text-indigo-600 font-mono not-italic uppercase tracking-tighter mr-1">Directive:</span> {sec.defensiveAdvice}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Campaign Spotlight */}
                  {briefing.activeCampaignSpotlight && (
                    <div>
                      <h4 className="font-bold text-red-700 uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-red-600" />
                        <span>Campaign Spotlight: {briefing.activeCampaignSpotlight.campaignName}</span>
                      </h4>
                      <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-slate-800 space-y-1.5">
                        <p className="text-xs">
                          <span className="font-bold text-slate-900">Actor:</span> {briefing.activeCampaignSpotlight.adversary} | <span className="font-bold text-slate-900">Vector:</span> {briefing.activeCampaignSpotlight.vector}
                        </p>
                        <p className="text-xs text-slate-700 leading-relaxed font-sans">
                          <span className="font-bold text-slate-900">Adversary Objective:</span> {briefing.activeCampaignSpotlight.objective}
                        </p>
                        <p className="text-xs text-red-700 font-medium font-sans">
                          <span className="font-bold font-mono">Containment Guidance:</span> {briefing.activeCampaignSpotlight.containmentGuidance}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tactical Priorities */}
                  <div>
                    <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[11px] mb-1.5">
                      Prioritized SOC & CTI Defensive Directives
                    </h4>
                    <div className="space-y-1.5">
                      {briefing.tacticalPriorities.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="text-slate-800 font-medium font-sans">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={handleGenerateBriefing}
                disabled={isGeneratingBriefing}
                className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors font-mono shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingBriefing ? 'animate-spin' : ''}`} />
                <span>Regenerate Briefing</span>
              </button>

              <button
                onClick={() => setBriefingModalOpen(false)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer font-mono"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
