import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  WorldThreatNode,
  AttackTrajectory,
  SubseaCable
} from '../../types';
import { getGreatCirclePoints, calculateSolarTerminator } from '../../utils/geoUtils';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Compass,
  Play,
  Pause,
  Zap,
  Activity,
  Crosshair,
  Shield,
  Eye,
  Sliders
} from 'lucide-react';

export type MapTileStyle = 'dark' | 'satellite' | 'voyager';

interface RealisticLeafletThreatMapProps {
  nodes: WorldThreatNode[];
  trajectories: AttackTrajectory[];
  subseaCables?: SubseaCable[];
  selectedNode: WorldThreatNode | null;
  onSelectNode: (node: WorldThreatNode) => void;
  selectedRegion: 'global' | 'americas' | 'emea' | 'apac' | 'fit';
  onRegionChange: (region: 'global' | 'americas' | 'emea' | 'apac' | 'fit') => void;
  showArcs: boolean;
  showOrigins: boolean;
  showVictims: boolean;
  showCables: boolean;
  showTerminator: boolean;
  showRadarSweep: boolean;
  isLiveStreamActive: boolean;
  onToggleLiveStream: () => void;
  heightClass?: string;
}

const REGION_COORDS: Record<string, { center: [number, number]; zoom: number }> = {
  global: { center: [29, 4], zoom: 1.615 },
  americas: { center: [25, -81], zoom: 3.66 },
  emea: { center: [40, 24], zoom: 3.97 },
  apac: { center: [15, 124], zoom: 3.76 }
};

interface Particle {
  trajectoryId: string;
  progress: number; // 0 to 1
  speed: number;
  color: string;
  size: number;
  tailLength: number;
}

