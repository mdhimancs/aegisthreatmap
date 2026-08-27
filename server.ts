import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Lazy/Safe initialization for Google GenAI
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// ---------------- CTI API ENDPOINTS ----------------

// 1. Threat & Forensic Artifact Analysis
app.post('/api/threat-intel/analyze', async (req, res) => {
  try {
    const { artifactText, artifactType, context } = req.body;
    if (!artifactText) {
      return res.status(400).json({ error: 'Artifact text or telemetry payload is required.' });
    }

    const ai = getAI();
    const prompt = `You are a Principal Cyber Threat Intelligence (CTI) & DFIR Analyst.
Analyze the following security artifact, raw log, network dump, malware summary, or suspicious alert.
Artifact Type: ${artifactType || 'security_log_or_alert'}
Context: ${context || 'Enterprise Network Security Investigation'}

Input Artifact Data:
\`\`\`
${artifactText}
\`\`\`

Perform an exhaustive forensic CTI evaluation and return a structured JSON response matching the following schema.
Be realistic, precise, and actionable for a SOC/CTI team:
1. Verdict: Must be one of 'MALICIOUS_CAMPAIGN', 'SUSPICIOUS_ACTIVITY', 'BENIGN_ANOMALY', or 'HIGH_RISK_EXPLOIT'.
2. Risk Score: 0 to 100.
3. Threat Category: e.g. 'ransomware', 'c2', 'infostealer', 'phishing', 'apt', 'botnet', 'loader', 'rootkit', 'exploit'.
4. Identified Actor (if recognizable pattern matches APT28, APT29, Lazarus, Volt Typhoon, LockBit, BlackCat, etc. or 'Unknown Adversary').
5. Confidence Level: 0 to 100.
6. Executive Summary: 2-3 concise sentences explaining the threat, intent, and impact.
7. Strategic Motivation: Detailed analysis of the adversary's primary goal (e.g., 'Regional Espionage', 'Financial Sabotage', 'Intellectual Property Theft', 'Infrastructure Pre-positioning').
8. Geopolitical Context: 2-3 paragraphs of long-form analysis explaining the regional significance, geopolitical tensions, and historical conflict context driving this specific attack.
9. Strategic Objectives: Array of 3-4 long-term goals this adversary is likely pursuing through this campaign.
10. Technical Analysis: Deep dive into the mechanics (execution flow, lateral movement vectors, persistence mechanisms, payload delivery).
11. Identified IOCs: Array of extracted IOCs (IP, domain, hash, URL, CVE, wallet) with value, type, confidence (0-100), context, category, reputation ('malicious' | 'suspicious' | 'benign').
12. MITRE ATT&CK Mapping: Array of technique mappings with tactic name, techniqueId (e.g. T1059.001), techniqueName, and justification.
13. Recommended YARA Rule: A fully valid, syntactically correct YARA rule targeting the strings/patterns in this threat.
14. Recommended Sigma Rule: A fully valid YAML-formatted Sigma detection rule.
15. Containment Playbook: Array of prioritized step-by-step incident containment actions with step number, title, action details, and urgency ('immediate' | 'high' | 'medium').
16. Blast Radius Estimate: Estimated potential scope of compromise (e.g. "Domain Controller compromise risk high, active session token theft").
17. Detection Signatures Summary: Key hunting indicators and behavioral alerts for SIEM/EDR.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        verdict: {
          type: Type.STRING,
          enum: ['MALICIOUS_CAMPAIGN', 'SUSPICIOUS_ACTIVITY', 'BENIGN_ANOMALY', 'HIGH_RISK_EXPLOIT']
        },
        riskScore: { type: Type.NUMBER },
        threatCategory: { type: Type.STRING },
        identifiedActor: { type: Type.STRING },
        confidenceLevel: { type: Type.NUMBER },
        executiveSummary: { type: Type.STRING },
        strategicMotivation: { type: Type.STRING },
        geopoliticalContext: { type: Type.STRING },
        strategicObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
        technicalAnalysis: { type: Type.STRING },
        identifiedIOCs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              value: { type: Type.STRING },
              type: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              context: { type: Type.STRING },
              category: { type: Type.STRING },
              reputation: { type: Type.STRING }
            },
            required: ['value', 'type', 'confidence', 'context']
          }
        },
        mitreAttackMapping: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              tactic: { type: Type.STRING },
              techniqueId: { type: Type.STRING },
              techniqueName: { type: Type.STRING },
              justification: { type: Type.STRING }
            },
            required: ['tactic', 'techniqueId', 'techniqueName', 'justification']
          }
        },
        recommendedYaraRule: { type: Type.STRING },
        recommendedSigmaRule: { type: Type.STRING },
        containmentPlaybook: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              step: { type: Type.NUMBER },
              title: { type: Type.STRING },
              action: { type: Type.STRING },
              urgency: { type: Type.STRING }
            },
            required: ['step', 'title', 'action', 'urgency']
          }
        },
        blastRadiusEstimate: { type: Type.STRING },
        detectionSignaturesSummary: { type: Type.STRING }
      },
      required: [
        'verdict',
        'riskScore',
        'threatCategory',
        'confidenceLevel',
        'executiveSummary',
        'technicalAnalysis',
        'identifiedIOCs',
        'mitreAttackMapping',
        'containmentPlaybook',
        'blastRadiusEstimate',
        'detectionSignaturesSummary'
      ]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/threat-intel/analyze:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze security artifact.' });
  }
});

// 2. IOC Deep Enrichment & Attribution
app.post('/api/threat-intel/ioc-enrich', async (req, res) => {
  try {
    const { iocValue, iocType } = req.body;
    if (!iocValue) {
      return res.status(400).json({ error: 'IOC value is required.' });
    }

    const ai = getAI();
    const prompt = `You are a Threat Intelligence Enrichment Engine. Enrich the following Indicator of Compromise (IOC).
IOC: "${iocValue}"
IOC Type: "${iocType || 'auto-detect'}"

Provide deep intelligence enrichment, threat actor attribution, known malware families, passive DNS records, WHOIS registry simulation, risk score (0-100), detection ratios (e.g. 58/72 engines flagging), MITRE techniques, and actionable containment recommendations.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        value: { type: Type.STRING },
        type: { type: Type.STRING },
        category: { type: Type.STRING },
        severity: { type: Type.STRING, enum: ['critical', 'high', 'medium', 'low', 'info'] },
        confidenceScore: { type: Type.NUMBER },
        riskScore: { type: Type.NUMBER },
        tlp: { type: Type.STRING },
        threatActor: { type: Type.STRING },
        malwareFamily: { type: Type.STRING },
        mitreTechniques: { type: Type.ARRAY, items: { type: Type.STRING } },
        country: { type: Type.STRING },
        countryCode: { type: Type.STRING },
        asn: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        detectionStats: {
          type: Type.OBJECT,
          properties: {
            malicious: { type: Type.NUMBER },
            suspicious: { type: Type.NUMBER },
            harmless: { type: Type.NUMBER },
            total: { type: Type.NUMBER }
          },
          required: ['malicious', 'suspicious', 'harmless', 'total']
        },
        description: { type: Type.STRING },
        passiveDns: { type: Type.ARRAY, items: { type: Type.STRING } },
        whoisRegistrar: { type: Type.STRING },
        recommendedAction: { type: Type.STRING }
      },
      required: [
        'value',
        'type',
        'category',
        'severity',
        'confidenceScore',
        'riskScore',
        'detectionStats',
        'description',
        'recommendedAction'
      ]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/threat-intel/ioc-enrich:', error);
    res.status(500).json({ error: error.message || 'Failed to enrich IOC.' });
  }
});

