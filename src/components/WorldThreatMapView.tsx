import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Globe2,
  Radio,
  Flame,
  ShieldAlert,
  Target,
  Users,
  Compass,
  AlertTriangle,
  Zap,
  Layers,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Server,
  Lock,
  Eye,
  Play,
  Pause,
  Maximize2,
  RotateCcw,
  Copy,
  Check,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  Building2,
  Briefcase,
  Terminal,
  Wifi,
  FileDown,
  Crosshair,
  ShieldX,
  Sliders,
  Cable,
  ArrowUpDown,
  Brain,
  GitBranch,
  History
} from 'lucide-react';
import {
  WorldThreatNode,
  AttackTrajectory,
  ThreatCampaign,
  ThreatActor,
  IOC,
  SeverityLevel,
  SubseaCable
} from '../types';
import { SUBSEA_FIBER_CABLES } from '../data/mockThreatData';
import { motion, AnimatePresence } from 'motion/react';
import { RealisticLeafletThreatMap } from './map/RealisticLeafletThreatMap';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';

interface WorldThreatMapViewProps {
  nodes: WorldThreatNode[];
  trajectories: AttackTrajectory[];
  campaigns: ThreatCampaign[];
  actors: ThreatActor[];
  onSelectIOC?: (ioc: IOC) => void;
  onSelectActor?: (actor: ThreatActor) => void;
  onNavigateTab?: (tab: any) => void;
  onExportSTIX?: () => void;
}

const getNodeHourIndex = (nodeId: string): number => {
  let hash = 0;
  for (let i = 0; i < nodeId.length; i++) {
    hash = nodeId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash) % 20) + 3; // spreads nodes between Hour 3 and Hour 22
};

const MITRE_TECH_NAMES: Record<string, string> = {
  'T1190': 'Exploit Public-Facing Application',
  'T1059': 'Command & Scripting Interpreter',
  'T1566': 'Phishing',
  'T1203': 'Exploitation for Client Execution',
  'T1071': 'Application Layer Protocol',
  'T1210': 'Exploitation of Remote Services',
  'T1021': 'Remote Services',
  'T1595': 'Active Scanning',
  'T1505': 'Server Software Component',
  'T1583': 'Acquire Infrastructure',
  'T1584': 'Compromise Infrastructure',
  'T1547': 'Boot or Logon Autostart Execution',
  'T1133': 'External Remote Services',
  'T1078': 'Valid Accounts',
  'T1048': 'Exfiltration Over Alternative Protocol'
};

