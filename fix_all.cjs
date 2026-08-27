const fs = require('fs');
let content = fs.readFileSync('src/components/WorldThreatMapView.tsx', 'utf-8');

const returnIndex = content.indexOf('return (');
if (returnIndex === -1) process.exit(1);

const beforeReturn = content.slice(0, returnIndex);

const correctJSX = `return (
    <div className="space-y-4 text-slate-900 font-sans" id="world-threat-map-view">
      {/* 1. Header */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-700 to-indigo-800 text-white flex items-center justify-center shadow-md shrink-0">
            <Globe2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Global Threat Sphere & Live Geodesic Incursion Map
              </h1>
              <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs font-mono font-bold border border-red-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                NORAD
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono truncate max-w-[400px]">
              Real-time state-sponsored adversary origins & targeted infrastructure
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {onExportSTIX && (
            <button
              onClick={onExportSTIX}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 transition-colors"
              title="Export STIX 2.1"
            >
              <FileDown className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Notification Alert on Action */}
      {containedSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{containedSuccessMessage}</span>
          </div>
          <button onClick={() => setContainedSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Layout Grid: Map on Left, Intelligence Boxes on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Map & Layers */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          
          {/* LAYERS (Directly Above Map) */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 shadow-sm">
            <span className="text-[11px] font-mono font-bold text-slate-500 flex items-center gap-1 mr-1 ml-1">
              <Layers className="w-4 h-4 text-slate-400" />
              LAYERS:
            </span>
            <button onClick={() => setShowArcs(!showArcs)} className={\`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all \${showArcs ? 'bg-red-50 text-red-700 border-red-200 font-semibold shadow-xs' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}\`}>
              ⚡ Arcs ({filteredTrajectories.length})
            </button>
            <button onClick={() => setShowOrigins(!showOrigins)} className={\`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all \${showOrigins ? 'bg-red-50 text-red-700 border-red-200 font-semibold shadow-xs' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}\`}>
              ☠️ Origins (5)
            </button>
            <button onClick={() => setShowVictims(!showVictims)} className={\`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all \${showVictims ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold shadow-xs' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}\`}>
              🎯 Targets (12)
            </button>
            <button onClick={() => setShowCables(!showCables)} className={\`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all \${showCables ? 'bg-cyan-50 text-cyan-700 border-cyan-200 font-semibold shadow-xs' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}\`}>
              🌐 Fiber
            </button>
            <button onClick={() => setShowTerminator(!showTerminator)} className={\`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all \${showTerminator ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold shadow-xs' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}\`}>
              🌗 Day/Night
            </button>
            <button onClick={() => setShowRadarSweep(!showRadarSweep)} className={\`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all \${showRadarSweep ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold shadow-xs' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}\`}>
              📡 Beacons
            </button>
          </div>

          {/* MAP ENGINE */}
          <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md h-[700px]">
            <div className="absolute inset-0 z-0 bg-slate-900">
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
            </div>
            {/* Top-Right: Tactical Metrics */}
            <div className="absolute top-4 right-4 z-30 pointer-events-none">
              <div className="flex flex-wrap items-center gap-3 lg:gap-5 shrink-0 bg-white/90 backdrop-blur-md border border-slate-200/50 p-3 rounded-xl shadow-lg pointer-events-auto">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500"><Flame className="w-3.5 h-3.5 text-rose-500" /> Incursions</div>
                  <div className="text-base font-bold font-mono text-slate-900">98.4k <span className="text-xs text-rose-600">+18%</span></div>
                </div>
                <div className="h-8 w-px bg-slate-200/50 hidden sm:block"></div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500"><Radio className="w-3.5 h-3.5 text-red-600" /> APT Hubs</div>
                  <div className="text-base font-bold font-mono text-slate-900">5 <span className="text-xs text-red-700">100% Tracked</span></div>
                </div>
                <div className="h-8 w-px bg-slate-200/50 hidden sm:block"></div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500"><Target className="w-3.5 h-3.5 text-emerald-600" /> Victims</div>
                  <div className="text-base font-bold font-mono text-slate-900">12 <span className="text-xs text-emerald-700">3 Contained</span></div>
                </div>
                <div className="h-8 w-px bg-slate-200/50 hidden sm:block"></div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500"><Cable className="w-3.5 h-3.5 text-cyan-600" /> Subsea</div>
                  <div className="text-base font-bold font-mono text-slate-900">5 <span className="text-xs text-cyan-700">1 Alert</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Filters, Live Decryption, Forensic Dossier */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* FILTERS */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col gap-3">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium text-[11px]">Campaign:</span>
                <select
                  value={activeCampaignFilter}
                  onChange={(e) => setActiveCampaignFilter(e.target.value)}
                  className="w-44 px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-mono text-slate-800 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="all">All Campaigns</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title.length > 25 ? \`\${c.title.slice(0, 25)}...\` : c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium text-[11px]">Sector:</span>
                <select
                  value={activeSectorFilter}
                  onChange={(e) => setActiveSectorFilter(e.target.value)}
                  className="w-44 px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-mono text-slate-800 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="all">All Sectors</option>
                  <option value="Government & Defense">Gov/Defense</option>
                  <option value="Financial Services">Financial</option>
                  <option value="Critical Infrastructure & Energy">Energy/SCADA</option>
                  <option value="Healthcare & Life Sciences">Healthcare</option>
                  <option value="Telecommunications">Telecom</option>
                  <option value="Technology & Cloud">Tech/Cloud</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium text-[11px]">Severity:</span>
                <select
                  value={activeSeverityFilter}
                  onChange={(e) => setActiveSeverityFilter(e.target.value)}
                  className="w-44 px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-mono text-slate-800 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="all">All Severity</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                </select>
              </div>
            </div>

            <div className="relative w-full mt-1 border-t border-slate-200 pt-3">
              <Search className="absolute left-2.5 top-[22px] w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search IP, CVE, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-mono placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
              />
            </div>
          </div>

          {/* LIVE DECRYPTION STREAM */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-md flex flex-col font-mono h-[260px]">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Live Decryption Stream
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 font-bold shadow-xs">APT</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold shadow-xs">VICTIM</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 py-2 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-300">
              {terminalPackets.map((pkt) => (
                <div key={pkt.id} className="p-2 rounded-md bg-white border border-slate-200 hover:border-slate-300 transition-colors space-y-1 shadow-xs">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-indigo-600 font-bold">{pkt.timestamp}</span>
                    <span className={\`px-1.5 py-0.5 rounded font-bold uppercase \${pkt.severity === 'critical' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}\`}>
                      {pkt.severity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-red-700 font-bold max-w-[90px] truncate">{pkt.source}</span>
                      <span className="text-slate-400 font-bold">➔</span>
                      <span className="text-emerald-700 font-bold max-w-[90px] truncate">{pkt.target}</span>
                    </div>
                    <span className="text-slate-500 font-semibold truncate ml-2 text-[10px]">{pkt.mitre}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
              <span className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5 text-indigo-500" /> ISAC Telemetry L4</span>
              <span className="text-indigo-600 font-bold">20 FPS</span>
            </div>
          </div>

          {/* FORENSIC DOSSIER */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-md flex flex-col flex-1 min-h-[300px] overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-900 text-cyan-400">
                  <Crosshair className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 truncate max-w-[180px]">
                    Forensic Dossier
                  </h3>
                  <span className="text-xs text-slate-500 font-mono block truncate max-w-[180px]">
                    {selectedNode ? \`\${selectedNode.city}, \${selectedNode.country}\` : 'No Node Selected'}
                  </span>
                </div>
              </div>
              {selectedNode && (
                <span className={\`px-2 py-1 rounded-md text-xs font-mono font-bold border \${getSeverityBadge(selectedNode.severity)} uppercase shrink-0\`}>
                  {selectedNode.severity}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-3 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-200">
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1 shadow-xs">
                    <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-emerald-600" /> Target:
                    </span>
                    <div className="font-sans font-bold text-emerald-950 text-xs truncate">
                      {selectedNode.victimOrg || selectedNode.name}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-red-50/70 border border-red-200 space-y-1 shadow-xs">
                    <span className="text-[11px] text-red-700 font-bold flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 text-red-600" /> Actor:
                    </span>
                    <div className="font-sans font-bold text-red-700 text-xs truncate flex items-center justify-between gap-1">
                      <span>{selectedNode.actorName || 'Volt Typhoon'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-1.5 border-b border-slate-100">
                    <span className="flex items-center gap-1 text-indigo-600 font-bold">
                      <Terminal className="w-3.5 h-3.5" /> Ingress Telemetry
                    </span>
                    <span className="text-emerald-600 font-semibold">{selectedNode.incursionRate || '14.2k pkt/s'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-slate-500 block mb-0.5">IP:</span><span className="text-slate-900 font-bold block truncate">{selectedNode.ip || '198.51.100.42'}</span></div>
                    <div><span className="text-slate-500 block mb-0.5">ASN:</span><span className="text-slate-800 block truncate">{selectedNode.asn || 'AS721'}</span></div>
                    <div className="col-span-2"><span className="text-slate-500 block mb-0.5">Ports:</span><span className="text-indigo-600 font-medium block truncate">{selectedNode.ports ? selectedNode.ports.join(', ') : '443, 22'}</span></div>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-500 font-bold block uppercase tracking-wider">Active IOCs:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedNode.iocs || ['198.51.100.42', 'df:42:ab']).map((ioc) => (
                      <span key={ioc} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono border border-slate-300 shadow-xs cursor-pointer hover:bg-slate-200">
                        {ioc}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSimulateBlock(selectedNode.id)}
                    disabled={selectedNode.defenseStatus === 'active_blocking'}
                    className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold font-mono transition-colors shadow-xs \${
                      selectedNode.defenseStatus === 'active_blocking'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                        : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                    }\`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>{selectedNode.defenseStatus === 'active_blocking' ? 'Blocked' : 'Block Port'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-slate-400 font-mono text-[11px]">
                <Crosshair className="w-8 h-8 text-slate-300 mb-2" />
                Click any node on the map to load real-time intelligence.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default WorldThreatMapView;
`;

fs.writeFileSync('src/components/WorldThreatMapView.tsx', beforeReturn + correctJSX);
