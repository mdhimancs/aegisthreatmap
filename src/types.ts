export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type TlpLevel = 'TLP:RED' | 'TLP:AMBER' | 'TLP:GREEN' | 'TLP:WHITE';

export type IOCType =
  | 'ip'
  | 'domain'
  | 'url'
  | 'hash_sha256'
  | 'hash_md5'
  | 'cve'
  | 'wallet'
  | 'asn';

export type ThreatCategory =
  | 'ransomware'
  | 'c2'
  | 'infostealer'
  | 'phishing'
  | 'apt'
  | 'botnet'
  | 'loader'
  | 'rootkit'
  | 'exploit';

export interface IOC {
  id: string;
  value: string;
  type: IOCType;
  category: ThreatCategory;
  severity: SeverityLevel;
  confidenceScore: number; // 0-100
  firstSeen: string;
  lastSeen: string;
  tlp: TlpLevel;
  threatActor?: string;
  malwareFamily?: string;
  mitreTechniques: string[];
  country?: string;
  countryCode?: string;
  asn?: string;
  riskScore: number; // 0-100
  tags: string[];
  detectionStats: {
    malicious: number;
    suspicious: number;
    harmless: number;
    total: number;
  };
  description: string;
  passiveDns?: string[];
  whoisRegistrar?: string;
  recommendedAction?: string;
}

export interface DiamondModel {
  adversary: string;
  capability: string;
  infrastructure: string;
  victim: string;
}

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  originCountry: string;
  countryCode: string;
  sponsorType: 'state_sponsored' | 'criminal_syndicate' | 'hacktivist' | 'unknown';
  motivation: 'espionage' | 'financial' | 'sabotage' | 'destruction' | 'ideology' | 'mixed';
  sophistication: 'elite' | 'advanced' | 'intermediate';
  targetSectors: string[];
  targetRegions: string[];
  activeCampaigns: string[];
  primaryTTPs: string[];
  associatedMalware: string[];
  cvesExploited: string[];
  description: string;
  diamondModel: DiamondModel;
  firstObserved: string;
  status: 'active' | 'dormant' | 'disrupted';
  avatarColor: string;
}

export interface ThreatCampaign {
  id: string;
  title: string;
  actorId: string;
  actorName: string;
  severity: SeverityLevel;
  status: 'active' | 'monitored' | 'contained';
  targetedSectors: string[];
  targetedCountries: string[];
  startDate: string;
  lastActivity: string;
  summary: string;
  iocCount: number;
  mitreTactics: string[];
  attackVector: string;
}

export interface WorldThreatNode {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  city: string;
  lat: number;
  lng: number;
  type: 'victim' | 'threat_origin' | 'c2_hub' | 'isac_sensor';
  campaignId?: string;
  campaignTitle?: string;
  actorName?: string;
  actorId?: string;
  sector?: string;
  severity: SeverityLevel;
  status: 'active_incursion' | 'contained' | 'critical_exfiltration' | 'probing';
  victimOrg?: string;
  incursionVector?: string;
  cvesExploited?: string[];
  iocs?: string[];
  lastObserved: string;
  incursionRate: string;
  feed?: string;
  dataAtRisk?: string;
  mitreTechniques?: string[];
  ip?: string;
  asn?: string;
  ports?: number[];
  protocol?: string;
  packetSize?: string;
  hexSample?: string;
  defenseStatus?: 'active_blocking' | 'monitoring' | 'quarantined' | 'uncontained';
}

export interface AttackTrajectory {
  id: string;
  sourceId: string;
  targetId: string;
  sourceName: string;
  targetName: string;
  sourceCoords: [number, number]; // [lng, lat]
  targetCoords: [number, number]; // [lng, lat]
  actorName: string;
  campaignTitle: string;
  severity: SeverityLevel;
  attackType: string;
  volume: string;
  mitreTactic: string;
  active: boolean;
  port?: number;
  protocol?: string;
  payloadSignature?: string;
  packetHex?: string;
  bandwidthMbps?: number;
}

export interface SubseaCable {
  id: string;
  name: string;
  landingPoints: [number, number][]; // [lng, lat]
  capacityTbps: number;
  status: 'operational' | 'congested_threat' | 'rerouted';
  description: string;
}

export interface MitreTechnique {
  id: string; // e.g. T1059.001
  name: string;
  tacticId: string;
  tacticName: string;
  description: string;
  subtechniques?: string[];
  detectionDifficulty: 'low' | 'moderate' | 'high';
  prevalenceScore: number; // 0-100
  activeActors: string[];
  mitigationSummary: string;
  platforms: string[];
  dataSources?: string[];
  permissionsRequired?: string[];
}

