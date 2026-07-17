/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, Wrench, Cpu, Coins, MessageSquare, Flame, User, UserCheck, Users, 
  X, Activity, ArrowRight, Sparkles, Navigation, Zap, AlertTriangle, Play, HelpCircle
} from "lucide-react";
import { CrewMember, CargoSlot, VoidWaypoint } from "../types";
import { AudioEngine } from "../audio";

// Define our spaceship rooms
export interface ShipRoom {
  id: string;
  name: string;
  systemName: string;
  role: string;
  xPercent: number; // grid position for layout rendering
  yPercent: number;
  width: string;
  accentColor: string;
  description: string;
  consoleActionName: string;
}

const SHIP_ROOMS: ShipRoom[] = [
  {
    id: "engineering",
    name: "ENGINE ROOM",
    systemName: "Hyperdrive Propulsion Core",
    role: "Provides speed, FTL warp capability, and power distribution.",
    xPercent: 10,
    yPercent: 40,
    width: "w-1/5",
    accentColor: "border-red-500/80 text-red-400 bg-red-950/10",
    description: "Contains the hypermatter fusion reactor and primary FTL drives. Requires expert tuning to minimize fuel bleed during lightyears hops.",
    consoleActionName: "Overclock Hyperdrive Core"
  },
  {
    id: "cargo",
    name: "CARGO & MEDICAL BAY",
    systemName: "Bio-Med & Storage Locks",
    role: "Houses cargo containers, recycling bays, and automated med-nanites.",
    xPercent: 30,
    yPercent: 65,
    width: "w-1/5",
    accentColor: "border-emerald-500/80 text-emerald-400 bg-emerald-950/10",
    description: "Equipped with automated medical bays and sub-atomic scanning locks. Walking your avatar here activates nanite hull patching.",
    consoleActionName: "Dispense Med-Nanites"
  },
  {
    id: "shield",
    name: "SHIELD CORE",
    systemName: "Kinetic Emitter Matrix",
    role: "Regenerates and shapes the ship's defensive deflectors.",
    xPercent: 50,
    yPercent: 40,
    width: "w-1/5",
    accentColor: "border-cyan-500/80 text-cyan-400 bg-cyan-950/10",
    description: "Channels power from the hyperdrive to the external deflector dishes. Overcharging the matrices restores immediate shields.",
    consoleActionName: "Modulate Deflector Shields"
  },
  {
    id: "weapons",
    name: "WEAPONS DECK",
    systemName: "Tactical Targeting & Battery",
    role: "Controls offensive lasers, kinetics, and torpedo tubes.",
    xPercent: 70,
    yPercent: 15,
    width: "w-1/5",
    accentColor: "border-amber-500/80 text-amber-500 bg-amber-950/10",
    description: "Integrates targeting computers with weapon capacitor relays. Calibrating arrays here grants critical hit chance boosts in deep combat.",
    consoleActionName: "Calibrate Weapon Emitters"
  },
  {
    id: "bridge",
    name: "BRIDGE / COCKPIT",
    systemName: "Command Navigation Hub",
    role: "Handles flight vectors, long-range scans, and active piloting.",
    xPercent: 90,
    yPercent: 40,
    width: "w-1/5",
    accentColor: "border-indigo-500/80 text-indigo-400 bg-indigo-950/10",
    description: "The neural command bridge of the starship. Assigning an elite Pilot here boosts overall ship reaction-time and evasion thresholds.",
    consoleActionName: "Execute Sensor Scan"
  }
];

interface ShipDeckViewProps {
  crew: CrewMember[];
  setCrew: React.Dispatch<React.SetStateAction<CrewMember[]>>;
  hull: number;
  setHull: React.Dispatch<React.SetStateAction<number>>;
  shields: number;
  setShields: React.Dispatch<React.SetStateAction<number>>;
  credits: number;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
  cargo: CargoSlot[];
  setCargo: React.Dispatch<React.SetStateAction<CargoSlot[]>>;
  fuel: number;
  setFuel: React.Dispatch<React.SetStateAction<number>>;
  addTerminalLog: (text: string, category: "normal" | "danger" | "success" | "info" | "loot") => void;
  themeColor: "green" | "amber" | "cyan";
  activeShip: string;
  hyperdriveOverclocked?: boolean;
  setHyperdriveOverclocked?: React.Dispatch<React.SetStateAction<boolean>>;
  weaponsCalibrated?: boolean;
  setWeaponsCalibrated?: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenScanner?: () => void;
  voidWaypoints?: VoidWaypoint[];
  setVoidWaypoints?: React.Dispatch<React.SetStateAction<VoidWaypoint[]>>;
  onTriggerWarpJumpToWaypoint?: (waypoint: VoidWaypoint) => void;
  currentSystemIndex?: number;
  isInDeepSpace?: boolean;
  backupFuel?: number;
  setBackupFuel?: React.Dispatch<React.SetStateAction<number>>;
  activeSector?: any;
  onDeployStationCore?: () => void;
}

