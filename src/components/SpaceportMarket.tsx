/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CargoSlot, GalaxyCell, VoidWaypoint } from "../types";
import { ITEM_TEMPLATES, WEAPON_ITEMS, COMPONENT_ITEMS, FACTIONS } from "../constants";
import { 
  Coins, 
  TrendingUp, 
  ShoppingBag, 
  Fuel, 
  Wrench, 
  ShieldAlert, 
  Sparkles, 
  Package, 
  Terminal, 
  ArrowLeftRight, 
  Shield, 
  Zap, 
  ChevronRight, 
  Info, 
  Lock,
  Percent, Search, X,
  ShieldCheck
} from "lucide-react";
import { AudioEngine } from "../audio";

interface SpaceportMarketProps {
  credits: number;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
  cargo: CargoSlot[];
  addCargoItem: (itemKey: string, qty?: number) => boolean;
  removeCargoItem: (itemKey: string, qty?: number) => boolean;
  maxCargoCap: number;
  fuel: number;
  setFuel: React.Dispatch<React.SetStateAction<number>>;
  maxFuel: number;
  hull: number;
  setHull: React.Dispatch<React.SetStateAction<number>>;
  maxHull: number;
  inventoryWeapons: string[];
  setInventoryWeapons: React.Dispatch<React.SetStateAction<string[]>>;
  ownedComponents: string[];
  setOwnedComponents: React.Dispatch<React.SetStateAction<string[]>>;
  activeSector: GalaxyCell | null;
  addTerminalLog: (msg: string, type?: "success" | "danger" | "info" | "loot" | "warning") => void;
  themeColor: "green" | "amber" | "cyan";
  reputation: Record<string, number>;
  voidWaypoints?: VoidWaypoint[];
  setVoidWaypoints?: React.Dispatch<React.SetStateAction<VoidWaypoint[]>>;
}