export const WorldThreatMapView: React.FC<WorldThreatMapViewProps> = ({
  nodes: initialNodes,
  trajectories,
  campaigns,
  actors,
  onSelectIOC,
  onSelectActor,
  onNavigateTab,
  onExportSTIX
}) => {
  // Nodes state allowing local containment / simulation updates
  const [nodes, setNodes] = useState<WorldThreatNode[]>(initialNodes);

  // New CTI features states
  const [playbackTime, setPlaybackTime] = useState<number>(24); // 0 to 24 hours (24 = Live/Now)
  const [isPlaybackPlaying, setIsPlaybackPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // interval duration in ms (1000ms = 1 hour step)

  const [dossierTab, setDossierTab] = useState<'intel' | 'stix' | 'signatures' | 'ai-brief' | 'strategic'>('intel');
  const [selectedStixNode, setSelectedStixNode] = useState<string>('actor');
  const [selectedSigFormat, setSelectedSigFormat] = useState<'yara' | 'sigma' | 'snort'>('yara');

  const [aiBriefingData, setAiBriefingData] = useState<any | null>(null);
  const [isAiBriefingLoading, setIsAiBriefingLoading] = useState<boolean>(false);
  const [aiBriefingError, setAiBriefingError] = useState<string | null>(null);

  // View Mode: 2D Realistic Carto / Satellite vs. 3D Holographic Globe
  const [selectedRegion, setSelectedRegion] = useState<'global' | 'americas' | 'emea' | 'apac' | 'fit'>('global');

  // Filters
  const [activeCampaignFilter, setActiveCampaignFilter] = useState<string>('all');
  const [activeSectorFilter, setActiveSectorFilter] = useState<string>('all');
  const [activeSeverityFilter, setActiveSeverityFilter] = useState<string>('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Node for Deep Forensic Dossier
  const [selectedNode, setSelectedNode] = useState<WorldThreatNode | null>(
    nodes.find((n) => n.id === 'victim-dc') || nodes[0]
  );

  // Layers & Live controls
  const [showArcs, setShowArcs] = useState(true);
  const [showOrigins, setShowOrigins] = useState(true);
  const [showVictims, setShowVictims] = useState(true);
  const [showCables, setShowCables] = useState(true);
  const [showTerminator, setShowTerminator] = useState(true);
  const [showRadarSweep, setShowRadarSweep] = useState(true);
  const [isLiveStreamActive, setIsLiveStreamActive] = useState(true);
  const [streamSpeed, setStreamSpeed] = useState<'fast' | 'medium' | 'slow' | 'paused'>('medium');

  const [isMapCollapsed, setIsMapCollapsed] = useState(false);
  const [isStreamCollapsed, setIsStreamCollapsed] = useState(false);
  const [isDossierCollapsed, setIsDossierCollapsed] = useState(false);

  const MOCK_FREQUENCY_DATA = useMemo(() => [
    { h: '00', v: 45 }, { h: '02', v: 52 }, { h: '04', v: 38 }, { h: '06', v: 65 },
    { h: '08', v: 88 }, { h: '10', v: 72 }, { h: '12', v: 95 }, { h: '14', v: 110 },
    { h: '16', v: 82 }, { h: '18', v: 94 }, { h: '20', v: 105 }, { h: '22', v: 88 },
    { h: '24', v: 120 }
  ], []);

  // Sorting for CTI Table
  const [sortField, setSortField] = useState<string>('severity');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Live incursion terminal stream state
  const [terminalPackets, setTerminalPackets] = useState<{
    id: string;
    timestamp: string;
    source: string;
    target: string;
    port: number;
    protocol: string;
    mitre: string;
    size: string;
    severity: SeverityLevel;
  }[]>([]);

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [containedSuccessMessage, setContainedSuccessMessage] = useState<string | null>(null);

  // Copy handler
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Sync state if prop changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  // Simulate Live Incursion Stream Packets
  useEffect(() => {
    if (!isLiveStreamActive || streamSpeed === 'paused') return;

    const getSpeedMs = () => {
      if (streamSpeed === 'fast') return 300;
      if (streamSpeed === 'slow') return 3000;
      return 1200; // medium
    };

    const interval = setInterval(() => {
      const activeTrajs = trajectories.filter((t) => t.active);
      if (activeTrajs.length === 0) return;

      const randomTraj = activeTrajs[Math.floor(Math.random() * activeTrajs.length)];
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().slice(0, 2)}`;

      const newPacket = {
        id: `pkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: timeStr,
        source: randomTraj.sourceName,
        target: randomTraj.targetName,
        port: randomTraj.port || 443,
        protocol: randomTraj.protocol || 'TLS 1.3',
        mitre: randomTraj.mitreTactic,
        size: `${Math.floor(Math.random() * 1400 + 400)} B`,
        severity: randomTraj.severity
      };

      setTerminalPackets((prev) => [newPacket, ...prev.slice(0, 19)]);
    }, getSpeedMs());

    return () => clearInterval(interval);
  }, [isLiveStreamActive, trajectories, streamSpeed]);

  // Playback timer ticker useEffect
  useEffect(() => {
    if (!isPlaybackPlaying) return;
    const interval = setInterval(() => {
      setPlaybackTime((prev) => {
        if (prev >= 24) {
          return 0; // loop back to T-24h
        }
        return prev + 1;
      });
    }, playbackSpeed);
    return () => clearInterval(interval);
  }, [isPlaybackPlaying, playbackSpeed]);

  // Clear AI briefing data on selected node change
  useEffect(() => {
    setAiBriefingData(null);
    setAiBriefingError(null);
  }, [selectedNode]);

  // Derived Data
  const filteredNodes = nodes.filter((node) => {
    // Playback Time Filtering
    const nodeHour = getNodeHourIndex(node.id);
    if (playbackTime < 24 && nodeHour > playbackTime) {
      return false;
    }

    if (!showVictims && node.type === 'victim') return false;
    if (!showOrigins && node.type === 'threat_origin') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        node.name.toLowerCase().includes(q) ||
        node.city?.toLowerCase().includes(q) ||
        node.country?.toLowerCase().includes(q) ||
        node.ip?.toLowerCase().includes(q) ||
        node.cvesExploited?.some((cve) => cve.toLowerCase().includes(q)) ||
        node.iocs?.some((ioc) => ioc.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (activeSeverityFilter !== 'all' && node.severity !== activeSeverityFilter) return false;
    if (activeStatusFilter !== 'all' && node.status !== activeStatusFilter) return false;
    if (activeSectorFilter !== 'all' && node.sector !== activeSectorFilter) return false;
    return true;
  });

  const filteredTrajectories = trajectories.filter((t) => {
    // Playback Time Filtering
    const srcHour = getNodeHourIndex(t.sourceId);
    const tgtHour = getNodeHourIndex(t.targetId);
    if (playbackTime < 24 && (srcHour > playbackTime || tgtHour > playbackTime)) {
      return false;
    }
    return t.active;
  });

  const sortedNodes = useMemo(() => {
    return [...filteredNodes].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';
      
      if (sortField === 'severity') {
        const sevOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
        valA = sevOrder[a.severity] ?? 0;
        valB = sevOrder[b.severity] ?? 0;
      } else if (sortField === 'target') {
        valA = (a.victimOrg || a.name || '').toLowerCase();
        valB = (b.victimOrg || b.name || '').toLowerCase();
      } else if (sortField === 'classification') {
        valA = (a.type || '').toLowerCase();
        valB = (b.type || '').toLowerCase();
      } else if (sortField === 'sector') {
        valA = (a.sector || '').toLowerCase();
        valB = (b.sector || '').toLowerCase();
      } else if (sortField === 'attribution') {
        valA = (a.actorName || '').toLowerCase();
        valB = (b.actorName || '').toLowerCase();
      } else if (sortField === 'feed') {
        valA = (a.feed || 'Internal Telemetry').toLowerCase();
        valB = (b.feed || 'Internal Telemetry').toLowerCase();
      } else if (sortField === 'vector') {
        valA = (a.incursionVector || '').toLowerCase();
        valB = (b.incursionVector || '').toLowerCase();
      } else if (sortField === 'rate') {
        valA = parseFloat(a.incursionRate || '0');
        valB = parseFloat(b.incursionRate || '0');
      } else if (sortField === 'exploits') {
        valA = a.cvesExploited?.length ?? 0;
        valB = b.cvesExploited?.length ?? 0;
      } else if (sortField === 'status') {
        valA = (a.defenseStatus || a.status || '').toLowerCase();
        valB = (b.defenseStatus || b.status || '').toLowerCase();
      }
      
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredNodes, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSimulateBlock = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId ? { ...n, defenseStatus: 'active_blocking', incursionRate: '0 pkt/s' } : n
      )
    );
    setContainedSuccessMessage(`Initiated layer-4 port block and dropped BGP routes for ${nodeId}.`);
    if (selectedNode?.id === nodeId) {
      setSelectedNode({ ...selectedNode, defenseStatus: 'active_blocking', incursionRate: '0 pkt/s' });
    }
  };

  const handleRollback = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId ? { ...n, defenseStatus: 'monitoring', incursionRate: '12.4k/s' } : n
      )
    );
    setContainedSuccessMessage(`Rollback complete. Restored network routing and cleared firewall rules for ${nodeId}.`);
    if (selectedNode?.id === nodeId) {
      setSelectedNode({ ...selectedNode, defenseStatus: 'monitoring', incursionRate: '12.4k/s' });
    }
  };

  const handleRunAIBriefing = async () => {
    if (!selectedNode) return;
    setIsAiBriefingLoading(true);
    setAiBriefingError(null);
    try {
      const payload = {
        artifactText: `
Node ID: ${selectedNode.id}
Entity Name: ${selectedNode.name}
Target Organization: ${selectedNode.victimOrg || selectedNode.name}
Threat Actor: ${selectedNode.actorName || 'Volt Typhoon'}
Sector: ${selectedNode.sector || 'Gov / Defense'}
Campaign: ${selectedNode.campaignTitle || 'Operation Shell Control'}
Location: ${selectedNode.city}, ${selectedNode.country}
Coordinates: ${selectedNode.lat}, ${selectedNode.lng}
IP Address: ${selectedNode.ip || '198.51.100.42'}
ASN: ${selectedNode.asn || 'AS721'}
Active Ports: ${selectedNode.ports ? selectedNode.ports.join(', ') : '443, 22'}
L4 Protocol: ${selectedNode.protocol || 'TCP/TLS'}
Incursion Vector: ${selectedNode.incursionVector || 'Zero-Day Edge Exploitation'}
Incursion Rate: ${selectedNode.incursionRate || '14.2k pkt/s'}
CVEs Exploited: ${selectedNode.cvesExploited ? selectedNode.cvesExploited.join(', ') : 'Zero-Day'}
MITRE Techniques: ${selectedNode.mitreTechniques ? selectedNode.mitreTechniques.join(', ') : 'T1190, T1059'}
Raw Hex Sample: ${selectedNode.hexSample || '45 00 00 e4 2b c0 40 00'}
        `,
        artifactType: 'WorldThreatNode Forensic Profile',
        context: `The user is investigating an active cyber security breach on node ${selectedNode.name} in sector ${selectedNode.sector || 'Gov/Defense'}. Run an exhaustive Principal CTI assessment.`
      };

      const res = await fetch('/api/threat-intel/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setAiBriefingData(data);
    } catch (err: any) {
      console.error(err);
      setAiBriefingError(err.message || 'Failed to generate AI CTI summary briefing.');
    } finally {
      setIsAiBriefingLoading(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
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

  return (
    <div className="space-y-2 text-slate-900 font-sans" id="world-threat-map-view">
      {/* 1. Header */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 shadow-sm" id="global-threat-sphere-header">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-sm border border-slate-200 shrink-0">
              <Globe2 className="w-5 h-5 text-indigo-500 animate-pulse" />
            </div>
            <div className="flex items-center gap-4">
              {/* Mini Frequency Chart */}
              <div className="flex flex-col gap-1 w-48 h-10">
                <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-tighter">Threat Frequency / 24H</span>
                <div className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={MOCK_FREQUENCY_DATA}>
                      <Line 
                        type="monotone" 
                        dataKey="v" 
                        stroke="#6366f1" 
                        strokeWidth={2} 
                        dot={false} 
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Unified Command Row: 3 Partitions */}
          <div className="flex flex-1 items-center justify-between gap-3">
            {/* Partition 1: Filters (Left) */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 py-0.5 px-1 rounded-lg shadow-2xs">
              <Filter className="w-2 h-2 text-slate-400" />
              <select
                value={activeCampaignFilter}
                onChange={(e) => setActiveCampaignFilter(e.target.value)}
                className="bg-transparent text-[8.5px] font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Campaigns</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <span className="w-px h-2.5 bg-slate-200"></span>
              <select
                value={activeSectorFilter}
                onChange={(e) => setActiveSectorFilter(e.target.value)}
                className="bg-transparent text-[8.5px] font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Sectors</option>
                <option value="Government & Defense">Gov/Defense</option>
                <option value="Financial Services">Financial</option>
                <option value="Critical Infrastructure & Energy">Infrastructure</option>
                <option value="Healthcare & Life Sciences">Healthcare</option>
              </select>
              <span className="w-px h-2.5 bg-slate-200"></span>
              <select
                value={activeSeverityFilter}
                onChange={(e) => setActiveSeverityFilter(e.target.value)}
                className="bg-transparent text-[8.5px] font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <span className="w-px h-2.5 bg-slate-200"></span>
              <select
                value={activeStatusFilter}
                onChange={(e) => setActiveStatusFilter(e.target.value)}
                className="bg-transparent text-[8.5px] font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Status</option>
                <option value="active_incursion">Active Incursion</option>
                <option value="contained">Contained</option>
                <option value="critical_exfiltration">Critical Exfiltration</option>
                <option value="probing">Probing</option>
              </select>
            </div>

            {/* Partition 2: Day Toggle & Sync Status (Middle) */}
            <div className="flex items-center gap-2 px-3 py-0.5 bg-slate-50/50 rounded-lg border border-slate-100">
              <button 
                onClick={() => setShowTerminator(!showTerminator)} 
                className={`scale-x-[1.10] flex items-center gap-1.5 px-2 py-0.5 rounded text-[8.5px] font-mono border transition-all ${
                  showTerminator ? 'bg-indigo-600 text-white border-indigo-700 font-bold shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                🌗 {showTerminator ? 'NIGHT' : 'DAY'}
              </button>
              
              <span className="w-px h-3 bg-slate-200 mx-1"></span>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[7.5px] font-black text-slate-400 uppercase tracking-widest">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" /> SYNC:
                </div>
                <div className="text-[9px] font-black font-mono text-emerald-600 uppercase">ACTIVE</div>
                <div className="text-[7px] text-slate-400 font-bold px-1 py-0.2 bg-white border border-slate-100 rounded">14 FEEDS</div>
              </div>
            </div>

            {/* Partition 3: Search (Right) */}
            <div className="relative w-[160px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-6 pr-1.5 py-0.5 rounded-lg bg-white border border-slate-200 text-[9px] text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10 transition-all font-mono shadow-3xs"
              />
            </div>
          </div>

          {/* Tactical Metrics Grid - Enhanced info */}
          <div className="flex flex-wrap items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-xl shadow-sm">
            <div className="px-1.5 py-0.5 border-r border-slate-100">
              <div className="flex items-center gap-1 text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                <Flame className="w-1.5 h-1.5 text-rose-500" /> Incursions
              </div>
              <div className="flex items-end gap-1">
                <div className="text-[9px] font-black font-mono text-slate-900">98.4K</div>
                <div className="text-[6.5px] text-rose-600 font-black mb-0.5">▲ 1.2K</div>
              </div>
            </div>
            
            <div className="px-1.5 py-0.5 border-r border-slate-100">
              <div className="flex items-center gap-1 text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                <Radio className="w-1.5 h-1.5 text-red-500" /> APT Nodes
              </div>
              <div className="flex items-end gap-1">
                <div className="text-[9px] font-black font-mono text-slate-900">05</div>
                <div className="flex flex-col">
                  <div className="text-[6.5px] text-red-600 font-black leading-none tracking-tighter">CN, RU..</div>
                </div>
              </div>
            </div>

            <div className="px-1.5 py-0.5 border-r border-slate-100">
              <div className="flex items-center gap-1 text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                <GitBranch className="w-1.5 h-1.5 text-orange-500" /> MITRE
              </div>
              <div className="flex items-end gap-1">
                <div className="text-[9px] font-black font-mono text-slate-900">3 ACTV</div>
              </div>
            </div>

            <div className="px-1.5 py-0.5 border-r border-slate-100">
              <div className="flex items-center gap-1 text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                <Target className="w-1.5 h-1.5 text-emerald-500" /> Targets
              </div>
              <div className="flex items-end gap-1">
                <div className="text-[9px] font-black font-mono text-slate-900">12</div>
              </div>
            </div>
            {onExportSTIX && (
              <button
                onClick={onExportSTIX}
                className="scale-x-[1.10] ml-0.5 p-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors shadow-xs border border-indigo-200"
                title="Export Intelligence Bundle"
              >
                <FileDown className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Notification Alert on Action */}
      {containedSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{containedSuccessMessage}</span>
          </div>
          <button onClick={() => setContainedSuccessMessage(null)} className="scale-x-[1.10] text-emerald-600 hover:text-emerald-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Layout Grid: Map on Left, Intelligence Boxes on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        
        {/* LEFT COLUMN: Map & Layers */}
        <div className="lg:col-span-6 flex flex-col gap-2">
          
          {/* Tactical Layers (Relocated to Top) & Regions & Live Status */}
            <div className="flex flex-wrap items-center gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
            <div className="flex items-center gap-0.5 border-r border-slate-100 pr-0.5 mr-0.5">
              <span className="text-[7.5px] font-mono font-bold text-slate-400 flex items-center gap-0.5 mr-0.5 ml-0.5 uppercase tracking-tighter">
                <Layers className="w-2 h-2 text-slate-300" />
                LAYERS:
              </span>
              <button onClick={() => setShowArcs(!showArcs)} className={`scale-x-[1.10] px-1 py-0.5 rounded text-[8.5px] font-mono border transition-all ${showArcs ? 'bg-red-50 text-red-700 border-red-200 font-bold shadow-xs' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}>
                ⚡ Arcs
              </button>
              <button onClick={() => setShowOrigins(!showOrigins)} className={`scale-x-[1.10] px-1 py-0.5 rounded text-[8.5px] font-mono border transition-all ${showOrigins ? 'bg-red-50 text-red-700 border-red-200 font-bold shadow-xs' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}>
                ☠️ Origins
              </button>
              <button onClick={() => setShowVictims(!showVictims)} className={`scale-x-[1.10] px-1 py-0.5 rounded text-[8.5px] font-mono border transition-all ${showVictims ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold shadow-xs' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}>
                🎯 Targets
              </button>
              <button onClick={() => setShowCables(!showCables)} className={`scale-x-[1.10] px-1 py-0.5 rounded text-[8.5px] font-mono border transition-all ${showCables ? 'bg-cyan-50 text-cyan-700 border-cyan-200 font-bold shadow-xs' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}>
                🌐 Fiber
              </button>
            </div>

            <div className="flex items-center gap-0.5 border-r border-slate-100 pr-0.5 mr-0.5">
              <span className="text-[7.5px] font-mono font-bold text-slate-400 flex items-center gap-0.5 mr-0.5 uppercase tracking-tighter">
                <Globe2 className="w-2 h-2 text-slate-300" />
                FOCUS:
              </span>
              {(['global', 'americas', 'emea', 'apac', 'fit'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRegion(r)}
                  className={`scale-x-[1.10] px-1 py-0.5 rounded text-[8.5px] font-mono border transition-all uppercase ${
                    selectedRegion === r
                      ? 'bg-indigo-600 text-white font-bold border-indigo-700 shadow-xs'
                      : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  {r === 'fit' ? '🎯' : r}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 ml-auto">
              <button 
                onClick={() => setIsMapCollapsed(!isMapCollapsed)}
                className="scale-x-[1.10] p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors"
                title={isMapCollapsed ? "Expand Map" : "Collapse Map"}
              >
                {isMapCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            </div>
          </div>
  
          {/* MAP ENGINE */}
          <motion.div 
            initial={false}
            animate={{ height: isMapCollapsed ? '32px' : '434.56px' }}
            className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md"
          >
            <AnimatePresence>
              {!isMapCollapsed && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-0 bg-slate-50"
                >
                  <RealisticLeafletThreatMap
                    nodes={filteredNodes}
                    trajectories={filteredTrajectories}
                    subseaCables={SUBSEA_FIBER_CABLES}
                    selectedNode={selectedNode}
                    onSelectNode={(n) => setSelectedNode(n)}
                    selectedRegion={selectedRegion}
                    onRegionChange={(r) => setSelectedRegion(r)}
                    showArcs={showArcs}
                    showOrigins={showOrigins}
                    showVictims={showVictims}
                    showCables={showCables}
                    showTerminator={showTerminator}
                    showRadarSweep={showRadarSweep}
                    isLiveStreamActive={isLiveStreamActive}
                    onToggleLiveStream={() => setIsLiveStreamActive(!isLiveStreamActive)}
                    heightClass="h-full"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            {isMapCollapsed && (
              <div className="h-full flex items-center px-3 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Globe2 className="w-3 h-3 mr-2" /> Vector Map Interface (Collapsed)
              </div>
            )}
          </motion.div>
        </div>
  
        {/* RIGHT COLUMN: Filters, Live Decryption, Forensic Dossier */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          
          <motion.div 
            initial={false}
            animate={{ height: isStreamCollapsed ? '32px' : '220px' }}
            className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 shadow-md flex flex-col font-mono shrink-0 overflow-hidden"
          >
            <div className="flex items-center justify-between pb-1 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                  Decryption Stream
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {!isStreamCollapsed && (
                  <>
                    <span className="text-[8px] text-slate-400 font-bold font-mono">SPEED:</span>
                    <select
                      value={streamSpeed}
                      onChange={(e) => setStreamSpeed(e.target.value as any)}
                      className="px-1 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-mono font-bold text-slate-700 focus:outline-hidden cursor-pointer"
                    >
                      <option value="fast">Fast</option>
                      <option value="medium">Medium</option>
                      <option value="slow">Slow</option>
                      <option value="paused">⏸</option>
                    </select>
                  </>
                )}
                <button 
                  onClick={() => setIsStreamCollapsed(!isStreamCollapsed)}
                  className="scale-x-[1.10] p-1 rounded hover:bg-slate-200 text-slate-400 transition-colors ml-1"
                >
                  {isStreamCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {!isStreamCollapsed && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-y-auto space-y-1.5 pr-1 py-1 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-300"
                >
                  {terminalPackets.map((pkt) => (
                    <div key={pkt.id} className="p-1.5 rounded-md bg-white border border-slate-200 hover:border-slate-300 transition-all space-y-1 shadow-xs">
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="text-indigo-600 font-bold">{pkt.timestamp}</span>
                        <span className={`px-1 py-0.2 rounded font-bold text-[8px] uppercase ${pkt.severity === 'critical' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                          {pkt.severity}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[10px]">
                        <div className="flex flex-wrap items-center gap-1 font-bold text-slate-800">
                          <span className="text-red-700">{pkt.source}</span>
                          <span className="text-slate-400 font-normal">➔</span>
                          <span className="text-emerald-700">{pkt.target}</span>
                        </div>
                        <span className="text-indigo-600 font-bold text-[9px] shrink-0 bg-indigo-50 px-1 py-0.2 rounded">{pkt.protocol}:{pkt.port}</span>
                      </div>
                      <div className="text-[8px] text-slate-400 bg-slate-50/50 p-1 rounded font-mono break-all border border-slate-100/50 leading-tight">
                        [RAW] 45 00 00 e4 {(pkt.port % 256).toString(16).padStart(2, '0')} c0 40 00 40 06 {(pkt.port % 13).toString(16)}d fd
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            
            {!isStreamCollapsed && (
              <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
                <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-indigo-500" /> ISAC L4</span>
                <span className="text-indigo-600 font-bold text-[9px]">20 FPS</span>
              </div>
            )}
          </motion.div>

          {/* FORENSIC DOSSIER */}
          <motion.div 
            initial={false}
            animate={{ height: isDossierCollapsed ? '32px' : '240px' }}
            className="bg-slate-50 border border-slate-200 rounded-xl shadow-md flex flex-col overflow-hidden shrink-0"
          >
            {/* Header section */}
            <div className="p-1.5 bg-white border-b border-slate-200 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-lg bg-white border border-slate-200 text-indigo-600 shadow-xs">
                  <Crosshair className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
                    Forensic Dossier | Washington DC, United States
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedNode && !isDossierCollapsed && (
                  <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-mono font-extrabold border ${getSeverityBadge(selectedNode.severity)} uppercase shrink-0 shadow-3xs`}>
                    {selectedNode.severity}
                  </span>
                )}
                <button 
                  onClick={() => setIsDossierCollapsed(!isDossierCollapsed)}
                  className="scale-x-[1.10] p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  {isDossierCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {!isDossierCollapsed && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col flex-1 min-h-0"
                >
            {selectedNode && (
              <div className="flex border-b border-slate-200 bg-slate-100 text-[9px] font-bold font-mono shrink-0">
                <button
                  onClick={() => setDossierTab('intel')}
                  className={`scale-x-[1.10] flex-1 py-1.5 text-center border-b-2 transition-all cursor-pointer ${
                    dossierTab === 'intel'
                      ? 'border-indigo-600 text-indigo-700 bg-white font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-850 hover:bg-slate-200/50'
                  }`}
                >
                  📡 Intel
                </button>
                <button
                  onClick={() => setDossierTab('stix')}
                  className={`scale-x-[1.10] flex-1 py-1.5 text-center border-b-2 transition-all cursor-pointer ${
                    dossierTab === 'stix'
                      ? 'border-indigo-600 text-indigo-700 bg-white font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-850 hover:bg-slate-200/50'
                  }`}
                >
                  🔗 STIX
                </button>
                <button
                  onClick={() => setDossierTab('signatures')}
                  className={`scale-x-[1.10] flex-1 py-1.5 text-center border-b-2 transition-all cursor-pointer ${
                    dossierTab === 'signatures'
                      ? 'border-indigo-600 text-indigo-700 bg-white font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-850 hover:bg-slate-200/50'
                  }`}
                >
                  🛡️ Rules
                </button>
                <button
                  onClick={() => setDossierTab('ai-brief')}
                  className={`scale-x-[1.10] flex-1 py-1.5 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    dossierTab === 'ai-brief'
                      ? 'border-indigo-600 text-indigo-700 bg-white font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-850 hover:bg-slate-200/50'
                  }`}
                >
                  <Brain className="w-2.5 h-2.5 text-indigo-500 animate-pulse" />
                  AI
                </button>
                <button
                  onClick={() => setDossierTab('strategic')}
                  className={`scale-x-[1.10] flex-1 py-1.5 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    dossierTab === 'strategic'
                      ? 'border-indigo-600 text-indigo-700 bg-white font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-850 hover:bg-slate-200/50'
                  }`}
                >
                  <Globe2 className="w-2.5 h-2.5 text-indigo-500" />
                  Strategic
                </button>
              </div>
            )}

            {/* Container Body */}
            <div className="flex-1 overflow-y-auto p-2 flex flex-col">
              {selectedNode ? (
                <>
                  {/* TAB 1: INTEL */}
                  {dossierTab === 'intel' && (
                    <div className="flex-1 space-y-2.5 font-mono text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg bg-red-50/50 border border-red-100 shadow-sm group">
                          <span className="text-[8px] text-red-400 font-black flex items-center gap-1 uppercase tracking-widest mb-1">
                            <Radio className="w-2.5 h-2.5" /> Threat Actor
                          </span>
                          <div className="font-sans font-bold text-slate-800 text-[11px] truncate tracking-tight">
                            {selectedNode.actorName || 'Volt Typhoon'}
                          </div>
                          <div className="text-[9px] text-red-400 mt-0.5 font-mono">
                            Conf: 96% Match
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 shadow-sm group">
                          <span className="text-[8px] text-emerald-500 font-black flex items-center gap-1 uppercase tracking-widest mb-1">
                            <Target className="w-2.5 h-2.5" /> Target Identity
                          </span>
                          <div className="font-sans font-black text-emerald-900 text-[11px] truncate tracking-tight">
                            {selectedNode.victimOrg || selectedNode.name}
                          </div>
                          <div className="text-[9px] text-emerald-600 mt-0.5 font-mono">
                            ASN: {selectedNode.asn || 'AS721'}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 p-2 rounded-lg space-y-1.5 shadow-sm text-[10px]">
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span className="text-slate-400 uppercase text-[8px] font-black tracking-wider">Network Address</span>
                          <span className="text-slate-900 font-black">{selectedNode.ip || '198.51.100.42'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span className="text-slate-400 uppercase text-[8px] font-black tracking-wider">Geo-Location</span>
                          <span className="text-slate-800 font-black">{selectedNode.city}, {selectedNode.country}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span className="text-slate-400 uppercase text-[8px] font-black tracking-wider">Incursion Vector</span>
                          <span className="text-rose-700 font-black">{selectedNode.incursionVector || 'Zero-Day'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span className="text-slate-400 uppercase text-[8px] font-black tracking-wider">Active Sector</span>
                          <span className="text-slate-800 font-black">{selectedNode.sector || 'Critical Infrastructure'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 uppercase text-[8px] font-black tracking-wider">MITRE TTPs</span>
                          <span className="text-indigo-600 font-black">{selectedNode.mitreTechniques?.join(', ') || 'T1190'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                          <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Reputation</div>
                          <div className="text-[11px] font-black text-rose-600">98/100</div>
                          <div className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">High Malicious Match</div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                          <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Confidence</div>
                          <div className="text-[11px] font-black text-emerald-600">96%</div>
                          <div className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Attribution Verified</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                          <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">First Seen (UTC)</div>
                          <div className="text-[10px] font-black text-slate-800">2026-08-25 22:14</div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                          <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Last Telemetry</div>
                          <div className="text-[10px] font-black text-slate-800">14.2m ago</div>
                        </div>
                      </div>

                      {/* Micro-Hex Sample */}
                      <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">L4 Payload Preview</div>
                        <div className="text-[9px] font-mono text-indigo-600/80 break-all leading-tight">
                          45 00 00 e4 2b c0 40 00 40 06 d3 a2 c0 a8 01 2a 08 08 01 bb 1f 90 7f 3d d7 e9 00 00 00 00 a0 02 16 d0
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col gap-2 shrink-0">
                        {selectedNode.defenseStatus === 'active_blocking' ? (
                          <button
                            onClick={() => handleRollback(selectedNode.id)}
                            className="scale-x-[1.10] flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black font-mono transition-all shadow-sm w-full justify-center border bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 active:scale-[0.98]"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>ROLLBACK COUNTERMEASURES</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSimulateBlock(selectedNode.id)}
                            className="scale-x-[1.10] flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black font-mono transition-all shadow-sm w-full justify-center border bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 active:scale-[0.98]"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>ENGAGE COUNTERMEASURES</span>
                          </button>
                        )}
                        
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                          <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Defense Action Report</div>
                          <div className="text-[9px] text-slate-600 font-medium leading-tight">
                            Engaging countermeasures triggers a multi-stage defense protocol:
                          </div>
                          <ul className="text-[9px] text-slate-500 font-sans space-y-1 mt-1">
                            <li className="flex items-start gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1" />
                              <span><b>L4 Firewall:</b> Drops all packets targeting specified ports.</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1" />
                              <span><b>BGP Null-Route:</b> Withdraws route announcements to blackhole traffic at the edge.</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1" />
                              <span><b>IPS Signature:</b> Deploys real-time pattern matching for active session termination.</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: STIX 2.1 RELATIONSHIP GRAPH VISUALIZER */}
                  {dossierTab === 'stix' && (
                    <div className="flex-1 flex flex-col space-y-4 font-mono text-xs">
                      <div className="p-2 border border-slate-200 bg-white rounded-lg shadow-2xs">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                          STIX 2.1 Object Graph (Click nodes to inspect)
                        </span>
                        
                        <div className="relative bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col items-center gap-5 overflow-hidden shadow-inner">
                          {/* SDO Connection lines */}
                          <div className="absolute top-8 bottom-8 left-1/2 w-[2px] bg-dashed bg-gradient-to-b from-red-400 via-amber-400 to-emerald-400 opacity-25 pointer-events-none" />
                          
                          {/* Node 1: Threat Actor (SDO) */}
                          <button
                            onClick={() => setSelectedStixNode('actor')}
                            className={`scale-x-[1.10] z-10 px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all w-full max-w-[200px] shadow-sm font-bold font-mono text-[10px] cursor-pointer ${
                              selectedStixNode === 'actor'
                                ? 'bg-red-50 text-red-700 border-red-200 ring-2 ring-red-100'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <Radio className="w-4 h-4 shrink-0 text-red-500" />
                            <div className="text-left leading-tight truncate">
                              <span className="text-[7px] text-slate-400 block uppercase font-mono font-bold">threat-actor</span>
                              <span className="truncate">{selectedNode.actorName || 'Volt Typhoon'}</span>
                            </div>
                          </button>

                          {/* Node 2: Vulnerability (SDO) */}
                          <button
                            onClick={() => setSelectedStixNode('vulnerability')}
                            className={`scale-x-[1.10] z-10 px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all w-full max-w-[200px] shadow-sm font-bold font-mono text-[10px] cursor-pointer ${
                              selectedStixNode === 'vulnerability'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 ring-2 ring-amber-100'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <Flame className="w-4 h-4 shrink-0 text-amber-500" />
                            <div className="text-left leading-tight truncate">
                              <span className="text-[7px] text-slate-400 block uppercase font-mono font-bold">vulnerability</span>
                              <span className="truncate">{selectedNode.cvesExploited?.[0] || 'CVE-2024-21887'}</span>
                            </div>
                          </button>

                          {/* Node 3: Infrastructure (SDO) */}
                          <button
                            onClick={() => setSelectedStixNode('infrastructure')}
                            className={`scale-x-[1.10] z-10 px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all w-full max-w-[200px] shadow-sm font-bold font-mono text-[10px] cursor-pointer ${
                              selectedStixNode === 'infrastructure'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-2 ring-indigo-100'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <Server className="w-4 h-4 shrink-0 text-indigo-500" />
                            <div className="text-left leading-tight truncate">
                              <span className="text-[7px] text-slate-400 block uppercase font-mono font-bold">infrastructure</span>
                              <span className="truncate">{selectedNode.ip || '198.51.100.42'}</span>
                            </div>
                          </button>

                          {/* Node 4: Identity / Victim (SDO) */}
                          <button
                            onClick={() => setSelectedStixNode('identity')}
                            className={`scale-x-[1.10] z-10 px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all w-full max-w-[200px] shadow-sm font-bold font-mono text-[10px] cursor-pointer ${
                              selectedStixNode === 'identity'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-2 ring-emerald-100'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <Target className="w-4 h-4 shrink-0 text-emerald-500" />
                            <div className="text-left leading-tight truncate">
                              <span className="text-[7px] text-slate-400 block uppercase font-mono font-bold">identity</span>
                              <span className="truncate">{selectedNode.victimOrg || selectedNode.name}</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* STIX Object Details Inspector */}
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-[10px] text-indigo-700 font-mono space-y-1.5 shadow-sm">
                        <div className="flex justify-between items-center text-slate-400 border-b border-slate-100 pb-1.5">
                          <span className="font-bold flex items-center gap-1 uppercase text-[9px]">
                            <GitBranch className="w-3.5 h-3.5 text-indigo-500" />
                            STIX 2.1 JSON attributes
                          </span>
                          <span className="bg-slate-50 text-slate-400 px-1 rounded font-bold uppercase text-[7px] border border-slate-100">
                            SDO Spec
                          </span>
                        </div>

                        {selectedStixNode === 'actor' && (
                          <pre className="overflow-x-auto select-all leading-normal text-[9px] max-h-[140px] scrollbar-thin scrollbar-thumb-slate-200">
{`{
  "type": "threat-actor",
  "spec_version": "2.1",
  "id": "threat-actor--${selectedNode.id}-act",
  "name": "${selectedNode.actorName || 'Volt Typhoon'}",
  "description": "State-sponsored actor targeting critical infrastructure",
  "threat_actor_types": ["nation-state", "espionage"],
  "sophistication": "strategic",
  "resource_level": "government"
}`}
                          </pre>
                        )}

                        {selectedStixNode === 'vulnerability' && (
                          <pre className="overflow-x-auto select-all leading-normal text-[9px] max-h-[140px] scrollbar-thin scrollbar-thumb-slate-200">
{`{
  "type": "vulnerability",
  "spec_version": "2.1",
  "id": "vulnerability--${selectedNode.id}-vul",
  "name": "${selectedNode.cvesExploited?.[0] || 'CVE-2024-21887'}",
  "description": "Remote Command Injection vulnerability in gateway appliance",
  "external_references": [{
    "source_name": "cve",
    "external_id": "${selectedNode.cvesExploited?.[0] || 'CVE-2024-21887'}"
  }]
}`}
                          </pre>
                        )}

                        {selectedStixNode === 'infrastructure' && (
                          <pre className="overflow-x-auto select-all leading-normal text-[9px] max-h-[140px] scrollbar-thin scrollbar-thumb-slate-800">
{`{
  "type": "infrastructure",
  "spec_version": "2.1",
  "id": "infrastructure--${selectedNode.id}-inf",
  "name": "C2 Command Router Node",
  "infrastructure_types": ["command-and-control"],
  "ip_address": "${selectedNode.ip || '198.51.100.42'}",
  "asn": "${selectedNode.asn || 'AS721'}"
}`}
                          </pre>
                        )}

                        {selectedStixNode === 'identity' && (
                          <pre className="overflow-x-auto select-all leading-normal text-[9px] max-h-[140px] scrollbar-thin scrollbar-thumb-slate-800">
{`{
  "type": "identity",
  "spec_version": "2.1",
  "id": "identity--${selectedNode.id}-id",
  "name": "${selectedNode.victimOrg || selectedNode.name}",
  "identity_class": "organization",
  "sectors": ["${selectedNode.sector?.toLowerCase() || 'government'}"],
  "contact_information": "NOC Escalation Contact Level-3"
}`}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: SIGNATURE RULES GENERATOR */}
                  {dossierTab === 'signatures' && (
                    <div className="flex-1 flex flex-col space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          Signature Format
                        </span>
                        <div className="flex gap-1.5">
                          {(['yara', 'sigma', 'snort'] as const).map((fmt) => (
                            <button
                              key={fmt}
                              onClick={() => setSelectedSigFormat(fmt)}
                              className={`scale-x-[1.10] px-2 py-0.5 rounded text-[10px] font-bold font-mono border transition-all cursor-pointer ${
                                selectedSigFormat === fmt
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs'
                                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {fmt.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="relative">
                        <button
                          onClick={() => {
                            const codeElement = document.getElementById('signature-code-block');
                            if (codeElement) {
                              handleCopy(codeElement.innerText);
                            }
                          }}
                          className="scale-x-[1.10] absolute top-2 right-2 p-1.5 rounded bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors shadow-xs cursor-pointer z-10"
                          title="Copy Signature"
                        >
                          {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <div
                          id="signature-code-block"
                          className="bg-white text-indigo-700 p-3 rounded-lg border border-slate-200 text-[10px] font-mono leading-relaxed select-all overflow-x-auto min-h-[180px] max-h-[270px] shadow-sm"
                        >
                          {selectedSigFormat === 'yara' && (
`rule detect_APT_${(selectedNode.actorName || 'VoltTyphoon').replace(/\s+/g, '_')}_Edge_Activity {
    meta:
        description = "Detects ${(selectedNode.actorName || 'Volt Typhoon')} edge campaign behavior targeting ${(selectedNode.sector || 'Gov / Defense')}."
        author = "Aegis CTI AI Detection Engine"
        threat_actor = "${selectedNode.actorName || 'Volt Typhoon'}"
        cve = "${selectedNode.cvesExploited?.[0] || 'CVE-2024-21887'}"
        reference = "CISA-KEV-Advisory"
        target_sector = "${selectedNode.sector || 'Gov / Defense'}"
    strings:
        $header = { 45 00 00 e4 }
        $mal_sign = "Operation Shell Control"
        $magic_port = { ${(selectedNode.ports?.[0] || 443).toString(16).toUpperCase().padStart(4, '0')} }
    condition:
        $header at 0 and ($mal_sign or $magic_port)
}`
                          )}

                          {selectedSigFormat === 'sigma' && (
`title: Edge Remote Execution Campaign - ${(selectedNode.actorName || 'Volt Typhoon')}
id: ${selectedNode.id}-sig-01
status: experimental
description: Detects incursion network behavior matching known network footprints used by ${(selectedNode.actorName || 'Volt Typhoon')}.
author: Aegis CTI AI Detection Engine
references:
  - https://www.cisa.gov/cybersecurity-advisories
logsource:
  category: firewall
  product: network
detection:
  selection:
    DestinationIp: "${selectedNode.ip || '198.51.100.42'}"
    DestinationPort: ${selectedNode.ports?.[0] || 443}
    Protocol: "${selectedNode.protocol || 'TCP'}"
  condition: selection
falsepositives:
  - Authorized network diagnostic tests
level: critical`
                          )}

                          {selectedSigFormat === 'snort' && (
`alert tcp any any -> ${selectedNode.ip || '198.51.100.42'} ${selectedNode.ports?.[0] || 443} (msg:"Aegis CTI: Potential ${(selectedNode.actorName || 'Volt Typhoon')} APT Network Incursion Inbound"; flow:established,to_server; content:"Operation Shell Control"; nocase; sid:${10000000 + Math.abs(getNodeHourIndex(selectedNode.id)) * 133}; rev:1;)`
                          )}
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-500 leading-normal">
                        This signature was synthesized deterministically based on the selected target telemetry. Feed this rule into your SIEM, firewall, or endpoint agent to trigger blocking triggers immediately.
                      </p>
                    </div>
                  )}

                  {/* TAB 4: GEMINI AI SUMMARY ENGINE BRIEF */}
                  {dossierTab === 'ai-brief' && (
                    <div className="flex-1 flex flex-col space-y-3 font-mono text-xs">
                      {!aiBriefingData && !isAiBriefingLoading && (
                        <div className="flex flex-col items-center justify-center py-6 text-center space-y-3 bg-slate-50/50 rounded-xl border border-slate-100">
                          <div className="p-3 rounded-full bg-white text-indigo-600 shadow-sm border border-slate-100">
                            <Brain className="w-8 h-8" />
                          </div>
                          <div className="space-y-1 max-w-[240px]">
                            <h4 className="font-bold text-slate-800 text-xs">Aegis AI Briefing Expert</h4>
                            <p className="text-[10px] text-slate-500">
                              Utilize server-side Gemini intelligence to generate an executive threat profile, technical analysis, and mitigation playbook.
                            </p>
                          </div>
                          <button
                            onClick={handleRunAIBriefing}
                            className="scale-x-[1.10] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-indigo-600 text-[11px] font-bold cursor-pointer transition-all shadow-sm border border-slate-200"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Synthesize CTI Assessment</span>
                          </button>
                        </div>
                      )}

                      {isAiBriefingLoading && (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 bg-slate-50/50 rounded-xl border border-slate-100">
                          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          <div className="space-y-1">
                            <span className="font-bold text-slate-800 block text-xs tracking-tight">Aegis CTI Core Syncing...</span>
                            <span className="text-[9px] text-slate-400 block animate-pulse">Running advanced Gemini LLM model</span>
                          </div>
                        </div>
                      )}

                      {aiBriefingError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[11px] leading-relaxed">
                          <div className="font-bold mb-1">Aegis AI Briefing Failure</div>
                          <p>{aiBriefingError}</p>
                          <button
                            onClick={handleRunAIBriefing}
                            className="scale-x-[1.10] mt-2 text-red-900 font-bold underline cursor-pointer"
                          >
                            Try Again
                          </button>
                        </div>
                      )}

                      {aiBriefingData && (
                        <div className="space-y-3 overflow-y-auto max-h-[330px] pr-1 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-200">
                          {/* Risk Score & Summary Title */}
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 shadow-sm">
                            <div>
                              <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-bold">Threat Severity Rating</span>
                              <span className="text-xs text-rose-600 font-extrabold">{aiBriefingData.verdict || 'CRITICAL_ALERT'}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-bold">Risk Matrix</span>
                              <span className="text-xs text-amber-600 font-extrabold">{aiBriefingData.riskScore || '92'}/100</span>
                            </div>
                          </div>

                          {/* Summary Text */}
                          <div className="bg-white border border-slate-200 p-2.5 rounded-lg space-y-1">
                            <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider block border-b border-slate-100 pb-0.5">Executive Summary</span>
                            <p className="text-[10px] text-slate-700 leading-relaxed font-sans font-medium">
                              {aiBriefingData.summary || aiBriefingData.recommendation || 'No summary returned by the AI Analyst.'}
                            </p>
                          </div>

                          {/* Technical Analysis */}
                          <div className="bg-white border border-slate-200 p-2.5 rounded-lg space-y-1">
                            <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider block border-b border-slate-100 pb-0.5">Tactical Intrusion Flow</span>
                            <p className="text-[10px] text-slate-600 leading-relaxed font-sans font-medium">
                              {aiBriefingData.technicalAnalysis || 'The adversary is utilizing CVE-based entry gateways combined with dynamic egress command tunnels to maintain persistent operations across local servers.'}
                            </p>
                          </div>

                          {/* Blast Radius Assessment */}
                          {aiBriefingData.blastRadius && (
                            <div className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-lg space-y-1">
                              <span className="text-[9px] text-amber-700 font-bold uppercase tracking-wider block border-b border-amber-100 pb-0.5">Operational Blast Radius</span>
                              <p className="text-[10px] text-amber-900 leading-relaxed font-sans font-medium">
                                {aiBriefingData.blastRadius}
                              </p>
                            </div>
                          )}

                          {/* Incident Playbook Actions */}
                          {aiBriefingData.containmentPlaybook && aiBriefingData.containmentPlaybook.length > 0 && (
                            <div className="bg-emerald-50/60 border border-emerald-200 p-2.5 rounded-lg space-y-1.5">
                              <span className="text-[9px] text-emerald-800 font-bold uppercase tracking-wider block border-b border-emerald-100 pb-0.5">Triage & Containment Tasks</span>
                              <ul className="space-y-1 font-sans font-medium">
                                {aiBriefingData.containmentPlaybook.map((task: any, idx: number) => (
                                  <li key={idx} className="flex gap-1.5 text-[10px] text-emerald-950 leading-relaxed">
                                    <span className="text-emerald-600 font-bold font-mono">[{idx+1}]</span>
                                    <span>{typeof task === 'string' ? task : JSON.stringify(task)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 5: GEOPOLITICAL STRATEGIC ANALYSIS */}
                  {dossierTab === 'strategic' && (
                    <div className="flex-1 flex flex-col space-y-3 font-mono text-xs">
                      {!aiBriefingData && !isAiBriefingLoading && (
                        <div className="flex flex-col items-center justify-center py-6 text-center space-y-3 bg-slate-50/50 rounded-xl border border-slate-100">
                          <div className="p-3 rounded-full bg-white text-slate-600 shadow-sm border border-slate-100">
                            <Globe2 className="w-8 h-8" />
                          </div>
                          <div className="space-y-1 max-w-[240px]">
                            <h4 className="font-bold text-slate-800 text-xs">Strategic Intelligence Bureau</h4>
                            <p className="text-[10px] text-slate-500">
                              Generate a high-level geopolitical analysis to understand actor motivations and regional significance.
                            </p>
                          </div>
                          <button
                            onClick={handleRunAIBriefing}
                            className="scale-x-[1.10] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-indigo-600 text-[11px] font-bold cursor-pointer transition-all shadow-sm border border-slate-200"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Synthesize Strategic Report</span>
                          </button>
                        </div>
                      )}

                      {isAiBriefingLoading && (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 bg-slate-50/50 rounded-xl border border-slate-100">
                          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          <div className="space-y-1">
                            <span className="font-bold text-slate-800 block text-xs tracking-tight">Synthesizing Geopolitical Data...</span>
                            <span className="text-[9px] text-slate-400 block animate-pulse">Running Strategic Intelligence Model</span>
                          </div>
                        </div>
                      )}

                      {aiBriefingData && (
                        <div className="space-y-3 overflow-y-auto max-h-[330px] pr-1 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-200">
                          {/* Strategic Motivation Card */}
                          <div className="bg-white border border-indigo-200 p-3 rounded-lg space-y-1.5 shadow-sm">
                            <div className="flex items-center gap-1.5 border-b border-slate-50 pb-1 mb-0.5">
                              <Target className="w-3 h-3 text-indigo-600" />
                              <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider block">Strategic Motivation</span>
                            </div>
                            <p className="text-[11px] text-slate-900 font-bold leading-tight uppercase tracking-tight">
                              {aiBriefingData.strategicMotivation || 'Regional Power Projection & Intelligence Espionage'}
                            </p>
                          </div>

                          {/* Geopolitical Context Block */}
                          <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm space-y-1.5">
                            <div className="flex items-center gap-1.5 border-b border-slate-50 pb-1">
                              <History className="w-3 h-3 text-indigo-500" />
                              <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider block">Geopolitical Context Report</span>
                            </div>
                            <p className="text-[10px] text-slate-700 leading-relaxed font-sans font-medium">
                              {aiBriefingData.geopoliticalContext || 'This campaign aligns with historical adversary behaviors targeting critical infrastructure in EMEA to destabilize regional energy markets.'}
                            </p>
                          </div>

                          {/* Long-term Strategic Objectives */}
                          {aiBriefingData.strategicObjectives && aiBriefingData.strategicObjectives.length > 0 && (
                            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg space-y-2 shadow-xs">
                              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1">
                                <Activity className="w-3 h-3 text-slate-500" />
                                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider block">Long-term Strategic Objectives</span>
                              </div>
                              <ul className="space-y-1.5 font-sans font-medium">
                                {aiBriefingData.strategicObjectives.map((objective: string, idx: number) => (
                                  <li key={idx} className="flex gap-2 text-[10px] text-slate-800 leading-tight group">
                                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[8px] font-bold text-indigo-600 font-mono shadow-3xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                      {idx + 1}
                                    </span>
                                    <span>{objective}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <p className="text-[9px] text-slate-400 leading-normal italic px-1 pt-1">
                            Strategic reports are synthesized by the Aegis Geopolitical Bureau and updated every 6 hours based on global telemetry shifts.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-slate-400 font-mono text-[11px]">
                  <Crosshair className="w-8 h-8 text-slate-300 mb-2" />
                  Click any node on the map to load real-time intelligence.
                </div>
              )}
            </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* 7. Dedicated Tightly-Packed Active APT & Victim Telemetry Table */}
      <div className="mt-5 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col" id="tightly-packed-threat-table">
        <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-600 via-indigo-600 to-emerald-600 opacity-30" />
          <h3 className="text-[10px] font-black text-slate-800 flex items-center gap-2 uppercase tracking-[0.2em]">
            <Activity className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            Active Cyber-Threat Intelligence (CTI) Matrix & Real-time Telemetry
          </h3>
          <span className="text-[9px] font-mono text-slate-500 bg-slate-200/50 border border-slate-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{filteredNodes.length} Active Nodes Ingesting</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[10px] uppercase tracking-wider select-none font-bold">
                <th className="px-2 py-2 font-bold cursor-pointer hover:bg-slate-200 transition-colors border-r border-slate-200 bg-slate-200/20 w-24" onClick={() => handleSort('classification')}>
                  <div className="flex items-center gap-1">
                    <span>Classification</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'classification' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                </th>
                <th className="px-2 py-2 font-bold border-r border-slate-200 bg-slate-200/40 whitespace-nowrap w-20" onClick={() => handleSort('severity')}>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Severity</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'severity' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                </th>
                <th className="px-2 py-2 font-bold cursor-pointer hover:bg-slate-200 transition-colors min-w-[140px] border-r border-slate-200" onClick={() => handleSort('country')}>
                  <div className="flex items-center gap-1">
                    <Compass className="w-3 h-3" />
                    <span>Location</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'country' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                </th>
                <th className="px-2 py-2 font-bold border-r border-slate-200 bg-slate-200/40 whitespace-nowrap w-24" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Status</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'status' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                </th>
                <th className="px-2 py-2 font-bold cursor-pointer hover:bg-slate-200 transition-colors min-w-[140px] border-r border-slate-200" onClick={() => handleSort('attribution')}>
                  <div className="flex items-center gap-1">
                    <span>Attacking Entity</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'attribution' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                </th>
                <th className="px-2 py-2 font-bold cursor-pointer hover:bg-slate-200 transition-colors min-w-[160px] border-r border-slate-200" onClick={() => handleSort('target')}>
                  <div className="flex items-center gap-1">
                    <span>Target Org</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'target' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                </th>
                <th className="px-2 py-2 font-bold cursor-pointer hover:bg-slate-200 transition-colors w-28 border-r border-slate-200" onClick={() => handleSort('sector')}>
                  <div className="flex items-center gap-1">
                    <span>Sector</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'sector' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                </th>
                <th className="px-2 py-2 font-bold cursor-pointer hover:bg-slate-200 transition-colors w-40 border-r border-slate-200" onClick={() => handleSort('vector')}>
                  <div className="flex items-center gap-1">
                    <span>Vector</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'vector' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                </th>
                <th className="px-2 py-2 font-bold cursor-pointer hover:bg-slate-200 transition-colors min-w-[200px] border-r border-slate-200" onClick={() => handleSort('exploits')}>
                  <div className="flex items-center gap-1">
                    <span className="text-xs">TTP / Exploits</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'exploits' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                </th>
                <th className="px-2 py-2 font-bold cursor-pointer hover:bg-slate-200 transition-colors w-32 border-r border-slate-200" onClick={() => handleSort('feed')}>
                  <div className="flex items-center gap-1">
                    <span>Intel Feed</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'feed' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                </th>
                <th className="px-2 py-2 font-bold cursor-pointer hover:bg-slate-200 transition-colors w-28" onClick={() => handleSort('rate')}>
                  <div className="flex items-center gap-1">
                    <span>Rate</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'rate' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedNodes.map(node => (
                <tr 
                  key={node.id} 
                  className={`border-b border-slate-100 cursor-pointer transition-all duration-150 ${selectedNode?.id === node.id ? 'bg-indigo-50/70 border-l-2 border-l-indigo-600 font-medium' : 'hover:bg-slate-50/80'}`}
                  onClick={() => setSelectedNode(node)}
                >
                  {/* Column 1: Classification (Relocated) */}
                  <td className="px-2 py-1.5 border-r border-slate-100 bg-slate-50/20">
                    <div className="flex items-center gap-1.5">
                      {node.type === 'threat_origin' || node.type === 'c2_hub' ? (
                        <span className="px-1 py-0.5 rounded bg-red-50 text-red-700 text-[8px] border border-red-200 font-black flex items-center gap-1 uppercase">
                          <Radio className="w-2.5 h-2.5 text-red-500 animate-ping" /> APT
                        </span>
                      ) : node.type === 'isac_sensor' ? (
                        <span className="px-1 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[8px] border border-indigo-200 font-black flex items-center gap-1 uppercase">
                          <Radio className="w-2.5 h-2.5 text-indigo-500" /> SENSOR
                        </span>
                      ) : (
                        <span className="px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[8px] border border-emerald-200 font-black flex items-center gap-1 uppercase">
                          <Target className="w-2.5 h-2.5 text-emerald-500" /> VICTIM
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Column 4: Severity */}
                  <td className="px-2 py-1.5 border-r border-slate-100">
                    <span className={`px-1.5 py-0.5 rounded-md font-black uppercase text-[9px] border ${getSeverityBadge(node.severity)} shadow-3xs`}>
                      {node.severity}
                    </span>
                  </td>

                  {/* Column 2: Location (Flag + Country/City) */}
                  <td className="px-2 py-1.5 border-r border-slate-100 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <img 
                        src={`https://flagcdn.com/w20/${node.countryCode.toLowerCase()}.png`} 
                        alt={node.country} 
                        className="w-4 h-2.5 rounded-[1px] shadow-sm object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex flex-col">
                        <span className="text-slate-800 font-sans font-bold text-[10px] leading-tight">{node.country}</span>
                        <span className="text-[9px] text-slate-400 font-mono leading-tight">{node.city}</span>
                      </div>
                    </div>
                  </td>

                  {/* Column 3: Status */}
                  <td className="px-2 py-1.5 whitespace-nowrap border-r border-slate-100 bg-slate-50/30">
                    {node.defenseStatus === 'active_blocking' ? (
                      <span className="inline-flex items-center gap-1 px-1 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 text-[8px] font-black uppercase">
                        <ShieldCheck className="w-2.5 h-2.5" /> BLOCKED
                      </span>
                    ) : node.status === 'contained' ? (
                      <span className="inline-flex items-center gap-1 px-1 py-0.5 rounded-md bg-cyan-100 text-cyan-800 border border-cyan-300 text-[8px] font-black uppercase">
                        <ShieldCheck className="w-2.5 h-2.5" /> CONTAINED
                      </span>
                    ) : node.status === 'critical_exfiltration' ? (
                      <span className="inline-flex items-center gap-1 px-1 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 text-[8px] font-black animate-pulse uppercase">
                        <AlertTriangle className="w-2.5 h-2.5" /> EXFIL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[8px] font-black uppercase">
                        <AlertTriangle className="w-2.5 h-2.5" /> ACTIVE
                      </span>
                    )}
                  </td>

                  {/* Column 5: Attacking Entity */}
                  <td className="px-2 py-1.5 border-r border-slate-100">
                    <div className="text-slate-800 font-sans font-bold text-[11px] tracking-tight">
                      {node.actorName || 'Volt Typhoon'}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5 font-mono truncate max-w-[150px]" title={node.campaignTitle}>
                      {node.campaignTitle || 'Operation Shell Control'}
                    </div>
                  </td>

                  {/* Column 6: Target Organization */}
                  <td className="px-2 py-1.5 border-r border-slate-100">
                    <div className="font-sans font-bold text-slate-800 text-[11px]">
                      {node.victimOrg || node.name}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5 font-mono flex items-center gap-1">
                      <span className="text-slate-600 font-bold">{node.ip || '198.51.100.42'}</span>
                    </div>
                  </td>
 
                  {/* Column 6: Sector */}
                  <td className="px-2 py-1.5 border-r border-slate-100">
                    <span className="text-slate-600 text-[9px] font-mono font-bold bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 inline-block whitespace-nowrap">
                      {node.sector || 'Gov / Defense'}
                    </span>
                  </td>
  
                  {/* Column 7: Network Vector */}
                  <td className="px-2 py-1.5 border-r border-slate-100">
                    <div className="text-slate-700 font-sans font-bold text-[10px]">
                      {node.incursionVector || 'Edge Device Exploitation'}
                    </div>
                    <div className="text-[9px] text-indigo-600 mt-0.5 font-mono">
                      {node.protocol || 'TCP/TLS'}:{node.ports?.[0] || 443}
                    </div>
                  </td>

                  {/* Column 8: Exploits & MITRE TTPs */}
                  <td className="px-2 py-1.5 border-r border-slate-100">
                    <div className="flex flex-wrap gap-1">
                      {node.cvesExploited && node.cvesExploited.length > 0 ? (
                        node.cvesExploited.slice(0, 2).map(cve => (
                          <span key={cve} className="px-1 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 text-[10px] font-black">
                            {cve}
                          </span>
                        ))
                      ) : (
                        <span className="px-1 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-100 text-[10px] font-bold">
                          Zero-Day
                        </span>
                      )}
                      {node.mitreTechniques && node.mitreTechniques.slice(0, 2).map(tech => (
                        <span key={tech} className="px-1 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold whitespace-nowrap" title={MITRE_TECH_NAMES[tech] || tech}>
                          {tech}: {MITRE_TECH_NAMES[tech] || 'Unknown Technique'}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Column 9: Threat Feed */}
                  <td className="px-2 py-1.5 border-r border-slate-100 bg-slate-50/10">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      node.feed === 'CISA AIS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      node.feed === 'AlienVault OTX' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      node.feed === 'ThreatFox' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {node.feed || 'Aegis Core'}
                    </span>
                  </td>

                  {/* Column 10: Telemetry Rate (Relocated to end) */}
                  <td className="px-2 py-1.5">
                    <div className={`font-mono text-[10px] font-black ${node.defenseStatus === 'active_blocking' ? 'text-slate-400 line-through' : 'text-rose-600'}`}>
                      {node.incursionRate || '14.2k/s'}
                    </div>
                    {node.dataAtRisk && (
                      <div className="text-[8px] text-amber-700 font-bold mt-0.5 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> <span className="truncate max-w-[100px]">{node.dataAtRisk}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default WorldThreatMapView;
