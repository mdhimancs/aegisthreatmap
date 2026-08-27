import React, { useState, useEffect } from 'react';
import {
  ActiveTab,
  Header
} from './components/Header';
import { WorldThreatMapView } from './components/WorldThreatMapView';
import { CTIDashboardView } from './components/CTIDashboardView';
import { OverviewDashboard } from './components/OverviewDashboard';
import { ThreatFeedsView } from './components/ThreatFeedsView';
import { AnomalyDetectorView } from './components/AnomalyDetectorView';
import { IOCEnrichmentView } from './components/IOCEnrichmentView';
import { ThreatActorsView } from './components/ThreatActorsView';
import { MitreMatrixView } from './components/MitreMatrixView';
import { CVERadarView } from './components/CVERadarView';
import { AiAnalystView } from './components/AiAnalystView';
import { DetectionRulesView } from './components/DetectionRulesView';
import { VulnerabilityAssessmentView } from './components/VulnerabilityAssessmentView';
import { IOCDetailModal } from './components/IOCDetailModal';
import { CopilotDrawer } from './components/CopilotDrawer';
import { AppExitStandbyModal, StandbyScreenOverlay } from './components/AppExitStandbyModal';

import {
  INITIAL_TELEMETRY,
  INITIAL_IOCS,
  INITIAL_THREAT_ACTORS,
  INITIAL_MITRE_TACTICS,
  INITIAL_CVES,
  INITIAL_DETECTION_RULES,
  INITIAL_CAMPAIGNS,
  INITIAL_THREAT_FEEDS,
  INITIAL_CUSTOM_FEED_SOURCES,
  INITIAL_ANOMALIES,
  INITIAL_VULN_ASSETS,
  INITIAL_VULN_FINDINGS,
  INITIAL_SCAN_JOBS,
  INITIAL_VULN_METRICS,
  INITIAL_WORLD_THREAT_NODES,
  INITIAL_ATTACK_TRAJECTORIES
} from './data/mockThreatData';

