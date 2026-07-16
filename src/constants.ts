/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ItemTemplate,
  ShipBlueprint,
  WeaponItem,
  ComponentItem,
  PlanetSubclass,
  FactionDetails,
  StarSystemProfile,
  Quest,
  Drink,
  BlueprintTemplate
} from "./types";

export const ITEM_TEMPLATES: Record<string, ItemTemplate> = {
  fuel: {
    name: "Warp Fuel Core",
    char: "F",
    desc: "Plutonium derivative warp energy standard fuel matrix cell.",
    value: 20,
    color: "text-blue-400",
    rarity: "common",
    maxStack: 10
  },
  scrap: {
    name: "Alloy Hull Scrap",
    char: "S",
    desc: "Damaged hyper-frame steel suitable for ship repair or metal recycling trade.",
    value: 10,
    color: "text-amber-600",
    rarity: "common",
    maxStack: 10
  },
  salvage_beacon: {
    name: "Salvage Beacon",
    char: "B",
    desc: "Deploy after combat to signal salvage crews to wreck sites. Reward credits based on target ships destroyed.",
    value: 100,
    color: "text-yellow-500",
    rarity: "rare",
    maxStack: 1
  },
  ore: {
    name: "Siderite Crystals",
    char: "O",
    desc: "Rare raw crystal formation. High market value at industrialized terminals.",
    value: 35,
    color: "text-purple-400",
    rarity: "uncommon",
    maxStack: 10
  },
  food: {
    name: "Nutrient Packets",
    char: "P",
    desc: "Standardized biological space provisions for long-haul bridge crew.",
    value: 15,
    color: "text-green-400",
    rarity: "common",
    maxStack: 10
  },
  contraband: {
    name: "Illegal Nanite Pod",
    char: "C",
    desc: "Black-market technology banned in alliance sectors. Sells high at Smuggler Hubs.",
    value: 120,
    color: "text-red-500",
    rarity: "ultra_rare",
    maxStack: 5
  },
  nanobots: {
    name: "Nanobot Injector",
    char: "N",
    desc: "Active engineering injection system that quickly seals major hull ruptures.",
    value: 40,
    color: "text-cyan-400",
    rarity: "uncommon",
    maxStack: 5
  },
  shieldcore: {
    name: "Shielding Harmonizer",
    char: "H",
    desc: "Capacitor system to flash-charge dynamic tactical barrier defenses.",
    value: 30,
    color: "text-blue-500",
    rarity: "uncommon",
    maxStack: 5
  },
  torpedo: {
    name: "HE Fusion Torpedo",
    char: "T",
    desc: "Standard high-explosive heavy payload warhead. (+10 Bonus Damage)",
    value: 25,
    color: "text-orange-500",
    bonusDmg: 10,
    rarity: "uncommon",
    maxStack: 20
  },
  torpedo_proton: {
    name: "Proton Torpedo",
    char: "P",
    desc: "High-density nuclear fission warhead. (+25 Bonus Damage)",
    value: 50,
    color: "text-red-500",
    bonusDmg: 25,
    rarity: "rare",
    maxStack: 20
  },
  torpedo_antimatter: {
    name: "Anti-Matter Torpedo",
    char: "A",
    desc: "Devastating anti-matter collision warhead. (+50 Bonus Damage)",
    value: 100,
    color: "text-fuchsia-500",
    bonusDmg: 50,
    rarity: "ultra_rare",
    maxStack: 20
  },
  orichalcum: {
    name: "Refined Orichalcum",
    char: "U",
    desc: "Ultra-hard dense metal alloy used in advanced military bulkheads.",
    value: 150,
    color: "text-yellow-500",
    rarity: "rare",
    maxStack: 10
  },
  plasma_gas: {
    name: "Purified Plasma Gas",
    char: "G",
    desc: "Superheated pressurized gas. Vital fuel reactant for heavy starship beams.",
    value: 65,
    color: "text-orange-400",
    rarity: "uncommon",
    maxStack: 10
  },
  noble_helium: {
    name: "Precious Helium-3 Gas",
    char: "H",
    desc: "Super-compressed volatile nuclear fusion fuel harvested from heavy gaseous atmospheres. Highly valuable, stacks up to 50.",
    value: 180,
    color: "text-cyan-400",
    rarity: "rare",
    maxStack: 50
  },
  neutronium: {
    name: "Neutronium Dust",
    char: "D",
    desc: "Micro-scooped degenerate neutron star matter. Extremely heavy and highly valuable.",
    value: 240,
    color: "text-purple-500",
    rarity: "ultra_rare",
    maxStack: 10
  },
  xenomorph_relic: {
    name: "Xenomorph Relic",
    char: "X",
    desc: "Intricate geometric crystal pulsing with low-level bio-signals. Collectors buy this at spaceports.",
    value: 2000,
    color: "text-fuchsia-500",
    rarity: "ultra_rare",
    maxStack: 5
  },
  dark_matter: {
    name: "Liquid Dark Matter",
    char: "M",
    desc: "Non-baryonic super-fluid captured from collapsed gravity singularities.",
    value: 5000,
    color: "text-purple-600 animate-pulse",
    rarity: "one_of_a_kind",
    maxStack: 2
  },
  beacon: {
    name: "Navigational Beacon",
    char: "B",
    desc: "Compact orbital responder unit used to tag space coordinates and broadcast sub-space telemetry.",
    value: 120,
    color: "text-emerald-400 animate-pulse",
    rarity: "uncommon",
    maxStack: 5
  },
  encrypted_drive: {
    name: "Encrypted Data Drive",
    char: "K",
    desc: "Damaged hyper-drive databank. Can be decrypted for massive reputation or values.",
    value: 90,
    color: "text-cyan-400",
    rarity: "uncommon",
    maxStack: 5
  },
  weapon_frame: {
    name: "Damaged Prototype Frame",
    char: "W",
    desc: "Exotic chassis alloy template from a classified military prototype project.",
    value: 1000,
    color: "text-red-500",
    rarity: "rare",
    maxStack: 2
  },
  helium_3: {
    name: "Helium-3 Fuel Gas",
    char: "3",
    desc: "Clean thermonuclear fusion isotope harvested from gas giants.",
    value: 25,
    color: "text-blue-300",
    rarity: "common",
    maxStack: 10
  },
  hydroponics_fiber: {
    name: "Synthetic Algae Fiber",
    char: "Y",
    desc: "Basic organic matter used in bio-reactors and synth-food synthesis.",
    value: 12,
    color: "text-green-600",
    rarity: "common",
    maxStack: 10
  },
  titanium_plates: {
    name: "Hardened Titanium Sheets",
    char: "I",
    desc: "Raw structural metal plating used to reinforce standard ship hulls.",
    value: 30,
    color: "text-slate-400",
    rarity: "common",
    maxStack: 10
  },
  superconductor: {
    name: "High-Temp Superconductor",
    char: "C",
    desc: "Zero-resistance ceramic strands used for starship power transmission grid lines.",
    value: 75,
    color: "text-teal-400",
    rarity: "uncommon",
    maxStack: 10
  },
  heavy_water: {
    name: "Deuterium Ice",
    char: "W",
    desc: "Enriched isotope water blocks vital for reactor coolant jacket shielding.",
    value: 45,
    color: "text-cyan-600",
    rarity: "uncommon",
    maxStack: 10
  },
  singularity_core: {
    name: "Micro-Singularity Core",
    char: "Q",
    desc: "Gravitationally collapsed micro-shell. Vital for sub-space warp engine drives.",
    value: 1500,
    color: "text-indigo-400 animate-pulse",
    rarity: "rare",
    maxStack: 5
  },
  neural_gel: {
    name: "Bio-Neural Gel Matrix",
    char: "B",
    desc: "Organic computing fluid designed to speed up navigational matrix coordinate calculation.",
    value: 220,
    color: "text-emerald-500",
    rarity: "rare",
    maxStack: 5
  },
  antimatter_capsule: {
    name: "Concentrated Antimatter Capsule",
    char: "A",
    desc: "Magnetic containment canister containing trace anti-protons. Highly volatile and precious.",
    value: 500,
    color: "text-fuchsia-600",
    rarity: "rare",
    maxStack: 5
  },
  stellar_ignition_spark: {
    name: "Stellar Core Ignition Spark",
    char: "Z",
    desc: "Active stellar ignition spark enclosed in a temporal stasis envelope. Prized by megacorporations.",
    value: 8000,
    color: "text-amber-300 font-bold animate-pulse",
    rarity: "one_of_a_kind",
    maxStack: 2
  },
  chronos_dust: {
    name: "Chronometric Dust",
    char: "T",
    desc: "Tachyon-infused dust particles capable of localized space-time frame manipulation.",
    value: 4000,
    color: "text-violet-500 font-bold animate-pulse",
    rarity: "ultra_rare",
    maxStack: 2
  },
  keycard_hegemony: {
    name: "Hegemony Core Clearance Keycard",
    char: "💳",
    desc: "An encrypted military keycard that spoofs Hegemony identity networks, unlocking restricted faction products.",
    value: 800,
    color: "text-red-400",
    rarity: "rare",
    maxStack: 1
  },
  keycard_syndicate: {
    name: "Syndicate Decryption Keycard",
    char: "💳",
    desc: "A cloned security card that bypasses Syndicate lockouts, granting clearance as an insider.",
    value: 800,
    color: "text-yellow-500",
    rarity: "rare",
    maxStack: 1
  },
  keycard_cult: {
    name: "Void Cult Ritual Sigil",
    char: "💳",
    desc: "A dark magnetic insignia that fools Void Cult scanning towers, spoofing high-ranking devotion.",
    value: 800,
    color: "text-purple-400",
    rarity: "rare",
    maxStack: 1
  },
  keycard_consortium: {
    name: "Consortium VIP Access Token",
    char: "💳",
    desc: "A premium commerce ledger bypass token that spoofs Merchant Consortium loyalty points.",
    value: 800,
    color: "text-cyan-400",
    rarity: "rare",
    maxStack: 1
  },
  ore_astraea: {
    name: "Astraea Crystals",
    char: "★",
    desc: "Shining celestial crystals infused with background void energy. Extremely valuable.",
    value: 80,
    color: "text-cyan-400",
    rarity: "rare",
    maxStack: 10
  },
  ore_pyrite: {
    name: "Pyrite Prisms",
    char: "◆",
    desc: "Light-splitting mineral matrix with super-conducting metallic crystalline structures.",
    value: 150,
    color: "text-amber-400",
    rarity: "rare",
    maxStack: 10
  },
  ore_ignis: {
    name: "Volatile Ignis Ore",
    char: "🔥",
    desc: "Highly explosive raw mineral. Highly dangerous to harvest, but extremely valuable.",
    value: 300,
    color: "text-red-500",
    rarity: "ultra_rare",
    maxStack: 5
  },
  spirit_neutron_ale: {
    name: "Crafted Neutron Ale",
    char: "🍺",
    desc: "Microgravity fermented spirit. Drink to increase Weapons Specialist damage (+15% for 5 jumps).",
    value: 80,
    color: "text-amber-300 font-bold",
    rarity: "uncommon",
    maxStack: 10
  },
  spirit_hyperdrive_tonic: {
    name: "Crafted Hyperdrive Tonic",
    char: "🧪",
    desc: "Tachyon-purified dynamic tonic. Drink to increase Pilot Evasion (+20% for 6 jumps).",
    value: 120,
    color: "text-cyan-300 font-bold animate-pulse",
    rarity: "rare",
    maxStack: 10
  },
  spirit_comet_nectar: {
    name: "Crafted Comet Nectar",
    char: "🧉",
    desc: "Sweet comet-melt drink. Drink to increase Miner Mining Yield efficiency (+25% for 8 jumps).",
    value: 70,
    color: "text-teal-300 font-bold",
    rarity: "uncommon",
    maxStack: 10
  },
  spirit_antimatter_brew: {
    name: "Crafted Antimatter Brew",
    char: "🍷",
    desc: "Volatile containment beverage. Drink to increase FTL jump fuel savings (+15% for 4 jumps).",
    value: 100,
    color: "text-fuchsia-400 font-bold animate-pulse",
    rarity: "rare",
    maxStack: 10
  },
  spirit_ion_shake: {
    name: "Crafted Ion Shield Shake",
    char: "🥛",
    desc: "Highly carbonated shield tonic. Drink to increase Operator Shield capacity (+20% for 5 jumps).",
    value: 90,
    color: "text-blue-300 font-bold",
    rarity: "uncommon",
    maxStack: 10
  }
};

