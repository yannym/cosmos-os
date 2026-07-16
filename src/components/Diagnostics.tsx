/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Activity, BatteryCharging, ShieldAlert, Cpu, HeartHandshake } from "lucide-react";
import { AudioEngine } from "../audio";

interface DiagnosticsProps {
  hull: number;
  maxHull: number;
  shields: number;
  maxShields: number;
  fuel: number;
  maxFuel: number;
  regenRate: number;
  fuelSavings: number;
  nanobotsQty: number;
  shieldCoresQty: number;
  onUseNanobots: () => void;
  onUseShieldCore: () => void;
  shipClass: string;
}

export const Diagnostics: React.FC<DiagnosticsProps> = ({
  hull,
  maxHull,
  shields,
  maxShields,
  fuel,
  maxFuel,
  regenRate,
  fuelSavings,
  nanobotsQty,
  shieldCoresQty,
  onUseNanobots,
  onUseShieldCore,
  shipClass
}) => {
  const [hoveredBeltItem, setHoveredBeltItem] = useState<"nanobots" | "shields" | null>(null);

  const hullPct = Math.max(0, (hull / maxHull) * 100);
  const shieldPct = Math.max(0, (shields / maxShields) * 100);
  const fuelPct = Math.max(0, (fuel / maxFuel) * 100);

  const handleUseNanobots = () => {
    if (nanobotsQty <= 0 || hull >= maxHull) {
      AudioEngine.playBeep(200, 0.15, "sawtooth");
      return;
    }
    AudioEngine.playBeep(900, 0.2, "sine");
    onUseNanobots();
  };

  const handleUseShieldCore = () => {
    if (shieldCoresQty <= 0 || shields >= maxShields) {
      AudioEngine.playBeep(200, 0.15, "sawtooth");
      return;
    }
    AudioEngine.playBeep(900, 0.2, "sine");
    onUseShieldCore();
  };

  return (
    <section className="bg-black/80 border border-current p-4 rounded relative overflow-hidden font-mono text-xs">
      <h2 className="text-sm font-semibold uppercase tracking-wider border-b border-current pb-2 mb-3 flex justify-between items-center select-none">
        <span className="flex items-center gap-1.5">
          <Activity size={14} className="animate-pulse" /> DIAGNOSTICS
        </span>
        <span id="hud-ship-class" className="text-xs text-right italic font-mono opacity-85">
          {shipClass.toUpperCase()}
        </span>
      </h2>

      <div className="space-y-3 text-sm">
        {/* Hull Integrity Bar */}
        <div title="Current structural integrity (Hull HP)">
          <div className="flex justify-between mb-1 text-[11px] leading-tight select-none">
            <span className="flex items-center gap-1 text-red-500">HULL INTEGRITY</span>
            <span id="hud-hull-text" className="font-mono">
              {typeof hull === 'number' ? Number(hull.toFixed(1)) : hull} / {maxHull}
            </span>
          </div>
          <div className="w-full bg-neutral-900 border border-current rounded h-3 overflow-hidden shadow-inner">
            <div
              id="hud-hull-bar"
              className="bg-current h-full transition-all duration-300"
              style={{
                width: `${hullPct}%`,
                backgroundColor: hullPct < 30 ? "#ef4444" : "currentColor"
              }}
            />
          </div>
        </div>

        {/* Defensive Shields Bar */}
        <div title={`Recharge Rate: +${regenRate.toFixed(1)}/s`}>
          <div className="flex justify-between mb-1 text-[11px] leading-tight select-none">
            <span className="flex items-center gap-1 text-blue-400">DEFENSIVE SHIELDS</span>
            <span id="hud-shield-text" className="font-mono">
              {typeof shields === 'number' ? Number(shields.toFixed(1)) : shields} / {maxShields}
            </span>
          </div>
          <div className="w-full bg-neutral-900 border border-current rounded h-3 overflow-hidden shadow-inner">
            <div
              id="hud-shield-bar"
              className="bg-current h-full transition-all duration-300"
              style={{
                width: `${shieldPct}%`,
                backgroundColor: shieldPct < 30 ? "#eab308" : "currentColor"
              }}
            />
          </div>
        </div>

        {/* Warp Core Fuel Bar */}
        <div title={`Fuel Savings: ${fuelSavings.toFixed(1)}%`}>
          <div className="flex justify-between mb-1 text-[11px] leading-tight select-none">
            <span className="flex items-center gap-1 text-cyan-400">WARP CORE FUEL</span>
            <span id="hud-fuel-text" className="font-mono">
              {fuel.toFixed(1)} / {maxFuel}
            </span>
          </div>
          <div className="w-full bg-neutral-900 border border-current rounded h-3 overflow-hidden shadow-inner">
            <div
              id="hud-fuel-bar"
              className="bg-current h-full transition-all duration-300"
              style={{
                width: `${fuelPct}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Consumables Quick Belt */}
      <div className="mt-4 pt-3 border-t border-dashed border-current/30 grid grid-cols-2 gap-2 relative">
        <button
          onClick={handleUseNanobots}
          disabled={nanobotsQty <= 0 || hull >= maxHull}
          onMouseEnter={() => setHoveredBeltItem("nanobots")}
          onMouseLeave={() => setHoveredBeltItem(null)}
          id="belt-nanobots"
          className={`p-2 border rounded text-center flex flex-col items-center justify-center transition cursor-pointer ${
            nanobotsQty > 0 && hull < maxHull
              ? "border-current bg-current/5 hover:bg-current/15"
              : "border-neutral-800 text-neutral-600 bg-black/40 cursor-not-allowed"
          }`}
        >
          <span className="font-bold flex items-center gap-1">
            <Cpu size={12} /> REPAIR BOTS
          </span>
          <span id="hud-nanobots-qty" className="text-[9px] opacity-80 mt-0.5">
            QTY: {nanobotsQty}
          </span>
        </button>

        <button
          onClick={handleUseShieldCore}
          disabled={shieldCoresQty <= 0 || shields >= maxShields}
          onMouseEnter={() => setHoveredBeltItem("shields")}
          onMouseLeave={() => setHoveredBeltItem(null)}
          id="belt-shield-cores"
          className={`p-2 border rounded text-center flex flex-col items-center justify-center transition cursor-pointer ${
            shieldCoresQty > 0 && shields < maxShields
              ? "border-current bg-current/5 hover:bg-current/15"
              : "border-neutral-800 text-neutral-600 bg-black/40 cursor-not-allowed"
          }`}
        >
          <span className="font-bold flex items-center gap-1">
            <BatteryCharging size={12} /> SHIELD CORES
          </span>
          <span id="hud-shieldcores-qty" className="text-[9px] opacity-80 mt-0.5">
            QTY: {shieldCoresQty}
          </span>
        </button>

        {/* Hover overlay descriptive popup */}
        {hoveredBeltItem && (
          <div className="absolute left-0 right-0 -top-24 bg-black border border-current p-2.5 rounded shadow-2xl z-20 animate-fade-in leading-relaxed text-[10px]">
            {hoveredBeltItem === "nanobots" ? (
              <>
                <strong className="text-cyan-400 font-bold uppercase block pb-0.5 border-b border-current/10">Nanobot Injector Kit</strong>
                Active micro-bots patch alloy gashes, restoring <strong className="text-white">25 Hull Points</strong> immediately. Works during dogfights.
              </>
            ) : (
              <>
                <strong className="text-blue-400 font-bold uppercase block pb-0.5 border-b border-current/10">Shield Capacitor Core</strong>
                Supercharges spatial deflector fields, regenerating <strong className="text-white">35 Shield Points</strong> instantly under tactical pressure.
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
