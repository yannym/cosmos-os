import React, { useState, useMemo } from "react";
import { GalaxyCell, Mission, Wingman, CantinaVisitor, Quest, Drink, BlueprintTemplate } from "../types";
import { COMPONENT_ITEMS, WEAPON_ITEMS, CANTINA_DRINKS, BLUEPRINTS, ITEM_TEMPLATES } from "../constants";
import { 
  X, 
  MapPin, 
  Users, 
  Sparkles, 
  Compass, 
  Coins, 
  UserPlus, 
  ShieldAlert, 
  Check, 
  Flame, 
  Zap, 
  Crosshair, 
  Wrench,
  HelpCircle,
  CupSoda,
  Cpu
} from "lucide-react";
import { AudioEngine } from "../audio";

// Silhouette Person Definitions
interface InformantType {
  id: "informant" | "mercenary" | "syndicate" | "smuggler";
  name: string;
  role: string;
  description: string;
  colorClass: string;
  avatarIcon: string;
}

const INFORMANTS: InformantType[] = [
  {
    id: "informant",
    name: "Talon 'Viper' Vance",
    role: "Shady Informant",
    description: "Sells hidden Black Market coordinates. Bypasses standard faction blockades.",
    colorClass: "border-purple-500 text-purple-400 bg-purple-950/20 shadow-purple-500/20",
    avatarIcon: "👤"
  },
  {
    id: "syndicate",
    name: "Kaelen Drake",
    role: "Syndicate Agent",
    description: "Sources high-risk high-reward secret mercenary contracts and bounty targets.",
    colorClass: "border-red-500 text-red-400 bg-red-950/20 shadow-red-500/20",
    avatarIcon: "👥"
  },
  {
    id: "mercenary",
    name: "Lt. Vance & Eldritch",
    role: "Mercenary Recruiter",
    description: "Contracts elite wingmen escorts to fly auxiliary target support on warp runs.",
    colorClass: "border-cyan-500 text-cyan-400 bg-cyan-950/20 shadow-cyan-500/20",
    avatarIcon: "🚀"
  },
  {
    id: "smuggler",
    name: "Zev 'Hacksaw' Miller",
    role: "Tech Smuggler",
    description: "Imports illegal military weapons, Class-II/III mining drills, and prototype frames.",
    colorClass: "border-yellow-500 text-yellow-500 bg-yellow-950/20 shadow-yellow-500/20",
    avatarIcon: "⚙️"
  }
];

interface StationBarProps {
  credits: number;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
  activeSector: GalaxyCell | null;
  cantinaVisitors: CantinaVisitor[];
  hasBlackMarketCoords: boolean;
  onBuyBlackMarketCoords: () => void;
  onAcceptMission: (mission: Mission) => void;
  onAcceptQuest?: (quest: Quest) => void;
  activeQuests: any[];
  activeMissions: Mission[];
  wingmen: Wingman[];
  setWingmen: React.Dispatch<React.SetStateAction<Wingman[]>>;
  ownedComponents: string[];
  setOwnedComponents: React.Dispatch<React.SetStateAction<string[]>>;
  inventoryWeapons: string[];
  setInventoryWeapons: React.Dispatch<React.SetStateAction<string[]>>;
  ownedBlueprints: string[];
  setOwnedBlueprints: React.Dispatch<React.SetStateAction<string[]>>;
  addTerminalLog: (text: string, category: "normal" | "danger" | "success" | "info" | "loot") => void;
  onAttackStation: () => void;
  onClose: () => void;
  themeColor: "green" | "amber" | "cyan";
  activeBuffs: Record<string, { amount: number; remainingJumps: number; drinkName: string }>;
  setActiveBuffs: React.Dispatch<React.SetStateAction<Record<string, { amount: number; remainingJumps: number; drinkName: string }>>>;
  currentSystemName: string;
}

