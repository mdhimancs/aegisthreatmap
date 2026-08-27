import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Radio,
  Zap,
  Globe2,
  TrendingUp,
  AlertTriangle,
  Flame,
  Bug,
  Server,
  ArrowRight,
  ExternalLink,
  Lock,
  Rss,
  Table,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  Target,
  Users,
  Compass,
  FileText,
  LayoutGrid,
  Columns3,
  ArrowUpDown,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  TelemetryMetrics,
  IOC,
  ThreatActor,
  ThreatCampaign,
  VulnerabilityCVE,
  ThreatFeedItem,
  BehavioralAnomaly
} from '../types';
import {
  ColumnConfig,
  ColumnRearranger,
  SectionTableConfig,
  TableSectionsRearranger
} from './TableRearranger';

interface OverviewDashboardProps {
  telemetry: TelemetryMetrics;
  recentIOCs: IOC[];
  actors: ThreatActor[];
  campaigns: ThreatCampaign[];
  cves: VulnerabilityCVE[];
  feeds: ThreatFeedItem[];
  anomalies: BehavioralAnomaly[];
  isPlainView: boolean;
  onSelectIOC: (ioc: IOC) => void;
  onSelectActor: (actor: ThreatActor) => void;
  onSelectCVE: (cve: VulnerabilityCVE) => void;
  onNavigateTab: (tab: any) => void;
}

const DEFAULT_DASHBOARD_SECTIONS: SectionTableConfig[] = [
  {
    id: 'velocity_chart',
    label: 'Global Telemetry: Incursion Velocity & Attack Trajectory',
    visible: true,
    description: 'Real-time telemetry chart of attack volumes and credential replays',
    badge: 'Chart & Metrics'
  },
  {
    id: 'campaigns_table',
    label: 'Frontline Active Campaigns & Attribution Table',
    visible: true,
    description: 'Active adversary campaigns, target sectors, and IOC counts',
    badge: 'Campaigns'
  },
  {
    id: 'ioc_table',
    label: 'High-Fidelity IOC Telemetry Table',
    visible: true,
    description: 'Real-time C2 IPs, domains, hashes, and threat scores',
    badge: 'IOCs'
  },
  {
    id: 'actors_table',
    label: 'Tracked Threat Actors & UNC Clusters Table',
    visible: true,
    description: 'Sovereign intelligence organs and ransomware cartels',
    badge: 'Adversaries'
  },
  {
    id: 'cve_table',
    label: 'Weaponized 0-Day & CISA KEV Radar Table',
    visible: true,
    description: 'Active CVEs exploited in the wild with EPSS scores',
    badge: 'CVE Radar'
  },
  {
    id: 'feeds_table',
    label: 'Ingested Threat Intelligence Feeds Stream',
    visible: true,
    description: 'Live advisories from CISA, AlienVault, and TAXII collections',
    badge: 'Feeds'
  }
];