export const RealisticLeafletThreatMap: React.FC<RealisticLeafletThreatMapProps> = ({
  nodes,
  trajectories,
  subseaCables = [],
  selectedNode,
  onSelectNode,
  selectedRegion,
  onRegionChange,
  showArcs,
  showOrigins,
  showVictims,
  showCables,
  showTerminator,
  showRadarSweep,
  isLiveStreamActive,
  onToggleLiveStream,
  heightClass
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [tileStyle, setTileStyle] = useState<MapTileStyle>('voyager');
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredNodeInfo, setHoveredNodeInfo] = useState<WorldThreatNode | null>(null);
  const [hoveredPos, setHoveredPos] = useState<{ x: number; y: number } | null>(null);

  // Animation particles reference
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const radarAngleRef = useRef(0);
  const impactRipplesRef = useRef<{ x: number; y: number; radius: number; maxRadius: number; alpha: number; color: string }[]>([]);

  // 1. Initialize Particles
  useEffect(() => {
    const activeTrajs = trajectories.filter((t) => t.active);
    const newParticles: Particle[] = [];

    activeTrajs.forEach((t) => {
      // Create 2-4 staggered particles per trajectory
      const particleCount = t.severity === 'critical' ? 4 : 2;
      const color =
        t.severity === 'critical'
          ? '#ef4444'
          : t.severity === 'high'
          ? '#f97316'
          : '#38bdf8';

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          trajectoryId: t.id,
          progress: (i / particleCount) + Math.random() * 0.2,
          speed: 0.0035 + Math.random() * 0.003,
          color,
          size: t.severity === 'critical' ? 3.5 : 2.5,
          tailLength: 12
        });
      }
    });

    particlesRef.current = newParticles;
  }, [trajectories]);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: REGION_COORDS.global.center,
      zoom: REGION_COORDS.global.zoom,
      minZoom: 1.8,
      maxZoom: 12,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      touchZoom: false,
      keyboard: false
    });

    mapInstanceRef.current = map;

    // Add Tile Layer
    const getTileUrl = (style: MapTileStyle) => {
      switch (style) {
        case 'satellite':
          return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        case 'voyager':
          return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        case 'dark':
        default:
          return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      }
    };

    const tileLayer = L.tileLayer(getTileUrl(tileStyle), {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Markers Group
    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    // Resize handler for Leaflet
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
      resizeCanvas();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when tileStyle changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    if (tileStyle === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    } else if (tileStyle === 'voyager') {
      url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    }

    tileLayerRef.current.setUrl(url);
  }, [tileStyle]);

  // Update Map Center on Region Change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    if (selectedRegion === 'fit') {
      const activeNodes = nodes.filter((n) => 
        (n.type === 'threat_origin' && showOrigins) || 
        (n.type === 'victim' && showVictims)
      );
      
      if (activeNodes.length > 0) {
        const bounds = L.latLngBounds(activeNodes.map(n => [n.lat, n.lng]));
        mapInstanceRef.current.flyToBounds(bounds, {
          padding: [80, 80],
          duration: 1.5,
          easeLinearity: 0.25
        });
      }
    } else {
      const target = REGION_COORDS[selectedRegion] || REGION_COORDS.global;
      mapInstanceRef.current.flyTo(target.center, target.zoom, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, [selectedRegion, nodes, showOrigins, showVictims]);

  // Resize canvas overlay
  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current || !mapContainerRef.current) return;
    const width = mapContainerRef.current.clientWidth;
    const height = mapContainerRef.current.clientHeight;
    canvasRef.current.width = width * window.devicePixelRatio;
    canvasRef.current.height = height * window.devicePixelRatio;
    canvasRef.current.style.width = `${width}px`;
    canvasRef.current.style.height = `${height}px`;
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // 3. Update HTML Markers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    markersGroupRef.current.clearLayers();

    nodes.forEach((node) => {
      const isOrigin = node.type === 'threat_origin' || node.type === 'c2_hub';
      const isVictim = node.type === 'victim';

      if (isOrigin && !showOrigins) return;
      if (isVictim && !showVictims) return;

      const isSelected = selectedNode?.id === node.id;
      const isCritical = node.severity === 'critical';

      // APTs in RED, Victims in GREEN
      let markerColorClass = isOrigin
        ? 'bg-red-600 text-red-50 border-red-400 shadow-red-500/40'
        : 'bg-emerald-600 text-emerald-50 border-emerald-400 shadow-emerald-500/40';
      let ringColor = isOrigin ? 'border-red-500' : 'border-emerald-500';
      let iconSymbol = isOrigin ? '☠' : '🎯';

      if (node.defenseStatus === 'quarantined' || node.status === 'contained') {
        markerColorClass = 'bg-emerald-700 text-emerald-50 border-emerald-300 shadow-emerald-600/40';
        ringColor = 'border-emerald-400';
        iconSymbol = '🛡';
      }

      const customIcon = L.divIcon({
        className: 'custom-leaflet-threat-marker',
        html: `
          <div class="relative group cursor-pointer flex items-center justify-center -translate-x-1/2 -translate-y-1/2" id="map-node-${node.id}">
            <!-- Compact Outer Pulsing Ring (APT: Red, Victim: Green) -->
            <div class="absolute -inset-1 rounded-full border ${ringColor} opacity-60 animate-ping"></div>
            
            <!-- Compact Selection Halo -->
            ${
              isSelected
                ? `<div class="absolute -inset-2 rounded-full border border-cyan-400 bg-cyan-400/20 animate-pulse"></div>`
                : ''
            }

            <!-- Compact Center Core Badge (20px) -->
            <div class="relative flex items-center justify-center w-5 h-5 rounded-full ${markerColorClass} border shadow-sm text-xs font-bold transition-transform hover:scale-125 z-10">
              <span class="leading-none">${iconSymbol}</span>
            </div>

            <!-- Compact Mini Label Pill -->
            <div class="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap px-2 py-0.5 rounded bg-slate-950/90 backdrop-blur-xs border ${isOrigin ? 'border-red-500/50' : 'border-emerald-500/50'} text-[11px] font-mono text-slate-200 shadow-sm flex items-center gap-1.5 z-20 transition-all duration-200 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'}">
              <span class="w-1.5 h-1.5 rounded-full ${isOrigin ? 'bg-red-500' : 'bg-emerald-400'} animate-pulse"></span>
              <span class="${isOrigin ? 'text-red-300 font-semibold' : 'text-emerald-300'}">${isOrigin ? `[APT] ${node.city}` : node.city}</span>
            </div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([node.lat, node.lng], { icon: customIcon });

      marker.on('click', () => {
        onSelectNode(node);
      });

      marker.on('mouseover', (e) => {
        setHoveredNodeInfo(node);
        if (mapContainerRef.current) {
          const rect = mapContainerRef.current.getBoundingClientRect();
          setHoveredPos({
            x: e.originalEvent.clientX - rect.left,
            y: e.originalEvent.clientY - rect.top
          });
        }
      });

      marker.on('mouseout', () => {
        setHoveredNodeInfo(null);
        setHoveredPos(null);
      });

      marker.addTo(markersGroupRef.current!);
    });
  }, [nodes, showOrigins, showVictims, selectedNode, onSelectNode]);

  // 4. Main Synchronized Canvas Animation Loop (Great Circle Arcs, Multi-Particles, Cables, Terminator)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isSubscribed = true;

    const render = () => {
      if (!isSubscribed) return;
      const map = mapInstanceRef.current;
      if (!map) {
        animationFrameId.current = requestAnimationFrame(render);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // --- A. Render Day / Night Solar Terminator Shadow ---
      if (showTerminator) {
        const terminatorCoords = calculateSolarTerminator();
        ctx.beginPath();
        let started = false;

        terminatorCoords.forEach(([lng, lat]) => {
          const pt = map.latLngToContainerPoint([lat, lng]);
          if (!started) {
            ctx.moveTo(pt.x, pt.y);
            started = true;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        });

        // Close shadow polygon to south edge of screen
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        ctx.fillStyle = 'rgba(2, 6, 23, 0.22)'; // Subtle night shadow
        ctx.fill();

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // --- B. Render Subsea Fiber Optic Cables ---
      if (showCables && subseaCables.length > 0) {
        subseaCables.forEach((cable) => {
          if (cable.landingPoints.length < 2) return;

          ctx.beginPath();
          for (let i = 0; i < cable.landingPoints.length - 1; i++) {
            const p1 = cable.landingPoints[i];
            const p2 = cable.landingPoints[i + 1];
            const greatCircle = getGreatCirclePoints(p1[0], p1[1], p2[0], p2[1], 25);

            greatCircle.forEach(([lng, lat], idx) => {
              const pt = map.latLngToContainerPoint([lat, lng]);
              if (idx === 0 && i === 0) {
                ctx.moveTo(pt.x, pt.y);
              } else {
                ctx.lineTo(pt.x, pt.y);
              }
            });
          }

          ctx.strokeStyle =
            cable.status === 'congested_threat'
              ? 'rgba(244, 63, 94, 0.45)'
              : 'rgba(6, 182, 212, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }

      // --- C. Render Great Circle Attack Arcs & Active Particle Telemetry (First Version Clean Geodesics) ---
      if (showArcs && trajectories.length > 0) {
        trajectories.forEach((traj) => {
          if (!traj.active) return;

          // Get Great Circle geodesic points
          const numSteps = 40;
          const gcPoints = getGreatCirclePoints(
            traj.sourceCoords[0],
            traj.sourceCoords[1],
            traj.targetCoords[0],
            traj.targetCoords[1],
            numSteps
          );

          // Draw base geodesic track directly
          ctx.beginPath();
          gcPoints.forEach(([lng, lat], idx) => {
            const pt = map.latLngToContainerPoint([lat, lng]);
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });

          const isCritical = traj.severity === 'critical';
          const isSelected =
            selectedNode &&
            (selectedNode.id === traj.sourceId ||
              selectedNode.id === traj.targetId ||
              (selectedNode.actorName && selectedNode.actorName === traj.actorName));

          // Clean, lightweight geodesic line
          ctx.strokeStyle = isSelected
            ? 'rgba(239, 68, 68, 0.75)'
            : isCritical
            ? 'rgba(239, 68, 68, 0.35)'
            : 'rgba(249, 115, 22, 0.25)';
          ctx.lineWidth = isSelected ? 1.8 : isCritical ? 1.2 : 0.85;
          ctx.stroke();
        });

        // --- D. Update and Render Lightweight Particles Streaming Along Geodesics ---
        if (isLiveStreamActive) {
          particlesRef.current.forEach((particle) => {
            const traj = trajectories.find((t) => t.id === particle.trajectoryId);
            if (!traj || !traj.active) return;

            // Increment progress with simulation speed
            particle.progress += particle.speed * simulationSpeed;
            if (particle.progress >= 1) {
              particle.progress = 0;

              // Spawn delicate impact ripple at target
              const targetPt = map.latLngToContainerPoint([traj.targetCoords[1], traj.targetCoords[0]]);
              impactRipplesRef.current.push({
                x: targetPt.x,
                y: targetPt.y,
                radius: 2,
                maxRadius: 20,
                alpha: 0.8,
                color: particle.color
              });
            }

            // Interpolate along great circle
            const numSteps = 40;
            const gcPoints = getGreatCirclePoints(
              traj.sourceCoords[0],
              traj.sourceCoords[1],
              traj.targetCoords[0],
              traj.targetCoords[1],
              numSteps
            );

            const pointIndex = Math.min(
              gcPoints.length - 1,
              Math.floor(particle.progress * (gcPoints.length - 1))
            );
            const currentCoord = gcPoints[pointIndex];
            const screenPt = map.latLngToContainerPoint([currentCoord[1], currentCoord[0]]);

            // Clean, lightweight particle head
            const isCrit = traj.severity === 'critical';
            const headColor = particle.progress < 0.5 ? '#ef4444' : '#10b981';

            ctx.beginPath();
            ctx.arc(screenPt.x, screenPt.y, Math.min(particle.size, 2.2), 0, Math.PI * 2);
            ctx.fillStyle = headColor;
            ctx.fill();

            // Delicate trailing motion tail
            const tailSteps = 4;
            ctx.beginPath();
            for (let t = 1; t <= tailSteps; t++) {
              const tailProgress = Math.max(0, particle.progress - t * 0.012);
              const tailIndex = Math.min(
                gcPoints.length - 1,
                Math.floor(tailProgress * (gcPoints.length - 1))
              );
              const tailCoord = gcPoints[tailIndex];
              const tailPt = map.latLngToContainerPoint([tailCoord[1], tailCoord[0]]);

              if (t === 1) ctx.moveTo(screenPt.x, screenPt.y);
              ctx.lineTo(tailPt.x, tailPt.y);
            }
            ctx.strokeStyle = headColor === '#ef4444' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)';
            ctx.lineWidth = 1.0;
            ctx.stroke();
          });
        }
      }

      // --- E. Render Impact Ripples ---
      for (let i = impactRipplesRef.current.length - 1; i >= 0; i--) {
        const ripple = impactRipplesRef.current[i];
        ripple.radius += 0.6 * simulationSpeed;
        ripple.alpha -= 0.03 * simulationSpeed;

        if (ripple.alpha <= 0 || ripple.radius >= ripple.maxRadius) {
          impactRipplesRef.current.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = ripple.color.replace(')', `, ${ripple.alpha})`).replace('rgb', 'rgba').replace('#ef4444', `rgba(239, 68, 68, ${ripple.alpha})`).replace('#f97316', `rgba(249, 115, 22, ${ripple.alpha})`);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // --- F. Render Rotating Radar Sweeps at Threat Origins (APT in RED, Lighter & Smaller) ---
      if (showRadarSweep && showOrigins) {
        radarAngleRef.current = (radarAngleRef.current + 0.025 * simulationSpeed) % (Math.PI * 2);
        const originNodes = nodes.filter((n) => n.type === 'threat_origin' || n.type === 'c2_hub');

        originNodes.forEach((origin) => {
          const pt = map.latLngToContainerPoint([origin.lat, origin.lng]);
          const radarRadius = 22; // Smaller radius

          // Draw delicate radar cone gradient in RED for APT origin
          const startAngle = radarAngleRef.current;
          const endAngle = radarAngleRef.current + 0.55;

          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.arc(pt.x, pt.y, radarRadius, startAngle, endAngle);
          ctx.closePath();

          const grad = ctx.createRadialGradient(pt.x, pt.y, 1, pt.x, pt.y, radarRadius);
          grad.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
          grad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
          ctx.fillStyle = grad;
          ctx.fill();

          // Radar circle outline
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, radarRadius, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.lineWidth = 0.75;
          ctx.stroke();
        });
      }

      ctx.restore();
      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isSubscribed = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [
    showArcs,
    showCables,
    showTerminator,
    showRadarSweep,
    showOrigins,
    trajectories,
    subseaCables,
    nodes,
    isLiveStreamActive,
    simulationSpeed
  ]);

  // Leaflet Zoom Handlers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetBounds = () => {
    onRegionChange('global');
    mapInstanceRef.current?.flyTo(REGION_COORDS.global.center, REGION_COORDS.global.zoom);
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-[#dbeafe] transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : `${heightClass || 'h-[558px]'} shadow-md`
      }`}
      style={{ 
        filter: 'sepia(0.15) saturate(1.4) brightness(1.02) contrast(1.08)' 
      }}
      id="realistic-threat-map-container"
    >
      {/* 1. Leaflet Base Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0 bg-slate-100" />

      {/* 2. Synced Canvas Animation Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* 3. Top HUD: Tactical View Mode (REMOVED - MOVED TO PARENT) */}
      
      {/* 4. Top-Right HUD: Play/Pause (REMOVED - MOVED TO PARENT) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-slate-300 hover:text-white shadow-md hover:bg-slate-800 transition-all"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen SOC Display'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>



      {/* 6. Bottom-Right Telemetry Ticker (REMOVED - MOVED TO PARENT) */}

      {/* 7. Hover Node Tooltip Box */}
      {hoveredNodeInfo && hoveredPos && (
        <div
          className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl text-slate-900 text-xs font-mono min-w-[210px]"
          style={{ left: `${hoveredPos.x}px`, top: `${hoveredPos.y}px` }}
        >
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
            <span className={`font-bold flex items-center gap-1 ${hoveredNodeInfo.type === 'threat_origin' ? 'text-rose-600' : 'text-emerald-600'}`}>
              {hoveredNodeInfo.type === 'threat_origin' ? '☠️ APT Threat Origin' : '🎯 Victim Infrastructure'}
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] uppercase font-bold border ${
              hoveredNodeInfo.type === 'threat_origin'
                ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
            }`}>
              {hoveredNodeInfo.type === 'threat_origin' ? 'APT HUB' : 'VICTIM'}
            </span>
          </div>
          <div className="mt-2 space-y-1 text-xs">
            <div className="text-slate-900 font-sans font-bold text-sm tracking-tight">{hoveredNodeInfo.name}</div>
            <div className="text-slate-500 flex items-center gap-1 font-medium">
              <span className="text-slate-400">Geo:</span> {hoveredNodeInfo.city}, {hoveredNodeInfo.country}
            </div>
            {hoveredNodeInfo.actorName && (
              <div className="text-rose-600 flex items-center gap-1 font-bold">
                <span className="text-slate-400 font-medium">Attributed APT:</span> {hoveredNodeInfo.actorName}
              </div>
            )}
            {hoveredNodeInfo.victimOrg && (
              <div className="text-emerald-600 flex items-center gap-1 font-bold">
                <span className="text-slate-400 font-medium">Victim Org:</span> {hoveredNodeInfo.victimOrg}
              </div>
            )}
            {hoveredNodeInfo.ip && (
              <div className="text-indigo-600 flex items-center gap-1 font-bold">
                <span className="text-slate-400 font-medium">IP/ASN:</span> {hoveredNodeInfo.ip}
              </div>
            )}
            <div className="text-amber-600 flex items-center gap-1 font-bold">
              <span className="text-slate-400 font-medium">Incursion Velocity:</span> {hoveredNodeInfo.incursionRate}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
