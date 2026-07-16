/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from "react";
import { CombatState, Enemy, CargoSlot, Position, SectorShip } from "../types";
import { WEAPON_ITEMS, ITEM_TEMPLATES } from "../constants";
import { AudioEngine } from "../audio";
import { Crosshair, Shield, Activity, RefreshCw, LogOut, Flame, Heart, Zap, ShieldAlert, Cpu, AlertTriangle } from "lucide-react";
import { ShipWireframeRender } from "./ShipWireframeRender";
import { motion, AnimatePresence } from "motion/react";

interface CombatArenaProps {
  combatState: CombatState;
  playerHull: number;
  playerShield: number;
  maxPlayerHull: number;
  maxPlayerShield: number;
  equippedWeapons: (string | null)[];
  cargo: CargoSlot[];
  crew: any[];
  wingmen?: any[];
  onFireWeapon: (slotIndex: number, ammoType?: string) => void;
  onDeflectSuccess: (success: boolean) => void;
  onUseNanobots: () => void;
  onUseShieldCore: () => void;
  onFlee: () => void;
  combatLog: string[];
  weaponCapacity: number;
  onSelectWeakPoint: (weakPoint: string | null) => void;
  onTriggerNovaBlast: () => void;
  onSelectActiveEnemy: (index: number) => void;
  themeColor: "green" | "amber" | "cyan";
  activeShip: string;
  availableHelpers?: SectorShip[];
  onCallHelper?: (helperId: string) => void;
}

