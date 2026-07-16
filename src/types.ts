/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Position {
  x: number;
  y: number;
}

export interface CrewMember {
  id: string;
  name: string;
  role: "Pilot" | "Weapons Specialist" | "Science Director" | "Miner" | "Cargo Manager" | "Spy" | "Scanning Technician";
  exp: number;
  level: number;
  perk: string;
  activeAbilities?: string[];
  pendingMilestoneUpgrade?: boolean;
  milestonesClaimed?: number[];
  abilityLevels?: Record<string, number>;
}

export interface CargoSlot {
  type: string;
  qty: number;
}

export interface ResourceNode {
  type: string;
  amount: number;
  exhausted: boolean;
  unstable?: boolean;
  isGaseous?: boolean;
}

export interface Planet {
  name: string;
  type: string;
  color: string;
  interactionType: string;
  requiresMiner: boolean;
  resourceNode: ResourceNode;
}

export interface Mission {
  id: string;
  title: string;
  desc: string;
  reward: number;
  price?: number;
  weaponId?: string;
  type: "vip" | "haul" | "bounty" | "weapon_deal" | "recon" | "salvage" | "spy" | "archaeology";
  faction: string;
  targetSector: Position;
  status: "available" | "active" | "completed";
}

export interface RecruitCandidate {
  name: string;
  role: "Pilot" | "Weapons Specialist" | "Science Director" | "Miner" | "Cargo Manager" | "Spy" | "Scanning Technician";
  cost: number;
  perk: string;
}

export interface Station {
  name: string;
  techLevel: number;
  techTitle: string;
  missionBoard: Mission[];
  hiringLounge: RecruitCandidate[];
  isBlackMarket?: boolean;
  isMiningStation?: boolean;
  isSolarStation?: boolean;
  cantinaVisitors?: CantinaVisitor[];
  destroyed?: boolean;
}

export interface CantinaVisitor {
  id: string;
  name: string;
  role: string;
  description: string;
  colorClass: string;
  avatarIcon: string;
  type: "informant" | "syndicate" | "mercenary" | "smuggler";
  smugglerWeapons?: string[];
  smugglerComponents?: string[];
  wingmanCandidate?: Wingman;
  specialQuest?: Quest;
  missions?: Mission[];
}

export interface Anomaly {
  name: string;
  discovered: boolean;
  payload: string;
  exhausted: boolean;
}

export interface CaravanItem {
  type: string;
  qty: number;
  price: number;
}

export interface Caravan {
  name: string;
  faction: string;
  exhausted: boolean;
  inventory: CaravanItem[];
}

export interface JumpGate {
  targetSystemIndex: number;
  name: string;
}

export interface GalaxyCell {
  explored: boolean;
  faction: string;
  planet: Planet | null;
  station: Station | null;
  anomaly: Anomaly | null;
  caravan: Caravan | null;
  jumpGate: JumpGate | null;
  hostileChance: number;
  hasBlackMarket?: boolean;
  blackMarketRevealed?: boolean;
  isMinerHeaven?: boolean;
  isPirateHighway?: boolean;
  isHostilityZone?: boolean;
  isFortifiedGate?: boolean;
  hasStar?: boolean;
  hazardType?: "solar_flare" | "ion_nebula" | "grav_well" | null;
  wreckage?: {
    shipsCount: number;
    collected: boolean;
  };
  // Mining mechanics
  miningDeposit?: {
    type: "ore" | "gas";
    yield: number; // 0 to 1
    unstable: boolean;
  };
}

export interface QuestStep {
  x: number;
  y: number;
  log: string;
  isCompleted: boolean;
  action: string;
  combatEnemies?: Enemy[];
  stepTitle?: string;
  requiresManual?: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  rewardCredits: number;
  currentStep: number;
  steps: QuestStep[];
  ultimateRewardWeapon?: string;
  ultimateRewardComponent?: string;
}

export interface Enemy {
  name: string;
  hull: number;
  maxHull: number;
  shields: number;
  maxShields: number;
  damage: number;
  weaponType: "pulse_laser" | "torpedo_launcher" | "ion_blaster" | "plasma_spike";
  weapons: string;
  xpReward: number;
  loot: string[];
  shieldLayers?: number;
  maxShieldLayers?: number;
  isBattleship?: boolean;
}

export interface TelemetryData {
  time: number;
  fuel: number;
  hull: number;
  heat: number;
}

