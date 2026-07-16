import React, { useState, useEffect, useRef, useMemo } from "react";
import { GalaxyCell, Position, CrewMember } from "../types";
import { COMPONENT_ITEMS } from "../constants";
import { AudioEngine } from "../audio";
import { 
  Radio, 
  Compass, 
  Filter, 
  Sliders, 
  Search, 
  Activity, 
  X, 
  Zap, 
  Sparkles, 
  Check, 
  AlertTriangle 
} from "lucide-react";

interface LongRangeScannerProps {
  galaxy: GalaxyCell[][];
  playerPosition: Position;
  fittedComponents: Record<string, string>;
  crew: CrewMember[];
  mapBounds: { minX: number; maxX: number; minY: number; maxY: number };
  setMapBounds: React.Dispatch<React.SetStateAction<{ minX: number; maxX: number; minY: number; maxY: number }>>;
  setGalaxy: React.Dispatch<React.SetStateAction<GalaxyCell[][]>>;
  addTerminalLog: (text: string, category?: "normal" | "danger" | "success" | "info" | "loot") => void;
  onClose: () => void;
  themeColor: "green" | "amber" | "cyan";
  activeShip: string;
}

interface ScanTarget {
  id: string;
  name: string;
  type: "planet" | "asteroid" | "derelict" | "comet";
  angle: number; // 0 to 360
  distance: number; // % radius of radar
  filter: "visible" | "ir" | "xray" | "gamma";
  gridX: number;
  gridY: number;
  analyzed: number; // 0 to 100
  resolved: boolean;
  intensity: number; // 0.1 to 1.0 base signal
  isGhost?: boolean;
  stability?: number;
  isFalseGhost?: boolean;
}