export const SHIPS_BLUEPRINTS: Record<string, ShipBlueprint> = {
  interceptor: {
    id: "interceptor",
    name: "Wraith Interceptor",
    price: 800,
    maxHull: 80,
    maxShield: 60,
    maxFuel: 40,
    fuelConsumption: 0.8,
    cargoSlots: 12,
    hardpoints: 2,
    maxCrew: 2,
    perk: "Acrobatic Hull: Grants passive +15% evasive rating. Light hull holds up to 2 active crew."
  },
  freighter: {
    id: "freighter",
    name: "Atlas Superfreighter",
    price: 1200,
    maxHull: 150,
    maxShield: 100,
    maxFuel: 80,
    fuelConsumption: 1.4,
    cargoSlots: 30,
    hardpoints: 2,
    maxCrew: 5,
    perk: "Deep Cargo Cell: Large layout slots. Supports up to 5 crew berths."
  },
  torpedoboat: {
    id: "torpedoboat",
    name: "Viper Torpedo Escort",
    price: 1600,
    maxHull: 120,
    maxShield: 80,
    maxFuel: 50,
    fuelConsumption: 1.2,
    cargoSlots: 16,
    hardpoints: 3,
    maxCrew: 4,
    perk: "Torpedo Matrix: Torpedo explosive kinetic damage +25%. Carries up to 4 crew."
  },
  assault_gunship: {
    id: "assault_gunship",
    name: "Spectre Assault Gunship",
    price: 2000,
    maxHull: 180,
    maxShield: 120,
    maxFuel: 70,
    fuelConsumption: 1.5,
    cargoSlots: 18,
    hardpoints: 3,
    maxCrew: 6,
    perk: "Combat Overdrive: Fitted weapon payloads deal +15% damage. Carries up to 6 crew."
  },
  science_explorer: {
    id: "science_explorer",
    name: "Aegis Recon Explorer",
    price: 1500,
    maxHull: 100,
    maxShield: 140,
    maxFuel: 90,
    fuelConsumption: 1.0,
    cargoSlots: 22,
    hardpoints: 2,
    maxCrew: 8,
    perk: "Advanced Radiometry: Planet scans sweep and uncover 2 extra neighboring grids instantly."
  },
  battlecruiser: {
    id: "battlecruiser",
    name: "Vindicator Command Cruiser",
    price: 2800,
    maxHull: 240,
    maxShield: 180,
    maxFuel: 120,
    fuelConsumption: 2.2,
    cargoSlots: 20,
    hardpoints: 4,
    maxCrew: 12,
    perk: "Dreadnought Battery: Fitted with 4 weapons lanes and massive crew housing up to 12 specialists."
  },
  void_leviathan: {
    id: "void_leviathan",
    name: "Tenebris Void Dreadnought",
    price: 3800,
    maxHull: 350,
    maxShield: 260,
    maxFuel: 160,
    fuelConsumption: 2.8,
    cargoSlots: 24,
    hardpoints: 4,
    maxCrew: 15,
    perk: "Fortress Shield Matrix: Titanic defensive shields recharge 20% faster; accommodates up to 15 crew members."
  },
  heavy_hauler: {
    id: "heavy_hauler",
    name: "Goliath Heavy Cargo Hauler",
    price: 1500,
    maxHull: 200,
    maxShield: 110,
    maxFuel: 100,
    fuelConsumption: 1.6,
    cargoSlots: 60,
    hardpoints: 2,
    maxCrew: 6,
    perk: "Super-Heavy Freight Cells: Massive freight arrays holding up to 60 cargo crates. Accommodates 6 crew."
  },
  mining_digger: {
    id: "mining_digger",
    name: "Vulkan Mining Excavator",
    price: 1300,
    maxHull: 160,
    maxShield: 90,
    maxFuel: 80,
    fuelConsumption: 1.2,
    cargoSlots: 24,
    hardpoints: 2,
    maxCrew: 4,
    perk: "Excavator Beam Siphon: Yields +50% extra minerals when drilling asteroid fields. Space for 4 crew."
  },
  ferry_evac: {
    id: "ferry_evac",
    name: "Odysseus Evacuation Ark",
    price: 1400,
    maxHull: 150,
    maxShield: 120,
    maxFuel: 90,
    fuelConsumption: 1.1,
    cargoSlots: 25,
    hardpoints: 1,
    maxCrew: 10,
    perk: "Passenger Habitats: Optimized for high-capacity personnel ferrying and evacuation missions. Fits up to 10 crew members."
  },
  fuel_tanker: {
    id: "fuel_tanker",
    name: "Prometheus Fueling Tanker",
    price: 1700,
    maxHull: 180,
    maxShield: 130,
    maxFuel: 300,
    fuelConsumption: 1.5,
    cargoSlots: 20,
    hardpoints: 2,
    maxCrew: 5,
    perk: "Super-Sized Fuel Cells: Houses a massive 300-unit fuel reservoir. Perfect for long-haul jumps and deep space refueling."
  }
};