export const SpaceportMarket: React.FC<SpaceportMarketProps> = ({
  credits,
  setCredits,
  cargo,
  addCargoItem,
  removeCargoItem,
  maxCargoCap,
  fuel,
  setFuel,
  maxFuel,
  hull,
  setHull,
  maxHull,
  inventoryWeapons,
  setInventoryWeapons,
  ownedComponents,
  setOwnedComponents,
  activeSector,
  addTerminalLog,
  themeColor,
  reputation,
  voidWaypoints = [],
  setVoidWaypoints
}) => {
  const [marketTab, setMarketTab] = useState<"commodities" | "equipment" | "services">("commodities");
  const [commMode, setCommMode] = useState<"buy" | "sell">("buy");
  const [equipMode, setEquipMode] = useState<"weapons" | "components">("weapons");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [tradeQty, setTradeQty] = useState<number>(1);
  const [marketSearchTerm, setMarketSearchTerm] = useState<string>("");

  const themeTextClass =
    themeColor === "green"
      ? "text-green-400"
      : themeColor === "amber"
      ? "text-amber-500"
      : "text-cyan-400";

  const themeBorderClass =
    themeColor === "green"
      ? "border-green-400"
      : themeColor === "amber"
      ? "border-amber-500"
      : "border-cyan-400";

  const themeBgClass =
    themeColor === "green"
      ? "bg-green-400"
      : themeColor === "amber"
      ? "bg-amber-500"
      : "bg-cyan-400";

  // Check if docked at a station
  const station = activeSector?.station;

  if (!station) {
    return (
      <div id="viewport-market-offline" className="fade-panel flex-grow flex flex-col justify-center items-center font-mono p-6 text-center select-none border border-current/25 rounded bg-black/40 shadow-inner min-h-[480px]">
        <div className="max-w-md space-y-6">
          <div className="flex justify-center">
            <ShieldAlert size={50} className="text-red-500 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-base font-bold tracking-widest text-red-500 uppercase">
              [ SUB-SPACE TRADING TRANSCEIVER OFFLINE ]
            </h2>
            <div className="text-xs opacity-80 border-y border-red-500/20 py-4 leading-relaxed">
              Consortium interstellar trade accords require strict drydock synchronization protocol to align commerce ledger balances. 
              Sub-space transmissions are heavily blocked by solar interference and stellar radiation in open deep space coordinates.
            </div>
          </div>
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
            Navigate your starship to any yellow Space Station <strong className={themeTextClass}>[S]</strong> on the Star Grid, deploy anchors, and select "Dock" to open full market channels.
          </p>
        </div>
      </div>
    );
  }

  // Helper: Get price multiplier based on station techLevel (1 to 5)
  // Raw materials are cheaper at high-tech stations because they are synthetic, or expensive because they need them.
  // Actually let's use standard economic supply/demand:
  // High-Tech stations (techLevel 4-5) produce advanced goods cheaply, buy raw ores at a premium.
  // Low-Tech stations (techLevel 1-2) produce ores/scrap cheaply, buy advanced goods/meds at a premium.
  const isRawMaterial = (key: string): boolean => {
    return ["ore", "scrap", "titanium_plates", "heavy_water", "helium_3", "hydroponics_fiber"].includes(key);
  };

  const getPriceMultiplier = (key: string): number => {
    const tech = station.techLevel; // 1 to 5
    if (isRawMaterial(key)) {
      // Tech 1: 0.7x base price. Tech 5: 1.4x base price.
      return 0.7 + (tech - 1) * 0.175;
    } else {
      // High tech luxury / components. Tech 1: 1.4x price. Tech 5: 0.7x price.
      return 1.4 - (tech - 1) * 0.175;
    }
  };

  const getItemPrices = (key: string) => {
    const template = ITEM_TEMPLATES[key];
    if (!template) return { buy: 0, sell: 0 };
    if (station?.isBlackMarket) {
      // Commodities are super cheap at black market
      const buyPrice = Math.max(1, Math.round(template.value * 0.3));
      const sellPrice = Math.max(1, Math.round(template.value * 0.15));
      return { buy: buyPrice, sell: sellPrice };
    }
    let mult = getPriceMultiplier(key);
    if (station?.isSolarStation) {
      mult *= 2.5; // High prices at the solar station!
    }
    const buyPrice = Math.max(1, Math.round(template.value * mult));
    const sellPrice = Math.max(1, Math.round(buyPrice * 0.75)); // standard buy/sell spread
    return { buy: buyPrice, sell: sellPrice };
  };

  // Helper for equipment costs
  const getEquipmentCost = (id: string, type: "weapon" | "component") => {
    const baseCost = type === "weapon" ? WEAPON_ITEMS[id]?.cost : COMPONENT_ITEMS[id]?.cost;
    if (!baseCost) return 0;
    if (station?.isBlackMarket) {
      return Math.round(baseCost * 1.25); // Slightly more expensive at Black Markets
    }
    if (station?.isSolarStation) {
      return Math.round(baseCost * 2.20); // High prices at the solar station!
    }
    return baseCost;
  };

  const getEquipmentRefund = (id: string, type: "weapon" | "component") => {
    const cost = getEquipmentCost(id, type);
    return Math.round(cost * 0.7);
  };

  // Helper for reputation lock checks
  const getReputationLock = (rarity: string) => {
    if (!activeSector || station?.isBlackMarket || activeSector.faction === "neutral") {
      return { isLocked: false, requiredRep: 0, hasSpoofCard: false, playerRep: 0, factionName: "", factionKey: "" };
    }
    
    let requiredRep = 0;
    if (rarity === "rare") requiredRep = 20;
    else if (rarity === "ultra_rare") requiredRep = 40;
    else if (rarity === "one_of_a_kind") requiredRep = 75;
    
    if (requiredRep === 0) {
      return { isLocked: false, requiredRep: 0, hasSpoofCard: false, playerRep: 0, factionName: "", factionKey: "" };
    }
    
    const factionKey = activeSector.faction; // hegemony, syndicate, cult, consortium
    const playerRep = reputation[factionKey] || 0;
    const hasSpoofCard = cargo.some(slot => slot.type === `keycard_${factionKey}`);
    
    const isLocked = playerRep < requiredRep && !hasSpoofCard;
    const factionDetails = FACTIONS[factionKey];
    
    return {
      isLocked,
      requiredRep,
      hasSpoofCard,
      playerRep,
      factionName: factionDetails?.name || factionKey,
      factionKey
    };
  };

  // List of commodities keys we support - only show spoof keycards at Black Markets
  const commodityKeys = Object.keys(ITEM_TEMPLATES).filter((key: string) => {
    const isKeycard = key.startsWith("keycard_");
    if (isKeycard) {
      return station?.isBlackMarket === true;
    }
    if (station?.isSolarStation) {
      return ["fuel", "titanium_plates", "metal", "heavy_water"].includes(key);
    }
    return true;
  });

  // Filter out any templates that are weapons or items that shouldn't be traded normally (if any)
  // We'll show all available ITEM_TEMPLATES as commodities!
  const selectedTemplate = selectedItemId ? ITEM_TEMPLATES[selectedItemId] : null;
  const prices = selectedItemId ? getItemPrices(selectedItemId) : { buy: 0, sell: 0 };

  // Calculate current qty in cargo
  const getQtyInCargo = (key: string): number => {
    return cargo.reduce((sum, slot) => (slot.type === key ? sum + slot.qty : sum), 0);
  };

  // Total space occupied in cargo
  const currentCargoCount = cargo.length;
  const cargoSpaceRemaining = maxCargoCap - currentCargoCount;

  // Handle Commodity buy transaction
  const handleBuyCommodity = () => {
    if (!selectedItemId || !selectedTemplate) return;
    const { buy: buyPrice } = getItemPrices(selectedItemId);
    const totalCost = buyPrice * tradeQty;

    if (credits < totalCost) {
      addTerminalLog("COMMERCE DECLINED: Insufficient credits on account ledger.", "danger");
      AudioEngine.playUIError();
      return;
    }

    // Verify cargo space. We need to check if adding tradeQty will fit.
    // addCargoItem returns false if there's no space.
    // To be perfectly safe, let's clone cargo state or check stack limit.
    const maxStack = selectedTemplate.maxStack || 10;
    
    // Simulate space check
    let simulatedCargoCount = cargo.length;
    let simulatedQty = tradeQty;
    const tempCargo = cargo.map(c => ({ ...c }));

    // Try to fill existing stacks
    for (let i = 0; i < tempCargo.length; i++) {
      if (tempCargo[i].type === selectedItemId && tempCargo[i].qty < maxStack) {
        const space = maxStack - tempCargo[i].qty;
        const toAdd = Math.min(simulatedQty, space);
        tempCargo[i].qty += toAdd;
        simulatedQty -= toAdd;
        if (simulatedQty <= 0) break;
      }
    }

    // Create new slots for remainder
    while (simulatedQty > 0) {
      if (tempCargo.length >= maxCargoCap) {
        addTerminalLog(`COMMERCE DECLINED: Cargo hold is fully saturated. Purchase requires additional cargo slots.`, "danger");
        AudioEngine.playUIError();
        return;
      }
      const toAdd = Math.min(simulatedQty, maxStack);
      tempCargo.push({ type: selectedItemId, qty: toAdd });
      simulatedQty -= toAdd;
    }

    // Execute!
    const success = addCargoItem(selectedItemId, tradeQty);
    if (success) {
      setCredits((cr) => cr - totalCost);
      addTerminalLog(`Purchased ${tradeQty}x ${selectedTemplate.name} for ${totalCost} Credits. Cargo updated.`, "success");
      AudioEngine.playResourcePickup();
      // Reset trade quantity or set selected item to updated
      setTradeQty(1);
    } else {
      addTerminalLog("COMMERCE DECLINED: Failed to transfer materials into starship cargo holds.", "danger");
      AudioEngine.playUIError();
    }
  };

  // Handle Commodity sell transaction
  const handleSellCommodity = () => {
    if (!selectedItemId || !selectedTemplate) return;
    const { sell: sellPrice } = getItemPrices(selectedItemId);
    const ownedQty = getQtyInCargo(selectedItemId);

    if (ownedQty < tradeQty) {
      addTerminalLog("COMMERCE DECLINED: Cargo inventory lacks sufficient units to complete trade.", "danger");
      AudioEngine.playUIError();
      return;
    }

    const ok = removeCargoItem(selectedItemId, tradeQty);
    if (ok) {
      const payout = sellPrice * tradeQty;
      setCredits((cr) => cr + payout);
      addTerminalLog(`Sold ${tradeQty}x ${selectedTemplate.name} to spaceport. Gained +${payout} Credits.`, "loot");
      AudioEngine.playUIConfirm();
      
      const remaining = ownedQty - tradeQty;
      if (remaining <= 0) {
        setSelectedItemId(null);
      }
      setTradeQty(1);
    } else {
      addTerminalLog("COMMERCE DECLINED: Unresolved error disengaging cargo hold lock mechanisms.", "danger");
      AudioEngine.playBeep(220, 0.25, "sawtooth");
    }
  };

  // Equipment buying / selling (weapons and components)
  // Tech items available depends on the station tech level
  const isEquipmentAvailable = (rarity: string) => {
    if (station?.isSolarStation) {
      return rarity === "common" || rarity === "uncommon"; // low inventory at Solar Forge
    }
    if (station?.isBlackMarket) return true; // Black markets carry everything!
    const tech = station.techLevel;
    if (rarity === "common") return true;
    if (rarity === "uncommon") return tech >= 2;
    if (rarity === "rare") return tech >= 3;
    if (rarity === "ultra_rare") return tech >= 4;
    if (rarity === "one_of_a_kind") return tech >= 5;
    return true;
  };

  const handleBuyWeapon = (id: string, cost: number) => {
    if (credits < cost) {
      addTerminalLog("COMMERCE DECLINED: Insufficient ledger credits to purchase weaponry.", "danger");
      AudioEngine.playUIError();
      return;
    }
    setCredits((cr) => cr - cost);
    setInventoryWeapons((prev) => [...prev, id]);
    addTerminalLog(`Purchased ${WEAPON_ITEMS[id]?.name || id} weapon unit! Transferred to drydock inventory.`, "success");
    AudioEngine.playUIConfirm();
  };

  const handleSellWeapon = (indexInInventory: number, id: string, cost: number) => {
    const refund = Math.round(cost * 0.7);
    const nextInv = [...inventoryWeapons];
    nextInv.splice(indexInInventory, 1);
    setInventoryWeapons(nextInv);
    setCredits((cr) => cr + refund);
    addTerminalLog(`Decommissioned and sold ${WEAPON_ITEMS[id]?.name || id}. Reclaimed +${refund} Credits.`, "loot");
    AudioEngine.playBeep(900, 0.25, "sine");
  };

  const handleBuyComponent = (id: string, cost: number) => {
    if (credits < cost) {
      addTerminalLog("COMMERCE DECLINED: Insufficient ledger credits to purchase tech components.", "danger");
      AudioEngine.playBeep(220, 0.25, "sawtooth");
      return;
    }
    setCredits((cr) => cr - cost);
    setOwnedComponents((prev) => [...prev, id]);
    addTerminalLog(`Purchased ${COMPONENT_ITEMS[id]?.name || id} component! Transferred to cargo bay components inventory.`, "success");
    AudioEngine.playBeep(1100, 0.3, "sine");
  };

  const handleSellComponent = (indexInInventory: number, id: string, cost: number) => {
    const refund = Math.round(cost * 0.7);
    const nextOwned = [...ownedComponents];
    nextOwned.splice(indexInInventory, 1);
    setOwnedComponents(nextOwned);
    setCredits((cr) => cr + refund);
    addTerminalLog(`Decommissioned and sold ${COMPONENT_ITEMS[id]?.name || id}. Reclaimed +${refund} Credits.`, "loot");
    AudioEngine.playBeep(900, 0.25, "sine");
  };

  // Shipyard Services
  const fuelNeeded = maxFuel - fuel;
  const fuelCost = Math.ceil(fuelNeeded * 4);

  const hullNeeded = maxHull - hull;
  const hullCost = Math.ceil(hullNeeded * 6);

  const handleRefuel = () => {
    if (fuelCost <= 0) {
      addTerminalLog("Refuel systems: Tank pressure already maximized.", "info");
      return;
    }
    if (credits < fuelCost) {
      addTerminalLog("COMMERCE DECLINED: Insufficient credits to execute warp engine refueling.", "danger");
      AudioEngine.playBeep(220, 0.25, "sawtooth");
      return;
    }
    setCredits((cr) => cr - fuelCost);
    setFuel(maxFuel);
    addTerminalLog(`Jump Core Refueled! Pumped +${fuelNeeded.toFixed(1)} fuel core units. Charged ${fuelCost} credits.`, "success");
    AudioEngine.playBeep(600, 0.3, "sine");
  };

  const handleRepair = () => {
    if (hullCost <= 0) {
      addTerminalLog("Drydock systems: Hull integrity already at 100%.", "info");
      return;
    }
    if (credits < hullCost) {
      addTerminalLog("COMMERCE DECLINED: Insufficient credits to authorize drydock structural repairs.", "danger");
      AudioEngine.playBeep(220, 0.25, "sawtooth");
      return;
    }
    setCredits((cr) => cr - hullCost);
    setHull(maxHull);
    addTerminalLog(`Structural integrity restored! Welded armor bulkheads by +${hullNeeded} hit points. Charged ${hullCost} credits.`, "success");
    AudioEngine.playBeep(700, 0.4, "sine");
  };

  // Buy torpedo ammunition
  const handleBuyTorpedoAmmo = (itemKey: string) => {
    const template = ITEM_TEMPLATES[itemKey];
    if (!template) return;
    const price = template.value; // Buy at standard base template value in drydock services

    if (credits < price) {
      addTerminalLog(`COMMERCE DECLINED: Insufficient credits to buy heavy ordnance ammunition.`, "danger");
      AudioEngine.playBeep(220, 0.25, "sawtooth");
      return;
    }

    const success = addCargoItem(itemKey, 1);
    if (success) {
      setCredits((cr) => cr - price);
      addTerminalLog(`Acquired 1x ${template.name} heavy torpedo ammo stack directly loaded to cargo.`, "success");
      AudioEngine.playBeep(850, 0.2, "sine");
    } else {
      addTerminalLog(`COMMERCE DECLINED: Cargo hold saturated. Cannot load heavy torpedo ordnance stack.`, "danger");
      AudioEngine.playBeep(220, 0.25, "sawtooth");
    }
  };

  const getRarityColorClass = (rarity: string) => {
    switch (rarity) {
      case "common": return "text-emerald-400";
      case "uncommon": return "text-yellow-500";
      case "rare": return "text-red-400";
      case "ultra_rare": return "text-fuchsia-400 animate-pulse font-bold";
      case "one_of_a_kind": return "text-purple-400 animate-pulse font-bold";
      default: return "text-neutral-400";
    }
  };

  return (
    <div id="viewport-market-grid" className="fade-panel flex-grow flex flex-col justify-between font-mono p-1">
      <div>
        {/* Header telemetry info bar */}
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center border-b border-current/30 pb-2 mb-4 gap-2">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center">
              <ShoppingBag size={16} className="mr-1.5 animate-pulse" /> SPACEPORT COMMERCE TERMINAL
            </h3>
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest">
              Docked at: <strong className={themeTextClass}>{station.name}</strong> • Tech Rating: <strong className="text-yellow-500">{station.techTitle} (Level {station.techLevel})</strong>
            </p>
          </div>
          <div className="flex items-center gap-3 bg-black/60 border border-current/20 px-3 py-1.5 rounded shadow-inner">
            <div className="flex items-center gap-1.5 text-xs text-yellow-500 font-bold">
              <Coins size={14} />
              <span id="market-credits-ledger">{credits.toLocaleString()} CREDITS</span>
            </div>
            <div className="text-[10px] text-neutral-400 border-l border-current/20 pl-3 uppercase">
              Cargo Occupancy: <span className={themeTextClass}>{currentCargoCount} / {maxCargoCap} BAYS</span>
            </div>
          </div>
        </div>

        {/* Outer navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 mb-4 select-none text-[10px] md:text-xs font-bold">
          <button
            onClick={() => {
              AudioEngine.playBeep(500, 0.05);
              setMarketTab("commodities");
              setSelectedItemId(null);
            }}
            className={`py-2 border border-current rounded text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
              marketTab === "commodities" ? "bg-current text-black" : "border-current/30 hover:bg-current/10"
            }`}
          >
            <ArrowLeftRight size={14} /> COMMODITY FREIGHT
          </button>
          <button
            onClick={() => {
              AudioEngine.playBeep(500, 0.05);
              setMarketTab("equipment");
              setSelectedItemId(null);
            }}
            className={`py-2 border border-current rounded text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
              marketTab === "equipment" ? "bg-current text-black" : "border-current/30 hover:bg-current/10"
            }`}
          >
            <Zap size={14} /> HARDPOINT & TECH DECK
          </button>
          <button
            onClick={() => {
              AudioEngine.playBeep(500, 0.05);
              setMarketTab("services");
              setSelectedItemId(null);
            }}
            className={`py-2 border border-current rounded text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
              marketTab === "services" ? "bg-current text-black" : "border-current/30 hover:bg-current/10"
            }`}
          >
            <Fuel size={14} /> SHIPYARD DRY-DOCK SERVICES
          </button>
        </div>

        {/* MAIN PANEL CONTENT */}
        {marketTab === "commodities" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* List and mode switches */}
            <div className="lg:col-span-8 space-y-3">
              {/* Buy vs Sell Switches */}
              <div className="flex border-b border-current/10 pb-2 mb-1 gap-2 select-none text-[10px] font-bold">
                <button
                  onClick={() => {
                    AudioEngine.playBeep(450, 0.04);
                    setCommMode("buy");
                    setSelectedItemId(null);
                  }}
                  className={`px-4 py-1.5 border rounded cursor-pointer transition ${
                    commMode === "buy" ? "border-green-400 bg-green-950/20 text-green-400" : "border-neutral-800 text-neutral-500 hover:text-neutral-400"
                  }`}
                >
                  BUY COMMODITIES
                </button>
                <button
                  onClick={() => {
                    AudioEngine.playBeep(450, 0.04);
                    setCommMode("sell");
                    setSelectedItemId(null);
                  }}
                  className={`px-4 py-1.5 border rounded cursor-pointer transition ${
                    commMode === "sell" ? "border-amber-500 bg-amber-950/20 text-amber-500" : "border-neutral-800 text-neutral-500 hover:text-neutral-400"
                  }`}
                >
                  SELL CARGO MANIFEST
                </button>
              </div>

              {/* Commodities list scrollable panel */}
              <div className="flex items-center bg-black/60 border border-current/20 px-2 py-1.5 rounded mb-2 mt-2">
                <Search size={14} className="text-neutral-500 mr-2" />
                <input type="text" placeholder="Search commodities..." value={marketSearchTerm} onChange={(e) => setMarketSearchTerm(e.target.value)} className="bg-transparent text-xs text-white outline-none w-full font-mono placeholder:text-neutral-600" />
                {marketSearchTerm && (<button onClick={() => setMarketSearchTerm("")} className="text-neutral-500 hover:text-white"><X size={14} /></button>)}
              </div>
              <div className="max-h-[320px] overflow-y-auto border border-current/20 rounded bg-black/50 p-2 space-y-1.5">
                <div className="grid grid-cols-12 text-[9px] uppercase font-bold text-neutral-400 border-b border-current/10 pb-1.5 mb-2 px-2 select-none">
                  <div className="col-span-7 sm:col-span-8">Material Item Template</div>
                  <div className="col-span-2 text-right">Hold Qty</div>
                  <div className="col-span-3 sm:col-span-2 text-right">Unit Price</div>
                </div>

                {(commMode === "sell" ? Array.from(new Set(cargo.map(slot => slot.type))) : commodityKeys).filter((key: string) => { if (!marketSearchTerm) return true; const item = ITEM_TEMPLATES[key]; return item?.name.toLowerCase().includes(marketSearchTerm.toLowerCase()); }).map((key: string) => {
                  const item = ITEM_TEMPLATES[key];
                  if (!item) return null;

                  // Compute real local prices
                  const localPrices = getItemPrices(key);
                  const price = commMode === "buy" ? localPrices.buy : localPrices.sell;
                  const inCargo = getQtyInCargo(key);

                  // If in Sell mode, only display items that are actually in the cargo hold to keep it clean and neat
                  if (commMode === "sell" && inCargo <= 0) return null;

                  const isSelected = selectedItemId === key;
                  const rarityStyle = getRarityColorClass(item.rarity);

                  return (
                    <button
                      key={key}
                      onClick={() => {
                        AudioEngine.playBeep(650, 0.05);
                        setSelectedItemId(key);
                        setTradeQty(1);
                      }}
                      className={`w-full grid grid-cols-12 items-center text-xs text-left p-2 border rounded transition select-none cursor-pointer ${
                        isSelected 
                          ? `${themeBorderClass} bg-current/10` 
                          : "border-neutral-800 hover:border-current/40 hover:bg-neutral-900/40"
                      }`}
                    >
                      <div className="col-span-7 sm:col-span-8 flex items-center gap-2">
                        <span className={`text-sm font-black ${item.color || "text-white"}`}>{item.char}</span>
                        <div className="leading-tight truncate">
                          <span className={`font-bold block truncate ${rarityStyle}`}>{item.name}</span>
                          <span className="text-[9px] text-neutral-400 italic block truncate sm:max-w-xs">{item.desc}</span>
                        </div>
                      </div>
                      <div className="col-span-2 text-right font-mono font-semibold">
                        {inCargo > 0 ? (
                          <span className="text-yellow-500 bg-yellow-950/20 px-1.5 py-0.5 rounded border border-yellow-500/10">x{inCargo}</span>
                        ) : (
                          <span className="opacity-40">-</span>
                        )}
                      </div>
                      <div className="col-span-3 sm:col-span-2 text-right font-mono font-bold text-white">
                        {price} CR
                      </div>
                    </button>
                  );
                })}

                {commMode === "sell" && cargo.length === 0 && (
                  <div className="py-12 text-center text-xs italic opacity-50 select-none">
                    No sellable materials detected in starship cargo bays. Go mine ores or salvage scrap first!
                  </div>
                )}
              </div>
            </div>

            {/* Trading terminal panel / side drawer */}
            <div className="lg:col-span-4 border border-current/25 bg-black/60 rounded p-4 flex flex-col justify-between shadow-xl min-h-[220px]">
              {selectedTemplate && selectedItemId ? (
                <div className="space-y-4 animate-fade-in flex flex-col justify-between h-full">
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] uppercase font-bold text-neutral-400">LEDGER SELECTION</span>
                    </div>

                    <div className="flex items-center gap-2.5 border-b border-current/10 pb-2">
                      <span className={`text-3xl font-black ${selectedTemplate.color || "text-white"}`}>{selectedTemplate.char}</span>
                      <div>
                        <h4 className={`font-bold leading-tight text-sm ${getRarityColorClass(selectedTemplate.rarity)}`}>{selectedTemplate.name}</h4>
                        <p className="text-[10px] text-neutral-400">Capacity Load: Max Stack {selectedTemplate.maxStack || 10}</p>
                      </div>
                    </div>

                    <p className="text-[10px] text-neutral-300 italic leading-snug">{selectedTemplate.desc}</p>

                    {/* Economics stats */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-black/40 p-2 rounded border border-current/5">
                      <div>
                        <span className="text-neutral-500 block uppercase font-bold text-[9px]">Market Standard</span>
                        <span className="font-bold font-mono text-white">{selectedTemplate.value} CR</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block uppercase font-bold text-[9px]">Station Yield Rate</span>
                        <span className={`font-bold font-mono flex items-center ${isRawMaterial(selectedItemId) ? "text-cyan-400" : "text-green-400"}`}>
                          <Percent size={11} className="mr-0.5 inline" /> 
                          {Math.round(getPriceMultiplier(selectedItemId) * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-current/10 pt-2 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="opacity-75">Unit Trade Cost:</span>
                        <strong className="font-mono text-white text-right">
                          {commMode === "buy" ? prices.buy : prices.sell} CREDITS
                        </strong>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 rounded p-1">
                        <button
                          onClick={() => {
                            AudioEngine.playBeep(400, 0.05, "triangle");
                            setTradeQty(q => Math.max(1, q - 1));
                          }}
                          className="px-2.5 py-1 text-xs hover:bg-neutral-800 rounded transition font-bold text-neutral-400 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold font-mono text-white">{tradeQty} UNITS</span>
                        <button
                          onClick={() => {
                            AudioEngine.playBeep(400, 0.05, "triangle");
                            // Max allowed to sell is owned qty, max to buy is cargo space or affordable qty
                            const ownedQty = getQtyInCargo(selectedItemId);
                            const maxLimit = commMode === "sell" 
                              ? ownedQty 
                              : Math.min(
                                  100, 
                                  // Simplified cargo space check (at least remaining spaces * maxStack, or just 100)
                                  Math.max(1, Math.floor(credits / prices.buy))
                                );
                            setTradeQty(q => Math.min(maxLimit, q + 1));
                          }}
                          className="px-2.5 py-1 text-xs hover:bg-neutral-800 rounded transition font-bold text-neutral-400 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Bulk quick-set buttons */}
                      <div className="flex gap-1 select-none text-[8px] font-bold">
                        <button
                          onClick={() => {
                            AudioEngine.playBeep(450, 0.04);
                            setTradeQty(1);
                          }}
                          className="flex-1 py-1 border border-neutral-800 hover:border-current/30 rounded text-center cursor-pointer uppercase"
                        >
                          MIN (1)
                        </button>
                        <button
                          onClick={() => {
                            AudioEngine.playBeep(450, 0.04);
                            const ownedQty = getQtyInCargo(selectedItemId);
                            if (commMode === "sell") {
                              setTradeQty(Math.max(1, ownedQty));
                            } else {
                              const affordable = Math.floor(credits / prices.buy);
                              // Simple check of available space
                              // Give them up to affordable or 10 units
                              setTradeQty(Math.max(1, Math.min(10, affordable)));
                            }
                          }}
                          className="flex-1 py-1 border border-neutral-800 hover:border-current/30 rounded text-center cursor-pointer uppercase"
                        >
                          STACK (5)
                        </button>
                        <button
                          onClick={() => {
                            AudioEngine.playBeep(450, 0.04);
                            const ownedQty = getQtyInCargo(selectedItemId);
                            if (commMode === "sell") {
                              setTradeQty(Math.max(1, ownedQty));
                            } else {
                              const affordable = Math.floor(credits / prices.buy);
                              // Calculate based on remaining capacity or max affordable
                              setTradeQty(Math.max(1, affordable));
                            }
                          }}
                          className="flex-1 py-1 border border-neutral-800 hover:border-current/30 rounded text-center cursor-pointer uppercase"
                        >
                          MAX ALLOWED
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-dashed border-current/20 mt-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold opacity-75">TRANSACTION TOTAL:</span>
                      <strong className={`font-mono text-sm font-bold ${commMode === "buy" ? "text-green-400" : "text-amber-500"}`}>
                        {(commMode === "buy" ? prices.buy * tradeQty : prices.sell * tradeQty).toLocaleString()} CREDITS
                      </strong>
                    </div>

                    <button
                      onClick={commMode === "buy" ? handleBuyCommodity : handleSellCommodity}
                      className={`w-full py-2.5 font-bold text-xs rounded transition uppercase tracking-wider cursor-pointer flex justify-center items-center gap-1.5 border ${
                        commMode === "buy"
                          ? "border-green-400 bg-green-950/20 hover:bg-green-400 hover:text-black text-green-400"
                          : "border-amber-500 bg-amber-950/20 hover:bg-amber-500 hover:text-black text-amber-500"
                      }`}
                    >
                      {commMode === "buy" ? (
                        <>EXECUTE PURCHASE LEDGER</>
                      ) : (
                        <>EXECUTE SALES MANIFEST</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 italic opacity-55 text-xs h-full flex flex-col justify-center items-center space-y-3 select-none">
                  <Terminal size={24} className="opacity-40 animate-pulse text-current" />
                  <p className="max-w-[200px] leading-relaxed">
                    Select a material item from the listing grid to initialize transaction pipelines.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {marketTab === "equipment" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 space-y-4">
              {/* Weapons vs Components switches */}
              <div className="flex border-b border-current/10 pb-2 mb-1 gap-2 select-none text-[10px] font-bold">
                <button
                  onClick={() => {
                    AudioEngine.playBeep(450, 0.04);
                    setEquipMode("weapons");
                    setSelectedItemId(null);
                  }}
                  className={`px-4 py-1.5 border rounded cursor-pointer transition ${
                    equipMode === "weapons" ? "border-current bg-current/5 text-current" : "border-neutral-800 text-neutral-500 hover:text-neutral-400"
                  }`}
                >
                  MILITARY STARSHIP WEAPONS
                </button>
                <button
                  onClick={() => {
                    AudioEngine.playBeep(450, 0.04);
                    setEquipMode("components");
                    setSelectedItemId(null);
                  }}
                  className={`px-4 py-1.5 border rounded cursor-pointer transition ${
                    equipMode === "components" ? "border-current bg-current/5 text-current" : "border-neutral-800 text-neutral-500 hover:text-neutral-400"
                  }`}
                >
                  ENGINEERING MODULE COMPONENTS
                </button>
              </div>

              {/* Weapons Listing Grid */}
              {equipMode === "weapons" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                  {Object.keys(WEAPON_ITEMS).map((key) => {
                    const wep = WEAPON_ITEMS[key];
                    const isAvailable = isEquipmentAvailable(wep.rarity);
                    if (!isAvailable) return null; // Hide locked items if station tech is too low

                    const isSelected = selectedItemId === key;
                    const repLock = getReputationLock(wep.rarity);
                    const cost = getEquipmentCost(key, "weapon");

                    return (
                      <div
                        key={key}
                        className={`border rounded p-3 bg-black/40 flex flex-col justify-between space-y-3 transition relative ${
                          isSelected ? `${themeBorderClass} ring-1 ring-current/20` : "border-neutral-800"
                        }`}
                      >
                        {repLock.isLocked && (
                          <div className="absolute inset-0 bg-black/90 backdrop-blur-[1px] z-10 flex flex-col justify-center items-center rounded text-center select-none p-3">
                            <Lock size={16} className="text-red-500 mb-1 animate-pulse" />
                            <span className="text-[9px] text-red-500 uppercase tracking-widest font-bold">REPUTATION LOCKED</span>
                            <span className="text-[8px] text-neutral-400 mt-1 leading-snug">
                              Requires <span className="text-red-400">+{repLock.requiredRep} {repLock.factionName} Standing</span> or a <span className="text-yellow-500 font-bold">Clearance Keycard</span>.
                            </span>
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex justify-between items-start gap-1">
                            <h4 className={`font-bold text-xs leading-snug ${getRarityColorClass(wep.rarity)}`}>{wep.name}</h4>
                            {repLock.hasSpoofCard && (
                              <span className="text-[7px] text-cyan-400 font-bold uppercase tracking-wider bg-cyan-950/40 border border-cyan-500/20 px-1 py-0.5 rounded flex items-center gap-0.5">
                                <ShieldCheck size={8} /> SPOOFED
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-400 leading-tight italic">{wep.desc}</p>
                          <div className="text-[9px] text-cyan-400 font-mono font-bold flex items-center gap-1 mt-1 bg-cyan-950/20 px-1 py-0.5 rounded border border-cyan-500/10 w-max">
                            Rating: Dmg {wep.damage} • Type {wep.type.replace("_", " ")}
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-neutral-900 mt-2">
                          <span className="font-mono text-xs font-bold text-yellow-500">{cost.toLocaleString()} CR</span>
                          <button
                            onClick={() => {
                              AudioEngine.playBeep(450, 0.05);
                              handleBuyWeapon(key, cost);
                            }}
                            className={`px-3 py-1 text-[10px] font-bold rounded transition border border-green-500 text-green-500 bg-green-950/15 hover:bg-green-500 hover:text-black cursor-pointer`}
                          >
                            [ BUY WEAPON ]
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Components Listing Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                  {Object.keys(COMPONENT_ITEMS).map((key) => {
                    const comp = COMPONENT_ITEMS[key];
                    if (comp.id.endsWith("_standard")) return null; // Hide factory default freebies
                    if (key === "mining_gas" && !activeSector?.station?.isMiningStation) return null; // Hide gas mining component if not at a mining station
                    const isAvailable = isEquipmentAvailable(comp.rarity);
                    if (!isAvailable) return null; // Hide locked components if station tech is too low

                    const isSelected = selectedItemId === key;
                    const repLock = getReputationLock(comp.rarity);
                    const cost = getEquipmentCost(key, "component");

                    return (
                      <div
                        key={key}
                        className={`border rounded p-3 bg-black/40 flex flex-col justify-between space-y-3 transition relative ${
                          isSelected ? `${themeBorderClass} ring-1 ring-current/20` : "border-neutral-800"
                        }`}
                      >
                        {repLock.isLocked && (
                          <div className="absolute inset-0 bg-black/90 backdrop-blur-[1px] z-10 flex flex-col justify-center items-center rounded text-center select-none p-3">
                            <Lock size={16} className="text-red-500 mb-1 animate-pulse" />
                            <span className="text-[9px] text-red-500 uppercase tracking-widest font-bold">REPUTATION LOCKED</span>
                            <span className="text-[8px] text-neutral-400 mt-1 leading-snug">
                              Requires <span className="text-red-400">+{repLock.requiredRep} {repLock.factionName} Standing</span> or a <span className="text-yellow-500 font-bold">Clearance Keycard</span>.
                            </span>
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex justify-between items-start gap-1">
                            <h4 className={`font-bold text-xs leading-snug ${getRarityColorClass(comp.rarity)}`}>{comp.name}</h4>
                            {repLock.hasSpoofCard && (
                              <span className="text-[7px] text-cyan-400 font-bold uppercase tracking-wider bg-cyan-950/40 border border-cyan-500/20 px-1 py-0.5 rounded flex items-center gap-0.5">
                                <ShieldCheck size={8} /> SPOOFED
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-400 leading-tight italic">{comp.desc}</p>
                          <div className="text-[9px] text-cyan-400 font-mono font-bold flex items-center gap-1 mt-1 bg-cyan-950/20 px-1 py-0.5 rounded border border-cyan-500/10 w-max">
                            Slot: {comp.category.toUpperCase()} • Bonus {comp.bonus > 0 ? `+${comp.bonus}` : comp.bonus}
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-neutral-900 mt-2">
                          <span className="font-mono text-xs font-bold text-yellow-500">{cost.toLocaleString()} CR</span>
                          <button
                            onClick={() => {
                              AudioEngine.playBeep(450, 0.05);
                              handleBuyComponent(key, cost);
                            }}
                            className="px-3 py-1 text-[10px] font-bold rounded transition border border-green-500 text-green-500 bg-green-950/15 hover:bg-green-500 hover:text-black cursor-pointer"
                          >
                            [ BUY UPGRADE ]
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sell Equipment panel (weapons in inventory and components owned) */}
            <div className="lg:col-span-4 border border-current/25 bg-black/60 rounded p-4 shadow-xl flex flex-col justify-between min-h-[300px]">
              <div>
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 border-b border-current/10 pb-1.5 mb-3 flex items-center gap-1 select-none">
                  <Coins size={12} /> COMMERCE RECYCLING SHIELD
                </h4>

                {equipMode === "weapons" ? (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    <span className="text-[9px] uppercase font-bold text-neutral-500 block">SELL OWNED WEAPONS (70% value)</span>
                    {inventoryWeapons.map((id, index) => {
                      const wep = WEAPON_ITEMS[id];
                      if (!wep) return null;
                      const refund = Math.round(wep.cost * 0.7);

                      return (
                        <div key={`${id}-${index}`} className="flex justify-between items-center text-xs p-2 border border-neutral-900 rounded bg-black/40">
                          <div className="truncate pr-2">
                            <span className="font-bold text-white block truncate">{wep.name}</span>
                            <span className="text-[8px] text-neutral-500 block uppercase font-mono">EST: {refund} CR</span>
                          </div>
                          <button
                            onClick={() => {
                              AudioEngine.playBeep(400, 0.1);
                              handleSellWeapon(index, id, wep.cost);
                            }}
                            className="px-2 py-1 text-[9px] font-bold border border-amber-500 text-amber-500 bg-transparent hover:bg-amber-500 hover:text-black rounded transition cursor-pointer flex items-center gap-0.5"
                          >
                            SELL
                          </button>
                        </div>
                      );
                    })}

                    {inventoryWeapons.length === 0 && (
                      <p className="text-[10px] italic text-neutral-500 py-8 text-center select-none">
                        No dismounted weapons found in starship armory chests.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    <span className="text-[9px] uppercase font-bold text-neutral-500 block">SELL OWNED MODULES (70% value)</span>
                    {ownedComponents.map((id, index) => {
                      const comp = COMPONENT_ITEMS[id];
                      if (!comp) return null;
                      const refund = Math.round(comp.cost * 0.7);

                      return (
                        <div key={`${id}-${index}`} className="flex justify-between items-center text-xs p-2 border border-neutral-900 rounded bg-black/40">
                          <div className="truncate pr-2">
                            <span className="font-bold text-white block truncate">{comp.name}</span>
                            <span className="text-[8px] text-neutral-500 block uppercase font-mono">EST: {refund} CR</span>
                          </div>
                          <button
                            onClick={() => {
                              AudioEngine.playBeep(400, 0.1);
                              handleSellComponent(index, id, comp.cost);
                            }}
                            className="px-2 py-1 text-[9px] font-bold border border-amber-500 text-amber-500 bg-transparent hover:bg-amber-500 hover:text-black rounded transition cursor-pointer flex items-center gap-0.5"
                          >
                            SELL
                          </button>
                        </div>
                      );
                    })}

                    {ownedComponents.length === 0 && (
                      <p className="text-[10px] italic text-neutral-500 py-8 text-center select-none">
                        No un-equipped upgrade modules found in inventory storage crates.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-current/10 pt-3.5 mt-4 select-none">
                <div className="text-[9px] text-neutral-400 flex items-start gap-1.5 leading-snug">
                  <Info size={11} className="text-cyan-400 shrink-0 mt-0.5" />
                  <p>
                    Purchased weapons/components are loaded into drydock inventory. Use the <strong className={themeTextClass}>WEAPONS DECK [W]</strong> to mount or equip them onto your active hardpoints!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {marketTab === "services" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left side: refueling, hull repairs */}
            <div className="md:col-span-6 space-y-4">
              <h4 className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 border-b border-current/10 pb-1.5 select-none flex items-center gap-1">
                <Fuel size={14} /> LIQUID HYDROGEN CORE STATION
              </h4>

              {/* Fuel services card */}
              <div className="border border-neutral-800 rounded p-4 bg-black/40 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-white text-xs">STARSHIP RE-FUELING CORE</h5>
                    <p className="text-[10px] text-neutral-400">Refuels active sub-space fusion reactor jump coils.</p>
                  </div>
                  <span className="text-[10px] bg-cyan-950/20 border border-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-bold font-mono">
                    {fuel.toFixed(1)} / {maxFuel} FUEL UNITS
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="opacity-75">Refueling price rate:</span>
                  <strong className="text-white">4 CREDITS PER UNIT</strong>
                </div>

                {fuelNeeded > 0 ? (
                  <button
                    onClick={handleRefuel}
                    className="w-full py-2 bg-blue-950/25 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black font-bold text-xs rounded transition uppercase tracking-wider cursor-pointer"
                  >
                    REFUEL JUMP FUEL CORE (-{fuelCost} Credits)
                  </button>
                ) : (
                  <div className="text-center py-2 border border-dashed border-neutral-800 text-neutral-600 rounded text-[10px] uppercase font-bold select-none">
                    JUMP FUEL ENGINE TANKS FILLED TO PEAK CAPACITY
                  </div>
                )}
              </div>

              {/* Hull repairs card */}
              <h4 className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 border-b border-current/10 pb-1.5 pt-2 select-none flex items-center gap-1">
                <Wrench size={14} /> DRYDOCK COMPREHENSIVE STRUCTURAL RE-ARM
              </h4>

              <div className="border border-neutral-800 rounded p-4 bg-black/40 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-white text-xs">STRUCTURAL REPAIR DRYDOCK</h5>
                    <p className="text-[10px] text-neutral-400">Patches up damaged titanium-alloy micro hull structures.</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${hull < maxHull * 0.4 ? "bg-red-950/20 border border-red-500/10 text-red-400 animate-pulse" : "bg-green-950/20 border border-green-500/10 text-green-400"}`}>
                    {hull} / {maxHull} HULL HP
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="opacity-75">Repair welder drydock rate:</span>
                  <strong className="text-white">6 CREDITS PER HP</strong>
                </div>

                {hullNeeded > 0 ? (
                  <button
                    onClick={handleRepair}
                    className="w-full py-2 bg-emerald-950/25 border border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black font-bold text-xs rounded transition uppercase tracking-wider cursor-pointer"
                  >
                    PATCH UP STARSHIP STRUCTURAL ARMOR (-{hullCost} Credits)
                  </button>
                ) : (
                  <div className="text-center py-2 border border-dashed border-neutral-800 text-neutral-600 rounded text-[10px] uppercase font-bold select-none">
                    STARSHIP ALLOY HULL PLATES IN NOMINAL STATE (100%)
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Ammunition Armory */}
            <div className="md:col-span-6 space-y-4">
              <h4 className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 border-b border-current/10 pb-1.5 select-none flex items-center gap-1">
                <Shield size={14} className="text-red-500 animate-pulse" /> MILITARY ORDNANCE & AMMUNITION
              </h4>

              <div className="space-y-3">
                {[
                  { key: "torpedo", name: "HE Fusion Torpedo", dmg: "+10 DMG", desc: "High explosive heavy fusion payload torpedo. Heavy armor crushing.", class: "text-orange-400" },
                  { key: "torpedo_proton", name: "Proton Nuclear Torpedo", dmg: "+25 DMG", desc: "Atomic fission payload torpedo, dealing catastrophic shield vaporisation.", class: "text-red-400" },
                  { key: "torpedo_antimatter", name: "Anti-Matter Torpedo", dmg: "+50 DMG", desc: "Micro-anti-proton capsule payload torpedo. Decimates dreadnought bulkheads.", class: "text-fuchsia-400" }
                ].map((t) => {
                  const template = ITEM_TEMPLATES[t.key];
                  if (!template) return null;
                  const qtyInHold = getQtyInCargo(t.key);

                  return (
                    <div key={t.key} className="border border-neutral-800 rounded p-3 bg-black/40 flex justify-between items-center gap-4">
                      <div className="space-y-1 truncate flex-grow">
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-sm ${t.class}`}>{template.char}</span>
                          <h5 className="font-bold text-white text-xs leading-none truncate">{t.name}</h5>
                          <span className="text-[8px] bg-red-950/25 border border-red-500/20 text-red-500 px-1 py-0.5 rounded font-mono font-bold">{t.dmg}</span>
                        </div>
                        <p className="text-[9px] text-neutral-400 leading-tight italic truncate">{t.desc}</p>
                        <p className="text-[9px] text-yellow-500 font-bold uppercase tracking-widest">
                          Bays Inventory: <strong className="text-white">{qtyInHold} loaded</strong>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="block font-mono text-xs font-bold text-white mb-1.5">{template.value} CR</span>
                        <button
                          onClick={() => {
                            AudioEngine.playBeep(450, 0.05);
                            handleBuyTorpedoAmmo(t.key);
                          }}
                          className="px-2.5 py-1 text-[9px] font-bold border border-green-500 text-green-500 hover:bg-green-500 hover:text-black rounded transition cursor-pointer"
                        >
                          [ ACQUIRE ]
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scanned Void Coordinates Data Commerce */}
            <div className="col-span-12 border-t border-neutral-800 pt-4 mt-2">
              <h4 className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 border-b border-current/10 pb-1.5 select-none flex items-center gap-1">
                <Coins size={14} className="text-yellow-500 animate-pulse" /> DEEP SPACE EXPLORATION INTEL & CARTO DATA COMMERCE
              </h4>
              
              <div className="border border-neutral-800 rounded p-4 bg-black/40 mt-3 space-y-4">
                <p className="text-[10px] text-neutral-400 leading-relaxed">
                  Trading stations and science hubs will purchase unmapped stellar coordinate logs generated via bridge sensor suites. Sold coordinate data remains in your galactic flight computer so you can still jump back to waypoints!
                </p>

                {voidWaypoints && voidWaypoints.filter(wp => !wp.isSold).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {voidWaypoints.filter(wp => !wp.isSold).map((wp) => (
                      <div key={wp.id} className="border border-neutral-800 bg-neutral-950/60 p-3 rounded flex justify-between items-center gap-2">
                        <div className="space-y-1 truncate">
                          <strong className="text-xs text-yellow-400 block truncate">{wp.name}</strong>
                          <span className="text-[9px] text-neutral-500 font-mono block">COORDS SECURED VIA SYSTEM #{wp.parentSystemIndex}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="block font-mono text-xs font-bold text-white mb-1.5">{wp.value} CR</span>
                          <button
                            onClick={() => {
                              setCredits(prev => prev + wp.value);
                              setVoidWaypoints?.(prev => prev.map(item => item.id === wp.id ? { ...item, isSold: true } : item));
                              addTerminalLog(`[DATA TRADE]: Transferred cryptographic sensor logs of ${wp.name} to station database. Earned +${wp.value} Credits.`, "success");
                              AudioEngine.playBeep(950, 0.35, "sine");
                            }}
                            className="px-2.5 py-1 text-[9px] font-bold border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black rounded transition cursor-pointer font-mono"
                          >
                            SELL DATA
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-neutral-800 text-neutral-500 rounded text-[10px] uppercase font-mono font-bold select-none">
                    NO UNTRADED DEEP SPACE COORDINATE LOGS DETECTED. SCAN ANOMALIES FROM COCKPIT BRIDGE.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER LIVE TICKER */}
      <div className="mt-4 pt-3 border-t border-dashed border-current/40 text-[9px] flex justify-between items-center flex-wrap gap-2 select-none opacity-80 uppercase tracking-widest">
        <div className="flex items-center text-cyan-400 gap-2">
          <TrendingUp size={11} className="animate-bounce" />
          <span>STATION EXCHANGE TICKER:</span>
          <marquee className="w-48 md:w-96 text-[8px] text-neutral-400" scrollamount="3">
            [ORE: +4.2% CR] [SCRAP: -1.5% CR] [HE-3: +11.8% CR] [AM-CAPSULE: HIGH YIELD] [DARK_MATTER: MAX SPREAD] [NEUTRAL_GEL: IN HIGH DEMAND AT CLINTON OUTPOSTS] [CHRONOMETRIC_DUST: ULTRA PREMIUM EXCHANGE VALUES]
          </marquee>
        </div>
        <div className="text-yellow-500 font-bold font-mono">
          COMMERCE MATRIX SECURED
        </div>
      </div>
    </div>
  );
};