export const CombatArena: React.FC<CombatArenaProps> = ({
  combatState,
  playerHull,
  playerShield,
  maxPlayerHull,
  maxPlayerShield,
  equippedWeapons,
  cargo,
  crew,
  wingmen = [],
  onFireWeapon,
  onDeflectSuccess,
  onUseNanobots,
  onUseShieldCore,
  onFlee,
  combatLog,
  weaponCapacity,
  onSelectWeakPoint,
  onTriggerNovaBlast,
  onSelectActiveEnemy,
  themeColor,
  activeShip,
  availableHelpers = [],
  onCallHelper
}) => {
  const [showAmmoSelector, setShowAmmoSelector] = useState<number | null>(null); // holds slotIndex of launcher
  const [pointerPos, setPointerPos] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1);
  const [zoneCenter, setZoneCenter] = useState<number>(50);
  const [zoneDir, setZoneDir] = useState<number>(1);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

  const activeEnemy = combatState.enemies[combatState.activeEnemyIndex] || combatState.enemies[0];
  const scienceOfficer = crew.find((c) => c.role === "Science Director");

  // Base width is 24% (half-width = 12).
  // Each Pilot level adds 1% to the half-width (widening the deflection target zone!)
  const pilots = crew.filter((c) => c.role === "Pilot");
  const maxPilotLevel = pilots.length > 0 ? Math.max(...pilots.map((p) => p.level)) : 0;
  const halfWidth = 12 + maxPilotLevel;

  // Track pointerPos and zoneCenter in refs for stable real-time keyboard/click triggers
  const pointerPosRef = useRef(pointerPos);
  const zoneCenterRef = useRef(zoneCenter);

  useEffect(() => {
    pointerPosRef.current = pointerPos;
  }, [pointerPos]);

  useEffect(() => {
    zoneCenterRef.current = zoneCenter;
  }, [zoneCenter]);

  // Animate the QTE pointer & sliding safe zone back and forth while QTE is running
  useEffect(() => {
    if (!combatState.qteRunning) return;

    let qteInterval: any;
    // Lowered multiplier from 3.5 to 1.4 for smooth, human-reactable speed
    const speed = (combatState.qteSpeed || 1.6) * 1.4;

    qteInterval = setInterval(() => {
      // 1. Move Pointer
      setPointerPos((prev) => {
        let next = prev + direction * speed;
        if (next >= 100) {
          next = 100;
          setDirection(-1);
        } else if (next <= 0) {
          next = 0;
          setDirection(1);
        }
        return next;
      });

      // 2. Move target zone center slowly for extra challenge!
      setZoneCenter((prev) => {
        let next = prev + zoneDir * 0.5;
        if (next >= 75) {
          next = 75;
          setZoneDir(-1);
        } else if (next <= 25) {
          next = 25;
          setZoneDir(1);
        }
        return next;
      });
    }, 16);

    return () => clearInterval(qteInterval);
  }, [combatState.qteRunning, direction, zoneDir, combatState.qteSpeed]);

  const handleDeflectTrigger = () => {
    if (!combatState.qteRunning) return;

    // Check bounds using the absolute latest frame values from refs
    const currentPointer = pointerPosRef.current;
    const currentZone = zoneCenterRef.current;

    const start = currentZone - halfWidth;
    const end = currentZone + halfWidth;
    const isSuccess = currentPointer >= start && currentPointer <= end;

    if (isSuccess) {
      AudioEngine.playDeflect();
    } else {
      AudioEngine.playUIError();
    }

    onDeflectSuccess(isSuccess);
  };

  // Keep trigger handler stable for event listener
  const triggerRef = useRef(handleDeflectTrigger);
  useEffect(() => {
    triggerRef.current = handleDeflectTrigger;
  }, [handleDeflectTrigger]);

  // Keyboard binding for Spacebar triggering Deflect QTE
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && combatState.qteRunning) {
        e.preventDefault();
        triggerRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [combatState.qteRunning]);

  const handleWeaponClick = (slotIndex: number, weaponId: string) => {
    const details = WEAPON_ITEMS[weaponId];
    if (details?.needsAmmo) {
      // Open torpedo selection panel
      AudioEngine.playBeep(450, 0.05);
      setShowAmmoSelector(slotIndex);
    } else {
      AudioEngine.playLaser();
      onFireWeapon(slotIndex);
    }
  };

  const handleAmmoSelect = (ammoType: string) => {
    if (showAmmoSelector === null) return;
    AudioEngine.playTorpedo();
    onFireWeapon(showAmmoSelector, ammoType);
    setShowAmmoSelector(null);
  };

  const getEnemyShipId = () => {
    if (!activeEnemy) return "interceptor";
    const name = activeEnemy.name.toLowerCase();
    if (name.includes("freighter") || name.includes("caravan")) return "heavy_hauler";
    if (activeEnemy.isBattleship || name.includes("battleship") || name.includes("dreadnought")) return "battlecruiser";
    if (name.includes("bomber") || name.includes("torpedo")) return "torpedoboat";
    if (name.includes("gunship") || name.includes("sentry")) return "assault_gunship";
    if (name.includes("scout")) return "interceptor";
    return "interceptor"; 
  };

  const activeTorpedoes = [
    { key: "torpedo", label: "Standard HE", count: cargo.reduce((sum, s) => (s.type === "torpedo" ? sum + s.qty : sum), 0) },
    { key: "torpedo_proton", label: "Proton Nuclear", count: cargo.reduce((sum, s) => (s.type === "torpedo_proton" ? sum + s.qty : sum), 0) },
    { key: "torpedo_antimatter", label: "Anti-Matter", count: cargo.reduce((sum, s) => (s.type === "torpedo_antimatter" ? sum + s.qty : sum), 0) }
  ];

  const getRarityStyleClass = (rarity: string) => {
    switch (rarity) {
      case "common": return "text-emerald-400";
      case "uncommon": return "text-yellow-500";
      case "rare": return "text-red-500";
      case "ultra_rare": return "text-fuchsia-500 font-bold";
      case "one_of_a_kind": return "text-purple-400 font-bold";
      default: return "text-neutral-400";
    }
  };

  const hullPercent = (playerHull / maxPlayerHull) * 100;
  const shieldPercent = (playerShield / maxPlayerShield) * 100;
  
  const enemyHullPercent = activeEnemy ? (activeEnemy.hull / activeEnemy.maxHull) * 100 : 0;
  const enemyShieldPercent = activeEnemy ? (activeEnemy.shields / activeEnemy.maxShields) * 100 : 0;

  const themeTextClass =
    themeColor === "green"
      ? "text-green-400"
      : themeColor === "amber"
      ? "text-amber-500"
      : "text-cyan-400";

  const isHullCritical = hullPercent < 10;
  const isHullFatal = hullPercent < 2;

  return (
    <div 
      id="viewport-combat-arena" 
      className={`fade-panel flex-grow flex flex-col justify-between font-mono p-1 
        ${isHullCritical && !isHullFatal ? "hud-glitch-active" : ""}
        ${isHullFatal ? "unusable-ui" : ""}
      `}
    >
      {/* Target Foe selector decks */}
      <div className="flex flex-col border-b border-red-900 pb-2 mb-3 text-red-500">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <span className="font-bold text-sm tracking-wider uppercase flex items-center gap-2">
            <Crosshair size={16} className="animate-spin text-red-500 duration-1000" /> DOGFIGHT CRITICAL ALIGNMENT
          </span>
          {activeEnemy && (
            <span id="combat-threat-identifier" className="text-xs font-bold uppercase animate-pulse">
              {activeEnemy.name} [Hull: {typeof activeEnemy.hull === 'number' ? Number(activeEnemy.hull.toFixed(1)) : activeEnemy.hull}/{activeEnemy.maxHull}]
            </span>
          )}
        </div>

        {/* Multi-enemy list selector buttons */}
        {combatState.enemies.length > 1 && (
          <div id="combat-enemy-selector-rack" className="flex flex-wrap gap-2 mt-2">
            {combatState.enemies.map((en, idx) => {
              const isSelected = combatState.activeEnemyIndex === idx;
              const isDead = en.hull <= 0;

              return (
                <button
                  key={`${en.name}-${idx}`}
                  onClick={() => {
                    if (!isDead) {
                      AudioEngine.playBeep(450, 0.05);
                      onSelectActiveEnemy(idx);
                    }
                  }}
                  disabled={isDead}
                  className={`px-3 py-1.5 text-[10px] border rounded transition font-bold font-mono uppercase flex items-center gap-1.5 ${
                    isDead
                      ? "border-neutral-800 bg-neutral-950/40 text-neutral-600 cursor-not-allowed"
                      : isSelected
                      ? "border-red-500 bg-red-950/40 text-red-400 shadow-[0_0_5px_rgba(239,68,68,0.3)]"
                      : "border-neutral-600 text-neutral-400 hover:border-red-500"
                  }`}
                >
                  <Crosshair size={11} className={isDead ? "opacity-30" : "animate-pulse text-red-500"} />
                  {en.name} ({isDead ? "DOWN" : `${typeof en.hull === 'number' ? Number(en.hull.toFixed(1)) : en.hull} HP`})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Dual Ship portrait viewport */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2 relative">
        {/* Subtle Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-20" />

        {/* Left pane: Player diagnostics */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="p-3.5 border border-emerald-500/30 rounded bg-black/60 relative flex flex-col justify-between shadow-lg overflow-hidden group"
        >
          <div className="absolute top-1.5 right-2 text-[8px] opacity-40 font-mono select-none uppercase tracking-widest">
            Vessel Diagnostics
          </div>
          <div className="flex justify-center mb-2 h-24 overflow-visible relative">
            <div className="absolute inset-0 bg-emerald-500/5 blur-xl rounded-full" />
            <ShipWireframeRender shipId={activeShip} themeHexColor={0x34d399} width={160} height={100} />
          </div>
          <div className="text-xs space-y-2 relative z-10">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-tighter opacity-70">
                <span className="flex items-center gap-1 text-emerald-400"><Heart size={10} className="text-red-500" /> Hull Integrity</span>
                <span className="text-emerald-400">{typeof playerHull === 'number' ? Number(playerHull.toFixed(1)) : playerHull} / {maxPlayerHull}</span>
              </div>
              <div className="h-1.5 w-full bg-black/40 border border-emerald-500/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${hullPercent}%` }}
                  className={`h-full ${hullPercent < 30 ? "bg-red-500" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"}`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-tighter opacity-70">
                <span className="flex items-center gap-1 text-blue-400"><Shield size={10} className="text-blue-400" /> Shield Status</span>
                <span className="text-blue-400">{typeof playerShield === 'number' ? Number(playerShield.toFixed(1)) : playerShield} / {maxPlayerShield}</span>
              </div>
              <div className="h-1.5 w-full bg-black/40 border border-blue-500/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${shieldPercent}%` }}
                  className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right pane: Hostile telemetry */}
        <AnimatePresence mode="wait">
          {activeEnemy ? (
            <motion.div 
              key={activeEnemy.name}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="p-3.5 border border-red-500/30 rounded bg-black/60 relative flex flex-col justify-between shadow-lg overflow-hidden group"
            >
              <div className="absolute top-1.5 right-2 text-[8px] opacity-40 font-mono select-none uppercase tracking-widest text-red-400">
                Target Telemetry
              </div>
              <div className="flex justify-center mb-2 h-24 overflow-visible relative">
                <div className="absolute inset-0 bg-red-500/5 blur-xl rounded-full" />
                <ShipWireframeRender shipId={getEnemyShipId()} themeHexColor={0xef4444} width={160} height={100} />
              </div>
              <div className="text-xs text-red-400 space-y-2 relative z-10">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-tighter opacity-70">
                    <span>Structure integrity</span>
                    <span id="combat-enemy-hull">{typeof activeEnemy.hull === 'number' ? Number(activeEnemy.hull.toFixed(1)) : activeEnemy.hull} / {activeEnemy.maxHull}</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/40 border border-red-500/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${enemyHullPercent}%` }}
                      className="h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-tighter opacity-70">
                    <span>Defensive Shields</span>
                    <span id="combat-enemy-shield">{typeof activeEnemy.shields === 'number' ? Number(activeEnemy.shields.toFixed(1)) : activeEnemy.shields} / {activeEnemy.maxShields}</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/40 border border-red-500/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${enemyShieldPercent}%` }}
                      className="h-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-red-500/10">
                  <span className="text-[9px] uppercase opacity-60">Primary Ordinance:</span>
                  <span className="font-bold text-white truncate max-w-[150px] text-[10px]">{activeEnemy.weapons}</span>
                </div>
              </div>

              {/* Science Director overlays */}
              {scienceOfficer && (
                <div id="science-scanner-deck" className="mt-2 pt-2 border-t border-dashed border-red-500/20 text-xs">
                  <div className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest mb-1 flex justify-between items-center select-none">
                    <span className="flex items-center gap-1">
                      <RefreshCw size={10} className="animate-spin text-cyan-500" /> Scanned Insights
                    </span>
                    <span className="text-yellow-500 animate-pulse text-[8px]">{activeEnemy.weaponType.toUpperCase()} ARMED</span>
                  </div>
                  
                  {scienceOfficer.level >= 3 ? (
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-yellow-500 font-bold uppercase tracking-widest block select-none">
                        SCANNER: TARGET WEAK POINTS REVEALED
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => {
                            AudioEngine.playBeep(600, 0.05);
                            onSelectWeakPoint(combatState.selectedWeakPoint === "thrusters" ? null : "thrusters");
                          }}
                          className={`py-1.5 border rounded text-[9px] font-bold tracking-wider transition ${
                            combatState.selectedWeakPoint === "thrusters"
                              ? "border-cyan-400 bg-cyan-950/40 text-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.2)]"
                              : "border-neutral-700 hover:border-cyan-500 text-neutral-400"
                          }`}
                        >
                          THRUST VENTS (+35%)
                        </button>
                        <button
                          onClick={() => {
                            AudioEngine.playBeep(600, 0.05);
                            onSelectWeakPoint(combatState.selectedWeakPoint === "shields" ? null : "shields");
                          }}
                          className={`py-1.5 border rounded text-[9px] font-bold tracking-wider transition ${
                            combatState.selectedWeakPoint === "shields"
                              ? "border-cyan-400 bg-cyan-950/40 text-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.2)]"
                              : "border-neutral-700 hover:border-cyan-500 text-neutral-400"
                          }`}
                        >
                          SHIELD COIL (+50%)
                        </button>
                        {scienceOfficer.level >= 5 && (
                          <button
                            onClick={() => {
                              AudioEngine.playBeep(800, 0.1, "triangle");
                              onSelectWeakPoint(combatState.selectedWeakPoint === "reactor" ? null : "reactor");
                            }}
                            className={`py-1.5 border rounded text-[9px] font-bold tracking-wider transition ${
                              combatState.selectedWeakPoint === "reactor"
                                ? "border-red-500 bg-red-950/40 text-red-400 shadow-[0_0_5px_rgba(239,68,68,0.3)] animate-pulse"
                                : "border-neutral-700 hover:border-red-500 text-neutral-400"
                            }`}
                          >
                            REACTOR CORE (5.0x / DETONATE)
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[9px] opacity-75 italic text-cyan-400/80 leading-snug">
                      Promote Science Director to Rank 3 to unlock weakpoint scanner targeting grids.
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 border border-dashed border-red-900/30 rounded bg-black/40 flex items-center justify-center text-xs italic text-red-500/60 font-mono tracking-tighter"
            >
              HOSTILE SIGNATURES LOST // SCANNING FOR DEBRIS
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* WINGMAN COMBAT HUD PANELS */}
      {wingmen && wingmen.length > 0 && (
        <div id="combat-wingmen-deck" className="border border-cyan-500/30 p-2.5 rounded bg-cyan-950/5 text-[10px] space-y-2 my-2.5">
          <div className="flex justify-between items-center text-cyan-400 border-b border-cyan-500/20 pb-1 uppercase font-bold text-[10px] tracking-wider select-none">
            <span className="flex items-center gap-1.5 animate-pulse">
              <Crosshair size={12} /> ESCORT WINGMEN ENGAGED
            </span>
            <span>{wingmen.length} wingman ships providing auxiliary target support</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {wingmen.map((w) => (
              <div key={w.id} className="p-2 border border-cyan-500/20 rounded bg-black/40 flex justify-between items-center leading-normal">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${w.standingDown ? "bg-red-500" : "bg-green-500 animate-ping"}`} />
                    <strong className="text-white">{w.name}</strong> 
                    <span className="text-gray-500 text-[8px] uppercase">({w.shipType})</span>
                  </div>
                  <div className="text-[9px] opacity-70 flex gap-2">
                    <span>HP: {w.hp}/{w.maxHp}</span>
                    <span>FP: {w.firepower}</span>
                  </div>
                  <div className="text-[8px] flex gap-2 pt-0.5 select-none">
                    <span className="text-cyan-400">FOCUS: {w.focus.toUpperCase()}</span>
                    {w.standingDown && <span className="text-red-400 uppercase font-bold font-mono text-[8px] tracking-wider animate-pulse">[STBY]</span>}
                  </div>
                </div>
                
                {/* Micro target switches directly on combat pane */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      AudioEngine.playBeep(700, 0.1, "sine");
                      w.focus = w.focus === "shields" ? "hull" : "shields";
                    }}
                    className="px-1 py-0.5 border border-cyan-500/40 text-[7px] uppercase rounded hover:bg-cyan-500 hover:text-black cursor-pointer text-center"
                    title="Change focus target"
                  >
                    FOCUS
                  </button>
                  <button
                    onClick={() => {
                      AudioEngine.playBeep(700, 0.1, "sine");
                      w.standingDown = !w.standingDown;
                    }}
                    className={`px-1 py-0.5 border text-[7px] uppercase rounded cursor-pointer text-center ${w.standingDown ? "border-red-500 text-red-500" : "border-green-500 text-green-500"}`}
                  >
                    {w.standingDown ? "STBY" : "FIRE"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Torpedo Ammunition Selector Overlay Panel */}
      {showAmmoSelector !== null && (
        <div id="combat-ammo-selector" className="p-3 border border-orange-500 rounded bg-black/95 my-2 text-center animate-fade-in shadow-2xl z-30">
          <div className="text-xs font-bold text-orange-400 mb-2.5 flex items-center justify-center gap-1 select-none">
            <Crosshair size={14} className="animate-spin" /> LOAD WARHEAD SELECTION SEQUENCE
          </div>
          <div id="ammo-choice-grid" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {activeTorpedoes.map((spec) => {
              const isAvailable = spec.count > 0;
              return (
                <button
                  key={spec.key}
                  onClick={() => handleAmmoSelect(spec.key)}
                  disabled={!isAvailable}
                  className={`py-2 border rounded text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                    isAvailable
                      ? "border-current bg-current/5 hover:bg-current hover:text-black cursor-pointer"
                      : "border-neutral-800 text-neutral-600 bg-neutral-950/10 cursor-not-allowed"
                  }`}
                >
                  <span>{spec.label} Torpedo</span>
                  <span className="text-[10px] opacity-75">Available qty: {spec.count}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => {
              AudioEngine.playBeep(450, 0.05);
              setShowAmmoSelector(null);
            }}
            className="mt-3.5 text-[10px] border border-neutral-600 px-3 py-1 hover:bg-neutral-800 text-neutral-400 rounded cursor-pointer uppercase"
          >
            Cancel Load Sequence
          </button>
        </div>
      )}

      {/* QTE Deflect Matrix Sliding Panel */}
      {combatState.qteRunning && (
        <div id="combat-deflect-qte" className="p-3 border-2 border-yellow-500 rounded bg-black/95 my-2 text-center relative font-mono shadow-2xl animate-fade-in z-30">
          <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest flex items-center justify-center gap-1.5 select-none">
            <ShieldAlert size={14} className="animate-bounce" /> DEFLECTOR BARRIER TRIGGERED <ShieldAlert size={14} className="animate-bounce" />
          </span>
          <div className="text-[9px] text-yellow-500/80 mb-2 leading-snug">
            PRESS <kbd className="px-1 py-0.5 bg-neutral-800 border border-neutral-600 rounded text-white text-[8px]">SPACEBAR</kbd> OR CLICK HARMONIZER AS THE YELLOW POINTER ROTATES WITHIN THE GREEN ZONE
          </div>

          {/* Slider track container */}
          <div className="w-full h-8 bg-neutral-950 border border-yellow-500/80 rounded relative overflow-hidden flex items-center">
            {/* Deflection Target safe region */}
            <div
              id="qte-target-zone"
              className="absolute bg-green-500/30 border-l border-r border-green-400 h-full transition-all duration-300"
              style={{
                width: `${halfWidth * 2}%`,
                left: `${zoneCenter - halfWidth}%`
              }}
            />
            {/* Sliding needle pointer */}
            <div
              id="qte-pointer"
              className="absolute w-2 h-full bg-yellow-500 shadow-lg"
              style={{
                left: `${pointerPos}%`,
                boxShadow: "0 0 10px #facc15"
              }}
            />
          </div>

          <button
            onClick={handleDeflectTrigger}
            className="mt-3 w-full py-2 bg-yellow-500 text-black text-xs font-bold hover:bg-yellow-400 rounded tracking-widest transition cursor-pointer shadow-lg uppercase"
          >
            Activate Shield Harmonizer Now
          </button>
        </div>
      )}

      {/* Battle logs stream */}
      <div
        id="combat-log"
        className="h-24 overflow-y-auto border border-white/10 p-2.5 bg-black/80 rounded text-[11px] space-y-1 mb-3 font-mono relative overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent)] z-0" />
        <AnimatePresence initial={false}>
          {combatLog.length > 0 ? (
            combatLog.slice().reverse().map((log, idx) => (
              <motion.p 
                key={`${log}-${idx}`}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="leading-normal text-current/80 relative z-10 border-l-2 border-current/10 pl-2 text-[10px]"
              >
                <span className="opacity-30 mr-1 select-none">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                {log}
              </motion.p>
            ))
          ) : (
            <p className="italic opacity-30 text-center py-4 text-[10px]">WAITING FOR COMBAT TELEMETRY DATA...</p>
          )}
        </AnimatePresence>
      </div>

      {/* Choice Deck interface buttons */}
      <div id="combat-action-deck" className="grid grid-cols-2 sm:grid-cols-5 gap-2 border-t border-white/10 pt-3">
        {/* Rendered active weapons buttons */}
        {equippedWeapons.map((wepId, slotIndex) => {
          if (!wepId) {
            return (
              <div
                key={slotIndex}
                className="p-2 border border-dashed border-neutral-800 rounded flex items-center justify-center text-center text-[10px] text-neutral-600 select-none bg-black/20"
              >
                EMPTY PORT
              </div>
            );
          }

          const wep = WEAPON_ITEMS[wepId];
          const canFire = combatState.playerTurn && !combatState.qteRunning;

          // Check if this slot is part of the volley of the currently hovered button
          let isPartOfVolley = false;
          if (hoveredSlot !== null && canFire) {
            for (let i = 0; i < weaponCapacity; i++) {
              if ((hoveredSlot + i) % equippedWeapons.length === slotIndex) {
                isPartOfVolley = true;
                break;
              }
            }
          }

          return (
            <motion.div 
              key={`${wepId}-${slotIndex}`} 
              className="relative"
              onMouseEnter={() => setHoveredSlot(slotIndex)}
              onMouseLeave={() => setHoveredSlot(null)}
              whileHover={canFire ? { scale: 1.02 } : {}}
              whileTap={canFire ? { scale: 0.98 } : {}}
            >
              <button
                disabled={!canFire}
                onClick={() => handleWeaponClick(slotIndex, wepId)}
                className={`w-full p-2 border rounded text-center transition-colors flex flex-col justify-between items-center h-14 ${
                  canFire
                    ? "border-current bg-current/5 hover:bg-current/15 cursor-pointer shadow-[0_0_10px_rgba(255,255,255,0.05)]"
                    : "border-neutral-800 text-neutral-600 bg-neutral-950/10 cursor-not-allowed"
                } ${isPartOfVolley ? "ring-1 ring-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : ""}`}
              >
                <span className="text-[9px] font-bold block opacity-60">FIRE MOUNT {slotIndex + 1}</span>
                <span className={`text-[10px] font-semibold truncate max-w-[100px] ${getRarityStyleClass(wep.rarity)}`}>
                  {wep.name}
                </span>
              </button>

              {/* Red dot markers for secondary hardpoints in the volley */}
              {isPartOfVolley && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_5px_#ef4444] z-10 animate-pulse border border-white/30" />
              )}
            </motion.div>
          );
        })}

        {/* Consumable - Repair bots */}
        <motion.button
          whileHover={combatState.playerTurn && !combatState.qteRunning ? { scale: 1.02 } : {}}
          whileTap={combatState.playerTurn && !combatState.qteRunning ? { scale: 0.98 } : {}}
          onClick={() => {
            if (combatState.playerTurn && !combatState.qteRunning) {
              AudioEngine.playUIConfirm();
              onUseNanobots();
            }
          }}
          disabled={!combatState.playerTurn || combatState.qteRunning}
          className={`p-2 border rounded text-center transition-colors flex flex-col justify-between items-center h-14 ${
            combatState.playerTurn && !combatState.qteRunning
              ? "border-cyan-500 bg-cyan-950/10 hover:bg-cyan-950/20 cursor-pointer shadow-[0_0_10px_rgba(34,211,238,0.1)]"
              : "border-neutral-800 text-neutral-600 bg-neutral-950/10 cursor-not-allowed"
          }`}
        >
          <span className="text-[9px] font-bold block opacity-60 text-cyan-400">RESTORE HULL</span>
          <span className="text-[10px] font-semibold flex items-center gap-1 text-cyan-300">
            <Cpu size={10} /> REPAIR BOTS
          </span>
        </motion.button>

        {/* Consumable - Shield core */}
        <motion.button
          whileHover={combatState.playerTurn && !combatState.qteRunning ? { scale: 1.02 } : {}}
          whileTap={combatState.playerTurn && !combatState.qteRunning ? { scale: 0.98 } : {}}
          onClick={() => {
            if (combatState.playerTurn && !combatState.qteRunning) {
              AudioEngine.playUIConfirm();
              onUseShieldCore();
            }
          }}
          disabled={!combatState.playerTurn || combatState.qteRunning}
          className={`p-2 border rounded text-center transition-colors flex flex-col justify-between items-center h-14 ${
            combatState.playerTurn && !combatState.qteRunning
              ? "border-blue-500 bg-blue-950/10 hover:bg-blue-950/20 cursor-pointer shadow-[0_0_10px_rgba(59,130,246,0.1)]"
              : "border-neutral-800 text-neutral-600 bg-neutral-950/10 cursor-not-allowed"
          }`}
        >
          <span className="text-[9px] font-bold block opacity-60 text-blue-400">CHARGE CORES</span>
          <span className="text-[10px] font-semibold flex items-center gap-1 text-blue-300">
            <Shield size={10} /> SHIELD CORES
          </span>
        </motion.button>

        {/* Tactical flight flee */}
        <motion.button
          whileHover={combatState.playerTurn && !combatState.qteRunning ? { scale: 1.02 } : {}}
          whileTap={combatState.playerTurn && !combatState.qteRunning ? { scale: 0.98 } : {}}
          onClick={() => {
            if (combatState.playerTurn && !combatState.qteRunning) {
              AudioEngine.playBeep(450, 0.05);
              onFlee();
            }
          }}
          disabled={!combatState.playerTurn || combatState.qteRunning}
          className={`p-2 border rounded text-center transition-colors flex flex-col justify-between items-center h-14 ${
            combatState.playerTurn && !combatState.qteRunning
              ? "border-amber-600 bg-amber-950/10 hover:bg-amber-950/20 cursor-pointer shadow-[0_0_10px_rgba(217,119,6,0.1)]"
              : "border-neutral-800 text-neutral-600 bg-neutral-950/10 cursor-not-allowed"
          }`}
        >
          <span className="text-[9px] font-bold block opacity-60 text-amber-500">TACTICAL RETREAT</span>
          <span className="text-[10px] font-semibold flex items-center gap-1 text-amber-400">
            <LogOut size={10} /> EVACUATE WARP
          </span>
        </motion.button>

        {/* Dynamic Helpers Call */}
        {availableHelpers.map((helper) => {
          const canCall = combatState.playerTurn && !combatState.qteRunning;
          return (
            <motion.button
              key={helper.id}
              whileHover={canCall ? { scale: 1.02 } : {}}
              whileTap={canCall ? { scale: 0.98 } : {}}
              onClick={() => {
                if (canCall) {
                  AudioEngine.playBeep(880, 0.25, "sine");
                  onCallHelper?.(helper.id);
                }
              }}
              disabled={!canCall}
              className={`p-2 border rounded text-center transition-colors flex flex-col justify-between items-center h-14 ${
                canCall
                  ? "border-emerald-500 bg-emerald-950/10 hover:bg-emerald-950/20 cursor-pointer animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                  : "border-neutral-800 text-neutral-600 bg-neutral-950/10 cursor-not-allowed"
              }`}
            >
              <span className="text-[9px] font-bold block opacity-60 text-emerald-400">CALL ALLY SUPPORT</span>
              <span className="text-[10px] font-semibold flex items-center gap-1 text-emerald-300 truncate max-w-[110px]">
                <Zap size={10} className="fill-current animate-bounce text-emerald-400" /> {helper.name.split(' ')[0]}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
