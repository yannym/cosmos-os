/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Position,
  CrewMember,
  CargoSlot,
  GalaxyCell,
  CombatState,
  Enemy,
  Mission,
  Quest,
  Station,
  Caravan,
  RecruitCandidate,
  Wingman,
  CantinaVisitor,
  TelemetryData,
  VoidWaypoint,
  SectorShip,
  Beacon
} from "./types";
import { generateInitialSectorShips } from "./utils/shipGenerator";
import {
  ITEM_TEMPLATES,
  SHIPS_BLUEPRINTS,
  WEAPON_ITEMS,
  COMPONENT_ITEMS,
  PLANET_SUBCLASSES,
  FACTIONS,
  STAR_SYSTEMS_PROFILES,
  STORY_QUESTS_CAMPAIGNS,
  BLUEPRINTS
} from "./constants";
import { AudioEngine } from "./audio";
import { DeathScreen } from "./components/DeathScreen";
import { MainMenu } from "./components/MainMenu";
import { ClassSelection } from "./components/ClassSelection";
import { Diagnostics } from "./components/Diagnostics";
import { StarMap } from "./components/StarMap";
import { EquipmentDeck } from "./components/EquipmentDeck";
import { CargoHold } from "./components/CargoHold";
import { CrewLounge } from "./components/CrewLounge";
import { HUDLogs } from "./components/HUDLogs";
import { CombatArena } from "./components/CombatArena";
import { HologramShipyard } from "./components/HologramShipyard";
import { SpaceportMarket } from "./components/SpaceportMarket";
import { CaravanMarket } from "./components/CaravanMarket";
import { ReputationScreen } from "./components/ReputationScreen";
import { StarSystemMap } from "./components/StarSystemMap";
import { MiningFrequencyMiniGame } from "./components/MiningFrequencyMiniGame";
import { MiningScanner } from "./components/MiningScanner";
import { StationBar } from "./components/StationBar";
import { FlightTelemetry } from "./components/FlightTelemetry";
import { SectorCommsPanel } from "./components/SectorCommsPanel";
import { ShipDeckView } from "./components/ShipDeckView";
import { LongRangeScanner } from "./components/LongRangeScanner";
import {
  Shield,
  Coins,
  Compass,
  Crosshair,
  Activity,
  Skull,
  User,
  Gauge,
  Atom,
  SatelliteDish,
  Terminal,
  MapPin,
  Sparkles,
  HelpCircle,
  FolderLock,
  AlertTriangle,
  ShieldOff,
  Zap,
  Volume2,
  VolumeX
} from "lucide-react";

const MILESTONE_ABILITIES_POOL: Record<string, { id: string; name: string; desc: string; perkText: string }[]> = {
  "Pilot": [
    { id: "evasion_mastery", name: "Slipstream Deflect", desc: "Permanent +10% standard evasion rate.", perkText: "+10% Evasion" },
    { id: "fuel_saving", name: "Slingshot Navigation", desc: "Fuel consumption rate reduced by 25%.", perkText: "-25% Fuel Used" },
    { id: "counter_flare", name: "Thermal Flares", desc: "Chance to deflect hostile torpedo volleys increased by 20%.", perkText: "+20% Deflect Chance" },
  ],
  "Weapons Specialist": [
    { id: "double_tap", name: "Double Tap Overdrive", desc: "25% chance to get an extra shot on weapons.", perkText: "25% Multi-Shot" },
    { id: "armor_piercing", name: "Titanium Coring", desc: "+20% armor penetration damage on hulls.", perkText: "+20% Hull Damage" },
    { id: "shield_burst", name: "EMP Resonance", desc: "Energy weapons deplete 1.5x shields.", perkText: "1.5x Shield Damage" },
  ],
  "Science Director": [
    { id: "deep_scanner", name: "Deep Sensor Matrix", desc: "Scanner reveals 5x5 sub-space coordinates passive grids.", perkText: "5x5 Scanner Range" },
    { id: "anomaly_boost", name: "Subspace Resonance", desc: "Yields 50% extra credits and research from anomaly scans.", perkText: "+50% Anomaly Loot" },
    { id: "hull_scan", name: "Weakpoint Diagnostic", desc: "Crit chance on targeted weakpoints increased by 15%.", perkText: "+15% Weakpoint Crit" },
  ],
  "Miner": [
    { id: "laser_boost", name: "Carbon-Bore Laser", desc: "+3 base mining extraction yields per planet mine.", perkText: "+3 Mining Yield" },
    { id: "fuel_drill", name: "Plasma Friction Core", desc: "Mining planets does not consume ship fuel.", perkText: "0 Fuel Mining" },
    { id: "ore_refinement", name: "Quantum Purifier", desc: "+30% credits when selling rare mined ores to markets.", perkText: "+30% Ore Sale CR" },
  ],
  "Cargo Manager": [
    { id: "compact_bay", name: "Sub-space Compression", desc: "+5 maximum ship cargo capacity spaces.", perkText: "+5 Cargo Slots" },
    { id: "bribe_override", name: "Cargo Spoof Protocol", desc: "Bypasses all planetary custom guards and scans.", perkText: "Immune to Customs Scans" },
    { id: "bargain_ledger", name: "Syndicate Discount", desc: "All shop item commodities are 15% cheaper.", perkText: "-15% Trade Prices" },
  ],
  "Spy": [
    { id: "cloak_shield", name: "Warp Cloak Generator", desc: "Ambush and pirate interception rates cut by 50%.", perkText: "-50% Ambush Rates" },
    { id: "reputation_spoof", name: "Heuristic Signature Key", desc: "Bypasses all reputation blocks in equipment depots.", perkText: "Reputation Unlocked" },
    { id: "sensor_scramble", name: "Acoustic Countermeasure", desc: "First QTE deflect during combat has 40% wider zone.", perkText: "Wider QTE Zone" },
  ]
};

interface LogEntry {
  text: string;
  category: "normal" | "danger" | "success" | "info" | "loot";
}