// 3. Rule Synthesis (YARA, Sigma, Snort)
app.post('/api/threat-intel/generate-rule', async (req, res) => {
  try {
    const { ruleType, threatName, description, targetArtifacts, ttp } = req.body;
    if (!threatName) {
      return res.status(400).json({ error: 'Threat name is required.' });
    }

    const ai = getAI();
    const prompt = `You are a Senior Detection Engineer and Threat Hunter.
Synthesize an enterprise-grade detection rule.
Rule Format: ${ruleType || 'YARA'} (Can be YARA, Sigma, or Snort/Suricata)
Target Threat / Malware: ${threatName}
Description: ${description || 'Detects malicious behaviors and IOCs'}
Target TTP: ${ttp || 'T1059 Command and Scripting Interpreter'}
Target Artifacts / Indicators: ${targetArtifacts || 'Suspicious payload strings and network patterns'}

Return a JSON with:
1. title: Clean descriptive title
2. type: '${ruleType || 'YARA'}'
3. severity: 'critical' | 'high' | 'medium' | 'low'
4. author: 'CTI AI Detection Studio'
5. targetThreat: '${threatName}'
6. targetTTP: '${ttp || 'T1059'}'
7. ruleContent: Complete, valid, properly formatted rule code with syntax, metadata, strings, and conditions.
8. description: Detailed explanation of what the rule detects and false positive avoidance strategies.
9. falsePositives: Array of potential benign scenarios to look out for.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        type: { type: Type.STRING },
        severity: { type: Type.STRING, enum: ['critical', 'high', 'medium', 'low', 'info'] },
        author: { type: Type.STRING },
        targetThreat: { type: Type.STRING },
        targetTTP: { type: Type.STRING },
        ruleContent: { type: Type.STRING },
        description: { type: Type.STRING },
        falsePositives: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['title', 'type', 'severity', 'ruleContent', 'description']
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/threat-intel/generate-rule:', error);
    res.status(500).json({ error: error.message || 'Failed to generate detection rule.' });
  }
});

// 4. CTI Interactive Copilot Chat
app.post('/api/threat-intel/chat', async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const ai = getAI();
    const historyText = Array.isArray(conversationHistory)
      ? conversationHistory.map((m: any) => `${m.sender.toUpperCase()}: ${m.text}`).join('\n')
      : '';

    const prompt = `You are "Aegis Intelligence AI", an expert Cyber Threat Intelligence (CTI) Copilot and Principal Incident Responder.
You possess world-class knowledge of APT adversaries (APT28, APT29, Lazarus, Volt Typhoon, Sandworm, LockBit, BlackBasta), Diamond Model of Intrusion, MITRE ATT&CK matrix, EPSS/CVSS vulnerability metrics, YARA/Sigma hunting, malware analysis, C2 frameworks (Cobalt Strike, Sliver, Brute Ratel), and CISA KEV catalogs.

Conversation History:
${historyText}

User Query:
${message}

Respond with deep technical clarity, well-structured markdown (bullet points, code snippets, threat matrices, TTP tags), and provide 3 concrete 'suggestedFollowUps' as a JSON response.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        responseMarkdown: { type: Type.STRING },
        suggestedFollowUps: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['responseMarkdown', 'suggestedFollowUps']
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/threat-intel/chat:', error);
    res.status(500).json({ error: error.message || 'Failed to process chat query.' });
  }
});

