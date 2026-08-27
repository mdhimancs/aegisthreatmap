const fs = require('fs');
let content = fs.readFileSync('src/components/WorldThreatMapView.tsx', 'utf-8');

// 1. Move the metrics into the header
const headerStart = '<div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">';
const headerEnd = '        <div className="flex items-center gap-2 shrink-0 ml-auto">';

const metricsBlock = `            {/* Top-Right: Tactical Metrics */}
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
            </div>`;

// Replace metrics block in map with empty string
content = content.replace(metricsBlock, '');

// The replacement metrics block for the header (styled flat without absolute positioning)
const headerMetricsBlock = `        <div className="flex flex-wrap items-center gap-3 lg:gap-5 shrink-0 bg-white border border-slate-200/50 py-1.5 px-3 rounded-lg shadow-sm">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[11px] text-slate-500"><Flame className="w-3.5 h-3.5 text-rose-500" /> Incursions</div>
            <div className="text-base font-bold font-mono text-slate-900">98.4k <span className="text-xs text-rose-600">+18%</span></div>
          </div>
          <div className="h-6 w-px bg-slate-200/50 hidden sm:block"></div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[11px] text-slate-500"><Radio className="w-3.5 h-3.5 text-red-600" /> APT Hubs</div>
            <div className="text-base font-bold font-mono text-slate-900">5 <span className="text-xs text-red-700">100% Tracked</span></div>
          </div>
          <div className="h-6 w-px bg-slate-200/50 hidden sm:block"></div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[11px] text-slate-500"><Target className="w-3.5 h-3.5 text-emerald-600" /> Victims</div>
            <div className="text-base font-bold font-mono text-slate-900">12 <span className="text-xs text-emerald-700">3 Contained</span></div>
          </div>
          <div className="h-6 w-px bg-slate-200/50 hidden sm:block"></div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[11px] text-slate-500"><Cable className="w-3.5 h-3.5 text-cyan-600" /> Subsea</div>
            <div className="text-base font-bold font-mono text-slate-900">5 <span className="text-xs text-cyan-700">1 Alert</span></div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">`;

content = content.replace(headerEnd, headerMetricsBlock);

// 2. Add the big table below the map
const tableString = `
      {/* 7. Dedicated Tightly-Packed Active APT & Victim Telemetry Table */}
      <div className="mt-5 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col" id="tightly-packed-threat-table">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Active Telemetry & Node Status
          </h3>
          <span className="text-xs font-mono text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{filteredNodes.length} Nodes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                <th className="px-4 py-2.5 font-semibold">Severity</th>
                <th className="px-4 py-2.5 font-semibold">Entity / Target</th>
                <th className="px-4 py-2.5 font-semibold">Type</th>
                <th className="px-4 py-2.5 font-semibold">Location</th>
                <th className="px-4 py-2.5 font-semibold">IP / ASN</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredNodes.map(node => (
                <tr 
                  key={node.id} 
                  className={\`border-b border-slate-100 cursor-pointer transition-colors \${selectedNode?.id === node.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}\`}
                  onClick={() => setSelectedNode(node)}
                >
                  <td className="px-4 py-2">
                    <span className={\`px-2 py-0.5 rounded font-bold uppercase text-[10px] \${getSeverityBadge(node.severity)}\`}>
                      {node.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-sans font-bold text-slate-800">{node.name}</td>
                  <td className="px-4 py-2">
                    {node.type === 'threat_origin' ? (
                      <span className="text-red-600 flex items-center gap-1 font-semibold"><Radio className="w-3 h-3" /> APT</span>
                    ) : (
                      <span className="text-emerald-600 flex items-center gap-1 font-semibold"><Target className="w-3 h-3" /> Victim</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{node.city}, {node.country}</td>
                  <td className="px-4 py-2 text-indigo-600">{node.ip || 'N/A'}</td>
                  <td className="px-4 py-2">
                    {node.defenseStatus === 'active_blocking' ? (
                      <span className="text-emerald-600 flex items-center gap-1 font-semibold"><ShieldCheck className="w-3 h-3" /> Blocked</span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-1 font-semibold"><AlertTriangle className="w-3 h-3" /> Exposed</span>
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
export default WorldThreatMapView;`;

// Replace the end of the file with the table string
content = content.replace(/\s*\{\/\*\s*7\.\s*Dedicated Tightly-Packed Active APT & Victim Telemetry Table\s*\*\/\}\s*<\/div>\s*\);\s*\}\s*export default WorldThreatMapView;/, tableString);

fs.writeFileSync('src/components/WorldThreatMapView.tsx', content);
