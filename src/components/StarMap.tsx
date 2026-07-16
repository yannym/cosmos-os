import React, { useState, useMemo, useRef, useEffect } from "react";
import { GalaxyCell, Position, Mission, Quest } from "../types";
import { FACTIONS, STAR_SYSTEMS_PROFILES } from "../constants";
import { Compass, Crosshair, DoorOpen, HelpCircle, Map, MapPin, Orbit, RotateCcw, Move, Info, Zap, Building2 } from "lucide-react";
import { AudioEngine } from "../audio";

interface StarMapProps {
  galaxy: GalaxyCell[][];
  playerPosition: Position;
  activeMissions: Mission[];
  activeQuests: Quest[];
  onWarpJump: (x: number, y: number) => void;
  themeColor: "green" | "amber" | "cyan";
  mapBounds?: { minX: number; maxX: number; minY: number; maxY: number };
  currentSystemIndex?: number;
  waypoint?: number | null;
  plannedRoute?: Position[] | null;
  setPlannedRoute?: React.Dispatch<React.SetStateAction<Position[] | null>>;
}

export const StarMap: React.FC<StarMapProps> = ({
  galaxy,
  playerPosition,
  activeMissions,
  activeQuests,
  onWarpJump,
  themeColor,
  mapBounds,
  currentSystemIndex,
  waypoint,
  plannedRoute,
  setPlannedRoute,
}) => {
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number; data: GalaxyCell } | null>(null);

  // Generate 3D depth-layered background stars
  const mapStars = useMemo(() => {
    const list = [];
    for (let i = 0; i < 60; i++) {
      list.push({
        id: i,
        x: Math.random() * 400,
        y: Math.random() * 400,
        z: Math.random() * 180 - 90, // range -90px to +90px in 3D space
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.75 + 0.25,
        pulse: Math.random() > 0.4,
      });
    }
    return list;
  }, []);

  const isQuestWaypoint = (x: number, y: number) => activeQuests.some(q => q.currentStep < q.steps.length && q.steps[q.currentStep].x === x && q.steps[q.currentStep].y === y);
  const isMissionTarget = (x: number, y: number) => activeMissions.some(m => m.targetSector?.x === x && m.targetSector?.y === y);

  const findShortestPath = (start: Position, target: { x: number; y: number }): Position[] | null => {
    const queue: { pos: Position; path: Position[] }[] = [];
    const visited = new Set<string>();

    queue.push({ pos: start, path: [start] });
    visited.add(`${start.x},${start.y}`);

    const bounds = mapBounds || { minX: 0, maxX: 9, minY: 0, maxY: 9 };

    while (queue.length > 0) {
      const { pos, path } = queue.shift()!;
      if (pos.x === target.x && pos.y === target.y) {
        return path;
      }

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const nx = pos.x + dx;
          const ny = pos.y + dy;

          if (nx >= bounds.minX && nx <= bounds.maxX && ny >= bounds.minY && ny <= bounds.maxY) {
            if (galaxy[nx]?.[ny]) {
              const key = `${nx},${ny}`;
              if (!visited.has(key)) {
                visited.add(key);
                queue.push({
                  pos: { x: nx, y: ny },
                  path: [...path, { x: nx, y: ny }]
                });
              }
            }
          }
        }
      }
    }
    return null;
  };

  useEffect(() => {
    if (selectedCell) {
      const isTarget = isMissionTarget(selectedCell.x, selectedCell.y) || isQuestWaypoint(selectedCell.x, selectedCell.y);
      if (isTarget) {
        const path = findShortestPath(playerPosition, { x: selectedCell.x, y: selectedCell.y });
        setPlannedRoute?.(path);
      }
    }
  }, [selectedCell]);

  useEffect(() => {
    if (waypoint !== undefined && waypoint !== null && currentSystemIndex !== undefined) {
      if (waypoint === currentSystemIndex) {
          return;
      }
      
      const getSystemPath = (startIdx: number, targetIdx: number) => {
        const queue: { idx: number, path: number[] }[] = [];
        const visited = new Set<number>();
        queue.push({ idx: startIdx, path: [startIdx] });
        visited.add(startIdx);
        
        while (queue.length > 0) {
            const { idx, path } = queue.shift()!;
            if (idx === targetIdx) return path;
            const profile = STAR_SYSTEMS_PROFILES[idx];
            if (profile && profile.jumpLanes) {
                for (const neighbor of profile.jumpLanes) {
                    if (!visited.has(neighbor)) {
                        visited.add(neighbor);
                        queue.push({ idx: neighbor, path: [...path, neighbor] });
                    }
                }
            }
        }
        return null;
      };

      const path = getSystemPath(currentSystemIndex, waypoint);
      if (path && path.length > 1) {
          const nextSystemIdx = path[1];
          const bounds = mapBounds || { minX: 0, maxX: 9, minY: 0, maxY: 9 };
          for (let x = bounds.minX; x <= bounds.maxX; x++) {
              for (let y = bounds.minY; y <= bounds.maxY; y++) {
                  if (galaxy[x]?.[y]?.jumpGate?.targetSystemIndex === nextSystemIdx) {
                      const gridPath = findShortestPath(playerPosition, { x, y });
                      setPlannedRoute?.(gridPath);
                      return;
                  }
              }
          }
      }
    }
  }, [waypoint, currentSystemIndex, galaxy, playerPosition, mapBounds]);

  // 3D Camera State via Refs for 60fps bypass
  const pitchRef = useRef<number>(60);
  const yawRef = useRef<number>(-45);
  const zoomRef = useRef<number>(1);
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cosmos_os_starmap_camera");
      if (saved) {
        const { pitch, yaw, zoom } = JSON.parse(saved);
        if (pitch !== undefined) pitchRef.current = pitch;
        if (yaw !== undefined) yawRef.current = yaw;
        if (zoom !== undefined) zoomRef.current = zoom;
        updateCamera();
      }
    } catch (e) {}
  }, []);
  
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  const updateCamera = () => {
    const el = sceneRef.current;
    if (el) {
      el.style.setProperty("--pitch", `${pitchRef.current}deg`);
      el.style.setProperty("--yaw", `${yawRef.current}deg`);
      el.style.setProperty("--neg-pitch", `${-pitchRef.current}deg`);
      el.style.setProperty("--neg-yaw", `${-yawRef.current}deg`);
      el.style.transform = `rotateX(${pitchRef.current}deg) rotateZ(${yawRef.current}deg) scale(${zoomRef.current})`;
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    if (e.target === containerRef.current) {
        setSelectedCell(null); // Click on background deselects
    }
  };

  useEffect(() => {
    updateCamera();
  }, []);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      
      if (e.shiftKey || e.button === 2) { // Right click or shift for pitch
         pitchRef.current = Math.max(10, Math.min(85, pitchRef.current - dy * 0.5));
      } else {
         yawRef.current = yawRef.current - dx * 0.5;
         pitchRef.current = Math.max(10, Math.min(85, pitchRef.current - dy * 0.5)); // also allow pitch on left drag
      }
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      updateCamera();
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      try {
        localStorage.setItem("cosmos_os_starmap_camera", JSON.stringify({ pitch: pitchRef.current, yaw: yawRef.current, zoom: zoomRef.current }));
      } catch (e) {}
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  const handleWheel = (e: React.WheelEvent) => {
    zoomRef.current = Math.max(0.3, Math.min(2.5, zoomRef.current - e.deltaY * 0.002));
    updateCamera();
    try {
      localStorage.setItem("cosmos_os_starmap_camera", JSON.stringify({ pitch: pitchRef.current, yaw: yawRef.current, zoom: zoomRef.current }));
    } catch (e) {}
  };

  const getZCoordinate = (x: number, y: number) => {
    if (x === 4 && y === 4) return 0.0; 
    const val = Math.sin(x * 12.9898 + y * 78.233 + (currentSystemIndex || 0) * 11.3) * 5;
    return Math.round(val * 10) / 10;
  };

  const bounds = mapBounds || { minX: 0, maxX: 9, minY: 0, maxY: 9 };
  const minX = Math.max(0, bounds.minX);
  const maxX = Math.min(9, bounds.maxX); // Limit to 10x10 maximum
  const minY = Math.max(0, bounds.minY);
  const maxY = Math.min(9, bounds.maxY);

  const cells = useMemo(() => {
    const arr = [];
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (galaxy[x]?.[y]) {
            arr.push({ x, y, data: galaxy[x][y], z: getZCoordinate(x, y) });
        }
      }
    }
    return arr;
  }, [galaxy, minX, maxX, minY, maxY, currentSystemIndex]);

  const renderedCells = useMemo(() => cells.map((cell) => {
    const { x, y, data, z } = cell;
    const isPlayer = playerPosition.x === x && playerPosition.y === y;
    const isSelected = selectedCell?.x === x && selectedCell?.y === y;
    const isAdjacent = Math.abs(playerPosition.x - x) <= 1 && Math.abs(playerPosition.y - y) <= 1;
    const canWarp = isAdjacent && !isPlayer;
    
    // Coordinates on the 400x400 plane
    const px = (x - minX) * 40;
    const py = (y - minY) * 40;
    const pz = z * 15; // Z elevation in pixels

    let color = pz > 0 ? "rgba(16,185,129,0.3)" : pz < 0 ? "rgba(239,68,68,0.3)" : "rgba(100,100,100,0.5)";
    let factionClass = "";
    let border = "1px solid rgba(255,255,255,0.2)";
    if (isPlayer) { color = "rgba(234,179,8,0.8)"; border = "2px solid #eab308"; }
    else if (isSelected) { color = "rgba(16,185,129,0.8)"; border = "2px solid #10b981"; }
    else if (isMissionTarget(x,y)) { color = "rgba(59,130,246,0.6)"; border = "2px solid #3b82f6"; }
    else if (isQuestWaypoint(x,y)) { color = "rgba(6,182,212,0.6)"; border = "2px solid #06b6d4"; }
    else if (canWarp) { border = "1px solid #fff"; }
    else if (data.explored && FACTIONS[data.faction]) {
        factionClass = FACTIONS[data.faction].color; 
        color = pz > 0 ? "rgba(16,185,129,0.15)" : pz < 0 ? "rgba(239,68,68,0.15)" : "";
        border = pz > 0 ? "1px solid rgba(16,185,129,0.6)" : pz < 0 ? "1px solid rgba(239,68,68,0.6)" : "1px solid rgba(255,255,255,0.4)";
    }

    return (
      <React.Fragment key={`${x}-${y}`}>
        {/* Transparent Base Click Area for CMD+Click raycasting through grid */}
        <div
          onPointerDown={(e) => {
             if (e.metaKey || e.ctrlKey) {
                 AudioEngine.playBeep(450, 0.05);
                 setSelectedCell(cell);
                 e.stopPropagation();
             }
          }}
          className="absolute"
          style={{
            left: `${px}px`,
            top: `${py}px`,
            width: "40px",
            height: "40px",
            transform: "translateZ(0px)",
            pointerEvents: "auto",
            zIndex: 0,
          }}
        />
        {/* Vertical Line */}
        {pz !== 0 && (
          <div 
            className="absolute pointer-events-none"
            style={{
              left: `${px + 20}px`,
              top: `${py + 20}px`,
              width: "1px",
              height: `${Math.abs(pz)}px`,
              backgroundColor: pz > 0 ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)",
              transformOrigin: "top left",
              transform: `rotateX(${pz > 0 ? -90 : 90}deg)`
            }}
          />
        )}

        {/* Pulsing ring for Active Missions / Quests */}
        {(isMissionTarget(x, y) || isQuestWaypoint(x, y)) && (
          <div
            className="absolute pointer-events-none rounded-full animate-ping"
            style={{
              left: `${px + 6}px`,
              top: `${py + 6}px`,
              width: "28px",
              height: "28px",
              border: isQuestWaypoint(x, y) ? "2px solid rgba(6,182,212,0.8)" : "2px solid rgba(59,130,246,0.8)",
              transformStyle: "preserve-3d",
              transform: `translateZ(${pz}px) rotateZ(var(--neg-yaw)) rotateX(var(--neg-pitch))`,
            }}
          />
        )}

        {/* Bubble Node */}
        <div
          onClick={() => {
              AudioEngine.playBeep(450, 0.05);
              setSelectedCell(cell);
          }}
          onDoubleClick={() => canWarp && onWarpJump(x, y)}
          className={`absolute rounded-full cursor-pointer transition-transform hover:scale-125 flex items-center justify-center text-[10px] ${factionClass}`}
          style={{
            left: `${px + 12}px`,
            top: `${py + 12}px`,
            width: "16px",
            height: "16px",
            backgroundColor: color || "currentColor",
            border: border,
            transformStyle: "preserve-3d",
            transform: `translateZ(${pz}px) rotateZ(var(--neg-yaw)) rotateX(var(--neg-pitch))`,
            boxShadow: isPlayer || isSelected ? "0 0 10px currentColor" : (pz > 0 ? "inset 0 0 4px rgba(16,185,129,0.5)" : pz < 0 ? "inset 0 0 4px rgba(239,68,68,0.5)" : "none"),
          }}
        >
          {isPlayer ? <MapPin size={10} className="text-white" /> :
           !data.explored ? <HelpCircle size={10} className="text-neutral-500 opacity-50" /> :
           data.planet ? <Orbit size={10} className={factionClass || "text-neutral-300"} /> :
           data.station ? <Building2 size={10} className={factionClass || "text-blue-300"} /> :
           data.anomaly ? <Zap size={10} className="text-yellow-400" /> :
           data.jumpGate ? <DoorOpen size={10} className="text-cyan-400" /> : null}
        </div>
      </React.Fragment>
    );
  }), [cells, playerPosition, selectedCell, activeMissions, activeQuests, minX, minY, onWarpJump]);

  const routeLines = useMemo(() => {
    if (!plannedRoute || plannedRoute.length < 2) return null;
    const lines = [];
    const boundX = Math.max(0, bounds.minX);
    const boundY = Math.max(0, bounds.minY);

    for (let i = 0; i < plannedRoute.length - 1; i++) {
      const p1 = plannedRoute[i];
      const p2 = plannedRoute[i + 1];

      const cx1 = (p1.x - boundX) * 40 + 20;
      const cy1 = (p1.y - boundY) * 40 + 20;
      const cx2 = (p2.x - boundX) * 40 + 20;
      const cy2 = (p2.y - boundY) * 40 + 20;

      const cz1 = getZCoordinate(p1.x, p1.y) * 15;
      const cz2 = getZCoordinate(p2.x, p2.y) * 15;

      const dx = cx2 - cx1;
      const dy = cy2 - cy1;
      const dz = cz2 - cz1;
      
      const xyDist = Math.sqrt(dx * dx + dy * dy);
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const angleXY = Math.atan2(dy, dx) * (180 / Math.PI);
      const angleZ = Math.atan2(dz, xyDist) * (180 / Math.PI);

      lines.push(
        <div
          key={`route-line-${i}`}
          className="absolute origin-left h-[2.5px] bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] pointer-events-none animate-pulse"
          style={{
            left: `${cx1}px`,
            top: `${cy1}px`,
            width: `${length}px`,
            transformStyle: "preserve-3d",
            transform: `translateZ(${cz1}px) rotateZ(${angleXY}deg) rotateY(${-angleZ}deg)`,
            zIndex: 1,
          }}
        />
      );
    }
    return lines;
  }, [plannedRoute, bounds, currentSystemIndex]);

  const handleResetCamera = () => {
    AudioEngine.playBeep(600, 0.05);
    pitchRef.current = 60;
    yawRef.current = -45;
    zoomRef.current = 1;
    updateCamera();
    try {
      localStorage.setItem("cosmos_os_starmap_camera", JSON.stringify({ pitch: 60, yaw: -45, zoom: 1 }));
    } catch (e) {}
  };

  return (
    <div className="flex w-full h-full text-neutral-200 font-mono text-sm overflow-hidden bg-neutral-950">
      
      {/* 3D Viewport */}
      <div 
        ref={containerRef}
        className="flex-grow relative overflow-hidden cursor-move select-none touch-none"
        onPointerDown={handlePointerDown}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="absolute top-4 left-4 z-10 flex gap-2">
            <button onClick={handleResetCamera} className="bg-neutral-800/80 hover:bg-neutral-700 p-2 rounded border border-neutral-700">
                <RotateCcw size={16} />
            </button>
            <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800 text-xs text-neutral-400">
                Drag to orbit • Scroll to zoom
            </div>
        </div>

        {/* 3D Scene */}
        <div 
          className="w-full h-full flex justify-center items-center"
          style={{ perspective: "1000px" }}
        >
          <div 
            ref={sceneRef}
            className="relative"
            style={{ 
              transformStyle: "preserve-3d",
              transform: `rotateX(${pitchRef.current}deg) rotateZ(${yawRef.current}deg) scale(${zoomRef.current})`,
              width: "400px", 
              height: "400px",
              "--pitch": `${pitchRef.current}deg`,
              "--yaw": `${yawRef.current}deg`,
              "--neg-pitch": `${-pitchRef.current}deg`,
              "--neg-yaw": `${-yawRef.current}deg`,
            } as React.CSSProperties}
          >
            {/* Base Grid Plane */}
            <div className="absolute inset-0 border border-neutral-700/50 pointer-events-none" 
                 style={{ 
                     backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                     backgroundSize: "40px 40px"
                 }} 
            />

            {/* 3D Starfield Background */}
            {mapStars.map((star) => (
              <div
                key={`bg-star-${star.id}`}
                className={`absolute rounded-full bg-white ${star.pulse ? "animate-pulse" : ""} pointer-events-none`}
                style={{
                  left: `${star.x}px`,
                  top: `${star.y}px`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  opacity: star.opacity,
                  transformStyle: "preserve-3d",
                  transform: `translateZ(${star.z}px)`,
                  boxShadow: "0 0 4px rgba(255, 255, 255, 0.8)",
                }}
              />
            ))}

            {/* Route Jumps Vector Path */}
            {routeLines}

            {/* Cells */}
            {renderedCells}
          </div>
        </div>
      </div>

      {/* Details Panel */}
      <div className="w-80 bg-neutral-900 border-l border-neutral-800 p-4 flex flex-col shrink-0 overflow-y-auto justify-between">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-neutral-100 mb-2 border-b border-neutral-800 pb-2 flex items-center gap-2">
              <Info size={18}/> Sector Details
          </h2>
          
          {selectedCell ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 bg-neutral-950 p-2 rounded border border-neutral-800">
                  <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-400">Navigational Vector</span>
                      <span className="font-bold text-cyan-400 font-mono">
                        {bounds.maxX === 2 
                          ? `[Void X:${selectedCell.x - 1}, Y:${selectedCell.y - 1}]` 
                          : `[X:${selectedCell.x - 4}, Y:${selectedCell.y - 4}]`}
                      </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                      <span>Grid Cell</span>
                      <span>[{selectedCell.x}, {selectedCell.y}]</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                      <span>Z Elevation</span>
                      <span>{selectedCell.z} ly</span>
                  </div>
              </div>
              
              <div className="space-y-2">
                  <div className="text-xs text-neutral-500 uppercase">Status</div>
                  {selectedCell.data.explored ? (
                      <div className="space-y-1">
                          <div className="flex justify-between">
                              <span className="text-neutral-400">Faction</span>
                              <span className="text-right">{selectedCell.data.faction || "Unclaimed"}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-neutral-400">Hostility</span>
                              <span className={selectedCell.data.hostileChance > 0.4 ? "text-red-400" : "text-green-400"}>
                                  {Math.round(selectedCell.data.hostileChance * 100)}%
                              </span>
                          </div>
                      </div>
                  ) : (
                      <div className="text-neutral-500 italic text-xs">Unexplored Sector</div>
                  )}
              </div>

              {selectedCell.data.explored && (
                  <div className="space-y-2">
                      <div className="text-xs text-neutral-500 uppercase">Points of Interest</div>
                      {selectedCell.data.planet && (
                          <div className="bg-neutral-950 p-2 rounded border border-neutral-800 text-sm">
                              <Orbit size={14} className="inline mr-2 text-emerald-500" />
                              {selectedCell.data.planet.name}
                          </div>
                      )}
                      {selectedCell.data.station && (
                          <div className="bg-neutral-950 p-2 rounded border border-neutral-800 text-sm">
                              <Building2 size={14} className="inline mr-2 text-blue-400" />
                              {selectedCell.data.station.name}
                          </div>
                      )}
                      {selectedCell.data.anomaly && (
                          <div className="bg-neutral-950 p-2 rounded border border-neutral-800 text-sm text-yellow-400">
                              <Zap size={14} className="inline mr-2" />
                              Detected Anomaly
                          </div>
                      )}
                      {selectedCell.data.jumpGate && (
                          <div className="bg-neutral-950 p-2 rounded border border-neutral-800 text-sm text-cyan-400">
                              <DoorOpen size={14} className="inline mr-2" />
                              Hyperlane Gate to {STAR_SYSTEMS_PROFILES[selectedCell.data.jumpGate.targetSystemIndex]?.name || "Unknown System"}
                          </div>
                      )}
                      {!selectedCell.data.planet && !selectedCell.data.station && !selectedCell.data.anomaly && !selectedCell.data.jumpGate && (
                          <div className="text-neutral-500 text-sm">Empty space</div>
                      )}
                  </div>
              )}

              {/* Course Plotter Actions */}
              <div className="space-y-2 border-t border-neutral-800/80 pt-3">
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      AudioEngine.playBeep(700, 0.1, "sine");
                      const path = findShortestPath(playerPosition, { x: selectedCell.x, y: selectedCell.y });
                      setPlannedRoute?.(path);
                    }}
                    className="flex-1 py-1 px-2 bg-cyan-950/40 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black rounded font-bold text-xs text-center transition cursor-pointer"
                  >
                    PLAN ROUTE
                  </button>
                  {plannedRoute && (
                    <button 
                      onClick={() => {
                        AudioEngine.playBeep(400, 0.1, "sine");
                        setPlannedRoute?.(null);
                      }}
                      className="py-1 px-2 bg-red-950/40 border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-black rounded font-bold text-xs text-center transition cursor-pointer"
                    >
                      CLEAR
                    </button>
                  )}
                </div>

                {plannedRoute && (
                  <div className="bg-cyan-950/20 border border-cyan-800/30 p-2 rounded text-[11px] text-cyan-400 font-mono space-y-1">
                    <div className="font-bold border-b border-cyan-900 pb-1 mb-1 uppercase tracking-wider text-[9px]">Jump Flight Plan</div>
                    <div className="flex justify-between">
                      <span>Required Jumps:</span>
                      <strong className="text-white">{plannedRoute.length - 1}</strong>
                    </div>
                    <div className="text-[10px] leading-relaxed opacity-90 mt-1 max-h-24 overflow-y-auto pr-1">
                      {plannedRoute.map((p, i) => {
                        const isLast = i === plannedRoute.length - 1;
                        const name = bounds.maxX === 2 
                          ? `[Void X:${p.x - 1}, Y:${p.y - 1}]` 
                          : `[X:${p.x - 4}, Y:${p.y - 4}]`;
                        return (
                          <span key={i}>
                            <span className={i === 0 ? "text-yellow-400 font-bold" : isLast ? "text-cyan-400 font-bold animate-pulse" : "text-neutral-400"}>{name}</span>
                            {!isLast && <span className="text-neutral-600 px-0.5">➔</span>}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                  {Math.abs(playerPosition.x - selectedCell.x) <= 1 && Math.abs(playerPosition.y - selectedCell.y) <= 1 ? (
                      playerPosition.x === selectedCell.x && playerPosition.y === selectedCell.y ? (
                          <button disabled className="w-full py-2 bg-neutral-800 text-neutral-500 rounded font-bold cursor-not-allowed text-xs">
                              Current Location
                          </button>
                      ) : (
                          <button 
                              onClick={() => onWarpJump(selectedCell.x, selectedCell.y)}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition-colors text-xs"
                          >
                              WARP JUMP
                          </button>
                      )
                  ) : (
                      <button disabled className="w-full py-2 bg-neutral-800 text-neutral-500 rounded font-bold cursor-not-allowed text-xs">
                          Out of Range
                      </button>
                  )}
              </div>
            </div>
          ) : (
            <div className="text-neutral-500 text-center py-6">
              <Orbit size={36} className="mx-auto mb-3 opacity-20" />
              <p className="text-xs">Select a sector on the star grid to view POIs, telemetry data, and calculate jump routes.</p>
            </div>
          )}
        </div>

        {/* Mission Waypoints / Contracts tracker at the bottom */}
        <div className="mt-4 pt-4 border-t border-neutral-800/80 space-y-2 bg-neutral-900/60 rounded">
          <div className="text-xs text-neutral-400 uppercase font-bold tracking-wider flex items-center gap-1.5 px-1">
            <Crosshair size={12} className="text-cyan-400" /> Active Waypoints
          </div>
          
          {activeQuests.length === 0 && activeMissions.length === 0 ? (
            <div className="text-xs text-neutral-500 italic px-1">No active targets found in log.</div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {/* Active campaigns */}
              {activeQuests.map((quest) => {
                if (quest.currentStep >= quest.steps.length) return null;
                const wp = quest.steps[quest.currentStep];
                const isSelected = selectedCell?.x === wp.x && selectedCell?.y === wp.y;
                return (
                  <div 
                    key={quest.id} 
                    className={`p-2 border rounded text-xs flex flex-col gap-1 transition ${
                      isSelected ? "border-cyan-500 bg-cyan-950/30" : "border-neutral-800 bg-neutral-950/40 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex justify-between font-bold text-neutral-200">
                      <span className="truncate">{quest.title}</span>
                      <span className="text-cyan-400 shrink-0 text-[10px]">Story</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate">{wp.stepTitle}</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-bold text-cyan-400 font-mono">
                        {bounds.maxX === 2 ? `[Void X:${wp.x - 1}, Y:${wp.y - 1}]` : `[X:${wp.x - 4}, Y:${wp.y - 4}]`}
                      </span>
                      <button
                        onClick={() => {
                          AudioEngine.playBeep(700, 0.1, "sine");
                          const data = galaxy[wp.x]?.[wp.y] || { explored: false, faction: "neutral" };
                          setSelectedCell({ x: wp.x, y: wp.y, data });
                          const path = findShortestPath(playerPosition, { x: wp.x, y: wp.y });
                          setPlannedRoute?.(path);
                        }}
                        className="px-1.5 py-0.5 border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black rounded text-[9px] font-bold"
                      >
                        TARGET & ROUTE
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Active board missions */}
              {activeMissions.map((mission) => {
                if (!mission.targetSector) return null;
                const wp = mission.targetSector;
                const isSelected = selectedCell?.x === wp.x && selectedCell?.y === wp.y;
                return (
                  <div 
                    key={mission.id} 
                    className={`p-2 border rounded text-xs flex flex-col gap-1 transition ${
                      isSelected ? "border-blue-500 bg-blue-950/30" : "border-neutral-800 bg-neutral-950/40 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex justify-between font-bold text-neutral-200">
                      <span className="truncate">{mission.title}</span>
                      <span className="text-blue-400 shrink-0 text-[10px]">Contract</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-bold text-blue-400 font-mono">
                        {bounds.maxX === 2 ? `[Void X:${wp.x - 1}, Y:${wp.y - 1}]` : `[X:${wp.x - 4}, Y:${wp.y - 4}]`}
                      </span>
                      <button
                        onClick={() => {
                          AudioEngine.playBeep(700, 0.1, "sine");
                          const data = galaxy[wp.x]?.[wp.y] || { explored: false, faction: "neutral" };
                          setSelectedCell({ x: wp.x, y: wp.y, data });
                          const path = findShortestPath(playerPosition, { x: wp.x, y: wp.y });
                          setPlannedRoute?.(path);
                        }}
                        className="px-1.5 py-0.5 border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-black rounded text-[9px] font-bold"
                      >
                        TARGET & ROUTE
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