export const WEAPON_ITEMS: Record<string, WeaponItem> = {
  pulse_laser: {
    id: "pulse_laser",
    name: "Pulse Laser Cannon",
    type: "shield_damaging",
    damage: 18,
    shieldBonus: 2.0,
    cost: 150,
    icon: "bolt",
    rarity: "common",
    desc: "Energy wave emitter. Extremely effective against dynamic shielding layers, dispersed on hull plates."
  },
  pulse_laser_mk2: {
    id: "pulse_laser_mk2",
    name: "Pulse Laser MK2",
    type: "shield_damaging",
    damage: 28,
    shieldBonus: 2.0,
    cost: 300,
    icon: "bolt",
    rarity: "uncommon",
    desc: "Upgraded plasma focus lens. Devastates defensive energy buffers."
  },
  pulse_laser_mk3: {
    id: "pulse_laser_mk3",
    name: "Pulse Laser MK3",
    type: "shield_damaging",
    damage: 42,
    shieldBonus: 2.0,
    cost: 600,
    icon: "bolt",
    rarity: "rare",
    desc: "Military grade laser array. Melts shields instantly."
  },
  torpedo_launcher: {
    id: "torpedo_launcher",
    name: "HE Torpedo Tube",
    type: "hull_damaging",
    damage: 32,
    needsAmmo: true,
    cost: 250,
    icon: "rocket",
    rarity: "common",
    desc: "Launches fusion explosive warheads. Ignores 30% shielding parameters, shreds steel hulls."
  },
  torpedo_launcher_mk2: {
    id: "torpedo_launcher_mk2",
    name: "HE Torpedo Tube MK2",
    type: "hull_damaging",
    damage: 48,
    needsAmmo: true,
    cost: 450,
    icon: "rocket",
    rarity: "uncommon",
    desc: "Fitted with high-velocity launch rails. Amplifies launcher base yield."
  },
  torpedo_launcher_mk3: {
    id: "torpedo_launcher_mk3",
    name: "HE Torpedo Tube MK3",
    type: "hull_damaging",
    damage: 68,
    needsAmmo: true,
    cost: 900,
    icon: "rocket",
    rarity: "rare",
    desc: "Super-duty dreadnought deployment array. Exterminates hull frame plates."
  },
  ion_blaster: {
    id: "ion_blaster",
    name: "Heavy Ion Array",
    type: "ion_disabling",
    damage: 12,
    cost: 180,
    icon: "zap",
    rarity: "uncommon",
    desc: "Disrupts internal electrical conduits. Temporarily disables secondary weapons system arrays."
  },
  ion_blaster_mk2: {
    id: "ion_blaster_mk2",
    name: "Heavy Ion Array MK2",
    type: "ion_disabling",
    damage: 22,
    cost: 320,
    icon: "zap",
    rarity: "rare",
    desc: "Supercharged electronic sweep disruptor. Cripples hostiles."
  },
  plasma_spike: {
    id: "plasma_spike",
    name: "Plasma Thermal Beam",
    type: "balanced",
    damage: 22,
    cost: 300,
    icon: "flame",
    rarity: "uncommon",
    desc: "Compressed thermal core burner. Balanced structural fusion damage payload targeting shielding and plating uniformly."
  },
  plasma_spike_mk2: {
    id: "plasma_spike_mk2",
    name: "Plasma Thermal MK2",
    type: "balanced",
    damage: 36,
    cost: 550,
    icon: "flame",
    rarity: "rare",
    desc: "Overcharged atomic burner. Evaporates titanium hull panels uniformally."
  },
  exclusive_railgun_mk4: {
    id: "exclusive_railgun_mk4",
    name: "Hyper-Velocity Railgun MK4",
    type: "hull_damaging",
    damage: 85,
    cost: 1200,
    icon: "crosshair",
    rarity: "ultra_rare",
    desc: "Elite specialized railgun launcher that fires heavy kinetic slugs. Bypasses shielding entirely."
  },
  experimental_singularity_mkx: {
    id: "experimental_singularity_mkx",
    name: "Singularity Decimator MKX",
    type: "balanced",
    damage: 140,
    cost: 2500,
    icon: "sparkles",
    rarity: "one_of_a_kind",
    desc: "Classified hyper-tech singularity core launcher. Instantly folds surrounding spatial envelopes to collapse enemy vessels."
  },
  sentient_chatterbox: {
    id: "sentient_chatterbox",
    name: "Sentient Chatterbox Laser",
    type: "shield_damaging",
    damage: 24,
    cost: 95,
    icon: "message-square",
    rarity: "uncommon",
    desc: "Stupidly cheap sentient gun. Chatters in log. 25% chance to insult target for +30% damage, but 15% chance to get distracted and miss entirely."
  },
  retro_fission: {
    id: "retro_fission",
    name: "Retro-Grade Fission Blaster",
    type: "hull_damaging",
    damage: 55,
    cost: 110,
    icon: "rotate-ccw",
    rarity: "rare",
    desc: "Stupidly cheap and highly dangerous prototype. 12% chance to misfire and hit the player's own shield for 15 damage."
  },
  consortium_gold: {
    id: "consortium_gold",
    name: "Consortium Golden Cannon",
    type: "balanced",
    damage: 60,
    cost: 2100,
    icon: "coins",
    rarity: "one_of_a_kind",
    desc: "Ludicrously expensive weapon crafted for elite trade oligarchs. Consumes 10 Credits per shot to double its damage! Shoots rusty dust (10% damage) if you run out of cash."
  },
  void_paradox: {
    id: "void_paradox",
    name: "Void-Core Paradox Beam",
    type: "balanced",
    damage: 48,
    cost: 750,
    icon: "infinity",
    rarity: "ultra_rare",
    desc: "Unstable spacefold device. 15% chance to accidentally heal target for 20 Hull, but 15% chance to instantly disintegrate enemy's shields to 0."
  },
  pulse_laser_mk5: {
    id: "pulse_laser_mk5",
    name: "Pulse Laser Cannon MK5",
    type: "shield_damaging",
    damage: 250,
    shieldBonus: 3.0,
    cost: 10000,
    icon: "bolt",
    rarity: "one_of_a_kind",
    desc: "God-tier pulse laser. Destroys all obstacles instantly with high-yield tachyon plasma discharges."
  },
  emp_shockwave_launcher_mk1: {
    id: "emp_shockwave_launcher_mk1",
    name: "EMP Shockwave Launcher MK1",
    type: "ion_disabling",
    damage: 105,
    cost: 2200,
    icon: "zap",
    rarity: "one_of_a_kind",
    desc: "Exotic electromagnetic disruptor. Unleashes high-intensity spherical flux pulses that fry sub-system circuitry and disable armament arrays."
  }
};