import {
  IOC,
  ThreatActor,
  MitreTechnique,
  VulnerabilityCVE,
  DetectionRule,
  ThreatFeedItem,
  FeedProvider,
  CustomFeedSource,
  BehavioralAnomaly,
  AnomalyAnalysisResult,
  AutoRefreshInterval,
  VulnerabilityAsset,
  VulnerabilityFinding,
  ScanJob,
  VulnerabilityAssessmentMetrics,
  WorldThreatNode,
  AttackTrajectory
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('world-map');
  const [searchQuery, setSearchQuery] = useState('');

  // Core Intelligence Data States
  const [telemetry, setTelemetry] = useState(INITIAL_TELEMETRY);
  const [iocs, setIocs] = useState<IOC[]>(INITIAL_IOCS);
  const [actors, setActors] = useState<ThreatActor[]>(INITIAL_THREAT_ACTORS);
  const [mitreTactics, setMitreTactics] = useState(INITIAL_MITRE_TACTICS);
  const [cves, setCves] = useState<VulnerabilityCVE[]>(INITIAL_CVES);
  const [rules, setRules] = useState<DetectionRule[]>(INITIAL_DETECTION_RULES);
  const [campaigns, setCampaigns] = useState(INITIAL_CAMPAIGNS);
  const [worldNodes, setWorldNodes] = useState<WorldThreatNode[]>(INITIAL_WORLD_THREAT_NODES);
  const [attackTrajectories, setAttackTrajectories] = useState<AttackTrajectory[]>(INITIAL_ATTACK_TRAJECTORIES);

  // Standby / Exit State
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isStandbyActive, setIsStandbyActive] = useState(false);

  // Vulnerability Assessment States
  const [vulnAssets, setVulnAssets] = useState<VulnerabilityAsset[]>(INITIAL_VULN_ASSETS);
  const [vulnFindings, setVulnFindings] = useState<VulnerabilityFinding[]>(INITIAL_VULN_FINDINGS);
  const [scanJobs, setScanJobs] = useState<ScanJob[]>(INITIAL_SCAN_JOBS);
  const [vulnMetrics, setVulnMetrics] = useState<VulnerabilityAssessmentMetrics>(INITIAL_VULN_METRICS);

  // Live Feeds & Behavioral Anomaly Engine States

  const [feeds, setFeeds] = useState<ThreatFeedItem[]>(INITIAL_THREAT_FEEDS);
  const [customSources, setCustomSources] = useState<CustomFeedSource[]>(INITIAL_CUSTOM_FEED_SOURCES);
  const [anomalies, setAnomalies] = useState<BehavioralAnomaly[]>(INITIAL_ANOMALIES);

  // Auto Refresh & Plain View state
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<AutoRefreshInterval>(10);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPlainView, setIsPlainView] = useState(false);

  // Selection & Modal States
  const [selectedIOC, setSelectedIOC] = useState<IOC | null>(null);
  const [selectedActor, setSelectedActor] = useState<ThreatActor | null>(null);
  const [selectedCVE, setSelectedCVE] = useState<VulnerabilityCVE | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);

  // Auto-refresh interval countdown & data simulation
  useEffect(() => {
    if (autoRefreshInterval === 0) return;
    setSecondsRemaining(autoRefreshInterval);

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          handleManualRefresh();
          return autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshInterval]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    // Simulate dynamic updates to telemetry & feed timestamp
    setTelemetry((prev) => ({
      ...prev,
      blockedAttacks24h: prev.blockedAttacks24h + Math.floor(Math.random() * 8) + 1,
      trackedIocsCount: prev.trackedIocsCount + (Math.random() > 0.6 ? 1 : 0)
    }));

    // Inject a new "latest" feed item occasionally during refresh
    if (Math.random() > 0.4) {
      const providers: FeedProvider[] = ['CISA AIS', 'AlienVault OTX', 'ThreatFox', 'Shadowserver', 'URLhaus', 'vx-underground'];
      const threatTypes = ['c2', 'malware', 'phishing', 'exploit', 'botnet', 'ransomware'];
      const indicators = [
        '103.25.194.' + Math.floor(Math.random() * 255),
        'secure-login-' + Math.random().toString(36).substring(7) + '.net',
        Math.random().toString(16).substring(2, 34),
        'https://threat-payload.' + Math.random().toString(36).substring(7) + '.com/stage2.bin'
      ];
      
      const newFeedItem: ThreatFeedItem = {
        id: `feed-dynamic-${Date.now()}`,
        provider: providers[Math.floor(Math.random() * providers.length)],
        title: `Real-time Alert: New ${threatTypes[Math.floor(Math.random() * threatTypes.length)].toUpperCase()} activity detected`,
        indicator: indicators[Math.floor(Math.random() * indicators.length)],
        indicatorType: 'ip', // simple for mock
        threatType: threatTypes[Math.floor(Math.random() * threatTypes.length)] as any,
        severity: Math.random() > 0.7 ? 'critical' : 'high',
        confidence: Math.floor(Math.random() * 20) + 80,
        tlp: 'TLP:AMBER',
        timestamp: new Date().toISOString(),
        description: 'Automated ingestion of new threat vector identified via global sensor mesh and behavioral correlation engines.',
        tags: ['Dynamic-Sync', 'Latest-Intel', 'AI-Triage'],
        sourceUrl: '#',
        rawPayload: '{"type": "indicator", "spec_version": "2.1", "status": "LIVE_INGEST"}'
      };

      setFeeds((prev) => [newFeedItem, ...prev].slice(0, 50)); // Keep latest 50
    }

    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Deep AI Enriching handler for single IOC
  const handleAIEnrichIOC = async (targetIOC: IOC) => {
    try {
      setIsEnriching(true);
      const res = await fetch('/api/threat-intel/ioc-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iocValue: targetIOC.value, iocType: targetIOC.type })
      });

      if (!res.ok) throw new Error('Enrichment failed');
      const data = await res.json();

      const updatedIOC: IOC = {
        ...targetIOC,
        riskScore: data.riskScore ?? targetIOC.riskScore,
        confidenceScore: data.confidenceScore ?? targetIOC.confidenceScore,
        threatActor: data.threatActor || targetIOC.threatActor,
        malwareFamily: data.malwareFamily || targetIOC.malwareFamily,
        description: data.description || targetIOC.description,
        passiveDns: data.passiveDns || targetIOC.passiveDns,
        recommendedAction: data.recommendedAction || targetIOC.recommendedAction,
        detectionStats: data.detectionStats || targetIOC.detectionStats,
        tags: Array.from(new Set([...targetIOC.tags, ...(data.tags || []), 'AI-Verified']))
      };

      setIocs((prev) => prev.map((item) => (item.id === targetIOC.id ? updatedIOC : item)));
      setSelectedIOC(updatedIOC);
    } catch (err) {
      console.error('Error during AI enrichment:', err);
    } finally {
      setIsEnriching(false);
    }
  };

  // Add new IOC
  const handleAddIOC = (newIOC: IOC) => {
    setIocs((prev) => [newIOC, ...prev]);
    setTelemetry((prev) => ({
      ...prev,
      trackedIocsCount: prev.trackedIocsCount + 1
    }));
  };

  // Ingest feed item into tracked IOCs
  const handleIngestFeedItem = (feedItem: ThreatFeedItem) => {
    const newIoc: IOC = {
      id: `ioc-feed-${Date.now()}`,
      value: feedItem.indicator,
      type: feedItem.indicatorType,
      category: (feedItem.threatType as any) || 'c2',
      severity: feedItem.severity,
      confidenceScore: feedItem.confidence,
      riskScore: feedItem.severity === 'critical' ? 95 : feedItem.severity === 'high' ? 82 : 65,
      firstSeen: feedItem.timestamp,
      lastSeen: new Date().toISOString(),
      tlp: feedItem.tlp,
      mitreTechniques: ['T1071.001'],
      tags: [...feedItem.tags, feedItem.provider, 'Feed-Ingested'],
      detectionStats: { malicious: 52, suspicious: 6, harmless: 1, total: 72 },
      description: `${feedItem.title} - ${feedItem.description}`,
      recommendedAction: 'Apply egress block rule at boundary firewalls and trigger SIEM search'
    };

    setIocs((prev) => [newIoc, ...prev.filter((i) => i.value !== newIoc.value)]);
    setFeeds((prev) =>
      prev.map((f) => (f.id === feedItem.id ? { ...f, isIngested: true } : f))
    );
    setTelemetry((prev) => ({
      ...prev,
      trackedIocsCount: prev.trackedIocsCount + 1
    }));
  };

  const handleAddCustomFeedSource = (source: CustomFeedSource) => {
    setCustomSources((prev) => [source, ...prev]);
  };

  const handleUpdateAnomalyStatus = (id: string, status: BehavioralAnomaly['status']) => {
    setAnomalies((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const handleRunAiAnomalyEvaluation = async (anomaly: BehavioralAnomaly): Promise<AnomalyAnalysisResult | null> => {
    try {
      const res = await fetch('/api/threat-intel/anomaly-eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anomaly })
      });
      if (!res.ok) throw new Error('Anomaly evaluation failed');
      return await res.json();
    } catch (err) {
      console.error('Anomaly AI evaluation error:', err);
      return null;
    }
  };

  // Add evaluated CVE
  const handleAddEvaluatedCVE = (newCVE: VulnerabilityCVE) => {
    setCves((prev) => [newCVE, ...prev]);
    setTelemetry((prev) => ({
      ...prev,
      weaponizedCvesCount: prev.weaponizedCvesCount + 1
    }));
  };

  // Add Synthesized Detection Rule
  const handleAddRule = (newRule: DetectionRule) => {
    setRules((prev) => [newRule, ...prev]);
  };

  // Generate Rule for Actor
  const handleGenerateActorRule = (actor: ThreatActor) => {
    setActiveTab('rules');
  };

  // Generate Rule for Technique
  const handleGenerateRuleForTechnique = (tech: MitreTechnique) => {
    setActiveTab('rules');
  };

  // Vulnerability Finding Status Update
  const handleUpdateFindingStatus = (id: string, newStatus: VulnerabilityFinding['status']) => {
    setVulnFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
    );
  };

  // Run Vulnerability Scan
  const handleRunScan = (scanTarget: string, scanType: ScanJob['scanType']) => {
    const newJob: ScanJob = {
      id: `scan-${Date.now().toString().slice(-4)}`,
      target: scanTarget,
      scanType: scanType,
      status: 'completed',
      startTime: new Date().toISOString(),
      duration: '3m 12s',
      targetsScanned: 24,
      findingsDiscovered: 3,
      criticalCount: 1
    };
    setScanJobs((prev) => [newJob, ...prev]);
  };

  // Export STIX 2.1 Bundle
  const handleExportSTIX = () => {
    const stixBundle = {
      type: 'bundle',
      id: `bundle--${Date.now()}`,
      spec_version: '2.1',
      objects: [
        ...iocs.map((ioc) => ({
          type: 'indicator',
          spec_version: '2.1',
          id: `indicator--${ioc.id}`,
          created: ioc.firstSeen,
          modified: ioc.lastSeen,
          name: `${ioc.type.toUpperCase()}: ${ioc.value}`,
          description: ioc.description,
          indicator_types: [ioc.category],
          pattern: `[${ioc.type}:value = '${ioc.value}']`,
          pattern_type: 'stix',
          valid_from: ioc.firstSeen,
          confidence: ioc.confidenceScore,
          labels: ioc.tags
        })),
        ...actors.map((actor) => ({
          type: 'threat-actor',
          spec_version: '2.1',
          id: `threat-actor--${actor.id}`,
          created: '2026-01-01T00:00:00Z',
          name: actor.name,
          aliases: actor.aliases,
          threat_actor_types: [actor.sponsorType],
          sophistication: actor.sophistication,
          resource_level: 'organization',
          primary_motivation: actor.motivation,
          description: actor.description
        }))
      ]
    };

    const blob = new Blob([JSON.stringify(stixBundle, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegis_cyber_threat_intel_stix2.1_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen bg-slate-100 text-slate-900 flex flex-col font-sans overflow-hidden selection:bg-red-500/20 selection:text-red-900">
      {/* Platform Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        telemetry={telemetry}
        onOpenCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
        onExportSTIX={handleExportSTIX}
        onOpenExitModal={() => setIsExitModalOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        autoRefreshInterval={autoRefreshInterval}
        setAutoRefreshInterval={setAutoRefreshInterval}
        secondsRemaining={secondsRemaining}
        onManualRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        isPlainView={isPlainView}
        setIsPlainView={setIsPlainView}
        isCopilotOpen={isCopilotOpen}
        feedCount={feeds.length}
        anomalyCount={anomalies.length}
        campaignCount={campaigns.length}
        vulnCount={vulnFindings.length}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-2 lg:px-3 py-2">
          {activeTab === 'world-map' && (
            <WorldThreatMapView
              nodes={worldNodes}
              trajectories={attackTrajectories}
              campaigns={campaigns}
              actors={actors}
              onSelectActor={(actor) => {
                setSelectedActor(actor);
                setActiveTab('actors');
              }}
              onSelectIOC={(ioc) => setSelectedIOC(ioc)}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onExportSTIX={handleExportSTIX}
            />
          )}

          {activeTab === 'cti-dashboard' && (
            <CTIDashboardView
              campaigns={campaigns}
              actors={actors}
              telemetry={telemetry}
              iocs={iocs}
              cves={cves}
              onSelectActor={(actor) => {
                setSelectedActor(actor);
                setActiveTab('actors');
              }}
              onSelectIOC={(ioc) => setSelectedIOC(ioc)}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onExportSTIX={handleExportSTIX}
            />
          )}

          {activeTab === 'overview' && (
            <OverviewDashboard
              telemetry={telemetry}
              recentIOCs={iocs}
              actors={actors}
              campaigns={campaigns}
              cves={cves}
              feeds={feeds}
              anomalies={anomalies}
              isPlainView={isPlainView}
              onSelectIOC={(ioc) => setSelectedIOC(ioc)}
              onSelectActor={(actor) => {
                setSelectedActor(actor);
                setActiveTab('actors');
              }}
              onSelectCVE={(cve) => {
                setSelectedCVE(cve);
                setActiveTab('cve');
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'vuln-assessment' && (
            <VulnerabilityAssessmentView
              findings={vulnFindings}
              assets={vulnAssets}
              scanJobs={scanJobs}
              metrics={vulnMetrics}
              onUpdateFindingStatus={handleUpdateFindingStatus}
              onRunScan={handleRunScan}
              onNavigateToCVE={(cveId) => {
                const target = cves.find((c) => c.cveId === cveId);
                if (target) {
                  setSelectedCVE(target);
                  setActiveTab('cve');
                }
              }}
            />
          )}


          {activeTab === 'feeds' && (
            <ThreatFeedsView
              feeds={feeds}
              customSources={customSources}
              onIngestFeedItem={handleIngestFeedItem}
              onAddCustomFeedSource={handleAddCustomFeedSource}
              onRefreshFeeds={handleManualRefresh}
              isRefreshing={isRefreshing}
            />
          )}

          {activeTab === 'anomalies' && (
            <AnomalyDetectorView
              anomalies={anomalies}
              onUpdateAnomalyStatus={handleUpdateAnomalyStatus}
              onRunAiEvaluation={handleRunAiAnomalyEvaluation}
            />
          )}

          {activeTab === 'iocs' && (
            <IOCEnrichmentView
              iocs={iocs}
              onAddIOC={handleAddIOC}
              onSelectIOC={(ioc) => setSelectedIOC(ioc)}
              onAIEnrich={handleAIEnrichIOC}
              isEnriching={isEnriching}
              onExportSTIX={handleExportSTIX}
            />
          )}

          {activeTab === 'actors' && (
            <ThreatActorsView
              actors={actors}
              selectedActor={selectedActor}
              onSelectActor={(actor) => setSelectedActor(actor)}
              onGenerateActorRule={handleGenerateActorRule}
            />
          )}

          {activeTab === 'mitre' && (
            <MitreMatrixView
              tactics={mitreTactics}
              onGenerateRuleForTechnique={handleGenerateRuleForTechnique}
            />
          )}

          {activeTab === 'cve' && (
            <CVERadarView
              cves={cves}
              selectedCVE={selectedCVE}
              onSelectCVE={(cve) => setSelectedCVE(cve)}
              onAddEvaluatedCVE={handleAddEvaluatedCVE}
            />
          )}

          {activeTab === 'ai-analyst' && (
            <AiAnalystView
              onIngestExtractedIOC={handleAddIOC}
              onSaveRule={handleAddRule}
            />
          )}

          {activeTab === 'rules' && (
            <DetectionRulesView
              rules={rules}
              onAddRule={handleAddRule}
            />
          )}
        </main>

        {/* Persistent AI Copilot Sidebar */}
        <aside 
          className={`h-full border-l border-slate-200 bg-white transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${
            isCopilotOpen ? 'w-80 xl:w-96' : 'w-0'
          }`}
        >
          <CopilotDrawer
            isOpen={true}
            onClose={() => setIsCopilotOpen(false)}
          />
        </aside>
      </div>

      {/* Detail Modal for IOCs */}
      <IOCDetailModal
        ioc={selectedIOC}
        onClose={() => setSelectedIOC(null)}
        onAIEnrich={handleAIEnrichIOC}
        isEnriching={isEnriching}
      />

      {/* Interactive AI Copilot Slide-over Drawer */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      {/* Standby / Exit Session Modal */}
      <AppExitStandbyModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onEnterStandby={() => setIsStandbyActive(true)}
        onExportAndClose={() => {
          handleExportSTIX();
          setIsStandbyActive(true);
        }}
        isStandby={isStandbyActive}
        onResume={() => setIsStandbyActive(false)}
      />

      {/* Standby Overlay when suspended */}
      {isStandbyActive && (
        <StandbyScreenOverlay
          onResume={() => setIsStandbyActive(false)}
        />
      )}
    </div>
  );
}

export default App;