export interface MitreTactic {
  id: string; // e.g. TA0001
  name: string;
  shortName: string;
  description: string;
  techniques: MitreTechnique[];
}

export interface VulnerabilityCVE {
  cveId: string;
  title: string;
  cvssScore: number;
  cvssVector: string;
  epssScore: number; // e.g. 0.892 (89.2% probability of exploit)
  epssPercentile: number;
  cisaKev: boolean;
  weaponized: boolean;
  exploitedInTheWild: boolean;
  affectedProducts: string[];
  threatActorsUsing: string[];
  patchAvailable: boolean;
  publishedDate: string;
  advisoryUrl: string;
  summary: string;
  mitigationPlaybook: string;
}

export interface DetectionRule {
  id: string;
  title: string;
  type: 'YARA' | 'Sigma' | 'Snort' | 'Suricata';
  severity: SeverityLevel;
  author: string;
  targetThreat: string;
  targetTTP: string;
  ruleContent: string;
  dateCreated: string;
  description: string;
  status: 'production' | 'testing' | 'deprecated';
}

export interface ThreatReport {
  id: string;
  title: string;
  tlp: TlpLevel;
  date: string;
  executiveSummary: string;
  keyFindings: string[];
  recommendedActions: string[];
  iocs: string[];
  actors: string[];
  mitreCoverage: string[];
  sourceUrl?: string;
}

export interface ExtractedIOC {
  value: string;
  type: IOCType;
  confidence: number;
  context: string;
  category?: ThreatCategory;
  reputation?: 'malicious' | 'suspicious' | 'benign' | 'unknown';
}

export interface MitreMappingItem {
  tactic: string;
  techniqueId: string;
  techniqueName: string;
  justification: string;
}

export interface ContainmentStep {
  step: number;
  title: string;
  action: string;
  urgency: 'immediate' | 'high' | 'medium';
}

export interface AiAnalysisResult {
  verdict: 'MALICIOUS_CAMPAIGN' | 'SUSPICIOUS_ACTIVITY' | 'BENIGN_ANOMALY' | 'HIGH_RISK_EXPLOIT';
  riskScore: number; // 0-100
  threatCategory: ThreatCategory;
  identifiedActor?: string;
  confidenceLevel: number;
  executiveSummary: string;
  technicalAnalysis: string;
  identifiedIOCs: ExtractedIOC[];
  mitreAttackMapping: MitreMappingItem[];
  recommendedYaraRule?: string;
  recommendedSigmaRule?: string;
  containmentPlaybook: ContainmentStep[];
  blastRadiusEstimate: string;
  detectionSignaturesSummary: string;
}