export const COMPONENT_ITEMS: Record<string, ComponentItem> = {
  shield_standard: {
    id: "shield_standard",
    name: "Standard Shield Gen",
    category: "shield",
    rarity: "common",
    bonus: 0,
    cost: 0,
    desc: "Factory default shield array. Functional but weak."
  },
  shield_carbon: {
    id: "shield_carbon",
    name: "Carbon Deflector Gen",
    category: "shield",
    rarity: "uncommon",
    bonus: 30,
    cost: 200,
    desc: "Reinforced carbon mesh weave. Adds +30 Maximum Shields."
  },
  shield_aegis: {
    id: "shield_aegis",
    name: "Aegis Matrix Gen",
    category: "shield",
    rarity: "rare",
    bonus: 60,
    cost: 500,
    desc: "High-yield polarizing array. Adds +60 Maximum Shields."
  },
  shield_void: {
    id: "shield_void",
    name: "Void-Shield Harmonizer",
    category: "shield",
    rarity: "ultra_rare",
    bonus: 100,
    cost: 1200,
    desc: "Experimental dark energy barrier. Adds +100 Maximum Shields."
  },
  hull_standard: {
    id: "hull_standard",
    name: "Standard Hull Plates",
    category: "hull",
    rarity: "common",
    bonus: 0,
    cost: 0,
    desc: "Baseline titanium-alloy bulk plates."
  },
  hull_reinforced: {
    id: "hull_reinforced",
    name: "Blast Alloy Plates",
    category: "hull",
    rarity: "uncommon",
    bonus: 40,
    cost: 250,
    desc: "Explosive-resistant composite weave. Adds +40 Maximum Hull Integrity."
  },
  hull_nanite: {
    id: "hull_nanite",
    name: "Nanite Self-Sealing Plates",
    category: "hull",
    rarity: "rare",
    bonus: 80,
    cost: 600,
    desc: "Micro-repair layers that fuse under fire. Adds +80 Maximum Hull Integrity."
  },
  hull_neutron: {
    id: "hull_neutron",
    name: "Neutron Core Matrix Armor",
    category: "hull",
    rarity: "ultra_rare",
    bonus: 150,
    cost: 1500,
    desc: "Sub-atomic compressed plate lattice. Adds +150 Maximum Hull Integrity."
  },
  engine_standard: {
    id: "engine_standard",
    name: "Standard Warp Drive",
    category: "engine",
    rarity: "common",
    bonus: 1.0,
    cost: 0,
    desc: "Baseline hyper-jet warp drives."
  },
  engine_ion: {
    id: "engine_ion",
    name: "Ion Thruster Drive",
    category: "engine",
    rarity: "uncommon",
    bonus: 0.85,
    cost: 180,
    desc: "Highly balanced propulsion matrix. Cuts fuel consumption by 15%."
  },
  engine_fusion: {
    id: "engine_fusion",
    name: "Thermonuclear Core Drive",
    category: "engine",
    rarity: "rare",
    bonus: 0.7,
    cost: 450,
    desc: "Heavy fuel recycling conduits. Cuts fuel consumption by 30%."
  },
  engine_singularity: {
    id: "engine_singularity",
    name: "Singularity Fold Drive",
    category: "engine",
    rarity: "ultra_rare",
    bonus: 0.5,
    cost: 1100,
    desc: "Manipulates space-fold directly. Cuts fuel consumption by 50%."
  },
  scanner_standard: {
    id: "scanner_standard",
    name: "Standard Scanners",
    category: "scanner",
    rarity: "common",
    bonus: 0,
    cost: 0,
    desc: "Factory default radar. Basic threat scanning."
  },
  scanner_mk1: {
    id: "scanner_mk1",
    name: "Scan Suite MK1",
    category: "scanner",
    rarity: "common",
    bonus: 10,
    cost: 120,
    desc: "Tuned emission antenna. Resolves spectral lines with 30% active noise reduction."
  },
  scanner_mk2: {
    id: "scanner_mk2",
    name: "Scan Suite MK2",
    category: "scanner",
    rarity: "uncommon",
    bonus: 25,
    cost: 320,
    desc: "Active thermal/IR filter set. Resolves spectral lines with 50% noise reduction."
  },
  scanner_mk3: {
    id: "scanner_mk3",
    name: "Scan Suite MK3",
    category: "scanner",
    rarity: "rare",
    bonus: 50,
    cost: 750,
    desc: "Quantum-stabilized Gamma/X-Ray array. Resolves spectral lines with 75% noise reduction."
  },
  scanner_mk4: {
    id: "scanner_mk4",
    name: "Scan Suite MK4",
    category: "scanner",
    rarity: "ultra_rare",
    bonus: 90,
    cost: 1600,
    desc: "Void-Spectral Supercomputer analyzer. Resolves spectral lines with 90% noise reduction."
  },
  scanner_tachyon: {
    id: "scanner_tachyon",
    name: "Tachyon Radiometer",
    category: "scanner",
    rarity: "uncommon",
    bonus: 15,
    cost: 150,
    desc: "Deep sensor pulses. Increases planetary scanning success chance by 15%."
  },
  scanner_quantum: {
    id: "scanner_quantum",
    name: "Quantum Entangled Radar",
    category: "scanner",
    rarity: "rare",
    bonus: 30,
    cost: 400,
    desc: "Zero-latency telemetry sweep. Increases planetary scanning success chance by 30%."
  },
  cargo_standard: {
    id: "cargo_standard",
    name: "Standard Cargo Bays",
    category: "cargo",
    rarity: "common",
    bonus: 0,
    cost: 0,
    desc: "Stock structural space containers."
  },
  cargo_compression: {
    id: "cargo_compression",
    name: "Magnetic Compression Cells",
    category: "cargo",
    rarity: "uncommon",
    bonus: 4,
    cost: 150,
    desc: "Advanced physical space compaction. Adds +4 cargo slots."
  },
  cargo_dimensional: {
    id: "cargo_dimensional",
    name: "Sub-Space Compartments",
    category: "cargo",
    rarity: "rare",
    bonus: 8,
    cost: 450,
    desc: "Warp folder boxes within boxes. Adds +8 cargo slots."
  },
  cargo_pocket_void: {
    id: "cargo_pocket_void",
    name: "Pocket Void Expanders",
    category: "cargo",
    rarity: "ultra_rare",
    bonus: 16,
    cost: 1000,
    desc: "Folds extra-dimensional bubbles directly. Adds +16 cargo slots."
  },
  mining_standard: {
    id: "mining_standard",
    name: "Class-I Rotational Cutter",
    category: "mining",
    rarity: "common",
    bonus: 1,
    cost: 0,
    desc: "Standard entry-level laser cutter drills."
  },
  mining_heavy: {
    id: "mining_heavy",
    name: "Class-II Carbide Core Drill",
    category: "mining",
    rarity: "rare",
    bonus: 2,
    cost: 450,
    desc: "Tier 2 heavy driller. Necessary for extracting volatile Ignis mineral nodes safely."
  },
  mining_plasma: {
    id: "mining_plasma",
    name: "Class-III Plasma Inductor Matrix",
    category: "mining",
    rarity: "ultra_rare",
    bonus: 3,
    cost: 1200,
    desc: "Tier 3 advanced plasma extraction beam. Greatly increases extraction yields."
  },
  mining_gas: {
    id: "mining_gas",
    name: "Class-G Atmospheric Gas Siphon",
    category: "mining",
    rarity: "rare",
    bonus: 2,
    cost: 650,
    desc: "A specialized electromagnetic condenser component. Required for harvesting precious gaseous planetary clouds and nebulae. Purchased from mining stations only."
  },
  heat_core: {
    id: "heat_core",
    name: "Thermal Ejection Core",
    category: "heat",
    rarity: "rare",
    bonus: 0,
    cost: 800,
    desc: "Emergency thermal venting core. Ejects on use to reset heat to 0 and provides 60s of total heat immunity. Requires station replacement."
  }
};