export default function App() {
  // --- SYSTEM STATES ---
  const [currentSystemIndex, setCurrentSystemIndex] = useState<number>(2); // Start in Proxima Centauri
  const [credits, setCredits] = useState<number>(1500);
  const [fuel, setFuel] = useState<number>(40.0);
  const [hull, setHull] = useState<number>(80);
  const [shields, setShields] = useState<number>(60);
  const [activeShip, setActiveShip] = useState<string>("interceptor");
  const [position, setPosition] = useState<Position>({ x: 4, y: 4 }); // Start at a station
  const [previousPosition, setPreviousPosition] = useState<Position>({ x: 3, y: 4 });
  const [isDocked, setIsDocked] = useState<boolean>(true);
  const [dockedStation, setDockedStation] = useState<Station | null>(null);
  const [showDockingWelcome, setShowDockingWelcome] = useState<boolean>(true);
  const [activeBuffs, setActiveBuffs] = useState<Record<string, { amount: number; remainingJumps: number; drinkName: string }>>({});


  // Inventory & Customization
  const [cargo, setCargo] = useState<CargoSlot[]>([
    { type: "scrap", qty: 2 },
    { type: "torpedo", qty: 5 },
    { type: "food", qty: 1 },
    { type: "beacon", qty: 2 },
    { type: "contraband", qty: 5 },
    { type: "shieldcore", qty: 5 }
  ]);
  const [equippedWeapons, setEquippedWeapons] = useState<(string | null)[]>(["pulse_laser", null]);
  const [inventoryWeapons, setInventoryWeapons] = useState<string[]>(["pulse_laser", "torpedo_launcher"]);
  const [fittedComponents, setFittedComponents] = useState<Record<string, string>>({
    shield: "shield_standard",
    hull: "hull_standard",
    engine: "engine_standard",
    scanner: "scanner_standard",
    cargo: "cargo_standard",
    mining: "mining_standard",
    heat: "heat_core"
  });
  const [ownedComponents, setOwnedComponents] = useState<string[]>([]);
  const [ownedBlueprints, setOwnedBlueprints] = useState<string[]>(["bp_pulse_laser_mk2", "bp_nanobots"]);
  const [activeCraftingBpId, setActiveCraftingBpId] = useState<string | null>(null);
  const [craftingTimeLeft, setCraftingTimeLeft] = useState<number>(0);
  const [isAutoCrafting, setIsAutoCrafting] = useState<boolean>(false);
  const [autoCraftingBpId, setAutoCraftingBpId] = useState<string | null>(null);

  // Crew & Diplomacy
  const [crew, setCrew] = useState<CrewMember[]>([
    {
      id: "crew_1",
      name: "Karl Thorne",
      role: "Pilot",
      exp: 12,
      level: 1,
      perk: "Thrust Vectoring (+5% Evasion)"
    }
  ]);
  const [wingmen, setWingmen] = useState<Wingman[]>([]);
  const [voidWaypoints, setVoidWaypoints] = useState<VoidWaypoint[]>([]);
  const [droppedBeacons, setDroppedBeacons] = useState<Beacon[]>([
    {
      id: "beacon_heg_pre",
      name: "Hegemony Garrison Beacon",
      x: 1,
      y: 8,
      systemIndex: 0,
      frequency: "144.8 MHz",
      isCustom: false
    },
    {
      id: "beacon_synd_pre",
      name: "Syndicate Deep-Void Echo",
      x: 6,
      y: 2,
      systemIndex: 1,
      frequency: "312.5 MHz",
      isCustom: false
    }
  ]);
  const [localWaypoint, setLocalWaypoint] = useState<{ x: number; y: number; name: string } | null>(null);
  const [isWarpJumping, setIsWarpJumping] = useState<boolean>(false);
  const [warpJumpCountdown, setWarpJumpCountdown] = useState<number>(0);
  const [warpJumpTargetWaypoint, setWarpJumpTargetWaypoint] = useState<VoidWaypoint | null>(null);
  const [backupFuel, setBackupFuel] = useState<number>(100);
  const [impulseTarget, setImpulseTarget] = useState<{ x: number; y: number } | null>(null);
  const [isHeatBuffActive, setIsHeatBuffActive] = useState<boolean>(false);
  const [isHeatVulnerable, setIsHeatVulnerable] = useState<boolean>(false);
  
  const isDockedRef = useRef(isDocked);

  useEffect(() => {
    if (isDocked && !isDockedRef.current) {
      handleQuicksaveLocal();
      addTerminalLog("AUTO-QUICKSAVE: Docking complete. System state stored.", "info");
    }
    isDockedRef.current = isDocked;
  }, [isDocked]);
  
  const heatBuffRef = useRef(isHeatBuffActive);
  const heatVulnerableRef = useRef(isHeatVulnerable);
  
  useEffect(() => { heatBuffRef.current = isHeatBuffActive; }, [isHeatBuffActive]);
  useEffect(() => { heatVulnerableRef.current = isHeatVulnerable; }, [isHeatVulnerable]);

  const [isGateJumping, setIsGateJumping] = useState<boolean>(false);
  const [gateJumpCountdown, setGateJumpCountdown] = useState<number>(0);
  const [isGateWarping, setIsGateWarping] = useState<boolean>(false);
  const [gateWarpTargetSystemIndex, setGateWarpTargetSystemIndex] = useState<number>(0);
  const [isWormholeTransit, setIsWormholeTransit] = useState<boolean>(false);
  const [reputation, setReputation] = useState<Record<string, number>>({
    hegemony: 0,
    syndicate: 0,
    cult: 0,
    consortium: 0
  });

  // Active Storylines & Active Missions (Contracts)
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
  const [completedMissionsCount, setCompletedMissionsCount] = useState<Record<string, number>>({
    vip: 0,
    haul: 0,
    bounty: 0
  });

  // Milestone Active abilities card selection states
  const [milestoneUpgradeCrew, setMilestoneUpgradeCrew] = useState<CrewMember | null>(null);
  const [milestoneUpgradeCards, setMilestoneUpgradeCards] = useState<{ id: string; name: string; desc: string; perkText: string }[]>([]);

  // Background Anchored Mining Matrix States
  const [isDrilling, setIsDrilling] = useState<boolean>(false);
  const [isAutoMining, setIsAutoMining] = useState<boolean>(false);
  const [drillRemainingUnits, setDrillRemainingUnits] = useState<number>(0);
  const [drillElapsedMs, setDrillElapsedMs] = useState<number>(0);
  const [activeDrillLootType, setActiveDrillLootType] = useState<string>("scrap");

  // --- 4 MECHANICS DEPTH EXPANSIONS ---
  const [powerAllocation, setPowerAllocation] = useState<{ wep: number; sys: number; eng: number }>({
    wep: 3,
    sys: 3,
    eng: 3
  });
  const [drillTargetFrequency, setDrillTargetFrequency] = useState<number>(65);
  const [drillUserFrequency, setDrillUserFrequency] = useState<number>(65);
  const [fatiguedCrew, setFatiguedCrew] = useState<Record<string, number>>({});
  const [expeditionState, setExpeditionState] = useState<{
    active: boolean;
    derelictName: string;
    hazardType: "radiation" | "turrets" | "collapse" | "unknown";
    selectedCrewIds: string[];
    logs: string[];
    status: "idle" | "in_shuttle" | "breaching" | "extracting" | "completed" | "failed";
    progress: number;
    rewardsText?: string;
  }>({
    active: false,
    derelictName: "",
    hazardType: "radiation",
    selectedCrewIds: [],
    logs: [],
    status: "idle",
    progress: 0
  });

  // Grid Galaxy
  const [galaxy, setGalaxy] = useState<GalaxyCell[][]>([]);

  useEffect(() => {
    if (isDocked && galaxy[position.x] && galaxy[position.x][position.y]?.station) {
        setDockedStation(galaxy[position.x][position.y].station);
        setShowDockingWelcome(true);
    }
  }, [isDocked, position, galaxy]);
  const galaxyRef = useRef<GalaxyCell[][]>([]);
  useEffect(() => {
    galaxyRef.current = galaxy;
  }, [galaxy]);
  const gateWarpTimeoutRef = useRef<any>(null);
  const [sectorShips, setSectorShips] = useState<SectorShip[]>(() => generateInitialSectorShips());
  const [mapBounds, setMapBounds] = useState<{ minX: number; maxX: number; minY: number; maxY: number }>({ minX: 0, maxX: 9, minY: 0, maxY: 9 });
  const [hyperdriveOverclocked, setHyperdriveOverclocked] = useState<boolean>(false);
  const [weaponsCalibrated, setWeaponsCalibrated] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [experimentalJumpTarget, setExperimentalJumpTarget] = useState<{ x: number; y: number } | null>(null);

  // Tactical combat states
  const [combatState, setCombatState] = useState<CombatState>({
    active: false,
    enemies: [],
    activeEnemyIndex: 0,
    enemy: null,
    playerTurn: true,
    qteRunning: false,
    qteSpeed: 1.6,
    qtePointerPos: 0,
    qteDirection: 1,
    qteInterval: null,
    zoneCenter: 50,
    zoneDirection: 1,
    zoneSpeed: 0.6,
    targetZoneRange: { start: 40, end: 65 },
    activeWeaponFiring: null,
    selectedWeakPoint: null,
    novaCooldown: 0
  });

  // UI overlays & Settings
  const [activeTheme, setActiveTheme] = useState<"green" | "amber" | "cyan">("green");
  const setTheme = (theme: "green" | "amber" | "cyan") => {
    setActiveTheme(theme);
    AudioEngine.playBeep(400, 0.05);
  };
  const [globalHiringPriceMultiplier, setGlobalHiringPriceMultiplier] = useState<number>(1.0);
  const [showCrewDismissConfirmation, setShowCrewDismissConfirmation] = useState<number | null>(null);
  
  // FX Triggers
  const [shieldHitPulse, setShieldHitPulse] = useState<number>(0);
  const [lastHullDamageTime, setLastHullDamageTime] = useState<number>(0);
  const [isGlitching, setIsGlitching] = useState<boolean>(false);

  // Heat & Stealth Management (Elite Dangerous Style)
  const [heat, setHeat] = useState<number>(0);
  const [isSilentRunning, setIsSilentRunning] = useState<boolean>(false);
  const [isScoopDeployed, setIsScoopDeployed] = useState<boolean>(false);
  const [isDead, setIsDead] = useState<boolean>(false);
  const [deathReason, setDeathReason] = useState<string>("");

  const [activeTab, setActiveTab] = useState<"cockpit" | "map" | "cargo" | "actions" | "shipyard" | "combat" | "market" | "bar" | "deck" | "main_menu" | "class_selection">("main_menu");
  const [selectedStarterClass, setSelectedStarterClass] = useState<"Miner" | "Patrol" | "Explorer" | null>(null);
  const [starterCargoSlots, setStarterCargoSlots] = useState<number>(0);
  const [hasInitializedDock, setHasInitializedDock] = useState(false);

  // Auto-dock to solar station on boot
  useEffect(() => {
    setPosition({x: 4, y: 4});
    setIsDocked(true);
    setHasInitializedDock(true);
    addTerminalLog("SYSTEM INITIALIZED: Docked at Helios Solar Forge for thermal protection.", "success");
  }, []);
  const [isMiningMiniGameOpen, setIsMiningMiniGameOpen] = useState(false);
  const [abandonMissionConfirmOpen, setAbandonMissionConfirmOpen] = useState(false);
  const [miningTargetFreq, setMiningTargetFreq] = useState(0);
  const [scannedYield, setScannedYield] = useState<number | null>(null);
  const [isMiningScannerOpen, setIsMiningScannerOpen] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Reset scanned deposit yield on sector changes
  useEffect(() => {
    setScannedYield(null);
  }, [position]);
  const [recruitmentLoungeOpen, setRecruitmentLoungeOpen] = useState<boolean>(false);
  const [isReputationOpen, setIsReputationOpen] = useState<boolean>(false);
  const [isStarMapOpen, setIsStarMapOpen] = useState<boolean>(false);
  useEffect(() => {
    if (plannedRoute && plannedRoute.length > 0) {
      // Check if we arrived at the next step of the route
      if (plannedRoute.length > 1 && position.x === plannedRoute[1].x && position.y === plannedRoute[1].y) {
        const nextRoute = plannedRoute.slice(1);
        if (nextRoute.length === 1) {
          setPlannedRoute(null); // Arrived at final destination
        } else {
          setPlannedRoute(nextRoute);
        }
      } else if (position.x === plannedRoute[0].x && position.y === plannedRoute[0].y) {
        // We are still at the start of the route, do nothing
      } else {
        // We jumped somewhere off the route.
        setPlannedRoute(null);
      }
    }
  }, [position]);

  const [waypoint, setWaypoint] = useState<number | null>(null);
  const [plannedRoute, setPlannedRoute] = useState<Position[] | null>(null);
  const [isInDeepSpace, setIsInDeepSpace] = useState<boolean>(false);
  const [lastCivilizedSystemIndex, setLastCivilizedSystemIndex] = useState<number>(0);
  const [flickerEnabled, setFlickerEnabled] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => AudioEngine.isMuted());
  const [escMenuOverlay, setEscMenuOverlay] = useState<boolean>(false);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryData[]>([]);

  // Countdown timer overlays
  const [countdownModal, setCountdownModal] = useState<{
    active: boolean;
    title: string;
    desc: string;
    seconds: number;
    maxSeconds: number;
    targetX?: number;
    targetY?: number;
  } | null>(null);

  // --- RE-USE CALCULATIONS ---
  const shipSpecs = SHIPS_BLUEPRINTS[activeShip] || SHIPS_BLUEPRINTS.interceptor;
  const maxHull = shipSpecs.maxHull + getFittedComponentBonus("hull");
  const baseMaxShield = shipSpecs.maxShield + getFittedComponentBonus("shield");
  const maxShield = activeBuffs.shields 
    ? Math.round(baseMaxShield * (1 + activeBuffs.shields.amount)) 
    : baseMaxShield;

  function getFittedComponentBonus(category: string) {
    const fittedId = fittedComponents[category];
    const details = COMPONENT_ITEMS[fittedId];
    return details ? details.bonus : 0;
  }

  function getEvasionBonus() {
    const activeBridgeCrew = crew.filter(c => !(fatiguedCrew[c.id] > 0));
    const pilots = activeBridgeCrew.filter((c) => c.role === "Pilot");
    let baseBonus = pilots.reduce((sum, p) => sum + p.level * 0.05, 0);
    pilots.forEach((p) => {
      if (p.level >= 5) baseBonus += 0.1;
    });
    if (activeBuffs.evasion) {
      baseBonus += activeBuffs.evasion.amount;
    }
    // Reactor Power Allocation engine bonus: -15% at 0 power, +15% at 6 power
    baseBonus += (powerAllocation.eng - 3) * 0.05;

    // Environmental Gas Nebula scrambling bonus (+15% evasion)
    const currentCell = galaxy[position.x]?.[position.y];
    if (currentCell?.hazardType === "ion_nebula") {
      baseBonus += 0.15;
    }

    return baseBonus;
  }

  function getShieldRegenRate() {
    const shieldId = fittedComponents.shield;
    const shieldComponent = shieldId ? COMPONENT_ITEMS[shieldId] : undefined;
    const bonus = shieldComponent ? shieldComponent.bonus : 0;

    let powerScale = 1.0;
    if (powerAllocation.sys === 0) powerScale = 0.0;
    else if (powerAllocation.sys === 1) powerScale = 0.4;
    else if (powerAllocation.sys === 2) powerScale = 0.7;
    else if (powerAllocation.sys === 3) powerScale = 1.0;
    else if (powerAllocation.sys === 4) powerScale = 1.3;
    else if (powerAllocation.sys === 5) powerScale = 1.6;
    else if (powerAllocation.sys === 6) powerScale = 2.0;

    // Check gravity well hazard (shield recharge completely offline)
    const currentCell = galaxy[position.x]?.[position.y];
    if (currentCell?.hazardType === "grav_well") {
      powerScale = 0.0;
    }

    const regenRatePctPerTick = 0.02 * (1 + bonus / 100) * powerScale;
    
    // The tick is 15000 ms (15 seconds), so rate per second is pct / 15 * maxShield.
    return (regenRatePctPerTick * maxShield) / 15;
  }

  function getWarpFuelDiscount() {
    const activeBridgeCrew = crew.filter(c => !(fatiguedCrew[c.id] > 0));
    const pilots = activeBridgeCrew.filter((c) => c.role === "Pilot");
    let discount = 1.0;
    pilots.forEach((p) => {
      if (p.level >= 3) discount -= 0.1;
    });
    const engineBonus = getFittedComponentBonus("engine");
    if (engineBonus > 0) {
      discount *= engineBonus;
    }
    if (hyperdriveOverclocked) {
      discount *= 0.55; // 45% warp jump discount for overclocked FTL
    }
    if (activeBuffs.fuel_discount) {
      discount = Math.max(0.1, discount - activeBuffs.fuel_discount.amount);
    }

    // Engine reactor power grid fuel scaling
    let powerScale = 1.0;
    if (powerAllocation.eng === 0) powerScale = 1.45;
    else if (powerAllocation.eng === 1) powerScale = 1.3;
    else if (powerAllocation.eng === 2) powerScale = 1.15;
    else if (powerAllocation.eng === 3) powerScale = 1.0;
    else if (powerAllocation.eng === 4) powerScale = 0.9;
    else if (powerAllocation.eng === 5) powerScale = 0.8;
    else if (powerAllocation.eng === 6) powerScale = 0.7;
    discount *= powerScale;

    // Environmental hazard scaling
    const currentCell = galaxy[position.x]?.[position.y];
    if (currentCell?.hazardType === "grav_well") {
      discount *= 2.0; // gravity well dragging warp engines
    } else if (currentCell?.hazardType === "ion_nebula") {
      discount *= 1.25; // ionic particle turbulence
    }

    return Math.max(0.15, discount);
  }

  function getWeaponDamageMultiplier() {
    const activeBridgeCrew = crew.filter(c => !(fatiguedCrew[c.id] > 0));
    const weaponsSpec = activeBridgeCrew.filter((c) => c.role === "Weapons Specialist");
    let mult = 1.0 + weaponsSpec.reduce((sum, w) => sum + w.level * 0.05, 0);
    if (activeShip === "assault_gunship") {
      mult += 0.15; // Spectre Gunship Overdrive
    }
    if (activeBuffs.damage) {
      mult += activeBuffs.damage.amount;
    }

    // Weapon power grid scaling
    let powerScale = 1.0;
    if (powerAllocation.wep === 0) powerScale = 0.60;
    else if (powerAllocation.wep === 1) powerScale = 0.75;
    else if (powerAllocation.wep === 2) powerScale = 0.90;
    else if (powerAllocation.wep === 3) powerScale = 1.00;
    else if (powerAllocation.wep === 4) powerScale = 1.15;
    else if (powerAllocation.wep === 5) powerScale = 1.30;
    else if (powerAllocation.wep === 6) powerScale = 1.45;
    mult *= powerScale;

    // Environmental Solar Storm laser amplification (+30% laser friction yield)
    const currentCell = galaxy[position.x]?.[position.y];
    if (currentCell?.hazardType === "solar_flare") {
      mult *= 1.30;
    }

    return mult;
  }

  function getCargoCapMultiplier() {
    const activeBridgeCrew = crew.filter(c => !(fatiguedCrew[c.id] > 0));
    const shipB = SHIPS_BLUEPRINTS[activeShip] || SHIPS_BLUEPRINTS.interceptor;
    const managers = activeBridgeCrew.filter((c) => c.role === "Cargo Manager");
    let bonusSlots = managers.reduce((sum, m) => sum + m.level * 2, 0);
    managers.forEach((m) => {
      if (m.level >= 3) bonusSlots += 4;
    });
    const cargoBonus = getFittedComponentBonus("cargo");
    return shipB.cargoSlots + bonusSlots + cargoBonus + starterCargoSlots;
  }

  function getMinerEfficiency() {
    const activeBridgeCrew = crew.filter(c => !(fatiguedCrew[c.id] > 0));
    const miners = activeBridgeCrew.filter((c) => c.role === "Miner");
    let eff = 1 + miners.reduce((sum, m) => sum + (m.level - 1), miners.length);
    if (activeBuffs.mining) {
      eff += activeBuffs.mining.amount;
    }
    return eff;
  }

  function getAmbushReduction() {
    const activeBridgeCrew = crew.filter(c => !(fatiguedCrew[c.id] > 0));
    const spies = activeBridgeCrew.filter((c) => c.role === "Spy");
    return spies.reduce((sum, s) => sum + 0.15, 0);
  }

  function countCargoItem(itemKey: string) {
    return cargo.reduce((sum, slot) => {
      return slot.type === itemKey ? sum + slot.qty : sum;
    }, 0);
  }

  // --- GAMEPLAY TRIGGERS & ENGINE INITIALIZERS ---
  useEffect(() => {
    // Esc menu keyboard binding
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isDead) {
          setIsDead(false);
          setDeathReason("");
          setActiveTab("main_menu");
        } else {
          setEscMenuOverlay((prev) => !prev);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Telemetry references for the interval logger
  const fuelRef = useRef(fuel);
  const hullRef = useRef(hull);
  const heatRef = useRef(heat);
  useEffect(() => { fuelRef.current = fuel; }, [fuel]);
  useEffect(() => { hullRef.current = hull; }, [hull]);
  useEffect(() => { heatRef.current = heat; }, [heat]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry(prev => {
        const next = [...prev, { time: Date.now(), fuel: fuelRef.current, hull: hullRef.current, heat: heatRef.current }];
        if (next.length > 20) return next.slice(next.length - 20);
        return next;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // --- DAMAGE FX TRIGGERS ---
  const prevShieldsRef = useRef(shields);
  const prevHullRef = useRef(hull);

  useEffect(() => {
    if (shields < prevShieldsRef.current) {
      setShieldHitPulse(Date.now());
      setIsGlitching(true);
      AudioEngine.playBeep(200, 0.1, "sawtooth");
      setTimeout(() => setShieldHitPulse(0), 400);
      setTimeout(() => setIsGlitching(false), 200);
      
      if (shields <= 0 && prevShieldsRef.current > 0) {
        AudioEngine.playShieldDown();
        addTerminalLog("CRITICAL: SHIELDS DEPLETED!", "danger");
      }
    } else if (shields > prevShieldsRef.current && prevShieldsRef.current <= 0) {
      AudioEngine.playShieldUp();
    }
    prevShieldsRef.current = shields;
  }, [shields]);

  useEffect(() => {
    if (hull < prevHullRef.current) {
      setLastHullDamageTime(Date.now());
      setIsGlitching(true);
      AudioEngine.playExplosion();
      setTimeout(() => setLastHullDamageTime(0), 500);
      setTimeout(() => setIsGlitching(false), 300);
      
      if (hull < maxHull * 0.25) {
        AudioEngine.playCriticalAlarm();
      }
    }
    prevHullRef.current = hull;
  }, [hull]);

  // --- HEAT MANAGEMENT LOOP ---
  useEffect(() => {
    if (activeTab === "main_menu") return;
    const timer = setInterval(() => {
      let delta = -1.2; // Passive cooling
      
      if (heatBuffRef.current) {
        setHeat(0);
        return;
      }
      
      if (heatVulnerableRef.current) {
        delta += 4.0; // Rapid heating
      }
      
      if (isSilentRunning) {
        delta = 3.6; // Rapid heat buildup when radiators closed
      }
      
      // Heat from proximity to star
      const currentCell = galaxyRef.current[position.x]?.[position.y];
      if (currentCell?.hasStar) {
        if (isDocked) {
          delta = -6.0; // Rapid cooling/protection when docked at solar station
        } else {
          delta += 0.8; // Ambient system heat
          
          // Central solar core sector coordinate offset 0,0 is x === 4, y === 4
          if (position.x === 4 && position.y === 4) {
            delta += 12.0; // Raise heat rapidly in the solar core
            if (Math.random() < 0.6) {
              AudioEngine.playSolarRadiationHum();
            }
          }

          if (isScoopDeployed) {
            delta += 8.4;
            setFuel(f => Math.min(shipSpecs.maxFuel, f + 0.3));
            if (Math.random() < 0.8) {
              AudioEngine.playSolarRadiationHum();
            }
          }
        }
      }

      setHeat(prev => {
        const nextHeat = Math.max(0, Math.min(100, prev + delta));
        
        // Handle critical heat damage inside the interval to prevent feedback loops
        if (nextHeat > 90 && Math.random() < 0.3) {
          addTerminalLog("⚠️ CRITICAL HEAT DAMAGE! Structural integrity failing!", "danger");
          setHull(h => {
             const nextHull = Math.max(0, h - 2);
             if (nextHull <= 0) setDeathReason("Extreme thermal overload. Ship hull melted into slag.");
             return nextHull;
          });
          AudioEngine.playGlitchHit();
        }

        return nextHeat;
      });
      
    }, 2000);
    return () => clearInterval(timer);
  }, [isSilentRunning, isScoopDeployed, position, isDocked, shipSpecs.maxFuel, activeTab]);

  // --- AUDIO ALARMS LOOP ---
  useEffect(() => {
    if (isDead) return;
    const timer = setInterval(() => {
      const hullPct = (hull / maxHull) * 100;
      if (heat > 95 || hullPct < 5) {
        AudioEngine.playCriticalAlarm();
      } else if (heat > 80 || hullPct < 15) {
        AudioEngine.playAlarm();
      }
    }, 2000); // Check every 2s for audio alarms to save some cycles
    return () => clearInterval(timer);
  }, [heat, hull, isDead, maxHull]);

  const checkMalfunction = () => {
    const hp = (hull / maxHull) * 100;
    if (hp < 10 && Math.random() < 0.25) {
      addTerminalLog("⚠️ SYSTEM MALFUNCTION: Logic gate failure. Command discarded.", "danger");
      AudioEngine.playBeep(200, 0.1, "sawtooth");
      return true;
    }
    return false;
  };

  function addTerminalLog(text: string, category: "normal" | "danger" | "success" | "info" | "loot" = "normal") {
    setLogs((prev) => {
      if (prev.length > 0) {
        const lastLog = prev[prev.length - 1];
        // Strip out previous multipliers like " (x3)" at the end to check base text
        const baseText = lastLog.text.replace(/ \(x\d+\)$/, '');
        if (baseText === text && lastLog.category === category) {
          const match = lastLog.text.match(/ \(x(\d+)\)$/);
          const count = match ? parseInt(match[1]) + 1 : 2;
          const next = [...prev];
          next[next.length - 1] = { ...lastLog, text: `${baseText} (x${count})` };
          return next;
        }
      }
      const next = [...prev, { text, category }];
      if (next.length > 50) return next.slice(next.length - 50);
      return next;
    });
  }

  useEffect(() => {
    setIsDocked(false);
    if (activeTab === "market" || activeTab === "caravan_market" || activeTab === "shipyard" || activeTab === "bar") {
      setActiveTab("cockpit");
    }
    // Decrement and clear expired active buffs
    setActiveBuffs((prev) => {
      const next: Record<string, { amount: number; remainingJumps: number; drinkName: string }> = {};
      let changed = false;
      Object.keys(prev).forEach((key) => {
        const buff = prev[key];
        if (buff.remainingJumps > 1) {
          next[key] = {
            ...buff,
            remainingJumps: buff.remainingJumps - 1,
          };
        } else {
          changed = true;
          addTerminalLog(`[BUFF EXPIRED]: Crew members are no longer under the influence of ${buff.drinkName}.`, "info");
        }
      });
      return Object.keys(next).length === 0 && Object.keys(prev).length === 0 ? prev : next;
    });
  }, [position]);

  const handleExecuteCommand = (rawCmd: string) => {
    const cmd = rawCmd.trim().toLowerCase();
    addTerminalLog(`Executing Terminal command: "${rawCmd}"`, "normal");

    if (cmd === "help") {
      addTerminalLog("--- TERMINAL COMMAND DIRECTORY MANUAL ---", "info");
      addTerminalLog("help - Show this manual", "info");
      addTerminalLog("scan - Run a comprehensive sensor scan of the current sector", "info");
      addTerminalLog("status - Print out central starship capacities, crew, and loadouts", "info");
      addTerminalLog("cheat rich - Obtain 50,000 CR ledger balances instantly", "info");
      addTerminalLog("cheat kill - Obtain highly destructive Pulse Laser Cannon MK5 in cargo inventory", "info");
      addTerminalLog("cheat king - Recruits a random legend (Level 10) elite crew member", "info");
      return;
    }

    if (cmd === "scan" || cmd === "scan sector") {
      addTerminalLog("--- CORE SECTOR SENSOR READOUT ---", "info");
      addTerminalLog(`Coordinates Matrix: [X:${position.x - 4}, Y:${position.y - 4}]`, "info");
      if (activeSector) {
        addTerminalLog(`Faction Sovereignty: ${FACTIONS[activeSector.faction]?.name || "Neutral Void"}`, "info");
        addTerminalLog(`Ambush Risk Metric: ${(activeSector.hostileChance * 100).toFixed(0)}%`, "info");
        if (activeSector.planet) {
          addTerminalLog(`Celestial Body Detected: ${activeSector.planet.name} (${activeSector.planet.type})`, "success");
          addTerminalLog(` -> Resource Node: ${activeSector.planet.resourceNode.type.toUpperCase()} (Units Remaining: ${activeSector.planet.resourceNode.amount})`, "success");
        } else {
          addTerminalLog("Celestial Body: NONE detected in active planetary range.", "info");
        }
        if (activeSector.station) {
          addTerminalLog(`Starbase Facility Linked: ${activeSector.station.name} (${activeSector.station.techTitle})`, "success");
        }
        if (activeSector.anomaly) {
          addTerminalLog(`Subspace Quantum Anomaly: ${activeSector.anomaly.name} (Exhausted: ${activeSector.anomaly.exhausted ? "YES" : "NO"})`, "danger");
        }
      }
      AudioEngine.playBeep(900, 0.15, "sine");
      return;
    }

    if (cmd === "status" || cmd === "ship status") {
      addTerminalLog("--- CENTRAL SHIP STATUS MANIFEST ---", "info");
      addTerminalLog(`Active Vessel Frame: ${shipSpecs.name.toUpperCase()}`, "info");
      addTerminalLog(`Integrity Hull: ${hull}/${maxHull} HP`, "info");
      addTerminalLog(`Defensive Shields: ${shields}/${maxShield} SP`, "info");
      addTerminalLog(`Warp Fuel Cores: ${fuel}/${shipSpecs.maxFuel} Units`, "info");
      addTerminalLog(`Bridge Crew Complement: ${crew.length}/${shipSpecs.maxCrew}`, "info");
      crew.forEach(c => {
        addTerminalLog(` -> ${c.name} (Rank ${c.level} ${c.role}) - Perk: ${c.perk}`, "info");
      });
      addTerminalLog(`Equipped Offensive Hardpoints: ${equippedWeapons.filter(Boolean).length} Active Laser Splicers`, "info");
      AudioEngine.playBeep(900, 0.15, "sine");
      return;
    }

    if (cmd === "cheat rich") {
      setCredits((cr) => cr + 50000);
      addTerminalLog("CHEAT TRIGGERED: Credited +50,000 CR onto secure quantum account ledger.", "success");
      AudioEngine.playBeep(880, 0.25, "sine");
      return;
    }

    if (cmd === "cheat kill") {
      setInventoryWeapons((prev) => [...prev, "pulse_laser_mk5"]);
      addTerminalLog("CHEAT TRIGGERED: Acquired exotic 'Pulse Laser Cannon MK5' (One-Of-A-Kind) in drydock cargo hold!", "success");
      AudioEngine.playBeep(1100, 0.3, "sine");
      return;
    }

    if (cmd === "cheat king") {
      if (crew.length >= shipSpecs.maxCrew) {
        addTerminalLog("CHEAT FAILURE: Bridge berths at peak capacity. Cannot add legendary crew.", "danger");
        AudioEngine.playBeep(220, 0.3, "sawtooth");
        return;
      }
      const names = ["Duke Maximus", "Princess Leia", "Gideon Prime", "Captain Solo", "Sarek of Vulcan", "Commander Shepard"];
      const roles = ["Pilot", "Weapons Specialist", "Science Director", "Miner", "Cargo Manager", "Spy"] as const;
      const pickedName = names[Math.floor(Math.random() * names.length)];
      const pickedRole = roles[Math.floor(Math.random() * roles.length)];
      const perkText = `Elite Royal Officer (+${pickedRole === "Pilot" ? "25% Evasion" : pickedRole === "Weapons Specialist" ? "30% Damage" : "20% Bonus Level stats"})`;
      
      const newCM = {
        id: `crew_${Date.now()}`,
        name: pickedName,
        role: pickedRole,
        exp: 0,
        level: 10,
        perk: perkText
      };
      setCrew((prev) => [...prev, newCM]);
      addTerminalLog(`CHEAT TRIGGERED: Recruited Level 10 Legend ${pickedName} (${pickedRole}) onto the bridge crew!`, "success");
      AudioEngine.playBeep(1200, 0.4, "sine");
      return;
    }

    addTerminalLog(`Command not recognized: "${rawCmd}". Type "help" for a manual list of directives.`, "danger");
    AudioEngine.playBeep(200, 0.2, "sawtooth");
  };

  const addCombatLog = (text: string) => {
    setCombatLog((prev) => [...prev, text]);
  };

  // Build Procedural 10x10 galaxy grid matches system index
  const generateMissionBoard = (sx: number, sy: number, techLvl: number, factionKey: string) => {
    const targets = [
      { x: (sx + 3) % 10, y: (sy + 2) % 10, name: "Vanguard Hub" },
      { x: (sx - 3 + 10) % 10, y: (sy + 4) % 10, name: "Industrial Spindle" },
      { x: (sx + 4) % 10, y: (sy - 3 + 10) % 10, name: "Deep Array" },
      { x: (sx - 4 + 10) % 10, y: (sy - 2 + 10) % 10, name: "Orbital Relay" },
      { x: (sx + 2) % 10, y: (sy + 5) % 10, name: "Asteroid Field" }
    ];

    const completedVip = completedMissionsCount.vip || 0;
    const completedHaul = completedMissionsCount.haul || 0;
    const completedBounty = completedMissionsCount.bounty || 0;

    const vipSkillMult = 1.0 + completedVip * 0.15;
    const haulSkillMult = 1.0 + completedHaul * 0.15;
    const bountySkillMult = 1.0 + completedBounty * 0.15;

    const baseRewards = [
      Math.round(180 * techLvl * (1.0 + (reputation[factionKey] || 0) / 500)),
      Math.round(320 * techLvl * (1.0 + (reputation[factionKey] || 0) / 500)),
      Math.round(450 * techLvl * (1.0 + (reputation[factionKey] || 0) / 500))
    ];
    const list: Mission[] = [];

    // VIP Escort Template pool
    const vipTemplates = [
      {
        title: `${FACTIONS[factionKey]?.name || "Local Faction"} Envoy Escort`,
        desc: (tx: number, ty: number) => `Safely pilot political diplomatic attaches to coordinate vector [X:${tx - 4}, Y:${ty - 4}].`
      },
      {
        title: "Consortium Agent Transport",
        desc: (tx: number, ty: number) => `Deliver a wealthy trade broker safely to Sector [X:${tx - 4}, Y:${ty - 4}] to close a multi-million credit mining lease.`
      },
      {
        title: "Scientific Specialist Transport",
        desc: (tx: number, ty: number) => `Escort chief nanite researcher to Sector [X:${tx - 4}, Y:${ty - 4}] for critical void anomaly containment.`
      },
      {
        title: "High-Profile Refugee Evacuation",
        desc: (tx: number, ty: number) => `Evacuate key civilian leaders from the conflict zone at [X:${tx - 4}, Y:${ty - 4}].`
      }
    ];

    // Payload Haul Template pool
    const haulTemplates = [
      {
        title: "Urgent Siderite Payload Haul",
        desc: (tx: number, ty: number) => `Transport heavy raw ore cores directly to [X:${tx - 4}, Y:${ty - 4}].`
      },
      {
        title: "Military Armaments Transport",
        desc: (tx: number, ty: number) => `Smuggle a heavy crate of high-velocity kinetic rail spikes to the defense outpost at [X:${tx - 4}, Y:${ty - 4}].`
      },
      {
        title: "Cryo-Serum Medical Delivery",
        desc: (tx: number, ty: number) => `Deliver life-saving cryogenic viral vaccines to the quarantine sector at [X:${tx - 4}, Y:${ty - 4}].`
      },
      {
        title: "Industrial Parts Supply Run",
        desc: (tx: number, ty: number) => `Deliver essential replacement circuits to the repair depot at [X:${tx - 4}, Y:${ty - 4}].`
      }
    ];

    // Bounty Template pool
    const bountyTemplates = [
      {
        title: "Tactical Search & Destroy Bounty",
        desc: (tx: number, ty: number) => `Eliminate deep void space pirate fleets raiding sector orbits around [X:${tx - 4}, Y:${ty - 4}].`
      },
      {
        title: "Rogue Warden Termination",
        desc: (tx: number, ty: number) => `Intercept and neutralize the rogue automated border defense drone near coordinate [X:${tx - 4}, Y:${ty - 4}].`
      },
      {
        title: "Syndicate Enforcer Hit",
        desc: (tx: number, ty: number) => `Eliminate the dangerous Syndicate blockade runner threatening transit lanes near [X:${tx - 4}, Y:${ty - 4}].`
      },
      {
        title: "Void Cult Saboteur Cleanup",
        desc: (tx: number, ty: number) => `Track and eliminate the Void Cult fanatic sabotaging sensor arrays in sector [X:${tx - 4}, Y:${ty - 4}].`
      }
    ];

    // New types pools
    const reconTemplates = [
      {
        title: "Deepspace Sector Reconnaissance",
        desc: (tx: number, ty: number) => `Deploy tactical long-range sensory probes at Sector [X:${tx - 4}, Y:${ty - 4}] and gather cosmic radiation telemetry.`
      },
      {
        title: "Pre-Collapse Ruins Survey",
        desc: (tx: number, ty: number) => `Scan the ancient planetary crust wreckage at [X:${tx - 4}, Y:${ty - 4}] for forgotten jump gate blueprints.`
      },
      {
        title: "Stellar Corona Weather Mapping",
        desc: (tx: number, ty: number) => `Collect atmospheric pressure and temperature data from the star-facing edge of [X:${tx - 4}, Y:${ty - 4}].`
      }
    ];

    const salvageTemplates = [
      {
        title: "Lost Cargo Core Extraction",
        desc: (tx: number, ty: number) => `Recover the wreckage of the bulk freighter stranded at coordinate [X:${tx - 4}, Y:${ty - 4}].`
      },
      {
        title: "Subspace Reactor Salvage",
        desc: (tx: number, ty: number) => `Decelerate at Sector [X:${tx - 4}, Y:${ty - 4}] to salvage a highly volatile thermo-ionic energy matrix from derelict debris.`
      },
      {
        title: "Ancient Data-Drive Recovery",
        desc: (tx: number, ty: number) => `Dive into the derelict station at [X:${tx - 4}, Y:${ty - 4}] and recover encrypted data cores.`
      }
    ];

    // Pick one template for VIP, Haul, and Bounty to ensure variety
    const vipT = vipTemplates[Math.floor((sx + sy + techLvl) % vipTemplates.length)];
    const haulT = haulTemplates[Math.floor((sx * 3 + sy + techLvl) % haulTemplates.length)];
    const bountyT = bountyTemplates[Math.floor((sx + sy * 5 + techLvl) % bountyTemplates.length)];

    const dist1 = Math.abs(targets[0].x - sx) + Math.abs(targets[0].y - sy) || 1;
    const dist2 = Math.abs(targets[1].x - sx) + Math.abs(targets[1].y - sy) || 1;
    const dist3 = Math.abs(targets[2].x - sx) + Math.abs(targets[2].y - sy) || 1;

    list.push({
      id: `vip_${sx}_${sy}_${techLvl}`,
      title: vipT.title,
      desc: vipT.desc(targets[0].x, targets[0].y),
      reward: Math.floor(baseRewards[0] * (1 + dist1 * 0.2) * vipSkillMult),
      type: "vip",
      faction: factionKey,
      targetSector: { x: targets[0].x, y: targets[0].y },
      status: "available"
    });

    list.push({
      id: `haul_${sx}_${sy}_${techLvl}`,
      title: haulT.title,
      desc: haulT.desc(targets[1].x, targets[1].y),
      reward: Math.floor(baseRewards[1] * (1 + dist2 * 0.2) * haulSkillMult),
      type: "haul",
      faction: factionKey,
      targetSector: { x: targets[1].x, y: targets[1].y },
      status: "available"
    });

    list.push({
      id: `bounty_${sx}_${sy}_${techLvl}`,
      title: bountyT.title,
      desc: bountyT.desc(targets[2].x, targets[2].y),
      reward: Math.floor(baseRewards[2] * (1 + dist3 * 0.2) * bountySkillMult),
      type: "bounty",
      faction: factionKey,
      targetSector: { x: targets[2].x, y: targets[2].y },
      status: "available"
    });

    // Add one more random mission of the new types (Recon / Salvage)
    const isRecon = (sx + sy) % 2 === 0;
    const distExtra = Math.abs(targets[3].x - sx) + Math.abs(targets[3].y - sy) || 1;
    
    if (isRecon) {
      const reconT = reconTemplates[Math.floor((sx + sy * 7) % reconTemplates.length)];
      list.push({
        id: `recon_${sx}_${sy}_${techLvl}`,
        title: reconT.title,
        desc: reconT.desc(targets[3].x, targets[3].y),
        reward: Math.floor(baseRewards[0] * 1.5 * (1 + distExtra * 0.2) * vipSkillMult),
        type: "recon",
        faction: factionKey,
        targetSector: { x: targets[3].x, y: targets[3].y },
        status: "available"
      });
    } else {
      const salvageT = salvageTemplates[Math.floor((sx * 4 + sy) % salvageTemplates.length)];
      list.push({
        id: `salvage_${sx}_${sy}_${techLvl}`,
        title: salvageT.title,
        desc: salvageT.desc(targets[4].x, targets[4].y),
        reward: Math.floor(baseRewards[1] * 1.3 * (1 + distExtra * 0.2) * haulSkillMult),
        type: "salvage",
        faction: factionKey,
        targetSector: { x: targets[4].x, y: targets[4].y },
        status: "available"
      });
    }

    return list;
  };

  const generateRecruits = (techLevel: number, customRand?: () => number): RecruitCandidate[] => {
    const basePool = [
      { name: "Cpt. Vance", role: "Pilot", cost: 300, perk: "High-G Turns (+5% Evasion / stacks)" },
      { name: "Lt. Sonya", role: "Weapons Specialist", cost: 400, perk: "Overcharge coils (+5% Weapon Damage / stacks)" },
      { name: "Dr. Selene", role: "Science Director", cost: 250, perk: "Tachyon Radiometers (+10% Scan Success / stacks)" },
      { name: "Baron Flint", role: "Miner", cost: 280, perk: "Extract core ores (+1 Mining Yield / stacks)" },
      { name: "Maddox Core", role: "Cargo Manager", cost: 320, perk: "Compacted Bay Storage (+2 Ship Cargo Slots / stacks)" },
      { name: "Sylvia Black", role: "Spy", cost: 450, perk: "Warp cloaking (-15% Ambush Rates & scans neighbors / stacks)" },
      { name: "Orion Key", role: "Scanning Technician", cost: 350, perk: "Noise Filter (+30% scanning mini-game signal stabilization)" }
    ];
    
    const pool = basePool.map(p => ({
      ...p,
      cost: Math.round(p.cost * globalHiringPriceMultiplier)
    }));
    
    const rFunc = customRand || Math.random;
    return (pool.sort(() => 0.5 - rFunc()) as RecruitCandidate[]).slice(0, Math.min(pool.length, techLevel + 2));
  };

  const FIRST_NAMES = [
    "Talon", "Jax", "Nyx", "Zev", "Kaelen", "Vance", "Sonya", "Selene", "Flint", "Sylvia", "Maddox", "Eldritch", 
    "Drake", "Gideon", "Lyra", "Vesper", "Zephyr", "Rhea", "Orion", "Bane", "Silas", "Kira", "Cyrus", "Astra", 
    "Echo", "Darian", "Sienna", "Ronan", "Tarek", "Juno", "Balthazar", "Xavier", "Thorne", "Helena", "Cassian"
  ];

  const LAST_NAMES = [
    "Vance", "Drake", "Miller", "Eldritch", "Knox", "Cross", "Valerius", "Thorne", "Saber", "Stryker", "Frost", 
    "Nova", "Rift", "Bane", "Rogue", "Spectre", "Shadow", "Ash", "Storm", "Hegel", "Kurz", "Talon", "Apex", "Ray",
    "Vega", "Holloway", "Cortez", "Sinclair", "Vanderbilt", "McAllister", "Rutherford", "Kovacs"
  ];

  const ALIASES = [
    "Viper", "Grim", "Phantom", "Hacksaw", "Overdrive", "Apex", "Razor", "Sledge", "Spectre", "Zenith", "Void",
    "Nova", "Eclipse", "Ranger", "Titan", "Rift", "Rogue", "Ghost", "Cipher", "Vector", "Helix", "Cobalt", "Cinder"
  ];

  const generateProceduralName = (customRand?: () => number) => {
    const rFunc = customRand || Math.random;
    const first = FIRST_NAMES[Math.floor(rFunc() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(rFunc() * LAST_NAMES.length)];
    if (rFunc() < 0.45) {
      const alias = ALIASES[Math.floor(rFunc() * ALIASES.length)];
      return `${first} '${alias}' ${last}`;
    }
    return `${first} ${last}`;
  };

  const generateCantinaVisitors = (sx: number, sy: number, techLevel: number, factionKey: string, customRand?: () => number): CantinaVisitor[] => {
    const rFunc = customRand || Math.random;
    const visitorsCount = Math.floor(rFunc() * 7) + 1; // 1 to 7 visitors!
    const list: CantinaVisitor[] = [];

    const visitorTypes: ("informant" | "smuggler" | "mercenary" | "syndicate")[] = [];
    
    for (let i = 0; i < visitorsCount; i++) {
      const roll = rFunc();
      if (roll < 0.25) visitorTypes.push("informant");
      else if (roll < 0.55) visitorTypes.push("smuggler");
      else if (roll < 0.8) visitorTypes.push("mercenary");
      else visitorTypes.push("syndicate");
    }
    
    visitorTypes.forEach((type, idx) => {
      const name = generateProceduralName(rFunc);
      const id = `visitor_${sx}_${sy}_${idx}`;
      
      if (type === "informant") {
        list.push({
          id,
          name,
          role: "Black Market Broker",
          description: "Offers illegal coordinate splices bypassing orbital planetary custom sensors blockades.",
          colorClass: "border-purple-500 text-purple-400 bg-purple-950/20 shadow-purple-500/20",
          avatarIcon: "👤",
          type: "informant"
        });
      } else if (type === "smuggler") {
        const hasWeapon = rFunc() < 0.6;
        const weaponsPool = ["plasma_spike_mk2", "ion_blaster_mk2", "pulse_laser_mk3", "heavy_disruptor"];
        const componentsPool = ["mining_heavy", "mining_plasma", "cargo_pocket_void", "shield_inductor_mk2"];
        
        const sellWeapons = hasWeapon ? [weaponsPool[Math.floor(rFunc() * weaponsPool.length)]] : [];
        const sellComponents = !hasWeapon ? [componentsPool[Math.floor(rFunc() * componentsPool.length)]] : [];
        
        let itemDesc = "Sells restricted mining drill tech and military hardware.";
        if (sellWeapons.length > 0) {
          itemDesc = `Deals in heavy illicit prototype beam cannons and particle weapons.`;
        } else if (sellComponents.length > 0) {
          itemDesc = `Imports illegal Class-III drill cores and void storage compartments.`;
        }

        list.push({
          id,
          name,
          role: "Illicit Arms Dealer",
          description: itemDesc,
          colorClass: "border-yellow-500 text-yellow-500 bg-yellow-950/20 shadow-yellow-500/20",
          avatarIcon: "⚙️",
          type: "smuggler",
          smugglerWeapons: sellWeapons,
          smugglerComponents: sellComponents
        });
      } else if (type === "mercenary") {
        const level = Math.floor(rFunc() * 3) + 1;
        const shipTypes = ["Viper Interceptor", "Shadow Bomber", "Aegis Escort Fighter", "Crimson Strike-Ship"];
        const focus = rFunc() < 0.5 ? "shields" : "hull";
        const cost = 250 + level * 100 + Math.floor(rFunc() * 100);
        const firepower = 10 + level * 5;
        
        const wingman: Wingman = {
          id: `wingman_${id}`,
          name,
          shipType: shipTypes[Math.floor(rFunc() * shipTypes.length)],
          hp: 70 + level * 20,
          maxHp: 70 + level * 20,
          shields: 40 + level * 15,
          maxShields: 40 + level * 15,
          firepower,
          cargoHold: level + 1,
          duration: 10 + Math.floor(rFunc() * 6),
          maxDuration: 15,
          cost,
          level,
          exp: 0,
          abilities: level >= 2 ? ["Fast Laser Recharge", "Armor Hardened Sheathing"] : ["Laser Core Focus"],
          focus
        };

        list.push({
          id,
          name,
          role: "Elite Escort Mercenary",
          description: `Commands an active ${wingman.shipType}. Available to fly security alongside your cargo hold.`,
          colorClass: "border-cyan-500 text-cyan-400 bg-cyan-950/20 shadow-cyan-500/20",
          avatarIcon: "🚀",
          type: "mercenary",
          wingmanCandidate: wingman
        });
      } else if (type === "syndicate") {
        const isDangerousChainOffer = rFunc() < 0.35;
        
        if (isDangerousChainOffer) {
          list.push({
            id,
            name,
            role: "Syndicate Underlord",
            description: "Offers multi-sector Syndicate hunt contracts targeting high-value hostile fleets.",
            colorClass: "border-red-600 text-red-500 bg-red-950/30 font-bold animate-pulse shadow-red-500/40",
            avatarIcon: "💀",
            type: "syndicate",
            specialQuest: {
              id: `quest_bounty_chain_${sx}_${sy}_${idx}`,
              title: "Syndicate Bounty: The Crimson Sabre Hunt",
              description: "Locate and liquidate the Crimson Sabre syndicate members across multiple coordinates in succession, ending in a boss flagship fleet fight.",
              rewardCredits: 4000 + techLevel * 1000,
              currentStep: 0,
              steps: [
                {
                  x: (sx + 2) % 10,
                  y: (sy + 3) % 10,
                  stepTitle: "Lieutenant Kyle",
                  log: "Lt. Kyle's fighter has been vaporized. Decompiled comm modules reveals Enforcer Valas's coordinate logs.",
                  isCompleted: false,
                  action: "Neutralize Kyle",
                  combatEnemies: [
                    {
                      name: "Kyle's Crimson Interceptor",
                      hull: 150,
                      maxHull: 150,
                      shields: 80,
                      maxShields: 80,
                      damage: 18,
                      weaponType: "pulse_laser",
                      weapons: "Overcharged Twin Pulse Laser",
                      xpReward: 120,
                      loot: ["scrap", "fuel"]
                    }
                  ]
                },
                {
                  x: (sx + 8) % 10,
                  y: (sy + 7) % 10,
                  stepTitle: "Enforcer Valas",
                  log: "Valas's heavy fighter has been annihilated. Scrap logs trace Captain Vex's sub-space channel coordinates.",
                  isCompleted: false,
                  action: "Execute Valas",
                  combatEnemies: [
                    {
                      name: "Valas's Heavy Bomber",
                      hull: 280,
                      maxHull: 280,
                      shields: 140,
                      maxShields: 140,
                      damage: 26,
                      weaponType: "torpedo_launcher",
                      weapons: "Hyper-Thermal Torpedo Array",
                      xpReward: 200,
                      loot: ["scrap", "fuel", "torpedo"]
                    }
                  ]
                },
                {
                  x: (sx + 4) % 10,
                  y: (sy + 9) % 10,
                  stepTitle: "Dread Captain Vex",
                  log: "Dread Captain Vex's military cruiser destroyed. Splicing reactor registries exposes the Crimson Sabre Overlord's location.",
                  isCompleted: false,
                  action: "Defeat Captain Vex",
                  combatEnemies: [
                    {
                      name: "Vex's Escort Interceptor",
                      hull: 100,
                      maxHull: 100,
                      shields: 50,
                      maxShields: 50,
                      damage: 14,
                      weaponType: "pulse_laser",
                      weapons: "Pulse Laser",
                      xpReward: 60,
                      loot: ["scrap"]
                    },
                    {
                      name: "Captain Vex's Armored Cruiser",
                      hull: 420,
                      maxHull: 420,
                      shields: 220,
                      maxShields: 220,
                      damage: 34,
                      weaponType: "ion_blaster",
                      weapons: "Heavy Ion Disruption Beam",
                      xpReward: 350,
                      loot: ["scrap", "orichalcum", "weapon_frame"]
                    }
                  ]
                },
                {
                  x: (sx + 1) % 10,
                  y: (sy + 1) % 10,
                  stepTitle: "Crimson Sabre Overlord Flagship",
                  log: "The Crimson Overlord's flagship has imploded under nuclear core collapse. The Crimson Sabre cartel has been dismantled permanently!",
                  isCompleted: false,
                  action: "Vanquish Crimson Overlord",
                  combatEnemies: [
                    {
                      name: "Crimson Overlord Flagship Escort A",
                      hull: 130,
                      maxHull: 130,
                      shields: 70,
                      maxShields: 70,
                      damage: 16,
                      weaponType: "pulse_laser",
                      weapons: "Standard Laser",
                      xpReward: 90,
                      loot: ["fuel"]
                    },
                    {
                      name: "Crimson Overlord Flagship Escort B",
                      hull: 130,
                      maxHull: 130,
                      shields: 70,
                      maxShields: 70,
                      damage: 16,
                      weaponType: "pulse_laser",
                      weapons: "Standard Laser",
                      xpReward: 90,
                      loot: ["fuel"]
                    },
                    {
                      name: "Sovereign Crimson Overlord Dreadnought",
                      hull: 650,
                      maxHull: 650,
                      shields: 300,
                      maxShields: 300,
                      damage: 54,
                      weaponType: "plasma_spike",
                      weapons: "Catastrophic Overload Beam Cannon",
                      xpReward: 1200,
                      loot: ["antimatter_capsule", "orichalcum", "neutronium", "weapon_frame"],
                      shieldLayers: 3,
                      maxShieldLayers: 3,
                      isBattleship: true
                    }
                  ]
                }
              ],
              ultimateRewardWeapon: "heavy_disruptor"
            }
          });
        } else {
          const baseReward = 300 * techLevel;
          const missions: Mission[] = [
            {
              id: `bar_haul_${sx}_${sy}_1_${idx}`,
              title: `Confidential ${factionKey.toUpperCase()} Data Haul`,
              desc: `Deliver illegal custom encryption codes directly to [X:${((sx + 4) % 10) - 4}, Y:${((sy + 3) % 10) - 4}].`,
              reward: baseReward + 150,
              type: "haul",
              faction: factionKey,
              targetSector: { x: (sx + 4) % 10, y: (sy + 3) % 10 },
              status: "available"
            },
            {
              id: `bar_haul_${sx}_${sy}_2_${idx}`,
              title: `Contraband Serum Delivery`,
              desc: `Smuggle synthetic neural enhancers to the space folds at [X:${((sx - 3 + 10) % 10) - 4}, Y:${((sy + 5) % 10) - 4}].`,
              reward: baseReward + 250,
              type: "haul",
              faction: factionKey,
              targetSector: { x: (sx - 3 + 10) % 10, y: (sy + 5) % 10 },
              status: "available"
            }
          ];

          list.push({
            id,
            name,
            role: "Guild Freight Splicer",
            description: "Distributes private contraband transport runs and courier jobs under the table.",
            colorClass: "border-orange-500 text-orange-400 bg-orange-950/20 shadow-orange-500/20",
            avatarIcon: "👥",
            type: "syndicate",
            missions
          });
        }
      }
    });

    return list;
  };

  const buildProceduralGalaxy = (sysIndex: number) => {
    // Deterministic Mulberry32 generator
    const seedRandom = (seed: number) => {
      let h = seed | 0;
      return () => {
        h = (h + 0x6D2B79F5) | 0;
        let imul = Math.imul(h ^ (h >>> 15), h | 1);
        imul = (imul + Math.imul(imul ^ (imul >>> 7), imul | 61)) | 0;
        return ((imul ^ (imul >>> 14)) >>> 0) / 4294967296;
      };
    };

    const profile = STAR_SYSTEMS_PROFILES[sysIndex];
    const connections = profile.connections || [];
    const BORDER_POSITIONS = [
      { x: 0, y: 5 }, // Slot 0: West
      { x: 9, y: 5 }, // Slot 1: East
      { x: 5, y: 0 }, // Slot 2: North
      { x: 5, y: 9 }, // Slot 3: South
      { x: 0, y: 2 }, // Slot 4: North-West
      { x: 9, y: 2 }, // Slot 5: North-East
      { x: 0, y: 8 }, // Slot 6: South-West
      { x: 9, y: 8 }, // Slot 7: South-East
    ];

    const systemNames = [
      "Helios",
      "Aethelgard",
      "Nirvana",
      "Styx",
      "Cassiopeia",
      "Elysium",
      "Terminus",
      "Svalbard",
      "Golgotha",
      "Krypton",
      "Oberon",
      "Vega",
      "Acheron",
      "Stardust",
      "Nebula",
      "Tartarus",
      "Chronos",
      "Orion",
      "Hydra",
      "Lyra",
      "Cygnus",
      "Draco",
      "Phoenix",
      "Pegasus",
      "Centauri"
    ];

    const systemNameForSystem = systemNames[sysIndex % systemNames.length];

    const getSystemFactionKey = (index: number) => {
      const f = STAR_SYSTEMS_PROFILES[index]?.factionOwner;
      if (f === "Consortium") return "consortium";
      if (f === "Hegemony") return "hegemony";
      if (f === "Syndicate") return "syndicate";
      if (f === "Void Cult") return "cult";
      return "neutral";
    };

    const myFaction = getSystemFactionKey(sysIndex);
    
    // Determine if we border a system of a different major faction
    let borderNeighborIdx: number | null = null;
    let neighborFaction: string = "neutral";
    
    for (const neighborIdx of connections) {
      const nFaction = getSystemFactionKey(neighborIdx);
      if (myFaction !== "neutral" && nFaction !== "neutral" && nFaction !== myFaction) {
        borderNeighborIdx = neighborIdx;
        neighborFaction = nFaction;
        break; // found the primary border system contact
      }
    }

    const isBorderSystem = borderNeighborIdx !== null;
    // Every even indexed border system is split in half; odd ones have the jump gate as the border checkpoint
    const isSplitHalf = isBorderSystem && (sysIndex % 2 === 0);

    const grid: GalaxyCell[][] = [];
    const centerX = 4.5;
    const centerY = 4.5;

    for (let x = 0; x < 10; x++) {
      grid[x] = [];
      for (let y = 0; y < 10; y++) {
        // Calculate distance from center for orbital logic
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const isMinerHeaven = (x === 2 && y === 5) || (x === 8 && y === 4);
        const isMiningStationSector = (x === 1 && y === 1) || (x === 7 && y === 7);
        const isPirateHighway = (y === 3 && x >= 1 && x <= 6) || (x === 7 && y >= 4 && y <= 8);
        const isStarSector = dist < 1.2; // Central star area

        let hasBody = false;
        let hasStation = false;
        
        // Define system properties for spawning
        const systemSeed = (sysIndex * 1337) % 100 / 100;
        const isFringeSystem = systemSeed < 0.3;
        const isHighTechSystem = systemSeed > 0.7;

        // Stable seed for this specific coordinate
        const cellSeedValue = (sysIndex + 1) * 100000 + x * 1000 + y * 13;
        const rand = seedRandom(cellSeedValue);

        const sysName = isMinerHeaven ? "Giga-Reserve" : systemNames[Math.floor(rand() * systemNames.length)];

        // Orbital distribution: 
        if (!isStarSector) {
          if (dist >= 1.5 && dist < 3.0) {
            // Inner Orbit: High temp, few planets, maybe a station
            hasBody = rand() < 0.3;
            hasStation = rand() < (isHighTechSystem ? 0.6 : 0.2);
          } else if (dist >= 3.0 && dist < 5.0) {
            // Mid Orbit: Goldilocks zone, many planets and stations
            hasBody = rand() < 0.6;
            hasStation = rand() < (isFringeSystem ? 0.15 : 0.4);
          } else {
            // Outer Orbit: Cold, ice giants, asteroid belts
            hasBody = rand() < 0.4;
            hasStation = rand() < 0.1;
          }
        }

        // Special Start condition for Proxima Centauri (Index 2)
        if (sysIndex === 2 && x === 3 && y === 4) {
          hasStation = true;
          hasBody = false;
        }

        let hasAnomaly = rand() < 0.25;
        let hasCaravan = rand() < 0.08;

        let isJumpGate = false;
        let targetSysIndex: number | null = null;
        
        connections.forEach((targetIdx, connIdx) => {
          const pos = BORDER_POSITIONS[connIdx % BORDER_POSITIONS.length];
          if (pos.x === x && pos.y === y) {
            isJumpGate = true;
            targetSysIndex = targetIdx;
          }
        });

        if (isMinerHeaven) {
          hasBody = true;
          hasStation = false; // Pure mining sector
        }
        
        if (isMiningStationSector) {
          hasStation = true;
          hasBody = false;
        }

        if (profile.type === "trade") {
          hasStation = (x === 4 && y === 4) || rand() < 0.2;
          hasCaravan = rand() < 0.18;
        } else if (profile.type === "pirate") {
          hasStation = (x === 4 && y === 4) || rand() < 0.05;
          hasAnomaly = rand() < 0.35;
        } else if (profile.type === "anomaly") {
          hasBody = rand() < 0.6;
          hasStation = (x === 4 && y === 4) || rand() < 0.08;
          hasAnomaly = rand() < 0.4;
        }

        // Determine Faction spread & active border zones
        let factionKey = myFaction;
        let isHostilityZone = false;
        let isFortifiedGate = false;
        
        let miningDeposit: { type: "ore" | "gas"; yield: number; unstable: boolean } | undefined = undefined;
        if (rand() < 0.2) {
          miningDeposit = {
            type: rand() < 0.7 ? "ore" : "gas",
            yield: rand(),
            unstable: rand() < 0.15
          };
        }

        if (isBorderSystem) {
          if (isSplitHalf) {
            if (x < 4) {
              factionKey = myFaction;
            } else if (x > 5) {
              factionKey = neighborFaction;
            } else {
              // Active hostility zone split strip down the middle
              factionKey = "neutral";
              isHostilityZone = true;
            }
          } else {
            // Jump gate is the border checkpoint: entire system is ours, but the specific gate leading to the neighbor is fortified by them/neutral
            factionKey = myFaction;
            if (isJumpGate && targetSysIndex === borderNeighborIdx) {
              isFortifiedGate = true;
              factionKey = neighborFaction; // Checked/controlled by the rival border faction
            }
          }
        }

        // Keep core central station neutral
        if (x === 4 && y === 4) factionKey = "neutral";

        let planet = null;
        if (hasBody && !isJumpGate) {
          const subclass = isMinerHeaven
            ? { name: "Giga-Core Asteroid Field", color: "text-yellow-400 font-bold animate-pulse", suffix: "MEGA-RESERVE", type: "heavy_belt", requiresMiner: true }
            : PLANET_SUBCLASSES[Math.floor(rand() * PLANET_SUBCLASSES.length)];
          const sysName = isMinerHeaven ? "Giga-Reserve" : systemNames[Math.floor(rand() * systemNames.length)];
          
          let resourceType = "ore";
          if (isMinerHeaven) {
            const r = rand();
            resourceType = r < 0.35 ? "ore_astraea" : r < 0.7 ? "ore_pyrite" : "ore_ignis";
          } else {
            const r = rand();
            if (subclass.type === "gas") {
              resourceType = r < 0.4 ? "noble_helium" : "plasma_gas";
            } else {
              if (r < 0.3) resourceType = "scrap";
              else if (r < 0.55) resourceType = "ore";
              else if (r < 0.7) resourceType = "plasma_gas";
              else if (r < 0.8) resourceType = "ore_astraea";
              else if (r < 0.88) resourceType = "ore_pyrite";
              else if (r < 0.93) resourceType = "ore_ignis";
              else resourceType = "orichalcum";
            }
          }

          const isGaseous = resourceType === "plasma_gas" || resourceType === "noble_helium";
          const unstableChance = (subclass.type === "ash" || subclass.type === "heavy_belt" || subclass.type === "gas") ? 0.50 : 0.20;
          const isUnstable = rand() < unstableChance;

          const namePrefix = isHostilityZone ? "War-Torn " : "";

          const isMotherlode = rand() < 0.03; // Rare 3% chance for a motherlode
          
          const getMiningAmount = () => {
            const roll = rand();
            if (isMotherlode) return Math.floor(rand() * 100) + 300; // 300+
            if (isMinerHeaven) return Math.floor(rand() * 51) + 50; // Huge 50-100
            if (roll < 0.1) return Math.floor(rand() * 51) + 50; // Huge 50-100
            if (roll < 0.3) return Math.floor(rand() * 16) + 25; // Large 25-40
            if (roll < 0.6) return Math.floor(rand() * 9) + 12; // Medium 12-20
            return Math.floor(rand() * 2) + 7; // Small 7-8
          };

          planet = {
            name: isMinerHeaven ? `${sysName} [X:${x - 4}, Y:${y - 4}]` : `${namePrefix}${sysName} ${subclass.suffix}-${x}${y}`,
            type: subclass.name,
            color: subclass.color,
            interactionType: subclass.type,
            requiresMiner: subclass.requiresMiner || false,
            resourceNode: {
              type: resourceType,
              amount: getMiningAmount(),
              exhausted: false,
              isGaseous,
              unstable: isUnstable
            }
          };
        }

        let station = null;
        if (hasStation && !isJumpGate) {
          const grades = ["Low-Tech Border Hub", "Medium-Tech Sector Outpost", "High-Tech Industrial Spire"];
          
          let index = Math.floor(rand() * grades.length);
          if (isFringeSystem) index = Math.floor(rand() * 2); // 0 or 1
          if (isHighTechSystem) index = Math.floor(rand() * 2) + 1; // 1 or 2

          const stationSuffixes = ["Gateway", "Outpost", "Depot", "Station", "Hub", "Refinery", "Dock", "Anchor", "Platform", "Base"];
          let stationName = `${systemNames[Math.floor(rand() * systemNames.length)]} ${stationSuffixes[Math.floor(rand() * stationSuffixes.length)]}`;
          let hiringLounge = generateRecruits(index + 1, rand);
          let stationTitle = grades[index];

          if (isMiningStationSector) {
            stationName = "Deep Core Mining Station";
            stationTitle = "Specialized Extraction Facility";
            // Custom high level mining crew
            hiringLounge = [
              { name: "Orin 'Rock-Biter' Vex", role: "Miner", cost: 2500, perk: "Specialist extraction protocols (+25% yield)" },
              { name: "Silas 'Vein-Finder' Thorne", role: "Scanning Technician", cost: 1800, perk: "Deep crust resonance mapping (+15% speed)" },
              ...generateRecruits(index + 1, rand)
            ];
          }

          if (x === 4 && y === 4) {
            station = {
              name: `${systemNameForSystem} Solar Forge`,
              techLevel: 4,
              techTitle: "Deep Solar Energy Harvesting Station",
              missionBoard: generateMissionBoard(x, y, 4, factionKey),
              hiringLounge: [
                { name: "Sola 'Sun-Shield' Vance", role: "Science Director", level: 10, cost: 3500, perk: "Ultimate solar core deflection arrays (+45% hazard survival)" },
                ...generateRecruits(3, rand)
              ],
              cantinaVisitors: [
                { id: "solar_guide_1", name: "Solar Pioneer", role: "Cantina Regular", description: "The solar station is the only place in the solar sector safe from the star's scorching radiation. Our shields cool docked vessels completely." }
              ],
              isSolarStation: true,
              isMiningStation: false
            };
          } else {
            station = {
              name: stationName,
              techLevel: index + 1,
              techTitle: stationTitle,
              missionBoard: generateMissionBoard(x, y, index + 1, factionKey),
              hiringLounge: hiringLounge,
              cantinaVisitors: generateCantinaVisitors(x, y, index + 1, factionKey, rand),
              isMiningStation: isMiningStationSector
            };
          }
        }

        let anomaly = null;
        if (hasAnomaly && !isJumpGate) {
          const types = isHostilityZone 
            ? [
                "Scuttled Border Patrol Cruiser",
                "Stray Antimatter Minefield",
                "Wrecked Heavy Frigate Bulk",
                "Decommissioned Spy Sat Node",
                "Decayed Tactical Uplink Core"
              ]
            : [
                "Superheated Gas Cloud",
                "Derelict Bulk Cruiser",
                "Smuggler Core Node",
                "Unstable Wormhole Gate",
                "Ancient Obelisk"
              ];
          const payloadPool = ["credits", "contraband", "shieldcore", "encrypted_drive", "xenomorph_relic", "blueprint", "blueprint"];
          anomaly = {
            name: types[Math.floor(rand() * types.length)],
            discovered: false,
            payload: payloadPool[Math.floor(rand() * payloadPool.length)],
            exhausted: false
          };
        }

        let caravan: Caravan | null = null;
        if (hasCaravan && !isJumpGate) {
          caravan = {
            name: `${FACTIONS[factionKey].name} Trade Fleet`,
            faction: factionKey,
            exhausted: false,
            inventory: [
              { type: "fuel", qty: 10, price: 15 },
              { type: "food", qty: 5, price: 12 },
              { type: "contraband", qty: 2, price: 90 },
              { type: "encrypted_drive", qty: 1, price: 75 }
            ]
          };
        }

        let jumpGate = null;
        if (isJumpGate && targetSysIndex !== null) {
          jumpGate = {
            targetSystemIndex: targetSysIndex,
            name: isFortifiedGate 
              ? `Fortified Border Gate [CONTESTED]` 
              : `${STAR_SYSTEMS_PROFILES[targetSysIndex].name} Jump Gate`
          };
        }

        let hasBlackMarket = false;
        let blackMarketRevealed = false;
        if (planet && planet.interactionType === "heavy_belt" && !station && rand() < 0.35) {
          hasBlackMarket = true;
          blackMarketRevealed = false;
        }

        let hostileChance = x === 4 && y === 4 ? 0 : profile.type === "pirate" ? 0.45 : 0.2;
        if (isPirateHighway) {
          hostileChance = 0.85; // persistent extreme ambush danger
        }
        if (isHostilityZone) {
          hostileChance = 0.85; // extremely violent clash territory
        }
        if (isFortifiedGate) {
          hostileChance = 0.90; // fortified checkpoint
        }

        let hazardType: "solar_flare" | "ion_nebula" | "grav_well" | null = null;
        if (!isJumpGate && (x !== 4 || y !== 4)) {
          const cellSeed = (x * 17 + y * 31 + sysIndex * 43) % 100;
          if (cellSeed < 12) {
            hazardType = "solar_flare";
          } else if (cellSeed < 24) {
            hazardType = "ion_nebula";
          } else if (cellSeed < 34) {
            hazardType = "grav_well";
          }
        }

        grid[x][y] = {
          explored: (x === position.x && y === position.y) || isJumpGate,
          faction: isPirateHighway ? "neutral" : factionKey,
          planet,
          station,
          anomaly,
          caravan,
          jumpGate,
          hostileChance: isStarSector ? 0 : x === position.x && y === position.y ? 0 : hostileChance,
          hasBlackMarket: planet?.interactionType === "heavy_belt" && !station && rand() < 0.35,
          blackMarketRevealed: false,
          isMinerHeaven,
          isPirateHighway,
          isHostilityZone,
          isFortifiedGate,
          hazardType,
          hasStar: isStarSector,
          miningDeposit
        };
      }
    }

    setGalaxy(grid);
    setMapBounds({ minX: 0, maxX: 9, minY: 0, maxY: 9 });
    return grid;
  };

  const buildDeepSpaceGalaxy = () => {
    // Deterministic Mulberry32 generator
    const seedRandom = (seed: number) => {
      let h = seed | 0;
      return () => {
        h = (h + 0x6D2B79F5) | 0;
        let imul = Math.imul(h ^ (h >>> 15), h | 1);
        imul = (imul + Math.imul(imul ^ (imul >>> 7), imul | 61)) | 0;
        return ((imul ^ (imul >>> 14)) >>> 0) / 4294967296;
      };
    };

    const grid: GalaxyCell[][] = [];

    const prefixes = ["Epitaph", "Vanguard", "Genesis", "Sentinel", "Hyperion", "Tartarus", "Acheron", "Onyx", "Helios", "Eclipse", "Void", "Spectral"];
    const nouns = ["Grip", "Chasm", "Ruin", "Fissure", "Wreck", "Spire", "Core", "Anvil", "Needle", "Tomb", "Whisper", "Spur"];

    // Use a fixed deep space seed
    const systemSeedValue = 99999;

    // Populate a 3x3 grid
    for (let x = 0; x < 3; x++) {
      grid[x] = [];
      for (let y = 0; y < 3; y++) {
        const cellSeed = systemSeedValue + x * 100 + y * 7;
        const rand = seedRandom(cellSeed);

        const getRandomName = () => {
          const p = prefixes[Math.floor(rand() * prefixes.length)];
          const n = nouns[Math.floor(rand() * nouns.length)];
          return `${p} ${n}`;
        };

        let explored = false;
        let faction = "neutral";
        let planet = null;
        let station = null;
        let anomaly = null;
        let caravan = null;
        let jumpGate = null;
        let hostileChance = 0.15 + rand() * 0.25;

        // Center is the safe arrival portal
        if (x === 1 && y === 1) {
          explored = true;
          // An unstable folding wormhole to jump back to civilized space!
          jumpGate = {
            targetSystemIndex: lastCivilizedSystemIndex,
            name: "Unstable Return Wormhole"
          };
        } else {
          // Let's procedurally fill other 3x3 coordinates based on randomized rolls
          const roll = rand();
          if (roll < 0.25) {
            // Highly enriched asteroid field with Astraea or Pyrite Crystals
            const oreType = rand() < 0.5 ? "ore_astraea" : "ore_pyrite";
            const oreName = oreType === "ore_astraea" ? "Astraea Crystals" : "Pyrite Prisms";
            const isUnstable = rand() < 0.50; // rogue asteroids are highly unstable!
            
            const getDeepSpaceAmount = () => {
              const r = rand();
              if (r < 0.05) return 350; // Motherlode
              if (r < 0.2) return Math.floor(rand() * 40) + 50; // Huge
              return Math.floor(rand() * 15) + 25; // Large
            };

            planet = {
              name: `Rogue ${oreName} Asteroids [Grid ${x - 1},${y - 1}]`,
              type: "asteroid_field",
              color: "text-amber-500 font-bold animate-pulse",
              interactionType: "asteroid_field",
              requiresMiner: true,
              resourceNode: {
                type: oreType,
                amount: getDeepSpaceAmount(),
                exhausted: false,
                isGaseous: false,
                unstable: isUnstable
              }
            };
          } else if (roll < 0.45) {
            // A Rogue Planet drifting in the dark!
            const isTomb = rand() < 0.5;
            const resourceType = isTomb ? "orichalcum" : (rand() < 0.4 ? "noble_helium" : "plasma_gas");
            const isGaseous = resourceType === "plasma_gas" || resourceType === "noble_helium";
            const isUnstable = rand() < 0.40;
            planet = {
              name: `Rogue Planet ${getRandomName()}`,
              type: isTomb ? "Tomb World" : "Gas Giant",
              color: isTomb ? "text-purple-600 font-bold animate-pulse" : "text-cyan-400 font-bold",
              interactionType: isTomb ? "tomb_world" : "gas_harvest",
              requiresMiner: false,
              resourceNode: {
                type: resourceType,
                amount: Math.floor(rand() * 4) + 5,
                exhausted: false,
                isGaseous,
                unstable: isUnstable
              }
            };
          } else if (roll < 0.58) {
            // Space Station: Lost/Abandoned station
            station = {
              name: `Abandoned ${getRandomName()} Hub`,
              techLevel: 2,
              techTitle: "Abandoned Spire Station",
              missionBoard: generateMissionBoard(x, y, 2, "neutral"),
              hiringLounge: generateRecruits(2, rand),
              cantinaVisitors: generateCantinaVisitors(x, y, 2, "neutral", rand)
            };
          } else if (roll < 0.75) {
            // Anomaly/Space wreckage
            anomaly = {
              name: `Wreckage of ${getRandomName()}`,
              discovered: false,
              payload: rand() < 0.4 ? "contraband" : (rand() < 0.6 ? "blueprint" : "shieldcore"),
              exhausted: false
            };
            hostileChance = 0.35;
          } else {
            // Completely empty save for background dust/nebula
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

    setGalaxy(grid);
    setMapBounds({ minX: 0, maxX: 2, minY: 0, maxY: 2 });
    return grid;
  };

  const handleBlindJump = () => {
    if (checkMalfunction()) return;
    if (fuel < 4.0) {
      addTerminalLog("FATAL ERROR: Insufficient warp fuel cores for deep space blind jump. Required: 4.0 units.", "danger");
      return;
    }

    // Deduct fuel
    setFuel((f) => Math.max(0, f - 4.0));
    setLastCivilizedSystemIndex(currentSystemIndex);
    setIsInDeepSpace(true);

    addTerminalLog("WARP DRIVE WARNING: Spooling hyper-fold quantum engine... Initiating hazardous blind warp trajectory into unmapped interstellar space...", "info");
    AudioEngine.playWarp();

    setTimeout(() => {
      // 30% chance of getting stranded
      const isStranded = Math.random() < 0.30;
      if (isStranded) {
        setFuel(0.0);
        setHull((h) => Math.max(10, h - 25)); // damage hull but keep alive
        addTerminalLog("⚠️ DANGER ⚠️ STRUCTURAL RUPTURE DETECTED! Gravitational shear crushed hull plating (-25 HP) and triggered a fuel tank containment breach! Warp fuel reserves PURGED to 0.0 units. YOU ARE STRANDED IN DEEP SPACE!", "danger");
      } else {
        addTerminalLog("SAFE ARRIVAL: Successfully completed non-linear folder jump. Stabilized in unmapped local coordinate field.", "success");
      }

      // Build deep space 3x3 grid
      buildDeepSpaceGalaxy();
      setPosition({ x: 1, y: 1 });
      setPreviousPosition({ x: 1, y: 1 });
    }, 1500);
  };

  const handleTriggerWarpJumpToWaypoint = (waypoint: VoidWaypoint) => {
    const warpFuelCost = hyperdriveOverclocked ? 2.2 : 4.0;
    if (fuel < warpFuelCost) {
      addTerminalLog(`FATAL ERROR: Insufficient warp fuel cores to target locked coordinate matrix. Required: ${warpFuelCost} units.`, "danger");
      return;
    }

    // Deduct fuel
    setFuel((f) => Math.max(0, f - warpFuelCost));
    setLastCivilizedSystemIndex(currentSystemIndex);
    
    // Start countdown state
    setIsWarpJumping(true);
    setWarpJumpCountdown(10);
    setWarpJumpTargetWaypoint(waypoint);
    
    addTerminalLog(`FTL WARNING: Quantum fold-space destination locked: "${waypoint.name}". Commencing hyper-drive folding procedure. Standby for spatial displacement in 10 seconds!`, "info");
    AudioEngine.playWarp();

    let remainingSeconds = 10;
    const interval = setInterval(() => {
      remainingSeconds -= 1;
      setWarpJumpCountdown(remainingSeconds);
      
      if (remainingSeconds > 0) {
        AudioEngine.playBeep(440 + (10 - remainingSeconds) * 40, 0.15, "triangle");
      } else {
        clearInterval(interval);
        
        // Complete Warp Jump
        setIsWarpJumping(false);
        setWarpJumpTargetWaypoint(null);
        setIsInDeepSpace(true);
        
        // Load the persistent procedural coordinate grid!
        setGalaxy(waypoint.galaxy);
        setMapBounds({ minX: 0, maxX: 2, minY: 0, maxY: 2 });
        setPosition({ x: 1, y: 1 });
        setPreviousPosition({ x: 1, y: 1 });
        
        addTerminalLog(`FTL DISPLACEMENT RE-STABILIZED: Successfully materialized in coordinate field "${waypoint.name}". Sub-space anchor established.`, "success");
        AudioEngine.playWarp();
      }
    }, 1000);
  };

  const handleRescueBeacon = () => {
    if (checkMalfunction()) return;
    addTerminalLog("BEACON ENGAGED: Broadcasting emergency coordinates on high-gain sub-space channels...", "info");
    AudioEngine.playBeep(800, 0.5, "sawtooth");

    const highRepFriend = sectorShips.find((s) => s.isFriend && s.reputation >= 75);

    setTimeout(() => {
      if (highRepFriend) {
        addTerminalLog(`[DISTRESS INTERCEPTED]: Your ally "${highRepFriend.name}" has intercepted your emergency broadcast!`, "success");
        addTerminalLog(`[RESCUE]: "${highRepFriend.name}" swooped in, secured your hull in a sub-space warp bubble, and towed you to safety with zero towing fees or cargo penalty.`, "success");
      } else {
        // Deduct fee: 400 credits or half of cargo
        if (credits >= 400) {
          setCredits((cr) => Math.max(0, cr - 400));
          addTerminalLog("RESCUE TEAM TRANSIT: A Syndicate recovery tug arrived! Deducted emergency towing fee of 400 Credits.", "info");
        } else {
          // Discard half cargo slots
          const newCargo = cargo.slice(0, Math.ceil(cargo.length / 2));
          setCargo(newCargo);
          addTerminalLog("RESCUE TEAM TRANSIT: A Syndicate recovery tug arrived! Seized half of your cargo bays as salvage compensation.", "info");
        }
      }

      setFuel(10.0); // give them basic warp charge
      setIsInDeepSpace(false);
      
      const targetSysIdx = lastCivilizedSystemIndex;
      setCurrentSystemIndex(targetSysIdx);
      buildProceduralGalaxy(targetSysIdx);
      setPosition({ x: 4, y: 4 });
      setPreviousPosition({ x: 4, y: 4 });

      addTerminalLog(`Safely returned to civilized space in ${STAR_SYSTEMS_PROFILES[targetSysIdx].name}. Engines rebooted, Warp fuel stabilized at 10.0 units.`, "success");
    }, 1500);
  };

  const handleCraftWarpFuel = () => {
    const astraeaCount = countCargoItem("ore_astraea");
    const pyriteCount = countCargoItem("ore_pyrite");
    if (astraeaCount < 1 || pyriteCount < 1) {
      addTerminalLog("CRAFTING FAILED: Synthesis requires at least 1x Astraea Crystal and 1x Pyrite Prism.", "danger");
      return;
    }

    // Deduct the ingredients
    removeCargoItem("ore_astraea", 1);
    removeCargoItem("ore_pyrite", 1);

    // Increase fuel
    const newFuel = Math.min(shipSpecs.maxFuel, fuel + 5.0);
    setFuel(newFuel);
    
    addTerminalLog(`CRAFTING SUCCESS: Fused 1x Astraea Crystal and 1x Pyrite Prism. Synthesized +5.0 units of clean Warp Fuel!`, "success");
    AudioEngine.playBeep(600, 0.3, "sine");
  };

  const startNewGame = (starterClass: "Miner" | "Patrol" | "Explorer") => {
    setCredits(1500);
    
    let ship = "interceptor";
    let hull = 80;
    let shields = 60;
    let fuel = 40.0;
    let cargoSlots = 12;
    let weapons = 2;
    let crew = 2;

    if (starterClass === "Miner") {
      ship = "interceptor";
      hull = 80;
      shields = 60;
      fuel = 40.0;
      cargoSlots = 16;
      weapons = 1;
      crew = 3;
    } else if (starterClass === "Patrol") {
      ship = "interceptor";
      hull = 110;
      shields = 90;
      fuel = 40.0;
      cargoSlots = 12;
      weapons = 2;
      crew = 2;
    } else if (starterClass === "Explorer") {
      ship = "interceptor";
      hull = 80;
      shields = 60;
      fuel = 80.0;
      cargoSlots = 20;
      weapons = 1;
      crew = 2;
    }

    setFuel(fuel);
    setHull(hull);
    setShields(shields);
    setStarterCargoSlots(cargoSlots - 12);
    setActiveShip(ship);
    setPosition({ x: 4, y: 4 });
    setPreviousPosition({ x: 4, y: 4 });
    setCargo([
      { type: "scrap", qty: 2 },
      { type: "torpedo", qty: 5 },
      { type: "food", qty: 1 }
    ]);
    
    // Initialize equipment based on weapons slot count
    const initialWeapons = [];
    for (let i = 0; i < weapons; i++) {
        if (i === 0) initialWeapons.push("pulse_laser");
        else initialWeapons.push(null);
    }
    setEquippedWeapons(initialWeapons as any);
    setInventoryWeapons(["pulse_laser", "torpedo_launcher"]);

    // Initialize crew
    const initialCrew = [
      {
        id: "crew_1",
        name: "Karl Thorne",
        role: "Pilot",
        exp: 12,
        level: 1,
        perk: "Thrust Vectoring (+5% Evasion)"
      }
    ];
    if (crew >= 2) initialCrew.push({ id: "crew_2", name: "Sia Vane", role: "Engineer", exp: 5, level: 1, perk: "Repair (+5% Hull Regen)" });
    if (crew >= 3) initialCrew.push({ id: "crew_3", name: "Jaxon Reed", role: "Navigator", exp: 8, level: 1, perk: "Navigation (+5% Warp Efficiency)" });
    setCrew(initialCrew);

    setFittedComponents({
      shield: "shield_standard",
      hull: "hull_standard",
      engine: "engine_standard",
      scanner: "scanner_standard",
      cargo: "cargo_standard"
    });
    setOwnedComponents([]);
    
    setReputation({ hegemony: 0, syndicate: 0, cult: 0, consortium: 0 });
    setActiveQuests(JSON.parse(JSON.stringify(STORY_QUESTS_CAMPAIGNS)));
    setActiveMissions([]);
    setCompletedMissionsCount({ vip: 0, haul: 0, bounty: 0 });

    setCurrentSystemIndex(2);
    buildProceduralGalaxy(2);

    setLogs([]);
    addTerminalLog("Alpha Centauri C (Proxima) Terminal connected.", "success");
    addTerminalLog("Ready. Station Hangar B orbiting Proxima Centauri b. Clamps released.", "info");
    addTerminalLog("Navigation data received. All systems nominal.", "normal");

    setEscMenuOverlay(false);
    setActiveTab("cockpit");
    AudioEngine.playBeep(800, 0.15, "sine");
  };

  useEffect(() => {
    // Generate initial galaxy and load quests on boot
    buildProceduralGalaxy(2);
    setActiveQuests(JSON.parse(JSON.stringify(STORY_QUESTS_CAMPAIGNS)));
    addTerminalLog("SYSTEM INITIALIZED: Alpha Centauri C (Proxima) Orbital.", "info");
  }, []);

  // --- BACKGROUND MINING ANCHORED TICKS ---
  const miningPulseRef = useRef<() => void>(() => {});
  const executeMiningPulse = () => {
    const cell = galaxy[position.x]?.[position.y];
    if (!cell || !cell.planet || !cell.planet.resourceNode || cell.planet.resourceNode.amount <= 0) {
      haltDrills();
      return;
    }

    const node = cell.planet.resourceNode;
    let nextAmount = Math.max(0, node.amount - 1);
    
    // UNSTABLE FIELD TECTONIC FRACTURING MECHANIC
    let fractured = false;
    let fractureAmount = 0;
    if (node.unstable && nextAmount > 0 && Math.random() < 0.22) {
      fractureAmount = Math.floor(Math.random() * 2) + 2; // Fractures lose 2-3 extra units
      nextAmount = Math.max(0, nextAmount - fractureAmount);
      fractured = true;
    }

    setDrillRemainingUnits(nextAmount);

    // Update galaxy state immutably to prevent any mutation-related rendering crashes
    setGalaxy((prev) => {
      const next = [...prev];
      if (!next[position.x]) return prev;
      const col = [...next[position.x]];
      if (!col[position.y]) return prev;
      const targetCell = { ...col[position.y] };
      if (targetCell.planet && targetCell.planet.resourceNode) {
        const planetCopy = { ...targetCell.planet };
        const nodeCopy = { ...planetCopy.resourceNode };
        nodeCopy.amount = nextAmount;
        if (nextAmount <= 0) {
          nodeCopy.exhausted = true;
        }
        planetCopy.resourceNode = nodeCopy;
        targetCell.planet = planetCopy;
      }
      col[position.y] = targetCell;
      next[position.x] = col;
      return next;
    });

    if (fractured) {
      addTerminalLog(`🚨 TECTONIC COLLAPSE: The unstable mineral node fractured! Structural failure vaporized -${fractureAmount} deposit units.`, "danger");
      AudioEngine.playBeep(140, 0.45, "sawtooth");
    }

    let yieldAmt = getMinerEfficiency();
    const scienceSpecs = crew.filter((c) => c.role === "Science Director");
    scienceSpecs.forEach((s) => {
      if (s.level >= 3) yieldAmt += 1;
    });

    const miners = crew.filter((c) => c.role === "Miner");
    let doubledRare = false;
    miners.forEach((m) => {
      if (m.level >= 3 && (node.type === "orichalcum" || node.type === "plasma_gas" || node.type === "noble_helium" || node.type === "ore_astraea" || node.type === "ore_pyrite")) {
        doubledRare = true;
      }
    });

    if (doubledRare) yieldAmt *= 2;

    // APPLY HIGH-YIELD SCAN MULTIPLIER (Unscanned = 50% base yield)
    const scanMultiplier = scannedYield !== null ? (scannedYield / 100) : 0.50;
    yieldAmt = Math.floor(yieldAmt * scanMultiplier) || 1;

    // FREQUENCY TUNING MATCHING MODIFIER
    const diff = Math.abs(drillUserFrequency - drillTargetFrequency);
    let resonanceMsg = "";
    if (diff <= 4) {
      yieldAmt = Math.floor(yieldAmt * 1.5) || 1;
      resonanceMsg = " [OPTIMAL HARMONIC RESONANCE +50% YIELD]";
    } else if (diff >= 20) {
      yieldAmt = Math.max(1, Math.floor(yieldAmt * 0.5));
      resonanceMsg = " [HARMONIC FRICTION DEGRADATION -50% YIELD]";
      
      // Tectonic flare chance
      if (Math.random() < 0.12) {
        const dmg = Math.floor(Math.random() * 5) + 4;
        addTerminalLog(`🚨 TECTONIC PULSE FLARE: Unaligned frequencies triggered a crustal discharge! Received ${dmg} points of hull/shield friction damage.`, "danger");
        setShields((s) => {
          if (s >= dmg) return s - dmg;
          const rem = dmg - s;
          setHull((h) => Math.max(0, h - rem));
          return 0;
        });
        AudioEngine.playBeep(180, 0.4, "sawtooth");
      }
    }

    let fuelCost = 0.5;
    miners.forEach((m) => {
      if (m.level >= 5) fuelCost = 0.0; // Level 5 turbo-drill is fuel-free
    });

    if (fuelCost > 0) {
      setFuel((f) => Math.max(0, f - fuelCost));
    }

    const success = addCargoItem(node.type, yieldAmt);
    AudioEngine.playBeep(900, 0.1, "square");

    if (success) {
      let msg = `Extracted +${yieldAmt} units of ${ITEM_TEMPLATES[node.type]?.name || node.type}!${resonanceMsg}`;
      if (scannedYield === null) msg += " (Unscanned deposit penalizes yield by -50%)";
      else msg += ` (${scannedYield}% Pinpoint Yield Node)`;
      if (doubledRare) msg += " (Miner doubled rare ore yield perk!)";
      addTerminalLog(msg, "loot");
    } else {
      addTerminalLog("Cargo hold overflow! Planetary drilling lasers dispersed materials.", "danger");
      if (isAutoMining) {
        addTerminalLog("Auto-Mining halted automatically because cargo holds are full.", "danger");
        haltDrills();
        return;
      }
    }

    promoteCrewSpecialist("Miner", 20);
    promoteCrewSpecialist("Science Director", 10);

    // Drifting frequency slightly to keep user tuning active!
    setDrillTargetFrequency((prev) => {
      const shift = Math.random() > 0.5 ? 3 : -3;
      return Math.max(40, Math.min(90, prev + shift));
    });

    if (nextAmount <= 0) {
      addTerminalLog(`Planetary body ${cell.planet?.name || "Planet"} is completely mined out. Engine anchors disengaging.`, "danger");
      haltDrills();
    } else if (!isAutoMining) {
      setIsDrilling(false);
      addTerminalLog("Manual laser core sweep complete. Anchor locked on planetary crust.", "success");
    } else {
      if (cargo.length >= getCargoCapMultiplier()) {
        addTerminalLog("Auto-Mining halted automatically because cargo holds are full.", "danger");
        haltDrills();
      }
    }
  };

  useEffect(() => {
    miningPulseRef.current = executeMiningPulse;
  }, [executeMiningPulse]);

  useEffect(() => {
    if (!isDrilling) return;

    const timer = setInterval(() => {
      setDrillElapsedMs((prev) => prev + 100);
    }, 100);

    return () => clearInterval(timer);
  }, [isDrilling, isAutoMining, position]); // Removed cargo dependency to prevent double/restart cycles

  useEffect(() => {
    if (drillElapsedMs >= 3000) {
      setDrillElapsedMs(0);
      miningPulseRef.current();
    }
  }, [drillElapsedMs]);

  const startDrills = (isAuto: boolean) => {
    const cell = galaxy[position.x]?.[position.y];
    if (!cell || !cell.planet || cell.planet.resourceNode.exhausted) {
      addTerminalLog("This sector planet has zero mineral deposits.", "danger");
      return;
    }

    const isVolatile = cell.planet.resourceNode.type === "ore_ignis";
    const hasMiner = crew.some((c) => c.role === "Miner");
    const drillId = fittedComponents.mining || "mining_standard";
    const hasTier2Drill = drillId === "mining_heavy" || drillId === "mining_plasma";

    // Gaseous deposits checks
    const isGaseous = cell.planet.resourceNode.isGaseous;
    const hasGasSiphon = drillId === "mining_gas";

    if (isGaseous && !hasGasSiphon) {
      addTerminalLog("FATAL ERROR: This is a gaseous deposit. Harvesting requires an ATMOSPHERIC GAS SIPHON component installed in your ship's engineering module (purchasable from Mining Stations).", "danger");
      AudioEngine.playBeep(150, 0.4, "sawtooth");
      return;
    }

    // Volatile Ignis Ore requirements
    if (isVolatile) {
      if (!hasMiner || !hasTier2Drill) {
        addTerminalLog("FATAL WARNING: Volatile Ignis Ore is highly explosive. Extraction requires a specialized MINER on board AND Tier 2 (or better) mining equipment (Class-II or Class-III Drill) to insulate unstable cores!", "danger");
        AudioEngine.playBeep(150, 0.4, "sawtooth");
        return;
      }
    }

    if (cell.planet.requiresMiner && !hasMiner) {
      addTerminalLog("FATAL: Heavy mineral structures require a specialized MINER on your bridge to operate laser drillers.", "danger");
      return;
    }

    if (cargo.length >= getCargoCapMultiplier()) {
      addTerminalLog("CARGO HOLD FULL: Defragment or trade items to free up slots.", "danger");
      return;
    }

    // Set stable starting frequencies
    const targetFreq = Math.floor(Math.random() * 41) + 45; // 45 to 85Hz
    setDrillTargetFrequency(targetFreq);
    setDrillUserFrequency(65);

    // Science Director Auto-Scan of Deposits
    const scienceDirectors = crew.filter((c) => c.role === "Science Director");
    const hasScienceDirector = scienceDirectors.length > 0;
    const maxScienceDirectorLevel = scienceDirectors.reduce((max, c) => Math.max(max, c.level), 0);

    if (hasScienceDirector) {
      const scannerId = fittedComponents.scanner || "scanner_standard";
      let maxYieldCap = 55;
      if (scannerId === "scanner_mk1") maxYieldCap = 65;
      else if (scannerId === "scanner_tachyon") maxYieldCap = 72;
      else if (scannerId === "scanner_mk2") maxYieldCap = 80;
      else if (scannerId === "scanner_quantum") maxYieldCap = 88;
      else if (scannerId === "scanner_mk3") maxYieldCap = 94;
      else if (scannerId === "scanner_mk4") maxYieldCap = 100;

      const minAutoYield = Math.min(maxYieldCap, 75 + maxScienceDirectorLevel * 2);
      const autoFoundYield = minAutoYield === maxYieldCap ? maxYieldCap : Math.floor(Math.random() * (maxYieldCap - minAutoYield + 1)) + minAutoYield;

      setScannedYield(autoFoundYield);
      addTerminalLog(`👨‍🔬 [SCIENCE DIRECTOR AUTO-SCAN]: Bridge Science Officers initialized auto-scanners. Locked onto a ${autoFoundYield}% yield deposit automatically!`, "success");
    } else if (scannedYield === null) {
      addTerminalLog("ATTENTION: No high-yield deposit pinpointed. Drilling will proceed at base 50% yield. Conduct a radar sweep to locate a high-yield cluster!", "danger");
    }

    setIsDrilling(true);
    setIsAutoMining(isAuto);
    setDrillRemainingUnits(cell.planet.resourceNode.amount);
    setDrillElapsedMs(0);
    setActiveDrillLootType(cell.planet.resourceNode.type);

    addTerminalLog(`DRILL MATRIX ACTIVE: Locking anchor clamps on ${cell.planet.name}. Unstable Resonance Node detected at ${targetFreq}Hz!`, "info");
    AudioEngine.playEnginePowerUp();
  };

  const haltDrills = () => {
    setIsDrilling(false);
    setIsAutoMining(false);
    setDrillRemainingUnits(0);
    setDrillElapsedMs(0);
    addTerminalLog("Drill sub-systems disengaged. Clamps retracted.", "info");
  };

  const runManualDepositScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    addTerminalLog("📡 SCANNER MATRIX ACTIVE: Conducting localized high-frequency electromagnetic radar sweep...", "info");
    AudioEngine.playBeep(400, 0.3, "sine");
    
    setTimeout(() => {
      setIsScanning(false);
      setIsMiningScannerOpen(true);
      AudioEngine.playBeep(700, 0.25, "sine");
    }, 1000);
  };

  // --- AWAY MISSION EXPEDITION TICKS SYSTEM ---
  useEffect(() => {
    if (!expeditionState.active || expeditionState.status === "idle" || expeditionState.status === "completed" || expeditionState.status === "failed") return;

    const interval = setInterval(() => {
      const nextProgress = expeditionState.progress + 15;
      let nextStatus = expeditionState.status;
      let newLogs = [...expeditionState.logs];
      let rewardsText = expeditionState.rewardsText || "";

      if (nextProgress >= 100) {
        clearInterval(interval);
        
        // Calculate success chance!
        const pilots = crew.filter(c => expeditionState.selectedCrewIds.includes(c.id));
        const hasSci = pilots.some(p => p.role === "Science Director");
        const hasWep = pilots.some(p => p.role === "Weapons Specialist");
        const hasSpy = pilots.some(p => p.role === "Spy");
        const hasMiner = pilots.some(p => p.role === "Miner");
        const hasPilot = pilots.some(p => p.role === "Pilot");

        let prob = 40;
        pilots.forEach(p => { prob += p.level * 4; });

        if (expeditionState.hazardType === "radiation" && hasSci) prob += 45;
        if (expeditionState.hazardType === "turrets" && (hasWep || hasSpy)) prob += 45;
        if (expeditionState.hazardType === "collapse" && (hasMiner || hasPilot)) prob += 45;

        const roll = Math.random() * 100;
        const isSuccess = roll < prob;

        if (isSuccess) {
          nextStatus = "completed";
          const credAmt = Math.floor(Math.random() * 1500) + 800;
          setCredits(c => c + credAmt);
          
          const items = ["shieldcore", "contraband", "encrypted_drive", "xenomorph_relic"];
          const rolledItem = items[Math.floor(Math.random() * items.length)];
          addCargoItem(rolledItem, 1);

          // Rare chance of finding a blueprint (30%)
          let bpText = "";
          if (Math.random() < 0.30) {
            const availableBps = BLUEPRINTS.filter(bp => !ownedBlueprints.includes(bp.id));
            if (availableBps.length > 0) {
              const salvagedBp = availableBps[Math.floor(Math.random() * availableBps.length)];
              setOwnedBlueprints(prev => [...prev, salvagedBp.id]);
              bpText = ` Furthermore, the away team salvaged a lost digital schematic: [${salvagedBp.name}]!`;
            } else {
              bpText = ` Found duplicate blueprint logs. Discarded.`;
              // duplicate discarded
            }
          }

          rewardsText = `SUCCESSFUL SALVAGE: Recovered +${credAmt} Credits ledger files and 1x ${ITEM_TEMPLATES[rolledItem]?.name || rolledItem}!${bpText}`;
          newLogs.push(`[AWAY TEAM STATUS]: Secure matrix breached successfully! All parameters stable. Returning with cargo.`);
          addTerminalLog(`EXPEDITION SUCCESS: Secured rare relics and materials from ${expeditionState.derelictName}!${bpText ? " Found a blueprint!" : ""}`, "success");
          AudioEngine.playBeep(1200, 0.4, "sine");
        } else {
          nextStatus = "failed";
          
          // Fatigue selected crew members
          setFatiguedCrew((fc) => {
            const nextFc = { ...fc };
            expeditionState.selectedCrewIds.forEach(id => {
              nextFc[id] = 5; // fatigued for 5 jumps
            });
            return nextFc;
          });

          const hullDmg = Math.floor(Math.random() * 15) + 10;
          setHull(h => Math.max(0, h - hullDmg));

          rewardsText = `MISSION CRITICAL EXHAUSTION: Shuttle breach failed! Selected crew team suffered extreme radiation exposure and trauma (Fatigued for 5 jumps). Landing pod sustained ${hullDmg} structural damage.`;
          newLogs.push(`[AWAY TEAM STATUS]: BREACH FAILURE! Rogue secondary thermal defenses erupted. Deploying emergency return warp capsules...`);
          addTerminalLog(`EXPEDITION FAILURE: Crew evacuated with severe fatigue from ${expeditionState.derelictName}!`, "danger");
          AudioEngine.playBeep(180, 0.5, "sawtooth");
        }
      } else if (nextProgress >= 65) {
        nextStatus = "extracting";
        newLogs.push(`[AWAY TEAM STATUS]: Inner heavy core reached. Core locks bypass calibration currently active at ${(nextProgress).toFixed(0)}%...`);
        AudioEngine.playBeep(850, 0.15, "triangle");
      } else if (nextProgress >= 30) {
        nextStatus = "breaching";
        newLogs.push(`[AWAY TEAM STATUS]: Outer core airlock breached. Heavy thermal hazard levels checked...`);
        AudioEngine.playBeep(650, 0.15, "triangle");
      }

      setExpeditionState({
        ...expeditionState,
        progress: Math.min(100, nextProgress),
        status: nextStatus,
        logs: newLogs,
        rewardsText
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [expeditionState, crew]);

  // --- CARGO MANAGEMENT CORE WRAP ---
  const addCargoItem = (itemKey: string, qty = 1) => {
    const template = ITEM_TEMPLATES[itemKey];
    if (!template) return false;
    const maxStack = template.maxStack || 10;
    const maxSlots = getCargoCapMultiplier();

    const currentCargo = [...cargo];

    for (let i = 0; i < currentCargo.length; i++) {
      if (currentCargo[i].type === itemKey && currentCargo[i].qty < maxStack) {
        const space = maxStack - currentCargo[i].qty;
        const toAdd = Math.min(qty, space);
        currentCargo[i].qty += toAdd;
        qty -= toAdd;
        if (qty <= 0) {
          setCargo(currentCargo);
          return true;
        }
      }
    }

    while (qty > 0) {
      if (currentCargo.length >= maxSlots) {
        setCargo(currentCargo);
        return false;
      }
      const toAdd = Math.min(qty, maxStack);
      currentCargo.push({ type: itemKey, qty: toAdd });
      qty -= toAdd;
    }

    setCargo(currentCargo);
    return true;
  };

  const removeCargoItem = (itemKey: string, qty = 1) => {
    const currentCargo = [...cargo];

    for (let i = currentCargo.length - 1; i >= 0; i--) {
      if (currentCargo[i].type === itemKey) {
        if (currentCargo[i].qty >= qty) {
          currentCargo[i].qty -= qty;
          qty = 0;
        } else {
          qty -= currentCargo[i].qty;
          currentCargo[i].qty = 0;
        }

        if (currentCargo[i].qty <= 0) {
          currentCargo.splice(i, 1);
        }

        if (qty <= 0) {
          setCargo(currentCargo);
          return true;
        }
      }
    }

    setCargo(currentCargo);
    return qty === 0;
  };

  const handleRecycleScrap = () => {
    const scrapCount = countCargoItem("scrap");
    if (scrapCount < 2) return;

    const success = addCargoItem("torpedo", 1);
    if (!success) {
      addTerminalLog("RECYCLER COMPROMISED: Empty cargo slot required to synthesize munition components.", "danger");
      return;
    }

    removeCargoItem("scrap", 2);
    addTerminalLog("RECYCLER SUCCESS: Processed metal alloys. Synthesized 1x packet of high-explosive heavy torpedoes!", "success");
    AudioEngine.playBeep(700, 0.25, "sine");
  };

  const startCrafting = (bpId: string, auto: boolean = false) => {
    const bp = BLUEPRINTS.find(b => b.id === bpId);
    if (!bp) return;

    // Check materials
    const canCraft = bp.materials.every(mat => {
      const slot = cargo.find(s => s.type === mat.type);
      return slot ? slot.qty >= mat.qty : false;
    });

    if (!canCraft) {
      addTerminalLog(`CRAFTING ERROR: Insufficient materials for ${bp.name}.`, "danger");
      setIsAutoCrafting(false);
      setAutoCraftingBpId(null);
      return;
    }

    // Check fuel
    if (fuel < bp.fuelCost) {
      addTerminalLog(`CRAFTING ERROR: Insufficient Warp Fuel (${bp.fuelCost} Units required).`, "danger");
      setIsAutoCrafting(false);
      setAutoCraftingBpId(null);
      return;
    }

    // Check cargo hold capacity
    const isInventoryOrModule = bp.resultType === "weapon" || bp.resultType === "module";
    if (!isInventoryOrModule) {
      const totalCargoCount = cargo.reduce((sum, s) => sum + s.qty, 0);
      const isStackable = cargo.some(s => s.type === bp.resultId && s.qty < (ITEM_TEMPLATES[bp.resultId]?.maxStack || 10));
      const hasEmptySpace = cargo.length < getCargoCapMultiplier();
      if (!isStackable && !hasEmptySpace) {
        addTerminalLog("CRAFTING ERROR: Ship's Grid Cargo Hold has no vacant bays.", "danger");
        setIsAutoCrafting(false);
        setAutoCraftingBpId(null);
        return;
      }
    }

    // Consume materials
    setCargo(prev => {
      const nextCargo = prev.map(slot => {
        const req = bp.materials.find(m => m.type === slot.type);
        if (req) {
          return { ...slot, qty: slot.qty - req.qty };
        }
        return slot;
      }).filter(slot => slot.qty > 0);
      return nextCargo;
    });

    // Consume fuel and add heat
    setFuel(f => Math.max(0, f - bp.fuelCost));
    setHeat(h => Math.min(100, h + bp.heatGenerated));

    // Start timer
    setActiveCraftingBpId(bpId);
    setCraftingTimeLeft(4000);
    setIsAutoCrafting(auto);
    if (auto) {
      setAutoCraftingBpId(bpId);
    }

    addTerminalLog(`[SYNTHESIZING]: Core molecular assembler focused on ${bp.name}... [4.0s Remaining]`, "info");
    AudioEngine.playBeep(800, 0.15, "triangle");
  };

  const cancelCrafting = () => {
    if (activeCraftingBpId) {
      addTerminalLog(`[SYNTHESIZING]: Crafting process aborted. Materials consumed by fusion core.`, "danger");
      setActiveCraftingBpId(null);
      setCraftingTimeLeft(0);
      setIsAutoCrafting(false);
      setAutoCraftingBpId(null);
      AudioEngine.playBeep(250, 0.3, "sawtooth");
    }
  };

  const startAutoCrafting = (bpId: string) => {
    const bp = BLUEPRINTS.find(b => b.id === bpId);
    if (!bp) return;

    setIsAutoCrafting(true);
    setAutoCraftingBpId(bpId);
    startCrafting(bpId, true);
  };

  const stopAutoCrafting = () => {
    setIsAutoCrafting(false);
    setAutoCraftingBpId(null);
    addTerminalLog(`[AUTO-CRAFT]: Manufacturing sequence halted by operator.`, "info");
    AudioEngine.playBeep(350, 0.1, "sine");
  };

  const completeCrafting = (bpId: string) => {
    const bp = BLUEPRINTS.find(b => b.id === bpId);
    if (!bp) return;

    // Award items
    if (bp.resultType === "weapon") {
      setInventoryWeapons(prev => {
        if (!prev.includes(bp.resultId)) {
          return [...prev, bp.resultId];
        }
        return prev;
      });
      addTerminalLog(`[CRAFTING SUCCESS]: Synthesized heavy weapon: ${WEAPON_ITEMS[bp.resultId]?.name || bp.resultId}! Available under Weapon Retrofits.`, "loot");
    } else if (bp.resultType === "module") {
      setOwnedComponents(prev => {
        if (!prev.includes(bp.resultId)) {
          return [...prev, bp.resultId];
        }
        return prev;
      });
      addTerminalLog(`[CRAFTING SUCCESS]: Synthesized modular component: ${COMPONENT_ITEMS[bp.resultId]?.name || bp.resultId}! Available under Component Retrofits.`, "loot");
    } else {
      // cargo item
      addCargoItem(bp.resultId, 1);
      addTerminalLog(`[CRAFTING SUCCESS]: Synthesized item: 1x ${ITEM_TEMPLATES[bp.resultId]?.name || bp.resultId}! Transferred to Grid Bay.`, "loot");
    }
    AudioEngine.playBeep(1200, 0.4, "sine");
  };

  // Crafting timer effect
  useEffect(() => {
    if (!activeCraftingBpId) return;

    const interval = setInterval(() => {
      setCraftingTimeLeft(prev => {
        if (prev <= 100) {
          clearInterval(interval);
          completeCrafting(activeCraftingBpId);
          setActiveCraftingBpId(null);
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeCraftingBpId]);

  // Auto-crafting loop coordinator
  useEffect(() => {
    if (isAutoCrafting && !activeCraftingBpId && autoCraftingBpId) {
      const bp = BLUEPRINTS.find(b => b.id === autoCraftingBpId);
      if (bp) {
        // Check materials and fuel
        const hasMaterials = bp.materials.every(mat => {
          const slot = cargo.find(s => s.type === mat.type);
          return slot ? slot.qty >= mat.qty : false;
        });
        const hasFuel = fuel >= bp.fuelCost;

        if (hasMaterials && hasFuel) {
          const t = setTimeout(() => {
            startCrafting(autoCraftingBpId, true);
          }, 400);
          return () => clearTimeout(t);
        } else {
          setIsAutoCrafting(false);
          setAutoCraftingBpId(null);
          addTerminalLog(`[AUTO-CRAFT]: Manufacturing sequence finished. Resources exhausted.`, "info");
          AudioEngine.playBeep(200, 0.2, "sawtooth");
        }
      }
    }
  }, [isAutoCrafting, activeCraftingBpId, autoCraftingBpId, cargo, fuel]);

  const handleSortCargo = () => {
    const sorted = [...cargo].sort((a, b) => a.type.localeCompare(b.type));
    setCargo(sorted);
    addTerminalLog("Defragmenting cargo inventory modules... Completed.", "info");
  };

  const handleEjectCargoByIndex = (index: number, qty: number) => {
    if (index < 0 || index >= cargo.length) return;
    const currentCargo = [...cargo];
    const slot = currentCargo[index];
    const template = ITEM_TEMPLATES[slot.type];
    const actualQtyToEject = Math.min(qty, slot.qty);

    if (actualQtyToEject <= 0) return;

    slot.qty -= actualQtyToEject;
    const itemName = template ? template.name : slot.type;
    addTerminalLog(`[AIRLOCK VENT]: Venting ${actualQtyToEject}x ${itemName} directly into vacuum.`, "danger");

    if (slot.qty <= 0) {
      currentCargo.splice(index, 1);
    }

    setCargo(currentCargo);
    AudioEngine.playBeep(180, 0.4, "sawtooth");
  };

  const handleDropBeacon = () => {
    // Check if we have a beacon or salvage beacon in cargo
    const hasBeacon = cargo.some(c => c.type === "beacon" && c.qty > 0);
    const hasSalvageBeacon = cargo.some(c => c.type === "salvage_beacon" && c.qty > 0);

    if (!hasBeacon && !hasSalvageBeacon) {
      addTerminalLog("DEPLOY FAIL: No Beacon units in cargo holds. Purchase beacons from spaceport markets first.", "danger");
      AudioEngine.playBeep(220, 0.25, "sawtooth");
      return;
    }

    // Handle Salvage Beacon logic
    if (hasSalvageBeacon) {
        if (!activeSector || !activeSector.wreckage || activeSector.wreckage.collected) {
            addTerminalLog("DEPLOY FAIL: No active wreck site found in this sector to salvage.", "danger");
            AudioEngine.playBeep(220, 0.25, "sawtooth");
            return;
        }

        const reward = activeSector.wreckage.shipsCount * 500;
        setCredits(cr => cr + reward);
        addTerminalLog(`SALVAGE SUCCESS: Salvage crews processed the wreck. Secured ${reward} credits!`, "loot");
        AudioEngine.playBeep(800, 0.25, "sine");

        // Mark wreckage as collected
        setGalaxy(prev => {
            const newGalaxy = [...prev];
            if (activeSector && newGalaxy[activeSector.x]) {
                newGalaxy[activeSector.x] = [...newGalaxy[activeSector.x]];
                newGalaxy[activeSector.x][activeSector.y] = {
                    ...newGalaxy[activeSector.x][activeSector.y],
                    wreckage: {
                        ...activeSector.wreckage!,
                        collected: true
                    }
                };
            }
            return newGalaxy;
        });

        removeCargoItem("salvage_beacon", 1);
        return;
    }

    // Standard beacon logic (if needed, keep existing)
    const alreadyExists = droppedBeacons.some(b => b.x === position.x && b.y === position.y && b.systemIndex === currentSystemIndex);
    if (alreadyExists) {
      addTerminalLog(`DEPLOY FAIL: A navigational beacon is already active at coordinate [X: ${position.x - 4}, Y: ${position.y - 4}].`, "danger");
      AudioEngine.playBeep(220, 0.25, "sawtooth");
      return;
    }

    // Remove 1 beacon from cargo
    const ok = removeCargoItem("beacon", 1);
    if (ok) {
      // Create new beacon
      const randomFreq = `${(100 + Math.random() * 300).toFixed(1)} MHz`;
      const systemName = STAR_SYSTEMS_PROFILES[currentSystemIndex]?.name || `System ${currentSystemIndex}`;
      const beaconId = `beacon_custom_${Date.now()}`;
      const newBeacon: Beacon = {
        id: beaconId,
        name: `Nav-Beacon [${position.x - 4}, ${position.y - 4}]`,
        x: position.x,
        y: position.y,
        systemIndex: currentSystemIndex,
        frequency: randomFreq,
        isCustom: true,
        tradedShipIds: []
      };

      setDroppedBeacons(prev => [...prev, newBeacon]);
      addTerminalLog(`BEACON LAUNCHED: Transmitted sub-space responder at [X: ${position.x - 4}, Y: ${position.y - 4}] (${systemName}) on frequency ${randomFreq}.`, "success");
      AudioEngine.playBeaconPing();
    }
  };

  // --- RECRUITING & CREW ---
  const handleHireCrew = (index: number) => {
    const cell = galaxy[position.x]?.[position.y];
    if (!cell || !cell.station) return;

    const recruit = cell.station.hiringLounge[index];
    if (credits < recruit.cost || crew.length >= shipSpecs.maxCrew) return;

    setCredits((cr) => cr - recruit.cost);
    setCrew((prev) => [
      ...prev,
      {
        id: `crew_${Date.now()}`,
        name: recruit.name,
        role: recruit.role,
        exp: 0,
        level: 1,
        perk: recruit.perk
      }
    ]);

    cell.station.hiringLounge.splice(index, 1);
    addTerminalLog(`Hired specialist: ${recruit.name} joined your bridge crew command deck!`, "success");
    AudioEngine.playUIConfirm();
    setRecruitmentLoungeOpen(false);
  };

  const dismissCrewMember = (index: number) => {
    if (crew.length <= 1) {
      addTerminalLog("ALERT: Space navigation protocols require at least 1 bridge crew member to pilot starships.", "danger");
      return;
    }
    
    const isDocked = !!(activeSector?.station || activeSector?.planet?.interactionType === "outpost");
    const member = crew[index];
    
    if (!isDocked) {
      // Penalty for firing into vacuum
      addTerminalLog(`⚠️ CRITICAL REPUTATION LOSS: Specialist ${member.name} was ejected into the vacuum of space while in deep-space transit. News of your ruthlessness has reached all faction networks.`, "danger");
      setReputation(prev => ({
        hegemony: prev.hegemony - 50,
        syndicate: prev.syndicate - 50,
        cult: prev.cult - 50,
        consortium: prev.consortium - 50
      }));
      // Permanent hiring price increase flag could be added here if we had a state for it, 
      // but reputation already handles most of it. Let's add a custom penalty multiplier.
      setGlobalHiringPriceMultiplier(prev => prev + 0.5);
    } else {
      addTerminalLog(`Crew specialist ${member.name} has been honorably discharged at the local port.`, "success");
    }

    const updated = [...crew];
    updated.splice(index, 1);
    setCrew(updated);
    addTerminalLog(`Dismissed crew specialist: ${member.name}. Berths cleared.`, "info");
    AudioEngine.playBeep(200, 0.4, "sawtooth");
  };

  const promoteCrewSpecialist = (role: string, xpAmount: number) => {
    setCrew((prev) =>
      prev.map((c) => {
        if (c.role === role) {
          const nextXp = c.exp + xpAmount;
          if (nextXp >= 100) {
            const nextLvl = c.level + 1;
            const milestones = [3, 5, 8, 10];
            const isMilestone = milestones.includes(nextLvl);
            addTerminalLog(`PROMOTION: ${c.name} has advanced to Rank ${nextLvl}! Passive perks upgraded.${isMilestone ? " Active Ability Milestone Unlocked! Click their name in the Star Bridge Roster to select your ability card!" : ""}`, "success");
            AudioEngine.playBeep(1200, 0.4, "sine");
            return {
              ...c,
              exp: nextXp - 100,
              level: nextLvl,
              pendingMilestoneUpgrade: isMilestone ? true : c.pendingMilestoneUpgrade
            };
          }
          return { ...c, exp: nextXp };
        }
        return c;
      })
    );
  };

  const handleOpenMilestoneUpgrade = (member: CrewMember) => {
    if (!member.pendingMilestoneUpgrade) return;
    AudioEngine.playBeep(800, 0.2, "sine");
    const pool = MILESTONE_ABILITIES_POOL[member.role] || [];
    // Randomly sort/shuffle
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    setMilestoneUpgradeCrew(member);
    setMilestoneUpgradeCards(shuffled);
  };

  const handleSelectMilestoneAbility = (crewId: string, abilityId: string) => {
    setCrew((prev) =>
      prev.map((c) => {
        if (c.id === crewId) {
          const currentAbilities = c.activeAbilities || [];
          const currentLevels = c.abilityLevels || {};
          const nextAbilities = currentAbilities.includes(abilityId)
            ? currentAbilities
            : [...currentAbilities, abilityId];
          const nextLevels = {
            ...currentLevels,
            [abilityId]: (currentLevels[abilityId] || 0) + 1
          };
          addTerminalLog(`Milestone Unlocked! ${c.name} has trained ${abilityId.replace("_", " ").toUpperCase()} to Level ${nextLevels[abilityId]}!`, "success");
          return {
            ...c,
            activeAbilities: nextAbilities,
            abilityLevels: nextLevels,
            pendingMilestoneUpgrade: false
          };
        }
        return c;
      })
    );
    setMilestoneUpgradeCrew(null);
  };

  const handleAttackStation = () => {
    if (!activeSector?.station) return;
    
    // Station stats
    const station = activeSector.station;
    const hp = 2000 + (station.techLevel * 500);
    const stationEnemy: Enemy = {
      name: station.name + " Defense Grid",
      hull: hp,
      maxHull: hp,
      shields: 0,
      maxShields: 0,
      damage: 15 + (station.techLevel * 5),
      weaponType: "torpedo_launcher",
      weapons: "Railguns",
      xpReward: 1000 * station.techLevel,
      loot: ["experimental_weapon_frame", "singularity_core", "tech_components_high"],
      isBattleship: true
    };
    
    const patrolEnemies: Enemy[] = Array.from({ length: 5 + Math.floor(Math.random() * 4) }).map(() => ({
      name: "Faction Patrol Ship",
      hull: 300 + (station.techLevel * 100),
      maxHull: 300 + (station.techLevel * 100),
      shields: 100,
      maxShields: 100,
      damage: 10,
      weaponType: "pulse_laser",
      weapons: "Laser Array",
      xpReward: 200,
      loot: ["credits", "ammunition"]
    }));
    
    setCombatState({
      active: true,
      enemies: [stationEnemy, ...patrolEnemies],
      activeEnemyIndex: 0,
      enemy: stationEnemy,
      playerTurn: true,
      qteRunning: false,
      qteSpeed: 1,
      qtePointerPos: 50,
      qteDirection: 1,
      zoneCenter: 50,
      zoneDirection: 1,
      zoneSpeed: 2,
      targetZoneRange: { start: 40, end: 60 },
      activeWeaponFiring: null,
      selectedWeakPoint: null,
      novaCooldown: 0
    });
    
    addTerminalLog(`🚨 WARN: Initiating attack on ${station.name}! Defenses scrambled!`, "danger");
    setActiveTab("combat");
  };

  const updateSectorShips = (playerX: number, playerY: number, sysIndex: number) => {
    setSectorShips((prevShips) => {
      let updated = prevShips.map((ship) => {
        if (Math.random() < 0.35) {
          if (Math.random() < 0.1) {
            const system = STAR_SYSTEMS_PROFILES[ship.systemIndex];
            const connections = system?.connections || [];
            if (connections.length > 0) {
              const nextSys = connections[Math.floor(Math.random() * connections.length)];
              const newX = Math.floor(Math.random() * 10);
              const newY = Math.floor(Math.random() * 10);
              
              if (ship.isFriend) {
                addTerminalLog(`[FRIEND CHANNEL]: Friend vessel "${ship.name}" has completed an FTL jump to the ${STAR_SYSTEMS_PROFILES[nextSys].name} system.`, "info");
              }
              
              return {
                ...ship,
                systemIndex: nextSys,
                x: newX,
                y: newY
              };
            }
          }
          
          const dx = Math.floor(Math.random() * 3) - 1;
          const dy = Math.floor(Math.random() * 3) - 1;
          const nextX = Math.max(0, Math.min(9, ship.x + dx));
          const nextY = Math.max(0, Math.min(9, ship.y + dy));
          
          if (ship.isFriend && (ship.x !== nextX || ship.y !== nextY)) {
            addTerminalLog(`[FRIEND SENSORS]: Friend vessel "${ship.name}" has shifted positions within the sector map.`, "info");
          }
          
          return {
            ...ship,
            x: nextX,
            y: nextY
          };
        }
        return ship;
      });

      const activeSectorCell = galaxy[playerX]?.[playerY];
      const systemProfile = STAR_SYSTEMS_PROFILES[sysIndex];
      if (!systemProfile) return updated;

      const sectorShipsAtPlayer = updated.filter(
        (s) => s.systemIndex === sysIndex && s.x === playerX && s.y === playerY
      );
      
      let targetCount = 0;
      if (activeSectorCell?.station) {
        targetCount = 2 + Math.floor(Math.random() * 2);
      } else if (activeSectorCell?.planet) {
        targetCount = 1 + Math.floor(Math.random() * 2);
      } else {
        const roll = Math.random();
        if (systemProfile.safetyRating < 30) {
          targetCount = roll < 0.55 ? 1 : 0;
        } else {
          targetCount = roll < 0.3 ? 1 : 0;
        }
      }

      if (sectorShipsAtPlayer.length < targetCount) {
        const diffCount = targetCount - sectorShipsAtPlayer.length;
        
        let candidatesInSystem = updated.filter(
          (s) => s.systemIndex === sysIndex && !(s.x === playerX && s.y === playerY) && !s.isFriend
        );
        
        if (candidatesInSystem.length < diffCount) {
          candidatesInSystem = updated.filter(
            (s) => !(s.systemIndex === sysIndex && s.x === playerX && s.y === playerY) && !s.isFriend
          );
        }

        candidatesInSystem.sort(() => 0.5 - Math.random());
        const idsToMove = candidatesInSystem.slice(0, diffCount).map(s => s.id);
        
        updated = updated.map((ship) => {
          if (idsToMove.includes(ship.id)) {
            let personality = ship.personality;
            let faction = ship.faction;
            
            if (activeSectorCell?.station) {
              personality = Math.random() < 0.6 ? "Merchant" : "Patrol";
            } else if (systemProfile.safetyRating < 30) {
              personality = Math.random() < 0.7 ? "Outlaw" : "Miner";
            } else if (systemProfile.safetyRating > 75) {
              personality = Math.random() < 0.6 ? "Patrol" : "Explorer";
            }
            
            if (personality === "Patrol") {
              faction = systemProfile.factionOwner !== "Independent" && systemProfile.factionOwner !== "None" 
                ? systemProfile.factionOwner 
                : (Math.random() < 0.5 ? "Hegemony" : "Consortium");
            } else if (personality === "Outlaw") {
              faction = Math.random() < 0.5 ? "Syndicate" : "Void Cult";
            }

            return {
              ...ship,
              systemIndex: sysIndex,
              x: playerX,
              y: playerY,
              personality,
              faction
            };
          }
          return ship;
        });
      }

      return updated;
    });
  };

  // --- WARP JUMP ENGINE NAVIGATION ---
  const triggerWarpJump = (targetX: number, targetY: number) => {
    if (combatState.active) {
      addTerminalLog("WARP FAILURE: Tactical lock engaged. Cannot engage warp engines while under combat conditions.", "danger");
      AudioEngine.playBeep(200, 0.15, "sawtooth");
      return;
    }
    if (isDrilling) {
      addTerminalLog("WARP FAILURE: Ship's sub-systems are Coral Anchored to planetary drill cores. Complete or cease drilling before jumping.", "danger");
      AudioEngine.playBeep(200, 0.15, "sawtooth");
      return;
    }

    const dx = Math.abs(position.x - targetX);
    const dy = Math.abs(position.y - targetY);

    if (dx > 1 || dy > 1) {
      if (dx <= 3 && dy <= 3) {
        setExperimentalJumpTarget({ x: targetX, y: targetY });
        return;
      }
      addTerminalLog("WARP LIMIT EXCEEDED: Warp safety protocols restrict warp jumps to adjacent coordinates [Range Limit 1, Max Experimental Fold Range: 3].", "danger");
      AudioEngine.playBeep(200, 0.15, "sawtooth");
      return;
    }

    const discount = getWarpFuelDiscount();
    const requiredFuel = isInDeepSpace ? 0.0 : (shipSpecs.fuelConsumption * discount);

    if (fuel < requiredFuel) {
      // Out of warp fuel! Check if we have backup impulse fuel.
      const impulseCost = 25;
      if (backupFuel < impulseCost) {
        addTerminalLog("FATAL ERROR: Insufficient warp fuel cores AND backup impulse fuel tanks are fully depleted! Visit a spaceport to refuel.", "danger");
        AudioEngine.playUIError();
        return;
      }

      addTerminalLog("⚠️ [WARP FUEL CORES EMPTY]: Automatically engaging backup IMPULSE PROPULSION engines...", "danger");
      addTerminalLog(`⚡ Initiating sub-light impulse flight to Sector [X:${targetX - 4}, Y:${targetY - 4}]. Travel Time: 15 seconds. Backup fuel level reduced.`, "info");
      
      setPreviousPosition({ ...position });
      setBackupFuel((bf) => Math.max(0, bf - impulseCost));
      AudioEngine.playWarp();

      setCountdownModal({
        active: true,
        title: "AUXILIARY IMPULSE PROPULSION ACTIVE",
        desc: `Flying sub-light under impulse thrusters. Bypassing hyperspace folding...`,
        seconds: 15,
        maxSeconds: 15,
        targetX,
        targetY
      });
      return;
    }

    // Initialize Warp jump countdown overlay
    setPreviousPosition({ ...position });
    setFuel((f) => f - requiredFuel);
    AudioEngine.playWarp();
    
    if (hyperdriveOverclocked) {
      setHyperdriveOverclocked(false);
      addTerminalLog("⚡ [OVERCLOCK DISCHARGE]: Hyperdrive injectors discharged core pressure during the warp jump.", "info");
    }

    // Decrement fatigued crew recovery jumps
    setFatiguedCrew((prev) => {
      const next = { ...prev };
      let updated = false;
      for (const id in next) {
        if (next[id] > 0) {
          next[id] -= 1;
          updated = true;
          if (next[id] === 0) {
            const member = crew.find((c) => c.id === id);
            addTerminalLog(`BRIDGE BULLETIN: Specialist ${member ? member.name : "specialist"} has fully recovered from exhaustion and returned to duty.`, "success");
            delete next[id];
          }
        }
      }
      return next;
    });

    setPosition({ x: targetX, y: targetY });
    updateSectorShips(targetX, targetY, currentSystemIndex);

    // Decrement wingmen contract durations
    setWingmen((prev) =>
      prev
        .map((w) => {
          const nextDuration = w.duration - 1;
          if (nextDuration <= 0) {
            addTerminalLog(`[WINGMAN CONTRACT EXPIRED]: Wingman ${w.name} has departed your formation as their flight contract expired.`, "info");
            return null;
          }
          return { ...w, duration: nextDuration };
        })
        .filter((w): w is Wingman => w !== null)
    );

    const updatedGalaxy = [...galaxy];
    if (updatedGalaxy[targetX]?.[targetY]) {
      updatedGalaxy[targetX][targetY].explored = true;

      // Hazard weather effects upon entering sector
      const hazard = updatedGalaxy[targetX][targetY].hazardType;
      if (hazard === "solar_flare") {
        addTerminalLog("🚨 ENVIRONMENT HAZARD: Direct Solar Flare collision! Thermal shielding absorbing particles. Ship shields drained by -8 SP.", "danger");
        setShields((s) => Math.max(0, s - 8));
        AudioEngine.playBeep(180, 0.4, "sawtooth");
      } else if (hazard === "grav_well") {
        addTerminalLog("🚨 ENVIRONMENT HAZARD: Void Gravity Well detected. Escape trajectory requires DOUBLE warp fuel cores. Passive shield rechargers encumbered.", "danger");
        AudioEngine.playBeep(120, 0.3, "sine");
      } else if (hazard === "ion_nebula") {
        addTerminalLog("⚠️ ENVIRONMENT HAZARD: Entering Ionized Gas Nebula. Local scanners completely jammed. Starbridge evasion parameters increased by +15% but warp fuel economy reduced by +25%.", "info");
        AudioEngine.playBeep(220, 0.25, "triangle");
      }

      // Science Director or Science Explorer sweep radius
      const scientist = crew.find((c) => c.role === "Science Director");
      const maxLevelScientist = scientist && (scientist.level >= 10 || (scientist.activeAbilities && scientist.activeAbilities.includes("deep_scanner")));

      if (maxLevelScientist || activeShip === "science_explorer") {
        for (let nx = Math.max(0, targetX - 2); nx <= Math.min(9, targetX + 2); nx++) {
          for (let ny = Math.max(0, targetY - 2); ny <= Math.min(9, targetY + 2); ny++) {
            if (updatedGalaxy[nx]?.[ny]) updatedGalaxy[nx][ny].explored = true;
          }
        }
        addTerminalLog(maxLevelScientist ? "Quantum Sensors: Max-level scientist sweep mapped 5x5 grid quadrants." : "Aegis Sensor Array: Advanced sweeps mapped secondary quadrants.", "success");
      } else if (crew.some((c) => c.role === "Spy")) {
        for (let nx = Math.max(0, targetX - 1); nx <= Math.min(9, targetX + 1); nx++) {
          for (let ny = Math.max(0, targetY - 1); ny <= Math.min(9, targetY + 1); ny++) {
            if (updatedGalaxy[nx]?.[ny]) updatedGalaxy[nx][ny].explored = true;
          }
        }
        addTerminalLog("Spy Interceptors: Auto-mapped adjacent sectors.", "info");
      }
    }
    setGalaxy(updatedGalaxy);

    // Audio Warp Sound
    AudioEngine.playWarp();

    // Promote Pilot crew member
    promoteCrewSpecialist("Pilot", 15);

    setCountdownModal({
      active: true,
      title: "WARP FLIGHT JUMP ACTIVE",
      desc: `Bending sub-space physics fields. Transitioning ship coordinates into Sector [X:${targetX - 4}, Y:${targetY - 4}]...`,
      seconds: 3,
      maxSeconds: 3,
      targetX,
      targetY
    });
  };

  const executeExperimentalWarpJump = (targetX: number, targetY: number) => {
    setExperimentalJumpTarget(null);

    if (combatState.active) {
      addTerminalLog("WARP FAILURE: Tactical lock engaged. Cannot engage warp engines while under combat conditions.", "danger");
      AudioEngine.playBeep(200, 0.15, "sawtooth");
      return;
    }

    if (isDrilling) {
      addTerminalLog("WARP FAILURE: Ship's sub-systems are Coral Anchored to planetary drill cores.", "danger");
      AudioEngine.playBeep(200, 0.15, "sawtooth");
      return;
    }

    const dx = Math.abs(position.x - targetX);
    const dy = Math.abs(position.y - targetY);

    const discount = getWarpFuelDiscount();
    const distance = Math.max(dx, dy);
    const requiredFuel = shipSpecs.fuelConsumption * distance * discount;

    if (fuel < requiredFuel) {
      addTerminalLog(`FATAL ERROR: Insufficient warp fuel cores for deep experimental jump. Required: ${requiredFuel.toFixed(1)} cores.`, "danger");
      AudioEngine.playBeep(180, 0.25, "square");
      return;
    }

    // Deduct fuel safely
    setFuel((f) => Math.max(0, f - requiredFuel));

    if (hyperdriveOverclocked) {
      setHyperdriveOverclocked(false);
    }

    // Calculate engine reliability
    const engineId = fittedComponents.engine || "engine_standard";
    let reliability = 50;
    if (engineId === "engine_ion") reliability = 70;
    else if (engineId === "engine_fusion") reliability = 85;
    else if (engineId === "engine_singularity") reliability = 99;

    const roll = Math.random() * 100;
    let finalTargetX = targetX;
    let finalTargetY = targetY;
    let tookDamage = 0;

    if (roll <= reliability) {
      addTerminalLog(`⚡ [EXPERIMENTAL JUMP SUCCESS]: Sub-space fold successful! Safe decelerating at targeted coordinates [X:${targetX - 4}, Y:${targetY - 4}].`, "success");
    } else {
      const failureRoll = Math.random();
      if (failureRoll < 0.5) {
        let driftX = targetX + (Math.random() < 0.5 ? -1 : 1);
        let driftY = targetY + (Math.random() < 0.5 ? -1 : 1);
        finalTargetX = Math.max(0, Math.min(9, driftX));
        finalTargetY = Math.max(0, Math.min(9, driftY));
        tookDamage = 25;
        setHull((h) => Math.max(0, h - tookDamage));
        addTerminalLog(`⚠️ [EXPERIMENTAL JUMP DRIFT]: Sub-space fold failed! Gravity shear drifted the ship to adjacent coordinates. Hull sustained ${tookDamage} structural damage.`, "danger");
      } else {
        tookDamage = 50;
        setHull((h) => Math.max(0, h - tookDamage));
        addTerminalLog(`💥 [EXPERIMENTAL JUMP CRITICAL]: Fold drive core ruptured during transit! Arrived at targeted sector [X:${targetX - 4}, Y:${targetY - 4}], but ship sustained ${tookDamage} severe hull integrity damage!`, "danger");
      }
    }

    // Move player and finalize map discovery
    setPreviousPosition({ ...position });
    setPosition({ x: finalTargetX, y: finalTargetY });
    updateSectorShips(finalTargetX, finalTargetY, currentSystemIndex);

    // Decrement wingmen contract durations
    setWingmen((prev) =>
      prev
        .map((w) => {
          const nextDuration = w.duration - 1;
          if (nextDuration <= 0) {
            addTerminalLog(`[WINGMAN CONTRACT EXPIRED]: Wingman ${w.name} has departed your formation.`, "info");
            return null;
          }
          return { ...w, duration: nextDuration };
        })
        .filter((w): w is Wingman => w !== null)
    );

    const updatedGalaxy = [...galaxy];
    if (updatedGalaxy[finalTargetX]?.[finalTargetY]) {
      updatedGalaxy[finalTargetX][finalTargetY].explored = true;

      // Map surrounding area if maxed Scientist or science explorer
      const scientist = crew.find((c) => c.role === "Science Director");
      const maxLevelScientist = scientist && (scientist.level >= 10 || (scientist.activeAbilities && scientist.activeAbilities.includes("deep_scanner")));

      if (maxLevelScientist || activeShip === "science_explorer") {
        for (let nx = Math.max(0, finalTargetX - 2); nx <= Math.min(9, finalTargetX + 2); nx++) {
          for (let ny = Math.max(0, finalTargetY - 2); ny <= Math.min(9, finalTargetY + 2); ny++) {
            if (updatedGalaxy[nx]?.[ny]) updatedGalaxy[nx][ny].explored = true;
          }
        }
      } else if (crew.some((c) => c.role === "Spy")) {
        for (let nx = Math.max(0, finalTargetX - 1); nx <= Math.min(9, finalTargetX + 1); nx++) {
          for (let ny = Math.max(0, finalTargetY - 1); ny <= Math.min(9, finalTargetY + 1); ny++) {
            if (updatedGalaxy[nx]?.[ny]) updatedGalaxy[nx][ny].explored = true;
          }
        }
      }
    }
    setGalaxy(updatedGalaxy);

    AudioEngine.playWarp();
    promoteCrewSpecialist("Pilot", 25);

    setCountdownModal({
      active: true,
      title: "EXPERIMENTAL JUMP TRANSIT",
      desc: tookDamage > 0 
        ? `EMERGENCY TRANSMITTING: Structural hulls leaking atmosphere. Decelerating into coordinates [X:${finalTargetX - 4}, Y:${finalTargetY - 4}]...`
        : `FOLD SPACE DRIFT: High frequency warp fields holding. Decelerating into coordinates [X:${finalTargetX - 4}, Y:${finalTargetY - 4}]...`,
      seconds: 4,
      maxSeconds: 4,
      targetX: finalTargetX,
      targetY: finalTargetY
    });
  };

  // Finalizes warp arrival checks once countdown concludes
  const handleWarpArrival = (tx: number, ty: number) => {
    const cell = galaxy[tx]?.[ty];
    if (!cell) return;

    addTerminalLog(`Warp flight jump succeeded. Safe deceleration recorded at [X:${tx - 4}, Y:${ty - 4}].`, "success");

    // Faction territorials ambient description logs
    if (cell.faction === "hegemony") {
      addTerminalLog("Solar Hegemony quadrant: Enormous navy patrol battlecruisers monitor orbital commercial lanes.", "info");
    } else if (cell.faction === "syndicate") {
      addTerminalLog("Rebel Syndicate sector: Beacons are highly encrypted; scan signals record rogue smugglers hulls.", "info");
    } else if (cell.faction === "cult") {
      addTerminalLog("Void Cult system: Unstable sub-space magnetic fields crackle through the engine panels.", "info");
    } else if (cell.faction === "consortium") {
      addTerminalLog("Merchant Consortium sector: Mass-scale digital advertisements advertise mining materials, trade tariffs and shipyard frames.", "info");
    }

    // Story Checkpoints checks
    handleQuestWaypointChecks(tx, ty);

    // Standard board contracts checks
    const contractsAtDestination = activeMissions.filter(
      (m) => m.targetSector && m.targetSector.x === tx && m.targetSector.y === ty
    );
    contractsAtDestination.forEach((m) => {
      handleDeliverContract(m.id);
    });

    // Patrol scans
    const hasContraband = countCargoItem("contraband") > 0;
    const repVal = reputation[cell.faction] || 0;

    if (cell.faction !== "neutral" && Math.random() < (isSilentRunning ? 0.05 : 0.28)) {
      triggerPatrolCruiserScan(cell.faction, hasContraband, repVal);
    } else {
      let ambushChance = cell.hostileChance || 0.2;
      if (isSilentRunning) ambushChance *= 0.3; // Much harder to detect in silent running
      if (crew.some((c) => c.role === "Spy")) {
        ambushChance = Math.max(0.05, ambushChance - getAmbushReduction());
      }
      // Apply pilot evasion bonus to ambush evasion
      const evasionBonus = getEvasionBonus();
      ambushChance = Math.max(0.05, ambushChance - (evasionBonus * 0.25));

      if (Math.random() < ambushChance) {
        triggerAmbushBattle();
      } else {
        setActiveTab("cockpit");
      }
    }
  };

  const handleQuestWaypointChecks = (qx: number, qy: number) => {
    setActiveQuests((prevQuests) =>
      prevQuests.map((quest) => {
        if (quest.currentStep < quest.steps.length) {
          const step = quest.steps[quest.currentStep];
          if (step.x === qx && step.y === qy) {
            if (step.requiresManual) {
              addTerminalLog(`📍 CAMPAIGN SIGNAL STABILIZED: "${quest.title}". Engage specialized cockpit functions for "${step.action}".`, "info");
              AudioEngine.playBeep(700, 0.25, "triangle");
              return quest; // Must be clicked manually in HUD option!
            }
            if (step.combatEnemies && step.combatEnemies.length > 0) {
              addTerminalLog(`⚠️ INTERCEPT TARGET: Sensed hostile signatures matching ${step.stepTitle || "target"} at Sector [X:${qx}, Y:${qy}]! Entering combat...`, "danger");
              triggerSpecificBattle(step.combatEnemies);
              return quest; // Do NOT advance yet, we will advance on combat victory!
            } else {
              const nextStep = quest.currentStep + 1;
              addTerminalLog(`[CAMPAIGN REACHED]: ${quest.title}`, "success");
              addTerminalLog(step.log, "info");
              AudioEngine.playBeep(900, 0.3, "sine");

              if (nextStep === quest.steps.length) {
                addTerminalLog(`⭐ CAMPAIGN COMPLETED: ${quest.title} finalized!`, "success");
                setCredits((cr) => cr + quest.rewardCredits);
                addTerminalLog(`Reward Ledger credited: +${quest.rewardCredits} Credits!`, "loot");

                if (quest.ultimateRewardWeapon) {
                  setInventoryWeapons((inv) => [...inv, quest.ultimateRewardWeapon!]);
                  addTerminalLog(`ULTIMATE LOOT: Acquired exotic weapon: ${WEAPON_ITEMS[quest.ultimateRewardWeapon!]?.name || quest.ultimateRewardWeapon}!`, "success");
                }
                if (quest.ultimateRewardComponent) {
                  setOwnedComponents((ow) => [...ow, quest.ultimateRewardComponent!]);
                  addTerminalLog(`ULTIMATE LOOT: Acquired specialized frame: ${COMPONENT_ITEMS[quest.ultimateRewardComponent!]?.name || quest.ultimateRewardComponent}!`, "success");
                }
              }
              return { ...quest, currentStep: nextStep };
            }
          }
        }
        return quest;
      })
    );
  };

  const handleCompleteQuestStep = (questId: string) => {
    setActiveQuests((prevQuests) =>
      prevQuests.map((quest) => {
        if (quest.id === questId && quest.currentStep < quest.steps.length) {
          const step = quest.steps[quest.currentStep];
          const nextStep = quest.currentStep + 1;
          addTerminalLog(`[CAMPAIGN SUCCESS]: Completed "${step.action}"`, "success");
          addTerminalLog(step.log, "info");
          AudioEngine.playBeep(900, 0.3, "sine");

          if (nextStep === quest.steps.length) {
            addTerminalLog(`⭐ CAMPAIGN COMPLETED: ${quest.title} finalized!`, "success");
            setCredits((cr) => cr + quest.rewardCredits);
            addTerminalLog(`Reward Ledger credited: +${quest.rewardCredits} Credits!`, "loot");

            if (quest.ultimateRewardWeapon) {
              setInventoryWeapons((inv) => [...inv, quest.ultimateRewardWeapon!]);
              addTerminalLog(`ULTIMATE LOOT: Acquired exotic weapon: ${WEAPON_ITEMS[quest.ultimateRewardWeapon!]?.name || quest.ultimateRewardWeapon}!`, "success");
            }
            if (quest.ultimateRewardComponent) {
              setOwnedComponents((ow) => [...ow, quest.ultimateRewardComponent!]);
              addTerminalLog(`ULTIMATE LOOT: Acquired specialized frame: ${COMPONENT_ITEMS[quest.ultimateRewardComponent!]?.name || quest.ultimateRewardComponent}!`, "success");
            }
          }
          return { ...quest, currentStep: nextStep };
        }
        return quest;
      })
    );
  };

  // --- PATROL ESCORT SYSTEM ---
  const triggerPatrolCruiserScan = (factionKey: string, isSmuggling: boolean, standing: number) => {
    const faction = FACTIONS[factionKey];
    addTerminalLog(`WARNING: Intercepted by a ${faction.name} Border Guard Cruiser! Accessing cargo databases...`, "danger");

    if (isSmuggling) {
      addTerminalLog("Patrol Commander: 'Surrender illegal custom nanites or face kinetic orbital fire!'", "danger");
      // Interaction handled within main cockpit HUD Logs options
      setActiveTab("cockpit");
    } else {
      addTerminalLog(`Patrol verified cargo. Telemetries: NOMINAL. Diplomatic standing increased.`, "success");
      setReputation((prev) => ({ ...prev, [factionKey]: (prev[factionKey] || 0) + 2 }));
      setActiveTab("cockpit");
    }
  };

  const triggerShipAttack = (ship: SectorShip) => {
    // Determine ship strength based on class
    const isBig = ship.shipClass.includes("Cruiser") || ship.shipClass.includes("Destroyer") || ship.shipClass.includes("Hauler");
    const enemy: Enemy = {
      name: `${ship.name} [${ship.shipClass}]`,
      hull: isBig ? 180 : 80,
      maxHull: isBig ? 180 : 80,
      shields: isBig ? 90 : 40,
      maxShields: isBig ? 90 : 40,
      damage: isBig ? 24 : 14,
      weaponType: isBig ? "torpedo_launcher" : "pulse_laser",
      weapons: isBig ? "Dual heavy fusion torpedo arrays" : "Laser turrets MkII",
      xpReward: isBig ? 100 : 50,
      loot: ship.inventory.map(item => item.type).concat(["scrap", "fuel"])
    };
    
    setCombatLog([`ALERT: Engaged hostile vessel ${ship.name}! Tactical weapons system hot!`]);
    setCombatState({
      active: true,
      enemies: [enemy],
      activeEnemyIndex: 0,
      enemy: enemy,
      playerTurn: true,
      qteRunning: false,
      qteSpeed: 1.6,
      qtePointerPos: 0,
      qteDirection: 1,
      zoneCenter: 50,
      zoneDirection: 1,
      zoneSpeed: 2,
      targetZoneRange: { start: 40, end: 60 },
      activeWeaponFiring: null,
      selectedWeakPoint: null,
      novaCooldown: 0
    });
    
    // Decrease reputation with their faction
    const factionKey = ship.faction.toLowerCase() === "void cult" ? "cult" : ship.faction.toLowerCase();
    setReputation((prev) => ({
      ...prev,
      [factionKey]: Math.max(-100, (prev[factionKey] || 0) - 15)
    }));
    
    // Set individual rep to 0 and remove friend status if applicable
    setSectorShips((prev) =>
      prev.map((s) => (s.id === ship.id ? { ...s, reputation: 0, isFriend: false } : s))
    );

    addTerminalLog(`🚨 TACTICAL ALERT: ${ship.name} has initialized attack arrays! Standby for immediate combat!`, "danger");
    setActiveTab("combat");
  };

  // Shield regeneration
  useEffect(() => {
    const shieldId = fittedComponents.shield;
    const shieldComponent = shieldId ? COMPONENT_ITEMS[shieldId] : undefined;
    const bonus = shieldComponent ? shieldComponent.bonus : 0;
    
    // Scale regen rate by reactor system power: 3=1x, 0=0x, 6=2x
    let powerScale = 1.0;
    if (powerAllocation.sys === 0) powerScale = 0.0;
    else if (powerAllocation.sys === 1) powerScale = 0.4;
    else if (powerAllocation.sys === 2) powerScale = 0.7;
    else if (powerAllocation.sys === 3) powerScale = 1.0;
    else if (powerAllocation.sys === 4) powerScale = 1.3;
    else if (powerAllocation.sys === 5) powerScale = 1.6;
    else if (powerAllocation.sys === 6) powerScale = 2.0;

    // Check gravity well hazard (shield recharge completely offline)
    const currentCell = galaxyRef.current[position.x]?.[position.y];
    if (currentCell?.hazardType === "grav_well") {
      powerScale = 0.0;
    }

    const regenRate = 0.02 * (1 + bonus / 100) * powerScale;

    if (regenRate <= 0) return;

    const interval = setInterval(() => {
      setShields(prev => Math.min(maxShield, prev + maxShield * regenRate));
    }, 15000);

    return () => clearInterval(interval);
  }, [fittedComponents, maxShield, powerAllocation.sys, position]);

  // --- COMBAT ARENA MOTORS ---
  const triggerAmbushBattle = (forcedFleetSize?: "small" | "medium" | "large") => {
    const enemiesTemplates = [
      {
        name: "Scourge Scout Corvus",
        hull: 60,
        maxHull: 60,
        shields: 30,
        maxShields: 30,
        damage: 12,
        weaponType: "pulse_laser" as const,
        weapons: "Pulse Laser Cannon MK1",
        xpReward: 25,
        loot: ["fuel", "scrap"]
      },
      {
        name: "Rebel Vanguard Cruiser",
        hull: 110,
        maxHull: 110,
        shields: 60,
        maxShields: 60,
        damage: 18,
        weaponType: "torpedo_launcher" as const,
        weapons: "HE Torpedo Tube MK2",
        xpReward: 45,
        loot: ["fuel", "ore", "torpedo", "plasma_gas"]
      },
      {
        name: "Gorgon Dreadnought",
        hull: 220,
        maxHull: 220,
        shields: 120,
        maxShields: 120,
        damage: 28,
        weaponType: "plasma_spike" as const,
        weapons: "Plasma Thermal Beam MK3",
        xpReward: 90,
        loot: ["contraband", "orichalcum", "neutronium", "weapon_frame"]
      }
    ];

    let fleetSize: "small" | "medium" | "large" | null = null;
    if (forcedFleetSize) {
      fleetSize = forcedFleetSize;
    } else {
      const isFleet = Math.random() < 0.35;
      if (isFleet) {
        const roll = Math.random();
        if (roll < 0.6) fleetSize = "small";
        else if (roll < 0.9) fleetSize = "medium";
        else fleetSize = "large";
      }
    }

    const battleList: Enemy[] = [];

    if (fleetSize) {
      let shipCount = 3;
      if (fleetSize === "medium") shipCount = 5;
      if (fleetSize === "large") shipCount = 7;

      addTerminalLog(`[TACTICAL ALIGNMENT]: Red-alert! Incoming hostile fleet squadron (${fleetSize.toUpperCase()} tier: ${shipCount} ships detected!)`, "danger");
      setCombatLog([`WARNING: Hostile fleet compose detected surrounding coordinate grids! Size: ${fleetSize.toUpperCase()}`]);

      // If it's a large fleet battle, include the battleship as the 7th ship!
      const includeBattleship = (fleetSize === "large");
      const escortCount = includeBattleship ? shipCount - 1 : shipCount;

      for (let i = 0; i < escortCount; i++) {
        const template = enemiesTemplates[Math.floor(Math.random() * 3)];
        battleList.push({
          ...template,
          name: `Fleet Escort ${String.fromCharCode(65 + i)} [${template.name.split(' ').slice(-1)}]`
        });
      }

      if (includeBattleship) {
        battleList.push({
          name: "Sovereign-Class Battleship Prime",
          hull: 500,
          maxHull: 500,
          shields: 150,
          maxShields: 150,
          damage: 55,
          weaponType: "plasma_spike",
          weapons: "Mega Giga-Watt Overload Laser Cannon",
          xpReward: 1200,
          loot: ["weapon_frame", "neutronium", "contraband", "orichalcum", "antimatter_capsule"],
          shieldLayers: 3,
          maxShieldLayers: 3,
          isBattleship: true
        });
        addTerminalLog(`[SYSTEM FAILURE DETECTED]: Massive flagship thermal signal signature! Sovereign-Class Battleship Prime (500 HP) identified!`, "danger");
      }
    } else {
      const diff = Math.min(enemiesTemplates.length - 1, Math.floor(Math.random() * 3));
      battleList.push({ ...enemiesTemplates[diff] });
      setCombatLog([`ALERT: Target focus acquired. Tactical weapons system hot!`]);
    }

    setCombatState({
      active: true,
      enemies: battleList,
      activeEnemyIndex: 0,
      enemy: battleList[0],
      playerTurn: true,
      qteRunning: false,
      qteSpeed: 1.5,
      qtePointerPos: 0,
      qteDirection: 1,
      qteInterval: null,
      zoneCenter: 50,
      zoneDirection: 1,
      zoneSpeed: 0.5,
      targetZoneRange: { start: 38, end: 62 },
      activeWeaponFiring: null,
      selectedWeakPoint: null,
      novaCooldown: 0
    });

    setActiveTab("combat");
  };

  const triggerSpecificBattle = (customEnemies: Enemy[]) => {
    const copiedEnemies = JSON.parse(JSON.stringify(customEnemies));
    setCombatLog([`ALERT: Specialized target coordinates reached. Tactical weapons system hot!`]);
    setCombatState({
      active: true,
      enemies: copiedEnemies,
      activeEnemyIndex: 0,
      enemy: copiedEnemies[0],
      playerTurn: true,
      qteRunning: false,
      qteSpeed: 1.5,
      qtePointerPos: 0,
      qteDirection: 1,
      qteInterval: null,
      zoneCenter: 50,
      zoneDirection: 1,
      zoneSpeed: 0.5,
      targetZoneRange: { start: 38, end: 62 },
      activeWeaponFiring: null,
      selectedWeakPoint: null,
      novaCooldown: 0
    });
    setActiveTab("combat");
  };

  function getWeaponCapacity() {
    const weaponsSpec = crew.filter((c) => c.role === "Weapons Specialist");
    if (weaponsSpec.length === 0) return 1;
    
    const maxLvl = Math.max(...weaponsSpec.map(w => w.level));
    // Base 2 with specialist, rank up to max 5
    let capacity = 2 + Math.floor((maxLvl - 1) / 3);
    return Math.min(capacity, 5, equippedWeapons.length);
  }

  const handleFireWeapon = (slotIndex: number, ammoType?: string) => {
    if (!combatState.active) return;
    if (checkMalfunction()) return;
    const activeEnemy = combatState.enemies[combatState.activeEnemyIndex];
    if (!activeEnemy || activeEnemy.hull <= 0) return;

    const capacity = getWeaponCapacity();
    
    for (let i = 0; i < capacity; i++) {
        const index = (slotIndex + i) % equippedWeapons.length;
        const wepId = equippedWeapons[index];
        if (!wepId) continue;

        const wep = WEAPON_ITEMS[wepId];
        
        if (wep.needsAmmo && ammoType) {
          const ok = removeCargoItem(ammoType, 1);
          if (!ok) {
            addCombatLog(`WEAPON FAILURE: Failed to load ${ammoType} ammo cells.`);
            continue;
          }
        }

        if (wep.type === "shield_damaging") {
          AudioEngine.playLaser();
        } else {
          AudioEngine.playTorpedo();
        }

        let finalDmg = wep.damage;
        
        if (ammoType) {
          const bonus = ITEM_TEMPLATES[ammoType]?.bonusDmg || 0;
          finalDmg += bonus;
        }

        let calibrationBonus = 1.0;
        if (weaponsCalibrated) {
          calibrationBonus = 1.5; // +50% amplified charge damage
        }

        finalDmg = Math.floor(finalDmg * getWeaponDamageMultiplier() * calibrationBonus);

        let weakPointLog = "";
        if (combatState.selectedWeakPoint) {
            if (combatState.selectedWeakPoint === "thrusters") {
                finalDmg = Math.floor(finalDmg * 1.35);
                weakPointLog = " [SCAN WEAKPOINT HIT: THRUST FLAPS BURST]";
            } else if (combatState.selectedWeakPoint === "shields") {
                finalDmg = Math.floor(finalDmg * 1.5);
                weakPointLog = " [SCAN WEAKPOINT HIT: SHIELD HARMONIZER RUPTURED]";
            } else if (combatState.selectedWeakPoint === "reactor") {
                if (Math.random() < 0.25) {
                    finalDmg = activeEnemy.hull + activeEnemy.shields;
                    weakPointLog = " ⭐⭐⭐ [REACTOR CORE FISSION INSTAKILL EXPLOSION! COMPLETE DETONATION]";
                } else {
                    finalDmg = Math.floor(finalDmg * 5.0);
                    weakPointLog = " [REACTOR VENTS BURST: 5.0x AMPLIFIED BURST]";
                }
            }
        }

        if (wep.id === "sentient_chatterbox") {
          if (Math.random() < 0.15) {
            addCombatLog(`Sentient weapon chatterbox got distracted by cosmic radiation and missed entirely!`);
            continue;
          }
          if (Math.random() < 0.25) {
            finalDmg = Math.floor(finalDmg * 1.3);
            weakPointLog += ` [Sentient insult damage!]`;
          }
        }

        setHeat(prev => Math.min(100, prev + 2.5));

        if (wep.id === "retro_fission" && Math.random() < 0.12) {
          setShields((sh) => Math.max(0, sh - 15));
          addCombatLog(`Retro Fission retro-fired! Overcharged plasma misfire dealt 15 damage to your shields.`);
        }

        if (wep.id === "void_paradox") {
          if (Math.random() < 0.15) {
            addCombatLog(`Void Paradox accidentally healed the target for 20 structure points!`);
            activeEnemy.hull = Math.min(activeEnemy.maxHull, activeEnemy.hull + 20);
            continue;
          }
          if (Math.random() < 0.15) {
            activeEnemy.shields = 0;
            addCombatLog(`⭐⭐ Void Paradox triggered instant spatial shield disintegration! Enemy shield dropped to 0!`);
          }
        }

        if (wep.id === "consortium_gold") {
          if (credits >= 10) {
            setCredits((c) => c - 10);
            finalDmg = Math.floor(finalDmg * 2.0);
            weakPointLog += ` [Consortium Gold blast amplified 2.0x!]`;
          } else {
            finalDmg = Math.floor(finalDmg * 0.1);
            weakPointLog += ` [Consortium Gold blast sputtered! Out of cash!]`;
          }
        }

        let shieldDmg = 0;
        let hullDmg = 0;

        if (wep.type === "shield_damaging" && activeEnemy.shields > 0) {
          // Lasers do double damage to shields
          const mult = wep.shieldBonus || 2.0;
          const potential = finalDmg * mult;
          if (potential <= activeEnemy.shields) {
            activeEnemy.shields -= potential;
            shieldDmg = potential;
          } else {
            shieldDmg = activeEnemy.shields;
            const remainder = finalDmg - Math.floor(activeEnemy.shields / mult);
            activeEnemy.shields = 0;
            activeEnemy.hull = Math.max(0, activeEnemy.hull - remainder);
            hullDmg = remainder;
          }
        } else {
          // Standard balance or hull damaging
          if (activeEnemy.shields > 0) {
            if (activeEnemy.shields >= finalDmg) {
              activeEnemy.shields -= finalDmg;
              shieldDmg = finalDmg;
            } else {
              shieldDmg = activeEnemy.shields;
              const remainder = finalDmg - activeEnemy.shields;
              activeEnemy.shields = 0;
              activeEnemy.hull = Math.max(0, activeEnemy.hull - remainder);
              hullDmg = remainder;
            }
          } else {
            activeEnemy.hull = Math.max(0, activeEnemy.hull - finalDmg);
            hullDmg = finalDmg;
          }
        }

        addCombatLog(
          `Fired ${wep.name} on ${activeEnemy.name}! Dealt ${shieldDmg} shield damage and ${hullDmg} hull damage.${weakPointLog}`
        );

        if (activeEnemy.hull <= 0) {
          AudioEngine.playExplosion();
          addCombatLog(`✓ Foe destroyed by main battery fire: ${activeEnemy.name}!`);
          promoteCrewSpecialist("Weapons Specialist", 10);
          break;
        }
    }

    // Wingmen attack assistance sequence
    let currentTarget = activeEnemy;
    const livingWingmen = wingmen.filter((w) => !w.standingDown);

    livingWingmen.forEach((w) => {
      if (currentTarget.hull <= 0) {
        // Select next alive target
        const nextAliveIdx = combatState.enemies.findIndex((e) => e.hull > 0);
        if (nextAliveIdx !== -1) {
          currentTarget = combatState.enemies[nextAliveIdx];
        } else {
          return;
        }
      }

      let dmg = w.firepower;
      let dealToShields = false;
      if (w.focus === "shields" && currentTarget.shields > 0) {
        dmg = Math.floor(dmg * 1.5);
        dealToShields = true;
      }

      if (dealToShields) {
        if (dmg <= currentTarget.shields) {
          currentTarget.shields -= dmg;
          addCombatLog(`⚡ [WINGMAN SUPPORT]: ${w.name} (${w.shipType}) focused shields and stripped ${dmg} shield energy!`);
        } else {
          const rem = dmg - currentTarget.shields;
          addCombatLog(`⚡ [WINGMAN SUPPORT]: ${w.name} (${w.shipType}) stripped remaining ${currentTarget.shields} shields and dealt ${rem} hull damage!`);
          currentTarget.shields = 0;
          currentTarget.hull = Math.max(0, currentTarget.hull - rem);
        }
      } else {
        currentTarget.hull = Math.max(0, currentTarget.hull - dmg);
        addCombatLog(`⚡ [WINGMAN SUPPORT]: ${w.name} (${w.shipType}) focused hull structural grids and dealt ${dmg} raw hull damage!`);
      }

      if (currentTarget.hull <= 0) {
        AudioEngine.playExplosion();
        addCombatLog(`✓ Foe destroyed by wingman fire: ${currentTarget.name}!`);
        promoteCrewSpecialist("Weapons Specialist", 10);
      }
    });

    // Check if everything is dead after player + wingmen fire
    const fleetDead = combatState.enemies.every((e) => e.hull <= 0);
    if (fleetDead) {
      handleCombatVictory();
      return;
    }

    // Verify if active target died and update index if needed
    if (activeEnemy.hull <= 0) {
      const aliveIdx = combatState.enemies.findIndex((e) => e.hull > 0);
      setCombatState((prev) => ({
        ...prev,
        activeEnemyIndex: aliveIdx,
        enemy: prev.enemies[aliveIdx],
        selectedWeakPoint: null
      }));
    }

    // Clear weapons calibration buff
    if (weaponsCalibrated) {
      setWeaponsCalibrated(false);
      addCombatLog("⚡ [WEAPONS CALIBRATION SPENT]: The calibrated capacitor matrices discharged heavy energy boost.");
    }

    // Weapons Specialist Double Tap Overdrive check
    const spec = crew.find((c) => c.role === "Weapons Specialist");
    const doubleTapLevel = spec?.abilityLevels?.["double_tap"] || 0;
    const hasDoubleTap = (spec && spec.level >= 10) || doubleTapLevel > 0;
    const dtChance = hasDoubleTap ? 0.25 : 0;

    if (Math.random() < dtChance) {
      addCombatLog(`⭐⭐ [WEAPONS SPECIALIST TRICK]: Double Tap Overdrive activated! Weapons specialist ${spec?.name} grants a FREE shot. Your turn is maintained!`);
      AudioEngine.playBeep(1300, 0.4, "sine");
      // Keep activeEnemyIndex synchronized in state
      if (activeEnemy.hull <= 0) {
        const nextAliveIdx = combatState.enemies.findIndex((e) => e.hull > 0);
        if (nextAliveIdx !== -1) {
          setCombatState((prev) => ({
            ...prev,
            activeEnemyIndex: nextAliveIdx,
            enemy: prev.enemies[nextAliveIdx]
          }));
        }
      }
    } else {
      passTurnToEnemies();
    }
  };

  const passTurnToEnemies = () => {
    const livingEscorts = combatState.enemies
      .map((e, idx) => ({ e, idx }))
      .filter(({ e }) => e.hull > 0 && !e.isBattleship);
    const livingBattleship = combatState.enemies
      .map((e, idx) => ({ e, idx }))
      .filter(({ e }) => e.hull > 0 && e.isBattleship);

    let queue: number[] = [];
    if (livingEscorts.length > 0) {
      queue = livingEscorts.slice(0, 3).map(({ idx }) => idx);
    } else if (livingBattleship.length > 0) {
      // Battleship fires a 2-shot volley!
      queue = [livingBattleship[0].idx, livingBattleship[0].idx];
      addCombatLog(`⚠️ [WARNING]: Battleship Sovereign Prime charging its dual-cannon array! Preparing 2-shot volley!`);
    } else {
      // Just standard enemies
      queue = combatState.enemies
        .map((e, idx) => ({ e, idx }))
        .filter(({ e }) => e.hull > 0)
        .slice(0, 3)
        .map(({ idx }) => idx);
    }

    if (queue.length === 0) {
      setCombatState((prev) => ({
        ...prev,
        playerTurn: true,
        qteRunning: false,
        enemyAttackQueue: [],
        currentAttackerIndex: undefined
      }));
      return;
    }

    const activeAttacker = queue[0];
    const nextQueue = queue.slice(1);

    addCombatLog(`⚠️ Hostile action initiated! ${queue.length} enemy attack volleys incoming... Defend yourself!`);

    setCombatState((prev) => ({
      ...prev,
      playerTurn: false,
      selectedWeakPoint: null,
      qteRunning: true,
      qtePointerPos: 0,
      qteDirection: 1,
      zoneCenter: 40 + Math.floor(Math.random() * 25),
      enemyAttackQueue: nextQueue,
      currentAttackerIndex: activeAttacker
    }));
  };

  const handleDeflectResult = (success: boolean) => {
    if (!combatState.active) return;
    const attackerIdx = combatState.currentAttackerIndex !== undefined ? combatState.currentAttackerIndex : combatState.activeEnemyIndex;
    const attacker = combatState.enemies[attackerIdx];

    if (!attacker || attacker.hull <= 0) {
      // If attacker is dead or invalid, process next attacker in queue
      processNextEnemyAttack();
      return;
    }

    let baseDamage = attacker.damage;
    let desc = `The hostile ${attacker.name} fired ${attacker.weapons}!`;

    if (success) {
      const reduced = Math.floor(baseDamage * 0.15);
      desc += ` Deflection Harmonizer SUCCESSFUL! Reduced structural damage by 85%. Plated only ${reduced} points.`;
      baseDamage = reduced;

      AudioEngine.playDeflect();
      // Pilot XP reward on dodging
      promoteCrewSpecialist("Pilot", 25);
    } else {
      desc += ` Deflection harmonizer FAILED! Laser thermal burns scored bulkheads for ${baseDamage} points.`;
      AudioEngine.playGlitchHit();
    }

    // Apply damage to player
    setShields((sh) => {
      if (sh >= baseDamage) {
        return sh - baseDamage;
      } else {
        const remainder = baseDamage - sh;
        setHull((h) => Math.max(0, h - remainder));
        return 0;
      }
    });

    addCombatLog(desc);

    // Queue up next attack or return turn to player
    processNextEnemyAttack();
  };

  const processNextEnemyAttack = () => {
    const queue = combatState.enemyAttackQueue || [];
    if (queue.length > 0) {
      const nextAttackerIndex = queue[0];
      const nextQueue = queue.slice(1);

      addCombatLog(`[SENSORS WARNING]: Next volley incoming from ${combatState.enemies[nextAttackerIndex]?.name}!`);
      setCombatState((prev) => ({
        ...prev,
        currentAttackerIndex: nextAttackerIndex,
        enemyAttackQueue: nextQueue,
        qteRunning: true,
        qtePointerPos: 0,
        qteDirection: 1,
        zoneCenter: 40 + Math.floor(Math.random() * 25)
      }));
    } else {
      setCombatState((prev) => ({
        ...prev,
        playerTurn: true,
        qteRunning: false,
        enemyAttackQueue: [],
        currentAttackerIndex: undefined
      }));
    }
  };

  // Check Game Over condition
  useEffect(() => {
    if (hull <= 0 && !isDead) {
      setIsDead(true);
      AudioEngine.playExplosion();
      if (!deathReason) {
        setDeathReason("Hull integrity lost. Structural failure leading to catastrophic decompression.");
      }
      setCombatState((prev) => ({ ...prev, active: false }));
    }
  }, [hull, isDead, deathReason]);

  const handleCombatVictory = () => {
    addTerminalLog("TACTICAL DOGFIGHT VICTORY: All hostiles cleared!", "success");

    let totalCredits = 0;
    let lootRolled: string[] = [];

    combatState.enemies.forEach((en) => {
      totalCredits += en.xpReward * 4;
      en.loot.forEach((item) => {
        if (Math.random() < 0.7) {
          lootRolled.push(item);
        }
      });
    });

    setCredits((cr) => cr + totalCredits);
    addTerminalLog(`Credits ledger claimed: +${totalCredits} CR.`, "loot");

    // Create wreckage at this sector
    setGalaxy(prev => {
        const newGalaxy = [...prev];
        if (activeSector && newGalaxy[activeSector.x]) {
            newGalaxy[activeSector.x] = [...newGalaxy[activeSector.x]];
            newGalaxy[activeSector.x][activeSector.y] = {
                ...newGalaxy[activeSector.x][activeSector.y],
                wreckage: {
                    shipsCount: combatState.enemies.length,
                    collected: false
                }
            };
        }
        return newGalaxy;
    });
    addTerminalLog("WRECKAGE DETECTED: You may deploy a Salvage Beacon to collect credits from the remains.", "info");

    // Special rewards for station combat
    const isStationBattle = combatState.enemies.some(e => e.name.includes("Defense Grid"));
    if (isStationBattle && activeSector?.station) {
        addTerminalLog("TACTICAL VICTORY: Station defense grid dismantled! Massive loot cache secured!", "success");
        setCredits(cr => cr + 10000);
        addCargoItem("singularity_core", 1);
        addCargoItem("experimental_weapon_frame", 3);
        
        // Reputation decrease
        const faction = activeSector.faction;
        if (faction !== "neutral") {
           setReputation(prev => ({...prev, [faction]: Math.max(0, (prev[faction] || 0) - 100)}));
           addTerminalLog(`WARNING: Faction reputation with ${faction} has plummeted due to station destruction!`, "danger");
        }
        
        // Mark station as destroyed
        setGalaxy(prev => {
            const updated = [...prev];
            if (updated[activeSector.x] && updated[activeSector.x][activeSector.y]) {
                updated[activeSector.x][activeSector.y] = {
                    ...updated[activeSector.x][activeSector.y],
                    station: { ...updated[activeSector.x][activeSector.y].station!, destroyed: true }
                };
            }
            return updated;
        });
    }

    // Add cargo loots
    lootRolled.forEach((key) => {
      const ok = addCargoItem(key, 1);
      if (ok) {
        addTerminalLog(`Recovered scrap cargo module: ${ITEM_TEMPLATES[key]?.name || key}`, "loot");
      }
    });

    // Close state
    setCombatState((prev) => ({ ...prev, active: false }));
    setActiveTab("cockpit");

    // Check if player completed any combat-related quest step!
    setActiveQuests((prevQuests) =>
      prevQuests.map((quest) => {
        if (quest.currentStep < quest.steps.length) {
          const step = quest.steps[quest.currentStep];
          if (step.x === position.x && step.y === position.y && step.combatEnemies && step.combatEnemies.length > 0) {
            const nextStep = quest.currentStep + 1;
            addTerminalLog(`[BATTLE REPORT SUCCESS]: Defeated ${step.stepTitle || "the hostile target"}!`, "success");
            addTerminalLog(step.log, "info");
            AudioEngine.playBeep(900, 0.3, "sine");

            if (nextStep === quest.steps.length) {
              addTerminalLog(`⭐ CAMPAIGN COMPLETED: ${quest.title} finalized!`, "success");
              setCredits((cr) => cr + quest.rewardCredits);
              addTerminalLog(`Reward Ledger credited: +${quest.rewardCredits} Credits!`, "loot");

              if (quest.ultimateRewardWeapon) {
                setInventoryWeapons((inv) => [...inv, quest.ultimateRewardWeapon!]);
                addTerminalLog(`ULTIMATE LOOT: Acquired exotic weapon: ${WEAPON_ITEMS[quest.ultimateRewardWeapon!]?.name || quest.ultimateRewardWeapon}!`, "success");
              }
              if (quest.ultimateRewardComponent) {
                setOwnedComponents((ow) => [...ow, quest.ultimateRewardComponent!]);
                addTerminalLog(`ULTIMATE LOOT: Acquired specialized frame: ${COMPONENT_ITEMS[quest.ultimateRewardComponent!]?.name || quest.ultimateRewardComponent}!`, "success");
              }
            }
            return { ...quest, currentStep: nextStep };
          }
        }
        return quest;
      })
    );
  };

  const handleCallHelperInCombat = (helperId: string) => {
    const helper = sectorShips.find((s) => s.id === helperId);
    if (!helper) return;

    setCombatState((prev) => {
      if (!prev.active || !prev.enemy) return prev;
      
      const updatedEnemies = prev.enemies.map((enemy, idx) => {
        if (idx === prev.activeEnemyIndex) {
          const nextShields = Math.max(0, enemy.shields - 60);
          const nextHull = Math.max(0, enemy.hull - 60);
          return {
            ...enemy,
            shields: nextShields,
            hull: nextHull
          };
        }
        return enemy;
      });

      const currentActiveEnemy = updatedEnemies[prev.activeEnemyIndex];
      const isDead = currentActiveEnemy.hull <= 0;

      return {
        ...prev,
        enemies: updatedEnemies,
        enemy: currentActiveEnemy,
        playerTurn: !isDead
      };
    });

    // Reduce individual ship reputation slightly for utilizing their favor (-10 rep)
    setSectorShips((prev) =>
      prev.map((s) => (s.id === helperId ? { ...s, reputation: Math.max(0, s.reputation - 10) } : s))
    );

    addCombatLog(`[WARP IN]: Friend ship "${helper.name}" warped in and fired heavy antimatter torpedoes, dealing 60 DMG!`);
    addTerminalLog(`[COMBAT ASSIST]: Allied vessel "${helper.name}" entered orbit, fired torpedo broadsides, and covered your retreat lanes.`, "success");
    AudioEngine.playWarp();
  };

  const handleFlee = () => {
    const evasion = getEvasionBonus();
    const isEvasiveMaster = crew.some((c) => c.role === "Pilot" && c.level >= 10);
    const escapeRate = isEvasiveMaster ? 1.0 : 0.5 + evasion;

    if (Math.random() < escapeRate) {
      addTerminalLog("Slipstream evacuation SUCCESS! Escaped target dogfights.", "success");
      setCombatState((prev) => ({ ...prev, active: false }));
      setActiveTab("cockpit");
      setPosition({ ...previousPosition });
    } else {
      addCombatLog("EVACUATION FAILURE: Hostile signal scramblers locked onto warp engines! You couldn't bridge warp grids.");
      passTurnToEnemies();
    }
  };

  // Use Quick Belt consumables inside cockpit / combat
  const handleUseNanobots = () => {
    const cost = 1;
    const ok = removeCargoItem("nanobots", cost);
    if (ok) {
      setHull((h) => Math.min(maxHull, h + 25));
      addTerminalLog("Activated Repair bots: Sealed alloy plating. Restored +25 Hull Integrity.", "success");
    }
  };

  const handleUseShieldCore = () => {
    const cost = 1;
    const ok = removeCargoItem("shieldcore", cost);
    if (ok) {
      setShields((s) => Math.min(maxShield, s + 35));
      addTerminalLog("Activated Capacitor core: Powered shielding fields. Recharged +35 Shield Points.", "success");
    }
  };

  // --- STATIONS CONTRACT BOARD ---
  const handleAcceptMission = (mId: string) => {
    const cell = galaxy[position.x]?.[position.y];
    if (!cell || !cell.station) return;

    const idx = cell.station.missionBoard.findIndex((m) => m.id === mId);
    if (idx === -1) return;

    const contract = cell.station.missionBoard[idx];
    contract.status = "active";
    setActiveMissions((prev) => [...prev, contract]);
    addTerminalLog(`CONTRACT BOARD LOGGED: "${contract.title}" is active. Waypoint marked.`, "info");
  };

  const handleAcceptQuest = (quest: Quest) => {
    setActiveQuests((prev) => {
      if (prev.some((q) => q.title === quest.title)) return prev;
      return [...prev, quest];
    });
    addTerminalLog(`EPIC CAMPAIGN SECURED: "${quest.title}" has been registered. View coordinates on your Star Map.`, "success");
    AudioEngine.playBeep(1200, 0.45, "sine");
  };

  const buyBlackMarketCoordinates = () => {
    const fee = 250;
    if (credits < fee) {
      addTerminalLog("Cantina Informant: 'Clearance coordinates aren't free, spacer. Come back with 250 Credits.'", "danger");
      AudioEngine.playBeep(200, 0.2, "sawtooth");
      return;
    }

    // Search for a hidden black market in the galaxy
    let foundX = -1;
    let foundY = -1;
    for (let rx = 0; rx < 10; rx++) {
      for (let ry = 0; ry < 10; ry++) {
        const cell = galaxy[rx]?.[ry];
        if (cell && cell.hasBlackMarket && !cell.blackMarketRevealed) {
          foundX = rx;
          foundY = ry;
          break;
        }
      }
      if (foundX !== -1) break;
    }

    // If no hidden black market is left, create one in a random non-stationed belt/rocky sector
    if (foundX === -1) {
      const potential: {x: number, y: number}[] = [];
      for (let rx = 0; rx < 10; rx++) {
        for (let ry = 0; ry < 10; ry++) {
          const cell = galaxy[rx]?.[ry];
          if (cell && !cell.station && !cell.jumpGate && (rx !== 4 || ry !== 4)) {
            potential.push({x: rx, y: ry});
          }
        }
      }
      if (potential.length > 0) {
        const picked = potential[Math.floor(Math.random() * potential.length)];
        foundX = picked.x;
        foundY = picked.y;
      }
    }

    if (foundX !== -1) {
      setCredits((cr) => cr - fee);
      setGalaxy((prev) => {
        const updated = [...prev];
        const col = [...updated[foundX]];
        const cell = { ...col[foundY] };
        cell.hasBlackMarket = true;
        cell.blackMarketRevealed = true;
        cell.explored = true; // Mark explored so it is visible on StarMap
        cell.station = {
          name: "Obsidian Deep Black Market",
          techLevel: 5,
          techTitle: "Anarchist Black Market Depot",
          isBlackMarket: true,
          missionBoard: [],
          hiringLounge: []
        };
        col[foundY] = cell;
        updated[foundX] = col;
        return updated;
      });
      addTerminalLog(`[BAR INFORMANT]: 'Paid coordinates validated. Encrypted sub-space beacon signal unlocked at Sector [X:${foundX - 4}, Y:${foundY - 4}]. Dense asteroid field. It's a Black Market.'`, "success");
      AudioEngine.playBeep(1100, 0.4, "sine");
    } else {
      addTerminalLog("Cantina Informant: 'I've searched all sub-space relays. No active black market signatures are currently transmitting.'", "info");
    }
  };

  const handleDeliverContract = (mId: string) => {
    setActiveMissions((prevMissions) => {
      const idx = prevMissions.findIndex((m) => m.id === mId);
      if (idx === -1) return prevMissions;

      const mission = prevMissions[idx];
      setCredits((cr) => cr + mission.reward);
      setReputation((prev) => ({ ...prev, [mission.faction]: (prev[mission.faction] || 0) + 15 }));

      setCompletedMissionsCount((prev) => {
        const next = { ...prev };
        if (mission.type in next) {
          next[mission.type]++;
        }
        return next;
      });

      addTerminalLog(`CONTRACT SECURED: Successfully delivered parameters for "${mission.title}". Earned +${mission.reward} Credits.`, "success");
      AudioEngine.playBeep(950, 0.2, "sine");

      const updated = [...prevMissions];
      updated.splice(idx, 1);
      return updated;
    });
  };

  const handleBuyShipyardVessel = (shipId: string) => {
    const ship = SHIPS_BLUEPRINTS[shipId];
    if (!ship || credits < ship.price) return;

    setCredits((cr) => cr - ship.price);
    setActiveShip(shipId);
    setHull(ship.maxHull);
    setShields(ship.maxShield);

    // Filter equipped weapons slots to scale with hardpoints
    setEquippedWeapons((prev) => {
      const next = [...prev];
      if (next.length > ship.hardpoints) {
        return next.slice(0, ship.hardpoints);
      }
      while (next.length < ship.hardpoints) {
        next.push(null);
      }
      return next;
    });

    addTerminalLog(`DRYDOCK INITIATED: Successfully swaped starship frame to ${ship.name}! Attributes aligned.`, "success");
    AudioEngine.playBeep(1300, 0.5, "sine");
  };

  // --- HARDPOINT FITTING ENGINE ---
  const handleMountWeapon = (slotIndex: number, weaponId: string) => {
    const nextEquipped = [...equippedWeapons];
    nextEquipped[slotIndex] = weaponId;
    setEquippedWeapons(nextEquipped);

    // remove from inventory
    const idx = inventoryWeapons.indexOf(weaponId);
    if (idx !== -1) {
      const nextInv = [...inventoryWeapons];
      nextInv.splice(idx, 1);
      setInventoryWeapons(nextInv);
    }
  };

  const handleDismountWeapon = (slotIndex: number) => {
    const removedWepId = equippedWeapons[slotIndex];
    if (!removedWepId) return;

    const nextEquipped = [...equippedWeapons];
    nextEquipped[slotIndex] = null;
    setEquippedWeapons(nextEquipped);

    setInventoryWeapons((prev) => [...prev, removedWepId]);
  };

  const handleEquipComponent = (category: string, compId: string) => {
    const nextFitted = { ...fittedComponents };
    const prevCompId = nextFitted[category];

    nextFitted[category] = compId;
    setFittedComponents(nextFitted);

    if (category === "heat" && compId === "heat_core") {
      setIsHeatVulnerable(false);
    }

    // remove from inventory
    const idx = ownedComponents.indexOf(compId);
    if (idx !== -1) {
      const nextOwned = [...ownedComponents];
      nextOwned.splice(idx, 1);
      if (prevCompId && !prevCompId.endsWith("_standard")) {
        nextOwned.push(prevCompId);
      }
      setOwnedComponents(nextOwned);
    }
  };

  const handleDismountComponent = (category: string) => {
    const existing = fittedComponents[category];
    if (!existing || existing.endsWith("_standard")) return;

    const nextFitted = { ...fittedComponents };
    nextFitted[category] = `${category}_standard`;
    setFittedComponents(nextFitted);

    setOwnedComponents((prev) => [...prev, existing]);
  };

  const handleRepairAll = () => {
    if (!isDocked) {
      addTerminalLog("REPAIR FAILED: Ship must be docked to perform automated repairs.", "danger");
      return;
    }
    
    // Check for Nanobots and Shield Cores
    const nanobotQty = cargo.reduce((sum, s) => (s.type === "nanobots" ? sum + s.qty : sum), 0);
    const shieldCoreQty = cargo.reduce((sum, s) => (s.type === "shield_core" ? sum + s.qty : sum), 0);
    
    if (nanobotQty <= 0 && shieldCoreQty <= 0) {
      addTerminalLog("REPAIR FAILED: No Nanobots or Shield Cores in cargo.", "danger");
      return;
    }
    
    // Repair
    setHull(100);
    setShields(100);
    
    // Remove items
    if (nanobotQty > 0) removeCargoItem("nanobots", nanobotQty);
    if (shieldCoreQty > 0) removeCargoItem("shield_core", shieldCoreQty);
    
    addTerminalLog("REPAIR ALL SUCCESS: Hull and Shields restored to 100%. Consumed all available Nanobots and Shield Cores.", "success");
    AudioEngine.playBeep(600, 0.2, "square");
  };

  const handleEjectHeatCore = () => {
    if (fittedComponents.heat !== "heat_core") {
       addTerminalLog("EJECTION FAILED: No heat core fitted.", "danger");
       return;
    }
    
    setHeat(0);
    setIsHeatBuffActive(true);
    setIsHeatVulnerable(true);
    
    // Remove component
    handleDismountComponent("heat");
    
    addTerminalLog("HEAT CORE EJECTED: Heat flushed. Thermal immunity active for 60s. Hull vulnerable to rapid heating!", "success");
    
    setTimeout(() => {
       setIsHeatBuffActive(false);
    }, 60000);
  };

  // --- QUICK SAVE/LOAD FEATURES ---
  const handleQuicksaveLocal = () => {
    try {
      const saveState = {
        currentSystemIndex,
        credits,
        fuel,
        hull,
        shields,
        activeShip,
        position,
        cargo,
        equippedWeapons,
        inventoryWeapons,
        fittedComponents,
        ownedComponents,
        ownedBlueprints,
        crew,
        reputation,
        activeQuests,
        activeMissions,
        completedMissionsCount,
        powerAllocation,
        fatiguedCrew,
        isHeatBuffActive,
        isHeatVulnerable,
        sectorShips,
        galaxy,
        plannedRoute
      };
      localStorage.setItem("cosmos_os_quicksave_react", JSON.stringify(saveState));
      addTerminalLog("Local Quick-Save register successfully recorded.", "success");
      AudioEngine.playBeep(900, 0.1, "sine");
    } catch (e) {
      addTerminalLog("SYSTEM ERROR: Failed to write state registers to LocalStorage.", "danger");
    }
  };

  const handleQuickloadLocal = () => {
    try {
      const raw = localStorage.getItem("cosmos_os_quicksave_react");
      if (!raw) {
        addTerminalLog("Restore failure: No local Quick-Save registers found on this domain.", "danger");
        return;
      }
      const data = JSON.parse(raw);
      restoreLoadedState(data);
      addTerminalLog("Sector coordinates restored from local Quick-Save ledger.", "success");
      AudioEngine.playBeep(1100, 0.2, "sine");
      setEscMenuOverlay(false);
    } catch (e) {
      addTerminalLog("RESTORE ERROR: Outdated save registers detected.", "danger");
    }
  };

  const restoreLoadedState = (data: any) => {
    setIsDead(false);
    setDeathReason("");
    if (data.currentSystemIndex !== undefined) setCurrentSystemIndex(data.currentSystemIndex);
    if (data.credits !== undefined) setCredits(data.credits);
    if (data.fuel !== undefined) setFuel(data.fuel);
    if (data.hull !== undefined) setHull(data.hull);
    if (data.shields !== undefined) setShields(data.shields);
    if (data.activeShip !== undefined) setActiveShip(data.activeShip);
    if (data.position !== undefined) setPosition(data.position);
    if (data.cargo !== undefined) setCargo(data.cargo);
    if (data.equippedWeapons !== undefined) setEquippedWeapons(data.equippedWeapons);
    if (data.inventoryWeapons !== undefined) setInventoryWeapons(data.inventoryWeapons);
    if (data.fittedComponents !== undefined) {
      setFittedComponents({
        engine: "engine_standard",
        scanner: "scanner_standard",
        cargo: "cargo_standard",
        mining: "mining_standard",
        heat: "heat_core",
        ...data.fittedComponents
      });
    }
    if (data.ownedComponents !== undefined) setOwnedComponents(data.ownedComponents);
    if (data.ownedBlueprints !== undefined) setOwnedBlueprints(data.ownedBlueprints);
    if (data.crew !== undefined) setCrew(data.crew);
    if (data.reputation !== undefined) setReputation(data.reputation);
    if (data.activeQuests !== undefined) setActiveQuests(data.activeQuests);
    if (data.activeMissions !== undefined) setActiveMissions(data.activeMissions);
    if (data.completedMissionsCount !== undefined) setCompletedMissionsCount(data.completedMissionsCount);
    if (data.powerAllocation !== undefined) setPowerAllocation(data.powerAllocation);
    if (data.fatiguedCrew !== undefined) setFatiguedCrew(data.fatiguedCrew);
    if (data.isHeatBuffActive !== undefined) setIsHeatBuffActive(data.isHeatBuffActive);
    if (data.isHeatVulnerable !== undefined) setIsHeatVulnerable(data.isHeatVulnerable);
    if (data.sectorShips !== undefined) {
      setSectorShips(data.sectorShips);
    } else {
      setSectorShips(generateInitialSectorShips());
    }
    if (data.plannedRoute !== undefined) setPlannedRoute(data.plannedRoute);

    if (data.galaxy !== undefined) {
      setGalaxy(data.galaxy);
    } else {
      if (data.currentSystemIndex === -1) {
        buildDeepSpaceGalaxy();
      } else {
        buildProceduralGalaxy(data.currentSystemIndex !== undefined ? data.currentSystemIndex : 2);
      }
    }
  };

  // --- ACTIONS COUNTDOWN SCHEDULER MATRIX ---
  useEffect(() => {
    if (!countdownModal) return;

    if (countdownModal.seconds <= 0) {
      // Countdown completed!
      setCountdownModal(null);
      const tx = countdownModal.targetX !== undefined ? countdownModal.targetX : position.x;
      const ty = countdownModal.targetY !== undefined ? countdownModal.targetY : position.y;
      handleWarpArrival(tx, ty);
      return;
    }

    const timer = setTimeout(() => {
      AudioEngine.playBeep(440, 0.05, "sine");
      setCountdownModal((prev) => {
        if (!prev) return null;
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdownModal, position]);

  // --- GATE TRANSIT COUNTDOWN SCHEDULER ---
  useEffect(() => {
    if (!isGateJumping) return;

    if (isGateWarping) {
      return;
    }

    if (gateJumpCountdown <= 0) {
      setIsGateWarping(true);
      addTerminalLog("⚡ [GATEWAY TRANSIT ACTIVE]: Quantum singularity corridor stabilized! Engaging FTL corridor slide...", "success");
      AudioEngine.playWarp();

      gateWarpTimeoutRef.current = setTimeout(() => {
        gateWarpTimeoutRef.current = null;
        setIsGateJumping(false);
        setIsGateWarping(false);

        const sourceSystemIndex = currentSystemIndex;
        const targetSystemIndex = gateWarpTargetSystemIndex;

        setCurrentSystemIndex(targetSystemIndex);
        const newGrid = buildProceduralGalaxy(targetSystemIndex);

        let spawnX = 4;
        let spawnY = 4;
        let foundGate = false;

        for (let x = 0; x < 10; x++) {
          for (let y = 0; y < 10; y++) {
            const cell = newGrid[x]?.[y];
            if (cell && cell.jumpGate && cell.jumpGate.targetSystemIndex === sourceSystemIndex) {
              spawnX = x;
              spawnY = y;
              foundGate = true;
              break;
            }
          }
          if (foundGate) break;
        }

        setPosition({ x: spawnX, y: spawnY });
        setPreviousPosition({ x: spawnX, y: spawnY });

        if (isWormholeTransit) {
          addTerminalLog(`Successfully collapsed folding wormhole! Arrived back in the civilized star range of ${STAR_SYSTEMS_PROFILES[targetSystemIndex].name} at Sector [X:${spawnX - 4}, Y:${spawnY - 4}].`, "success");
        } else {
          addTerminalLog(`Successfully bridged spacefold jump gate into ${STAR_SYSTEMS_PROFILES[targetSystemIndex].name}! Materialized at Sector [X:${spawnX - 4}, Y:${spawnY - 4}].`, "success");
        }
        
        AudioEngine.playWarp();
      }, 3000);

      return;
    }

    const timer = setTimeout(() => {
      AudioEngine.playBeep(600 + (5 - gateJumpCountdown) * 100, 0.15, "sawtooth");
      setGateJumpCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isGateJumping, isGateWarping, gateJumpCountdown, gateWarpTargetSystemIndex, currentSystemIndex, isWormholeTransit]);

  const activeSector = galaxy[position.x]?.[position.y];
  
  const hullPercent = (hull / maxHull) * 100;
  const isHullCritical = hullPercent < 10;
  const isHullFatal = hullPercent < 2;
  const isHeatCritical = heat > 80;

  return (
    <div
      className={`crt ${flickerEnabled ? "crt-flicker" : ""} min-h-screen text-[13px] relative flex flex-col justify-between 
        ${isHullFatal && !isDead ? "unusable-ui" : ""}
        ${shieldHitPulse > 0 ? "shield-pulse-fx" : ""}
        ${lastHullDamageTime > 0 ? "hull-damage-fx" : ""}
      `}
      style={{
        backgroundColor: "#050b07",
        color: activeTheme === "green" ? "#33ff33" : activeTheme === "amber" ? "#ffb000" : "#00ffff",
        borderColor: activeTheme === "green" ? "#105010" : activeTheme === "amber" ? "#996600" : "#008888"
      }}
      onClick={() => AudioEngine.resumeContext()}
    >
      {/* Visual FX Overlays */}
      {hullPercent < 20 && (
        <div className="fixed inset-0 z-[100] pointer-events-none bg-red-600/20 animate-pulse" />
      )}
      {((isHullCritical && !isHullFatal) || isGlitching) && (
        <div className="fixed inset-0 z-[999] pointer-events-none hud-glitch-active" />
      )}
      {isHeatCritical && (
        <div className="fixed inset-0 z-[999] pointer-events-none thermal-throttle-active bg-red-900/10" />
      )}
      {/* GATE TRANSIT MODAL */}
      {isGateJumping && (
        <div id="gate-transit-modal" className="fixed inset-0 bg-black/98 backdrop-blur-md z-[120] flex flex-col justify-center items-center p-4">
          {!isGateWarping ? (
            /* 5-second countdown screen */
            <div className="max-w-md w-full border-2 border-red-500 p-8 rounded bg-neutral-950 text-center space-y-6 font-mono shadow-2xl animate-pulse text-red-500">
              <div className="text-red-500 text-xs font-bold tracking-[0.2em] uppercase animate-bounce">
                ⚠️ WARNING: SPATIAL GATEWAY INITIATED
              </div>
              
              <div className="text-xl font-bold uppercase tracking-wider text-white">
                Einstein-Rosen Corridor Bridge
              </div>

              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Tachyon stabilizers aligning. Fold engine core pre-igniting. Please brace for gravity vortex compression inside local bridge field!
              </p>

              <div className="text-7xl font-extrabold text-red-500 py-4 scale-110 drop-shadow-[0_0_15px_#ef4444]">
                {gateJumpCountdown}s
              </div>

              <div className="w-full bg-neutral-900 border border-red-500/30 rounded h-3 overflow-hidden p-0.5">
                <div
                  className="bg-red-500 h-full transition-all duration-300 shadow-[0_0_8px_#ef4444]"
                  style={{
                    width: `${((5 - gateJumpCountdown) / 5) * 100}%`
                  }}
                />
              </div>

              <div className="text-[8px] text-neutral-500 uppercase tracking-widest animate-pulse">
                DO NOT CUT POWER CORES DURING COALESCENCE
              </div>
            </div>
          ) : (
            /* 3-second warping screen */
            <div className="fixed inset-0 bg-black flex flex-col justify-center items-center p-4 font-mono select-none overflow-hidden">
              {/* Star tunnel simulation / warp effect using absolute background particles */}
              <div className="absolute inset-0 opacity-45 pointer-events-none">
                <div className="absolute w-[2px] h-[200px] bg-cyan-400 left-1/4 top-0 animate-[warp_0.5s_infinite_linear]"></div>
                <div className="absolute w-[3px] h-[300px] bg-blue-500 left-2/4 top-0 animate-[warp_0.3s_infinite_linear]"></div>
                <div className="absolute w-[1px] h-[150px] bg-white left-3/4 top-0 animate-[warp_0.7s_infinite_linear]"></div>
                <div className="absolute w-[2px] h-[250px] bg-purple-500 left-1/3 top-0 animate-[warp_0.4s_infinite_linear]"></div>
                <div className="absolute w-[4px] h-[400px] bg-cyan-300 left-2/3 top-0 animate-[warp_0.2s_infinite_linear]"></div>
              </div>

              <style>{`
                @keyframes warp {
                  0% { transform: translateY(-100%) scaleY(1); opacity: 0; }
                  50% { opacity: 1; }
                  100% { transform: translateY(100vh) scaleY(2); opacity: 0; }
                }
              `}</style>

              <div className="max-w-lg w-full text-center space-y-8 relative z-10">
                <div className="text-cyan-400 font-extrabold text-xs tracking-[0.3em] uppercase animate-pulse">
                  🌀 ENTERING SPACEFOLD SLIPSTREAM 🌀
                </div>

                <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 tracking-wider uppercase animate-bounce duration-1000">
                  WARPING...
                </div>

                <div className="text-[11px] text-neutral-400 max-w-sm mx-auto leading-relaxed border-t border-b border-cyan-500/20 py-4 animate-pulse">
                  Bridging Star System Folds.<br/>
                  Tachyon velocity exceeds lightspeed vectors.<br/>
                  Re-assembling atomic blueprint molecules...
                </div>

                <div className="flex justify-center items-center gap-1.5 text-[9px] text-cyan-400 font-bold animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
                  SYNCHRONIZING GRAVITATIONAL FIELD MATRICES
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* COUNTDOWN MODAL */}
      {countdownModal && (
        <div id="countdown-modal" className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[110] flex flex-col justify-center items-center p-4">
          <div className="max-w-md w-full border-2 border-current p-6 rounded bg-black text-center space-y-4 font-mono shadow-2xl">
            <div id="countdown-title" className="text-sm font-bold uppercase tracking-widest text-yellow-400 animate-pulse">
              {countdownModal.title}
            </div>
            <p id="countdown-desc" className="text-[11px] opacity-80 leading-normal">
              {countdownModal.desc}
            </p>
            <div className="text-5xl font-bold font-mono py-2 text-white" id="countdown-number">
              {countdownModal.seconds}
            </div>
            <div className="w-full bg-neutral-900 border border-current rounded h-2 overflow-hidden">
              <div
                id="countdown-progress-bar"
                className="bg-current h-full transition-all duration-300"
                style={{
                  width: `${((countdownModal.maxSeconds - countdownModal.seconds) / countdownModal.maxSeconds) * 100}%`
                }}
              />
            </div>
            <div className="text-[9px] opacity-50 uppercase tracking-wider">INTERFACE LOCKED DURING TRANSIT MANEUVERS</div>
          </div>
        </div>
      )}

      {/* EXPERIMENTAL JUMP CONFIRMATION MODAL */}
      {experimentalJumpTarget && (() => {
        const targetX = experimentalJumpTarget.x;
        const targetY = experimentalJumpTarget.y;
        const dx = Math.abs(position.x - targetX);
        const dy = Math.abs(position.y - targetY);
        const distance = Math.max(dx, dy);
        
        const discount = getWarpFuelDiscount();
        const requiredFuel = shipSpecs.fuelConsumption * distance * discount;
        const hasEnoughFuel = fuel >= requiredFuel;

        const engineId = fittedComponents.engine || "engine_standard";
        let reliability = 50;
        let engineName = "Standard Warp Drive";
        if (engineId === "engine_ion") {
          reliability = 70;
          engineName = "Ion Thruster Drive";
        } else if (engineId === "engine_fusion") {
          reliability = 85;
          engineName = "Thermonuclear Core Drive";
        } else if (engineId === "engine_singularity") {
          reliability = 99;
          engineName = "Singularity Fold Drive";
        }

        return (
          <div id="experimental-jump-modal" className="fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full border-2 border-yellow-500 p-6 rounded bg-black text-left space-y-4 font-mono shadow-2xl">
              <div className="text-sm font-bold uppercase tracking-widest text-yellow-400 flex items-center gap-2">
                <span>⚠️</span> WARNING: EXPERIMENTAL WARP FOLD JUMP
              </div>
              
              <p className="text-[11px] opacity-90 leading-relaxed text-neutral-300">
                You are about to execute an experimental warp fold jump bypassing safety protocols to Sector <strong>[X:{targetX - 4}, Y:{targetY - 4}]</strong> ({distance} jumps away).
              </p>

              <div className="bg-neutral-900 border border-yellow-500/20 p-3 rounded space-y-2 text-[10px] text-neutral-400">
                <div className="flex justify-between">
                  <span>PROPULSION UNIT:</span>
                  <strong className="text-white uppercase font-bold">{engineName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>JUMP DISTANCE:</span>
                  <strong className="text-white font-mono">{distance} sectors</strong>
                </div>
                <div className="flex justify-between">
                  <span>FUEL CONSUMPTION:</span>
                  <strong className={hasEnoughFuel ? "text-emerald-400 font-mono" : "text-red-400 font-mono font-bold animate-pulse"}>
                    {requiredFuel.toFixed(1)} / {fuel.toFixed(1)} cores
                  </strong>
                </div>
                <div className="border-t border-white/10 my-1" />
                <div className="flex justify-between text-yellow-400 font-bold">
                  <span>ENGINE RELIABILITY RATING:</span>
                  <strong className="font-mono text-xs">{reliability}% Success Chance</strong>
                </div>
              </div>

              <div className="text-[9px] text-yellow-500/70 border border-yellow-500/10 p-2.5 rounded bg-yellow-950/5 leading-normal">
                <strong>CALCULATION NOTE:</strong> A failed jump outcome carries a 50% risk of drifting coordinates to a random adjacent quadrant (taking 25 hull damage) or a 50% risk of a gravitational core rupture (taking 50 structural hull damage).
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  id="cancel-experimental-jump"
                  onClick={() => {
                    setExperimentalJumpTarget(null);
                    AudioEngine.playBeep(400, 0.1, "sine");
                  }}
                  className="flex-1 py-2 border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white font-bold text-xs rounded transition uppercase cursor-pointer"
                >
                  Abstain Fold
                </button>
                <button
                  id="confirm-experimental-jump"
                  disabled={!hasEnoughFuel}
                  onClick={() => {
                    executeExperimentalWarpJump(targetX, targetY);
                  }}
                  className={`flex-1 py-2 font-bold text-xs rounded transition uppercase tracking-wider text-black border ${
                    hasEnoughFuel 
                      ? "bg-yellow-400 hover:bg-yellow-500 border-yellow-400 cursor-pointer" 
                      : "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 cursor-pointer"
                  }`}
                >
                  Execute Jump
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {abandonMissionConfirmOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur z-50 flex flex-col justify-center items-center p-4 font-mono">
          <div className="max-w-md w-full border border-red-500/50 p-6 bg-black relative shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <h2 className="text-xl font-bold tracking-widest text-red-500 mb-2 uppercase flex items-center gap-2">
              <AlertTriangle size={20} />
              Confirm Abandon Mission
            </h2>
            <p className="text-sm text-neutral-400 mb-6">
              Are you sure you want to abandon all active missions? You will lose any progress and potential rewards. This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setAbandonMissionConfirmOpen(false);
                }}
                className="flex-1 py-2 border border-neutral-700 text-neutral-400 hover:text-white hover:border-white transition uppercase text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setActiveMissions([]);
                  addTerminalLog("MISSION ABORTED: Active contracts have been terminated by commander override.", "danger");
                  setAbandonMissionConfirmOpen(false);
                  AudioEngine.playBeep(200, 0.2, "sawtooth");
                }}
                className="flex-1 py-2 border border-red-500 bg-red-950/20 text-red-500 hover:bg-red-500 hover:text-black transition uppercase text-xs font-bold"
              >
                [ ABANDON ]
              </button>
            </div>
          </div>
        </div>
      )}

      {isMiningMiniGameOpen && (
        <MiningFrequencyMiniGame 
          targetFrequency={miningTargetFreq} 
          onClose={(success) => {
            setIsMiningMiniGameOpen(false);
            if (success) {
                addTerminalLog("MINING SUCCESS: Frequency matched, extracting resources...", "success");
            } else {
                addTerminalLog("MINING FAILURE: Frequency mismatch, deposit damaged.", "danger");
            }
          }}
        />
      )}

      {/* ESC MENU OPERATIONS MENU */}
      {escMenuOverlay && (
        <div id="systems-esc-overlay" className="fixed inset-0 bg-black/90 backdrop-blur z-40 flex flex-col justify-center items-center p-4 font-mono">
          <div className="max-w-md w-full border-2 border-current p-6 rounded bg-black relative shadow-2xl space-y-4">
            <button
              onClick={() => setEscMenuOverlay(false)}
              className="absolute top-2.5 right-2.5 text-[10px] border border-current px-2 py-1 rounded hover:bg-current hover:text-black transition cursor-pointer font-bold"
            >
              X CLOSE
            </button>
            <h2 className="text-lg font-bold text-center border-b border-current pb-2 mb-4 tracking-widest flex items-center justify-center gap-2">
              <FolderLock size={16} /> SYSTEM OPERATIONS MANUAL
            </h2>

            <div className="space-y-3">
              <button
                onClick={handleQuicksaveLocal}
                className="w-full py-2.5 border border-current bg-current/5 hover:bg-current/15 text-xs rounded transition flex items-center justify-center gap-2 cursor-pointer font-bold"
              >
                QUICKSAVE TO LEDGER
              </button>

              <button
                onClick={handleQuickloadLocal}
                className="w-full py-2.5 border border-current bg-current/5 hover:bg-current/15 text-xs rounded transition flex items-center justify-center gap-2 cursor-pointer font-bold"
              >
                QUICKLOAD FROM LEDGER
              </button>

              <div className="border-t border-dashed border-current/30 pt-3 text-center">
                <button
                  onClick={() => {
                    setEscMenuOverlay(false);
                    setActiveTab("main_menu");
                  }}
                  className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black text-[10px] font-bold rounded transition uppercase"
                >
                  Exit to Main Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER STATUS PANEL */}
      <header className="border-b border-current/20 bg-black/60 backdrop-blur px-4 py-2 flex flex-wrap items-center justify-between z-10 gap-2 font-mono">
        <div className="flex items-center space-x-3 select-none">
          <span className="text-xl font-bold tracking-widest">COSMOS-OS v9.0</span>
          <span className="text-[9px] px-2 py-0.5 border border-current rounded bg-current/5 text-current opacity-80 uppercase tracking-widest font-bold">
            MODULAR ENGINE ACTIVE
          </span>
        </div>

        {/* Theme customization tabs & Flicker */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setTheme("green")}
            className={`px-2.5 py-1.5 border rounded text-[9px] font-bold transition cursor-pointer ${
              activeTheme === "green" ? "bg-[#33ff33] text-black border-[#33ff33]" : "border-emerald-500/50 hover:bg-emerald-950/20"
            }`}
          >
            GREEN
          </button>
          <button
            onClick={() => setTheme("amber")}
            className={`px-2.5 py-1.5 border rounded text-[9px] font-bold transition cursor-pointer ${
              activeTheme === "amber" ? "bg-[#ffb000] text-black border-[#ffb000]" : "border-amber-500/50 hover:bg-amber-950/20"
            }`}
          >
            AMBER
          </button>
          <button
            onClick={() => setTheme("cyan")}
            className={`px-2.5 py-1.5 border rounded text-[9px] font-bold transition cursor-pointer ${
              activeTheme === "cyan" ? "bg-[#00ffff] text-black border-[#00ffff]" : "border-cyan-500/50 hover:bg-cyan-950/20"
            }`}
          >
            CYAN
          </button>
        </div>
      </header>

      {/* CORE WORKSPACE PANEL */}
      <main className="flex-grow w-full max-w-7xl mx-auto p-2 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Cockpit Diagnostics & Crew Column */}
        <aside id="cockpit-sidebar" className="lg:col-span-3 flex flex-col space-y-4 max-lg:hidden">
          <Diagnostics
            hull={hull}
            maxHull={maxHull}
            shields={shields}
            maxShields={maxShield}
            fuel={fuel}
            maxFuel={shipSpecs.maxFuel}
            regenRate={getShieldRegenRate()}
            fuelSavings={(1 - getWarpFuelDiscount()) * 100}
            nanobotsQty={cargo.reduce((sum, s) => (s.type === "nanobots" ? sum + s.qty : sum), 0)}
            shieldCoresQty={cargo.reduce((sum, s) => (s.type === "shieldcore" ? sum + s.qty : sum), 0)}
            onUseNanobots={handleUseNanobots}
            onUseShieldCore={handleUseShieldCore}
            shipClass={shipSpecs.name}
          />

          {/* Ship Reactor Power Allocation Board */}
          <section className="bg-black/80 border border-current p-3.5 rounded font-mono text-xs space-y-2 relative overflow-hidden shadow-lg">
            <div className="flex justify-between items-center border-b border-current/30 pb-1.5 text-current uppercase font-bold select-none text-[10px]">
              <span className="flex items-center gap-1">
                <Zap size={11} className="text-yellow-400 animate-pulse" /> Reactor Power Grid
              </span>
              <span className="text-[9px] text-yellow-400">Nodes: {powerAllocation.wep + powerAllocation.sys + powerAllocation.eng}/9</span>
            </div>
            <div className="space-y-2.5 text-[11px] py-1">
              {/* Weapons Power Grid (WEP) */}
              <div className="flex items-center justify-between">
                <div className="w-16">
                  <span className="font-bold text-red-500 text-left block">WEP [PWR]</span>
                </div>
                <div className="flex items-center gap-1 flex-1 px-2.5">
                  {[1, 2, 3, 4, 5, 6].map((node) => (
                    <div
                      key={node}
                      className={`h-3 w-2.5 rounded-sm transition-all duration-100 ${
                        node <= powerAllocation.wep ? "bg-red-500 shadow-[0_0_4px_#ef4444]" : "bg-neutral-800"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1 font-mono text-[9px]">
                  <button
                    onClick={() => {
                      if (powerAllocation.wep > 0) {
                        setPowerAllocation((p) => ({ ...p, wep: p.wep - 1 }));
                        AudioEngine.playBeep(300, 0.05, "sine");
                      }
                    }}
                    className="w-4 h-4 border border-current hover:bg-current hover:text-black flex items-center justify-center rounded transition font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <button
                    onClick={() => {
                      const total = powerAllocation.wep + powerAllocation.sys + powerAllocation.eng;
                      if (total < 9 && powerAllocation.wep < 6) {
                        setPowerAllocation((p) => ({ ...p, wep: p.wep + 1 }));
                        AudioEngine.playBeep(450, 0.05, "sine");
                      }
                    }}
                    disabled={powerAllocation.wep + powerAllocation.sys + powerAllocation.eng >= 9 || powerAllocation.wep >= 6}
                    className="w-4 h-4 border border-current hover:bg-current hover:text-black flex items-center justify-center rounded transition font-bold disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Systems/Shields Power Grid (SYS) */}
              <div className="flex items-center justify-between">
                <div className="w-16">
                  <span className="font-bold text-blue-400 text-left block">SYS [DEF]</span>
                </div>
                <div className="flex items-center gap-1 flex-1 px-2.5">
                  {[1, 2, 3, 4, 5, 6].map((node) => (
                    <div
                      key={node}
                      className={`h-3 w-2.5 rounded-sm transition-all duration-100 ${
                        node <= powerAllocation.sys ? "bg-blue-400 shadow-[0_0_4px_#60a5fa]" : "bg-neutral-800"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1 font-mono text-[9px]">
                  <button
                    onClick={() => {
                      if (powerAllocation.sys > 0) {
                        setPowerAllocation((p) => ({ ...p, sys: p.sys - 1 }));
                        AudioEngine.playBeep(300, 0.05, "sine");
                      }
                    }}
                    className="w-4 h-4 border border-current hover:bg-current hover:text-black flex items-center justify-center rounded transition font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <button
                    onClick={() => {
                      const total = powerAllocation.wep + powerAllocation.sys + powerAllocation.eng;
                      if (total < 9 && powerAllocation.sys < 6) {
                        setPowerAllocation((p) => ({ ...p, sys: p.sys + 1 }));
                        AudioEngine.playBeep(450, 0.05, "sine");
                      }
                    }}
                    disabled={powerAllocation.wep + powerAllocation.sys + powerAllocation.eng >= 9 || powerAllocation.sys >= 6}
                    className="w-4 h-4 border border-current hover:bg-current hover:text-black flex items-center justify-center rounded transition font-bold disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Engines Power Grid (ENG) */}
              <div className="flex items-center justify-between">
                <div className="w-16">
                  <span className="font-bold text-emerald-400 text-left block">ENG [FTL]</span>
                </div>
                <div className="flex items-center gap-1 flex-1 px-2.5">
                  {[1, 2, 3, 4, 5, 6].map((node) => (
                    <div
                      key={node}
                      className={`h-3 w-2.5 rounded-sm transition-all duration-100 ${
                        node <= powerAllocation.eng ? "bg-emerald-400 shadow-[0_0_4px_#34d399]" : "bg-neutral-800"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1 font-mono text-[9px]">
                  <button
                    onClick={() => {
                      if (powerAllocation.eng > 0) {
                        setPowerAllocation((p) => ({ ...p, eng: p.eng - 1 }));
                        AudioEngine.playBeep(300, 0.05, "sine");
                      }
                    }}
                    className="w-4 h-4 border border-current hover:bg-current hover:text-black flex items-center justify-center rounded transition font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <button
                    onClick={() => {
                      const total = powerAllocation.wep + powerAllocation.sys + powerAllocation.eng;
                      if (total < 9 && powerAllocation.eng < 6) {
                        setPowerAllocation((p) => ({ ...p, eng: p.eng + 1 }));
                        AudioEngine.playBeep(450, 0.05, "sine");
                      }
                    }}
                    disabled={powerAllocation.wep + powerAllocation.sys + powerAllocation.eng >= 9 || powerAllocation.eng >= 6}
                    className="w-4 h-4 border border-current hover:bg-current hover:text-black flex items-center justify-center rounded transition font-bold disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <div className="text-[9px] text-neutral-400 leading-tight pt-1 text-center">
              WEP: <span className="text-white">{(getWeaponDamageMultiplier() * 100).toFixed(0)}% DMG</span> | 
              ENG: <span className="text-white">{(getWarpFuelDiscount() * 100).toFixed(0)}% FUEL</span> | 
              SYS: <span className="text-white">{powerAllocation.sys === 0 ? "OFF" : `${powerAllocation.sys * 30}% DEF`}</span>
            </div>
          </section>

          {/* Drill telemetry diagnostics card */}
          {isDrilling && (
            <section className="bg-black/80 border border-yellow-500/80 p-3.5 rounded font-mono text-xs space-y-3 relative overflow-hidden shadow-lg">
              <div className="flex justify-between items-center text-yellow-500 border-b border-yellow-500/40 pb-1.5 font-bold select-none animate-pulse">
                <span className="flex items-center gap-1">
                  <Activity size={12} className="animate-spin" /> RESONANT CORE HARVESTER
                </span>
                <span>{Math.ceil((3000 - drillElapsedMs) / 1000)}s</span>
              </div>
              <div className="space-y-1 text-[11px] leading-tight text-yellow-500/90 text-left">
                <div className="flex justify-between">
                  <span>Target Resonance:</span> 
                  <strong className="text-white font-bold">{drillTargetFrequency} Hz</strong>
                </div>
                <div className="flex justify-between">
                  <span>Drill Frequency:</span> 
                  <strong className="text-yellow-400 font-bold">{drillUserFrequency} Hz</strong>
                </div>
                <div className="flex justify-between">
                  <span>Resonancy Status:</span>
                  <span className={Math.abs(drillUserFrequency - drillTargetFrequency) <= 4 ? "text-emerald-400 font-bold font-mono" : Math.abs(drillUserFrequency - drillTargetFrequency) >= 20 ? "text-red-500 font-bold font-mono animate-pulse" : "text-yellow-500 font-mono"}>
                    {Math.abs(drillUserFrequency - drillTargetFrequency) <= 4 ? "PERFECT RESONANCE (+50% Yield)" : Math.abs(drillUserFrequency - drillTargetFrequency) >= 20 ? "UNSTABLE RUNAWAY (Danger!)" : "BALANCED CALIBRATION"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Node Deposits Left:</span>
                  <strong className="text-white">{drillRemainingUnits} units</strong>
                </div>
                <div className="flex justify-between border-t border-yellow-500/10 pt-1 mt-1">
                  <span>Deposit Scanned Yield:</span>
                  <strong className={scannedYield === null ? "text-red-400 font-bold" : "text-cyan-400 font-bold"}>
                    {scannedYield === null ? "50% (UNSCANNED PENALTY)" : `${scannedYield}% Yield Node`}
                  </strong>
                </div>
              </div>

              {/* Instability Alert Banner */}
              {galaxy[position.x]?.[position.y]?.planet?.resourceNode?.unstable && (
                <div className="bg-red-950/40 border border-red-500/40 text-red-400 text-[10px] p-2 rounded leading-tight select-none flex flex-col gap-0.5">
                  <span className="font-extrabold text-red-400 flex items-center gap-1">⚠️ TECTIONIC CRUSTAL INSTABILITY DETECTED</span>
                  <span className="text-neutral-400 text-[9px]">The ground is unstable. Chance of fracture collapses vaporizing -2 to -3 extra units.</span>
                </div>
              )}

              {/* Gaseous Siphon Banner */}
              {galaxy[position.x]?.[position.y]?.planet?.resourceNode?.isGaseous && (
                <div className="bg-cyan-950/40 border border-cyan-500/40 text-cyan-400 text-[10px] p-2 rounded leading-tight select-none flex flex-col gap-0.5">
                  <span className="font-extrabold text-cyan-400 flex items-center gap-1">💨 GASEOUS ATMOSPHERE HARVESTER ACTIVE</span>
                  <span className="text-neutral-400 text-[9px]">Atmospheric siphons operating at pressurized shielding metrics.</span>
                </div>
              )}

              {/* Slider tuner */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-neutral-400">
                  <span>40 Hz</span>
                  <span>90 Hz</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="90"
                  value={drillUserFrequency}
                  onChange={(e) => {
                    setDrillUserFrequency(parseInt(e.target.value));
                    AudioEngine.playBeep(200 + (parseInt(e.target.value) * 4), 0.02, "triangle");
                  }}
                  className="w-full accent-yellow-500 bg-neutral-900 cursor-pointer h-1.5 rounded-lg appearance-none"
                />
              </div>

              <div className="w-full bg-neutral-900 border border-yellow-500/30 rounded h-2 overflow-hidden shadow-inner">
                <div className="bg-yellow-500 h-full transition-all duration-75" style={{ width: `${(drillElapsedMs / 3000) * 100}%` }} />
              </div>

              {/* Keyboard tuner and Radar Sweep sub-actions */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-yellow-500/10">
                <button
                  type="button"
                  onClick={() => {
                    setMiningTargetFreq(drillTargetFrequency);
                    setIsMiningMiniGameOpen(true);
                  }}
                  className="py-1.5 border border-cyan-500/50 text-cyan-400 bg-cyan-950/10 hover:bg-cyan-500 hover:text-black font-bold text-[9px] uppercase tracking-wider rounded transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  ⌨️ Keyboard Tuner
                </button>
                <button
                  type="button"
                  onClick={runManualDepositScan}
                  disabled={isScanning}
                  className="py-1.5 border border-purple-500/50 text-purple-400 bg-purple-950/10 hover:bg-purple-500 hover:text-black font-bold text-[9px] uppercase tracking-wider rounded transition flex items-center justify-center gap-1 disabled:opacity-40 cursor-pointer"
                >
                  📡 {isScanning ? "Scanning..." : "Radar Sweep"}
                </button>
              </div>

              <button
                type="button"
                onClick={haltDrills}
                className="w-full py-1.5 border border-red-500 text-red-500 bg-red-950/20 hover:bg-red-500 hover:text-black font-bold text-[9px] rounded transition cursor-pointer tracking-wider"
              >
                Retract Drill Matrix
              </button>
            </section>
          )}

          {/* Crew Manifest panel */}
          <section className="bg-black/80 border border-current p-4 rounded relative font-mono">
            <div className="flex justify-between items-center border-b border-current pb-2 mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <User size={13} /> Star Bridge Roster
              </h2>
              <span className="text-[10px] text-yellow-500 font-mono">
                {crew.length} / {shipSpecs.maxCrew} Stations
              </span>
            </div>

            <div id="crew-list-container" className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
              {crew.map((member, index) => {
                let milestoneText = "Milestone Rank: 3, 5, 8, 10";
                if (member.role === "Pilot") {
                  if (member.level >= 10) milestoneText = "⭐ LEVEL 10: Slipstream (100% Escapes)";
                  else if (member.level >= 8) milestoneText = "⭐ LEVEL 8: Thermal Flares";
                  else if (member.level >= 5) milestoneText = "⭐ LEVEL 5: Afterburner Evasion (+10%)";
                  else if (member.level >= 3) milestoneText = "⭐ LEVEL 3: Slingshot Jump (-10% Fuel)";
                } else if (member.role === "Weapons Specialist") {
                  if (member.level >= 10) milestoneText = "⭐ LEVEL 10: Double Tap Overdrive";
                  else if (member.level >= 8) milestoneText = "⭐ LEVEL 8: Titanium Coring (+20% Hull)";
                  else if (member.level >= 5) milestoneText = "⭐ LEVEL 5: Munitions Save (30% Free)";
                  else if (member.level >= 3) milestoneText = "⭐ LEVEL 3: Armor Penetration (+15%)";
                } else if (member.role === "Science Director") {
                  if (member.level >= 10) milestoneText = "⭐ LEVEL 10: 5x5 Grid Deep Scanning Sensor";
                  else if (member.level >= 8) milestoneText = "⭐ LEVEL 8: Weakpoint Diagnostics (+15% Crit)";
                  else if (member.level >= 5) milestoneText = "⭐ LEVEL 5: Anomaly Overdrive (Double Rewards)";
                  else if (member.level >= 3) milestoneText = "⭐ LEVEL 3: Scanner Targeting Grid";
                } else if (member.role === "Miner") {
                  if (member.level >= 10) milestoneText = "⭐ LEVEL 10: Carbon-Bore Laser Matrix";
                  else if (member.level >= 8) milestoneText = "⭐ LEVEL 8: Quantum Ore Purifier (+30% Val)";
                  else if (member.level >= 5) milestoneText = "⭐ LEVEL 5: Nuclear Drills (0 Fuel Cost)";
                  else if (member.level >= 3) milestoneText = "⭐ LEVEL 3: Laser Extraction (+2 Yield)";
                }

                const isMilestonePending = !!member.pendingMilestoneUpgrade;

                return (
                  <div key={member.id} className={`p-2 border rounded bg-black/40 text-[10px] relative group leading-relaxed shadow-sm transition-all duration-300 ${isMilestonePending ? "border-yellow-400 bg-yellow-950/15 animate-pulse" : "border-current/30"}`}>
                    <div 
                      className={`flex justify-between font-bold leading-normal ${isMilestonePending ? "cursor-pointer text-yellow-300 hover:text-yellow-100" : "text-white"}`}
                      onClick={() => isMilestonePending && handleOpenMilestoneUpgrade(member)}
                    >
                      <span className="flex items-center gap-1.5">
                        {isMilestonePending && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping inline-block" />}
                        {member.name} ({member.role})
                      </span>
                      <span className={isMilestonePending ? "text-yellow-400 font-extrabold uppercase text-[9px] tracking-wider" : "text-emerald-400"}>
                        {isMilestonePending ? "★ SELECT ABILITY" : `RANK ${member.level}`}
                      </span>
                    </div>
                    <div className="text-[9px] opacity-70">XP Matrix: {member.exp}/100</div>
                    <div className="text-[8px] text-yellow-500/80 italic mt-0.5">{milestoneText}</div>

                    {/* Display active special abilities, if any */}
                    {member.activeAbilities && member.activeAbilities.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {member.activeAbilities.map((abId) => {
                          const pool = MILESTONE_ABILITIES_POOL[member.role] || [];
                          const ab = pool.find((a) => a.id === abId);
                          const lvl = member.abilityLevels?.[abId] || 1;
                          return (
                            <span key={abId} className="px-1 py-0.5 bg-neutral-900 border border-current/20 rounded-[2px] text-[7px] text-cyan-400 uppercase tracking-widest">
                              {ab ? ab.name : abId} Lvl {lvl}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <button
                      onClick={() => setShowCrewDismissConfirmation(index)}
                      className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100 transition duration-150 text-[8px] border border-red-500 px-1 rounded bg-black font-mono cursor-pointer"
                    >
                      DISMISS
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Wingmen Subsection */}
            {wingmen.length > 0 && (
              <div className="border-t border-current/30 pt-3 mt-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1.5 flex justify-between items-center">
                  <span>🚀 Active Wingmen Escorts</span>
                  <span className="text-[8px] text-gray-500">{wingmen.length} in formation</span>
                </div>
                <div className="space-y-2 max-h-[140px] overflow-y-auto">
                  {wingmen.map((w) => (
                    <div key={w.id} className="p-2 border border-cyan-500/30 rounded bg-cyan-950/5 text-[10px] relative group leading-relaxed">
                      <div className="flex justify-between font-bold text-white leading-normal">
                        <span>{w.name} ({w.shipType})</span>
                        <span className="text-cyan-400">LVL {w.level}</span>
                      </div>
                      <div className="text-[8px] opacity-70 flex justify-between">
                        <span>Combat FP: {w.firepower}</span>
                        <span>Fuel/Hull: {w.hp}/{w.maxHp} HP</span>
                      </div>
                      <div className="text-[8px] opacity-80 flex justify-between mt-0.5">
                        <span>Jumps Rem: <strong className="text-yellow-400">{w.duration}</strong>/{w.maxDuration}</span>
                        <span className="uppercase text-[7px] tracking-wider text-emerald-400 font-semibold">Focus: {w.focus}</span>
                      </div>

                      {/* Controls to toggle combat focus and stand down */}
                      <div className="mt-1.5 flex gap-1 items-center">
                        <button
                          onClick={() => {
                            AudioEngine.playBeep(700, 0.1, "sine");
                            setWingmen((prev) => prev.map((item) => item.id === w.id ? { ...item, focus: item.focus === "shields" ? "hull" : "shields" } : item));
                          }}
                          className="px-1 py-0.5 border border-cyan-500/40 text-[7px] uppercase rounded hover:bg-cyan-500 hover:text-black cursor-pointer"
                        >
                          Target Focus: {w.focus.toUpperCase()}
                        </button>
                        <button
                          onClick={() => {
                            AudioEngine.playBeep(700, 0.1, "sine");
                            setWingmen((prev) => prev.map((item) => item.id === w.id ? { ...item, standingDown: !item.standingDown } : item));
                          }}
                          className={`px-1 py-0.5 border text-[7px] uppercase rounded cursor-pointer ${w.standingDown ? "border-red-500 text-red-500" : "border-green-500 text-green-500"}`}
                        >
                          {w.standingDown ? "STAND BY (STBY)" : "FIRE AT WILL"}
                        </button>
                        <button
                          onClick={() => {
                            // Tip Wingman: cost is 200 credits, increases duration by +3 jumps and levels them up (+2 firepower, +5 HP)
                            if (credits < 200) {
                              addTerminalLog("TIP ERROR: Insufficient credits to tip your wingman.", "danger");
                              return;
                            }
                            setCredits((c) => c - 200);
                            setWingmen((prev) => prev.map((item) => {
                              if (item.id === w.id) {
                                const nextLvl = item.level + 1;
                                const nextDuration = Math.min(item.maxDuration, item.duration + 3);
                                addTerminalLog(`Generous Tip! Wingman ${w.name} received 200 CR bonus tip. Flight duration extended by +3 jumps and level promoted to Lvl ${nextLvl}!`, "success");
                                return {
                                  ...item,
                                  level: nextLvl,
                                  duration: nextDuration,
                                  firepower: item.firepower + 5,
                                  maxHp: item.maxHp + 15,
                                  hp: Math.min(item.maxHp + 15, item.hp + 15)
                                };
                              }
                              return item;
                            }));
                          }}
                          className="px-1 py-0.5 border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-black text-[7px] uppercase rounded cursor-pointer ml-auto"
                          title="Tip 200 CR: Extends contract by +3 jumps & increases stats!"
                        >
                          💸 TIP 200 CR
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Sector Telemetry details */}
          <section className="bg-black/80 border border-current p-4 rounded flex-grow flex flex-col justify-between font-mono">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider border-b border-current pb-2 mb-3 flex items-center gap-1.5">
                <MapPin size={13} /> Local Sector scan
              </h2>
              <div className="text-[11px] space-y-2.5 leading-snug">
                <div><span className="opacity-60 block text-[9px] leading-tight">ACTIVE STAR RANGE:</span> <strong className="text-yellow-400 text-xs">{isInDeepSpace ? "INTERSTELLAR DEEP VOID" : STAR_SYSTEMS_PROFILES[currentSystemIndex].name}</strong></div>
                <div><span className="opacity-60 block text-[9px] leading-tight">COORDINATES Telemetry:</span> <strong className="text-white text-xs">{isInDeepSpace ? `[Void X:${position.x - 1}, Y:${position.y - 1}]` : `[X:${position.x - 4}, Y:${position.y - 4}]`}</strong></div>
                <div><span className="opacity-60 block text-[9px] leading-tight">PLANETARY Body:</span> <strong className="text-cyan-400 text-xs">{activeSector?.planet ? activeSector.planet.name : "None scanned"}</strong></div>
                {activeSector?.planet?.resourceNode && !activeSector.planet.resourceNode.exhausted && (
                  <div>
                    <span className="opacity-60 block text-[9px] leading-tight">MINING DEPOSIT:</span> 
                    <strong className="text-yellow-400 text-xs uppercase">
                      {activeSector.planet.resourceNode.type.replace(/_/g, " ")} ({activeSector.planet.resourceNode.amount} units)
                    </strong>
                  </div>
                )}
                <div>
                  <span className="opacity-60 block text-[9px] leading-tight">SPACEPORT Node:</span> 
                  <strong className="text-xs">
                    {activeSector?.station ? (
                      <>
                        {activeSector.station.techTitle}
                        {activeSector.station.isMiningStation && <span className="ml-2 text-[8px] bg-yellow-500/20 text-yellow-500 border border-yellow-500/40 px-1 rounded">MINING FACILITY</span>}
                      </>
                    ) : "Vacuum empty"}
                  </strong>
                </div>
                <div>
                  <span className="opacity-60 block text-[9px] leading-tight">SYSTEM CONFLICT TERRITORY:</span>
                  <strong className={`text-xs ${activeSector ? FACTIONS[activeSector.faction]?.color : "text-neutral-400"}`}>
                    {activeSector ? FACTIONS[activeSector.faction]?.name : "Unclaimed vacuum"}
                  </strong>
                </div>

                {activeSector?.isHostilityZone && (
                  <div className="bg-red-950/50 border border-red-500/50 p-2.5 rounded text-red-400 text-[10px] animate-pulse font-bold">
                    ⚠️ WARNING: ACTIVE HOSTILITY BORDER ZONE • EXTREME AMBUSH RISK (85%)
                  </div>
                )}
                {activeSector?.isFortifiedGate && (
                  <div className="bg-amber-950/50 border border-amber-500/50 p-2.5 rounded text-amber-400 text-[10px] animate-pulse font-bold">
                    🛡️ CONTESTED BORDER GATEWAY CHECKPOINT • INTENSE SECURITY CHALLENGES (90%)
                  </div>
                )}

                <button
                  id="main-scanners-btn"
                  onClick={() => {
                    AudioEngine.playBeep(900, 0.4, "sine");
                    if (activeSector) {
                      const updated = [...galaxy];
                      const cell = updated[position.x]?.[position.y];
                      if (cell) {
                        if (cell.anomaly) {
                          cell.anomaly.discovered = true;
                        }
                        if (cell.hasBlackMarket && !cell.blackMarketRevealed) {
                          cell.blackMarketRevealed = true;
                          const names = ["Obsidian Deep Black Market", "Void Pirate Commerce Post", "Tenebris Underground Hub", "Rogue Alpha Anarchist Port"];
                          const bmName = names[(position.x + position.y) % names.length];
                          cell.station = {
                            name: bmName,
                            techLevel: 5,
                            techTitle: "Anarchist Black Market Depot",
                            isBlackMarket: true,
                            missionBoard: [],
                            hiringLounge: []
                          };
                          addTerminalLog(`[DEEP SENSORS REVEALED]: Hidden black market station discovered in the dense asteroid ring: ${bmName} uncovered!`, "success");
                          AudioEngine.playBeep(1100, 0.4, "sine");
                        } else {
                          addTerminalLog("Sensor Sweep complete: Local anomalies identified and mapped.", "info");
                        }
                      }
                      setGalaxy(updated);
                    }
                    promoteCrewSpecialist("Science Director", 25);
                  }}
                  className="w-full mt-1.5 py-2 border border-current bg-current/10 hover:bg-current/25 font-bold rounded text-[10px] uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <SatelliteDish size={11} /> RUN COMPREHENSIVE SCAN
                </button>
              </div>
            </div>

            {/* Campaign Quests */}
            <div className="border-t border-dashed border-current/40 pt-2.5 mt-3 text-[11px] leading-snug space-y-1.5">
              <div className="font-bold uppercase tracking-wider text-[9px] opacity-75">Active Story campaigns:</div>
              <div id="story-missions-tracker-deck" className="text-[10px] text-cyan-400 font-mono space-y-1.5">
                {activeQuests.some((q) => q.currentStep < q.steps.length) ? (
                  activeQuests.map((quest) => {
                    if (quest.currentStep < quest.steps.length) {
                      const wp = quest.steps[quest.currentStep];
                      return (
                        <div key={quest.id} className="flex flex-col border border-cyan-950 p-1.5 rounded bg-cyan-950/20 leading-snug gap-0.5">
                          <div className="font-bold flex justify-between leading-none text-white">
                            <span>{quest.title}</span>
                            <span className="text-yellow-400">Step {quest.currentStep + 1}/{quest.steps.length}</span>
                          </div>
                          <span className="opacity-90">Target Coordinates: <strong className="text-white">[X:{wp.x - 4}, Y:{wp.y - 4}]</strong></span>
                        </div>
                      );
                    }
                    return null;
                  })
                ) : (
                  <div className="italic opacity-60">All campaigns resolved successfully.</div>
                )}
              </div>
            </div>

            {/* Faction standing matrix */}
            <div className="border-t border-dashed border-current/40 pt-2.5 mt-3 text-[11px] space-y-1.5">
              <div className="font-bold uppercase tracking-wider text-[9px] opacity-75">Faction Standings Table:</div>
              <div className="grid grid-cols-2 gap-1 text-[9px] font-mono leading-tight">
                <div>HEGEMONY: <strong className="text-white">{reputation.hegemony}</strong></div>
                <div>SYNDICATE: <strong className="text-white">{reputation.syndicate}</strong></div>
                <div>VOID CULT: <strong className="text-white">{reputation.cult}</strong></div>
                <div>CONSORTIUM: <strong className="text-white">{reputation.consortium}</strong></div>
              </div>
            </div>
          </section>
        </aside>

        {/* Tactical cockpit display navigation grid */}
        <section className="lg:col-span-9 flex flex-col space-y-4">
          {/* Navigation Deck Bar */}
          <nav 
            className="grid grid-cols-3 sm:flex sm:flex-wrap sm:items-center gap-1 text-[10px] sm:text-xs select-none"
          >
            <button
              id="tab-btn-cockpit"
              title="View mission logs and system communications"
              onClick={() => {
                AudioEngine.playBeep(450, 0.05);
                setActiveTab("cockpit");
              }}
              className={`py-2 px-1 md:py-3 md:px-4 border border-current font-bold rounded text-center transition cursor-pointer sm:flex-grow ${
                activeTab === "cockpit" ? "bg-current text-black font-semibold" : "border-current/40 hover:bg-current/10"
              }`}
            >
              HUD LOGS
            </button>
            <button
              id="tab-btn-map"
              title="Navigate the galaxy sector map"
              onClick={() => {
                AudioEngine.playBeep(450, 0.05);
                setActiveTab("map");
              }}
              className={`py-2 px-1 md:py-3 md:px-4 border border-current font-bold rounded text-center transition cursor-pointer sm:flex-grow ${
                activeTab === "map" ? "bg-current text-black font-semibold" : "border-current/40 hover:bg-current/10"
              }`}
            >
              STAR GRID
            </button>
            <button
              id="tab-btn-cargo"
              title="Manage your ship's cargo hold"
              onClick={() => {
                AudioEngine.playBeep(450, 0.05);
                setActiveTab("cargo");
              }}
              className={`py-2 px-1 md:py-3 md:px-4 border border-current font-bold rounded text-center transition cursor-pointer sm:flex-grow ${
                activeTab === "cargo" ? "bg-current text-black font-semibold" : "border-current/40 hover:bg-current/10"
              }`}
            >
              CARGO BAY
            </button>
            <button
              id="tab-btn-actions"
              title="Equip components and manage ship systems"
              onClick={() => {
                AudioEngine.playBeep(450, 0.05);
                setActiveTab("actions");
              }}
              className={`py-2 px-1 md:py-3 md:px-4 border border-current font-bold rounded text-center transition cursor-pointer sm:flex-grow ${
                activeTab === "actions" ? "bg-current text-black font-semibold" : "border-current/40 hover:bg-current/10"
              }`}
            >
              EQUIPMENT DECK
            </button>
            <button
              id="tab-btn-shipyard"
              disabled={!isDocked}
              title={isDocked ? "Upgrade or repair your ship" : "Docking required to access shipyard"}
              onClick={() => {
                AudioEngine.playBeep(450, 0.05);
                setActiveTab("shipyard");
              }}
              className={`py-2 px-1 md:py-3 md:px-4 border border-current font-bold rounded text-center transition sm:flex-grow ${
                !isDocked
                  ? "opacity-35 cursor-not-allowed border-current/20 text-neutral-500"
                  : activeTab === "shipyard"
                  ? "bg-current text-black font-semibold"
                  : "border-current/40 hover:bg-current/10 cursor-pointer"
              }`}
            >
              {isDocked ? "SHIPYARD" : "🔒 SHIPYARD"}
            </button>
            <button
              id="tab-btn-market"
              disabled={!isDocked}
              title={isDocked ? "Buy and sell goods" : "Docking required to access market"}
              onClick={() => {
                AudioEngine.playBeep(450, 0.05);
                setActiveTab("market");
              }}
              className={`py-2 px-1 md:py-3 md:px-4 border border-current font-bold rounded text-center transition sm:flex-grow ${
                !isDocked
                  ? "opacity-35 cursor-not-allowed border-current/20 text-neutral-500"
                  : activeTab === "market"
                  ? "bg-current text-black font-semibold"
                  : "border-current/40 hover:bg-current/10 cursor-pointer"
              }`}
            >
              {isDocked ? "MARKET" : "🔒 MARKET"}
            </button>
            <button
              id="tab-btn-deck"
              onClick={() => {
                AudioEngine.playBeep(450, 0.05);
                setActiveTab("deck");
              }}
              className={`py-2 px-1 md:py-3 md:px-4 border border-current font-bold rounded text-center transition cursor-pointer sm:flex-grow ${
                activeTab === "deck" ? "bg-current text-black font-semibold" : "border-current/40 hover:bg-current/10"
              }`}
            >
              🛸 DECK PLAN
            </button>
            {activeSector?.station && (
              <button
                id="tab-btn-bar"
                disabled={!isDocked}
                onClick={() => {
                  AudioEngine.playBeep(450, 0.05);
                  setActiveTab("bar");
                }}
                className={`py-2 px-1 md:py-3 md:px-4 border border-current font-bold rounded text-center transition sm:flex-grow ${
                  !isDocked
                    ? "opacity-35 cursor-not-allowed border-current/20 text-neutral-500"
                    : activeTab === "bar"
                    ? "bg-current text-black font-semibold"
                    : "border-current/40 hover:bg-current/10 cursor-pointer"
                }`}
              >
                {isDocked ? "CANTINA BAR" : "🔒 CANTINA BAR"}
              </button>
            )}
            {isDocked && (
              <button
                id="tab-btn-undock"
                onClick={() => {
                  AudioEngine.playBeep(600, 0.1, "sine");
                  setIsDocked(false);
                  setActiveTab("cockpit");
                  addTerminalLog("Undocked from station/vessel. Thrusters online.", "info");
                }}
                className="py-2 px-1 md:py-3 md:px-4 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold rounded text-center transition cursor-pointer sm:flex-grow"
              >
                ⏏ UNDOCK
              </button>
            )}
            {combatState.active && (
              <button
                id="tab-btn-combat"
                onClick={() => {
                  AudioEngine.playBeep(600, 0.1, "sine");
                  setActiveTab("combat");
                }}
                className={`py-2 px-1 md:py-3 md:px-4 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold rounded text-center transition cursor-pointer sm:flex-grow animate-pulse ${
                  activeTab === "combat" ? "bg-red-600/20 text-red-400 border-red-500 font-extrabold shadow-[0_0_8px_rgba(239,68,68,0.4)]" : ""
                }`}
              >
                💥 ACTIVE DOGFIGHT
              </button>
            )}
          </nav>

          {/* Central Workspace render switch panels */}
          <div className="relative bg-black/80 border border-current rounded flex-grow flex flex-col p-4 min-h-[480px]">
            <div className="flex justify-between items-center p-2 border-b border-current mb-2 text-xs font-mono flex-wrap gap-2">
                <div className="flex gap-4">
                  <div>Hull: <span className="text-emerald-400">{hull}/{maxHull}</span></div>
                  <div>Shields: <span className="text-cyan-400">{shields.toFixed(0)}/{maxShield}</span> {getShieldRegenRate() > 0 && <span className="text-emerald-400 text-[10px]">(Regen: +{getShieldRegenRate().toFixed(1)}/s)</span>}</div>
                </div>
                {Object.keys(activeBuffs).length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-yellow-400 font-bold text-[9px] uppercase tracking-wider">CREW STIMULANTS:</span>
                    <div className="flex gap-1 flex-wrap">
                      {Object.keys(activeBuffs).map((key) => {
                        const buff = activeBuffs[key];
                        let colorClass = "text-cyan-400 border-cyan-400/30";
                        if (key === "damage") colorClass = "text-red-400 border-red-400/30";
                        else if (key === "evasion") colorClass = "text-green-400 border-green-400/30";
                        else if (key === "mining") colorClass = "text-yellow-500 border-yellow-500/30";
                        else if (key === "fuel_discount") colorClass = "text-purple-400 border-purple-400/30";
                        else if (key === "shields") colorClass = "text-blue-400 border-blue-400/30";

                        return (
                          <span
                            key={key}
                            title={`${buff.drinkName}: +${Math.round(buff.amount * 100)}% for ${buff.remainingJumps} sector jumps`}
                            className={`text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded border bg-black/60 ${colorClass}`}
                          >
                            {key === "fuel_discount" ? "FTL SAVINGS" : key.replace("_", " ")} ({buff.remainingJumps}J)
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
            {showCrewDismissConfirmation !== null && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-neutral-950 border-2 border-red-900 p-6 max-w-sm w-full rounded shadow-2xl animate-fade-in font-mono">
                  <h3 className="text-red-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <AlertTriangle size={20} /> Crew Termination Protocols
                  </h3>
                  <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                    You are about to dismiss <strong className="text-white">{crew[showCrewDismissConfirmation]?.name}</strong> ({crew[showCrewDismissConfirmation]?.role}).
                    <br/><br/>
                    {!(activeSector?.station || activeSector?.planet?.interactionType === "outpost") ? (
                      <span className="text-red-400 font-bold animate-pulse">
                        ⚠️ WARNING: SHIP IS NOT DOCKED. Terminating a specialist in deep space is a war crime and will incur severe reputation penalties and increase future hiring costs.
                      </span>
                    ) : (
                      <span className="text-emerald-400">
                        Ship is docked. This member will be safely discharged at the local port.
                      </span>
                    )}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        dismissCrewMember(showCrewDismissConfirmation);
                        setShowCrewDismissConfirmation(null);
                      }}
                      className="py-2 border-2 border-red-600 bg-red-950/20 text-red-500 hover:bg-red-600 hover:text-white transition uppercase font-bold text-[10px] cursor-pointer"
                    >
                      Confirm Firing
                    </button>
                    <button
                      onClick={() => setShowCrewDismissConfirmation(null)}
                      className="py-2 border-2 border-neutral-700 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 transition uppercase font-bold text-[10px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === "class_selection" && (
              <ClassSelection 
                onSelect={(starterClass) => {
                  startNewGame(starterClass);
                  setActiveTab("cockpit");
                }} 
              />
            )}
            
            {activeTab === "main_menu" && (
              <MainMenu 
                onInitiateStart={() => setActiveTab("class_selection")}
                onQuickLoad={() => {
                  handleQuickloadLocal();
                  setActiveTab("cockpit");
                }}
                hasSave={!!localStorage.getItem("cosmos_os_quicksave_react")}
              />
            )}
            
            {activeTab === "cockpit" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full h-full items-start">
                <div className="lg:col-span-8 flex flex-col gap-4">
                  {/* Environmental Hazard Status Banner */}
                  {(() => {
                    const currentCell = galaxy[position.x]?.[position.y];
                    if (!currentCell?.hazardType) return null;
                    
                    const isSolar = currentCell.hazardType === "solar_flare";
                    const isGrav = currentCell.hazardType === "grav_well";
                    const isIon = currentCell.hazardType === "ion_nebula";

                    return (
                      <div className={`p-4 rounded border font-mono animate-pulse flex items-center justify-between gap-4 ${
                        isSolar ? "bg-red-950/40 border-red-500 text-red-500" :
                        isGrav ? "bg-amber-950/40 border-amber-500 text-amber-500" :
                        "bg-cyan-950/40 border-cyan-400 text-cyan-400"
                      }`}>
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <span>⚠️</span> COLD-SPACE HAZARD WARNING: {currentCell.hazardType.replace("_", " ").toUpperCase()} DETECTED
                          </h3>
                          <p className="text-[10px] opacity-90 leading-tight">
                            {isSolar && "Direct solar coronal mass ejection field. Interstellar magnetic storms drain ship shields on sector arrival. Internal hull temperatures elevated."}
                            {isGrav && "Massive black-hole singularity shadow. Leaving this quadrant will require DOUBLE warp fuel cores. Passive shield rechargers are offline."}
                            {isIon && "Heavy ionizing nebular gas dust. Local scanners jammed. Pilot Evasion factor increased by +15% but warp fuel economy reduced by +25%."}
                          </p>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <span className="text-[9px] font-bold border border-current px-2 py-0.5 rounded uppercase">
                            DIAGNOSTIC ENGAGED
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Away Mission Expedition Control Board */}
                  {expeditionState.active && (
                    <div className="bg-black/95 border border-current rounded p-4 font-mono space-y-4 relative shadow-2xl">
                      <div className="flex justify-between items-start border-b border-current/30 pb-2">
                        <div>
                          <h3 className="text-sm font-bold uppercase text-yellow-500 tracking-wider flex items-center gap-2">
                            <span>🛸</span> Derelict Salvage Expedition
                          </h3>
                          <p className="text-[10px] text-neutral-400">TARGET: {expeditionState.derelictName}</p>
                        </div>
                        <span className="text-[10px] font-bold border border-yellow-500/50 text-yellow-400 px-2 py-0.5 rounded uppercase animate-pulse">
                          Hazard: {expeditionState.hazardType.toUpperCase()}
                        </span>
                      </div>

                      {/* Log Screen */}
                      <div className="bg-neutral-950 border border-neutral-800 p-3 rounded h-32 overflow-y-auto space-y-1 text-[11px]">
                        {expeditionState.logs.map((log, idx) => (
                          <div key={idx} className="text-neutral-300 leading-tight">
                            <span className="text-neutral-500">[{new Date().toLocaleTimeString()}]</span> {log}
                          </div>
                        ))}
                        {expeditionState.status === "breaching" && <div className="text-yellow-500 animate-pulse">⚙️ Cutting through titanium shielding...</div>}
                        {expeditionState.status === "extracting" && <div className="text-cyan-400 animate-pulse">⚡ Bypassing encrypted data banks...</div>}
                      </div>

                      {expeditionState.status === "idle" && (
                        <div className="space-y-4">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider block mb-2 text-neutral-300">
                              Assemble Landing Team (Select up to 2 specialists):
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {crew.map((member) => {
                                const isFatigued = !!fatiguedCrew[member.id];
                                const isSelected = expeditionState.selectedCrewIds.includes(member.id);
                                return (
                                  <button
                                    key={member.id}
                                    disabled={isFatigued}
                                    onClick={() => {
                                      setExpeditionState(prev => {
                                        const selected = prev.selectedCrewIds.includes(member.id)
                                          ? prev.selectedCrewIds.filter(id => id !== member.id)
                                          : prev.selectedCrewIds.length < 2
                                          ? [...prev.selectedCrewIds, member.id]
                                          : prev.selectedCrewIds;
                                        return { ...prev, selectedCrewIds: selected };
                                      });
                                      AudioEngine.playBeep(500, 0.05);
                                    }}
                                    className={`p-2.5 border text-left rounded transition flex flex-col justify-between items-start gap-1 ${
                                      isSelected
                                        ? "border-yellow-500 bg-yellow-950/10 text-yellow-400"
                                        : "border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 text-neutral-400"
                                    } ${isFatigued ? "opacity-40 cursor-not-allowed border-red-500/20" : "cursor-pointer"}`}
                                  >
                                    <div className="flex justify-between w-full text-[11px]">
                                      <span className="font-bold">{member.name}</span>
                                      <span className="opacity-80">Rank {member.level} {member.role}</span>
                                    </div>
                                    <div className="text-[9px] opacity-75 text-left">
                                      {isFatigued 
                                        ? `⚠️ EXHAUSTED: Rest for ${fatiguedCrew[member.id]} jumps` 
                                        : member.role === "Science Director" && expeditionState.hazardType === "radiation"
                                        ? "🌟 RADIATION EXPERT (+45% success chance!)"
                                        : member.role === "Weapons Specialist" && expeditionState.hazardType === "turrets"
                                        ? "🌟 COMBAT EXPERT (+45% success chance!)"
                                        : member.role === "Spy" && expeditionState.hazardType === "turrets"
                                        ? "🌟 INFILTRATION EXPERT (+45% success chance!)"
                                        : member.role === "Miner" && expeditionState.hazardType === "collapse"
                                        ? "🌟 GEOLOGY EXPERT (+45% success chance!)"
                                        : member.role === "Pilot" && expeditionState.hazardType === "collapse"
                                        ? "🌟 EVAC EXPERT (+45% success chance!)"
                                        : `Adds +${member.level * 4}% success chance`}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Probability Gauge */}
                          {(() => {
                            const selectedCrew = crew.filter(c => expeditionState.selectedCrewIds.includes(c.id));
                            let prob = 40;
                            selectedCrew.forEach(c => { prob += c.level * 4; });
                            
                            const hasSci = selectedCrew.some(p => p.role === "Science Director");
                            const hasWep = selectedCrew.some(p => p.role === "Weapons Specialist");
                            const hasSpy = selectedCrew.some(p => p.role === "Spy");
                            const hasMiner = selectedCrew.some(p => p.role === "Miner");
                            const hasPilot = selectedCrew.some(p => p.role === "Pilot");

                            if (expeditionState.hazardType === "radiation" && hasSci) prob += 45;
                            if (expeditionState.hazardType === "turrets" && (hasWep || hasSpy)) prob += 45;
                            if (expeditionState.hazardType === "collapse" && (hasMiner || hasPilot)) prob += 45;

                            prob = Math.min(100, prob);

                            return (
                              <div className="bg-neutral-900/50 p-3 border border-neutral-800 rounded space-y-2">
                                <div className="flex justify-between text-xs text-left">
                                  <span className="text-neutral-400">EXPEDITION SUCCESS PROBABILITY:</span>
                                  <strong className={prob >= 80 ? "text-emerald-400" : prob >= 55 ? "text-yellow-400" : "text-red-400"}>
                                    {prob}% Chance
                                  </strong>
                                </div>
                                <div className="w-full bg-neutral-950 rounded h-2 overflow-hidden border border-neutral-800">
                                  <div 
                                    className={`h-full transition-all duration-300 ${
                                      prob >= 80 ? "bg-emerald-400" : prob >= 55 ? "bg-yellow-400" : "bg-red-500"
                                    }`}
                                    style={{ width: `${prob}%` }}
                                  />
                                </div>
                                <div className="text-[9px] text-neutral-400 leading-normal text-left">
                                  Success recovers massive credits & high-tier cargo. Failing causes 10-25 Hull/Shield kinetic impact and inflicts extreme physical Fatigue on the landing team.
                                </div>
                              </div>
                            );
                          })()}

                          {/* Trigger actions */}
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setExpeditionState({ active: false, derelictName: "", hazardType: "unknown", selectedCrewIds: [], logs: [], status: "idle", progress: 0 });
                                AudioEngine.playBeep(350, 0.1);
                              }}
                              className="flex-1 py-2 border border-neutral-800 hover:bg-neutral-900 text-neutral-400 hover:text-white rounded transition text-xs font-bold uppercase cursor-pointer"
                            >
                              Scrap Expedition
                            </button>
                            <button
                              disabled={expeditionState.selectedCrewIds.length === 0}
                              onClick={() => {
                                setExpeditionState(prev => ({
                                  ...prev,
                                  status: "launching",
                                  logs: [...prev.logs, "[MISSION DISPATCH]: Away shuttle engine ignition! Clearing docking bay frames..."]
                                }));
                                AudioEngine.playBeep(600, 0.35, "sawtooth");
                              }}
                              className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded font-bold transition text-xs uppercase disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer tracking-wider"
                            >
                              Launch Away Shuttle
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Active running progress bar */}
                      {(expeditionState.status === "launching" || expeditionState.status === "breaching" || expeditionState.status === "extracting") && (
                        <div className="space-y-2 py-4">
                          <div className="flex justify-between items-center text-xs text-yellow-400 animate-pulse">
                            <span>AWAY TEAM SHUTTLE ACTIVE IN SECTOR</span>
                            <span>{expeditionState.progress}% Complete</span>
                          </div>
                          <div className="w-full bg-neutral-900 rounded h-3 overflow-hidden border border-neutral-800 shadow-inner">
                            <div className="bg-yellow-500 h-full transition-all duration-500" style={{ width: `${expeditionState.progress}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Completed / Failed End Screen */}
                      {(expeditionState.status === "completed" || expeditionState.status === "failed") && (
                        <div className="space-y-4 border-t border-neutral-800 pt-3">
                          <div className={`p-3.5 rounded border text-xs font-bold leading-normal ${
                            expeditionState.status === "completed" 
                              ? "bg-emerald-950/20 border-emerald-500 text-emerald-400" 
                              : "bg-red-950/20 border-red-500 text-red-400"
                          }`}>
                            <div className="uppercase mb-1 tracking-wider text-sm font-bold">
                              {expeditionState.status === "completed" ? "🏆 Mission Secured" : "🚨 Shuttle evacuated"}
                            </div>
                            <p className="font-mono text-[11px] leading-relaxed text-white text-left">
                              {expeditionState.rewardsText}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setExpeditionState({ active: false, derelictName: "", hazardType: "unknown", selectedCrewIds: [], logs: [], status: "idle", progress: 0 });
                              AudioEngine.playBeep(450, 0.1);
                            }}
                            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded font-bold transition text-xs uppercase cursor-pointer"
                          >
                            Synchronize & Disengage Landing Airlocks
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Power & Thermal Management (Elite Dangerous Style) */}
                  <div className="bg-black/80 border border-current rounded p-3 font-mono space-y-3">
                    <div className="flex justify-between items-center border-b border-current/20 pb-2">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <Zap size={14} className="text-yellow-500" /> Power & Thermal Systems
                      </h3>
                      <div className="flex items-center gap-2">
                         <span className={`text-[10px] font-bold ${heat > 80 ? "text-red-500 animate-pulse" : isHeatVulnerable ? "text-amber-500" : isHeatBuffActive ? "text-cyan-400" : "text-neutral-400"}`}>
                           CORE TEMP: {isHeatBuffActive ? "IMMUNE" : `${heat.toFixed(1)}%`}
                           {isHeatVulnerable && !isHeatBuffActive && " (VULNERABLE)"}
                         </span>
                         <div className="w-24 h-2 bg-neutral-900 border border-neutral-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${isHeatBuffActive ? "bg-cyan-400" : heat > 80 ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-orange-500"}`}
                              style={{ width: `${isHeatBuffActive ? 0 : heat}%` }}
                            />
                         </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setIsSilentRunning(!isSilentRunning);
                          addTerminalLog(isSilentRunning ? "Radiators opened. Thermal signature exposed." : "SILENT RUNNING ENGAGED. Radiators closed. Heat buildup detected.", isSilentRunning ? "info" : "danger");
                          AudioEngine.playBeep(isSilentRunning ? 600 : 300, 0.1, "sawtooth");
                        }}
                        className={`py-2 border rounded text-[10px] font-bold transition flex flex-col items-center justify-center gap-1 ${
                          isSilentRunning 
                          ? "bg-red-950 border-red-500 text-red-500 animate-pulse" 
                          : "bg-neutral-900 border-neutral-700 text-neutral-400 hover:bg-neutral-800"
                        }`}
                      >
                        <ShieldOff size={14} />
                        SILENT RUNNING
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsScoopDeployed(!isScoopDeployed);
                          addTerminalLog(isScoopDeployed ? "Fuel scoop retracted." : "Fuel scoop deployed. Proximity to star systems will initiate refueling.", "info");
                          AudioEngine.playBeep(isScoopDeployed ? 500 : 700, 0.1, "sine");
                        }}
                        disabled={isInDeepSpace}
                        className={`py-2 border rounded text-[10px] font-bold transition flex flex-col items-center justify-center gap-1 ${
                          isScoopDeployed 
                          ? "bg-cyan-950 border-cyan-500 text-cyan-400" 
                          : "bg-neutral-900 border-neutral-700 text-neutral-400 hover:bg-neutral-800 disabled:opacity-30"
                        }`}
                      >
                        <Zap size={14} />
                        FUEL SCOOP
                      </button>
                    </div>
                    
                    {isScoopDeployed && activeSector?.hasStar && (
                      <div className="text-[9px] text-cyan-400 animate-pulse text-center font-bold bg-cyan-950/20 border border-cyan-500/30 py-1 rounded">
                        REFUELING IN PROGRESS... RADIATION HAZARD DETECTED
                      </div>
                    )}
                  </div>

                  {isHullCritical && (
                    <div className="bg-red-950/90 border-2 border-red-500 text-red-500 font-mono text-[10px] font-bold px-4 py-2 rounded animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)] flex flex-col items-center gap-1 uppercase tracking-widest justify-center">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="animate-bounce" />
                        HARDWARE FAILURE DETECTED: HUD LOGIC CORES CRITICAL
                      </div>
                      <div className="text-[8px] opacity-70">Hull Integrity: {hullPercent.toFixed(1)}%</div>
                    </div>
                  )}

                  {isHeatCritical && (
                    <div className="bg-orange-950/90 border-2 border-orange-500 text-orange-500 font-mono text-[10px] font-bold px-4 py-2 rounded animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.5)] flex flex-col items-center gap-1 uppercase tracking-widest justify-center">
                       <div className="flex items-center gap-2">
                        <Zap size={14} className="animate-pulse" />
                        THERMAL OVERLOAD: CPU THROTTLING ACTIVE
                      </div>
                      <div className="text-[8px] opacity-70">Internal Temp: {heat.toFixed(1)}%</div>
                    </div>
                  )}

                  <FlightTelemetry data={telemetry} />
                  <HUDLogs
                    logs={logs}
                    onClearLogs={() => setLogs([])}
                    options={(() => {
                      const opts = [];
                      opts.push({
                        label: "View Faction Reputation Standings",
                        onClick: () => setIsReputationOpen(true)
                      });
                      opts.push({
                        label: "View Star System Map",
                        onClick: () => setIsStarMapOpen(true)
                      });

                      if (activeMissions.length > 0) {
                        opts.push({
                          label: "Abandon Active Mission(s)",
                          onClick: () => setAbandonMissionConfirmOpen(true)
                        });
                      }

                      // Manual quest steps
                      activeQuests.forEach((quest) => {
                        if (quest.currentStep < quest.steps.length) {
                          const step = quest.steps[quest.currentStep];
                          if (step.x === position.x && step.y === position.y) {
                            opts.push({
                              label: `⭐ QUEST: ${step.action}`,
                              onClick: () => {
                                if (step.action === "Refuel Refugee Caravan") {
                                  const isTanker = activeShip === "fuel_tanker";
                                  const fuelNeeded = isTanker ? 5 : 30;
                                  if (fuel < fuelNeeded) {
                                    addTerminalLog(`[FUEL SHORTAGE]: Caravan Refueling requires ${fuelNeeded} units of fuel. Your current tank holds ${fuel.toFixed(1)} units.`, "danger");
                                    return;
                                  }
                                  setFuel(f => Math.max(0, f - fuelNeeded));
                                  addTerminalLog(`Siphoned ${fuelNeeded} warp fuel units from ${SHIPS_BLUEPRINTS[activeShip]?.name || "ship"} into the refugee convoy's main storage tanks.`, "success");
                                }
                                if (step.combatEnemies && step.combatEnemies.length > 0) {
                                  addTerminalLog(`⚠️ INTERCEPT TARGET: Armed sentries engaged! Orbit shields down. Initiating dogfight...`, "danger");
                                  triggerSpecificBattle(step.combatEnemies);
                                } else {
                                  handleCompleteQuestStep(quest.id);
                                }
                              }
                            });
                          }
                        }
                      });

                      if (!isInDeepSpace) {
                        opts.push({
                          label: `INITIATE BLIND JUMP INTO INTERSTELLAR VOID (Costs 4.0 Fuel)`,
                          onClick: () => handleBlindJump()
                        });
                      }

                      if (isInDeepSpace && fuel < 4.0) {
                        opts.push({
                          label: `ACTIVATE EMERGENCY RESCUE HYPER-BEACON (Fee: 400 Credits or Half Cargo)`,
                          onClick: () => handleRescueBeacon()
                        });
                      }

                    // Station interactions options
                    if (activeSector?.station) {
                      const system = STAR_SYSTEMS_PROFILES[currentSystemIndex];
                      if (system.jumpLanes && system.jumpLanes.length > 0) {
                         system.jumpLanes.forEach(targetSystemIndex => {
                             const targetSystem = STAR_SYSTEMS_PROFILES[targetSystemIndex];
                             opts.push({
                                 label: `Jump Lane: Transit to ${targetSystem.name} (Fee: 200 Credits)`,
                                 onClick: () => {
                                     if (credits < 200) {
                                         addTerminalLog(`Insufficient credits for jump lane transit (Fee: 200 Credits).`, "danger");
                                         return;
                                     }
                                     setCredits((cr) => cr - 200);
                                     setCurrentSystemIndex(targetSystemIndex);
                                     buildProceduralGalaxy(targetSystemIndex);
                                     setPosition({ x: 4, y: 4 });
                                     setPreviousPosition({ x: 4, y: 4 });
                                     addTerminalLog(`Successfully transited jump lane to ${targetSystem.name}!`, "success");
                                 }
                             });
                         });
                      }
                      
                      const isBM = !!activeSector.station.isBlackMarket;
                      opts.push({
                        label: `Dock at ${activeSector.station.name}${isBM ? " (Fee: 150 Credits)" : ""}`,
                        onClick: () => {
                          if (isBM) {
                            if (credits < 150) {
                              addTerminalLog(`[SECURITY BARRIER]: Docking denied. Underworld port entry requires a 150 Credits scanning fee.`, "danger");
                              AudioEngine.playBeep(200, 0.2, "sawtooth");
                              return;
                            }
                            setCredits((cr) => cr - 150);
                            addTerminalLog("Paid 150 Credits underground port entry fee.", "info");
                          }
                          addTerminalLog(`Initiating dock alignment frames on spaceport gateway...`, "info");
                          setTimeout(() => {
                            addTerminalLog(`Successfully secured airlocks on ${activeSector.station!.name}. Local commerce grids synchronized and ready for trading.`, "success");
                            setBackupFuel(100);
                            addTerminalLog(`[MAINTENANCE REFUEL]: Backup impulse fuel tanks topped off to 100% for free.`, "success");
                            setIsDocked(true);
                            setActiveTab("market");
                          }, 600);
                        }
                      });

                      opts.push({
                        label: `Board local Crew recruiting lounges`,
                        onClick: () => {
                          setRecruitmentLoungeOpen(true);
                        }
                      });

                      if (!isBM) {
                        opts.push({
                          label: "Visit Station Lounge & Bar Informants",
                          onClick: () => {
                            addTerminalLog("Entering the crowded spaceport cantina. High-density carbon-gel smoke hangs in the air.", "info");
                            setActiveTab("bar");
                          }
                        });
                      }
                    }

                    // Planetary mining options
                    if (activeSector?.planet && !activeSector.planet.resourceNode.exhausted) {
                      opts.push({
                        label: isScanning ? "📡 CONDUCTING PLANETARY RADAR SWEEP..." : `📡 Initiate Manual Mineral Scan (Current: ${scannedYield === null ? "Unscanned -50% penalty" : `${scannedYield}% Yield`})`,
                        onClick: runManualDepositScan
                      });

                      // Render manual scan results as specific target buttons
                      opts.push({
                        label: `Start Manual Plating extraction (${activeSector.planet.resourceNode.amount} blocks remaining)`,
                        onClick: () => startDrills(false)
                      });
                      opts.push({
                        label: `Engage continuous core Auto-Extraction`,
                        onClick: () => startDrills(true)
                      });
                    }

                    // Anomalies discovery searches
                    if (activeSector?.anomaly && !activeSector.anomaly.exhausted) {
                      if (activeSector.anomaly.discovered) {
                        opts.push({
                          label: `RECLAIM anomaly signals: ${activeSector.anomaly.name}`,
                          onClick: () => {
                            const cell = activeSector;
                            cell.anomaly!.exhausted = true;
                            const payloadType = cell.anomaly!.payload;
                            if (payloadType === "blueprint") {
                              const availableBps = BLUEPRINTS.filter(bp => !ownedBlueprints.includes(bp.id));
                              if (availableBps.length > 0) {
                                const salvagedBp = availableBps[Math.floor(Math.random() * availableBps.length)];
                                setOwnedBlueprints(prev => [...prev, salvagedBp.id]);
                                addTerminalLog(`Decoded encrypted data drive. Acquired blueprint: ${salvagedBp.name}!`, "loot");
                              } else {
                                // duplicate discarded
                                // setCredits((cr) => cr + reward);
                                addTerminalLog(`Decoded duplicate blueprint logs. Discarded.`, "loot");
                              }
                            } else if (payloadType === "credits") {
                              const reward = Math.floor(Math.random() * 400) + 200;
                              // setCredits((cr) => cr + reward);
                              addTerminalLog(`Salvaged physical credit chips. Claimed +${reward} CR.`, "loot");
                            } else if (payloadType === "contraband") {
                              addCargoItem("contraband", 1);
                              addTerminalLog(`Discovered illegal syndicate contraband cache! Added 1x Contraband to cargo.`, "loot");
                            } else if (payloadType === "shieldcore") {
                              setShields(maxShield);
                              addTerminalLog(`Absorbed intact shield core capacitor. Shields restored to maximum!`, "success");
                            } else if (payloadType === "encrypted_drive") {
                              const reward = Math.floor(Math.random() * 500) + 300;
                              // setCredits((cr) => cr + reward);
                              addTerminalLog(`Hacked encrypted corporate data drive. Sold intel for +${reward} CR.`, "loot");
                            } else if (payloadType === "xenomorph_relic") {
                              addTerminalLog(`Found terrifying alien relic. Highly valuable to collectors... (+1000 CR)`, "loot");
                              setCredits((cr) => cr + 1000);
                            } else {
                              const reward = Math.floor(Math.random() * 300) + 150;
                              // setCredits((cr) => cr + reward);
                              addTerminalLog(`Salvaged core components database data files. Claimed +${reward} Credits Ledger.`, "loot");
                            }
                          }
                        });
                      } else {
                        opts.push({
                          label: `Scanners sweep anomalies indicators`,
                          onClick: () => {
                            const cell = activeSector;
                            cell.anomaly!.discovered = true;
                            addTerminalLog(`Sensors revealed hidden anomaly node profile: ${cell.anomaly!.name}`, "success");
                          }
                        });
                      }
                    }

                    // Trader caravan transactions
                    if (activeSector?.caravan && !activeSector.caravan.exhausted) {
                      opts.push({
                        label: `Hail Merchant Caravan for trading`,
                        onClick: () => {
                          addTerminalLog(`Negotiating trade margins on local Caravan matrices...`, "info");
                          setIsDocked(true);
                          setActiveTab("caravan_market");
                        }
                      });
                      opts.push({
                        label: `ATTACK COMMERCE CARAVAN FOR CARGO`,
                        onClick: () => {
                          const cell = activeSector;
                          cell.caravan!.exhausted = true;
                          setReputation((prev) => ({ ...prev, syndicate: prev.syndicate - 30 }));
                          triggerAmbushBattle();
                        }
                      });
                    }

                    // Add gate transit options
                    if (activeSector?.jumpGate) {
                      const gate = activeSector.jumpGate;
                      const isWormhole = gate.name === "Unstable Return Wormhole";
                      
                      opts.push({
                        label: isWormhole 
                          ? `STABILIZE EXOTIC WORMHOLE: Return to ${STAR_SYSTEMS_PROFILES[gate.targetSystemIndex].name} (Costs 4.0 Fuel)`
                          : `ENGAGE GATE TRANSIT: Go to ${STAR_SYSTEMS_PROFILES[gate.targetSystemIndex].name}`,
                        onClick: () => {
                          if (isWormhole) {
                            if (fuel < 4.0) {
                              addTerminalLog("SINGULARITY FAILURE: Insufficient Warp Fuel to stabilize hyper-fold coordinates. Craft fuel or signal rescue.", "danger");
                              AudioEngine.playBeep(180, 0.25, "square");
                              return;
                            }
                            setFuel((f) => Math.max(0, f - 4.0));
                            setIsInDeepSpace(false);
                          }
                          
                          setIsGateJumping(true);
                          setGateJumpCountdown(5);
                          setIsGateWarping(false);
                          setGateWarpTargetSystemIndex(gate.targetSystemIndex);
                          setIsWormholeTransit(isWormhole);
                          
                          addTerminalLog(`[JUMP GATE SEQUENCE ENGAGED]: Initiating countdown frames. FTL reactor charge-up started...`, "info");
                          AudioEngine.playWarp();
                        }
                      });
                    }

                    // Default warp map option
                    opts.push({
                      label: `Access Warp engine chart charts`,
                      onClick: () => setActiveTab("map")
                    });

                    return opts;
                  })()}
                  themeColor={activeTheme}
                  onExecuteCommand={handleExecuteCommand}
                />
              </div>

              <div className="lg:col-span-4 h-full flex flex-col">
                <SectorCommsPanel
                  sectorShips={sectorShips}
                  setSectorShips={setSectorShips}
                  playerPosition={position}
                  currentSystemIndex={currentSystemIndex}
                  galaxy={galaxy}
                  setGalaxy={setGalaxy}
                  credits={credits}
                  setCredits={setCredits}
                  addTerminalLog={addTerminalLog}
                  onTriggerAttack={triggerShipAttack}
                  addCargoItem={addCargoItem}
                  removeCargoItem={removeCargoItem}
                  cargo={cargo}
                  themeColor={activeTheme}
                  droppedBeacons={droppedBeacons}
                  setDroppedBeacons={setDroppedBeacons}
                  localWaypoint={localWaypoint}
                  setLocalWaypoint={setLocalWaypoint}
                  ownedBlueprints={ownedBlueprints}
                  setOwnedBlueprints={setOwnedBlueprints}
                />
              </div>
            </div>
          )}

            {activeTab === "map" && (
              <StarMap
                galaxy={galaxy}
                playerPosition={position}
                activeMissions={activeMissions}
                activeQuests={activeQuests}
                onWarpJump={triggerWarpJump}
                themeColor={activeTheme}
                mapBounds={mapBounds}
                currentSystemIndex={currentSystemIndex}
                waypoint={waypoint}
                plannedRoute={plannedRoute}
                setPlannedRoute={setPlannedRoute}
              />
            )}

            {activeTab === "cargo" && (
              <CargoHold
                cargo={cargo}
                onRecycleScrap={handleRecycleScrap}
                onCraftWarpFuel={handleCraftWarpFuel}
                onSortCargo={handleSortCargo}
                maxCargoCap={getCargoCapMultiplier()}
                themeColor={activeTheme}
                onEjectCargo={handleEjectCargoByIndex}
                onDeployBeacon={handleDropBeacon}
                ownedBlueprints={ownedBlueprints}
                activeCraftingBpId={activeCraftingBpId}
                autoCraftingBpId={autoCraftingBpId}
                craftingTimeLeft={craftingTimeLeft}
                isAutoCrafting={isAutoCrafting}
                onStartCrafting={startCrafting}
                onCancelCrafting={cancelCrafting}
                onStartAutoCrafting={startAutoCrafting}
                onStopAutoCrafting={stopAutoCrafting}
                fuel={fuel}
              />
            )}

            {activeTab === "actions" && (
              <EquipmentDeck
                equippedWeapons={equippedWeapons}
                inventoryWeapons={inventoryWeapons}
                fittedComponents={fittedComponents}
                ownedComponents={ownedComponents}
                activeShipId={activeShip}
                onMountWeapon={handleMountWeapon}
                onDismountWeapon={handleDismountWeapon}
                onEquipComponent={handleEquipComponent}
                onDismountComponent={handleDismountComponent}
                onClose={() => setActiveTab("cockpit")}
                themeColor={activeTheme}
                onRepairAll={handleRepairAll}
                onEjectHeatCore={handleEjectHeatCore}
                isDocked={isDocked}
              />
            )}

            {activeTab === "shipyard" && activeSector?.station && !activeSector.station.destroyed && (
              <HologramShipyard
                activeShipId={activeShip}
                onPurchase={handleBuyShipyardVessel}
                credits={credits}
                themeColor={activeTheme}
                currentCrewCount={crew.length}
                stationTechLevel={activeSector.station.techLevel}
              />
            )}

            {activeTab === "market" && (
              <SpaceportMarket
                credits={credits}
                setCredits={setCredits}
                cargo={cargo}
                addCargoItem={addCargoItem}
                removeCargoItem={removeCargoItem}
                maxCargoCap={getCargoCapMultiplier()}
                fuel={fuel}
                setFuel={setFuel}
                maxFuel={shipSpecs.maxFuel}
                hull={hull}
                setHull={setHull}
                maxHull={maxHull}
                inventoryWeapons={inventoryWeapons}
                setInventoryWeapons={setInventoryWeapons}
                ownedComponents={ownedComponents}
                setOwnedComponents={setOwnedComponents}
                activeSector={activeSector}
                addTerminalLog={addTerminalLog}
                themeColor={activeTheme}
                reputation={reputation}
                voidWaypoints={voidWaypoints}
                setVoidWaypoints={setVoidWaypoints}
              />
            )}

            {activeTab === "caravan_market" && (
              <CaravanMarket
                credits={credits}
                setCredits={setCredits}
                cargo={cargo}
                addCargoItem={addCargoItem}
                removeCargoItem={removeCargoItem}
                activeSector={activeSector}
                addTerminalLog={addTerminalLog}
                themeColor={activeTheme}
              />
            )}

            {activeTab === "bar" && activeSector?.station && !activeSector.station.destroyed && (
              <StationBar
                credits={credits}
                setCredits={setCredits}
                activeSector={activeSector}
                cantinaVisitors={activeSector?.cantinaVisitors || []}
                hasBlackMarketCoords={galaxy.some(row => row.some(cell => cell.blackMarketRevealed))}
                onBuyBlackMarketCoords={buyBlackMarketCoordinates}
                onAcceptMission={(mission) => handleAcceptMission(mission.id)}
                onAcceptQuest={handleAcceptQuest}
                activeQuests={activeQuests}
                activeMissions={activeMissions}
                wingmen={wingmen}
                setWingmen={setWingmen}
                ownedComponents={ownedComponents}
                setOwnedComponents={setOwnedComponents}
                inventoryWeapons={inventoryWeapons}
                setInventoryWeapons={setInventoryWeapons}
                ownedBlueprints={ownedBlueprints}
                setOwnedBlueprints={setOwnedBlueprints}
                addTerminalLog={addTerminalLog}
                onAttackStation={handleAttackStation}
                onClose={() => setActiveTab("cockpit")}
                themeColor={activeTheme}
                activeBuffs={activeBuffs}
                setActiveBuffs={setActiveBuffs}
                currentSystemName={STAR_SYSTEMS_PROFILES[currentSystemIndex]?.name || ""}
              />
            )}

            {activeTab === "deck" && (
              <ShipDeckView
                crew={crew}
                setCrew={setCrew}
                hull={hull}
                setHull={setHull}
                shields={shields}
                setShields={setShields}
                credits={credits}
                setCredits={setCredits}
                cargo={cargo}
                setCargo={setCargo}
                fuel={fuel}
                setFuel={setFuel}
                addTerminalLog={addTerminalLog}
                themeColor={activeTheme}
                activeShip={activeShip}
                hyperdriveOverclocked={hyperdriveOverclocked}
                setHyperdriveOverclocked={setHyperdriveOverclocked}
                weaponsCalibrated={weaponsCalibrated}
                setWeaponsCalibrated={setWeaponsCalibrated}
                onOpenScanner={() => setIsScannerOpen(true)}
                voidWaypoints={voidWaypoints}
                setVoidWaypoints={setVoidWaypoints}
                onTriggerWarpJumpToWaypoint={handleTriggerWarpJumpToWaypoint}
                currentSystemIndex={currentSystemIndex}
                isInDeepSpace={isInDeepSpace}
                backupFuel={backupFuel}
                setBackupFuel={setBackupFuel}
              />
            )}

            {isScannerOpen && (
              <LongRangeScanner
                galaxy={galaxy}
                playerPosition={position}
                fittedComponents={fittedComponents}
                crew={crew}
                mapBounds={mapBounds}
                setMapBounds={setMapBounds}
                setGalaxy={setGalaxy}
                addTerminalLog={addTerminalLog}
                onClose={() => setIsScannerOpen(false)}
                themeColor={activeTheme}
                activeShip={activeShip}
              />
            )}

            {isMiningScannerOpen && (
              <MiningScanner
                onClose={() => setIsMiningScannerOpen(false)}
                onSelectDeposit={(yieldAmt, name) => {
                  setScannedYield(yieldAmt);
                  setIsMiningScannerOpen(false);
                  addTerminalLog(`[MINING TARGET LOCK]: Target localized at ${name}. Sensory matrix indicates ${yieldAmt}% material density.`, "success");
                  AudioEngine.playBeep(900, 0.1, "sine");
                }}
                miningSiteType={
                  activeSector?.planet?.type === "asteroid_field" || activeSector?.planet?.type === "heavy_belt"
                    ? "asteroid_field"
                    : "planetary_core"
                }
                scannerQuality={
                  fittedComponents.scanner === "scanner_mk4" ? 1.0 :
                  fittedComponents.scanner === "scanner_mk3" ? 0.8 :
                  fittedComponents.scanner === "scanner_mk2" ? 0.6 :
                  fittedComponents.scanner === "scanner_mk1" ? 0.4 : 0.2
                }
                themeColor={activeTheme}
              />
            )}

            {activeTab === "combat" && combatState.active && (
              <CombatArena
                combatState={combatState}
                playerHull={hull}
                playerShield={shields}
                maxPlayerHull={maxHull}
                maxPlayerShield={maxShield}
                equippedWeapons={equippedWeapons}
                cargo={cargo}
                crew={crew}
                wingmen={wingmen}
                onFireWeapon={handleFireWeapon}
                onDeflectSuccess={handleDeflectResult}
                onUseNanobots={handleUseNanobots}
                onUseShieldCore={handleUseShieldCore}
                onFlee={handleFlee}
                combatLog={combatLog}
                weaponCapacity={getWeaponCapacity()}
                onSelectWeakPoint={(wp) => setCombatState((prev) => ({ ...prev, selectedWeakPoint: wp }))}
                onTriggerNovaBlast={() => addCombatLog("Blast charging modules...")}
                onSelectActiveEnemy={(idx) => setCombatState((prev) => ({ ...prev, activeEnemyIndex: idx }))}
                themeColor={activeTheme}
                activeShip={activeShip}
                availableHelpers={sectorShips.filter((s) => s.isFriend && s.reputation >= 75)}
                onCallHelper={handleCallHelperInCombat}
              />
            )}
          </div>
        </section>
      </main>

      {/* RECRUITMENT CREW OVERLAY LOUNGE */}
      {recruitmentLoungeOpen && activeSector?.station && (
        <CrewLounge
          candidates={activeSector.station.hiringLounge}
          onHire={handleHireCrew}
          onClose={() => setRecruitmentLoungeOpen(false)}
          credits={credits}
          crewCapacity={shipSpecs.maxCrew}
          currentCrewCount={crew.length}
          themeColor={activeTheme}
        />
      )}

      {/* MILESTONE UPGRADE CARD CHOICE OVERLAY */}
      {milestoneUpgradeCrew && (
        <div id="milestone-upgrade-overlay" className="fixed inset-0 bg-black/95 backdrop-blur-md z-[120] flex flex-col justify-center items-center p-4">
          <div className="max-w-3xl w-full border-2 border-yellow-500 p-6 rounded bg-black space-y-6 font-mono shadow-2xl relative">
            <button 
              onClick={() => setMilestoneUpgradeCrew(null)}
              className="absolute top-3 right-3 text-red-500 hover:text-red-400 border border-red-500 px-2 py-0.5 rounded text-[10px] uppercase cursor-pointer"
            >
              CLOSE
            </button>
            
            <div className="text-center space-y-1.5 border-b border-yellow-500/30 pb-4">
              <div className="text-[10px] text-yellow-400 uppercase tracking-[0.2em] font-bold">Bridge Command Upgrade Deck</div>
              <h1 className="text-lg font-bold text-white uppercase tracking-wider">
                {milestoneUpgradeCrew.name} &mdash; Milestone achieved!
              </h1>
              <p className="text-[10px] opacity-70">
                Select one of the 3 tactical neural capability implants below. Choosing an existing ability will LEVEL IT UP!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
              {milestoneUpgradeCards.map((card) => {
                const currentLevel = milestoneUpgradeCrew.abilityLevels?.[card.id] || 0;
                const isNew = currentLevel === 0;

                return (
                  <div 
                    key={card.id}
                    onClick={() => handleSelectMilestoneAbility(milestoneUpgradeCrew.id, card.id)}
                    className="group border border-yellow-500/40 hover:border-yellow-400 p-4 rounded bg-yellow-950/5 hover:bg-yellow-950/20 cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-3 relative overflow-hidden active:scale-95 shadow-md hover:shadow-yellow-500/10"
                  >
                    {/* Glowing Accent line */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-yellow-500/30 group-hover:bg-yellow-400 transition-colors" />
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start">
                        <span className="px-1.5 py-0.5 bg-yellow-500 text-black font-extrabold text-[8px] uppercase rounded-[2px] tracking-widest">
                          {isNew ? "NEW ABILITY" : `LEVEL UP`}
                        </span>
                        <span className="text-[8px] text-yellow-400/80 font-bold uppercase">
                          {isNew ? "Lv.1 Potential" : `Lv.${currentLevel} ➔ Lv.${currentLevel + 1}`}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-white uppercase group-hover:text-yellow-300 transition-colors pt-1">
                        {card.name}
                      </h3>
                      <p className="text-[10px] opacity-75 leading-relaxed pt-0.5">
                        {card.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-yellow-500/20 flex flex-col space-y-1.5">
                      <span className="text-[8px] opacity-50 uppercase tracking-widest block">TACTICAL METRICS:</span>
                      <span className="text-[10px] text-cyan-400 font-bold font-mono">
                        {card.perkText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center text-[9px] opacity-40 uppercase tracking-widest pt-2">
              SELECTION WILL BE RECORDED TO {milestoneUpgradeCrew.role.toUpperCase()}'S ACTIVE ABILITIES DOSSIER
            </div>
          </div>
        </div>
      )}

      {isReputationOpen && (
        <ReputationScreen
          reputation={reputation}
          factions={FACTIONS}
          onClose={() => setIsReputationOpen(false)}
        />
      )}

      {isStarMapOpen && (
        <StarSystemMap
          currentSystemIndex={currentSystemIndex}
          systems={STAR_SYSTEMS_PROFILES}
          waypoint={waypoint}
          setWaypoint={setWaypoint}
          onClose={() => setIsStarMapOpen(false)}
          isInDeepSpace={isInDeepSpace}
          voidWaypoints={voidWaypoints}
          onTriggerWarpJumpToWaypoint={handleTriggerWarpJumpToWaypoint}
        />
      )}

      {/* 10s FTL Warp Jump Cinematic Countdown Overlay */}
      {isWarpJumping && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center font-mono overflow-hidden select-none">
          {/* Animated Hyperspace Lines Background Effect */}
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-purple-950/20 to-black pointer-events-none">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,rgba(56,189,248,0.15)_49%,rgba(56,189,248,0.15)_51%,transparent_55%)] bg-[length:200%_200%] animate-pulse" />
          </div>

          <div className="max-w-md w-full mx-4 border border-cyan-500/40 bg-black/90 p-6 rounded-lg text-center shadow-[0_0_50px_rgba(6,182,212,0.15)] space-y-6 relative z-10">
            {/* Warning blinking header */}
            <div className="flex items-center justify-center gap-2 text-red-500 font-bold text-xs tracking-widest uppercase animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              CRITICAL FIELD FOLDING ENGAGED
              <span className="w-2 h-2 rounded-full bg-red-500" />
            </div>

            {/* FTL Target Waypoint */}
            <div className="space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">TARGET DESTINATION</span>
              <div className="text-cyan-400 text-lg font-bold uppercase tracking-tight">
                {warpJumpTargetWaypoint?.name || "DEEP SPACE COORDINATE MATRIX"}
              </div>
            </div>

            {/* Giant Countdown Clock */}
            <div className="relative py-4">
              <div className="text-7xl font-bold font-mono tracking-tighter text-white animate-pulse">
                {warpJumpCountdown < 10 ? `0${warpJumpCountdown}` : warpJumpCountdown}
              </div>
              <div className="text-[10px] text-neutral-400 mt-2 uppercase tracking-widest font-semibold">
                SECONDS UNTIL SPATIAL COALESCENCE
              </div>
            </div>

            {/* Scanning Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>HYPERDRIVE CHARGE</span>
                <span>{((10 - warpJumpCountdown) * 10).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-1000" 
                  style={{ width: `${(10 - warpJumpCountdown) * 10}%` }}
                />
              </div>
            </div>

            {/* Sub-system Status Matrix */}
            <div className="grid grid-cols-2 gap-2 text-[9px] text-neutral-500 border-t border-neutral-900 pt-4 font-mono text-left">
              <div className="flex justify-between px-1.5 py-0.5 bg-neutral-950 rounded">
                <span>WARP FIELD:</span>
                <span className="text-emerald-500 font-bold">STABLE</span>
              </div>
              <div className="flex justify-between px-1.5 py-0.5 bg-neutral-950 rounded">
                <span>OVERCLOCK:</span>
                <span className={hyperdriveOverclocked ? "text-cyan-400 font-bold" : "text-neutral-500"}>
                  {hyperdriveOverclocked ? "ACTIVE" : "STANDBY"}
                </span>
              </div>
              <div className="flex justify-between px-1.5 py-0.5 bg-neutral-950 rounded col-span-2">
                <span>COORDINATES RE-FOLD:</span>
                <span className="text-amber-500 font-bold truncate">
                  {warpJumpTargetWaypoint?.id || "CALCULATING"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP BOTTOM BAR */}
      <footer className="border-t border-current/20 bg-black/60 px-4 py-2 flex flex-wrap justify-between items-center text-[10px] font-mono select-none z-10 gap-2">
        <div className="flex items-center gap-1 uppercase tracking-wider font-semibold">
          <span>Active Command: </span>
          <span className="text-white">{shipSpecs.name.toUpperCase()} STARSHIP INTEGRATED CENTRAL</span>
        </div>
        <div className="flex items-center gap-4">
          <div>CREDITS LEDGER: <strong className="text-yellow-400 font-bold">{credits.toLocaleString()} CR</strong></div>
          <div>FUEL STACKS: <strong className="text-cyan-400 font-bold">{fuel.toFixed(1)} / {shipSpecs.maxFuel} STACKS</strong></div>
          <button
            onClick={() => {
              const next = !isMuted;
              AudioEngine.setMuted(next);
              setIsMuted(next);
              if (!next) {
                AudioEngine.playBeep(800, 0.05);
              }
            }}
            className="flex items-center gap-1.5 px-2 py-1 bg-black/40 border border-current/30 hover:border-current hover:bg-current/10 rounded transition cursor-pointer text-[9px] uppercase font-bold text-white shrink-0"
            title={isMuted ? "Unmute sound effects" : "Mute sound effects"}
          >
            {isMuted ? (
              <>
                <VolumeX size={12} className="text-red-400 animate-pulse" />
                <span>MUTED</span>
              </>
            ) : (
              <>
                <Volume2 size={12} className="text-cyan-400" />
                <span>SOUND ON</span>
              </>
            )}
          </button>
        </div>
      </footer>

      {showDockingWelcome && dockedStation && (
        <div id="docking-welcome-modal" className="fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex flex-col justify-center items-center p-4 text-white">
          <div className="bg-neutral-900 border border-neutral-700 p-8 rounded-lg shadow-xl max-w-lg w-full text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to {dockedStation.name}</h2>
            <p className="mb-2">Sector: [X:{position.x - 4}, Y:{position.y - 4}]</p>
            <p className="mb-2">Date: {new Date().toLocaleDateString()} Time: {new Date().toLocaleTimeString()}</p>
            <p className="mb-6">Tech Level: {dockedStation.techLevel}</p>
            <button 
              onClick={() => setShowDockingWelcome(false)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded"
            >
              Enter Station
            </button>
          </div>
        </div>
      )}

      {isDead && (
        <DeathScreen 
          reason={deathReason}
          onLoadSave={handleQuickloadLocal}
          onMainMenu={() => {
            setIsDead(false);
            setDeathReason("");
            setActiveTab("main_menu");
          }}
          hasSave={!!localStorage.getItem("cosmos_os_quicksave_react")}
        />
      )}
    </div>
  );
}