export const StationBar: React.FC<StationBarProps> = ({
  credits,
  setCredits,
  activeSector,
  cantinaVisitors,
  hasBlackMarketCoords,
  onBuyBlackMarketCoords,
  onAcceptMission,
  onAcceptQuest,
  activeQuests,
  activeMissions,
  wingmen,
  setWingmen,
  ownedComponents,
  setOwnedComponents,
  inventoryWeapons,
  setInventoryWeapons,
  ownedBlueprints,
  setOwnedBlueprints,
  addTerminalLog,
  onAttackStation,
  onClose,
  themeColor,
  activeBuffs,
  setActiveBuffs,
  currentSystemName
}) => {
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);

  const stationBlueprints = useMemo(() => {
    const stationId = activeSector?.station?.id || "default";
    let hash = 0;
    for (let i = 0; i < stationId.length; i++) {
      hash = ((hash << 5) - hash) + stationId.charCodeAt(i);
      hash |= 0;
    }
    
    let t = hash + 0x6D2B79F5;
    const rand = () => {
      t = (t + 0x6D2B79F5) | 0;
      let imul = Math.imul(t ^ (t >>> 15), t | 1);
      imul = (imul + Math.imul(imul ^ (imul >>> 7), imul | 61)) | 0;
      return ((imul ^ (imul >>> 14)) >>> 0) / 4294967296;
    };

    const shuffled = [...BLUEPRINTS].sort(() => 0.5 - rand());
    return shuffled.slice(0, 4);
  }, [activeSector?.station?.id]);

  const getBlueprintCost = (bp: BlueprintTemplate): number => {
    if (bp.resultType === "weapon") {
      return Math.round((WEAPON_ITEMS[bp.resultId]?.cost || 200) * 1.5);
    } else if (bp.resultType === "module") {
      return Math.round((COMPONENT_ITEMS[bp.resultId]?.cost || 250) * 1.5);
    } else if (bp.resultType === "spirit") {
      return 350;
    } else {
      return 250;
    }
  };

  const buyBlueprint = (bp: BlueprintTemplate) => {
    const cost = getBlueprintCost(bp);
    if (credits < cost) {
      AudioEngine.playBeep(200, 0.15, "sawtooth");
      addTerminalLog(`BLUEPRINT BROKER: You need ${cost} Credits to purchase the schematic for ${bp.name}.`, "danger");
      return;
    }

    if (ownedBlueprints.includes(bp.id)) {
      addTerminalLog(`BLUEPRINT BROKER: Your mainframe already possesses the [${bp.name}] schematic.`, "info");
      return;
    }

    setCredits(prev => prev - cost);
    setOwnedBlueprints(prev => [...prev, bp.id]);
    addTerminalLog(`[SCHEMATIC SYNC]: Successfully purchased and synced ${bp.name} to the ship's database! Ready to craft from the Cargo Hold.`, "success");
    AudioEngine.playBeep(1100, 0.3, "sine");
  };

  const getDrinksForStation = (): Drink[] => {
    const stationId = activeSector?.station?.id || "default";
    const standards = CANTINA_DRINKS.filter(d => !d.exclusiveToSystem);
    let hash = 0;
    for (let i = 0; i < stationId.length; i++) {
      hash += stationId.charCodeAt(i);
    }
    
    const selectedStandards: Drink[] = [];
    for (let j = 0; j < 3; j++) {
      const idx = (hash + j * 7) % standards.length;
      const d = standards[idx];
      if (!selectedStandards.some(s => s.id === d.id)) {
        selectedStandards.push(d);
      }
    }
    standards.forEach(d => {
      if (selectedStandards.length < 3 && !selectedStandards.some(s => s.id === d.id)) {
        selectedStandards.push(d);
      }
    });

    const exclusives = CANTINA_DRINKS.filter(d => d.exclusiveToSystem && d.exclusiveToSystem === currentSystemName);
    return [...selectedStandards, ...exclusives];
  };

  const buyDrink = (drink: Drink) => {
    if (credits < drink.cost) {
      AudioEngine.playBeep(200, 0.15, "sawtooth");
      addTerminalLog(`CANTINA BARKEEP: You need ${drink.cost} Credits to purchase ${drink.name}.`, "danger");
      return;
    }

    setCredits((prev) => prev - drink.cost);
    setActiveBuffs((prev) => ({
      ...prev,
      [drink.buffType]: {
        amount: drink.buffAmount,
        remainingJumps: drink.durationJumps,
        drinkName: drink.name
      }
    }));

    addTerminalLog(`[CANTINA DRINK]: Bought ${drink.name}! Active crew buff: ${drink.description} for ${drink.durationJumps} jumps.`, "success");
    AudioEngine.playBeep(900, 0.25, "sine");
  };

  // Available wingmen for hire
  const wingmanHiringCandidates = [
    {
      id: "wingman_jax",
      name: "Jax 'Grim' Vance",
      shipType: "Viper Interceptor",
      hp: 80,
      maxHp: 80,
      shields: 50,
      maxShields: 50,
      firepower: 12,
      cargoHold: 2,
      duration: 15,
      maxDuration: 15,
      cost: 350,
      level: 1,
      exp: 0,
      abilities: ["Fast Recharge"],
      focus: "shields" as const
    },
    {
      id: "wingman_nyx",
      name: "Nyx 'Phantom' Eldritch",
      shipType: "Shadow Bomber",
      hp: 120,
      maxHp: 120,
      shields: 80,
      maxShields: 80,
      firepower: 22,
      cargoHold: 4,
      duration: 12,
      maxDuration: 12,
      cost: 600,
      level: 1,
      exp: 0,
      abilities: ["Heavy Torpedo"],
      focus: "hull" as const
    }
  ];

  // Experimental tech smuggle inventory
  const smugglerTechCandidates = [
    {
      id: "mining_heavy",
      name: "Class-II Carbide Core Drill",
      type: "component" as const,
      cost: 450,
      desc: "Necessary for extracting volatile Ignis mineral nodes safely."
    },
    {
      id: "mining_plasma",
      name: "Class-III Plasma Inductor Matrix",
      type: "component" as const,
      cost: 1000,
      desc: "Greatly increases mining extraction speed and yield multiplier."
    },
    {
      id: "plasma_spike_mk2",
      name: "Plasma Thermal Beam MK2",
      type: "weapon" as const,
      cost: 800,
      desc: "Highly-unstable dual-emitter laser beam. Deals 36 balanced damage."
    },
    {
      id: "ion_blaster_mk2",
      name: "Ion Blaster MK2",
      type: "weapon" as const,
      cost: 950,
      desc: "Advanced disruption beam that vaporizes defensive shield screens."
    }
  ];

  const handleHireWingman = (w: any) => {
    if (credits < w.cost) {
      AudioEngine.playBeep(200, 0.15, "sawtooth");
      addTerminalLog("BAR MERCENARY: Insufficient credits to hire this elite wingman escort.", "danger");
      return;
    }
    if (wingmen.some((active) => active.name === w.name)) {
      AudioEngine.playBeep(200, 0.15, "sawtooth");
      addTerminalLog(`BAR MERCENARY: ${w.name} is already under active service in your formation.`, "danger");
      return;
    }

    setCredits((c) => c - w.cost);
    setWingmen((prev) => [...prev, w]);
    addTerminalLog(`Hired ${w.name} (${w.shipType}) escort contract! Active duration: ${w.duration} warp jumps.`, "success");
    AudioEngine.playBeep(1100, 0.25, "sine");
  };

  const handleBuySmugglerTech = (item: any) => {
    if (credits < item.cost) {
      AudioEngine.playBeep(200, 0.15, "sawtooth");
      addTerminalLog("BAR SMUGGLER: Insufficient ledger credits for experimental military tech.", "danger");
      return;
    }

    if (item.type === "component") {
      if (ownedComponents.includes(item.id)) {
        addTerminalLog(`BAR SMUGGLER: You already own the ${item.name} module.`, "danger");
        AudioEngine.playBeep(200, 0.15, "sawtooth");
        return;
      }
      setCredits((c) => c - item.cost);
      setOwnedComponents((prev) => [...prev, item.id]);
      addTerminalLog(`Smuggled experimental module ${item.name} directly into component racks!`, "success");
    } else {
      setCredits((c) => c - item.cost);
      setInventoryWeapons((prev) => [...prev, item.id]);
      addTerminalLog(`Smuggled heavy weapon ${item.name} directly into your drydock armory!`, "success");
    }
    AudioEngine.playBeep(1100, 0.3, "sine");
  };

  const handleBuyCoordinates = () => {
    if (credits < 250) {
      AudioEngine.playBeep(200, 0.15, "sawtooth");
      addTerminalLog("BAR INFORMANT: Coordinates fee of 250 Credits required to slice navigational lockouts.", "danger");
      return;
    }
    onBuyBlackMarketCoords();
  };

  const themeTextClass =
    themeColor === "green" ? "text-green-400" : themeColor === "amber" ? "text-amber-500" : "text-cyan-400";

  const visitorsList = cantinaVisitors && cantinaVisitors.length > 0 
    ? cantinaVisitors 
    : INFORMANTS.map(inf => ({
        id: inf.id,
        name: inf.name,
        role: inf.role,
        description: inf.description,
        colorClass: inf.colorClass,
        avatarIcon: inf.avatarIcon,
        type: inf.id as "informant" | "syndicate" | "mercenary" | "smuggler"
      }));

  const selectedVisitor = visitorsList.find((v) => v.id === selectedVisitorId);

  return (
    <section className="font-mono text-xs text-neutral-300 space-y-4">
      {/* Header Info Banner */}
      <header className="border border-current/30 p-3 bg-black/60 rounded flex justify-between items-center select-none shadow-md">
        <div className="space-y-1">
          <h2 className={`text-base font-bold uppercase tracking-wider flex items-center gap-1.5 ${themeTextClass}`}>
            🍷 STATION CANTINA BAR & INFORMANT NETWORKS
          </h2>
          <p className="text-[10px] text-neutral-400 max-w-xl">
            Locate backspace mercenaries, buy coordinates for illicit Black Markets, accept high-value Syndicate contracts, or browse smuggled experimental weaponry.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-neutral-400 text-[10px]">AVAILABLE BUDGET:</div>
          <div className="text-yellow-400 font-bold text-sm flex items-center gap-1 justify-end">
            <Coins size={14} /> {credits} CR
          </div>
        </div>
      </header>

      {/* Dynamic Crew Buffs & Drinks Menu Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Active Crew Buffs (Left Column: 4/12 width or full on small) */}
        <div className="lg:col-span-4 border border-neutral-800 bg-neutral-950/60 p-3.5 rounded flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-neutral-400 tracking-wider flex items-center gap-1.5 border-b border-neutral-900 pb-2">
              <Sparkles size={13} className="text-cyan-400" />
              ACTIVE CREW BUFFS
            </h3>
            
            {Object.keys(activeBuffs).length === 0 ? (
              <div className="py-8 text-center text-neutral-500 text-[10px] italic">
                No active drink stimulants. Purchase drinks on tap to apply crew buffs.
              </div>
            ) : (
              <div className="space-y-2.5">
                {Object.keys(activeBuffs).map((key) => {
                  const buff = activeBuffs[key];
                  let buffLabel = "";
                  let iconColor = "text-cyan-400";
                  if (key === "damage") { buffLabel = "Weapons Output"; iconColor = "text-red-400"; }
                  else if (key === "evasion") { buffLabel = "Pilot Evasion"; iconColor = "text-green-400"; }
                  else if (key === "mining") { buffLabel = "Mining Efficiency"; iconColor = "text-yellow-500"; }
                  else if (key === "fuel_discount") { buffLabel = "FTL Fuel Savings"; iconColor = "text-purple-400"; }
                  else if (key === "shields") { buffLabel = "Shield Overcharge"; iconColor = "text-blue-400"; }

                  return (
                    <div key={key} className="p-2 border border-neutral-800 bg-black/40 rounded flex flex-col justify-between space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-[11px]">{buff.drinkName}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 ${iconColor}`}>
                          +{Math.round(buff.amount * 100)}%
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        Affects: <span className="text-neutral-300 font-medium">{buffLabel}</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-neutral-500 pt-1 border-t border-neutral-900/40">
                        <span>Duration remaining</span>
                        <span className="text-yellow-400 font-bold uppercase">{buff.remainingJumps} Sector Jumps</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="text-[9px] text-neutral-500 pt-2 leading-snug border-t border-neutral-900/60 mt-3">
            ⚠️ Buffs decrement by 1 with each sector jump and clear automatically upon expiration. Overwriting a buff category refreshes its duration.
          </div>
        </div>

        {/* Drinks Selection Menu (Right Column: 8/12 width or full on small) */}
        <div className="lg:col-span-8 border border-neutral-800 bg-neutral-950/40 p-3.5 rounded space-y-3">
          <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
            <h3 className="text-xs font-bold uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
              <CupSoda size={14} className="text-yellow-400 animate-pulse" />
              CANTINA DRINKS ON TAP
            </h3>
            <span className="text-[9px] uppercase font-bold text-neutral-500 px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded">
              STATION ASSORTMENT
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {getDrinksForStation().map((drink) => {
              const isExclusive = !!drink.exclusiveToSystem;
              const isAffordable = credits >= drink.cost;
              return (
                <div
                  key={drink.id}
                  className={`p-2.5 border rounded flex flex-col justify-between transition-all ${
                    isExclusive 
                      ? "border-yellow-600/30 bg-yellow-950/10 shadow-sm" 
                      : "border-neutral-800 bg-neutral-900/20"
                  } hover:border-neutral-700`}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className={`text-[11px] font-bold tracking-wide uppercase ${isExclusive ? "text-yellow-400" : "text-white"}`}>
                        {drink.name} {isExclusive && "🌟"}
                      </h4>
                      <span className="text-yellow-400 text-[10px] font-bold shrink-0">
                        {drink.cost} CR
                      </span>
                    </div>
                    {isExclusive && (
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-yellow-500 px-1 py-0.2 bg-yellow-950/50 border border-yellow-700/30 rounded inline-block">
                        {drink.exclusiveToSystem} EXCLUSIVE
                      </span>
                    )}
                    <p className="text-[10px] text-neutral-400 leading-normal line-clamp-2">
                      {drink.description}
                    </p>
                  </div>

                  <button
                    onClick={() => buyDrink(drink)}
                    className={`mt-2.5 w-full py-1.5 px-3 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      isAffordable
                        ? "bg-yellow-500 hover:bg-yellow-400 text-black shadow-md active:scale-[0.98]"
                        : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                    }`}
                  >
                    <CupSoda size={11} />
                    {isAffordable ? "Buy Drink" : "Insufficient Credits"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Exotic Blueprint Broker Terminal */}
          <div className="border-t border-neutral-900 pt-4 mt-4 space-y-3">
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-xs font-bold uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                <Cpu size={14} className="text-cyan-400 animate-pulse" />
                EXOTIC BLUEPRINT BROKER
              </h3>
              <span className="text-[9px] uppercase font-bold text-neutral-500 px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded">
                SCHEMATICS DATABASE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {stationBlueprints.map((bp) => {
                const owned = ownedBlueprints.includes(bp.id);
                const cost = getBlueprintCost(bp);
                const isAffordable = credits >= cost;
                return (
                  <div
                    key={bp.id}
                    className={`p-2.5 border rounded flex flex-col justify-between transition-all ${
                      owned
                        ? "border-emerald-950/20 bg-emerald-950/5 opacity-80"
                        : "border-neutral-800 bg-neutral-900/20 hover:border-neutral-700"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className={`text-[11px] font-bold tracking-wide uppercase ${owned ? "text-emerald-400" : "text-white"}`}>
                          {bp.name}
                        </h4>
                        {!owned && (
                          <span className="text-cyan-400 text-[10px] font-bold shrink-0">
                            {cost} CR
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-normal line-clamp-2">
                        {bp.description}
                      </p>
                      <div className="text-[8px] text-neutral-500 uppercase font-bold flex flex-wrap gap-x-2">
                        <span>Fuel: {bp.fuelCost}</span>
                        <span>Heat: +{bp.heatGenerated}</span>
                        <span className="text-yellow-500">Requires: {bp.materials.map(m => `${m.qty}x ${ITEM_TEMPLATES[m.type]?.name || m.type}`).join(", ")}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (owned) return;
                        buyBlueprint(bp);
                      }}
                      disabled={owned || !isAffordable}
                      className={`mt-2.5 w-full py-1.5 px-3 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        owned
                          ? "bg-emerald-950/40 text-emerald-500/80 border border-emerald-500/30 cursor-default"
                          : isAffordable
                          ? "bg-cyan-500 hover:bg-cyan-400 text-black shadow-md active:scale-[0.98]"
                          : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                      }`}
                    >
                      <Cpu size={11} />
                      {owned ? "OWNED / SYNCED" : isAffordable ? "Buy Schematic" : "Insufficient Credits"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Separator */}
      <div className="flex items-center gap-3 py-2">
        <div className="h-[1px] bg-neutral-800 flex-grow" />
        <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold select-none">
          CANTINA INFORMANT NETWORKS & RECRUITMENT
        </span>
        <div className="h-[1px] bg-neutral-800 flex-grow" />
      </div>

      {/* Silhouettes / Informants grid selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {visitorsList.map((p) => {
          const isSelected = selectedVisitorId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                AudioEngine.playBeep(600, 0.05);
                setSelectedVisitorId(p.id);
              }}
              className={`p-4 border text-left rounded cursor-pointer transition relative group flex flex-col justify-between min-h-[160px] shadow-lg ${
                isSelected 
                  ? "border-current bg-current/10 " + themeTextClass 
                  : "border-neutral-800 hover:border-current/40 bg-neutral-950/40"
              }`}
            >
              {/* Silhouette Glowing Wireframe Header */}
              <div className="flex justify-between items-start w-full">
                <span className="text-2xl select-none filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                  {p.avatarIcon}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded border border-neutral-800 uppercase bg-neutral-900 font-bold select-none">
                  ONLINE
                </span>
              </div>

              {/* Character Silhouette name card */}
              <div className="space-y-1 mt-6">
                <span className="text-[9px] uppercase font-bold text-neutral-500 block leading-tight">
                  {p.role}
                </span>
                <h4 className="text-sm font-bold text-white tracking-wide leading-none group-hover:text-yellow-400 transition">
                  {p.name}
                </h4>
                <p className="text-[10px] text-neutral-400 leading-snug mt-1.5 line-clamp-2">
                  {p.description}
                </p>
              </div>

              <div className="absolute bottom-2 right-2 text-[8px] opacity-0 group-hover:opacity-100 transition text-yellow-400">
                CLICK TO INTERACT
              </div>
            </button>
          );
        })}
      </div>

      {/* Active interaction panel based on selection */}
      {selectedVisitor && (
        <div className="border border-current/30 p-4 bg-black/90 rounded shadow-2xl relative min-h-[220px] flex flex-col justify-between">
          <button
            onClick={() => {
              AudioEngine.playBeep(300, 0.1);
              setSelectedVisitorId(null);
            }}
            className="absolute top-3 right-3 text-neutral-500 hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>

          {/* 1. INFORMANT MODAL: Buy Coordinates */}
          {selectedVisitor.type === "informant" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                👤 {selectedVisitor.name} — {selectedVisitor.role}
              </h3>
              <p className="text-[11px] leading-relaxed max-w-3xl opacity-90">
                "Want to trade high-end cargo without those annoying Hegemony tariff tax scans? For a flat fee of <strong className="text-yellow-400">250 Credits</strong>, I'll splice into the local subspace relay network and transmit the coordinates to a hidden smuggler depot hidden deep within the asteroid belts."
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {hasBlackMarketCoords ? (
                  <div className="flex items-center gap-2 text-purple-400 border border-purple-500/30 p-3 rounded bg-purple-950/10 w-full sm:w-auto">
                    <Check size={18} />
                    <div>
                      <div className="font-bold">COORDINATES SECURED</div>
                      <div className="text-[9px] text-neutral-400">Smuggler networks are unlocked on your galactic star grid.</div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleBuyCoordinates}
                    className="px-5 py-3 border border-purple-500 bg-purple-950/20 hover:bg-purple-500 hover:text-black font-bold text-xs rounded transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Compass size={14} /> PURCHASE BLACK MARKET COORDINATES (250 Credits)
                  </button>
                )}
                <div className="text-[10px] text-neutral-400 italic leading-snug">
                  *Unlocking coordinate matrices grants direct commerce lines to smuggled heavy goods, but exposes you to space pirates.
                </div>
              </div>
            </div>
          )}

          {/* 2. SYNDICATE MODAL: Local Missions & Campaigns */}
          {selectedVisitor.type === "syndicate" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                👥 {selectedVisitor.name} — {selectedVisitor.role}
              </h3>

              {selectedVisitor.specialQuest ? (() => {
                const quest = selectedVisitor.specialQuest;
                const isAlreadyAccepted = activeQuests.some((q) => q.title === quest.title);

                return (
                  <div className="space-y-3">
                    <p className="text-[11px] leading-relaxed max-w-3xl opacity-90">
                      "I offer a high-priority, multi-step campaign contract: <strong className="text-red-400">{quest.title}</strong>. {quest.description}"
                    </p>
                    <div className="p-3 border border-red-500/20 bg-red-950/10 rounded space-y-2">
                      <div className="flex justify-between items-center border-b border-red-500/10 pb-1.5">
                        <span className="font-bold text-red-400 text-xs">EPIC CAMPAIGN CONFLICT DETAILS</span>
                        <span className="text-[9px] text-yellow-500 font-bold">Reward: {quest.rewardCredits} CR</span>
                      </div>
                      <div className="text-[10px] text-neutral-400 space-y-1">
                        <p>• Steps count: <span className="text-white font-bold">{quest.steps.length} Sectors</span></p>
                        <p>• Target start sector: <span className="text-white font-bold">[X:{quest.steps[0].x - 4}, Y:{quest.steps[0].y - 4}]</span></p>
                        {quest.ultimateRewardWeapon && (
                          <p>• Ultimate weapon drop reward: <span className="text-cyan-400 font-bold">{(WEAPON_ITEMS as Record<string, any>)[quest.ultimateRewardWeapon]?.name || quest.ultimateRewardWeapon}</span></p>
                        )}
                        {quest.ultimateRewardComponent && (
                          <p>• Ultimate component chassis reward: <span className="text-amber-400 font-bold">{(COMPONENT_ITEMS as Record<string, any>)[quest.ultimateRewardComponent]?.name || quest.ultimateRewardComponent}</span></p>
                        )}
                      </div>
                      <div className="pt-2">
                        {isAlreadyAccepted ? (
                          <span className="text-[10px] px-3 py-1.5 border border-green-500/30 text-green-400 bg-green-950/10 rounded font-bold uppercase select-none inline-block">
                            ✓ ACTIVE CAMPAIGN
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              AudioEngine.playBeep(1100, 0.25, "sine");
                              if (onAcceptQuest) onAcceptQuest(quest);
                            }}
                            className="px-4 py-2 border border-red-500 text-red-400 bg-red-950/20 hover:bg-red-500 hover:text-black font-bold text-xs rounded transition cursor-pointer"
                          >
                            ACCEPT CAMPAIGN CONTRACT
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="space-y-3">
                  <p className="text-[11px] leading-relaxed max-w-3xl opacity-90">
                    "The local trade and defense agencies are seeking reliable starships to secure sectors, deliver crucial packages, or escort political envoys. Check active station contracts below:"
                  </p>

                  <div className="pt-2 space-y-2 max-h-[220px] overflow-y-auto pr-2">
                    {activeSector?.station?.missionBoard && activeSector.station.missionBoard.length > 0 ? (
                      activeSector.station.missionBoard.map((mission, idx) => {
                        const isAlreadyAccepted = (activeMissions || []).some((m) => m.id === mission.id || m.title === mission.title);

                        return (
                          <div 
                            key={idx}
                            className="p-3 border border-neutral-800 rounded bg-neutral-950/40 hover:bg-neutral-900/60 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-xs">{mission.title}</span>
                                <span className="text-[8px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider font-mono bg-red-950 text-red-400 border border-red-500/20">
                                  {mission.type.toUpperCase()}
                                </span>
                                <span className="text-[8px] text-cyan-400 font-mono">
                                  Target Destination: Sector [X:{mission.targetSector.x - 4}, Y:{mission.targetSector.y - 4}]
                                </span>
                              </div>
                              <p className="text-[10px] text-neutral-400">
                                Sponsor: <strong className="text-neutral-300">{(mission.faction && mission.faction !== "neutral") ? mission.faction.toUpperCase() : "Independent Merchant"}</strong> | Contract payoff: <strong className="text-yellow-400">{mission.reward} Credits</strong>
                              </p>
                              <p className="text-[9px] text-neutral-500 italic max-w-2xl">{mission.desc}</p>
                            </div>

                            {isAlreadyAccepted ? (
                              <span className="text-[9px] px-3 py-1.5 border border-green-500/30 text-green-400 bg-green-950/10 rounded font-bold uppercase select-none shrink-0">
                                ✓ ACTIVE CONTRACT
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  AudioEngine.playBeep(1100, 0.25, "sine");
                                  onAcceptMission(mission);
                                }}
                                className="px-3 py-1.5 border border-red-500 text-red-400 bg-red-950/15 hover:bg-red-500 hover:text-black font-bold text-[10px] rounded transition cursor-pointer shrink-0"
                              >
                                ACCEPT CONTRACT
                              </button>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-neutral-500 italic py-4 text-center">
                        No active sector contracts currently listed on this station bulletin.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. MERCENARY MODAL: Escort Wingmen */}
          {selectedVisitor.type === "mercenary" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                🚀 {selectedVisitor.name} — {selectedVisitor.role}
              </h3>
              <p className="text-[11px] leading-relaxed max-w-3xl opacity-90">
                {selectedVisitor.description || "Commands an active wingman vessel. Available to fly auxiliary support on warp hops."}
              </p>

              {(() => {
                const cand = selectedVisitor.wingmanCandidate || wingmanHiringCandidates[0];
                const isHired = wingmen.some((w) => w.name === cand.name);
                const canAfford = credits >= cand.cost;

                return (
                  <div className="p-3 border border-cyan-500/20 bg-cyan-950/10 rounded space-y-2 mt-2">
                    <div className="flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white text-xs">{cand.name}</span>
                        <span className="text-[9px] text-cyan-400 font-mono font-bold block uppercase">{cand.shipType}</span>
                      </div>
                      <span className="font-bold text-yellow-400 text-xs flex items-center gap-1 bg-black/40 px-2 py-1 rounded">
                        <Coins size={12} /> {cand.cost} CR
                      </span>
                    </div>

                    <div className="text-[10px] text-neutral-400 space-y-1">
                      <p>• Armored Plating: <span className="text-white font-bold">{cand.hp} HP</span> | Kinetic Shields: <span className="text-white font-bold">{cand.shields} SP</span></p>
                      <p>• Combat Firepower Output: <span className="text-cyan-400 font-bold">+{cand.firepower} Damage per turn</span></p>
                      <p>• Fire Control Priority: <strong className="text-neutral-300">Vaporizes enemy {cand.focus} grids</strong></p>
                      <p className="text-yellow-500/90 italic pt-1 font-semibold">★ Contract active for {cand.duration} warp cell coordinates jumps.</p>
                    </div>

                    <div className="pt-2 border-t border-cyan-500/10 flex justify-end">
                      {isHired ? (
                        <span className="text-[9px] px-3 py-1.5 border border-green-500/30 text-green-400 bg-green-950/10 rounded font-bold uppercase select-none">
                          ✓ ACTIVE IN FORMATION
                        </span>
                      ) : (
                        <button
                          onClick={() => handleHireWingman(cand)}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 border rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                            canAfford 
                              ? "border-cyan-500 text-cyan-400 bg-cyan-950/10 hover:bg-cyan-500 hover:text-black" 
                              : "border-neutral-800 text-neutral-600 bg-black cursor-not-allowed"
                          }`}
                        >
                          <UserPlus size={10} /> ENLIST PILOT ESCORT
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 4. SMUGGLER MODAL: Tech */}
          {selectedVisitor.type === "smuggler" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                ⚙️ {selectedVisitor.name} — {selectedVisitor.role}
              </h3>
              <p className="text-[11px] leading-relaxed max-w-3xl opacity-90">
                {selectedVisitor.description || "Acquires prototype technology modules and weapon grids bypassing official planetary tariffs."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 max-h-[220px] overflow-y-auto pr-2">
                {(() => {
                  const weaponsList = selectedVisitor.smugglerWeapons || [];
                  const componentsList = selectedVisitor.smugglerComponents || [];
                  
                  const items = [
                    ...weaponsList.map(id => {
                      const details = (WEAPON_ITEMS as Record<string, any>)[id] || {};
                      return {
                        id,
                        name: details.name || id.replace(/_/g, " ").toUpperCase(),
                        type: "weapon" as const,
                        cost: details.cost || 750,
                        desc: details.desc || "Classified custom armaments core."
                      };
                    }),
                    ...componentsList.map(id => {
                      const details = (COMPONENT_ITEMS as Record<string, any>)[id] || {};
                      return {
                        id,
                        name: details.name || id.replace(/_/g, " ").toUpperCase(),
                        type: "component" as const,
                        cost: details.cost || 500,
                        desc: details.desc || "Unlicensed high-performance reactor frame."
                      };
                    })
                  ];

                  const itemsToDisplay = items.length > 0 ? items : smugglerTechCandidates;

                  return itemsToDisplay.map((tech) => {
                    const alreadyOwned = tech.type === "component" 
                      ? ownedComponents.includes(tech.id)
                      : inventoryWeapons.includes(tech.id);
                    const canAfford = credits >= tech.cost;

                    return (
                      <div 
                        key={tech.id}
                        className="p-3 border border-neutral-800 rounded bg-neutral-950/40 flex flex-col justify-between min-h-[120px]"
                      >
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white text-xs">{tech.name}</span>
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 font-bold border border-neutral-800 uppercase font-mono tracking-wider">
                              {tech.type === "component" ? "MODULE" : "WEAPON"}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-400 leading-normal">
                            {tech.desc}
                          </p>
                        </div>

                        <div className="pt-2 flex justify-between items-center border-t border-neutral-900 mt-2">
                          <span className="font-bold text-yellow-400 text-xs flex items-center gap-1">
                            <Coins size={12} /> {tech.cost} CR
                          </span>

                          {alreadyOwned ? (
                            <span className="text-[9px] px-2.5 py-1 border border-green-500/30 text-green-400 bg-green-950/10 rounded font-bold uppercase select-none">
                              ✓ SECURED IN ARSENAL
                            </span>
                          ) : (
                            <button
                              onClick={() => handleBuySmugglerTech(tech)}
                              disabled={!canAfford}
                              className={`px-3 py-1 border rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                canAfford 
                                  ? "border-yellow-500 text-yellow-500 bg-yellow-950/10 hover:bg-yellow-500 hover:text-black" 
                                  : "border-neutral-800 text-neutral-600 bg-black cursor-not-allowed"
                              }`}
                            >
                              <Wrench size={10} /> PURCHASE PROTOTYPE
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Exit bar page action */}
      <footer className="pt-2 border-t border-neutral-900 flex justify-between select-none">
        <button
          onClick={() => {
            AudioEngine.playBeep(200, 0.2, "sawtooth");
            onAttackStation();
          }}
          disabled={activeSector?.station?.destroyed}
          className={`px-4 py-2 border border-red-500 text-red-400 bg-red-950/20 hover:bg-red-500 hover:text-black font-bold rounded text-xs transition cursor-pointer ${activeSector?.station?.destroyed ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {activeSector?.station?.destroyed ? "STATION DESTROYED" : "ATTACK STATION"}
        </button>
        <button
          onClick={() => {
            AudioEngine.playBeep(350, 0.1);
            onClose();
          }}
          className="px-4 py-2 border border-current text-current bg-current/5 hover:bg-current/15 font-bold rounded text-xs transition cursor-pointer"
        >
          DISMISS CANTINA BAR
        </button>
      </footer>
    </section>
  );
};