export const PLANET_SUBCLASSES: PlanetSubclass[] = [
  { name: "Gas Giant", color: "text-orange-400", suffix: "Prime", type: "gas" },
  { name: "Dwarf Planet", color: "text-emerald-500", suffix: "Minor", type: "barren" },
  { name: "Rogue Moon", color: "text-indigo-400", suffix: "Theta", type: "rocky" },
  { name: "Lush Biosphere", color: "text-green-400", suffix: "Major", type: "earthlike" },
  { name: "Volcanic Caldera", color: "text-red-500", suffix: "Sigma", type: "ash" },
  {
    name: "Heavy Core Asteroid Belt",
    color: "text-yellow-600",
    suffix: "Mantle",
    type: "asteroid_field",
    requiresMiner: true
  },
  {
    name: "Frozen Mineral Planet",
    color: "text-blue-300",
    suffix: "Apex",
    type: "planetary_core",
    requiresMiner: true
  }
];

export const FACTIONS: Record<string, FactionDetails> = {
  neutral: {
    name: "Unclaimed Fringe",
    color: "text-neutral-400",
    borderClass: "border-neutral-500/30",
    badgeColor: "bg-neutral-800 text-neutral-300",
    repName: ""
  },
  hegemony: {
    name: "Solar Hegemony",
    color: "text-red-500",
    borderClass: "border-red-500/30",
    badgeColor: "bg-red-950 text-red-400",
    repName: "hegemony"
  },
  syndicate: {
    name: "Rebel Syndicate",
    color: "text-amber-500",
    borderClass: "border-amber-500/30",
    badgeColor: "bg-amber-950 text-amber-400",
    repName: "syndicate"
  },
  cult: {
    name: "Void Cult",
    color: "text-purple-400",
    borderClass: "border-purple-500/30",
    badgeColor: "bg-purple-950 text-purple-300",
    repName: "cult"
  },
  consortium: {
    name: "Merchant Consortium",
    color: "text-cyan-400",
    borderClass: "border-cyan-500/30",
    badgeColor: "bg-cyan-950 text-cyan-300",
    repName: "consortium"
  }
};

export const STAR_SYSTEMS_PROFILES: StarSystemProfile[] = [
  { name: "Sol", type: "trade", desc: "The birthplace of humanity. A high-security core system protected by the Solar Hegemony.", factionOwner: "Hegemony", techLevel: 10, safetyRating: 100, oreEnrichment: 20, connections: [1, 2, 3, 5, 7] },
  { name: "Sirius A", type: "trade", desc: "Consortium-dominated bright system.", factionOwner: "Consortium", techLevel: 5, safetyRating: 90, oreEnrichment: 40, connections: [0, 5, 7] },
  { name: "Proxima Centauri", type: "pirate", desc: "Outlaw frontier crimson-dwarf system.", factionOwner: "Independent", techLevel: 2, safetyRating: 20, oreEnrichment: 60, connections: [0, 8, 12] },
  { name: "Tau Ceti", type: "anomaly", desc: "Unstable magnetic void system.", factionOwner: "None", techLevel: 3, safetyRating: 30, oreEnrichment: 80, connections: [4, 6, 10] },
  { name: "Epsilon Eridani", type: "military", desc: "Heavily fortified military defensive hub.", factionOwner: "Hegemony", techLevel: 8, safetyRating: 95, oreEnrichment: 30, connections: [3, 9, 15], jumpLanes: [9, 15] },
  { name: "Alpha Centauri", type: "trade", desc: "Chaotic commerce hub for outer smugglers.", factionOwner: "Syndicate", techLevel: 4, safetyRating: 40, oreEnrichment: 50, connections: [0, 7, 12] },
  { name: "Kepler-186", type: "anomaly", desc: "Terrifying cultist gravitational core region.", factionOwner: "Void Cult", techLevel: 1, safetyRating: 10, oreEnrichment: 90, connections: [3, 10, 13] },
  { name: "Barnard's Star", type: "trade", desc: "Primary commercial highway artery.", factionOwner: "Consortium", techLevel: 6, safetyRating: 85, oreEnrichment: 45, connections: [0, 1, 5, 14], jumpLanes: [14] },
  { name: "Gliese 581", type: "pirate", desc: "Debris-filled resource expanse.", factionOwner: "Independent", techLevel: 2, safetyRating: 25, oreEnrichment: 55, connections: [2, 12, 15] },
  { name: "Luyten's Star", type: "military", desc: "Industrial heavy warship shipyard hub.", factionOwner: "Hegemony", techLevel: 9, safetyRating: 90, oreEnrichment: 35, connections: [4, 11, 15], jumpLanes: [4, 15] },
  { name: "Fomalhaut", type: "anomaly", desc: "Ethereal stellar ring nebula system.", factionOwner: "None", techLevel: 4, safetyRating: 50, oreEnrichment: 60, connections: [3, 6, 13] },
  { name: "Kapteyn's Star", type: "trade", desc: "Massive sub-surface deep core extraction site.", factionOwner: "Consortium", techLevel: 5, safetyRating: 70, oreEnrichment: 95, connections: [9, 14, 15] },
  { name: "Wolf 359", type: "pirate", desc: "Hidden Syndicate underground space station base.", factionOwner: "Syndicate", techLevel: 3, safetyRating: 15, oreEnrichment: 50, connections: [2, 5, 8] },
  { name: "Aldebaran", type: "anomaly", desc: "Deep dark stellar eye, epicenter of the Void Cult.", factionOwner: "Void Cult", techLevel: 2, safetyRating: 5, oreEnrichment: 95, connections: [6, 10, 15] },
  { name: "Betelgeuse", type: "trade", desc: "Red supergiant star transit hub.", factionOwner: "Consortium", techLevel: 6, safetyRating: 80, oreEnrichment: 40, connections: [7, 11, 15], jumpLanes: [7, 15] },
  { name: "Vega Orbit", type: "military", desc: "Advanced long-range perimeter defense system.", factionOwner: "Hegemony", techLevel: 7, safetyRating: 85, oreEnrichment: 30, connections: [4, 8, 9, 11, 13, 14], jumpLanes: [4, 9, 14] }
];

