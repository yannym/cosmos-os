/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { WEAPON_ITEMS, COMPONENT_ITEMS, SHIPS_BLUEPRINTS } from "../constants";
import { WeaponItem, ComponentItem } from "../types";
import { Bolt, Cpu, Flame, Infinity as InfinityIcon, MessageSquare, Rocket, RotateCcw, Shield, Sparkles, Wrench, Zap, Radar, Database, Package, Pickaxe, Thermometer } from "lucide-react";
import { AudioEngine } from "../audio";

interface EquipmentDeckProps {
  equippedWeapons: (string | null)[];
  inventoryWeapons: string[];
  fittedComponents: Record<string, string>;
  ownedComponents: string[];
  activeShipId: string;
  onMountWeapon: (slotIndex: number, weaponId: string) => void;
  onDismountWeapon: (slotIndex: number) => void;
  onEquipComponent: (category: string, compId: string) => void;
  onDismountComponent: (category: string) => void;
  onClose: () => void;
  themeColor: "green" | "amber" | "cyan";
  onRepairAll: () => void;
  onEjectHeatCore: () => void;
  isDocked: boolean;
}

export const EquipmentDeck: React.FC<EquipmentDeckProps> = ({
  equippedWeapons,
  inventoryWeapons,
  fittedComponents,
  ownedComponents,
  activeShipId,
  onMountWeapon,
  onDismountWeapon,
  onEquipComponent,
  onDismountComponent,
  onClose,
  themeColor,
  onRepairAll,
  onEjectHeatCore,
  isDocked
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"weapons" | "components">("weapons");
  const [selectedInventoryWeaponIndex, setSelectedInventoryWeaponIndex] = useState<number | null>(null);
  const [selectedInventoryComponentIndex, setSelectedInventoryComponentIndex] = useState<number | null>(null);

  const shipBlueprint = SHIPS_BLUEPRINTS[activeShipId] || SHIPS_BLUEPRINTS.interceptor;

  const getRarityStyleClass = (rarity: string) => {
    switch (rarity) {
      case "common": return "text-emerald-400";
      case "uncommon": return "text-yellow-500";
      case "rare": return "text-red-500 font-medium";
      case "ultra_rare": return "text-fuchsia-500 font-semibold animate-pulse";
      case "one_of_a_kind": return "text-purple-400 font-bold animate-pulse";
      default: return "text-neutral-400";
    }
  };

  const getWeaponIcon = (iconName: string) => {
    switch (iconName) {
      case "rocket": return <Rocket size={14} className="inline mr-1 text-orange-500" />;
      case "zap": return <Zap size={14} className="inline mr-1 text-yellow-500 animate-pulse" />;
      case "flame": return <Flame size={14} className="inline mr-1 text-red-500" />;
      case "crosshair": return <Bolt size={14} className="inline mr-1 text-cyan-400" />;
      case "sparkles": return <Sparkles size={14} className="inline mr-1 text-fuchsia-400 animate-spin" />;
      case "message-square": return <MessageSquare size={14} className="inline mr-1 text-green-400" />;
      case "rotate-ccw": return <RotateCcw size={14} className="inline mr-1 text-amber-500" />;
      case "infinity": return <InfinityIcon size={14} className="inline mr-1 text-purple-400" />;
      default: return <Bolt size={14} className="inline mr-1 text-green-400" />;
    }
  };

  // Generate ASCII art dynamically based on hardpoints
  const getShipASCIIArt = () => {
    if (shipBlueprint.hardpoints === 1) {
      return `
       /\\
      /  \\
     /____\\
    [__H1__]
      `;
    }
    if (shipBlueprint.hardpoints === 2) {
      return `
       |\\
       | \\
     _/_  \\__
    [__H1__] \\_
       |    |  \\___
    [__H2__]_______]
      `;
    }
    if (shipBlueprint.hardpoints === 3) {
      return `
        /\\
       /  \\
      /____\\
     [__H1__]
    /_      _\\
   [_H2_] [_H3_]
      `;
    }
    return `
        /\\
      _/  \\_
     [__H1__]
    /   H2   \\
   [_H3_][_H4_]
    `;
  };

  const handleWeaponSelect = (index: number) => {
    AudioEngine.playBeep(450, 0.05);
    setSelectedInventoryWeaponIndex(index);
  };

  const handleComponentSelect = (index: number) => {
    AudioEngine.playBeep(450, 0.05);
    setSelectedInventoryComponentIndex(index);
  };

  const handleMountWeaponClick = (slotIndex: number) => {
    if (selectedInventoryWeaponIndex === null) return;
    const weaponId = inventoryWeapons[selectedInventoryWeaponIndex];
    onMountWeapon(slotIndex, weaponId);
    setSelectedInventoryWeaponIndex(null);
  };

  const handleDismountWeaponClick = (slotIndex: number) => {
    onDismountWeapon(slotIndex);
  };

  const handleEquipComponentClick = (category: string, compId: string) => {
    onEquipComponent(category, compId);
    setSelectedInventoryComponentIndex(null);
  };

  const handleDismountComponentClick = (category: string) => {
    onDismountComponent(category);
  };

  const themeTextClass =
    themeColor === "green"
      ? "text-green-400"
      : themeColor === "amber"
      ? "text-amber-500"
      : "text-cyan-400";

  return (
    <div id="viewport-weapon-fitting" className="fade-panel flex-grow flex flex-col font-mono p-1">
      <h3 className="text-sm font-semibold uppercase tracking-wider border-b border-current pb-2 mb-4 flex justify-between items-center">
        <span className="flex items-center">
          <Wrench size={16} className="mr-1.5" /> STARSHIP DRYDOCK EQUIPMENT & SYSTEM BAY
        </span>
        <span className="text-xs text-yellow-500">CLICK HARDWARE STORAGE THEN ASSIGN TO MOUNT</span>
      </h3>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-4">
        <button
          id="fit-subtab-weapons"
          onClick={() => {
            AudioEngine.playBeep(450, 0.05);
            setActiveSubTab("weapons");
          }}
          className={`px-4 py-2 border text-xs rounded transition uppercase font-semibold flex items-center ${
            activeSubTab === "weapons" ? "border-current bg-current text-black" : "border-current/40 hover:bg-current/10"
          }`}
        >
          <Bolt size={13} className="mr-1" /> Weapons Drydock
        </button>
        <button
          id="fit-subtab-components"
          onClick={() => {
            AudioEngine.playBeep(450, 0.05);
            setActiveSubTab("components");
          }}
          className={`px-4 py-2 border text-xs rounded transition uppercase font-semibold flex items-center ${
            activeSubTab === "components" ? "border-current bg-current text-black" : "border-current/40 hover:bg-current/10"
          }`}
        >
          <Cpu size={13} className="mr-1" /> Module Upgrades
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-grow">
        {/* Left column: Inventory details */}
        <div className="md:col-span-5 flex flex-col space-y-2">
          <span className="text-xs font-semibold uppercase opacity-75 border-b border-current/20 pb-1">
            {activeSubTab === "weapons" ? "🚀 Storage Armory" : "📦 Storage Cargo Modules"}
          </span>

          <div className="flex-grow border border-current/20 bg-black/40 rounded p-2 overflow-y-auto space-y-2 max-h-[220px] md:max-h-[300px]">
            {activeSubTab === "weapons" ? (
              inventoryWeapons.length > 0 ? (
                inventoryWeapons.map((weaponId, index) => {
                  const weapon = WEAPON_ITEMS[weaponId];
                  if (!weapon) return null;
                  const isSelected = selectedInventoryWeaponIndex === index;

                  return (
                    <div
                      key={`${weaponId}-${index}`}
                      id={`fitting-wep-item-${index}`}
                      onClick={() => handleWeaponSelect(index)}
                      className={`p-2.5 border text-xs rounded transition cursor-pointer flex flex-col justify-between bg-black/60 ${
                        isSelected
                          ? "border-yellow-400 text-yellow-400 bg-yellow-500/10 shadow-[0_0_5px_rgba(234,179,8,0.2)]"
                          : "border-current/30 hover:bg-current/5"
                      }`}
                    >
                      <div className="flex justify-between font-bold">
                        <span className={getRarityStyleClass(weapon.rarity)}>
                          {getWeaponIcon(weapon.icon)}
                          {weapon.name}
                        </span>
                        <span className="opacity-80 text-[10px] capitalize">
                          {weapon.type.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-[10px] text-current/80 mt-1 leading-normal italic">
                        {weapon.desc} (Dmg: {weapon.damage})
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs italic opacity-50">
                  No unequipped weapons found in cargo slots. Trade at spaceports to buy weapon frames.
                </div>
              )
            ) : (
              ownedComponents.length > 0 ? (
                ownedComponents.map((compId, index) => {
                  const comp = COMPONENT_ITEMS[compId];
                  if (!comp) return null;
                  const isSelected = selectedInventoryComponentIndex === index;

                  return (
                    <div
                      key={`${compId}-${index}`}
                      id={`fitting-comp-item-${index}`}
                      onClick={() => handleComponentSelect(index)}
                      className={`p-2.5 border text-xs rounded transition cursor-pointer flex flex-col justify-between bg-black/60 ${
                        isSelected
                          ? "border-yellow-400 text-yellow-400 bg-yellow-500/10 shadow-[0_0_5px_rgba(234,179,8,0.2)]"
                          : "border-current/30 hover:bg-current/5"
                      }`}
                    >
                      <div className="flex justify-between font-bold">
                        <span className={getRarityStyleClass(comp.rarity)}>[ {comp.name} ]</span>
                        <span className="opacity-80 text-[10px] uppercase text-cyan-400">{comp.category}</span>
                      </div>
                      <p className="text-[10px] text-current/80 mt-1 leading-normal italic">{comp.desc}</p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs italic opacity-50">
                  No spare module components in cargo slots. Visit high-tech Spaceports to purchase upgrades.
                </div>
              )
            )}
          </div>
        </div>

        {/* Right column: Fit-deck layout maps */}
        <div className="md:col-span-7 flex flex-col justify-center items-center border border-current/20 bg-black/50 rounded p-4 relative min-h-[260px] shadow-lg">
          <div className="absolute top-2 left-2 text-[10px] tracking-wider opacity-60 font-mono">
            DRYDOCK INTEGRATION DIAGRAM
          </div>

          {activeSubTab === "weapons" ? (
            <div className="w-full flex flex-col items-center justify-between flex-grow">
              {/* ASCII schematic */}
              <pre className="text-xs text-center font-mono leading-none my-4 text-emerald-500 font-bold whitespace-pre">
                {getShipASCIIArt()}
              </pre>

              {/* Hardpoint slots */}
              <div id="fitting-hardpoint-rack" className="w-full grid grid-cols-2 gap-2 mt-auto">
                {Array.from({ length: shipBlueprint.hardpoints }).map((_, slotIndex) => {
                  const eqWepId = equippedWeapons[slotIndex];
                  const eqWep = eqWepId ? WEAPON_ITEMS[eqWepId] : null;

                  if (eqWep) {
                    return (
                      <button
                        key={slotIndex}
                        id={`hardpoint-slot-${slotIndex}`}
                        onClick={() => {
                          AudioEngine.playBeep(400, 0.1, "triangle");
                          handleDismountWeaponClick(slotIndex);
                        }}
                        className="p-2.5 border border-current hover:bg-red-500/10 hover:border-red-500 rounded text-center text-xs bg-black/40 transition flex flex-col justify-center items-center gap-0.5"
                      >
                        <span className="font-bold text-[9px] opacity-60">HARDPOINT {slotIndex + 1}</span>
                        <span className={`font-bold ${getRarityStyleClass(eqWep.rarity)}`}>
                          {getWeaponIcon(eqWep.icon)}
                          {eqWep.name}
                        </span>
                        <span className="text-[8px] opacity-75 text-red-400">Click to Dismount</span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={slotIndex}
                      id={`hardpoint-slot-${slotIndex}`}
                      onClick={() => {
                        AudioEngine.playBeep(450, 0.05);
                        handleMountWeaponClick(slotIndex);
                      }}
                      disabled={selectedInventoryWeaponIndex === null}
                      className={`p-2.5 border border-dashed rounded text-center text-xs transition flex flex-col justify-center items-center gap-0.5 ${
                        selectedInventoryWeaponIndex !== null
                          ? "border-yellow-400 text-yellow-400 bg-yellow-500/5 hover:bg-yellow-500/10 animate-pulse"
                          : "border-red-500/30 text-red-500/40 cursor-not-allowed"
                      }`}
                    >
                      <span className="font-bold text-[9px]">EMPTY HARDPOINT {slotIndex + 1}</span>
                      <span className="text-[10px]">
                        {selectedInventoryWeaponIndex !== null ? "Mount Selected Weapon" : "No Weapon Selected"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col justify-between flex-grow">
              {/* Schematics matrix */}
              <div className="flex-grow grid grid-cols-7 gap-2 justify-center items-center text-center my-6">
                {["shield", "hull", "engine", "scanner", "cargo", "mining", "heat"].map((cat) => {
                  const fittedId = fittedComponents[cat] || `${cat}_standard`;
                  const comp = COMPONENT_ITEMS[fittedId];
                  const rarityClass = getRarityStyleClass(comp ? comp.rarity : "common");
                  
                  let CatIcon = Shield;
                  if (cat === "engine") CatIcon = Rocket;
                  if (cat === "scanner") CatIcon = Radar;
                  if (cat === "cargo") CatIcon = Package;
                  if (cat === "hull") CatIcon = Database;
                  if (cat === "mining") CatIcon = Pickaxe;
                  if (cat === "heat") CatIcon = Thermometer;

                  return (
                    <div key={cat} className="p-2 border border-current/20 bg-black/60 rounded text-center">
                      <span className="text-[10px] block font-bold uppercase opacity-60">{cat}</span>
                      <CatIcon size={14} className={`mx-auto my-1.5 ${rarityClass}`} />
                      <span className={`text-[9px] block truncate font-semibold ${rarityClass}`}>
                        {comp ? comp.name.replace("Standard ", "").replace(" Gen", "").replace(" Plates", "") : "Stock"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Module Upgrade slots */}
              <div id="fitting-component-rack" className="w-full grid grid-cols-3 md:grid-cols-7 gap-1.5 mt-auto">
                {["shield", "hull", "engine", "scanner", "cargo", "mining", "heat"].map((cat) => {
                  const fittedId = fittedComponents[cat] || `${cat}_standard`;
                  const comp = COMPONENT_ITEMS[fittedId];
                  const isStock = fittedId.endsWith("_standard");

                  // Check if currently selected inventory component matches this category
                  const canEquipSelected =
                    selectedInventoryComponentIndex !== null &&
                    COMPONENT_ITEMS[ownedComponents[selectedInventoryComponentIndex]]?.category === cat;

                  return (
                    <button
                      key={cat}
                      id={`upgrade-category-${cat}`}
                      onClick={() => {
                        if (canEquipSelected && selectedInventoryComponentIndex !== null) {
                          AudioEngine.playBeep(850, 0.15, "sine");
                          handleEquipComponentClick(cat, ownedComponents[selectedInventoryComponentIndex]);
                        } else if (!isStock) {
                          AudioEngine.playBeep(400, 0.1, "triangle");
                          handleDismountComponentClick(cat);
                        }
                      }}
                      className={`p-2 border text-[10px] rounded text-center transition flex flex-col justify-center items-center gap-0.5 ${
                        canEquipSelected
                          ? "border-yellow-400 text-yellow-300 bg-yellow-500/10 animate-pulse font-bold"
                          : isStock
                          ? "border-current/20 opacity-60 bg-black/20 cursor-default"
                          : "border-current hover:bg-red-500/10 hover:border-red-500 hover:text-red-400"
                      }`}
                    >
                      <span className="font-bold text-[8px] uppercase opacity-50">{cat}</span>
                      <span className="font-semibold block truncate max-w-[80px]">
                        {canEquipSelected ? "FUSE SELECTED" : isStock ? "STOCK" : "DISMOUNT"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-dashed border-current/40 text-xs flex justify-between items-center flex-wrap gap-2">
        <span className="opacity-75">Integrated flight-checks report: COMPATIBLE & SECURED.</span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              AudioEngine.playBeep(450, 0.05);
              onEjectHeatCore();
            }}
            disabled={fittedComponents.heat !== "heat_core"}
            className={`px-3 py-2 border rounded font-bold cursor-pointer transition ${
              fittedComponents.heat === "heat_core"
                ? "border-amber-500 text-amber-400 bg-amber-950/20 hover:bg-amber-500 hover:text-black" 
                : "border-neutral-700 text-neutral-600 bg-neutral-950/10 cursor-not-allowed"
            }`}
          >
            [ EJECT HEAT CORE ]
          </button>
          <button
            onClick={() => {
              AudioEngine.playBeep(450, 0.05);
              onRepairAll();
            }}
            disabled={!isDocked}
            className={`px-3 py-2 border rounded font-bold cursor-pointer transition ${
              isDocked 
                ? "border-emerald-500 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-500 hover:text-black" 
                : "border-neutral-700 text-neutral-600 bg-neutral-950/10 cursor-not-allowed"
            }`}
          >
            [ REPAIR ALL ]
          </button>
          <button
            onClick={() => {
              AudioEngine.playBeep(450, 0.05);
              onClose();
            }}
            className="px-5 py-2 border border-current bg-current/10 hover:bg-current hover:text-black font-bold rounded cursor-pointer"
          >
            [ CLOSE FIT MATRIX ]
          </button>
        </div>
      </div>
    </div>
  );
};