export interface Wingman {
  id: string;
  name: string;
  shipType: string;
  hp: number;
  maxHp: number;
  shields: number;
  maxShields: number;
  firepower: number;
  cargoHold: number;
  duration: number;
  maxDuration: number;
  cost: number;
  level: number;
  exp: number;
  abilities: string[];
  focus: "shields" | "hull";
  standingDown?: boolean;
}

export interface CombatState {
  active: boolean;
  enemies: Enemy[];
  activeEnemyIndex: number;
  enemy: Enemy | null;
  playerTurn: boolean;
  qteRunning: boolean;
  qteSpeed: number;
  qtePointerPos: number;
  qteDirection: number;
  zoneCenter: number;
  zoneDirection: number;
  zoneSpeed: number;
  targetZoneRange: { start: number; end: number };
  activeWeaponFiring: string | null;
  selectedWeakPoint: string | null;
  novaCooldown: number;
  enemyAttackQueue?: number[];
  currentAttackerIndex?: number;
  activeDoubleShotsRemaining?: number;
  weaponsSpecialistFreeShot?: boolean;
}

export interface ItemTemplate {
  name: string;
  char: string;
  desc: string;
  value: number;
  color: string;
  rarity: "common" | "uncommon" | "rare" | "ultra_rare" | "one_of_a_kind";
  maxStack: number;
  bonusDmg?: number;
}

export interface ShipBlueprint {
  id: string;
  name: string;
  price: number;
  maxHull: number;
  maxShield: number;
  maxFuel: number;
  fuelConsumption: number;
  cargoSlots: number;
  hardpoints: number;
  maxCrew: number;
  perk: string;
}

export interface WeaponItem {
  id: string;
  name: string;
  type: "shield_damaging" | "hull_damaging" | "ion_disabling" | "balanced";
  damage: number;
  shieldBonus?: number;
  needsAmmo?: boolean;
  cost: number;
  icon: string;
  rarity: "common" | "uncommon" | "rare" | "ultra_rare" | "one_of_a_kind";
  desc: string;
}

export interface ComponentItem {
  id: string;
  name: string;
  category: "shield" | "hull" | "engine" | "scanner" | "cargo" | "mining" | "heat";
  rarity: "common" | "uncommon" | "rare" | "ultra_rare";
  bonus: number;
  cost: number;
  desc: string;
}

export interface FactionDetails {
  name: string;
  color: string;
  borderClass: string;
  badgeColor: string;
  repName: "hegemony" | "syndicate" | "cult" | "consortium" | "";
}

export interface PlanetSubclass {
  name: string;
  color: string;
  suffix: string;
  type: "gas" | "barren" | "rocky" | "earthlike" | "ash" | "heavy_belt" | "deep_crust" | "asteroid_field" | "planetary_core";
  requiresMiner?: boolean;
}

export interface StarSystemProfile {
  name: string;
  type: "trade" | "pirate" | "anomaly" | "military";
  desc: string;
  factionOwner: string;
  techLevel: number;
  safetyRating: number;
  oreEnrichment: number;
  connections: number[];
  jumpLanes?: number[];
}

export interface VoidWaypoint {
  id: string;
  name: string;
  value: number;
  galaxy: GalaxyCell[][];
  isSold: boolean;
  parentSystemIndex: number;
}

export interface SectorShip {
  id: string;
  name: string;
  shipClass: string;
  faction: string;
  reputation: number; // 0 to 100, neutral is 50
  personality: "Merchant" | "Patrol" | "Outlaw" | "Miner" | "Explorer";
  systemIndex: number;
  x: number;
  y: number;
  isFriend: boolean;
  credits: number;
  inventory: { type: string; qty: number; basePrice: number }[];
  hasHandshaked?: boolean;
}

export interface Drink {
  id: string;
  name: string;
  cost: number;
  description: string;
  exclusiveToSystem?: string; // name of system this is exclusive to (e.g. "Sirius A", "Proxima Centauri", etc.)
  buffType: "evasion" | "damage" | "mining" | "fuel_discount" | "shields";
  buffAmount: number; // e.g. 0.15 for 15%
  durationJumps: number; // number of jumps/moves the buff lasts for
}

export interface Beacon {
  id: string;
  name: string;
  x: number;
  y: number;
  systemIndex: number;
  frequency: string;
  isCustom?: boolean; // dropped by the player
  tradedShipIds?: string[];
}

export interface BlueprintTemplate {
  id: string;
  name: string;
  description: string;
  resultType: "weapon" | "module" | "spirit" | "consumable";
  resultId: string;
  materials: { type: string; qty: number }[];
  fuelCost: number;
  heatGenerated: number;
}