export const STORY_QUESTS_CAMPAIGNS: Quest[] = [
  {
    id: "quest_void_core",
    title: "Project Void-Core",
    description: "An ancient sub-space energy node was detected. Follow coordinates sequentially to retrieve its antimatter component.",
    rewardCredits: 3000,
    currentStep: 0,
    steps: [
      {
        x: 2,
        y: 7,
        log: "Story Scan: Decrypting the ancient sensor relay signal in sector [2, 7]...",
        isCompleted: false,
        action: "Run Decoupler Scan"
      },
      {
        x: 8,
        y: 2,
        log: "Story Retrieve: Searching radioactive wreckage anomaly in sector [8, 2]...",
        isCompleted: false,
        action: "Salvage Containment Core"
      },
      {
        x: 5,
        y: 8,
        log: "Story Deliver: Deliberating blueprints to the high-tech station gateway at [5, 8]...",
        isCompleted: false,
        action: "Deliver containment cores"
      }
    ],
    ultimateRewardWeapon: "experimental_singularity_mkx"
  },
  {
    id: "quest_long_range_exploration",
    title: "Deep Range Exploration Initiative",
    description: "Map uncharted sectors across the galaxy to uncover resource-rich asteroid belts.",
    rewardCredits: 6000,
    currentStep: 0,
    steps: [
      {
        x: 1,
        y: 1,
        log: "Survey: Scanning local belt at [1, 1]...",
        isCompleted: false,
        action: "Deploy Scanner"
      },
      {
        x: 5,
        y: 5,
        log: "Survey: Scanning fringe sector at [5, 5]...",
        isCompleted: false,
        action: "Deploy Scanner"
      },
      {
        x: 9,
        y: 9,
        log: "Survey: Final scan of deep space at [9, 9]...",
        isCompleted: false,
        action: "Deploy Scanner"
      }
    ],
    ultimateRewardComponent: "scanner_mk4"
  },
  {
    id: "quest_cross_sector_trade",
    title: "Cross-Sector Trade Network",
    description: "Establish trade routes by delivering medical and technical supplies to multiple remote outpost stations.",
    rewardCredits: 7500,
    currentStep: 0,
    steps: [
      {
        x: 0,
        y: 0,
        log: "Trade: Delivering supplies to station at [0, 0]...",
        isCompleted: false,
        action: "Deliver Supplies"
      },
      {
        x: 4,
        y: 2,
        log: "Trade: Delivering supplies to station at [4, 2]...",
        isCompleted: false,
        action: "Deliver Supplies"
      },
      {
        x: 9,
        y: 0,
        log: "Trade: Delivering supplies to station at [9, 0]...",
        isCompleted: false,
        action: "Deliver Supplies"
      }
    ],
    ultimateRewardComponent: "cargo_pocket_void"
  },
  {
    id: "quest_syndicate_map",
    title: "The Syndicate Cartographer",
    description: "The Smuggler Guild needs charts of hyper-lane vectors. Track three rogue sectors to map the cosmic void.",
    rewardCredits: 1800,
    currentStep: 0,
    steps: [
      {
        x: 1,
        y: 3,
        log: "Story Survey: Measuring anomalous spacefolds in sector [1, 3]...",
        isCompleted: false,
        action: "Collect spacefold parameters"
      },
      {
        x: 7,
        y: 9,
        log: "Story Deposit: Drop charts at Smuggler base node in sector [7, 9]...",
        isCompleted: false,
        action: "Upload illegal manifests"
      }
    ],
    ultimateRewardComponent: "cargo_pocket_void"
  },
  {
    id: "quest_mining_repair",
    title: "Consortium Station Repair",
    description: "A vital Consortium mining platform has suffered critical power grid failures. Secure parts and perform manual core repairs.",
    rewardCredits: 2500,
    currentStep: 0,
    steps: [
      {
        x: 3,
        y: 2,
        log: "Consortium Repair: Successfully retrieved heavy-duty fusion heat shield plating from the debris in sector [3, 2]!",
        isCompleted: false,
        action: "Retrieve Fusion Plating",
        requiresManual: true
      },
      {
        x: 6,
        y: 4,
        log: "Consortium Repair: Airlocked into the core reactor at [6, 4], successfully installed plating and rebooted the thermal generator grids!",
        isCompleted: false,
        action: "Install Plating & Reboot Core",
        requiresManual: true
      }
    ],
    ultimateRewardComponent: "drill_mk3"
  },
  {
    id: "quest_cargo_run",
    title: "Consolidated Cargo Run",
    description: "Deliver sensitive vaccine supply crates to multiple remote frontier sectors under a strict flight schedule.",
    rewardCredits: 3500,
    currentStep: 0,
    steps: [
      {
        x: 1,
        y: 6,
        log: "Consolidated Cargo: Ejected primary supply capsule safely into the planet's stratosphere in sector [1, 6]!",
        isCompleted: false,
        action: "Drop Off Primary Med-Kit",
        requiresManual: true
      },
      {
        x: 7,
        y: 3,
        log: "Consolidated Cargo: Unloaded the cryogenic insulin reserves onto the surface outpost's receiving pad in sector [7, 3]!",
        isCompleted: false,
        action: "Drop Off Secondary Med-Kit",
        requiresManual: true
      },
      {
        x: 4,
        y: 9,
        log: "Consolidated Cargo: Authenticated cargo drop manifests with the Consortium orbital custom agents at sector [4, 9]!",
        isCompleted: false,
        action: "Final Logistics Signature",
        requiresManual: true
      }
    ]
  },
  {
    id: "quest_caravan_refuel",
    title: "Deep-Space Refueling Run",
    description: "A friendly refugee flotilla is stranded with empty reactors. Give them 30 units of fuel (or 5 units if piloting a Fuel Tanker).",
    rewardCredits: 3000,
    currentStep: 0,
    steps: [
      {
        x: 5,
        y: 2,
        log: "Refueling Run: Drained ship's fuel reservoir to replenish the refugees' dry reactors in sector [5, 2]. They are extremely grateful!",
        isCompleted: false,
        action: "Refuel Refugee Caravan",
        requiresManual: true
      },
      {
        x: 8,
        y: 7,
        log: "Refueling Run: Docked with their security vessel in sector [8, 7] to collect the reward bond and leftover industrial salvages!",
        isCompleted: false,
        action: "Collect Refugee Compensation Ledger",
        requiresManual: true
      }
    ],
    ultimateRewardComponent: "scanner_mk3"
  },
  {
    id: "quest_weapons_siege",
    title: "Weapons Depot Siege",
    description: "Rogue Syndicate arms dealers are staging high-impact kinetic torpedoes. Neutralize their planetary defense depot.",
    rewardCredits: 4000,
    currentStep: 0,
    steps: [
      {
        x: 2,
        y: 8,
        log: "Depot Siege: Charged and fired tactical ship bombardment batteries, obliterating the weapons depot's surface shield emitters!",
        isCompleted: false,
        action: "Initiate Orbital Bombardment",
        requiresManual: true
      },
      {
        x: 2,
        y: 8,
        log: "Depot Siege: Eradicated the pirate defense force sent to secure the remaining wreckage of the depot!",
        isCompleted: false,
        action: "Eradicate Orbit Guards",
        requiresManual: true,
        combatEnemies: [
          {
            name: "Syndicate Depot Guard",
            hull: 200,
            maxHull: 200,
            shields: 150,
            maxShields: 150,
            damage: 22,
            weaponType: "torpedo_launcher",
            weapons: "Heavy Torpedo / Plasma Spike",
            xpReward: 350,
            loot: ["unstable_plasma_core", "scrap_metal"]
          }
        ]
      }
    ],
    ultimateRewardWeapon: "emp_shockwave_launcher_mk1"
  },
  {
    id: "quest_ore_prospecting",
    title: "Hidden Ore Prospecting",
    description: "Deploy deep beacons to find a hidden anomalous asteroid and harvest its rare exotic metals.",
    rewardCredits: 4500,
    currentStep: 0,
    steps: [
      {
        x: 6,
        y: 6,
        log: "Prospecting: Beacon deployed in sector [6, 6]. High-frequency seismic echo waves are bouncing off localized sub-space folds.",
        isCompleted: false,
        action: "Deploy Prospector Beacon",
        requiresManual: true
      },
      {
        x: 3,
        y: 9,
        log: "Prospecting: Located the hidden rich asteroid in sector [3, 9]! Extracted rich Ignis-Coring ore from its heavy crystalline crust.",
        isCompleted: false,
        action: "Drill Rare Asteroid Core",
        requiresManual: true
      }
    ],
    ultimateRewardComponent: "drill_mk4"
  }
];

