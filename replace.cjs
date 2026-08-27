const fs = require('fs');
const content = fs.readFileSync('src/components/WorldThreatMapView.tsx', 'utf-8');

const startMarker = '{/* Bottom Row: Layer Toggles, Filters & Search Bar */}';
const endMarker = '{/* 7. Dedicated Tightly-Packed Active APT & Victim Telemetry Table */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log('Markers not found', {startIndex, endIndex});
  process.exit(1);
}

const before = content.slice(0, startIndex);
const after = content.slice(endIndex);

const newLayout = `
      {/* Main Layout Grid: Map on Left, Intelligence Boxes on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start mt-4">
        
        {/* LEFT COLUMN: Map & Layers */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          
          {/* LAYERS (Directly Above Map) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-slate-500 flex items-center gap-1 mr-1">
              <Layers className="w-4 h-4 text-slate-400" />
              LAYERS:
            </span>
            <button onClick={() => setShowArcs(!showArcs)} className={\`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all \${showArcs ? 'bg-red-50 text-red-700 border-red-200 font-semibold' : 'bg-slate-50 text-slate-500 border-slate-200'}\`}>
              ⚡ Arcs ({filteredTrajectories.length})
            </button>
            <button onClick={() => setShowOrigins(!showOrigins)} className={\`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all \${showOrigins ? 'bg-red-50 text-red-700 border-red-200 font-semibold' : 'bg-slate-50 text-slate-500 border-slate-200'}\`}>
              ☠️ Origins (5)
            </button>
            <button onClick={() => setShowVictims(!showVictims)} className={\`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all \${showVictims ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold' : 'bg-slate-50 text-slate-500 border-slate-200'}\`}>
              🎯 Targets (12)
            </button>
            <button onClick={() => setShowCables(!showCables)} className={\`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all \${showCables ? 'bg-cyan-50 text-cyan-700 border-cyan-200 font-semibold' : 'bg-slate-50 text-slate-500 border-slate-200'}\`}>
              🌐 Fiber
            </button>
            <button onClick={() => setShowTerminator(!showTerminator)} className={\`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all \${showTerminator ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold' : 'bg-slate-50 text-slate-500 border-slate-200'}\`}>
              🌗 Day/Night
            </button>
            <button onClick={() => setShowRadarSweep(!showRadarSweep)} className={\`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all \${showRadarSweep ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold' : 'bg-slate-50 text-slate-500 border-slate-200'}\`}>
              📡 Beacons
            </button>
          </div>

          {/* MAP ENGINE */}
          <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md h-[700px]">
            <div className="absolute inset-0 z-0">
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
            {/* Top-Right: Tactical Metrics (Total Incursions) */}
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
          
          {/* FILTERS (Campaigns, Sectors) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col gap-3">
            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-indigo-500" /> Intelligence Filters
            </h3>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium text-[11px]">Campaign:</span>
                <select
                  value={activeCampaignFilter}
                  onChange={(e) => setActiveCampaignFilter(e.target.value)}
                  className="w-40 px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-mono text-slate-800 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="all">All Campaigns</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title.length > 20 ? \`\${c.title.slice(0, 20)}...\` : c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium text-[11px]">Sector:</span>
                <select
                  value={activeSectorFilter}
                  onChange={(e) => setActiveSectorFilter(e.target.value)}
                  className="w-40 px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-mono text-slate-800 focus:outline-hidden focus:border-indigo-500"
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
                  className="w-40 px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-mono text-slate-800 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="all">All Severity</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                </select>
              </div>
            </div>

            <div className="relative w-full mt-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search IP, CVE, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-mono placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* LIVE DECRYPTION STREAM */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-md flex flex-col font-mono h-[240px]">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Live Decryption Stream
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 font-bold">APT</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold">VICTIM</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 py-1.5 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-300">
              {terminalPackets.map((pkt) => (
                <div key={pkt.id} className="p-1.5 rounded-md bg-white border border-slate-200 hover:border-slate-300 transition-colors space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-indigo-600 font-bold">{pkt.timestamp}</span>
                    <span className={\`px-1 rounded font-bold uppercase \${pkt.severity === 'critical' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}\`}>
                      {pkt.severity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1 truncate">
                      <span className="text-red-700 font-bold max-w-[80px] truncate">{pkt.source}</span>
                      <span className="text-slate-400">➔</span>
                      <span className="text-emerald-700 font-bold max-w-[80px] truncate">{pkt.target}</span>
                    </div>
                    <span className="text-slate-500 font-semibold truncate ml-2 text-[10px]">{pkt.mitre}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
              <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-indigo-500" /> ISAC Telemetry</span>
              <span className="text-indigo-600 font-bold">20 FPS</span>
            </div>
          </div>

          {/* FORENSIC DOSSIER */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-md flex flex-col h-[340px] overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-900 text-cyan-400">
                  <Crosshair className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 truncate max-w-[150px]">
                    Forensic Dossier
                  </h3>
                  <span className="text-xs text-slate-500 font-mono block truncate max-w-[150px]">
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
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-2 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-200">
                {/* Target and Actor */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1">
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-emerald-600" /> Target:
                    </span>
                    <div className="font-sans font-bold text-emerald-950 text-xs truncate">
                      {selectedNode.victimOrg || selectedNode.name}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-red-50/70 border border-red-200 space-y-1">
                    <span className="text-xs text-red-700 font-bold flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 text-red-600" /> Actor:
                    </span>
                    <div className="font-sans font-bold text-red-700 text-xs truncate flex items-center justify-between gap-1">
                      <span>{selectedNode.actorName || 'Volt Typhoon'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Network Telemetry */}
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-1.5 border-b border-slate-200">
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
                
                {/* Active IOCs */}
                <div className="space-y-1.5">
                  <span className="text-xs text-slate-500 font-medium block">Active IOCs:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedNode.iocs || ['198.51.100.42', 'df:42:ab']).map((ioc) => (
                      <span key={ioc} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono border border-slate-300">
                        {ioc}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSimulateBlock(selectedNode.id)}
                    disabled={selectedNode.defenseStatus === 'active_blocking'}
                    className={\`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold font-mono transition-colors shadow-xs \${
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
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-slate-400 font-mono text-xs">
                Click any origin or victim node on the map to load real-time intelligence.
              </div>
            )}
          </div>
        </div>
      </div>
`;

fs.writeFileSync('src/components/WorldThreatMapView.tsx', before + newLayout + '\n' + after);