// 5. CVE Weaponization & Exploitation Assessment
app.post('/api/threat-intel/cve-eval', async (req, res) => {
  try {
    const { cveId } = req.body;
    if (!cveId) {
      return res.status(400).json({ error: 'CVE ID is required.' });
    }

    const ai = getAI();
    const prompt = `Evaluate the vulnerability "${cveId}". Provide full CVSS v3.1, EPSS probability, CISA KEV status, known exploited in-the-wild threat actors, affected technologies, attack vectors, and step-by-step mitigation advice.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        cveId: { type: Type.STRING },
        title: { type: Type.STRING },
        cvssScore: { type: Type.NUMBER },
        cvssVector: { type: Type.STRING },
        epssScore: { type: Type.NUMBER },
        epssPercentile: { type: Type.NUMBER },
        cisaKev: { type: Type.BOOLEAN },
        weaponized: { type: Type.BOOLEAN },
        exploitedInTheWild: { type: Type.BOOLEAN },
        affectedProducts: { type: Type.ARRAY, items: { type: Type.STRING } },
        threatActorsUsing: { type: Type.ARRAY, items: { type: Type.STRING } },
        patchAvailable: { type: Type.BOOLEAN },
        publishedDate: { type: Type.STRING },
        advisoryUrl: { type: Type.STRING },
        summary: { type: Type.STRING },
        mitigationPlaybook: { type: Type.STRING }
      },
      required: [
        'cveId',
        'title',
        'cvssScore',
        'epssScore',
        'cisaKev',
        'weaponized',
        'affectedProducts',
        'summary',
        'mitigationPlaybook'
      ]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/threat-intel/cve-eval:', error);
    res.status(500).json({ error: error.message || 'Failed to evaluate CVE.' });
  }
});

// 6. Behavioral Anomaly Assessment Engine
app.post('/api/threat-intel/anomaly-eval', async (req, res) => {
  try {
    const { anomaly } = req.body;
    if (!anomaly) {
      return res.status(400).json({ error: 'Anomaly payload is required.' });
    }

    const ai = getAI();
    const prompt = `You are a Principal Threat Hunter and Security Analytics Specialist.
Evaluate the following behavioral anomaly and telemetry outlier:
Title: ${anomaly.title}
Category: ${anomaly.category}
Affected Entity: ${anomaly.affectedEntity}
Baseline Norm: ${anomaly.baselineNorm}
Observed Deviation: ${anomaly.observedDeviation}
Z-Score: ${anomaly.zScore}
Raw Snippet: ${anomaly.rawTelemetrySnippet || 'N/A'}

Perform an AI outlier evaluation:
1. Threat Status: 'MALICIOUS_OUTLIER', 'SUSPICIOUS_ANOMALY', or 'BENIGN_DEVIATION'
2. Threat Score: 0 to 100
3. Attributed TTP: e.g. T1071.001 Web Protocols / Beaconing
4. Kill Chain Stage: e.g. Command and Control / Exfiltration / Lateral Movement
5. AI Explanation: 2-3 concise paragraphs analyzing the deviation mechanics and whether this indicates an active breach or benign administrative spike.
6. Remediation Playbook: 3-4 immediate containment actions.
7. Investigation Queries: SPL (Splunk), KQL (Microsoft Defender / Sentinel), and Elasticsearch queries to hunt for related activity.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        threatStatus: {
          type: Type.STRING,
          enum: ['MALICIOUS_OUTLIER', 'SUSPICIOUS_ANOMALY', 'BENIGN_DEVIATION']
        },
        threatScore: { type: Type.NUMBER },
        category: { type: Type.STRING },
        attributedTTP: { type: Type.STRING },
        killChainStage: { type: Type.STRING },
        aiExplanation: { type: Type.STRING },
        remediationPlaybook: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        investigationQueries: {
          type: Type.OBJECT,
          properties: {
            splunk: { type: Type.STRING },
            kql: { type: Type.STRING },
            elasticsearch: { type: Type.STRING }
          }
        }
      },
      required: [
        'threatStatus',
        'threatScore',
        'category',
        'attributedTTP',
        'killChainStage',
        'aiExplanation',
        'remediationPlaybook',
        'investigationQueries'
      ]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/threat-intel/anomaly-eval:', error);
    res.status(500).json({ error: error.message || 'Failed to evaluate anomaly.' });
  }
});