export interface TelemetryMetrics {
  globalThreatLevel: 'SEVERE' | 'ELEVATED' | 'GUARDED' | 'LOW';
  activeAlertsCount: number;
  trackedIocsCount: number;
  monitoredActorsCount: number;
  weaponizedCvesCount: number;
  blockedAttacks24h: number;
  attacksOverTime: {
    timestamp: string;
    critical: number;
    high: number;
    blocked: number;
  }[];
  topTargetedSectors: {
    sector: string;
    attacks: number;
    percentage: number;
  }[];
  topSourceCountries: {
    country: string;
    code: string;
    count: number;
    flag: string;
  }[];
  attackVectorBreakdown: {
    vector: string;
    count: number;
    percentage: number;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  suggestedActions?: string[];
}

export type FeedProvider =
  | 'CISA AIS'
  | 'AlienVault OTX'
  | 'ThreatFox'
  | 'Shadowserver'
  | 'URLhaus'
  | 'SANS ISC'
  | 'vx-underground'
  | 'US-CERT'
  | 'abuse.ch Feodo';

export interface ThreatFeedItem {
  id: string;
  provider: FeedProvider;
  title: string;
  indicator: string;
  indicatorType: IOCType;
  threatType: ThreatCategory | string;
  severity: SeverityLevel;
  confidence: number;
  tlp: TlpLevel;
  timestamp: string;
  description: string;
  tags: string[];
  sourceUrl: string;
  isIngested?: boolean;
  rawPayload?: string;
}

export interface CustomFeedSource {
  id: string;
  name: string;
  url: string;
  format: 'TAXII 2.1' | 'STIX 2.1' | 'RSS/Atom' | 'JSON REST' | 'MISP';
  pollingIntervalMin: number;
  status: 'active' | 'syncing' | 'paused' | 'error';
  lastSync: string;
  indicatorsCount: number;
}

export type AnomalyCategory =
  | 'beaconing'
  | 'exfiltration_spike'
  | 'process_lineage'
  | 'privilege_escalation'
  | 'geo_impossible_travel'
  | 'living_off_the_land';

export interface BehavioralAnomaly {
  id: string;
  anomalyScore: number; // 0-100
  category: AnomalyCategory;
  title: string;
  affectedEntity: string;
  baselineNorm: string;
  observedDeviation: string;
  severity: SeverityLevel;
  confidence: number;
  status: 'investigating' | 'confirmed_threat' | 'benign_baseline' | 'suppressed';
  mitreTechnique: string;
  detectedAt: string;
  zScore: number;
  recommendedResponse: string;
  rawTelemetrySnippet?: string;
  analystNotes?: string;
}

export interface AnomalyAnalysisResult {
  threatStatus: 'MALICIOUS_OUTLIER' | 'SUSPICIOUS_ANOMALY' | 'BENIGN_DEVIATION';
  threatScore: number;
  category: AnomalyCategory;
  attributedTTP: string;
  killChainStage: string;
  aiExplanation: string;
  remediationPlaybook: string[];
  investigationQueries: {
    splunk?: string;
    kql?: string;
    elasticsearch?: string;
  };
}

export type AutoRefreshInterval = 0 | 5 | 10 | 30 | 60;

export interface ExecutiveBriefing {
  title: string;
  threatPosture: 'CRITICAL_HIGH_SURGE' | 'ELEVATED_PERSISTENT' | 'STABLE_MONITORED';
  defconLevel: string;
  executiveSummary: string;
  strategicThreatTrends: Array<{
    title: string;
    description: string;
    impact: string;
    severity: string;
  }>;
  targetedSectorImpacts: Array<{
    sector: string;
    riskLevel: string;
    dominantActor: string;
    primaryVector: string;
    defensiveAdvice: string;
  }>;
  activeCampaignSpotlight: {
    campaignName: string;
    adversary: string;
    vector: string;
    objective: string;
    containmentGuidance: string;
  };
  forwardLookingForecast: string[];
  tacticalPriorities: string[];
}

export interface VulnerabilityAsset {
  id: string;
  name: string;
  ip: string;
  assetType:
    | 'edge_gateway'
    | 'k8s_cluster'
    | 'database'
    | 'workstation'
    | 'cloud_vm'
    | 'ad_controller'
    | 'server'
    | 'cloud_instance'
    | 'web_app';
  environment: 'production' | 'dmz' | 'internal' | 'staging';
  criticality: 'critical' | 'high' | 'medium' | 'low';
  owner: string;
  location: string;
  os: string;
  vulnerabilitiesCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  riskScore: number; // 0-100
  lastScanned: string;
  complianceScore: number;
  status: 'secure' | 'warning' | 'critical_risk' | 'online' | 'active';
  installedSoftware: string[];
}

export interface VulnerabilityFinding {
  id: string;
  cveId: string;
  title: string;
  assetId: string;
  assetName: string;
  severity: SeverityLevel;
  cvssScore: number;
  epssScore: number;
  cisaKev: boolean;
  weaponized: boolean;
  riskAdjustedScore: number;
  discoveredDate: string;
  slaDueDate: string;
  slaStatus: 'on_track' | 'approaching_breach' | 'breached' | 'approaching_deadline';
  status: 'open' | 'in_progress' | 'in_remediation' | 'mitigated' | 'resolved' | 'risk_accepted';
  remediationType: 'vendor_patch' | 'configuration_change' | 'compensating_control' | 'waf_rule' | 'upgrade';
  remediationEffort: 'low' | 'medium' | 'high';
  affectedComponent: string;
  proofOfConcept: string;
  remediationGuidance: string;
  patchDetails?: {
    patchId: string;
    vendorKb: string;
    releaseDate: string;
    requiresReboot: boolean;
  };
}

export interface ScanJob {
  id: string;
  target: string;
  scanType: 'full_network' | 'cloud_posture' | 'credentialed_host' | 'web_application';
  status: 'running' | 'completed' | 'failed' | 'scheduled';
  startTime: string;
  duration: string;
  targetsScanned: number;
  findingsDiscovered: number;
  criticalCount: number;
}

export interface VulnerabilityAssessmentMetrics {
  totalVulnerabilities: number;
  criticalFindings: number;
  activeExploitable: number;
  cisaKevExposure: number;
  mttrDays: number;
  slaComplianceRate: number;
  scannedAssetsCount: number;
  remediationVelocity?: {
    week: string;
    discovered: number;
    remediated: number;
  }[];
  weeklyTrend?: {
    week: string;
    discovered: number;
    remediated: number;
  }[];
}

export interface VulnAiTriageResult {
  riskSummary: string;
  exploitFeasibility: string;
  prioritizedRemediationSteps: string[];
  compensatingControls: string[];
  automatedCliScript?: {
    bash?: string;
    powershell?: string;
  };
}