export const LongRangeScanner: React.FC<LongRangeScannerProps> = ({
  galaxy,
  playerPosition,
  fittedComponents,
  crew,
  mapBounds,
  setMapBounds,
  setGalaxy,
  addTerminalLog,
  onClose,
  themeColor,
  activeShip
}) => {
  // Theme styling helpers
  const themeText = themeColor === "green" ? "text-green-400 border-green-500/30 bg-green-950/10" : themeColor === "amber" ? "text-amber-500 border-amber-500/30 bg-amber-950/10" : "text-cyan-400 border-cyan-500/30 bg-cyan-950/10";
  const themeBorder = themeColor === "green" ? "border-green-500" : themeColor === "amber" ? "border-amber-500" : "border-cyan-400";
  const themeBg = themeColor === "green" ? "bg-green-500" : themeColor === "amber" ? "bg-amber-500" : "bg-cyan-400";

  // Scanner tech
  const scanTech = crew.find(c => c.role === "Scanning Technician");
  const scannerSuiteId = fittedComponents.scanner || "scanner_standard";
  const scannerSuite = COMPONENT_ITEMS[scannerSuiteId] || { name: "Standard Scanners", bonus: 0 };
  
  // Noise reduction factor
  let noiseReduction = 0.1; // stock
  if (scannerSuiteId === "scanner_mk1") noiseReduction = 0.3;
  else if (scannerSuiteId === "scanner_mk2") noiseReduction = 0.5;
  else if (scannerSuiteId === "scanner_mk3") noiseReduction = 0.75;
  else if (scannerSuiteId === "scanner_mk4") noiseReduction = 0.9;
  
  // Extra bonus if Scan Tech is in crew
  const techBonus = scanTech ? 0.25 : 0;
  const totalNoiseReduction = Math.min(0.98, noiseReduction + techBonus);

  // States
  const [scanTargets, setScanTargets] = useState<ScanTarget[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [filterKnown, setFilterKnown] = useState<boolean>(false);

  const filteredScanTargets = useMemo(() => {
    return scanTargets.filter(tgt => {
      if (filterKnown) {
        // If filter is active, exclude resolved/already explored targets
        return !tgt.resolved;
      }
      return true;
    });
  }, [scanTargets, filterKnown]);
  const [successModal, setSuccessModal] = useState<{
    active: boolean;
    isGhost: boolean;
    name: string;
    type: string;
    x: number;
    y: number;
    targetId: string;
  } | null>(null);
  
  // Dials/Sliders
  const [antennaAngle, setAntennaAngle] = useState<number>(180);
  const [gain, setGain] = useState<number>(50); // 10 to 100
  const [selectedFilter, setSelectedFilter] = useState<"visible" | "ir" | "xray" | "gamma">("visible");
  const [tunedWavelength, setTunedWavelength] = useState<number>(250); // 100 to 400 nm fine tuner
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [sweepAngle, setSweepAngle] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);

  // Canvas refs
  const spectralCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Procedurally generate a few unmapped scanner targets and load existing/ghost targets on mount
  useEffect(() => {
    const targets: ScanTarget[] = [];
    const minX = mapBounds.minX;
    const maxX = mapBounds.maxX;
    const minY = mapBounds.minY;
    const maxY = mapBounds.maxY;

    // Perfect polar coordinate converter:
    const getRadarAngleAndDist = (targetX: number, targetY: number) => {
      const dx = targetX - playerPosition.x;
      const dy = targetY - playerPosition.y;
      let angle = Math.atan2(dx, dy) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      
      const gridDist = Math.hypot(dx, dy);
      // Map grid distance to radar size: 1 unit is ~12px.
      const distance = Math.min(115, Math.max(12, gridDist * 12));
      return { angle, distance };
    };

    // 1. Load existing system planets, stations, and anomalies as known green noise dots (even explored ones appear)
    for (let x = 0; x < galaxy.length; x++) {
      if (!galaxy[x]) continue;
      for (let y = 0; y < galaxy[x].length; y++) {
        const cell = galaxy[x][y];
        if (!cell) continue;

        // Skip player's current exact coordinate
        if (x === playerPosition.x && y === playerPosition.y) continue;

        if (cell.planet || cell.station || cell.anomaly) {
          const { angle, distance } = getRadarAngleAndDist(x, y);
          
          let type: "planet" | "asteroid" | "derelict" | "comet" = "planet";
          let filter: "visible" | "ir" | "xray" | "gamma" = "visible";
          let name = "";

          if (cell.planet) {
            name = cell.planet.name;
            if (cell.planet.interactionType === "heavy_belt") {
              type = "asteroid";
              filter = "ir";
            } else {
              type = "planet";
              filter = "visible";
            }
          } else if (cell.station) {
            name = cell.station.name;
            type = "derelict";
            filter = "xray";
          } else if (cell.anomaly) {
            name = cell.anomaly.name;
            type = "comet";
            filter = "gamma";
          }

          targets.push({
            id: `exist-${x}-${y}-${Date.now()}`,
            name,
            type,
            angle,
            distance,
            filter,
            gridX: x,
            gridY: y,
            analyzed: cell.explored ? 100 : 0,
            resolved: cell.explored ? true : false,
            intensity: 0.8,
            stability: Math.floor(Math.random() * 21) + 80 // 80 - 100% stability for existing known ones
          });
        }
      }
    }

    // 2. Pick a randomized pool of coordinates across empty, un-explored cells to satisfy the 6-to-12 target count
    const hiddenCandidates: { x: number; y: number; type: string; filter: string }[] = [];
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        if (x === playerPosition.x && y === playerPosition.y) continue;
        const cell = galaxy[x]?.[y];
        if (cell && !cell.explored && !cell.planet && !cell.station && !cell.anomaly && !cell.jumpGate) {
          const rand = Math.random();
          let type = "planet";
          let filter = "visible";
          if (rand < 0.25) {
            type = "planet";
            filter = "visible";
          } else if (rand < 0.5) {
            type = "asteroid";
            filter = "ir";
          } else if (rand < 0.75) {
            type = "derelict";
            filter = "xray";
          } else {
            type = "comet";
            filter = "gamma";
          }
          hiddenCandidates.push({ x, y, type, filter });
        }
      }
    }

    // Shuffle and pick between 6 and 12 hidden sector targets!
    const targetCount = Math.floor(Math.random() * 7) + 6; // 6 to 12 inclusive
    const shuffled = hiddenCandidates.sort(() => 0.5 - Math.random());
    const selectedCoords = shuffled.slice(0, Math.min(shuffled.length, targetCount));

    if (selectedCoords.length === 0) {
      selectedCoords.push(
        { x: Math.min(9, maxX + 1), y: Math.min(9, maxY + 1), type: "derelict", filter: "xray" },
        { x: Math.max(0, minX - 1), y: Math.max(0, minY - 1), type: "asteroid", filter: "ir" }
      );
    }

    const objectNames = {
      planet: ["Astraea Gas Giant", "Crystalline Dwarf Planet", "Chthonian Lava World"],
      asteroid: ["Carbonaceous Core Belt", "S-Type Metallic Ore Ring", "Pyrite Mining Spire"],
      derelict: ["Decommissioned Hegemony Cruiser", "Ruined Syndicate Fuel Siphon", "Pre-Collapse Research Outpost"],
      comet: ["Hyperbolic Volatile Gas Tail", "Oort Ice Ring Core", "Sub-Zero Xenomorph Comet"]
    };

    selectedCoords.forEach((coord, index) => {
      const names = objectNames[coord.type as "planet" | "asteroid" | "derelict" | "comet"];
      const chosenName = names[index % names.length];
      const { angle, distance } = getRadarAngleAndDist(coord.x, coord.y);

      // Randomize stability - some are low stability "false ghosts" (unstable, hard to align)
      const isDifficult = Math.random() < 0.35;
      const stability = isDifficult 
        ? Math.floor(Math.random() * 20) + 15  // 15 - 35% stability (unstable, requires precise scan)
        : Math.floor(Math.random() * 31) + 50; // 50 - 80% stability

      targets.push({
        id: `tgt-${index}-${Date.now()}`,
        name: chosenName,
        type: coord.type as "planet" | "asteroid" | "derelict" | "comet",
        angle: Math.round(angle),
        distance,
        filter: coord.filter as "visible" | "ir" | "xray" | "gamma",
        gridX: coord.x,
        gridY: coord.y,
        analyzed: 0,
        resolved: false,
        intensity: 0.5 + Math.random() * 0.4,
        stability,
        isFalseGhost: isDifficult && Math.random() < 0.7 // looks like a ghost signal initially
      });
    });

    // 3. Add 2 Ghost Targets that look real but flicker/fluctuate and are decoys
    const ghostNames = [
      "Void Mirage Echo-7X",
      "Multipath EM Reflection",
      "Stellar Ionized Phantom",
      "Cosmic Dust Decoy Beacon"
    ];
    const ghostTypes = ["planet", "asteroid", "derelict", "comet"] as const;
    const ghostFilters = ["visible", "ir", "xray", "gamma"] as const;

    for (let i = 0; i < 2; i++) {
      const angle = (Math.floor(Math.random() * 320) + 20) % 360;
      const distance = 45 + Math.floor(Math.random() * 50);
      const type = ghostTypes[Math.floor(Math.random() * ghostTypes.length)];
      const filter = ghostFilters[Math.floor(Math.random() * ghostFilters.length)];
      const name = ghostNames[Math.floor(Math.random() * ghostNames.length)];

      // Ghosts have randomized low stability
      const stability = Math.floor(Math.random() * 21) + 10; // 10% to 30% stability

      targets.push({
        id: `ghost-${i}-${Date.now()}`,
        name,
        type,
        angle,
        distance,
        filter,
        gridX: -99,
        gridY: -99,
        analyzed: 0,
        resolved: false,
        intensity: 0.35 + Math.random() * 0.4,
        isGhost: true,
        stability
      });
    }

    // 4. If player has MAXED scanning setup, spawn a legendary super distant real target at any empty cell
    const scannerSuiteId = fittedComponents.scanner || "scanner_standard";
    const scanTech = crew.find(c => c.role === "Scanning Technician");
    const hasMaxedScanningSetup = scannerSuiteId === "scanner_mk4" && scanTech && activeShip === "science_explorer";

    if (hasMaxedScanningSetup) {
      // Find an empty cell
      let hiddenX = -1;
      let hiddenY = -1;
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          const cell = galaxy[x]?.[y];
          if (cell && !cell.planet && !cell.station && !cell.anomaly && !cell.jumpGate) {
            hiddenX = x;
            hiddenY = y;
            break;
          }
        }
        if (hiddenX !== -1) break;
      }

      if (hiddenX !== -1) {
        const { angle, distance } = getRadarAngleAndDist(hiddenX, hiddenY);
        targets.push({
          id: `super-distant-${Date.now()}`,
          name: "Pre-Collapse Quantum Dyson Siphon",
          type: "derelict",
          angle: Math.round(angle),
          distance: 110, // Extreme distance
          filter: "gamma",
          gridX: hiddenX,
          gridY: hiddenY,
          analyzed: 0,
          resolved: false,
          intensity: 0.95,
          stability: 18, // unstable, requires highly precise scan wavelength +/- 1.5nm
          isGhost: false,
          isFalseGhost: true
        });
      }
    }

    setScanTargets(targets);
  }, [mapBounds, galaxy, playerPosition, fittedComponents, crew, activeShip]);

  // Radar sweep animation
  useEffect(() => {
    let animId: number;
    const tick = () => {
      setSweepAngle(prev => {
        const next = (prev + 3) % 360;
        // Check if sweep passes over any target to trigger beep
        filteredScanTargets.forEach(tgt => {
          if (Math.abs(next - tgt.angle) < 3) {
            AudioEngine.playBeep(580, 0.04, "sine");
          }
        });
        return next;
      });
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [filteredScanTargets]);

  // Draw simulated spectral emission chart with animated noise
  useEffect(() => {
    const canvas = spectralCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const width = canvas.width;
    const height = canvas.height;

    const renderGraph = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      for (let x = 50; x < width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 30; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Compute total spectral value from targets matching current antenna position
      const signalPoints: { x: number; height: number; width: number; label: string }[] = [];

      filteredScanTargets.forEach(tgt => {
        // Find angular proximity to target
        const angularDistance = Math.abs(antennaAngle - tgt.angle);
        if (angularDistance < 18) {
          // Angle multiplier peaks at 1.0 when perfectly aligned
          const angleFactor = Math.max(0, 1 - angularDistance / 18);
          // Filter multiplier
          const filterFactor = selectedFilter === tgt.filter ? 1.0 : 0.25;
          // Gain scales the signal
          const gainFactor = gain / 50;

          // Ghost signals fluctuate heavily over time unless frozen
          const fluctuation = tgt.isGhost 
            ? (isFrozen ? 0.75 : 0.45 + Math.sin(Date.now() * 0.012) * 0.4 + Math.random() * 0.2) 
            : 1.0;

          const signalHeight = 80 * tgt.intensity * angleFactor * filterFactor * gainFactor * fluctuation;
          
          // Place peaks along the graph based on the target angle/type
          // Planet is near 120px, Asteroid 200px, Derelict 280px, Comet 360px
          let targetX = 120;
          let label = "VALENCE CORE";
          if (tgt.type === "asteroid") { targetX = 200; label = "ORE LINE"; }
          else if (tgt.type === "derelict") { targetX = 280; label = "CHASSIS METALS"; }
          else if (tgt.type === "comet") { targetX = 360; label = "VOLATILE GAS"; }

          signalPoints.push({
            x: targetX,
            height: signalHeight,
            width: 30 + (18 - angularDistance) * 2,
            label
          });
        }
      });

      // Render the spectral lines (raw input with jittering noise)
      ctx.beginPath();
      ctx.moveTo(0, height - 10);

      const baseNoiseFloor = height - 25 - (gain * 0.15);
      const noiseAmplitude = 15 * (1 - totalNoiseReduction) * (gain / 50);

      for (let x = 0; x < width; x += 3) {
        // Calculate raw signal peak impact at this x coordinate
        let peakYOffset = 0;
        signalPoints.forEach(pt => {
          const distFromPeak = Math.abs(x - pt.x);
          if (distFromPeak < pt.width) {
            // Gaussian-like curve for peak
            const curve = Math.exp(-Math.pow(distFromPeak / (pt.width * 0.5), 2));
            peakYOffset += pt.height * curve;
          }
        });

        // Add chaotic low-frequency background waves for lower-end scanners (messy noise)
        let messyNoiseChaos = 0;
        if (totalNoiseReduction < 0.4) {
          // Standard scanner: huge chaotic waves
          messyNoiseChaos = Math.sin(x * 0.05 + (isFrozen ? 1 : Date.now() * 0.007)) * 18 * (gain / 50);
          messyNoiseChaos += Math.cos(x * 0.12) * 8 * (gain / 50);
        } else if (totalNoiseReduction < 0.7) {
          // MK1/MK2: moderate background hum
          messyNoiseChaos = Math.sin(x * 0.07 + (isFrozen ? 1 : Date.now() * 0.004)) * 6 * (gain / 50);
        }

        // Add randomized jitter noise unless frozen
        const jitter = isFrozen ? Math.sin(x * 0.1) * (noiseAmplitude * 0.3) : (Math.random() - 0.5) * noiseAmplitude;
        
        const finalY = Math.max(10, Math.min(height - 5, baseNoiseFloor - peakYOffset + jitter + messyNoiseChaos));
        ctx.lineTo(x, finalY);
      }

      ctx.strokeStyle = themeColor === "green" ? "#22c55e" : themeColor === "amber" ? "#f59e0b" : "#22d3ee";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Render vertical indicators for specific elements
      const elements = [
        { x: 120, name: "Si/O (Silica/Oxygen)", color: "rgba(168, 85, 247, 0.6)" },
        { x: 200, name: "Fe/Ni (Iron/Nickel)", color: "rgba(234, 179, 8, 0.6)" },
        { x: 280, name: "Ti/Al (Titanium/Alloy)", color: "rgba(59, 130, 246, 0.6)" },
        { x: 360, name: "H2/He (Hydrogen/Helium)", color: "rgba(236, 72, 153, 0.6)" }
      ];

      elements.forEach(el => {
        ctx.strokeStyle = el.color;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(el.x, 0);
        ctx.lineTo(el.x, height);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = el.color;
        ctx.font = "8px monospace";
        ctx.fillText(el.name, el.x + 4, 12);
      });

      // Draw player's tuned scan wavelength line
      ctx.strokeStyle = "#eab308"; // yellow-500
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(tunedWavelength, 0);
      ctx.lineTo(tunedWavelength, height);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#eab308";
      ctx.font = "bold 9px monospace";
      ctx.fillText(`TUNED: ${tunedWavelength}nm`, tunedWavelength + 4, height - 6);

      if (!isFrozen) {
        animId = requestAnimationFrame(renderGraph);
      }
    };

    renderGraph();
    return () => cancelAnimationFrame(animId);
  }, [filteredScanTargets, antennaAngle, gain, selectedFilter, isFrozen, totalNoiseReduction, themeColor, tunedWavelength]);

  const getTargetWavelength = (type: string) => {
    if (type === "asteroid") return 200;
    if (type === "derelict") return 280;
    if (type === "comet") return 360;
    return 120; // planet
  };

  // Check if current angle is close to any target
  const activeTarget = filteredScanTargets.find(tgt => Math.abs(antennaAngle - tgt.angle) < 18);
  const angleAlignedTarget = filteredScanTargets.find(tgt => Math.abs(antennaAngle - tgt.angle) <= 3 && selectedFilter === tgt.filter);
  
  const alignedTarget = angleAlignedTarget && Math.abs(tunedWavelength - getTargetWavelength(angleAlignedTarget.type)) <= (angleAlignedTarget.stability && angleAlignedTarget.stability < 40 ? 1.5 : 5)
    ? angleAlignedTarget
    : null;

  // Handle Analysis Tick
  useEffect(() => {
    if (!isAnalyzing) return;

    if (!alignedTarget) {
      const timer = setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisProgress(0);
        AudioEngine.playBeep(180, 0.2, "sawtooth");
        addTerminalLog("[LOCK LOST]: Emission wavelength drifted or antenna misaligned. Re-align scanners to maintain lock.", "danger");
      }, 0);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        const next = prev + 10;
        if (next >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          
          // Ghost confidence is calculated as 100 - stability
          const confidence = 100 - (alignedTarget.stability || 20);
          const isActuallyReal = !alignedTarget.isGhost || confidence <= 75;

          // We use setTimeout to ensure this runs after the current render cycle/state update
          setTimeout(() => {
            if (isActuallyReal) {
              resolveDiscovery(alignedTarget);
            } else {
              setSuccessModal({
                active: true,
                isGhost: true,
                name: alignedTarget.name,
                type: alignedTarget.type,
                x: -99,
                y: -99,
                targetId: alignedTarget.id
              });
            }
          }, 0);

          return 100;
        }
        AudioEngine.playBeep(650 + next * 3, 0.05, "sine");
        return next;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isAnalyzing, alignedTarget]);

  const startAnalysis = () => {
    if (!alignedTarget) {
      AudioEngine.playBeep(150, 0.35, "sawtooth");
      if (angleAlignedTarget) {
        addTerminalLog(`[SCAN SYSTEM ERROR]: Emission wavelength mismatch. Tune the scan beam to match target's peak emission band (${getTargetWavelength(angleAlignedTarget.type)} nm).`, "danger");
      } else {
        addTerminalLog("[SCAN SYSTEM ERROR]: Unable to lock phase emitters. Signal-to-noise ratio too low. Calibrate antenna orientation and band filters.", "danger");
      }
      return;
    }

    setIsFrozen(true);
    setAnalysisProgress(0);
    setIsAnalyzing(true);
    AudioEngine.playBeep(880, 0.15, "triangle");
  };

  const resolveDiscovery = (tgt: ScanTarget) => {
    AudioEngine.playBeep(950, 0.4, "sine");
    
    // Determine target coordinates in 10x10 grid safely
    const targetGridX = tgt.gridX === -99 ? Math.floor(Math.random() * 10) : Math.max(0, Math.min(9, tgt.gridX));
    const targetGridY = tgt.gridY === -99 ? Math.floor(Math.random() * 10) : Math.max(0, Math.min(9, tgt.gridY));

    // Procedurally update the galaxy array to add a discovered cell
    setGalaxy(prev => {
      const updated = [...prev];
      if (!updated[targetGridX]) return prev;
  
      // Procedural contents based on type
      let planetData = null;
      let stationData = null;
      let anomalyData = null;
  
      if (tgt.type === "planet") {
        planetData = {
          name: tgt.name,
          type: "Exotic Garden Planet",
          color: "text-emerald-400 font-bold animate-pulse",
          interactionType: "high_tech_world",
          requiresMiner: false,
          resourceNode: {
            type: "orichalcum",
            amount: 15,
            exhausted: false
          }
        };
      } else if (tgt.type === "asteroid") {
        planetData = {
          name: tgt.name,
          type: "Heavy Mineral Belt",
          color: "text-yellow-500 animate-pulse font-mono",
          interactionType: "heavy_belt",
          requiresMiner: true,
          resourceNode: {
            type: "ore_ignis",
            amount: 25,
            exhausted: false
          }
        };
      } else if (tgt.type === "derelict") {
        anomalyData = {
          name: tgt.name,
          discovered: true,
          payload: Math.random() < 0.5 ? "weapon_frame" : "xenomorph_relic",
          exhausted: false
        };
      } else if (tgt.type === "comet") {
        planetData = {
          name: tgt.name,
          type: "Gaseous Frozen Comet",
          color: "text-cyan-400 font-bold animate-pulse",
          interactionType: "gas_harvest",
          requiresMiner: false,
          resourceNode: {
            type: "plasma_gas",
            amount: 12,
            exhausted: false
          }
        };
      }
  
      updated[targetGridX][targetGridY] = {
        explored: true, // Auto-revealed upon discovery!
        faction: "neutral",
        planet: planetData,
        station: stationData,
        anomaly: anomalyData,
        caravan: null,
        jumpGate: null,
        hostileChance: 0.15,
        blackMarketRevealed: false
      };
  
      return updated;
    });

    // Expand mapBounds dynamically to include this discovered sector!
    setMapBounds(prev => ({
      minX: Math.min(prev.minX, targetGridX),
      maxX: Math.max(prev.maxX, targetGridX),
      minY: Math.min(prev.minY, targetGridY),
      maxY: Math.max(prev.maxY, targetGridY)
    }));

    // Update target status
    setScanTargets(prev => prev.map(t => t.id === tgt.id ? { ...t, resolved: true, analyzed: 100 } : t));

    addTerminalLog(`[LONG-RANGE DISCOVERY]: Successfully resolved deep spectral anomaly! Found "${tgt.name}" (Sector [X: ${targetGridX - 4}, Y: ${targetGridY - 4}]). Telemetry logged. Nav chart expanded.`, "success");
    setIsFrozen(false);

    setSuccessModal({
      active: true,
      isGhost: false,
      name: tgt.name,
      type: tgt.type,
      x: targetGridX,
      y: targetGridY,
      targetId: tgt.id
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-2 sm:p-4 flex justify-center items-start sm:items-center">
      <div className={`w-full max-w-4xl border-2 ${themeBorder} rounded bg-neutral-950 flex flex-col shadow-2xl my-4 sm:my-0`}>
        {/* Header */}
        <header className="flex justify-between items-center p-3 border-b border-white/10 bg-neutral-900/50">
          <div className="flex items-center gap-2">
            <Radio className={`animate-pulse ${themeText}`} size={20} />
            <div>
              <h2 className="text-sm font-bold text-white tracking-widest uppercase font-mono">
                📟 SCANNING CONTROL PLATFORM — {scannerSuite.name}
              </h2>
              <div className="text-[10px] text-neutral-400 flex items-center gap-2">
                <span>ACTIVE NOISE FILTERING: <strong>{(totalNoiseReduction * 100).toFixed(0)}%</strong></span>
                {scanTech && (
                  <span className="text-yellow-400 font-bold flex items-center gap-1">
                    <Sparkles size={10} /> TECHNICIAN: {scanTech.name} (+25% Stability)
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-neutral-400 hover:text-white border border-neutral-800 p-1.5 rounded bg-black/40 hover:bg-neutral-900 transition"
          >
            <X size={15} />
          </button>
        </header>

        {/* Content splits */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
          {/* LEFT: Radar sweep */}
          <section className="md:col-span-6 border border-white/10 rounded p-4 bg-black/40 flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Compass size={14} className="text-indigo-400" /> Ping Radar Grid
              </h3>
              <p className="text-[10px] text-neutral-400">
                Sweeps detect localized stellar entities. Red fuzzy blips indicate anomalous coordinates.
              </p>
              <div className="flex justify-between items-center bg-black/40 p-2 rounded border border-neutral-800/60 my-1">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wide">Radar Filtration:</span>
                <button
                  onClick={() => {
                    setFilterKnown(prev => !prev);
                    AudioEngine.playBeep(450, 0.05, "sine");
                  }}
                  className={`px-3 py-1 border text-[10px] font-bold rounded transition cursor-pointer ${
                    filterKnown 
                      ? "bg-yellow-500/15 text-yellow-400 border-yellow-500" 
                      : "bg-black text-neutral-500 border-neutral-800 hover:text-neutral-300"
                  }`}
                >
                  {filterKnown ? "★ FILTER KNOWN ACTIVE" : "FILTER KNOWN OFF"}
                </button>
              </div>
            </div>

            {/* Simulated Radar Circular Canvas/SVG */}
            <div className="my-4 flex justify-center">
              <div className="relative w-60 h-60 border border-indigo-500/20 rounded-full bg-indigo-950/5 flex items-center justify-center overflow-hidden">
                {/* Concentric circles */}
                <div className="absolute w-44 h-44 border border-dashed border-indigo-500/10 rounded-full" />
                <div className="absolute w-28 h-28 border border-indigo-500/15 rounded-full" />
                <div className="absolute w-12 h-12 border border-dashed border-indigo-500/10 rounded-full" />
                
                {/* Horizontal & vertical axes */}
                <div className="absolute inset-0 flex items-center"><div className="w-full h-[1px] bg-indigo-500/10" /></div>
                <div className="absolute inset-0 flex justify-center"><div className="w-[1px] h-full bg-indigo-500/10" /></div>

                {/* Radar sweep lines */}
                <div 
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-indigo-500/20 origin-center"
                  style={{ transform: `rotate(${sweepAngle}deg)` }}
                />

                {/* Player at center */}
                <div className="absolute w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15] z-10" />

                {/* Display Targets on Radar */}
                {filteredScanTargets.map(tgt => {
                  const rad = (tgt.angle * Math.PI) / 180;
                  const x = 120 + Math.sin(rad) * tgt.distance;
                  const y = 120 - Math.cos(rad) * tgt.distance;

                  // Show as blurry red blip if unresolved, green resolved dot
                  return (
                    <button
                      key={tgt.id}
                      onClick={() => {
                        setAntennaAngle(tgt.angle);
                        setSelectedTargetId(tgt.id);
                        AudioEngine.playBeep(600, 0.08, "triangle");
                      }}
                      style={{ left: `${x}px`, top: `${y}px` }}
                      className={`absolute w-3.5 h-3.5 -ml-1.5 -mt-1.5 rounded-full flex items-center justify-center transition cursor-pointer group ${
                        tgt.resolved
                          ? "bg-emerald-500/80 shadow-[0_0_8px_#10b981]"
                          : "bg-red-500/40 animate-pulse shadow-[0_0_12px_#ef4444]"
                      }`}
                    >
                      <span className="text-[6px] text-white font-bold opacity-0 group-hover:opacity-100 bg-black/80 px-1 py-0.5 rounded absolute -bottom-5 whitespace-nowrap z-20">
                        {tgt.resolved ? tgt.name : "ANOMALY SENSOR BLIP"}
                      </span>
                    </button>
                  );
                })}

                {/* Antenna alignment bar */}
                <div 
                  className="absolute inset-0 border-r border-yellow-400/40 pointer-events-none origin-center"
                  style={{ transform: `rotate(${antennaAngle - 90}deg)` }}
                />
              </div>
            </div>

            {/* Antenna Control */}
            <div className="space-y-1 bg-neutral-950 p-2.5 border border-white/5 rounded">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-neutral-400 uppercase">Antenna Angle Matrix:</span>
                <strong className="text-yellow-400 font-bold">{antennaAngle}° AZIMUTH</strong>
              </div>
              <input 
                type="range"
                min="0"
                max="359"
                value={antennaAngle}
                onChange={(e) => {
                  setAntennaAngle(parseInt(e.target.value));
                  if (!isFrozen) {
                    // Quick feedback tick
                    if (Math.random() < 0.15) AudioEngine.playBeep(200 + parseInt(e.target.value) * 1.5, 0.02, "sine");
                  }
                }}
                className="w-full accent-yellow-400"
              />

              <div className="flex justify-between items-center gap-1.5 mt-1.5 text-[9px]">
                <span className="text-neutral-500 font-mono">NUDGE AZIMUTH:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setAntennaAngle(prev => (prev - 10 + 360) % 360);
                      AudioEngine.playBeep(400, 0.05, "sine");
                    }}
                    className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded text-neutral-300 font-bold transition cursor-pointer"
                  >
                    -10°
                  </button>
                  <button
                    onClick={() => {
                      setAntennaAngle(prev => (prev - 1 + 360) % 360);
                      AudioEngine.playBeep(400, 0.05, "sine");
                    }}
                    className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded text-neutral-300 font-bold transition cursor-pointer"
                  >
                    -1°
                  </button>
                  <button
                    onClick={() => {
                      setAntennaAngle(prev => (prev + 1) % 360);
                      AudioEngine.playBeep(400, 0.05, "sine");
                    }}
                    className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded text-neutral-300 font-bold transition cursor-pointer"
                  >
                    +1°
                  </button>
                  <button
                    onClick={() => {
                      setAntennaAngle(prev => (prev + 10) % 360);
                      AudioEngine.playBeep(400, 0.05, "sine");
                    }}
                    className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded text-neutral-300 font-bold transition cursor-pointer"
                  >
                    +10°
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: Spectral emission and filter graph */}
          <section className="md:col-span-6 border border-white/10 rounded p-4 bg-black/40 flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={14} className={themeText} /> Spectral Waveform Analyzer
              </h3>
              <p className="text-[10px] text-neutral-400">
                Filter electromagnetic noise bands. Point antennas directly at anomalies to amplify element emission lines.
              </p>
            </div>

            {/* Waveform Canvas */}
            <div className="border border-white/10 rounded overflow-hidden bg-black/95 relative p-1">
              <canvas 
                ref={spectralCanvasRef} 
                width="440" 
                height="150" 
                className="w-full h-36 bg-black block"
              />
              {isFrozen && (
                <span className="absolute top-2 right-2 text-[8px] bg-red-950/80 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded animate-pulse font-bold tracking-widest font-mono">
                  CHART FROZEN
                </span>
              )}
            </div>

            {/* Filters grid */}
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-1">
                {(["visible", "ir", "xray", "gamma"] as const).map(flt => {
                  const isActive = selectedFilter === flt;
                  return (
                    <button
                      key={flt}
                      onClick={() => {
                        setSelectedFilter(flt);
                        AudioEngine.playBeep(500, 0.05, "triangle");
                      }}
                      className={`py-1 rounded text-[9px] font-bold uppercase transition border ${
                        isActive
                          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500"
                          : "bg-black/30 text-neutral-500 border-neutral-800 hover:text-neutral-300"
                      }`}
                    >
                      {flt} BAND
                    </button>
                  );
                })}
              </div>

              {/* Dials for Gain and Compression */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 bg-neutral-950 border border-white/5 rounded p-2 text-[9px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-400 uppercase">RECEIVER GAIN:</span>
                    <strong className="text-indigo-400 font-mono font-bold">{gain}dB</strong>
                  </div>
                  <input 
                    type="range"
                    min="10"
                    max="100"
                    value={gain}
                    onChange={(e) => setGain(parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div className="space-y-1 bg-neutral-950 border border-white/5 rounded p-2 text-[9px] flex flex-col justify-center">
                  <span className="text-neutral-400 uppercase">ACTIVE COMPRESSION:</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-bold text-white text-[10px]">
                      {scannerSuite.name}
                    </span>
                    <span className="text-emerald-400 font-bold">
                      -{(totalNoiseReduction * 100).toFixed(0)}% Noise
                    </span>
                  </div>
                </div>
              </div>

              {/* Fine-Tuning Emission Wavelength */}
              <div className="space-y-1 bg-neutral-950 border border-white/5 rounded p-2.5 text-[9px]">
                <div className="flex justify-between">
                  <span className="text-neutral-400 uppercase flex items-center gap-1 font-mono">
                    <Sliders size={12} className="text-yellow-400" /> Fine Emission Wavelength:
                  </span>
                  <strong className="text-yellow-400 font-mono font-bold text-[10px]">{tunedWavelength} nm</strong>
                </div>
                <input 
                  type="range"
                  min="100"
                  max="400"
                  value={tunedWavelength}
                  onChange={(e) => {
                    setTunedWavelength(parseInt(e.target.value));
                    if (Math.random() < 0.2) AudioEngine.playBeep(300 + parseInt(e.target.value) * 0.5, 0.01, "sine");
                  }}
                  className="w-full accent-yellow-400 cursor-pointer"
                />

                <div className="flex justify-between items-center gap-1.5 mt-1.5 text-[9px]">
                  <span className="text-neutral-500 font-mono">NUDGE WAVELENGTH:</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setTunedWavelength(prev => Math.max(100, prev - 25));
                        AudioEngine.playBeep(400, 0.05, "sine");
                      }}
                      className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded text-neutral-300 font-bold transition cursor-pointer"
                    >
                      -25nm
                    </button>
                    <button
                      onClick={() => {
                        setTunedWavelength(prev => Math.max(100, prev - 5));
                        AudioEngine.playBeep(400, 0.05, "sine");
                      }}
                      className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded text-neutral-300 font-bold transition cursor-pointer"
                    >
                      -5nm
                    </button>
                    <button
                      onClick={() => {
                        setTunedWavelength(prev => Math.min(400, prev + 5));
                        AudioEngine.playBeep(400, 0.05, "sine");
                      }}
                      className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded text-neutral-300 font-bold transition cursor-pointer"
                    >
                      +5nm
                    </button>
                    <button
                      onClick={() => {
                        setTunedWavelength(prev => Math.min(400, prev + 25));
                        AudioEngine.playBeep(400, 0.05, "sine");
                      }}
                      className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded text-neutral-300 font-bold transition cursor-pointer"
                    >
                      +25nm
                    </button>
                  </div>
                </div>

                {angleAlignedTarget && (
                  <div className="flex justify-between items-center text-[8px] text-neutral-400 mt-1 bg-black/40 p-1 rounded font-mono">
                    <span>DETECTION COHERENCE BAND:</span>
                    {alignedTarget ? (
                      <span className="text-emerald-400 font-bold">LOCKED ({getTargetWavelength(angleAlignedTarget.type)} nm)</span>
                    ) : (
                      <span className="text-red-400 font-bold animate-pulse">MISMATCH (Target peak: {getTargetWavelength(angleAlignedTarget.type)} nm)</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Analysis Action */}
            <div className="border-t border-white/5 pt-3 flex flex-col gap-2.5">
              {/* Elemental Harmonic Analysis Coherence Display */}
              {alignedTarget && (
                <div className="animate-fade-in">
                  {alignedTarget.isGhost || (alignedTarget.isFalseGhost && !alignedTarget.resolved) ? (
                    <div className="bg-red-950/25 border border-red-500/25 rounded p-2 text-[9px] flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-red-400 font-bold uppercase animate-pulse flex items-center gap-1">
                          <AlertTriangle size={11} className="text-red-500 animate-pulse" /> ⚠️ {alignedTarget.isFalseGhost ? "UNSTABLE FLUCTUATION SIGNAL" : "COHERENCE DRIFT DETECTED"}
                        </span>
                        <span className="text-red-300 font-mono font-bold bg-red-950/40 px-1 py-0.5 rounded">STABILITY: {alignedTarget.stability || 12}%</span>
                      </div>
                      <p className="text-[9px] text-red-300/80 leading-relaxed font-mono">
                        <strong>EMISSIVE ANOMALY CAUTION:</strong> {alignedTarget.isFalseGhost 
                          ? "Signal fluctuates heavily like a decoy reflection, but precise frequency alignment may lock onto a hidden source." 
                          : "High-frequency multipath drift. Element emission lines show inconsistent carbon-isotope decay rates. Highly probable phantom echo."}
                      </p>
                    </div>
                  ) : (alignedTarget.resolved || alignedTarget.analyzed === 100) ? (
                    <div className="bg-emerald-950/25 border border-emerald-500/25 rounded p-2 text-[9px] flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400 font-bold uppercase flex items-center gap-1">
                          <Check size={11} className="text-emerald-400" /> ✅ SECURED NAV DATA LOCK
                        </span>
                        <span className="text-emerald-300 font-mono font-bold bg-emerald-950/40 px-1 py-0.5 rounded">STABILITY: 100%</span>
                      </div>
                      <p className="text-[9px] text-emerald-300/80 leading-relaxed font-mono">
                        <strong>ACTIVE TELEMETRY:</strong> Aligned with known coordinates of <strong>{alignedTarget.name}</strong>. Sector coordinates logged at: <code>[X: {alignedTarget.gridX - 4}, Y: {alignedTarget.gridY - 4}]</code>.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-yellow-950/25 border border-yellow-500/25 rounded p-2 text-[9px] flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-yellow-400 font-bold uppercase animate-pulse flex items-center gap-1">
                          <Radio size={11} className="text-yellow-400 animate-pulse" /> 📡 COHERENT PHYSICAL RESONANCE LOCKED
                        </span>
                        <span className="text-yellow-300 font-mono font-bold bg-yellow-950/40 px-1 py-0.5 rounded">STABILITY: {alignedTarget.stability || 98}%</span>
                      </div>
                      <p className="text-[9px] text-yellow-300/80 leading-relaxed font-mono">
                        <strong>MASS DETECTED:</strong> Element emission peaks aligned perfectly on physical atomic masses. Deep scanner telemetry scan strongly recommended.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center text-[10px]">
                <div className="flex items-center gap-1">
                  <Sliders size={12} className="text-yellow-400" />
                  <span className="text-neutral-400">ALIGNMENT FEEDBACK:</span>
                </div>
                <div>
                  {alignedTarget ? (
                    <span className="text-emerald-400 font-bold animate-pulse flex items-center gap-1">
                      <Check size={12} /> ANOMALY DETECTED IN CHOSEN BAND!
                    </span>
                  ) : activeTarget ? (
                    <span className="text-yellow-400 flex items-center gap-1">
                      <AlertTriangle size={12} /> PROXIMITY WARPING! ADJUST FREQUENCY BAND
                    </span>
                  ) : (
                    <span className="text-neutral-500 italic">Antenna aligned to deep space vacuum.</span>
                  )}
                </div>
              </div>

              {isAnalyzing ? (
                <div className="space-y-1 bg-black/60 p-2.5 rounded border border-yellow-500/20">
                  <div className="flex justify-between text-[10px] text-yellow-400 font-bold">
                    <span>SYNCHRONIZING ORBITAL WAVEFORMS...</span>
                    <span>{analysisProgress}% COMPLETE</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-2 rounded overflow-hidden">
                    <div 
                      className="bg-yellow-500 h-full transition-all duration-300"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsFrozen(!isFrozen);
                      AudioEngine.playBeep(400, 0.05, "sine");
                    }}
                    className="px-3 py-2 border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 hover:text-white rounded text-[10px] text-neutral-400 font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {isFrozen ? "RESUME MONITOR" : "FREEZE DATA"}
                  </button>

                  <button
                    onClick={startAnalysis}
                    disabled={!alignedTarget}
                    className={`flex-grow py-2 border font-bold text-xs rounded transition flex items-center justify-center gap-2 ${
                      alignedTarget
                        ? "border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black cursor-pointer shadow-[0_0_15px_rgba(234,179,8,0.2)] animate-pulse"
                        : "border-neutral-800 text-neutral-600 bg-neutral-950 cursor-not-allowed"
                    }`}
                  >
                    <Zap size={14} /> RUN SPECTRAL MATRIX ANALYSIS
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="p-3 border-t border-white/10 bg-black/60 flex flex-col sm:flex-row justify-between items-center text-[9px] text-neutral-500 gap-2">
          <span>COSMOS NAVIGATIONAL DISCOVERY GRID MATRIX v4.95</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> ANOMALY</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> RESOLVED</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" /> TARGET ALIGNED</span>
          </div>
        </footer>

        {/* SUCCESS / GHOST PURGE REPORT MODAL OVERLAY */}
        {successModal && successModal.active && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-md p-2 sm:p-4 flex justify-center items-start sm:items-center animate-fade-in">
            <div className={`w-full max-w-md border-2 ${successModal.isGhost ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)]" : "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)]"} rounded bg-neutral-950 p-6 flex flex-col gap-4 text-center shadow-2xl relative my-4 sm:my-0`}>
              {successModal.isGhost ? (
                <>
                  <div className="mx-auto w-12 h-12 rounded-full bg-red-950/60 flex items-center justify-center border border-red-500/50 animate-pulse">
                    <AlertTriangle className="text-red-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-md font-bold text-red-500 tracking-wider uppercase font-mono">GHOST ECHO DISCARDED</h2>
                    <p className="text-[10px] text-neutral-400 mt-1 uppercase font-mono">Purging Spurious Waveform Data</p>
                  </div>
                  <div className="text-left bg-black/50 p-3.5 rounded border border-white/5 font-mono text-[10px] space-y-1.5 text-neutral-300">
                    <div><span className="text-neutral-500">RESISTIVE INDEX:</span> <span className="text-red-400">FLUID / ZERO</span></div>
                    <div><span className="text-neutral-500">TELEMETRY LOCK:</span> <span className="text-red-400">LOST</span></div>
                    <div className="pt-2 text-neutral-400 text-[9px] leading-relaxed border-t border-white/5">
                      The scanned sub-space resonance was identified as a multi-path gravitational lens echo or void dust reflection. No physical celestial mass present. Nav computer has discarded the decoy coordinate.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Remove this target from state so it disappears from radar!
                      setScanTargets(prev => prev.filter(t => t.id !== successModal.targetId));
                      setSelectedTargetId(null);
                      setSuccessModal(null);
                      addTerminalLog(`[SPECTRAL EXCLUSION]: Decoy echo "${successModal.name}" purged. Nav coordinates corrected.`, "danger");
                      AudioEngine.playBeep(250, 0.3, "sawtooth");
                    }}
                    className="w-full py-2.5 bg-red-950/80 hover:bg-red-900 text-red-400 border border-red-500/30 hover:border-red-500 rounded font-bold text-xs uppercase tracking-widest transition cursor-pointer"
                  >
                    PURGE DECOY DATA & RESUME
                  </button>
                </>
              ) : (
                <>
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-950/60 flex items-center justify-center border border-emerald-500/50 animate-bounce">
                    <Sparkles className="text-emerald-400 animate-pulse" size={24} />
                  </div>
                  <div>
                    <h2 className="text-md font-bold text-emerald-400 tracking-widest uppercase font-mono">SUCCESS</h2>
                    <p className="text-[10px] text-neutral-400 mt-1 uppercase font-mono">Celestial Body Verified & Logged</p>
                  </div>
                  <div className="text-left bg-black/50 p-3.5 rounded border border-white/5 font-mono text-[10px] space-y-1.5 text-neutral-300">
                    <div><span className="text-neutral-500">IDENTIFIED:</span> <span className="text-emerald-400 font-bold">{successModal.name}</span></div>
                    <div><span className="text-neutral-500">CLASSIFICATION:</span> <span className="text-white uppercase">{successModal.type}</span></div>
                    <div><span className="text-neutral-500">COORDINATES:</span> <span className="text-yellow-400">Sector [X: {successModal.x - 4}, Y: {successModal.y - 4}]</span></div>
                    <div className="pt-2 text-neutral-400 text-[9px] leading-relaxed border-t border-white/5">
                      Physical celestial mass confirmed. Orbital waveforms aligned. Deep space navigations computer updated. Telemetry is fully synchronized with active star charts.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSuccessModal(null);
                      addTerminalLog(`[TELEMETRY LOGGED]: Sector [X: ${successModal.x - 4}, Y: ${successModal.y - 4}] cataloged under "${successModal.name}". Nav chart refreshed.`, "success");
                      AudioEngine.playBeep(880, 0.25, "sine");
                    }}
                    className="w-full py-2.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500 rounded font-bold text-xs uppercase tracking-widest transition cursor-pointer animate-pulse"
                  >
                    SYNC STAR CHART & CLOSE
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