export const CANTINA_DRINKS: Drink[] = [
  {
    id: "neutron_ale",
    name: "Neutron Ale",
    cost: 50,
    description: "Brewed in microgravity. Sharp and energizing. Increases Weapons Specialist combat focus (+15% Damage for 5 sector jumps).",
    buffType: "damage",
    buffAmount: 0.15,
    durationJumps: 5
  },
  {
    id: "hyperdrive_tonic",
    name: "Hyperdrive Tonic",
    cost: 75,
    description: "Infused with synthetically purified tachyon particles. Boosts pilot reflex and warp calculations (+20% Evasion for 6 sector jumps).",
    buffType: "evasion",
    buffAmount: 0.20,
    durationJumps: 6
  },
  {
    id: "comet_nectar",
    name: "Comet Nectar",
    cost: 40,
    description: "Sweet water harvested from pristine deep-space comets. Revives weary miner reflexes (+25% Mining Yield efficiency for 8 sector jumps).",
    buffType: "mining",
    buffAmount: 0.25,
    durationJumps: 8
  },
  {
    id: "antimatter_brew",
    name: "Antimatter Brew",
    cost: 60,
    description: "A hyper-volatile, glowing compound. Temporarily enhances engine warp containment field (+15% FTL jump fuel savings for 4 sector jumps).",
    buffType: "fuel_discount",
    buffAmount: 0.15,
    durationJumps: 4
  },
  {
    id: "ion_shield_shake",
    name: "Ion Shield Shake",
    cost: 55,
    description: "Heavily carbonated mineral shake. Enhances system operator shield modulation (+20% Shield Capacity for 5 sector jumps).",
    buffType: "shields",
    buffAmount: 0.20,
    durationJumps: 5
  },
  {
    id: "sirius_solar_flare",
    name: "Sirius Solar Flare",
    cost: 120,
    description: "Exclusive to Sirius A. Radiates stellar dust. Drastically overcharges offensive lasers (+35% Damage for 8 sector jumps).",
    exclusiveToSystem: "Sirius A",
    buffType: "damage",
    buffAmount: 0.35,
    durationJumps: 8
  },
  {
    id: "proxima_crimson_sunset",
    name: "Proxima Crimson Sunset",
    cost: 100,
    description: "Exclusive to Proxima Centauri. Thick, dark liquid. Grants unmatched tactical evasive foresight (+30% Evasion for 10 sector jumps).",
    exclusiveToSystem: "Proxima Centauri",
    buffType: "evasion",
    buffAmount: 0.30,
    durationJumps: 10
  },
  {
    id: "tau_magnetic_spike",
    name: "Tau Magnetic Spike",
    cost: 110,
    description: "Exclusive to Tau Ceti. Intensely ionized. Amplifies mining scanners to pinpoint rich veins (+40% Mining Yield efficiency for 8 sector jumps).",
    exclusiveToSystem: "Tau Ceti",
    buffType: "mining",
    buffAmount: 0.40,
    durationJumps: 8
  },
  {
    id: "alpha_centauri_sling",
    name: "Alpha Centauri Sling",
    cost: 90,
    description: "Exclusive to Alpha Centauri. Smooth smuggler recipe. Increases sub-light hyperdrive efficiency (+25% FTL jump fuel savings for 7 sector jumps).",
    exclusiveToSystem: "Alpha Centauri",
    buffType: "fuel_discount",
    buffAmount: 0.25,
    durationJumps: 7
  }
];

