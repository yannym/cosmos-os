/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CargoSlot } from "../types";
import { ITEM_TEMPLATES, BLUEPRINTS } from "../constants";
import { ArrowDownAZ, Box, Boxes, Sparkles, AlertTriangle, Trash2, Zap, Cpu } from "lucide-react";
import { AudioEngine } from "../audio";

interface CargoHoldProps {
  cargo: CargoSlot[];
  onRecycleScrap: () => void;
  onCraftWarpFuel?: () => void;
  onSortCargo: () => void;
  maxCargoCap: number;
  themeColor: "green" | "amber" | "cyan";
  onEjectCargo?: (index: number, qty: number) => void;
  onDeployBeacon?: () => void;

  // New Crafting Props
  ownedBlueprints: string[];
  activeCraftingBpId: string | null;
  autoCraftingBpId: string | null;
  craftingTimeLeft: number;
  isAutoCrafting: boolean;
  onStartCrafting: (bpId: string) => void;
  onCancelCrafting: () => void;
  onStartAutoCrafting: (bpId: string) => void;
  onStopAutoCrafting: () => void;
  fuel: number;
}

export const CargoHold: React.FC<CargoHoldProps> = ({
  cargo,
  onRecycleScrap,
  onCraftWarpFuel,
  onSortCargo,
  maxCargoCap,
  themeColor,
  onEjectCargo,
  onDeployBeacon,

  // Crafting props
  ownedBlueprints,
  activeCraftingBpId,
  autoCraftingBpId,
  craftingTimeLeft,
  isAutoCrafting,
  onStartCrafting,
  onCancelCrafting,
  onStartAutoCrafting,
  onStopAutoCrafting,
  fuel
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"inventory" | "blueprints">("inventory");
  const [hoveredSlotIndex, setHoveredSlotIndex] = useState<number | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(ownedBlueprints[0] || null);

  const getRarityStyleClass = (rarity: string) => {
    switch (rarity) {
      case "common": return "text-emerald-400";
      case "uncommon": return "text-yellow-500";
      case "rare": return "text-red-400";
      case "ultra_rare": return "text-fuchsia-500 animate-pulse font-bold";
      case "one_of_a_kind": return "text-purple-400 font-bold animate-pulse";
      default: return "text-neutral-400";
    }
  };

  const scrapCount = cargo.reduce((sum, s) => (s.type === "scrap" ? sum + s.qty : sum), 0);
  const astraeaCount = cargo.reduce((sum, s) => (s.type === "ore_astraea" ? sum + s.qty : sum), 0);
  const pyriteCount = cargo.reduce((sum, s) => (s.type === "ore_pyrite" ? sum + s.qty : sum), 0);

  // Compute total cargo value
  const totalValue = cargo.reduce((sum, s) => {
    const template = ITEM_TEMPLATES[s.type];
    return sum + (template ? template.value * s.qty : 0);
  }, 0);

  const themeTextClass =
    themeColor === "green"
      ? "text-green-400"
      : themeColor === "amber"
      ? "text-amber-500"
      : "text-cyan-400";

  const themeBorderClass =
    themeColor === "green"
      ? "border-green-800"
      : themeColor === "amber"
      ? "border-amber-800"
      : "border-cyan-800";

  const themeBgClass =
    themeColor === "green"
      ? "bg-green-950/20"
      : themeColor === "amber"
      ? "bg-amber-950/20"
      : "bg-cyan-950/20";

  const ownedTemplates = BLUEPRINTS.filter(bp => ownedBlueprints.includes(bp.id));

  return (
    <div id="viewport-grid-cargo" className="fade-panel flex-grow flex flex-col justify-between font-mono p-1">
      <div>
        {/* Dual Tab Headers */}
        <div className="flex border-b border-current/20 mb-4 gap-1.5">
          <button
            onClick={() => {
              setActiveSubTab("inventory");
              AudioEngine.playBeep(450, 0.05);
            }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-t border-x rounded-t transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "inventory"
                ? "border-current bg-current/10 " + themeTextClass
                : "border-transparent text-neutral-500 hover:text-white"
            }`}
          >
            <Boxes size={14} /> Cargo Inventory
          </button>
          <button
            onClick={() => {
              setActiveSubTab("blueprints");
              if (ownedBlueprints.length > 0 && !selectedBlueprintId) {
                setSelectedBlueprintId(ownedBlueprints[0]);
              }
              AudioEngine.playBeep(450, 0.05);
            }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-t border-x rounded-t transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "blueprints"
                ? "border-current bg-current/10 " + themeTextClass
                : "border-transparent text-neutral-500 hover:text-white"
            }`}
          >
            <Cpu size={14} /> Blueprints Archive ({ownedBlueprints.length})
          </button>
        </div>

        {activeSubTab === "inventory" ? (
          <>
            {/* Nanotech Recycler Array */}
            <div className="mb-4 p-3 border border-current/30 rounded bg-black/40 text-xs flex flex-col sm:flex-row justify-between items-center gap-3 shadow-md">
              <div className="space-y-1">
                <span className="font-bold text-yellow-500 flex items-center">
                  <Sparkles size={14} className="mr-1 inline text-yellow-500" /> NANOTECH RECYCLER DECK
                </span>
                <p className="text-[10px] opacity-75">
                  Consumes <strong className="text-emerald-400">2x Alloy Hull Scrap (S)</strong> to process and synthesize 1x packet of high-explosive heavy torpedo warheads.
                </p>
              </div>
              <button
                onClick={() => {
                  AudioEngine.playBeep(450, 0.05);
                  onRecycleScrap();
                }}
                disabled={scrapCount < 2}
                title={scrapCount >= 2 ? "Recycle 2x Alloy Hull Scrap into torpedoes" : "Requires 2x Alloy Hull Scrap"}
                className={`px-4 py-2 border font-bold rounded transition text-xs flex items-center gap-1.5 ${
                  scrapCount >= 2
                    ? "border-current bg-current/10 hover:bg-current hover:text-black cursor-pointer"
                    : "border-neutral-700 text-neutral-600 bg-neutral-950/10 cursor-not-allowed"
                }`}
              >
                RECYCLE SCRAP [{scrapCount}/2]
              </button>
            </div>

            {/* Warp Fuel Synthesis Matrix */}
            <div className="mb-4 p-3 border border-current/30 rounded bg-black/40 text-xs flex flex-col sm:flex-row justify-between items-center gap-3 shadow-md">
              <div className="space-y-1">
                <span className="font-bold text-cyan-400 flex items-center">
                  <Sparkles size={14} className="mr-1 inline text-cyan-400 animate-pulse" /> WARP FUEL SYNTHESIS MATRIX
                </span>
                <p className="text-[10px] opacity-75">
                  Fuses <strong className="text-cyan-400">1x Astraea Crystal (★)</strong> and <strong className="text-amber-400">1x Pyrite Prism (◆)</strong> from asteroid mining to synthesize <strong className="text-blue-400">+5.0 Units of Warp Fuel</strong>.
                </p>
              </div>
              <button
                onClick={() => {
                  if (onCraftWarpFuel) {
                    onCraftWarpFuel();
                  }
                }}
                disabled={astraeaCount < 1 || pyriteCount < 1}
                className={`px-4 py-2 border font-bold rounded transition text-xs flex items-center gap-1.5 ${
                  (astraeaCount >= 1 && pyriteCount >= 1)
                    ? "border-current bg-current/10 hover:bg-current hover:text-black cursor-pointer"
                    : "border-neutral-700 text-neutral-600 bg-neutral-950/10 cursor-not-allowed"
                }`}
              >
                SYNTHESIZE FUEL [★:{astraeaCount}/1, ◆:{pyriteCount}/1]
              </button>
            </div>

            {/* Cargo Grid layout & Tooltip Details split view */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Visual slots */}
              <div className="md:col-span-8">
                <div
                  id="cargo-grid-container"
                  className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 p-2.5 border border-current/20 bg-black/60 rounded"
                >
                  {Array.from({ length: maxCargoCap }).map((_, i) => {
                    const slot = cargo[i];
                    const template = slot ? ITEM_TEMPLATES[slot.type] : null;
                    const isSelected = selectedSlotIndex === i;

                    if (template) {
                      const rarityClass = getRarityStyleClass(template.rarity);
                      return (
                        <div
                          key={i}
                          id={`cargo-slot-${i}`}
                          onMouseEnter={() => setHoveredSlotIndex(i)}
                          onMouseLeave={() => setHoveredSlotIndex(null)}
                          onClick={() => {
                            setSelectedSlotIndex(selectedSlotIndex === i ? null : i);
                            AudioEngine.playBeep(selectedSlotIndex === i ? 250 : 350, 0.05, "sine");
                          }}
                          className={`aspect-square border rounded flex flex-col items-center justify-center font-mono relative cursor-pointer hover:bg-current/10 transition select-none ${
                            isSelected 
                              ? "border-yellow-400 bg-yellow-500/15 ring-2 ring-yellow-400/50 shadow-[0_0_8px_rgba(234,179,8,0.2)]" 
                              : "border-current/30 bg-neutral-900/60"
                          }`}
                        >
                          <span className={`${rarityClass} font-bold text-xl`}>{template.char}</span>
                          <span className="text-[9px] font-semibold mt-1 opacity-95 text-white/90 bg-black/40 px-1 rounded">
                            x{slot.qty}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={i}
                        onClick={() => {
                          setSelectedSlotIndex(null);
                          AudioEngine.playBeep(200, 0.05, "sawtooth");
                        }}
                        className="aspect-square border border-dashed border-neutral-800 rounded flex items-center justify-center font-mono text-neutral-800 bg-black/20 select-none text-[9px] cursor-default"
                      >
                        EMPTY
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Slot Detail Reader card */}
              <div className="md:col-span-4 border border-current/20 rounded p-3 bg-black/40 flex flex-col justify-between shadow-md">
                <div>
                  <div className="text-[10px] uppercase font-bold opacity-60 border-b border-current/10 pb-1 mb-2">
                    Cargo Item Scanner
                  </div>
                  {(() => {
                    const activeIndex = hoveredSlotIndex !== null ? hoveredSlotIndex : selectedSlotIndex;
                    if (activeIndex !== null && cargo[activeIndex]) {
                      const item = cargo[activeIndex];
                      const template = ITEM_TEMPLATES[item.type];
                      if (!template) return null;
                      const rarityStyle = getRarityStyleClass(template.rarity);

                      const handleEject = (qty: number) => {
                        if (onEjectCargo) {
                          onEjectCargo(activeIndex, qty);
                          if (qty >= item.qty) {
                            setSelectedSlotIndex(null);
                            setHoveredSlotIndex(null);
                          }
                        }
                      };

                      return (
                        <div className="space-y-2 animate-fade-in">
                          <div className="font-bold text-white text-sm">{template.name}</div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] uppercase font-bold opacity-60">Rarity:</span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${rarityStyle}`}>
                              {template.rarity.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-[10px] text-current/80 italic leading-snug">{template.desc}</p>
                          <div className="border-t border-dashed border-current/10 pt-2 text-[10px] text-yellow-500">
                            Market standard pricing: <strong className="text-white">{template.value} CR</strong> each
                          </div>

                          {item.type === "beacon" && onDeployBeacon && (
                            <div className="mt-3 pt-3 border-t border-dashed border-current/10">
                              <button
                                onClick={() => {
                                  onDeployBeacon();
                                  setSelectedSlotIndex(null);
                                  setHoveredSlotIndex(null);
                                }}
                                className="w-full py-2 bg-emerald-950/40 border-2 border-emerald-500 hover:bg-emerald-500 hover:text-black text-emerald-400 rounded text-[10px] font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                              >
                                <Zap size={11} /> Deploy Nav-Beacon
                              </button>
                            </div>
                          )}

                          {onEjectCargo && (
                            <div className="mt-3 pt-3 border-t border-dashed border-current/10 space-y-2">
                              <div className="text-[9px] uppercase font-bold text-red-400 flex items-center gap-1">
                                <AlertTriangle size={11} className="animate-pulse" /> Eject / Airlock Vent
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEject(1)}
                                  className="flex-1 py-1 border border-red-500/50 hover:bg-red-500/20 text-red-400 hover:text-white rounded text-[9px] font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Trash2 size={10} /> Eject 1
                                </button>
                                <button
                                  onClick={() => handleEject(item.qty)}
                                  className="flex-1 py-1 bg-red-950/20 border border-red-500 hover:bg-red-600 text-red-400 hover:text-white rounded text-[9px] font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Zap size={10} /> Eject All
                                </button>
                              </div>
                              <p className="text-[8px] opacity-60 leading-tight">
                                Warning: venting materials into deep vacuum is permanent.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }

                        return (
                          <div className="text-center py-6 italic opacity-55 text-[10px] leading-snug">
                            Hover or click a cargo item inside slots to scan blueprint spec details and manage airlock venting operations.
                          </div>
                        );
                      })()}
                    </div>

                    <div className="border-t border-dashed border-current/20 pt-2.5 mt-2">
                      <span className="font-bold opacity-60 text-[9px]">TOTAL ESTIMATED CARGO VOLUME VALUE:</span>
                      <div className="font-mono text-sm font-bold text-yellow-500 mt-0.5">{totalValue.toLocaleString()} CREDITS</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* BLUEPRINTS ARCHIVE SUB-TAB VIEW */
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Blueprints selection list */}
                <div className="md:col-span-8 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {ownedTemplates.length === 0 ? (
                    <div className="text-center p-8 border border-dashed border-neutral-800 rounded bg-black/20 text-neutral-500 text-xs">
                      📭 Archive empty. Sync new schematics from Station Cantinas or scavenge starship derelicts.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ownedTemplates.map((bp) => {
                        const isSelected = selectedBlueprintId === bp.id;
                        return (
                          <button
                            key={bp.id}
                            onClick={() => {
                              setSelectedBlueprintId(bp.id);
                              AudioEngine.playBeep(400, 0.05);
                            }}
                            className={`p-3 border text-left rounded transition flex flex-col justify-between h-[100px] cursor-pointer ${
                              isSelected
                                ? "border-cyan-400 bg-cyan-950/20 text-cyan-300"
                                : "border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-white"
                            }`}
                          >
                            <div className="space-y-0.5 w-full">
                              <div className="text-[11px] font-bold uppercase tracking-wider line-clamp-1">{bp.name}</div>
                              <div className="text-[9px] opacity-70 leading-snug line-clamp-2">{bp.description}</div>
                            </div>
                            <span className="text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded border border-current/10 bg-black/50 text-neutral-500 self-end">
                              {bp.resultType}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Blueprint requirements sidebar details */}
                <div className="md:col-span-4 border border-current/20 rounded p-3 bg-black/40 flex flex-col justify-between shadow-md">
                  <div>
                    <div className="text-[10px] uppercase font-bold opacity-60 border-b border-current/10 pb-1 mb-2">
                      Synthesis Spec Decrypter
                    </div>

                    {(() => {
                      const bp = BLUEPRINTS.find(b => b.id === selectedBlueprintId);
                      if (!bp) {
                        return (
                          <div className="text-center py-8 italic opacity-55 text-[10px] leading-snug">
                            Select an unlocked blueprint template to load its assembly specification matrix.
                          </div>
                        );
                      }

                      const materialsStatus = bp.materials.map(mat => {
                        const possessingQty = cargo.reduce((sum, s) => (s.type === mat.type ? sum + s.qty : sum), 0);
                        const hasEnough = possessingQty >= mat.qty;
                        return {
                          type: mat.type,
                          name: ITEM_TEMPLATES[mat.type]?.name || mat.type,
                          char: ITEM_TEMPLATES[mat.type]?.char || "📦",
                          req: mat.qty,
                          owned: possessingQty,
                          hasEnough
                        };
                      });

                      const hasMaterials = materialsStatus.every(m => m.hasEnough);
                      const hasFuel = fuel >= bp.fuelCost;
                      const canCraft = hasMaterials && hasFuel;

                      const isCraftingThis = activeCraftingBpId === bp.id;
                      const isCraftingSomething = activeCraftingBpId !== null;
                      const isAutoCraftingThis = isAutoCrafting && autoCraftingBpId === bp.id;

                      return (
                        <div className="space-y-3 animate-fade-in">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-white uppercase">{bp.name}</h4>
                            <p className="text-[10px] text-neutral-400 leading-relaxed italic">{bp.description}</p>
                          </div>

                          <div className="border-t border-dashed border-current/10 pt-2 space-y-2">
                            <div className="text-[9px] uppercase font-bold text-neutral-500">Material Requirements</div>
                            <div className="space-y-1.5">
                              {materialsStatus.map(m => (
                                <div key={m.type} className="flex justify-between items-center text-[10px]">
                                  <span className="flex items-center gap-1.5 text-neutral-300">
                                    <span className="text-xs">{m.char}</span>
                                    <span>{m.name}</span>
                                  </span>
                                  <span className={`font-bold ${m.hasEnough ? "text-emerald-400" : "text-red-500"}`}>
                                    {m.owned} / {m.req}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-dashed border-current/10 pt-2 space-y-1 text-[10px]">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-400">FTL Fuel Core Cost:</span>
                              <span className={`font-bold ${hasFuel ? "text-emerald-400" : "text-red-500"}`}>
                                {bp.fuelCost} Units
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-400">Heat Core Load:</span>
                              <span className="text-red-400 font-bold">+{bp.heatGenerated}% Thermals</span>
                            </div>
                          </div>

                          {/* Interactive Synthesizer Actions */}
                          <div className="border-t border-dashed border-current/10 pt-3">
                            {isCraftingThis ? (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-[9px] font-bold text-cyan-400 animate-pulse">
                                  <span>SYNTHESIZING MATRIX...</span>
                                  <span>{(craftingTimeLeft / 1000).toFixed(1)}s</span>
                                </div>
                                <div className="w-full bg-neutral-900 border border-cyan-500 rounded h-2.5 overflow-hidden">
                                  <div
                                    className="bg-cyan-500 h-full transition-all duration-100"
                                    style={{ width: `${((4000 - craftingTimeLeft) / 4000) * 100}%` }}
                                  />
                                </div>
                                <button
                                  onClick={onCancelCrafting}
                                  className="w-full py-1.5 bg-red-950/40 border border-red-500 hover:bg-red-600 hover:text-white text-red-400 rounded text-[9px] font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Trash2 size={10} /> ABORT PROCESS
                                </button>
                              </div>
                            ) : isAutoCraftingThis ? (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-[9px] font-bold text-yellow-400 animate-pulse">
                                  <span>AUTO MANUFACTURING ENABLED</span>
                                  <span>LOOP ACTIVE</span>
                                </div>
                                <button
                                  onClick={onStopAutoCrafting}
                                  className="w-full py-1.5 bg-yellow-950/40 border-2 border-yellow-500 hover:bg-yellow-500 hover:text-black text-yellow-400 rounded text-[9px] font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer animate-pulse"
                                >
                                  <Zap size={10} className="animate-spin" /> STOP AUTO-CRAFT
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => onStartCrafting(bp.id)}
                                    disabled={!canCraft || isCraftingSomething || isAutoCrafting}
                                    className={`flex-grow py-2 px-2 border rounded text-[9px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer ${
                                      canCraft && !isCraftingSomething && !isAutoCrafting
                                        ? "bg-cyan-500 hover:bg-cyan-400 text-black border-cyan-400 shadow-md active:scale-[0.98]"
                                        : "bg-neutral-800 text-neutral-500 border-neutral-700 cursor-not-allowed"
                                    }`}
                                  >
                                    <Boxes size={10} /> {isCraftingSomething ? "SYSTEM BUSY" : "CRAFT ITEM"}
                                  </button>
                                  <button
                                    onClick={() => onStartAutoCrafting(bp.id)}
                                    disabled={!canCraft || isCraftingSomething || isAutoCrafting}
                                    className={`py-2 px-3 border rounded text-[9px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer ${
                                      canCraft && !isCraftingSomething && !isAutoCrafting
                                        ? "bg-yellow-500 hover:bg-yellow-400 text-black border-yellow-400 shadow-md active:scale-[0.98]"
                                        : "bg-neutral-800 text-neutral-500 border-neutral-700 cursor-not-allowed"
                                    }`}
                                  >
                                    <Zap size={10} /> AUTO-CRAFT
                                  </button>
                                </div>
                                {!hasMaterials && (
                                  <p className="text-[8px] text-red-400/80 leading-snug text-center">
                                    ⚠️ Missing required chemical reagents or alloys in storage.
                                  </p>
                                )}
                                {hasMaterials && !hasFuel && (
                                  <p className="text-[8px] text-red-400/80 leading-snug text-center">
                                    ⚠️ Warp core fuel charge depleted.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="border-t border-dashed border-current/20 pt-2 mt-4 text-[8px] opacity-50 uppercase tracking-wide leading-normal">
                    Molecular synthesizer generates 4.0s of engine heat stress per assembly routine. Auto-crafting operates continuously until depleted.
                  </div>
                </div>
              </div>
            )}
          </div>

      {activeSubTab === "inventory" && (
        <div className="mt-4 pt-3 border-t border-dashed border-current/40 text-xs flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center text-current/70 text-[10px]">
            <AlertTriangle size={12} className="mr-1.5 inline text-amber-500" /> Selling operations unlocked directly under Spaceport Market tabs.
          </div>
          <button
            onClick={() => {
              AudioEngine.playBeep(300, 0.1, "triangle");
              onSortCargo();
            }}
            title="Automatically sort and organize cargo items"
            className="px-4 py-1.5 border border-current bg-current/5 hover:bg-current/15 rounded text-xs transition flex items-center gap-1 cursor-pointer"
          >
            <ArrowDownAZ size={13} /> DEFRAGMENT BAY FILING
          </button>
        </div>
      )}
    </div>
  );
};