export const ShipDeckView: React.FC<ShipDeckViewProps> = ({
  crew,
  setCrew,
  hull,
  setHull,
  shields,
  setShields,
  credits,
  setCredits,
  cargo,
  setCargo,
  fuel,
  setFuel,
  addTerminalLog,
  themeColor,
  activeShip,
  hyperdriveOverclocked,
  setHyperdriveOverclocked,
  weaponsCalibrated,
  setWeaponsCalibrated,
  onOpenScanner,
  voidWaypoints = [],
  setVoidWaypoints,
  onTriggerWarpJumpToWaypoint,
  currentSystemIndex = 0,
  isInDeepSpace = false,
  backupFuel = 100,
  setBackupFuel,
  activeSector,
  onDeployStationCore
}) => {
  // System State Management
  const [avatarRoom, setAvatarRoom] = useState<string>("bridge");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("bridge");

  // Deep Space Scanning state
  const [isDeepScanning, setIsDeepScanning] = useState<boolean>(false);
  const [deepScanProgress, setDeepScanProgress] = useState<number>(0);
  const [detectedAnomaly, setDetectedAnomaly] = useState<VoidWaypoint | null>(null);
  
  // Room health / integrity (FTL style!)
  const [roomIntegrity, setRoomIntegrity] = useState<Record<string, number>>({
    bridge: 100,
    weapons: 100,
    shield: 100,
    engineering: 100,
    cargo: 100
  });

  // Room status: nominal, damaged, fire, breach
  const [roomStatus, setRoomStatus] = useState<Record<string, "nominal" | "leaking" | "fire" | "offline">>({
    bridge: "nominal",
    weapons: "nominal",
    shield: "nominal",
    engineering: "nominal",
    cargo: "nominal"
  });

  // Crew assignments to specific rooms (roomId or null)
  const [crewAssignments, setCrewAssignments] = useState<Record<string, string>>(() => {
    // Distribute default crew
    const initial: Record<string, string> = {};
    crew.forEach((member, idx) => {
      if (member.role === "Pilot") initial[member.id] = "bridge";
      else if (member.role === "Weapons Specialist") initial[member.id] = "weapons";
      else if (member.role === "Science Director") initial[member.id] = "shield";
      else if (idx === 0) initial[member.id] = "bridge";
      else if (idx === 1) initial[member.id] = "engineering";
      else if (idx === 2) initial[member.id] = "cargo";
      else initial[member.id] = "shield";
    });
    return initial;
  });

  // Repair progress state
  const [repairingRoomId, setRepairingRoomId] = useState<string | null>(null);
  const [repairProgress, setRepairProgress] = useState<number>(0);

  // Crew dialogue link state
  const [selectedCrewMember, setSelectedCrewMember] = useState<CrewMember | null>(null);
  const [dialogueText, setDialogueText] = useState<string>("");

  // Shield Modulation Oscilloscope Mini-game State
  const [isShieldGameOpen, setIsShieldGameOpen] = useState<boolean>(false);
  const [targetFreq, setTargetFreq] = useState<number>(5.0);
  const [currentFreq, setCurrentFreq] = useState<number>(2.0);
  const [shieldGameFeedback, setShieldGameFeedback] = useState<{ text: string; type: "success" | "fail" | "neutral" }>({
    text: "PRESS SPACEBAR TO LOCK FREQUENCIES",
    type: "neutral"
  });
  const [successCount, setSuccessCount] = useState<number>(0);
  const [phase, setPhase] = useState<number>(0);

  // Smooth oscilloscope sweeping animation
  useEffect(() => {
    if (!isShieldGameOpen) return;

    let animId: number;
    let lastTime = performance.now();
    let freq = currentFreq;
    let dir = 1;
    let localPhase = 0;

    const tick = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // sweep frequency between 1.5 and 8.5 GHz
      freq += dir * 2.2 * delta;
      if (freq >= 8.5) {
        freq = 8.5;
        dir = -1;
      } else if (freq <= 1.5) {
        freq = 1.5;
        dir = 1;
      }

      // animate wave flowing phase
      localPhase += 8.0 * delta;

      setCurrentFreq(Number(freq.toFixed(2)));
      setPhase(localPhase);

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isShieldGameOpen]);

  // Spacebar modulation execution trigger
  const triggerSpacebarModulate = () => {
    const diff = Math.abs(currentFreq - targetFreq);
    if (diff <= 0.45) {
      AudioEngine.playBeep(900, 0.1, "sine");
      setTimeout(() => AudioEngine.playBeep(1350, 0.15, "sine"), 60);

      const nextShieldValue = Math.min(100, shields + 15);
      setShields(nextShieldValue);
      setSuccessCount(prev => prev + 1);
      setShieldGameFeedback({
        text: `PERFECT SYNCHRONIZATION! (▲ Freq Delta: ${diff.toFixed(2)}) +15% Shields Charged!`,
        type: "success"
      });
      addTerminalLog(`[SHIELD OSCILLOSCOPE]: Successful frequency convergence at ${currentFreq} GHz! Deflector array aligned (+15% Shields).`, "success");

      // Generate a new target frequency after successful calibration
      setTimeout(() => {
        setTargetFreq(Number((2.0 + Math.random() * 6.0).toFixed(2)));
        setShieldGameFeedback({ text: "PRESS SPACEBAR TO LOCK FREQUENCIES", type: "neutral" });
      }, 1500);
    } else {
      AudioEngine.playBeep(220, 0.2, "sawtooth");
      setShieldGameFeedback({
        text: `HARMONIC DRIFT DETECTED (▲ Freq Delta: ${diff.toFixed(2)}). Recalibrating...`,
        type: "fail"
      });
      setTimeout(() => {
        setShieldGameFeedback(prev => prev.type === "fail" ? { text: "PRESS SPACEBAR TO LOCK FREQUENCIES", type: "neutral" } : prev);
      }, 1000);
    }
  };

  // Keyboard Spacebar event listener
  useEffect(() => {
    if (!isShieldGameOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        triggerSpacebarModulate();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isShieldGameOpen, currentFreq, targetFreq, shields]);

  // Sound play helper
  const triggerBeep = (freq: number, duration: number, type: OscillatorType = "sine") => {
    AudioEngine.playBeep(freq, duration, type);
  };

  // Keyboard controls for moving left/right
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't register keys if user is in an input field (not applicable here, but safe practice)
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      const roomOrder = ["engineering", "cargo", "shield", "weapons", "bridge"];
      const currentIndex = roomOrder.indexOf(avatarRoom);

      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        if (currentIndex > 0) {
          const nextRoom = roomOrder[currentIndex - 1];
          moveAvatarToRoom(nextRoom);
        }
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        if (currentIndex < roomOrder.length - 1) {
          const nextRoom = roomOrder[currentIndex + 1];
          moveAvatarToRoom(nextRoom);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [avatarRoom]);

  // Periodic slow passive healing and repairs from assigned crew
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. If avatar is in a damaged room, perform auto-repair ticking
      const currentRoomIntegrity = roomIntegrity[avatarRoom];
      if (currentRoomIntegrity < 100) {
        setRoomIntegrity(prev => {
          const updated = Math.min(100, prev[avatarRoom] + 10);
          if (updated === 100) {
            setRoomStatus(s => ({ ...s, [avatarRoom]: "nominal" }));
            addTerminalLog(`[DECK MAINTENANCE]: ${SHIP_ROOMS.find(r => r.id === avatarRoom)?.name} system fully repaired and back online.`, "success");
            triggerBeep(880, 0.25, "sine");
          }
          return { ...prev, [avatarRoom]: updated };
        });
      }

      // 2. Assigned crew also slowly repair rooms they are stationed in
      Object.keys(crewAssignments).forEach((crewId) => {
        const rId = crewAssignments[crewId];
        if (rId && roomIntegrity[rId] < 100) {
          // Skip if player is already repairing (handled above)
          if (rId === avatarRoom) return;

          setRoomIntegrity(prev => {
            const nextVal = Math.min(100, prev[rId] + 5);
            if (nextVal === 100) {
              setRoomStatus(s => {
                const updatedStatus = { ...s };
                updatedStatus[rId] = "nominal";
                return updatedStatus;
              });
              const crewName = crew.find(c => c.id === crewId)?.name || "Crew";
              addTerminalLog(`[CREW MAINTENANCE]: ${crewName} repaired the ${SHIP_ROOMS.find(r => r.id === rId)?.name} system.`, "info");
            }
            const updatedIntegrity = { ...prev };
            updatedIntegrity[rId] = nextVal;
            return updatedIntegrity;
          });
        }
      });

      // 3. Med-Bay passive hull repair if player stands in Cargo/Med Bay and has food/supplies
      if (avatarRoom === "cargo" && roomIntegrity.cargo === 100 && hull < 100) {
        setHull(prev => {
          const added = Math.min(100, prev + 1);
          return added;
        });
      }

      // 4. Shield Core passive manual regeneration if player stands in Shield Core room
      if (avatarRoom === "shield" && shields < 100) {
        setShields(prev => {
          const nextVal = Math.min(100, prev + 5);
          if (nextVal > prev) {
            if (Math.random() < 0.25) {
              addTerminalLog(`[SHIELD CORE]: Standing at console matrix. Manually aligning kinetic emitters. Shield charging +5% (Total: ${nextVal}%).`, "success");
              AudioEngine.playShieldRecharge();
            }
          }
          return nextVal;
        });
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [avatarRoom, roomIntegrity, crewAssignments, crew, hull, shields]);

  // Handle random crises (FTL hazard events!)
  const triggerRandomCrisis = () => {
    const roomKeys = ["bridge", "weapons", "shield", "engineering", "cargo"];
    const targetRoomKey = roomKeys[Math.floor(Math.random() * roomKeys.length)];
    const roomName = SHIP_ROOMS.find(r => r.id === targetRoomKey)?.name || "Reactor";

    const hazards: ("leaking" | "fire" | "offline")[] = ["leaking", "fire", "offline"];
    const selectedHazard = hazards[Math.floor(Math.random() * hazards.length)];
    const damage = Math.floor(Math.random() * 40) + 30; // 30-70 integrity loss

    setRoomIntegrity(prev => ({
      ...prev,
      [targetRoomKey]: Math.max(10, prev[targetRoomKey] - damage)
    }));

    setRoomStatus(prev => ({
      ...prev,
      [targetRoomKey]: selectedHazard
    }));

    triggerBeep(220, 0.8, "sawtooth");

    let hazardDesc = "";
    if (selectedHazard === "fire") {
      hazardDesc = `🔥 EMERGENCY SIREN: Thermal meltdown flare fires reported on the ${roomName}! Systems are melting.`;
    } else if (selectedHazard === "leaking") {
      hazardDesc = `☣️ CORROSIVE LEAK: Radioactive coolant line rupture on the ${roomName}! Integrity failing.`;
    } else {
      hazardDesc = `⚡ SYSTEM BLOWOUT: Heavy electrical surge blew primary grid modules in the ${roomName}!`;
    }

    addTerminalLog(hazardDesc, "danger");
  };

  // Move avatar to a specific room
  const moveAvatarToRoom = (roomId: string) => {
    if (avatarRoom === roomId) return;
    setAvatarRoom(roomId);
    setSelectedRoomId(roomId);
    triggerBeep(520, 0.08, "triangle");
    
    // Auto clear crew dialogue upon moving
    setSelectedCrewMember(null);
    setDialogueText("");
  };

  // Manual instant repair sequence
  const executeInstantRepair = (roomId: string) => {
    const cost = 50;
    if (credits < cost) {
      addTerminalLog("[DECK CONTROL]: Insufficient credits to synthesize emergency repair nanites. Cost: 50 Credits.", "danger");
      triggerBeep(180, 0.25, "sawtooth");
      return;
    }

    setCredits(prev => prev - cost);
    setRoomIntegrity(prev => ({ ...prev, [roomId]: 100 }));
    setRoomStatus(prev => ({ ...prev, [roomId]: "nominal" }));
    addTerminalLog(`[NANITE REPAIR]: Deployed emergency cellular nanites to ${SHIP_ROOMS.find(r => r.id === roomId)?.name}. System restored to 100%.`, "success");
    triggerBeep(920, 0.35, "sine");
  };

  const startDeepScan = () => {
    if (isInDeepSpace) {
      addTerminalLog("[DEEP SCAN ERROR]: Cannot resolve deep void anomalies while inside deep void space.", "danger");
      triggerBeep(180, 0.25, "sawtooth");
      return;
    }
    if (isDeepScanning) return;

    setIsDeepScanning(true);
    setDeepScanProgress(0);
    setDetectedAnomaly(null);
    addTerminalLog("[DEEP SCAN]: Commencing deep gravimetric scans of neighboring unmapped sector grids...", "info");
    triggerBeep(650, 0.1, "sine");

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setDeepScanProgress(progress);
      if (progress % 30 === 0) {
        triggerBeep(300 + progress * 2, 0.05, "sine");
      }

      if (progress >= 100) {
        clearInterval(interval);
        setIsDeepScanning(false);

        // Procedurally generate the contents of this void anomaly space
        const grid: any[][] = [];
        let totalValue = 150; // Baseline coordinates value

        const prefixes = ["Epitaph", "Vanguard", "Genesis", "Sentinel", "Hyperion", "Tartarus", "Acheron", "Onyx", "Helios", "Eclipse", "Void", "Spectral"];
        const nouns = ["Grip", "Chasm", "Ruin", "Fissure", "Wreck", "Spire", "Core", "Anvil", "Needle", "Tomb", "Whisper", "Spur"];
        const p = prefixes[Math.floor(Math.random() * prefixes.length)];
        const n = nouns[Math.floor(Math.random() * nouns.length)];
        const anomalyName = `${p} ${n} Anomaly [S-${Math.floor(Math.random() * 900 + 100)}]`;

        for (let x = 0; x < 3; x++) {
          grid[x] = [];
          for (let y = 0; y < 3; y++) {
            let explored = false;
            let faction = "neutral";
            let planet = null;
            let station = null;
            let anomaly = null;
            let caravan = null;
            let jumpGate = null;
            let hostileChance = 0.2 + Math.random() * 0.3;

            // Center is always Unstable Return Wormhole (free travel back!)
            if (x === 1 && y === 1) {
              explored = true;
              jumpGate = {
                targetSystemIndex: currentSystemIndex,
                name: "Unstable Return Wormhole"
              };
            } else {
              const roll = Math.random();
              if (roll < 0.25) {
                // Asteroid Belt: worth 150 credits
                const oreType = Math.random() < 0.5 ? "ore_astraea" : "ore_pyrite";
                const oreName = oreType === "ore_astraea" ? "Astraea Crystals" : "Pyrite Prisms";
                planet = {
                  name: `Void ${oreName} Pocket`,
                  type: "heavy_belt",
                  color: "text-amber-500 font-bold animate-pulse",
                  interactionType: "heavy_belt",
                  requiresMiner: true,
                  resourceNode: {
                    type: oreType,
                    amount: Math.floor(Math.random() * 6) + 6,
                    exhausted: false
                  }
                };
                totalValue += 150;
              } else if (roll < 0.5) {
                // Rogue Planet: worth 200 credits
                planet = {
                  name: `Rogue Planet ${p}-${Math.floor(Math.random() * 90 + 10)}`,
                  type: "Exotic Tomb World",
                  color: "text-purple-600 font-bold animate-pulse",
                  interactionType: "tomb_world",
                  requiresMiner: false,
                  resourceNode: {
                    type: "plasma_gas",
                    amount: Math.floor(Math.random() * 5) + 4,
                    exhausted: false
                  }
                };
                totalValue += 200;
              } else if (roll < 0.65) {
                // Abandoned Space Station: worth 300 credits
                station = {
                  name: `Scrapyard ${p} Station`,
                  techLevel: 2,
                  techTitle: "Abandoned Spire Station",
                  missionBoard: [],
                  hiringLounge: [],
                  cantinaVisitors: []
                };
                totalValue += 300;
              } else if (roll < 0.85) {
                // Space Wreckage anomaly: worth 100 credits
                anomaly = {
                  name: `Wreckage of ${p} transport`,
                  discovered: false,
                  payload: Math.random() < 0.5 ? "shieldcore" : "contraband",
                  exhausted: false
                };
                totalValue += 100;
              }
            }

            grid[x][y] = {
              explored,
              faction,
              planet,
              station,
              anomaly,
              caravan,
              jumpGate,
              hostileChance
            };
          }
        }

        const newAnomalyWaypoint: VoidWaypoint = {
          id: `void_wp_${Date.now()}`,
          name: anomalyName,
          value: totalValue,
          galaxy: grid,
          isSold: false,
          parentSystemIndex: currentSystemIndex
        };

        setDetectedAnomaly(newAnomalyWaypoint);
        addTerminalLog(`[DEEP SCAN SUCCESS]: Anomaly coordinates locked: ${anomalyName}! Value estimate: ${totalValue} Credits. Lock waypoints to fly hyper-jump pathfinders.`, "success");
        triggerBeep(1100, 0.45, "sine");
      }
    }, 200);
  };

  const handleLockWaypoint = () => {
    if (!detectedAnomaly) return;
    if (setVoidWaypoints) {
      setVoidWaypoints(prev => [...prev, detectedAnomaly]);
      addTerminalLog(`[WAYPOINT SYSTEM]: Saved and locked coordinate waypoint for "${detectedAnomaly.name}". It has been successfully synchronized to your Star System Map!`, "success");
      triggerBeep(950, 0.3, "sine");
      setDetectedAnomaly(null);
    }
  };

  // Room interaction console actions
  const executeConsoleAction = (roomId: string) => {
    const integrity = roomIntegrity[roomId];
    if (integrity < 40) {
      addTerminalLog(`[CONSOLE ERROR]: Critical hardware failure in ${SHIP_ROOMS.find(r => r.id === roomId)?.name}. Repair the room to restore console terminals.`, "danger");
      triggerBeep(150, 0.3, "sawtooth");
      return;
    }

    triggerBeep(740, 0.15, "sine");

    switch (roomId) {
      case "bridge":
        addTerminalLog("[BRIDGE SENSORS]: Sweep initialized. Accessing long-range electromagnetic scanning control platform...", "info");
        if (onOpenScanner) {
          onOpenScanner();
        } else {
          addTerminalLog("[BRIDGE SENSORS]: Long-range radar core offline.", "danger");
        }
        break;
      case "weapons":
        if (setWeaponsCalibrated) {
          setWeaponsCalibrated(true);
        }
        addTerminalLog("[WEAPONS ARSENAL]: Pre-charged backup capacitors and calibrated laser emitter lenses! Next combat weapon volley will deal +50% extra damage.", "success");
        break;
      case "shield":
        addTerminalLog("[SHIELD CORE]: Connecting terminal matrix to Kinetic Emitter Oscilloscope... Spacebar is now bound to wave phase synchronization.", "info");
        setIsShieldGameOpen(true);
        setTargetFreq(Number((2.5 + Math.random() * 5.0).toFixed(2)));
        setShieldGameFeedback({
          text: "PRESS SPACEBAR TO LOCK FREQUENCIES",
          type: "neutral"
        });
        break;
      case "engineering":
        if (fuel <= 0.5) {
          addTerminalLog("[ENGINES ALERT]: Subspace propellant reserves are too low to run core performance calibration.", "danger");
        } else {
          setFuel(prev => Math.max(0, prev - 0.5));
          if (setHyperdriveOverclocked) {
            setHyperdriveOverclocked(true);
          }
          addTerminalLog("[ENGINES OVERCLOCK]: Spent 0.5 fuel to purge carbon plasma conduits and overclock FTL injectors! Next warp jump fuel cost reduced by 45%.", "success");
        }
        break;
      case "cargo":
        const scrapCount = cargo.filter(item => item.type === "scrap").reduce((sum, s) => sum + s.qty, 0);
        if (scrapCount < 1) {
          addTerminalLog("[MED-BAY NANITES]: No raw Alloy Scrap available to synthesize hull patches. Bring scrap back to the Cargo Deck.", "danger");
        } else {
          // Consume 1 scrap
          setCargo(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(item => item.type === "scrap");
            if (idx !== -1) {
              if (updated[idx].qty > 1) {
                updated[idx].qty--;
              } else {
                updated.splice(idx, 1);
              }
            }
            return updated;
          });
          setHull(prev => Math.min(100, prev + 15));
          addTerminalLog("[NANO-SYNTHESIS]: Consumed 1x Alloy Scrap to patch deep micro-fractures in the hull. Restored +15 Hull Integrity.", "success");
        }
        break;
      default:
        break;
    }
  };

  // Reassign a crew member to a different room
  const reassignCrew = (crewId: string, roomId: string) => {
    setCrewAssignments(prev => ({
      ...prev,
      [crewId]: roomId
    }));
    triggerBeep(640, 0.15, "triangle");
    
    const crewName = crew.find(c => c.id === crewId)?.name || "Officer";
    const rName = SHIP_ROOMS.find(r => r.id === roomId)?.name || "New Post";
    addTerminalLog(`[DECK COMMAND]: Reassigned ${crewName} to ${rName}. Buff parameters applied.`, "info");

    // Update dialogue response to match reassignment
    if (selectedCrewMember && selectedCrewMember.id === crewId) {
      setDialogueText(`Copy that, Captain. Moving to the ${rName} immediately to supervise local console clusters!`);
    }
  };

  // Handle crew chat dialogue choices
  const talkToCrew = (member: CrewMember) => {
    setSelectedCrewMember(member);
    const assignedRoomId = crewAssignments[member.id] || "unassigned";
    const integrity = roomIntegrity[assignedRoomId];

    triggerBeep(480, 0.12, "sine");

    if (integrity < 50) {
      setDialogueText(`"Captain, the ${SHIP_ROOMS.find(r => r.id === assignedRoomId)?.name} is under heavy stress! Emitters are frying and smoke is building up. We need repair assistance over here immediately!"`);
      return;
    }

    // Role-based custom dialogues
    switch (member.role) {
      case "Pilot":
        setDialogueText(`"Greetings, Captain. Helm control is looking solid. Standard autopilot corridors are locked into the subspace grid. Just point us to a sector waypoint on the Star Map and I'll jump us safely."`);
        break;
      case "Weapons Specialist":
        setDialogueText(`"Ammunition tracks are aligned, sir. I'm keeping our tactical pulse lasers and kinetic guns fully calibrated. If those space pirates block our path again, they'll regret it."`);
        break;
      case "Science Director":
        setDialogueText(`"Deflector shielding parameters are stable, Captain. I've been monitoring local cosmos energy fields. If you overcharge the consoles here, I can raise immediate auxiliary shielding layers."`);
        break;
      case "Cargo Manager":
        setDialogueText(`"All cargo crates are securely pressurized and aligned inside the cargo bays. I've also calibrated the nanotech recyclers. If you bring me raw Alloy Scrap, we can synthesize fresh warheads."`);
        break;
      case "Miner":
        setDialogueText(`"Drill telemetry registers normal load limits. Ready to laser-excavate any asteroid fields or heavy planetary crusts we encounter. Just scan for resource signatures and I'll extract them!"`);
        break;
      case "Spy":
        setDialogueText(`"Subspace relays are fully tapped. Keeping ears on local military encrypted frequencies. Hegemony patrols and syndicate scouts will find it harder to surprise us."`);
        break;
      default:
        setDialogueText(`"Active duty reporting, Captain! Ready to supervise the console matrices and repair any damages that strike the decks."`);
        break;
    }
  };

  const activeRoom = SHIP_ROOMS.find(r => r.id === selectedRoomId) || SHIP_ROOMS[0];
  const avatarRoomDetails = SHIP_ROOMS.find(r => r.id === avatarRoom) || SHIP_ROOMS[0];

  // Render visual indicator colors for system health
  const getIntegrityColorClass = (val: number) => {
    if (val >= 80) return "text-emerald-400";
    if (val >= 40) return "text-yellow-500";
    return "text-red-500 animate-pulse font-bold";
  };

  const getIntegrityBarColorClass = (val: number) => {
    if (val >= 80) return "bg-emerald-500";
    if (val >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const activeThemeBorder =
    themeColor === "green" ? "border-green-500/30" : themeColor === "amber" ? "border-amber-500/30" : "border-cyan-500/30";
  const activeThemeText =
    themeColor === "green" ? "text-green-400" : themeColor === "amber" ? "text-amber-500" : "text-cyan-400";
  const activeThemeBg =
    themeColor === "green" ? "bg-green-950/10" : themeColor === "amber" ? "bg-amber-950/10" : "bg-cyan-950/10";

  return (
    <section id="ship-deck-module" className="font-mono text-xs text-neutral-300 space-y-4 fade-panel select-none">
      {/* Header Controller */}
      <header className="border border-current/30 p-3 bg-black/60 rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-md select-none">
        <div className="space-y-1">
          <h2 className={`text-base font-bold uppercase tracking-wider flex items-center gap-2 ${activeThemeText}`}>
            🛸 2D STARSHIP DECK & SECTOR CRISIS SIMULATOR
          </h2>
          <p className="text-[10px] text-neutral-400 max-w-2xl">
            Walk around your spaceship rooms to manually control primary consoles, repair damaged ship segments, and coordinate crew postings. <span className="text-yellow-500">Press Left/Right Arrow keys or A/D to walk.</span>
          </p>
        </div>
        
        {/* Actions bar for quick tests */}
        <div className="flex items-center gap-2 w-full md:w-auto md:shrink-0 justify-end">
          <button
            onClick={() => {
              triggerBeep(330, 0.1, "sine");
              triggerRandomCrisis();
            }}
            className="px-3 py-1.5 border border-red-500/50 bg-red-950/20 hover:bg-red-500 hover:text-black font-bold text-[10px] rounded transition flex items-center gap-1 cursor-pointer"
          >
            <AlertTriangle size={12} className="text-red-500 shrink-0" /> SIMULATE REACTOR BLAST / CRISIS
          </button>
        </div>
      </header>

      {/* Main ship visual section (FTL blueprints style) */}
      <div className="relative border border-current/20 bg-neutral-950 rounded p-6 shadow-2xl overflow-hidden min-h-[300px] flex flex-col justify-center">
        {/* Subtle grid mesh background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        {/* Outer Hull visual silhouette (drawn behind rooms as custom decorative lines) */}
        <div className="absolute left-[8%] right-[8%] top-[25%] bottom-[25%] border border-current/10 rounded-full scale-y-50 pointer-events-none filter blur-[1px]" />
        <div className="absolute left-[12%] right-[12%] top-[30%] bottom-[30%] border border-current/20 rounded-l-[120px] rounded-r-[60px] pointer-events-none" />

        {/* Horizontal corridor power line connecting all rooms */}
        <div className="absolute left-[15%] right-[15%] top-[50%] h-0.5 bg-neutral-800 pointer-events-none" />
        <div className="absolute left-[15%] right-[15%] top-[50%] h-0.5 bg-current/20 pointer-events-none animate-pulse" />

        {/* Rooms Blueprint grid layout */}
        <div className="relative flex flex-wrap sm:flex-nowrap justify-between gap-3 items-center z-10">
          {SHIP_ROOMS.map((room) => {
            const integrity = roomIntegrity[room.id];
            const status = roomStatus[room.id];
            const isAvatarHere = avatarRoom === room.id;
            const isSelected = selectedRoomId === room.id;
            
            // Get crew members stationed in this room
            const roomCrew = crew.filter(m => crewAssignments[m.id] === room.id);

            return (
              <div
                key={room.id}
                onClick={() => moveAvatarToRoom(room.id)}
                className={`p-3 border rounded relative flex flex-col justify-between cursor-pointer transition min-h-[150px] shadow-lg select-none ${room.width} ${
                  isSelected 
                    ? "border-yellow-400 bg-neutral-900/90 shadow-yellow-500/10" 
                    : isAvatarHere 
                    ? "border-current bg-black/80" 
                    : "border-neutral-800 bg-neutral-950/90 hover:border-neutral-600 hover:bg-neutral-900/30"
                }`}
              >
                {/* Room top indicators */}
                <div className="flex justify-between items-start border-b border-neutral-900 pb-1.5">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-neutral-400 block tracking-widest font-bold">ROOM {room.id.toUpperCase()}</span>
                    <span className="text-[11px] text-white font-bold tracking-wide">{room.name}</span>
                  </div>

                  {/* Integrity health status */}
                  <div className="text-right">
                    <span className={`text-[10px] font-mono ${getIntegrityColorClass(integrity)}`}>
                      {integrity}%
                    </span>
                  </div>
                </div>

                {/* Mid portion: Status & animations */}
                <div className="py-2 flex flex-col items-center justify-center min-h-[50px] relative">
                  {status !== "nominal" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 z-10 rounded">
                      {status === "fire" ? (
                        <div className="text-center text-red-500 animate-pulse space-y-1">
                          <Flame size={16} className="mx-auto text-red-500 animate-bounce" />
                          <span className="text-[8px] font-bold">ROOM FIRE</span>
                        </div>
                      ) : status === "leaking" ? (
                        <div className="text-center text-emerald-400 animate-pulse space-y-1">
                          <Activity size={16} className="mx-auto text-emerald-400 animate-spin" />
                          <span className="text-[8px] font-bold">COOLANT LEAK</span>
                        </div>
                      ) : (
                        <div className="text-center text-yellow-500 space-y-1">
                          <Cpu size={16} className="mx-auto text-yellow-500 animate-pulse" />
                          <span className="text-[8px] font-bold">GRID OFFLINE</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Character Avatars standing inside room */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-center mt-1 z-20">
                    {/* CONTROLLABLE AVATAR */}
                    {isAvatarHere && (
                      <motion.div 
                        layoutId="playerAvatar"
                        className="w-7 h-7 rounded-full bg-yellow-400 border border-black flex items-center justify-center text-black font-bold text-[10px] shadow-md cursor-pointer relative"
                        title="You (Commander)"
                      >
                        👑
                        <span className="absolute -bottom-1 -right-1 bg-yellow-500 text-[6px] text-black px-0.5 font-bold rounded">YOU</span>
                      </motion.div>
                    )}

                    {/* STATIONED CREW TOKENS */}
                    {roomCrew.map((cm) => (
                      <div
                        key={cm.id}
                        onClick={(e) => {
                          e.stopPropagation(); // don't move room on token click
                          talkToCrew(cm);
                        }}
                        className={`w-7 h-7 rounded-full border border-neutral-700 flex items-center justify-center text-white font-bold text-xs shadow-md relative cursor-pointer hover:border-yellow-400 hover:scale-105 transition bg-neutral-800 ${
                          selectedCrewMember?.id === cm.id ? "ring-1 ring-yellow-400" : ""
                        }`}
                        title={`${cm.name} (${cm.role})`}
                      >
                        {cm.role === "Pilot" ? "✈️" : cm.role === "Weapons Specialist" ? "⚔️" : cm.role === "Science Director" ? "🔮" : "🔧"}
                        <span className="absolute -bottom-1 -right-1 bg-indigo-500 text-[6px] text-white px-0.5 font-bold rounded">Lvl{cm.level}</span>
                      </div>
                    ))}
                  </div>

                  {/* Small ambient decoration icon based on room ID */}
                  {roomCrew.length === 0 && !isAvatarHere && status === "nominal" && (
                    <div className="opacity-15 text-neutral-400 select-none">
                      {room.id === "bridge" && <Navigation size={26} />}
                      {room.id === "weapons" && <Zap size={26} />}
                      {room.id === "shield" && <Shield size={26} />}
                      {room.id === "engineering" && <Cpu size={26} />}
                      {room.id === "cargo" && <Coins size={26} />}
                    </div>
                  )}
                </div>

                {/* Integrity bar graph */}
                <div className="space-y-1">
                  <div className="w-full bg-neutral-900 h-1 rounded overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${getIntegrityBarColorClass(integrity)}`}
                      style={{ width: `${integrity}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[8px] text-neutral-500">
                    <span>INTEGRITY</span>
                    <span className={isAvatarHere ? "text-yellow-400 font-bold" : ""}>
                      {isAvatarHere ? "★ ACTIVE COMMAND" : roomCrew.length > 0 ? "• STAFFED" : "VACANT"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid split interface: Room Console (Left) and Crew Dialogue Comms (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* ROOM DETAILS & CONSOLE CONTROL PANEL */}
        <section className="md:col-span-7 border border-current/20 bg-black/60 rounded p-4 flex flex-col justify-between shadow-lg">
          <div className="space-y-3">
            <div className="flex justify-between items-start border-b border-neutral-900 pb-2">
              <div className="space-y-1">
                <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold tracking-wider ${activeThemeBg} ${activeThemeText}`}>
                  MODULE SYSTEMS PANEL
                </span>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mt-1">
                  🌐 {activeRoom.name} — <span className="text-neutral-400 font-normal">{activeRoom.systemName}</span>
                </h3>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-neutral-400">ROOM LEVEL STATUS:</span>
                <div className={`font-bold text-xs ${getIntegrityColorClass(roomIntegrity[activeRoom.id])}`}>
                  {roomIntegrity[activeRoom.id] >= 100 ? "✓ OPTIMAL NOMINAL" : `⚠️ REDUCED CAPACITIES (${roomIntegrity[activeRoom.id]}%)`}
                </div>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-neutral-400">
              {activeRoom.description}
            </p>

            {/* Specialized role buff indicator */}
            <div className="p-3 border border-neutral-900 bg-neutral-950/60 rounded space-y-1.5 text-[10px]">
              <div className="flex items-center gap-1 font-bold text-yellow-500">
                <Sparkles size={12} /> SHIP-WIDE ACTIVE SYSTEMS IMPACT:
              </div>
              <p className="text-neutral-300">
                • {activeRoom.role}
              </p>
              {roomIntegrity[activeRoom.id] < 100 && (
                <p className="text-red-400 font-bold">
                  ⚠️ WARNING: This system's structural integrity has suffered. Auto-repair is ongoing but console actions are disabled/suppressed if integrity drops too low!
                </p>
              )}
            </div>

            {activeRoom.id === "bridge" && (
              <div className="p-3 border border-indigo-500/30 bg-indigo-950/5 rounded space-y-3">
                <div className="flex justify-between items-center border-b border-indigo-500/20 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-400 text-[10px] font-mono uppercase tracking-widest">
                    <Navigation size={12} /> BACKUP IMPULSE PROPULSION TANK STATUS
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-cyan-400">{backupFuel}% CHARGE</span>
                  </div>
                </div>
                <p className="text-[10px] text-neutral-400">
                  Sub-light Impulse systems engage automatically when warp fuel stacks are fully depleted. Refuels to 100% automatically for free upon docking with any station.
                </p>
                <div className="w-full bg-neutral-900 border border-cyan-500/30 rounded h-2 overflow-hidden">
                  <div 
                    className="bg-cyan-400 h-full transition-all duration-500" 
                    style={{ width: `${backupFuel}%` }} 
                  />
                </div>
              </div>
            )}

            {activeRoom.id === "bridge" && (
              <div className="p-3 border border-indigo-500/30 bg-indigo-950/5 rounded space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-indigo-400 text-[10px] font-mono uppercase tracking-widest">
                  <Navigation size={12} /> DEEP SPACE ANOMALY COCKPIT TERMINAL
                </div>
                <p className="text-[10px] text-neutral-400">
                  Transmit sub-space sensor sweeps to locate untracked rogue planets, space station ruins, or heavy asteroid belts.
                </p>

                {isDeepScanning ? (
                  <div className="space-y-1.5 p-2 bg-neutral-950 border border-neutral-800 rounded">
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-yellow-400 font-bold animate-pulse">🛰️ TRANSMITTING DEEP PROBE ARRAYS...</span>
                      <span>{deepScanProgress}%</span>
                    </div>
                    <div className="w-full bg-neutral-900 h-1.5 rounded overflow-hidden">
                      <div className="bg-yellow-400 h-full transition-all duration-200" style={{ width: `${deepScanProgress}%` }} />
                    </div>
                  </div>
                ) : detectedAnomaly ? (
                  <div className="p-2.5 bg-indigo-950/20 border border-indigo-500/30 rounded space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="truncate">
                        <span className="text-[8px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/10 px-1 py-0.5 rounded font-bold font-mono">ANOMALY ACQUIRED</span>
                        <h4 className="text-xs font-bold text-white mt-1 truncate">{detectedAnomaly.name}</h4>
                      </div>
                      <span className="text-xs font-bold text-yellow-500 font-mono shrink-0">+{detectedAnomaly.value} CR</span>
                    </div>
                    <p className="text-[9px] text-neutral-400 leading-tight">Locked coordinate signature. Click Lock coordinates to persist this location on your Star System map.</p>
                    <button
                      onClick={handleLockWaypoint}
                      className="w-full py-1 bg-yellow-500/10 hover:bg-yellow-500 hover:text-black border border-yellow-500 text-yellow-400 font-bold text-[9px] rounded transition cursor-pointer font-mono"
                    >
                      LOCK COORDINATES AS MAP WAYPOINT
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startDeepScan}
                    disabled={roomIntegrity.bridge < 40}
                    className="w-full py-1.5 border border-indigo-500 bg-indigo-950/20 hover:bg-indigo-500 hover:text-black text-indigo-400 font-bold text-[10px] rounded transition cursor-pointer flex items-center justify-center gap-1.5 uppercase font-mono"
                  >
                    <Cpu size={12} className="animate-spin" /> SCAN DEEP SPACE FOR ANOMALIES
                  </button>
                )}

                {/* Deploy Station Core Logic */}
                {!isInDeepSpace && activeSector && !activeSector.station && (!activeSector.enemies || activeSector.enemies.length === 0) && (
                  <button
                    onClick={() => onDeployStationCore && onDeployStationCore()}
                    disabled={roomIntegrity.bridge < 40 || !cargo.some(c => c.type === "station_core" && c.qty > 0) || credits < (activeSector.planet ? 500 : 1000)}
                    className={`w-full py-1.5 border font-bold text-[10px] rounded transition flex flex-col items-center justify-center gap-0.5 uppercase font-mono ${
                      cargo.some(c => c.type === "station_core" && c.qty > 0)
                        ? "border-teal-500 bg-teal-950/20 hover:bg-teal-500 hover:text-black text-teal-400 cursor-pointer"
                        : "border-neutral-800 bg-black text-neutral-600 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-1.5"><Cpu size={12} /> DEPLOY STATION CORE</div>
                    <span className="text-[8px] opacity-75">
                      Cost: {activeSector.planet ? "500 CR (Orbital Bonus)" : "1000 CR"} | Req: Station Core
                    </span>
                  </button>
                )}

                {voidWaypoints && voidWaypoints.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-neutral-900">
                    <div className="text-[9px] uppercase font-bold text-neutral-400 flex items-center gap-1 font-mono">
                      <Navigation size={10} className="text-indigo-400" /> LOCKED WAYPOINTS ({voidWaypoints.length}):
                    </div>
                    <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                      {voidWaypoints.map(wp => {
                        const warpFuelCost = hyperdriveOverclocked ? 2.2 : 4.0;
                        const hasFuel = fuel >= warpFuelCost;

                        return (
                          <div key={wp.id} className="p-2 border border-neutral-800 bg-neutral-950/40 rounded flex justify-between items-center text-[10px] gap-2">
                            <div className="truncate">
                              <span className="font-bold text-white block truncate">{wp.name}</span>
                              <span className="text-[8px] text-neutral-500 font-mono block">EST. INTEL VALUE: {wp.value} CR {wp.isSold ? "(SOLD)" : "(UNSOLD)"}</span>
                            </div>
                            <div className="shrink-0">
                              <button
                                onClick={() => onTriggerWarpJumpToWaypoint?.(wp)}
                                disabled={!hasFuel}
                                className={`px-2 py-0.5 text-[9px] font-bold border rounded transition cursor-pointer ${
                                  hasFuel
                                    ? "border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-black"
                                    : "border-neutral-800 text-neutral-600 cursor-not-allowed"
                                }`}
                              >
                                JUMP ({warpFuelCost} F)
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 flex flex-wrap gap-2 justify-between items-center border-t border-neutral-900 mt-4">
            <div className="text-[10px] text-neutral-400">
              {avatarRoom === activeRoom.id ? (
                <span className="text-yellow-400 font-bold flex items-center gap-1">
                  ✓ YOUR AVATAR STANDS IN THIS ROOM (AUTO-REPAIR ACTIVE)
                </span>
              ) : (
                <span className="text-neutral-500 italic">
                  Move your character here to run maintenance loops.
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {/* Repair Button (visible if room damaged) */}
              {roomIntegrity[activeRoom.id] < 100 && (
                <button
                  onClick={() => executeInstantRepair(activeRoom.id)}
                  className="px-3 py-1.5 border border-emerald-500 bg-emerald-950/20 hover:bg-emerald-500 hover:text-black text-emerald-400 font-bold text-[10px] rounded transition cursor-pointer flex items-center gap-1"
                >
                  <Wrench size={10} /> INSTANT NANO-REPAIR (50 CR)
                </button>
              )}

              {/* Console Trigger Button */}
              <button
                onClick={() => executeConsoleAction(activeRoom.id)}
                disabled={roomIntegrity[activeRoom.id] < 40}
                className={`px-3 py-1.5 border font-bold text-[10px] rounded transition flex items-center gap-1 ${
                  roomIntegrity[activeRoom.id] >= 40
                    ? "border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black cursor-pointer"
                    : "border-neutral-800 text-neutral-600 bg-black cursor-not-allowed"
                }`}
              >
                <Cpu size={10} /> {activeRoom.consoleActionName}
              </button>
            </div>
          </div>
        </section>

        {/* CREW COMMS DIRECTORY & CHAT PANEL */}
        <section className="md:col-span-5 border border-indigo-500/20 bg-indigo-950/5 rounded p-4 flex flex-col justify-between shadow-lg relative">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white border-b border-neutral-900 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <Users size={15} /> CREW COMS-RELAY JUNCTION
              </span>
              <span className="text-[10px] font-normal text-neutral-400">SQUAD LIMIT: {crew.length}/6</span>
            </h3>

            {/* List crew members */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {crew.map((member) => {
                const assignedRoom = SHIP_ROOMS.find(r => r.id === crewAssignments[member.id]);
                const isSelected = selectedCrewMember?.id === member.id;

                return (
                  <div
                    key={member.id}
                    onClick={() => talkToCrew(member)}
                    className={`p-2 border rounded transition flex justify-between items-center cursor-pointer ${
                      isSelected 
                        ? "border-yellow-400 bg-neutral-900/60" 
                        : "border-neutral-800 bg-black/40 hover:bg-neutral-900/40"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs">{member.name}</span>
                        <span className="text-[8px] px-1 bg-indigo-950 border border-indigo-500/20 rounded font-bold text-indigo-400 uppercase font-mono">
                          {member.role}
                        </span>
                      </div>
                      <p className="text-[9px] text-neutral-400 italic">{member.perk}</p>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <span className="text-[9px] text-neutral-400">
                        Post: <strong className="text-neutral-300 font-bold">{assignedRoom ? assignedRoom.name.split("/")[0] : "UNASSIGNED"}</strong>
                      </span>
                      <ArrowRight size={10} className="text-neutral-600" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Communication dialogue output */}
            <AnimatePresence mode="wait">
              {selectedCrewMember && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 border border-yellow-500/20 bg-yellow-950/10 rounded space-y-2 text-[10.5px]"
                >
                  <div className="flex justify-between items-center border-b border-yellow-500/10 pb-1.5">
                    <span className="font-bold text-yellow-500 uppercase flex items-center gap-1">
                      <MessageSquare size={11} /> COMMS SECURED — {selectedCrewMember.name.toUpperCase()}
                    </span>
                    <button 
                      onClick={() => setSelectedCrewMember(null)}
                      className="text-neutral-500 hover:text-white transition cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </div>
                  <p className="text-neutral-200 italic leading-relaxed">
                    {dialogueText}
                  </p>

                  {/* Reassign posting drop list */}
                  <div className="pt-2 border-t border-yellow-500/10 flex items-center justify-between gap-1.5 flex-wrap">
                    <span className="text-[9px] text-neutral-400 font-bold">REASSIGN DECK STATION:</span>
                    <div className="flex gap-1 flex-wrap">
                      {SHIP_ROOMS.map(room => {
                        const isCurrentlyHere = crewAssignments[selectedCrewMember.id] === room.id;
                        return (
                          <button
                            key={room.id}
                            disabled={isCurrentlyHere}
                            onClick={() => reassignCrew(selectedCrewMember.id, room.id)}
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold border transition cursor-pointer ${
                              isCurrentlyHere 
                                ? "bg-indigo-950 text-indigo-400 border-indigo-500/20 cursor-not-allowed" 
                                : "bg-black border-neutral-700 text-neutral-400 hover:border-yellow-500 hover:text-yellow-500"
                            }`}
                          >
                            {room.name.split(" ")[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!selectedCrewMember && (
            <div className="text-center text-neutral-500 italic py-6 text-[10px] flex items-center gap-1.5 justify-center">
              <HelpCircle size={12} /> Select a crew member from the roster above to initiate an active comms link.
            </div>
          )}
        </section>
      </div>

      {/* SHIELD MODULATION OSCILLOSCOPE MODAL */}
      {isShieldGameOpen && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center font-mono p-4 select-none">
          <div className="w-full max-w-lg border border-cyan-500/40 bg-black/95 p-5 rounded-lg shadow-[0_0_40px_rgba(6,182,212,0.2)] space-y-4">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-cyan-500/25 pb-2">
              <div className="flex items-center gap-2">
                <Shield className="text-cyan-400 animate-pulse" size={18} />
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Shield Modulation Oscilloscope
                  </h3>
                  <p className="text-[9px] text-neutral-400">
                    KINETIC EMITTER HARMONIC SYNCHRONIZER v4.2
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  AudioEngine.playBeep(600, 0.1, "triangle");
                  setIsShieldGameOpen(false);
                }}
                className="p-1 hover:bg-neutral-900 border border-neutral-800 rounded transition text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Metrics HUD */}
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="bg-black/60 border border-neutral-900 p-1.5 rounded">
                <span className="text-neutral-500 uppercase block text-[8px] tracking-wider">Target Freq</span>
                <span className="text-emerald-400 font-bold text-sm">{targetFreq.toFixed(2)} GHz</span>
              </div>
              <div className="bg-black/60 border border-neutral-900 p-1.5 rounded">
                <span className="text-neutral-500 uppercase block text-[8px] tracking-wider">Sweep Freq</span>
                <span className="text-cyan-400 font-bold text-sm animate-pulse">{currentFreq.toFixed(2)} GHz</span>
              </div>
              <div className="bg-black/60 border border-neutral-900 p-1.5 rounded">
                <span className="text-neutral-500 uppercase block text-[8px] tracking-wider">Active Shields</span>
                <span className="text-yellow-400 font-bold text-sm">{shields}%</span>
              </div>
            </div>

            {/* Oscilloscope Grid Display Screen */}
            <div className="relative border border-emerald-500/20 rounded bg-emerald-950/10 overflow-hidden h-[180px] flex items-center justify-center">
              {/* Retro Scanline CRT Overlay */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[length:100%_4px,_6px_100%] opacity-70" />
              
              {/* Dynamic Oscilloscope Waves Canvas */}
              <svg viewBox="0 0 480 180" preserveAspectRatio="none" className="absolute inset-0 w-full h-full text-emerald-500/30">
                <defs>
                  {/* Grid pattern */}
                  <pattern id="osc-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  </pattern>
                </defs>
                {/* Background Grid */}
                <rect width="100%" height="100%" fill="url(#osc-grid)" className="opacity-40" />
                
                {/* Center horizontal axis */}
                <line x1="0" y1="90" x2="480" y2="90" stroke="currentColor" strokeWidth="1" className="opacity-70" />
                <line x1="240" y1="0" x2="240" y2="180" stroke="currentColor" strokeWidth="1" className="opacity-70" />

                {/* Target Wave (Solid Green) */}
                {(() => {
                  const width = 480;
                  const points = [];
                  for (let x = 0; x <= width; x += 3) {
                    const y = 90 + Math.sin((x / width) * Math.PI * 2 * targetFreq + phase) * 45;
                    points.push(`${x},${y}`);
                  }
                  return (
                    <path
                      d={`M ${points.join(" L ")}`}
                      stroke="#10b981"
                      strokeWidth="3.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-100 drop-shadow-[0_0_8px_rgba(16,185,129,0.95)]"
                    />
                  );
                })()}

                {/* Player Wave (Cyan pulsating sweep) */}
                {(() => {
                  const width = 480;
                  const points = [];
                  for (let x = 0; x <= width; x += 3) {
                    const y = 90 + Math.sin((x / width) * Math.PI * 2 * currentFreq + phase) * 45;
                    points.push(`${x},${y}`);
                  }
                  return (
                    <path
                      d={`M ${points.join(" L ")}`}
                      stroke="#00ffff"
                      strokeWidth="3.5"
                      strokeDasharray="4 2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-100 drop-shadow-[0_0_8px_rgba(0,255,255,0.95)]"
                    />
                  );
                })()}
              </svg>

              {/* Central crosshair indicator */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
                <div className="w-5 h-5 border border-dashed border-cyan-500/50 rounded-full animate-ping" />
              </div>
            </div>

            {/* Instruction feedback */}
            <div className={`p-2 border rounded text-center text-xs font-bold uppercase transition-colors duration-200 ${
              shieldGameFeedback.type === "success"
                ? "bg-emerald-950/30 border-emerald-500 text-emerald-400"
                : shieldGameFeedback.type === "fail"
                ? "bg-red-950/30 border-red-500 text-red-400"
                : "bg-neutral-950/50 border-neutral-800 text-cyan-400"
            }`}>
              {shieldGameFeedback.text}
            </div>

            {/* Spacebar or click triggers */}
            <div className="flex flex-col gap-2">
              <button
                onClick={triggerSpacebarModulate}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 active:scale-[0.98] transition text-black font-extrabold text-xs uppercase rounded cursor-pointer tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              >
                <Zap size={13} className="fill-black" />
                ALIGN EMITTER GRID (or SPACEBAR)
              </button>
              
              <div className="flex justify-between items-center text-[9px] text-neutral-500 pt-1">
                <span>SUCCESSFUL MODULATIONS: <strong className="text-emerald-400">{successCount}</strong></span>
                <span>MATCH MARGIN: &lt; 0.45 GHz</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </section>
  );
};