const DEFAULT_TRIAGE_COLUMNS: ColumnConfig[] = [
  { id: 'type', label: 'Type', visible: true },
  { id: 'title', label: 'Identifier / Title', visible: true, fixed: true },
  { id: 'severity', label: 'Severity / Risk', visible: true },
  { id: 'context', label: 'Context / Attribution', visible: true },
  { id: 'timestamp', label: 'Timestamp / Score', visible: true },
  { id: 'action', label: 'Action', visible: true }
];

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  telemetry,
  recentIOCs = [],
  actors = [],
  campaigns = [],
  cves = [],
  feeds = [],
  anomalies = [],
  isPlainView = false,
  onSelectIOC,
  onSelectActor,
  onSelectCVE,
  onNavigateTab
}) => {
  const [plainFilter, setPlainFilter] = useState<'all' | 'iocs' | 'feeds' | 'anomalies' | 'cves'>('all');

  // Table Rearranging State
  const [sections, setSections] = useState<SectionTableConfig[]>(() => {
    const saved = localStorage.getItem('aegis_overview_sections');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_DASHBOARD_SECTIONS;
  });
  const [isSectionsModalOpen, setIsSectionsModalOpen] = useState(false);

  // Triage Table Columns Rearranging State (Default Compact for tightly packed display)
  const [triageColumns, setTriageColumns] = useState<ColumnConfig[]>(DEFAULT_TRIAGE_COLUMNS);
  const [isTriageColumnModalOpen, setIsTriageColumnModalOpen] = useState(false);
  const [triageDensity, setTriageDensity] = useState<'compact' | 'standard' | 'spacious'>('compact');

  // SOC Telemetry Time Range
  const [telemetryTimeRange, setTelemetryTimeRange] = useState<'1h' | '6h' | '12h' | '24h' | '1mo'>('24h');

  // Sorting for Triage Table
  const [triageSortCol, setTriageSortCol] = useState<string>('timestamp');
  const [triageSortDir, setTriageSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSectionsChange = (newSections: SectionTableConfig[]) => {
    setSections(newSections);
    localStorage.setItem('aegis_overview_sections', JSON.stringify(newSections));
  };

  const handleResetSections = () => {
    setSections(DEFAULT_DASHBOARD_SECTIONS);
    localStorage.removeItem('aegis_overview_sections');
  };

  const handleTriageSort = (colId: string) => {
    if (triageSortCol === colId) {
      setTriageSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setTriageSortCol(colId);
      setTriageSortDir('desc');
    }
  };

  // Simulated Telemetry Data based on Time Range
  const getTelemetryData = () => {
    let basePoints = 6;
    let multiplier = 1;
    let label = 'hour';

    switch (telemetryTimeRange) {
      case '1h': basePoints = 12; multiplier = 0.4; label = 'min'; break;
      case '6h': basePoints = 6; multiplier = 0.8; label = 'hour'; break;
      case '12h': basePoints = 12; multiplier = 0.9; label = 'hour'; break;
      case '24h': basePoints = 6; multiplier = 1; label = 'hour'; break;
      case '1mo': basePoints = 30; multiplier = 25; label = 'day'; break;
    }

    return Array.from({ length: basePoints }).map((_, idx) => {
      const step = telemetryTimeRange === '1h' ? 5 : telemetryTimeRange === '1mo' ? 1 : 4;
      const timeLabel = telemetryTimeRange === '1mo' ? `Day ${idx + 1}` : `${idx * step}:00`;
      
      // Use index to create a pseudo-random but somewhat consistent pattern
      const vectorIndex = idx % telemetry.attackVectorBreakdown.length;
      const percentage = telemetry.attackVectorBreakdown[vectorIndex].percentage;

      return {
        time: timeLabel,
        volume: Math.round(percentage * 142 * multiplier * (0.8 + Math.random() * 0.4)),
        malware: Math.round(percentage * 86 * multiplier * (0.7 + Math.random() * 0.6))
      };
    });
  };

  // Compile combined triage items with robust fallbacks
  const combinedTriageItems = [
    ...(anomalies || []).map((a) => {
      const timeStr = a.detectedAt
        ? new Date(a.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : (a as any).timestamp || 'Just now';
      return {
        id: a.id,
        category: 'anomalies',
        typeLabel: 'Anomaly',
        title: a.title || 'Behavioral Anomaly',
        severity: a.severity || 'medium',
        context: `${a.affectedEntity || (a as any).affectedAsset || 'Asset'} (${a.category || (a as any).sourceType || 'Deviation'})`,
        timestamp: timeStr,
        raw: a,
        onAction: () => onNavigateTab('anomaly')
      };
    }),
    ...(feeds || []).map((f) => {
      let timeStr = 'Recent';
      try {
        if (f.timestamp) {
          timeStr = new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } catch {
        timeStr = f.timestamp || 'Recent';
      }
      return {
        id: f.id,
        category: 'feeds',
        typeLabel: 'Feed Intel',
        title: f.title || f.indicator || 'Threat Intel Feed',
        severity: f.severity || 'medium',
        context: `${f.provider || 'Feed'} | ${f.indicator || 'N/A'}`,
        timestamp: timeStr,
        raw: f,
        onAction: () => onNavigateTab('feeds')
      };
    }),
    ...(recentIOCs || []).map((ioc) => ({
      id: ioc.id,
      category: 'iocs',
      typeLabel: `IOC (${ioc.type || 'Indicator'})`,
      title: ioc.value || 'Unknown IOC',
      severity: ioc.severity || 'medium',
      context: ioc.threatActor || ioc.malwareFamily || 'Under Investigation',
      timestamp: `Risk: ${ioc.riskScore ?? 0}/100`,
      raw: ioc,
      onAction: () => onSelectIOC(ioc)
    })),
    ...(cves || []).map((c) => ({
      id: c.cveId,
      category: 'cves',
      typeLabel: 'CVE',
      title: `${c.cveId || 'CVE'}: ${c.title || 'Vulnerability'}`,
      severity: (c.cvssScore ?? 0) >= 9.0 ? 'critical' : (c.cvssScore ?? 0) >= 7.0 ? 'high' : 'medium',
      context: c.affectedProducts?.join(', ') || 'Enterprise Infrastructure',
      timestamp: `CVSS ${c.cvssScore ?? 0} / EPSS ${((c.epssScore ?? 0) * 100).toFixed(0)}%`,
      raw: c,
      onAction: () => onSelectCVE(c)
    }))
  ];

  const filteredTriageItems = combinedTriageItems
    .filter((item) => plainFilter === 'all' || item.category === plainFilter)
    .sort((a, b) => {
      let cmp = 0;
      if (triageSortCol === 'title') {
        cmp = (a.title || '').localeCompare(b.title || '');
      } else if (triageSortCol === 'type') {
        cmp = (a.typeLabel || '').localeCompare(b.typeLabel || '');
      } else if (triageSortCol === 'severity') {
        const sevRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
        cmp = (sevRank[a.severity] || 0) - (sevRank[b.severity] || 0);
      } else {
        cmp = (a.timestamp || '').localeCompare(b.timestamp || '');
      }
      return triageSortDir === 'asc' ? cmp : -cmp;
    });

  const getSeverityBadge = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const triagePadding =
    triageDensity === 'compact' ? 'py-1 px-2 text-xs' : triageDensity === 'spacious' ? 'py-3 px-4' : 'py-2 px-3 text-xs';

  return (
    <div className="space-y-4 text-slate-900 font-sans">
      {/* Aegis Threat Posture KPI Cards - Reconfigured to 3 Partitions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Partition 1: Threat Posture (4/12) */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: Global Threat Level */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-3 relative overflow-hidden shadow-xs group hover:border-red-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono font-bold uppercase tracking-widest">
              <span>Threat Posture</span>
              <Radio className="w-3 h-3 text-red-600 animate-pulse" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-red-600 font-mono tracking-tight">
                {telemetry.globalThreatLevel}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-100 border border-red-800 font-bold font-mono shadow-sm">
                DEFCON 2
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[9px] text-slate-500 flex items-center gap-1 font-mono">
                <span className="text-red-600 font-bold">+18% Velocity</span>
              </p>
              <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-1 rounded">94.2% CONFIDENCE</span>
            </div>
          </div>

          {/* Card 2: Active Alerts */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-3 relative overflow-hidden shadow-xs group hover:border-amber-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono font-bold uppercase tracking-widest">
              <span>Tactical Queue</span>
              <AlertTriangle className="w-3 h-3 text-amber-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-amber-700 font-mono">
                {telemetry.activeAlertsCount}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">ACTIVE TRIAGE</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[9px] text-slate-500 flex items-center gap-1 font-mono">
                <span className="text-amber-700 font-semibold">{anomalies.length}</span> Behavioral
              </p>
              <span className="text-[9px] font-mono font-bold text-amber-600/80">HIGH FIDELITY</span>
            </div>
          </div>
        </div>

        {/* Partition 2: System Sync & Health (4/12) - THE MIDDLE PARTITION */}
        <div className="lg:col-span-4 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-3 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
            <span>Intel Sync & Control Plane</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          </div>
          
          <div className="grid grid-cols-3 gap-2 flex-1">
            <div className="flex flex-col items-center justify-center bg-slate-50/50 border border-slate-200/60 rounded-xl p-2 group hover:bg-white transition-colors">
              <span className="text-[8px] font-mono font-bold text-slate-400 uppercase mb-1">Operational</span>
              <span className="text-lg font-black text-slate-900 font-mono leading-none">142<span className="text-[10px] text-slate-400 font-normal">D</span></span>
              <div className="w-full bg-slate-200 h-1 mt-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[85%] shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center bg-slate-50/50 border border-slate-200/60 rounded-xl p-2 group hover:bg-white transition-colors">
              <span className="text-[8px] font-mono font-bold text-slate-400 uppercase mb-1">STIX/TAXII</span>
              <div className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-600 animate-spin-slow" />
                <span className="text-xs font-black text-slate-900 font-mono">LIVE</span>
              </div>
              <span className="text-[8px] font-mono text-emerald-600 font-bold mt-1">LATENCY: 12ms</span>
            </div>

            <div className="flex flex-col items-center justify-center bg-slate-50/50 border border-slate-200/60 rounded-xl p-2 group hover:bg-white transition-colors">
              <span className="text-[8px] font-mono font-bold text-slate-400 uppercase mb-1">AI Triage</span>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-600" />
                <span className="text-xs font-black text-slate-900 font-mono">SYNC</span>
              </div>
              <span className="text-[8px] font-mono text-slate-500 font-bold mt-1">ENGINE: v3.6</span>
            </div>
          </div>
          
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white" />
                <div className="w-3 h-3 rounded-full bg-indigo-500 border border-white" />
                <div className="w-3 h-3 rounded-full bg-amber-500 border border-white" />
              </div>
              <span className="text-[8px] font-mono text-slate-400">99.998% Resilience</span>
            </div>
            <span className="text-[8px] font-mono text-slate-400">PULSE: 0.2s</span>
          </div>
        </div>

        {/* Partition 3: Asset & Vulnerability (4/12) */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 3: Tracked IOCs */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-3 relative overflow-hidden shadow-xs group hover:border-indigo-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono font-bold uppercase tracking-widest">
              <span>High Conf IOCs</span>
              <Server className="w-3 h-3 text-indigo-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-900 font-mono">
                {telemetry.trackedIocsCount.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-400 font-mono uppercase">Atomic</span>
            </div>
            <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-3/4" />
            </div>
          </div>

          {/* Card 4: Monitored Threat Actors */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-3 relative overflow-hidden shadow-xs group hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono font-bold uppercase tracking-widest">
              <span>APT Dossiers</span>
              <Users className="w-3 h-3 text-purple-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-900 font-mono">
                {telemetry.monitoredActorsCount}
              </span>
              <span className="text-[9px] text-slate-400 font-mono uppercase">UNCs</span>
            </div>
            <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-1/2" />
            </div>
          </div>

          {/* Card 5: Weaponized CVEs */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-3 relative overflow-hidden shadow-xs group hover:border-rose-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono font-bold uppercase tracking-widest">
              <span>KEV Radar</span>
              <Bug className="w-3 h-3 text-rose-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-900 font-mono">
                {telemetry.weaponizedCvesCount}
              </span>
              <span className="text-[9px] text-slate-400 font-mono uppercase">Active</span>
            </div>
            <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 w-2/3" />
            </div>
          </div>
        </div>
      </div>

      {/* Table Customization & Rearrange Action Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-600">
          <span className="font-bold text-slate-900">Dashboard Layout Manager:</span>
          <span>{sections.filter((s) => s.visible).length} of {sections.length} tables & modules visible</span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          <button
            onClick={() => setIsSectionsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <LayoutGrid className="w-3 h-3" />
            <span>Rearrange Tables & Modules</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: SIMPLE PLAIN VIEW (TABULAR SPREADSHEET / DENSE LIST) */}
      {/* ========================================================================= */}
      {isPlainView ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl shadow-xs p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Table className="w-3.5 h-3.5 text-indigo-600" />
                <span>Aegis High-Density Plain Telemetry Triage Grid</span>
              </h2>
            </div>

            {/* Filter Pills & Column Rearrange */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <button
                onClick={() => setPlainFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  plainFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                All Records ({combinedTriageItems.length})
              </button>
              <button
                onClick={() => setPlainFilter('anomalies')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  plainFilter === 'anomalies'
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                Anomalies ({anomalies.length})
              </button>
              <button
                onClick={() => setPlainFilter('feeds')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  plainFilter === 'feeds'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                Feeds ({feeds.length})
              </button>
              <button
                onClick={() => setPlainFilter('iocs')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  plainFilter === 'iocs'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                IOCs ({recentIOCs.length})
              </button>
              <button
                onClick={() => setPlainFilter('cves')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  plainFilter === 'cves'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                CVEs ({cves.length})
              </button>

              <button
                onClick={() => setIsTriageColumnModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold flex items-center gap-1 cursor-pointer ml-1"
                title="Rearrange columns in triage grid"
              >
                <Columns3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Columns</span>
              </button>
            </div>
          </div>

          {/* Unified Plain Table with Dynamic Columns & Sorting */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-[11px] uppercase select-none">
                  {triageColumns
                    .filter((c) => c.visible)
                    .map((col) => {
                      const isSorted = triageSortCol === col.id;
                      return (
                        <th
                          key={col.id}
                          onClick={() => handleTriageSort(col.id)}
                          className={`${triagePadding} font-bold hover:text-slate-900 cursor-pointer transition-colors ${
                            col.id === 'action' ? 'text-right' : ''
                          }`}
                        >
                          <div className={`flex items-center gap-1 ${col.id === 'action' ? 'justify-end' : ''}`}>
                            <span>{col.label}</span>
                            {isSorted ? (
                              triageSortDir === 'asc' ? (
                                <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40" />
                            )}
                          </div>
                        </th>
                      );
                    })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTriageItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {triageColumns
                      .filter((c) => c.visible)
                      .map((col) => {
                        if (col.id === 'type') {
                          return (
                            <td key={col.id} className={triagePadding}>
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs font-bold uppercase ${
                                  item.category === 'anomalies'
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : item.category === 'feeds'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : item.category === 'iocs'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {item.typeLabel}
                              </span>
                            </td>
                          );
                        }
                        if (col.id === 'title') {
                          return (
                            <td key={col.id} className={`${triagePadding} font-semibold text-slate-900 truncate max-w-sm`}>
                              {item.title}
                            </td>
                          );
                        }
                        if (col.id === 'severity') {
                          return (
                            <td key={col.id} className={triagePadding}>
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold uppercase border ${getSeverityBadge(
                                  item.severity
                                )}`}
                              >
                                {item.severity}
                              </span>
                            </td>
                          );
                        }
                        if (col.id === 'context') {
                          return (
                            <td key={col.id} className={`${triagePadding} text-slate-600 truncate max-w-xs`}>
                              {item.context}
                            </td>
                          );
                        }
                        if (col.id === 'timestamp') {
                          return (
                            <td key={col.id} className={`${triagePadding} text-slate-500 font-mono`}>
                              {item.timestamp}
                            </td>
                          );
                        }
                        if (col.id === 'action') {
                          return (
                            <td key={col.id} className={`${triagePadding} text-right`}>
                              <button
                                onClick={item.onAction}
                                className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                              >
                                Investigate
                              </button>
                            </td>
                          );
                        }
                        return null;
                      })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE 2: AEGIS ADVANTAGE DYNAMIC REARRANGEABLE MODULAR DASHBOARD */
        /* ========================================================================= */
        <div className="space-y-4">
          {sections
            .filter((s) => s.visible && s.id === 'velocity_chart')
            .map((section) => {
              // Section 1: Incursion Velocity Area Chart
              if (section.id === 'velocity_chart') {
                return (
                  <div
                    key={section.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div>
                        <h3 className="text-[10px] font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Telemetry: Global Incursion Velocity Matrix</span>
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 mr-2">
                          {(['1h', '6h', '12h', '24h', '1mo'] as const).map((range) => (
                            <button
                              key={range}
                              onClick={() => setTelemetryTimeRange(range)}
                              className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono transition-all cursor-pointer ${
                                telemetryTimeRange === range
                                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              {range.toUpperCase()}
                            </button>
                          ))}
                        </div>
                        <span className="text-[9px] font-mono bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-bold border border-red-200">
                          REAL-TIME
                        </span>
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={getTelemetryData()}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorVolLight" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="colorMalLight" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis dataKey="time" stroke="#64748B" fontSize={11} fontFamily="monospace" />
                          <YAxis stroke="#64748B" fontSize={11} fontFamily="monospace" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#FFFFFF',
                              borderColor: '#CBD5E1',
                              borderRadius: '0.75rem',
                              fontSize: '12px',
                              color: '#0F172A',
                              fontFamily: 'monospace',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="volume"
                            stroke="#EF4444"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorVolLight)"
                            name="Perimeter Incursions"
                          />
                          <Area
                            type="monotone"
                            dataKey="malware"
                            stroke="#4F46E5"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorMalLight)"
                            name="Credential / Token Replays"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              }
              return null;
            })}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {sections
              .filter((s) => s.visible && s.id !== 'velocity_chart')
              .map((section) => {
                // Section 2: Active Frontline Campaigns
                if (section.id === 'campaigns_table') {
                return (
                  <div
                    key={section.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <Flame className="w-3.5 h-3.5 text-red-600" />
                          <span>Active Frontline Campaigns Operations Table</span>
                        </h3>
                      </div>
                      <button
                        onClick={() => onNavigateTab('cti')}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-mono font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        CTI Matrix ({campaigns.length}) <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(campaigns || []).slice(0, 3).map((camp) => (
                        <div
                          key={camp.id}
                          onClick={() => onNavigateTab('cti')}
                          className="bg-slate-50 hover:bg-slate-50 border border-slate-200 hover:border-red-500/50 p-2.5 rounded-xl transition-all cursor-pointer group shadow-2xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-bold text-slate-900 group-hover:text-red-600 transition-colors truncate">
                                {camp.title}
                              </span>
                              <span
                                className={`text-[9px] font-mono px-1 py-0.5 rounded font-bold uppercase shrink-0 border ${getSeverityBadge(
                                  camp.severity
                                )}`}
                              >
                                {camp.severity}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1.5 pt-1.5 border-t border-slate-200">
                            <span className="text-indigo-600 font-semibold">{camp.actorName}</span>
                            <span className="font-bold">{camp.iocCount} IOCs</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // Section 3: High Fidelity IOC Table
              if (section.id === 'ioc_table') {
                return (
                  <div
                    key={section.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <Server className="w-3.5 h-3.5 text-purple-600" />
                          <span>High-Fidelity IOC Telemetry Table</span>
                        </h3>
                      </div>
                      <button
                        onClick={() => onNavigateTab('ioc')}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-mono font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        IOC Engine ({recentIOCs.length}) <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {(recentIOCs || []).slice(0, 4).map((ioc) => (
                        <div
                          key={ioc.id}
                          onClick={() => onSelectIOC(ioc)}
                          className="bg-slate-50 hover:bg-slate-50 border border-slate-200 hover:border-purple-500/50 p-2.5 rounded-xl transition-all cursor-pointer font-mono shadow-2xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[9px] uppercase font-bold px-1 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                {ioc.type}
                              </span>
                              <span className="text-[9px] font-bold text-red-600">
                                S: {ioc.riskScore}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-900 truncate block">
                              {ioc.value}
                            </span>
                          </div>
                          <div className="mt-1.5 pt-1.5 border-t border-slate-200 flex justify-between text-[9px] text-slate-400">
                            <span>{ioc.category}</span>
                            <span className="text-indigo-600 font-bold">Dive &rarr;</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // Section 4: Threat Actors & UNCs Table
              if (section.id === 'actors_table') {
                return (
                  <div
                    key={section.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-amber-600" />
                          <span>Tracked Threat Actors & UNC Clusters Table</span>
                        </h3>
                      </div>
                      <button
                        onClick={() => onNavigateTab('actors')}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-mono font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        Dossiers ({actors.length}) <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {(actors || []).slice(0, 4).map((act) => (
                        <div
                          key={act.id}
                          onClick={() => onSelectActor(act)}
                          className="bg-slate-50 hover:bg-slate-50 border border-slate-200 hover:border-amber-500/50 p-2.5 rounded-xl transition-all cursor-pointer font-mono shadow-2xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-bold text-slate-900 truncate">{act.name}</span>
                              <span className="text-[9px] px-1 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {act.originCountry}
                              </span>
                            </div>
                          </div>
                          <div className="mt-1.5 pt-1.5 border-t border-slate-200 flex justify-between text-[9px] text-slate-600 font-bold">
                            <span className="text-purple-700">{act.sophistication.charAt(0)}</span>
                            <span className="text-emerald-700">{act.activeCampaigns?.length || 2} Ops</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // Section 5: Weaponized CVEs
              if (section.id === 'cve_table') {
                return (
                  <div
                    key={section.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <Bug className="w-3.5 h-3.5 text-rose-600" />
                          <span>Weaponized 0-Day & CISA KEV Exploitation Radar</span>
                        </h3>
                      </div>
                      <button
                        onClick={() => onNavigateTab('cve')}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-mono font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        Radar ({cves.length}) <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {(cves || []).slice(0, 4).map((cve) => (
                        <div
                          key={cve.cveId}
                          onClick={() => onSelectCVE(cve)}
                          className="bg-slate-50 hover:bg-slate-50 border border-slate-200 hover:border-rose-500/50 p-2.5 rounded-xl transition-all cursor-pointer font-mono shadow-2xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-bold text-indigo-700">{cve.cveId}</span>
                              <span className="text-[9px] px-1 py-0.5 bg-red-50 text-red-700 border border-red-200 font-bold rounded">
                                {cve.cvssScore.toFixed(1)}
                              </span>
                            </div>
                          </div>
                          <div className="mt-1.5 pt-1.5 border-t border-slate-200 flex justify-between text-[9px] text-slate-500">
                            <span className="text-amber-700 font-bold">E: {(cve.epssScore * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // Section 6: Threat Feeds Stream
              if (section.id === 'feeds_table') {
                return (
                  <div
                    key={section.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <Rss className="w-3.5 h-3.5 text-orange-600" />
                          <span>Ingested Threat Intelligence Feeds Stream</span>
                        </h3>
                      </div>
                      <button
                        onClick={() => onNavigateTab('feeds')}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-mono font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        Feeds ({feeds.length}) <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-1.5 font-mono text-[10px]">
                      {(feeds || []).slice(0, 3).map((f) => (
                        <div
                          key={f.id}
                          onClick={() => onNavigateTab('feeds')}
                          className="bg-slate-50 hover:bg-slate-50 border border-slate-200 p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors shadow-2xs"
                        >
                          <div className="truncate flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold">
                              {f.provider}
                            </span>
                            <span className="font-bold text-slate-900 truncate">{f.title}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-1 py-0.5 rounded font-bold uppercase border ${getSeverityBadge(
                                f.severity
                              )}`}
                            >
                              {f.severity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      )}

      {/* Sections / Tables Rearranger Modal */}
      <TableSectionsRearranger
        isOpen={isSectionsModalOpen}
        onClose={() => setIsSectionsModalOpen(false)}
        sections={sections}
        onChange={handleSectionsChange}
        onReset={handleResetSections}
        viewTitle="Aegis Overview Dashboard Modules"
      />

      {/* Triage Grid Column Rearranger Modal */}
      <ColumnRearranger
        isOpen={isTriageColumnModalOpen}
        onClose={() => setIsTriageColumnModalOpen(false)}
        columns={triageColumns}
        onChange={setTriageColumns}
        onReset={() => setTriageColumns(DEFAULT_TRIAGE_COLUMNS)}
        density={triageDensity}
        onChangeDensity={setTriageDensity}
        tableName="Plain Telemetry Triage Grid"
      />
    </div>
  );
};
