import React, { useState } from 'react';
import {
  ShieldAlert,
  Activity,
  Search,
  Users,
  Grid,
  Bug,
  Brain,
  Terminal,
  Bot,
  Radio,
  FileDown,
  Rss,
  Zap,
  RotateCw,
  Clock,
  Table,
  BarChart3,
  Compass,
  Flame,
  Globe,
  Globe2,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Sparkles,
  Lock,
  Cpu,
  ArrowUpRight,
  Power
} from 'lucide-react';
import { TelemetryMetrics, AutoRefreshInterval } from '../types';

export type ActiveTab =
  | 'world-map'
  | 'cti-dashboard'
  | 'overview'
  | 'vuln-assessment'
  | 'feeds'
  | 'anomalies'
  | 'iocs'
  | 'actors'
  | 'mitre'
  | 'cve'
  | 'ai-analyst'
  | 'rules';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  telemetry: TelemetryMetrics;
  onOpenCopilot: () => void;
  onExportSTIX: () => void;
  onOpenExitModal?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  autoRefreshInterval: AutoRefreshInterval;
  setAutoRefreshInterval: (interval: AutoRefreshInterval) => void;
  secondsRemaining: number;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  isPlainView: boolean;
  setIsPlainView: (plain: boolean) => void;
  isCopilotOpen: boolean;
  feedCount: number;
  anomalyCount: number;
  campaignCount?: number;
  vulnCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  telemetry,
  onOpenCopilot,
  onExportSTIX,
  onOpenExitModal,
  searchQuery,
  setSearchQuery,
  autoRefreshInterval,
  setAutoRefreshInterval,
  secondsRemaining,
  onManualRefresh,
  isRefreshing,
  isPlainView,
  setIsPlainView,
  isCopilotOpen,
  feedCount,
  anomalyCount,
  campaignCount = 6,
  vulnCount = 7
}) => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('24h');

  const tabs = [
    {
      id: 'world-map' as ActiveTab,
      label: 'World Vector Map',
      subtitle: 'Active Campaigns & Victims',
      icon: Globe2,
      badge: 'Live',
      alert: true
    },
    {
      id: 'cti-dashboard' as ActiveTab,
      label: 'CTI Dashboard',
      subtitle: 'Executive Intel & Campaigns',
      icon: Compass,
      badge: `${campaignCount} Ops`
    },
    {
      id: 'overview' as ActiveTab,
      label: 'SOC Telemetry',
      subtitle: 'Frontline Sensor Triage',
      icon: Activity
    },
    {
      id: 'vuln-assessment' as ActiveTab,
      label: 'Exposure & RBVM',
      subtitle: 'Continuous Threat Management',
      icon: ShieldAlert,
      badge: `${vulnCount} Crit`,
      alert: true
    },
    {
      id: 'feeds' as ActiveTab,
      label: 'National Feeds & MISP',
      subtitle: 'CISA & ISAC Intelligence',
      icon: Rss,
      badge: `${feedCount}`
    },
    {
      id: 'anomalies' as ActiveTab,
      label: 'Anomaly Engine',
      subtitle: 'ML Behavioral Hunter',
      icon: Zap,
      badge: `${anomalyCount}`,
      alert: true
    },
    {
      id: 'iocs' as ActiveTab,
      label: 'Threat Graph & IOCs',
      subtitle: 'Verdicts & Detonation',
      icon: Search,
      badge: `${telemetry.trackedIocsCount.toLocaleString()}`
    },
    {
      id: 'actors' as ActiveTab,
      label: 'Adversary Dossiers',
      subtitle: 'UNCs & Nation-States',
      icon: Users,
      badge: `${telemetry.monitoredActorsCount}`
    },
    {
      id: 'mitre' as ActiveTab,
      label: 'MITRE ATT&CK',
      subtitle: 'Enterprise Matrix Navigator',
      icon: Grid
    },
    {
      id: 'cve' as ActiveTab,
      label: '0-Day / CVE Radar',
      subtitle: 'Weaponized Exploits',
      icon: Bug,
      badge: `${telemetry.weaponizedCvesCount}`
    },
    {
      id: 'ai-analyst' as ActiveTab,
      label: 'Aegis AI Analyst',
      subtitle: 'Agentic DFIR & Triage',
      icon: Brain,
      isSpecial: true
    },
    {
      id: 'rules' as ActiveTab,
      label: 'YARA-L & Sigma',
      subtitle: 'Detection Engineering',
      icon: Terminal
    }
  ];

  return (
    <header className="bg-slate-50 border-b border-slate-200 text-slate-900 sticky top-0 z-40 shadow-xs backdrop-blur-md">
      {/* 1. Top Level Box: Unified Aegis Branding & Global Status */}
      <div className="bg-slate-900 text-slate-100 px-3 py-1 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-2 shadow-md" id="top-level-box">
        {/* Brand & Suite Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-md border border-red-500/40 shrink-0">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-white font-sans flex items-center">
                AEGIS
                <span className="ml-1.5 text-[9px] font-mono font-bold px-1 py-0.1 rounded bg-red-950 text-red-400 border border-red-800 tracking-normal uppercase">
                  Global CYBER THREAT INTELLIGENCE Matrix
                </span>
              </span>
              <p className="text-[9px] text-slate-400 font-mono leading-none">
                Enterprise Command & Control: Real-time Adversary Tracking, Geopolitical Attribution & Offensive Capability Mapping
              </p>
            </div>
          </div>
        </div>

        {/* DEFCON, Active Adversaries & Sensor Ingestion */}
        <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-mono text-slate-300">
          <div className="flex items-center gap-1 bg-red-950/80 text-red-400 px-1.5 py-0.5 rounded border border-red-900 font-bold text-[10px] tracking-wider">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
            </span>
            DEFCON 2
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-[10px] flex items-center gap-1">
            <Flame className="w-3 h-3 text-red-500" />
            <span className="text-slate-200 font-bold">UNC3886, APT41, APT29</span>
          </span>
          <span className="text-slate-700 hidden lg:inline">|</span>
          <span className="text-[10px] hidden lg:flex items-center gap-1">
            <Cpu className="w-3 h-3 text-indigo-400" />
            <span className="text-indigo-300 font-bold">2.41M EPS</span>
          </span>
        </div>
      </div>

      {/* 2. Main Aegis Control Bar (Search, Refresh, Sync, Actions, etc.) */}
      <div className="px-3 py-0.5 flex flex-wrap items-center justify-between gap-2 bg-white border-b border-slate-200">
        {/* Global Omnibar Search */}
        <div className="flex-1 max-w-sm relative">
          <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search: IP, SHA256, Domain, UNC3886..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 py-1 text-[11px] text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-red-500 transition-all font-mono"
          />
        </div>

        {/* Right Action Suite */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 text-[10px] font-mono shadow-2xs">
            {(['24h', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-1 py-0.5 rounded uppercase font-bold transition-colors cursor-pointer ${
                  timeRange === r
                    ? 'bg-red-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Auto Refresh */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5 shadow-2xs">
            <Clock className="w-2.5 h-2.5 text-slate-500" />
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value) as AutoRefreshInterval)}
              className="bg-transparent font-bold text-slate-700 text-[10px] focus:outline-none cursor-pointer"
            >
              <option value={0}>Manual</option>
              <option value={5}>5s Live</option>
              <option value={10}>10s Sync</option>
              <option value={30}>30s</option>
              <option value={60}>60s Sync</option>
            </select>
            {autoRefreshInterval > 0 && (
              <span className="text-emerald-700 font-bold ml-0.5 bg-emerald-50 border border-emerald-200 px-1 rounded text-[9px]">
                {secondsRemaining}s
              </span>
            )}
          </div>

          {/* Sync Button */}
          <button
            onClick={onManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCw className={`w-2.5 h-2.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <span className="h-3.5 w-px bg-slate-200" />

          {/* Visual Table Toggle */}
          <button
            onClick={() => setIsPlainView(!isPlainView)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-semibold transition-colors cursor-pointer ${
              isPlainView ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {isPlainView ? <BarChart3 className="w-2.5 h-2.5" /> : <Table className="w-2.5 h-2.5 text-slate-500" />}
            <span>{isPlainView ? 'Visual' : 'Table'}</span>
          </button>

          {/* STIX Export */}
          <button
            onClick={onExportSTIX}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <FileDown className="w-2.5 h-2.5 text-indigo-600" />
            <span>STIX</span>
          </button>

          {/* AI Copilot */}
          <button
            onClick={onOpenCopilot}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold shadow-xs transition-all cursor-pointer border ${
              isCopilotOpen 
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-red-600 hover:bg-red-500 text-white border-red-500/40'
            }`}
          >
            <Bot className="w-3 h-3" />
            <span>AI Copilot</span>
          </button>
        </div>
      </div>

      {/* Navigation Suite Rail */}
      <nav className="px-1.5 flex items-center gap-1 overflow-x-auto border-t border-slate-200 scrollbar-none py-1 bg-slate-50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-[0.4rem] py-[0.22rem] rounded-lg text-[10.5px] whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? (tab as any).isSpecial
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold border-purple-600 shadow-sm'
                    : 'bg-red-600 text-white font-bold border-red-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200 shadow-2xs'
              }`}
            >
              <Icon
                className={`w-2.5 h-2.5 ${
                  isActive
                    ? 'text-white'
                    : tab.alert
                    ? 'text-amber-600'
                    : 'text-slate-500'
                }`}
              />
              <div className="text-left">
                <div className="leading-none">{tab.label}</div>
              </div>
              {tab.badge && (
                <span
                  className={`px-1 py-0.2 rounded-md text-[9px] font-mono ${
                    isActive
                      ? 'bg-slate-50/25 text-white font-bold'
                      : tab.alert
                      ? 'bg-amber-100 text-amber-800 font-bold border border-amber-200'
                      : 'bg-slate-100 text-slate-600 font-medium'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