export const BLUEPRINTS: BlueprintTemplate[] = [
  {
    id: "bp_pulse_laser_mk2",
    name: "Pulse Laser MK2 Blueprint",
    description: "Exotic optic focus. Upgrades dynamic thermal laser emitters.",
    resultType: "weapon",
    resultId: "pulse_laser_mk2",
    materials: [
      { type: "scrap", qty: 5 },
      { type: "superconductor", qty: 2 }
    ],
    fuelCost: 1.0,
    heatGenerated: 15
  },
  {
    id: "bp_pulse_laser_mk3",
    name: "Pulse Laser MK3 Blueprint",
    description: "Military optical array. Unleashes peak kinetic-shield melt.",
    resultType: "weapon",
    resultId: "pulse_laser_mk3",
    materials: [
      { type: "superconductor", qty: 4 },
      { type: "orichalcum", qty: 1 }
    ],
    fuelCost: 1.5,
    heatGenerated: 25
  },
  {
    id: "bp_torpedo_launcher_mk2",
    name: "HE Torpedo Tube MK2 Blueprint",
    description: "Magnetic projectile booster. Amplifies standard fusion launcher output.",
    resultType: "weapon",
    resultId: "torpedo_launcher_mk2",
    materials: [
      { type: "scrap", qty: 6 },
      { type: "superconductor", qty: 2 }
    ],
    fuelCost: 1.0,
    heatGenerated: 15
  },
  {
    id: "bp_torpedo_launcher_mk3",
    name: "HE Torpedo Tube MK3 Blueprint",
    description: "Heavy nuclear array. Demolishes heavy capital ship plating.",
    resultType: "weapon",
    resultId: "torpedo_launcher_mk3",
    materials: [
      { type: "orichalcum", qty: 2 },
      { type: "plasma_gas", qty: 3 }
    ],
    fuelCost: 2.0,
    heatGenerated: 30
  },
  {
    id: "bp_ion_blaster_mk2",
    name: "Heavy Ion Array MK2 Blueprint",
    description: "Tachyon grid disruptor. Locks hostile secondary batteries.",
    resultType: "weapon",
    resultId: "ion_blaster_mk2",
    materials: [
      { type: "superconductor", qty: 3 },
      { type: "heavy_water", qty: 2 }
    ],
    fuelCost: 1.2,
    heatGenerated: 20
  },
  {
    id: "bp_plasma_spike_mk2",
    name: "Plasma Thermal MK2 Blueprint",
    description: "Atomic beam focal assembly. Melts shields and armor evenly.",
    resultType: "weapon",
    resultId: "plasma_spike_mk2",
    materials: [
      { type: "plasma_gas", qty: 4 },
      { type: "superconductor", qty: 3 }
    ],
    fuelCost: 1.5,
    heatGenerated: 22
  },
  {
    id: "bp_shield_carbon",
    name: "Carbon Deflector Gen Blueprint",
    description: "Carbon mesh deflector layers. Adds +30 Maximum Shields.",
    resultType: "module",
    resultId: "shield_carbon",
    materials: [
      { type: "scrap", qty: 4 },
      { type: "ore", qty: 2 }
    ],
    fuelCost: 0.8,
    heatGenerated: 12
  },
  {
    id: "bp_shield_aegis",
    name: "Aegis Matrix Gen Blueprint",
    description: "Polarizing wave emitter. Adds +60 Maximum Shields.",
    resultType: "module",
    resultId: "shield_aegis",
    materials: [
      { type: "superconductor", qty: 2 },
      { type: "heavy_water", qty: 3 }
    ],
    fuelCost: 1.2,
    heatGenerated: 18
  },
  {
    id: "bp_shield_void",
    name: "Void-Shield Harmonizer Blueprint",
    description: "Cosmic void energy core. Adds +100 Maximum Shields.",
    resultType: "module",
    resultId: "shield_void",
    materials: [
      { type: "singularity_core", qty: 1 },
      { type: "heavy_water", qty: 5 }
    ],
    fuelCost: 2.5,
    heatGenerated: 35
  },
  {
    id: "bp_hull_reinforced",
    name: "Blast Alloy Plates Blueprint",
    description: "Composite alloy sheets. Adds +40 Maximum Hull Integrity.",
    resultType: "module",
    resultId: "hull_reinforced",
    materials: [
      { type: "scrap", qty: 8 },
      { type: "titanium_plates", qty: 3 }
    ],
    fuelCost: 0.8,
    heatGenerated: 15
  },
  {
    id: "bp_hull_nanite",
    name: "Nanite Self-Sealing Plates Blueprint",
    description: "Fusing metal armor matrix. Adds +80 Maximum Hull Integrity.",
    resultType: "module",
    resultId: "hull_nanite",
    materials: [
      { type: "nanobots", qty: 3 },
      { type: "titanium_plates", qty: 5 }
    ],
    fuelCost: 1.2,
    heatGenerated: 18
  },
  {
    id: "bp_hull_neutron",
    name: "Neutron Core Matrix Armor Blueprint",
    description: "Extreme density neutron star armor. Adds +150 Maximum Hull Integrity.",
    resultType: "module",
    resultId: "hull_neutron",
    materials: [
      { type: "neutronium", qty: 2 },
      { type: "titanium_plates", qty: 8 }
    ],
    fuelCost: 2.5,
    heatGenerated: 30
  },
  {
    id: "bp_engine_ion",
    name: "Ion Thruster Drive Blueprint",
    description: "Balanced plasma nozzle. Cuts FTL fuel consumption by 15%.",
    resultType: "module",
    resultId: "engine_ion",
    materials: [
      { type: "superconductor", qty: 2 },
      { type: "fuel", qty: 3 }
    ],
    fuelCost: 1.0,
    heatGenerated: 15
  },
  {
    id: "bp_engine_fusion",
    name: "Thermonuclear Core Drive Blueprint",
    description: "Heavy nuclear loop. Cuts FTL fuel consumption by 30%.",
    resultType: "module",
    resultId: "engine_fusion",
    materials: [
      { type: "helium_3", qty: 5 },
      { type: "heavy_water", qty: 4 }
    ],
    fuelCost: 1.5,
    heatGenerated: 20
  },
  {
    id: "bp_engine_singularity",
    name: "Singularity Fold Drive Blueprint",
    description: "Folds local space-time fabric. Cuts FTL fuel consumption by 50%.",
    resultType: "module",
    resultId: "engine_singularity",
    materials: [
      { type: "singularity_core", qty: 1 },
      { type: "antimatter_capsule", qty: 2 }
    ],
    fuelCost: 3.0,
    heatGenerated: 40
  },
  {
    id: "bp_spirit_neutron_ale",
    name: "Neutron Ale Blueprint",
    description: "Recipe for microgravity ale. Buffs weapons expert focus.",
    resultType: "spirit",
    resultId: "spirit_neutron_ale",
    materials: [
      { type: "hydroponics_fiber", qty: 3 },
      { type: "helium_3", qty: 1 }
    ],
    fuelCost: 0.5,
    heatGenerated: 8
  },
  {
    id: "bp_spirit_hyperdrive_tonic",
    name: "Hyperdrive Tonic Blueprint",
    description: "Recipe for tachyon energy tonic. Buffs pilot reflexes.",
    resultType: "spirit",
    resultId: "spirit_hyperdrive_tonic",
    materials: [
      { type: "hydroponics_fiber", qty: 2 },
      { type: "heavy_water", qty: 2 },
      { type: "noble_helium", qty: 1 }
    ],
    fuelCost: 0.8,
    heatGenerated: 10
  },
  {
    id: "bp_spirit_comet_nectar",
    name: "Comet Nectar Blueprint",
    description: "Recipe for comet-harvested nectar. Buffs miner efficiency.",
    resultType: "spirit",
    resultId: "spirit_comet_nectar",
    materials: [
      { type: "hydroponics_fiber", qty: 2 },
      { type: "heavy_water", qty: 3 }
    ],
    fuelCost: 0.5,
    heatGenerated: 5
  },
  {
    id: "bp_spirit_antimatter_brew",
    name: "Antimatter Brew Blueprint",
    description: "Recipe for volatile glowing brew. Buffs engine fuel savings.",
    resultType: "spirit",
    resultId: "spirit_antimatter_brew",
    materials: [
      { type: "antimatter_capsule", qty: 1 },
      { type: "hydroponics_fiber", qty: 2 }
    ],
    fuelCost: 1.0,
    heatGenerated: 12
  },
  {
    id: "bp_spirit_ion_shake",
    name: "Ion Shield Shake Blueprint",
    description: "Recipe for carbonated mineral shake. Buffs shield modulation.",
    resultType: "spirit",
    resultId: "spirit_ion_shake",
    materials: [
      { type: "hydroponics_fiber", qty: 3 },
      { type: "superconductor", qty: 1 }
    ],
    fuelCost: 0.6,
    heatGenerated: 8
  },
  {
    id: "bp_nanobots",
    name: "Nanobot Injector Blueprint",
    description: "Synthesizes automated mechanical repair injections.",
    resultType: "consumable",
    resultId: "nanobots",
    materials: [
      { type: "scrap", qty: 3 },
      { type: "superconductor", qty: 1 }
    ],
    fuelCost: 0.5,
    heatGenerated: 10
  },
  {
    id: "bp_shieldcore",
    name: "Shielding Harmonizer Blueprint",
    description: "Synthesizes tactical shield grid restoration batteries.",
    resultType: "consumable",
    resultId: "shieldcore",
    materials: [
      { type: "ore", qty: 2 },
      { type: "superconductor", qty: 1 }
    ],
    fuelCost: 0.5,
    heatGenerated: 8
  },
  {
    id: "bp_torpedo_proton",
    name: "Proton Torpedo Blueprint",
    description: "Refines heavy high-density fission warhead rockets.",
    resultType: "consumable",
    resultId: "torpedo_proton",
    materials: [
      { type: "torpedo", qty: 2 },
      { type: "helium_3", qty: 2 }
    ],
    fuelCost: 0.6,
    heatGenerated: 12
  },
  {
    id: "bp_torpedo_antimatter",
    name: "Anti-Matter Torpedo Blueprint",
    description: "Synthesizes devastating anti-matter annihilation warheads.",
    resultType: "consumable",
    resultId: "torpedo_antimatter",
    materials: [
      { type: "torpedo_proton", qty: 2 },
      { type: "antimatter_capsule", qty: 1 }
    ],
    fuelCost: 1.2,
    heatGenerated: 20
  }
];
