const fs = require('fs');
let content = fs.readFileSync('src/components/WorldThreatMapView.tsx', 'utf-8');

const returnIndex = content.indexOf('    return (\n    <div className="space-y-4 text-slate-900 font-sans" id="world-threat-map-view">');

const before = content.slice(0, returnIndex);
const after = content.slice(returnIndex).replace('    return (\n    <div', '  return (\n    <div');

const logic = `
    return () => clearInterval(interval);
  }, [isLiveStreamActive, trajectories]);

  // Derived Data
  const filteredNodes = nodes.filter((node) => {
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
    if (activeSectorFilter !== 'all' && node.sector !== activeSectorFilter) return false;
    return true;
  });

  const filteredTrajectories = trajectories.filter((t) => t.active);

  const handleSimulateBlock = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId ? { ...n, defenseStatus: 'active_blocking', incursionRate: '0 pkt/s' } : n
      )
    );
    setContainedSuccessMessage(\`Initiated layer-4 port block and dropped BGP routes for \${nodeId}.\`);
    if (selectedNode?.id === nodeId) {
      setSelectedNode({ ...selectedNode, defenseStatus: 'active_blocking', incursionRate: '0 pkt/s' });
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

`;

fs.writeFileSync('src/components/WorldThreatMapView.tsx', before + logic + after);
