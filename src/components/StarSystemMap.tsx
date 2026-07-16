import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { StarSystemProfile, VoidWaypoint } from "../types";
import { Compass, Info, MapPin, Navigation, Shield, Zap, RotateCw, RefreshCw, ZoomIn, ZoomOut, Move } from "lucide-react";

interface StarSystemMapProps {
  currentSystemIndex: number;
  systems: StarSystemProfile[];
  waypoint: number | null;
  setWaypoint: (index: number | null) => void;
  onClose: () => void;
  isInDeepSpace?: boolean;
  voidWaypoints?: VoidWaypoint[];
  onTriggerWarpJumpToWaypoint?: (waypoint: VoidWaypoint) => void;
}

export const StarSystemMap: React.FC<StarSystemMapProps> = ({
  currentSystemIndex,
  systems,
  waypoint,
  setWaypoint,
  onClose,
  isInDeepSpace = false,
  voidWaypoints = [],
  onTriggerWarpJumpToWaypoint
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 3D Camera & Viewport States
  const [scale, setScale] = useState(130); // Pixels per LY
  const [yaw, setYaw] = useState(0.45);   // Rotation around Y-axis (radians)
  const [pitch, setPitch] = useState(0.55); // Tilt around X-axis (radians)
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // Pan offset in pixels
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragButton, setDragButton] = useState<number>(0);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });
  const [selectedSystemIndex, setSelectedSystemIndex] = useState<number | null>(currentSystemIndex);
  const [isPotentialClick, setIsPotentialClick] = useState(false);

  // Deterministic 3D coordinates for all systems (in Light Years)
  // Centered roughly around 0, 0, 0
  const systemCoords3D = useMemo(() => {
    return systems.map((sys, i) => {
      if (i === 2) {
        // Center Proxima Centauri near coordinate origin
        return { x: 0, y: 0, z: 0 };
      }
      
      // Disperse other star systems realistically in a 3D volume
      const angle = (i * 2.3) % (Math.PI * 2);
      // Radius from 1.5 to 5.5 LY
      const radius = 1.5 + ((i * 7) % 5) * 1.1;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      
      // Altitude above or below galactic disc (Y-axis)
      let y = 0;
      if (i !== 2) {
        y = Math.sin(i * 3.7) * (0.4 + (i % 3) * 0.5); // -1.4 to +1.4 LY
      }

      return {
        x: parseFloat(x.toFixed(2)),
        y: parseFloat(y.toFixed(2)),
        z: parseFloat(z.toFixed(2))
      };
    });
  }, [systems]);

  const connections = useMemo(() => {
    const conns: [number, number][] = [];
    systems.forEach((system, i) => {
        system.connections.forEach(target => {
            if (target > i) {
                conns.push([i, target]);
            }
        });
    });
    return conns;
  }, [systems]);

  // Compute shortest path via BFS
  const waypointPath = useMemo(() => {
    if (waypoint === null) return [];
    
    const queue: number[][] = [[currentSystemIndex]];
    const visited = new Set<number>([currentSystemIndex]);
    
    while (queue.length > 0) {
      const path = queue.shift()!;
      const node = path[path.length - 1];
      
      if (node === waypoint) {
        return path;
      }
      
      const system = systems[node];
      const neighbors = system?.connections || [];
      
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }
    return [];
  }, [currentSystemIndex, waypoint, systems]);

  // Deterministic background stars for the starry backdrop
  const backgroundStars = useMemo(() => {
    const stars = [];
    const count = 150;
    for (let i = 0; i < count; i++) {
      const colors = [
        "rgba(255, 255, 255, ", // white
        "rgba(6, 182, 212, ",   // cyan
        "rgba(167, 139, 250, ", // purple
        "rgba(234, 179, 8, "    // gold
      ];
      const colorBase = colors[Math.floor((i * 7) % colors.length)];
      stars.push({
        rx: Math.random(), // relative width percentage
        ry: Math.random(), // relative height percentage
        size: Math.random() * 1.3 + 0.4,
        colorBase
      });
    }
    return stars;
  }, []);

  // Focus system coordinate (for camera tracking)
  const focusSystemIndex = selectedSystemIndex !== null ? selectedSystemIndex : currentSystemIndex;
  const focusSystem = useMemo(() => {
    return systemCoords3D[focusSystemIndex] || { x: 0, y: 0, z: 0 };
  }, [systemCoords3D, focusSystemIndex]);

  // Project 3D coordinates (x, y, z) into 2D screen coordinate
  // Incorporating yaw, pitch, scale, panning offset, and camera focus
  const project = useCallback((x: number, y: number, z: number, width: number, height: number) => {
    // Center coordinate around current focus system (so camera orbits centered on focus)
    const relX = x - focusSystem.x;
    const relY = y - focusSystem.y;
    const relZ = z - focusSystem.z;

    // Yaw rotation around vertical axis (Y-axis)
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const rx = relX * cosY - relZ * sinY;
    const rz = relX * sinY + relZ * cosY;

    // Pitch rotation around horizontal axis (X-axis)
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    // Elite-style tilted viewport representation
    const ry = relY * cosP - rz * sinP;
    const rz_final = relY * sinP + rz * cosP;

    // Perspective projection
    const d = 12 + rz_final; // Virtual camera distance
    const fov = 10;          // Focal distance
    const perspectiveFactor = fov / Math.max(1.0, d);

    // Coordinate mapping onto screen center
    const sx = width / 2 + offset.x + rx * perspectiveFactor * scale;
    const sy = height / 2 + offset.y + ry * perspectiveFactor * scale;

    return {
      x: sx,
      y: sy,
      visible: d > 1.0,
      depth: rz_final
    };
  }, [focusSystem, yaw, pitch, scale, offset]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set high-DPI resolution rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    // Draw starry background with subtle parallax movement
    backgroundStars.forEach((star) => {
      const x = (star.rx * width + offset.x * 0.15) % width;
      const y = (star.ry * height + offset.y * 0.15) % height;
      
      const finalX = x < 0 ? x + width : x;
      const finalY = y < 0 ? y + height : y;

      ctx.beginPath();
      ctx.arc(finalX, finalY, star.size, 0, 2 * Math.PI);
      ctx.fillStyle = `${star.colorBase}${0.35 + Math.sin(star.rx * 100) * 0.25})`;
      ctx.fill();
    });

    // Draw grid background to set tactical space
    ctx.strokeStyle = "rgba(10, 25, 45, 0.4)";
    ctx.lineWidth = 1;
    const gridSpacing = 40;
    for (let x = 0; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.save();

    // 1. Draw Elite Dangerous-style horizontal coordinate reference disc
    // concentric circular range indicators centered around the focused system's altitude (y=0 plane relative)
    ctx.lineWidth = 1;
    const rings = [1, 2, 3, 4, 5];
    rings.forEach((r) => {
      ctx.beginPath();
      ctx.strokeStyle = r % 2 === 0 ? "rgba(6, 182, 212, 0.15)" : "rgba(38, 38, 38, 0.3)";
      
      // Construct circle path using 64 projected points on the Y=0 plane
      let started = false;
      for (let theta = 0; theta <= Math.PI * 2 + 0.1; theta += 0.1) {
        const cx = focusSystem.x + Math.sin(theta) * r;
        const cz = focusSystem.z + Math.cos(theta) * r;
        const proj = project(cx, 0, cz, width, height);
        if (proj.visible) {
          if (!started) {
            ctx.moveTo(proj.x, proj.y);
            started = true;
          } else {
            ctx.lineTo(proj.x, proj.y);
          }
        }
      }
      ctx.stroke();
    });

    // Draw primary axes on the galactic plane
    ctx.strokeStyle = "rgba(6, 182, 212, 0.12)";
    ctx.setLineDash([2, 5]);
    // X axis reference line
    let pStart = project(focusSystem.x - 6, 0, focusSystem.z, width, height);
    let pEnd = project(focusSystem.x + 6, 0, focusSystem.z, width, height);
    if (pStart.visible && pEnd.visible) {
      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.stroke();
    }
    // Z axis reference line
    pStart = project(focusSystem.x, 0, focusSystem.z - 6, width, height);
    pEnd = project(focusSystem.x, 0, focusSystem.z + 6, width, height);
    if (pStart.visible && pEnd.visible) {
      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 2. Draw 3D tactical connections (jump lines)
    ctx.lineWidth = 1.2;
    connections.forEach(([i, j]) => {
      const c1 = systemCoords3D[i];
      const c2 = systemCoords3D[j];
      const p1 = project(c1.x, c1.y, c1.z, width, height);
      const p2 = project(c2.x, c2.y, c2.z, width, height);

      if (p1.visible && p2.visible) {
        const isPartofRoute = waypointPath.includes(i) && waypointPath.includes(j);
        if (isPartofRoute) {
          ctx.strokeStyle = "rgba(6, 182, 212, 0.85)"; // glowing cyan
          ctx.lineWidth = 2.5;
          ctx.shadowColor = "#06b6d4";
          ctx.shadowBlur = 6;
        } else {
          ctx.strokeStyle = "rgba(64, 64, 64, 0.5)"; // neutral-700
          ctx.lineWidth = 1;
          ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });

    // 3. Draw vertical drop-projection lines connecting each star system to the galactic plane (Y=0)
    // This is the classic 3D space telemetry signature from Elite Dangerous!
    systemCoords3D.forEach((coord, i) => {
      const systemProj = project(coord.x, coord.y, coord.z, width, height);
      const planeProj = project(coord.x, 0, coord.z, width, height);

      if (systemProj.visible && planeProj.visible) {
        const isSelected = i === selectedSystemIndex;
        const isCurrent = i === currentSystemIndex;
        
        ctx.beginPath();
        if (isSelected) {
          ctx.strokeStyle = "rgba(167, 139, 250, 0.65)"; // purple
          ctx.lineWidth = 1.5;
          ctx.setLineDash([1, 2]);
        } else if (isCurrent) {
          ctx.strokeStyle = "rgba(234, 179, 8, 0.5)"; // yellow
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
        } else {
          ctx.strokeStyle = "rgba(115, 115, 115, 0.25)"; // grey
          ctx.lineWidth = 0.8;
          ctx.setLineDash([2, 4]);
        }
        
        ctx.moveTo(systemProj.x, systemProj.y);
        ctx.lineTo(planeProj.x, planeProj.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw small projector circles at the base on the plane (y=0)
        ctx.beginPath();
        ctx.arc(planeProj.x, planeProj.y, isSelected ? 4 : 2, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? "rgba(167, 139, 250, 0.4)" : "rgba(115, 115, 115, 0.2)";
        ctx.fill();
        ctx.stroke();
      }
    });

    // 4. Render Star nodes using Painter's Algorithm (sort by depth to render foreground nodes on top)
    const sortedNodeIndices = systemCoords3D
      .map((coord, i) => ({ coord, index: i }))
      .sort((a, b) => {
        const projA = project(a.coord.x, a.coord.y, a.coord.z, width, height);
        const projB = project(b.coord.x, b.coord.y, b.coord.z, width, height);
        return projB.depth - projA.depth; // Farther stars rendered first, closer ones last
      });

    sortedNodeIndices.forEach(({ coord, index: i }) => {
      const proj = project(coord.x, coord.y, coord.z, width, height);
      if (!proj.visible) return;

      const isCurrent = i === currentSystemIndex;
      const isWaypoint = i === waypoint;
      const isSelected = i === selectedSystemIndex;
      const isInRoute = waypointPath.includes(i);

      // Node base size expands dynamically based on camera perspective depth
      const depthScale = Math.max(0.4, 1.2 - proj.depth / 15);
      const baseRadius = 6 * depthScale;

      // Draw active telemetry scanner ring for selected system
      if (isSelected) {
        ctx.strokeStyle = "#a78bfa"; // purple-400
        ctx.lineWidth = 2;
        ctx.shadowColor = "#a78bfa";
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, baseRadius * 2.2, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Glowing outer corona
      if (isCurrent || isWaypoint) {
        ctx.strokeStyle = isCurrent ? "#eab308" : "#06b6d4";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, baseRadius * 1.6, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Draw core star node sphere
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, baseRadius, 0, 2 * Math.PI);
      
      if (isCurrent) {
        ctx.fillStyle = "#eab308"; // yellow-500
      } else if (isWaypoint) {
        ctx.fillStyle = "#06b6d4"; // cyan-500
      } else if (isInRoute) {
        ctx.fillStyle = "#0891b2"; // cyan-600
      } else {
        ctx.fillStyle = "#525252"; // neutral-600
      }
      ctx.fill();

      ctx.strokeStyle = isCurrent || isWaypoint || isSelected ? "#ffffff" : "#171717";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Node label
      ctx.fillStyle = isCurrent 
        ? "#fef08a" 
        : isWaypoint 
        ? "#cffafe" 
        : isInRoute 
        ? "#e0f2fe" 
        : isSelected 
        ? "#f5f3ff" 
        : "#d4d4d4";
      ctx.font = isSelected ? "bold 11px monospace" : "10px monospace";
      ctx.fillText(systems[i].name, proj.x + baseRadius + 6, proj.y + 4);
    });

    ctx.restore();
  }, [project, currentSystemIndex, systems, systemCoords3D, connections, waypoint, selectedSystemIndex, waypointPath, focusSystem, backgroundStars, offset]);

  useEffect(() => {
    draw();
    // Hook window resize
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newScale = Math.min(Math.max(scale - e.deltaY * 0.2, 40), 400);
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragButton(e.button);
    setIsPotentialClick(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    setMouseDownPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      
      // Determine click versus dragging movement
      const moveDistance = Math.sqrt((e.clientX - mouseDownPos.x) ** 2 + (e.clientY - mouseDownPos.y) ** 2);
      if (moveDistance > 6) {
        setIsPotentialClick(false);
      }

      // Drag mechanics: Right click or Shift-Left click handles map panning. Left click handles 3D Orbiting!
      if (dragButton === 2 || e.shiftKey) {
        setOffset(prev => ({
          x: prev.x + dx,
          y: prev.y + dy,
        }));
      } else {
        // Orbit rotations
        setYaw(prev => prev + dx * 0.0075);
        setPitch(prev => Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, prev + dy * 0.0075)));
      }
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);
    if (isPotentialClick) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      let closestIndex: number | null = null;
      let minDistance = 22; // Select boundary limit

      systemCoords3D.forEach((coord, i) => {
        const proj = project(coord.x, coord.y, coord.z, rect.width, rect.height);
        if (proj.visible) {
          const dist = Math.sqrt((clickX - proj.x) ** 2 + (clickY - proj.y) ** 2);
          if (dist < minDistance) {
            minDistance = dist;
            closestIndex = i;
          }
        }
      });

      if (closestIndex !== null) {
        setSelectedSystemIndex(closestIndex);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent standard browser right click menu
  };

  const selectedSystem = selectedSystemIndex !== null ? systems[selectedSystemIndex] : null;
  const selectedSystemCoords = selectedSystemIndex !== null ? systemCoords3D[selectedSystemIndex] : null;

  // Rotation controls functions
  const rotateLeft = () => setYaw(prev => prev - 0.25);
  const rotateRight = () => setYaw(prev => prev + 0.25);
  const rotateUp = () => setPitch(prev => Math.min(Math.PI/2 - 0.15, prev + 0.2));
  const rotateDown = () => setPitch(prev => Math.max(-Math.PI/2 + 0.15, prev - 0.2));
  
  const zoomIn = () => setScale(prev => Math.min(400, prev + 30));
  const zoomOut = () => setScale(prev => Math.max(40, prev - 30));
  const resetCamera = () => {
    setYaw(0.45);
    setPitch(0.55);
    setOffset({ x: 0, y: 0 });
    setScale(130);
    setSelectedSystemIndex(currentSystemIndex);
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-2 md:p-4 font-mono text-xs text-neutral-200">
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 w-full h-full max-w-6xl max-h-[90vh] shadow-2xl flex flex-col">
        
        {/* Title Header */}
        <div className="flex justify-between items-center mb-4 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Navigation className="text-cyan-400 animate-pulse" size={20} />
            <div>
              <h2 className="text-base font-bold text-neutral-100 tracking-wider">UniNav 3D TACTICAL GALACTIC ENGINE</h2>
              <p className="text-[10px] text-neutral-400">Elite 3D perspective routing matrix • Altitude projection grid</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="px-4 py-1.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 text-neutral-300 font-bold rounded transition text-xs"
          >
            CLOSE VIEW
          </button>
        </div>

        {/* Master Layout */}
        <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-4 overflow-hidden">
          
          {/* Interactive Galaxy 3D Canvas Column */}
          <div className="md:col-span-3 relative border border-neutral-800 bg-black rounded-lg flex flex-col overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onContextMenu={handleContextMenu}
              onMouseLeave={() => setIsDragging(false)}
            />
            
            {/* Real-time 3D Navigation Controls Panel */}
            <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 bg-neutral-900/90 border border-neutral-800 p-2 rounded shadow-lg pointer-events-auto">
              <button onClick={rotateLeft} title="Orbit Left" className="p-1 hover:bg-neutral-800 border border-neutral-700 rounded text-neutral-300"><RotateCw size={13} className="scale-x-[-1]" /></button>
              <button onClick={rotateRight} title="Orbit Right" className="p-1 hover:bg-neutral-800 border border-neutral-700 rounded text-neutral-300"><RotateCw size={13} /></button>
              <button onClick={rotateUp} title="Tilt Up" className="p-1 hover:bg-neutral-800 border border-neutral-700 rounded text-neutral-300 font-bold">▲</button>
              <button onClick={rotateDown} title="Tilt Down" className="p-1 hover:bg-neutral-800 border border-neutral-700 rounded text-neutral-300 font-bold">▼</button>
              <div className="w-[1px] h-4 bg-neutral-800 mx-1"></div>
              <button onClick={zoomIn} title="Zoom In" className="p-1 hover:bg-neutral-800 border border-neutral-700 rounded text-neutral-300"><ZoomIn size={13} /></button>
              <button onClick={zoomOut} title="Zoom Out" className="p-1 hover:bg-neutral-800 border border-neutral-700 rounded text-neutral-300"><ZoomOut size={13} /></button>
              <div className="w-[1px] h-4 bg-neutral-800 mx-1"></div>
              <button onClick={resetCamera} title="Reset camera view" className="flex items-center gap-1 px-1.5 py-1 hover:bg-neutral-800 border border-neutral-700 rounded text-neutral-300 text-[9px] font-bold"><RefreshCw size={11} /> RE-CENTER</button>
            </div>

            {/* Quick Helper Overlay */}
            <div className="absolute bottom-3 left-3 bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 rounded text-[10px] text-neutral-400 pointer-events-none flex items-center gap-2 shadow-lg">
              <Move size={12} className="text-cyan-400" />
              <span><strong className="text-neutral-200">Drag Left-Click</strong> to Orbit • <strong className="text-neutral-200">Right-Click / Shift-Drag</strong> to Pan • <strong className="text-neutral-200">Scroll</strong> to Zoom</span>
            </div>

            <div className="absolute top-3 right-3 bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 rounded text-[10px] text-neutral-400 pointer-events-none shadow-lg font-mono">
              YAW: {(yaw * (180 / Math.PI)).toFixed(0)}° • PITCH: {(pitch * (180 / Math.PI)).toFixed(0)}° • ZOOM: {(scale).toFixed(0)}x
            </div>
          </div>

          {/* Navigation Detail Sidebar */}
          <div className="md:col-span-1 border border-neutral-800 bg-neutral-900/40 rounded-lg p-3 flex flex-col justify-between overflow-y-auto space-y-4">
            
            <div className="space-y-3">
              <div className="border-b border-neutral-800 pb-2">
                <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">CURRENT SECTOR ORIGIN</span>
                <div className="flex items-center gap-1.5 text-yellow-500 font-bold text-sm mt-0.5">
                  <MapPin size={14} />
                  {isInDeepSpace ? "INTERSTELLAR DEEP VOID" : systems[currentSystemIndex].name}
                </div>
              </div>

              {/* Waypoint routing panel */}
              {waypoint !== null && systems[waypoint] && (
                <div className="bg-cyan-950/20 border border-cyan-800/40 rounded p-2.5 space-y-1">
                  <div className="text-[9px] text-cyan-400 uppercase font-bold flex items-center gap-1">
                    <Compass className="animate-spin" style={{ animationDuration: "12s" }} size={12} /> WAYPOINT ROUTE LOCK
                  </div>
                  <div className="text-neutral-200 font-bold text-xs">
                    {systems[waypoint].name}
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono mt-1">
                    Distance: <span className="text-cyan-400 font-bold">{waypointPath.length > 1 ? waypointPath.length - 1 : 0} Jump(s)</span>
                    <div className="text-[9px] text-neutral-500">
                      Est. Total Displacement: {(() => {
                        let totalLY = 0;
                        for (let k = 0; k < waypointPath.length - 1; k++) {
                          const p1 = systemCoords3D[waypointPath[k]];
                          const p2 = systemCoords3D[waypointPath[k+1]];
                          totalLY += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) + Math.pow(p2.z - p1.z, 2));
                        }
                        return totalLY.toFixed(2);
                      })()} LY
                    </div>
                  </div>
                  
                  {/* Jump-by-Jump Routing Guide */}
                  {waypointPath.length > 1 && (
                    <div className="mt-2 pt-2 border-t border-cyan-900/30 text-[9px] space-y-1 font-mono text-neutral-300">
                      <span className="text-neutral-500 uppercase font-bold text-[8px] block">JUMP SEQUENCE:</span>
                      {waypointPath.map((nodeIndex, idx) => {
                        const isStart = idx === 0;
                        const isEnd = idx === waypointPath.length - 1;
                        return (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="text-neutral-500">{idx + 1}.</span>
                            <span className={isStart ? "text-yellow-400 font-semibold" : isEnd ? "text-cyan-400 font-semibold" : "text-neutral-300"}>
                              {systems[nodeIndex].name}
                            </span>
                            {!isEnd && <span className="text-neutral-600">→</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button 
                    onClick={() => setWaypoint(null)}
                    className="w-full text-center mt-2.5 py-1 bg-red-950/40 hover:bg-red-950/60 border border-red-900/50 text-red-400 text-[10px] font-bold uppercase rounded transition"
                  >
                    CLEAR WAYPOINT
                  </button>
                </div>
              )}

              {/* Anomalous coordinate points */}
              {voidWaypoints && voidWaypoints.length > 0 && (
                <div className="bg-indigo-950/20 border border-indigo-900/30 rounded p-2.5 space-y-2 mt-3">
                  <div className="text-[9px] text-indigo-400 uppercase font-bold flex items-center gap-1">
                    <Navigation className="animate-pulse text-indigo-400" size={11} /> ANOMALOUS COORDS DECK ({voidWaypoints.length})
                  </div>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {voidWaypoints.map((wp) => (
                      <div key={wp.id} className="p-1.5 border border-neutral-800 bg-neutral-950/60 rounded flex flex-col gap-1 text-[10px]">
                        <span className="font-bold text-neutral-200 truncate">{wp.name}</span>
                        <div className="flex justify-between items-center gap-1 pt-0.5">
                          <span className="text-yellow-500 font-mono text-[9px]">{wp.value} CR</span>
                          <button
                            onClick={() => {
                              onTriggerWarpJumpToWaypoint?.(wp);
                              onClose();
                            }}
                            className="px-2 py-0.5 bg-emerald-950/40 hover:bg-emerald-500 hover:text-black border border-emerald-500/40 text-emerald-400 text-[8px] font-bold uppercase rounded font-mono transition cursor-pointer"
                          >
                            WARP
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selected System Telemetry Block */}
            <div className="flex-grow flex flex-col justify-start">
              {selectedSystem && selectedSystemCoords ? (
                <div className="space-y-3 pt-2">
                  <div className="border-b border-neutral-800 pb-1.5 flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">TELEMETRY ANALYSIS</span>
                    {selectedSystemIndex === currentSystemIndex && (
                      <span className="px-1.5 py-0.5 text-[8px] bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30">Local Node</span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-neutral-100 flex items-center gap-1">
                    <Info size={14} className="text-cyan-400" />
                    {selectedSystem.name}
                  </h3>

                  {/* Real 3D Coordinate Grid Panel */}
                  <div className="bg-neutral-950 border border-neutral-800 p-2 rounded">
                    <div className="text-[9px] text-neutral-500 font-semibold mb-1">GALACTIC LY VECTOR COORDINATES:</div>
                    <div className="grid grid-cols-3 gap-1 text-center font-mono">
                      <div className="bg-neutral-900 p-1 rounded border border-neutral-800">
                        <div className="text-[8px] text-neutral-500">X-WIDTH</div>
                        <div className="text-cyan-400 font-bold text-[10px]">{selectedSystemCoords.x >= 0 ? `+${selectedSystemCoords.x.toFixed(2)}` : selectedSystemCoords.x.toFixed(2)} LY</div>
                      </div>
                      <div className="bg-neutral-900 p-1 rounded border border-neutral-800">
                        <div className="text-[8px] text-neutral-500">Y-ELEV</div>
                        <div className="text-purple-400 font-bold text-[10px]">{selectedSystemCoords.y >= 0 ? `+${selectedSystemCoords.y.toFixed(2)}` : selectedSystemCoords.y.toFixed(2)} LY</div>
                      </div>
                      <div className="bg-neutral-900 p-1 rounded border border-neutral-800">
                        <div className="text-[8px] text-neutral-500">Z-DEPTH</div>
                        <div className="text-emerald-400 font-bold text-[10px]">{selectedSystemCoords.z >= 0 ? `+${selectedSystemCoords.z.toFixed(2)}` : selectedSystemCoords.z.toFixed(2)} LY</div>
                      </div>
                    </div>
                  </div>

                  <p className="text-neutral-400 text-[11px] leading-relaxed italic">
                    "{selectedSystem.desc}"
                  </p>

                  <div className="grid grid-cols-1 gap-2 text-[10px] border-t border-neutral-800 pt-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">FACTION ZONE:</span>
                      <span className="font-bold text-neutral-200">{selectedSystem.factionOwner}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">SECURITY INDEX:</span>
                      <span className="font-mono flex items-center gap-1 font-bold">
                        <Shield size={10} className="text-emerald-400" />
                        {selectedSystem.safetyRating}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">TECH LEVEL:</span>
                      <span className="font-mono flex items-center gap-1 font-bold">
                        <Zap size={10} className="text-yellow-400" />
                        {selectedSystem.techLevel}/10
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">MINERAL RICHNESS:</span>
                      <span className="font-bold text-neutral-200">{selectedSystem.oreEnrichment}%</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    {waypoint === selectedSystemIndex ? (
                      <button 
                        onClick={() => setWaypoint(null)}
                        className="w-full py-1.5 bg-red-900/30 hover:bg-red-900/50 border border-red-700/40 text-red-200 font-bold uppercase rounded transition text-[10px]"
                      >
                        CLEAR WAYPOINT
                      </button>
                    ) : (
                      selectedSystemIndex !== currentSystemIndex && (
                        <button 
                          onClick={() => setWaypoint(selectedSystemIndex)}
                          className="w-full py-1.5 bg-cyan-900/40 hover:bg-cyan-900/60 border border-cyan-700/40 text-cyan-200 font-bold uppercase rounded transition text-[10px]"
                        >
                          SET WAYPOINT
                        </button>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500 italic text-[11px]">
                  Click a star system node on the 3D grid plane to lock tactical sensor telemetry.
                </div>
              )}
            </div>

            {/* Bottom Status Note */}
            <div className="text-[9px] text-neutral-500 border-t border-neutral-800 pt-2 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span>Online • Connected to UniNav 3D Coordinate Link</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