// 7. Executive CTI Threat Landscape Briefing Generator
app.post('/api/threat-intel/executive-briefing', async (req, res) => {
  try {
    const { region, sector, focusActor, timeRange } = req.body;

    const ai = getAI();
    const prompt = `You are the Chief Cyber Threat Intelligence Officer (CCTIO) synthesizing an executive intelligence briefing.
Target Region: ${region || 'Global'}
Primary Sector Focus: ${sector || 'Cross-Industry / Critical Infrastructure'}
Adversary Focus: ${focusActor || 'Active State-Sponsored & Tier-1 Cybercrime Syndicates'}
Time Horizon: ${timeRange || 'Last 30 Days & Forward Outlook'}

Produce an authoritative, highly strategic CTI briefing structured in JSON:
1. title: Sharp executive title (e.g. "Global CTI Briefing: Nation-State Infrastructure Pre-positioning & RaaS Evolutions")
2. threatPosture: 'CRITICAL_HIGH_SURGE' | 'ELEVATED_PERSISTENT' | 'STABLE_MONITORED'
3. defconLevel: e.g. "DEFCON 2"
4. executiveSummary: 3-4 sentence comprehensive strategic summary for CISOs and board members.
5. strategicThreatTrends: Array of 3-4 top threat landscape trends (title, description, impact, severity).
6. targetedSectorImpacts: Array of 3-4 sectors with risk level, dominant threat actor, primary vector, and defensive posture advice.
7. activeCampaignSpotlight: Object with campaignName, adversary, vector, objective, and containmentGuidance.
8. forwardLookingForecast: 2-3 strategic forecast predictions for the next 90 days (e.g. zero-day weaponization speed, cloud identity attacks).
9. tacticalPriorities: Array of 4 prioritized strategic actions for SOC and CTI teams.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        threatPosture: {
          type: Type.STRING,
          enum: ['CRITICAL_HIGH_SURGE', 'ELEVATED_PERSISTENT', 'STABLE_MONITORED']
        },
        defconLevel: { type: Type.STRING },
        executiveSummary: { type: Type.STRING },
        strategicThreatTrends: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              impact: { type: Type.STRING },
              severity: { type: Type.STRING }
            },
            required: ['title', 'description', 'impact', 'severity']
          }
        },
        targetedSectorImpacts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sector: { type: Type.STRING },
              riskLevel: { type: Type.STRING },
              dominantActor: { type: Type.STRING },
              primaryVector: { type: Type.STRING },
              defensiveAdvice: { type: Type.STRING }
            },
            required: ['sector', 'riskLevel', 'dominantActor', 'primaryVector', 'defensiveAdvice']
          }
        },
        activeCampaignSpotlight: {
          type: Type.OBJECT,
          properties: {
            campaignName: { type: Type.STRING },
            adversary: { type: Type.STRING },
            vector: { type: Type.STRING },
            objective: { type: Type.STRING },
            containmentGuidance: { type: Type.STRING }
          },
          required: ['campaignName', 'adversary', 'vector', 'objective', 'containmentGuidance']
        },
        forwardLookingForecast: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        tacticalPriorities: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: [
        'title',
        'threatPosture',
        'defconLevel',
        'executiveSummary',
        'strategicThreatTrends',
        'targetedSectorImpacts',
        'activeCampaignSpotlight',
        'forwardLookingForecast',
        'tacticalPriorities'
      ]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/threat-intel/executive-briefing:', error);
    res.status(500).json({ error: error.message || 'Failed to generate executive briefing.' });
  }
});

// Endpoint: AI-Assisted Vulnerability Assessment & Remediation Advisor
app.post('/api/threat-intel/vuln-triage-ai', async (req, res) => {
  try {
    const ai = getAI();
    const { finding, asset } = req.body;

    if (!finding) {
      return res.status(400).json({ error: 'Finding payload is required.' });
    }

    const prompt = `You are a Principal Vulnerability Research & SecOps Engineer specializing in Risk-Based Vulnerability Management (RBVM), Exploit Prediction Scoring (EPSS), and Zero-Day triage.

Perform an authoritative, tactical vulnerability assessment and actionable remediation plan for the following finding on this asset:

[VULNERABILITY FINDING]
- CVE ID: ${finding.cveId}
- Title: ${finding.title}
- CVSS v3.1: ${finding.cvssScore}
- EPSS Probability: ${(finding.epssScore * 100).toFixed(1)}%
- CISA KEV (Known Exploited Vulnerability): ${finding.cisaKev ? 'YES - Actively Exploited' : 'No'}
- Weaponization: ${finding.weaponized ? 'Public PoC / In-the-Wild Exploit Available' : 'Theoretical'}
- Affected Component: ${finding.affectedComponent || 'Core application binary'}
- Proof of Concept / Incursion Vector: ${finding.proofOfConcept || 'Standard remote exploitation'}

[AFFECTED ASSET CONTEXT]
- Asset Name: ${asset ? asset.name : finding.assetName}
- IP / Target: ${asset ? asset.ip : 'Internal network'}
- Asset Criticality: ${asset ? asset.criticality : 'Critical'}
- Environment: ${asset ? asset.environment : 'Production'}
- Operating System / Stack: ${asset ? asset.os : 'Linux/Windows'}
- Location: ${asset ? asset.location : 'Corporate Datacenter'}

Generate a structured JSON response with:
1. "riskSummary": Concise, razor-sharp technical summary of the actual business risk considering asset exposure and in-the-wild exploit maturity.
2. "exploitFeasibility": One of "IMMINENT_CRITICAL", "ELEVATED_ACTIVE", or "THEORETICAL_LOW".
3. "businessImpactRating": Impact description on data confidentiality, operational uptime, and lateral movement potential.
4. "prioritizedRemediationSteps": Array of 3-5 concrete, step-by-step technical patching / upgrade actions.
5. "compensatingControls": Array of 2-4 immediate temporary workarounds / WAF / firewall / configuration rules to block exploit before full patch reboot.
6. "patchDeploymentRisks": Risk of service disruption, dependency breakage, or downtime during patch application.
7. "automatedCliScript": Object containing "bash" and "powershell" command-line scripts to verify patch status or apply immediate mitigation.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        riskSummary: { type: Type.STRING },
        exploitFeasibility: {
          type: Type.STRING,
          enum: ['IMMINENT_CRITICAL', 'ELEVATED_ACTIVE', 'THEORETICAL_LOW']
        },
        businessImpactRating: { type: Type.STRING },
        prioritizedRemediationSteps: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        compensatingControls: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        patchDeploymentRisks: { type: Type.STRING },
        automatedCliScript: {
          type: Type.OBJECT,
          properties: {
            bash: { type: Type.STRING },
            powershell: { type: Type.STRING }
          }
        }
      },
      required: [
        'riskSummary',
        'exploitFeasibility',
        'businessImpactRating',
        'prioritizedRemediationSteps',
        'compensatingControls',
        'patchDeploymentRisks'
      ]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/threat-intel/vuln-triage-ai:', error);
    res.status(500).json({ error: error.message || 'Failed to triage vulnerability finding.' });
  }
});


// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Threat Intelligence Platform running on http://localhost:${PORT}`);
  });
}

startServer();
