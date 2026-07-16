import { SectorShip } from "../types";

export function getInventoryForPersonality(personality: string) {
  const inv = [];
  if (personality === "Miner") {
    inv.push({ type: "ore", qty: Math.floor(Math.random() * 8) + 4, quantity: 0, basePrice: 35 });
    inv.push({ type: "fuel", qty: Math.floor(Math.random() * 5) + 2, quantity: 0, basePrice: 20 });
    inv.push({ type: "scrap", qty: Math.floor(Math.random() * 6) + 3, quantity: 0, basePrice: 10 });
  } else if (personality === "Merchant" || personality === "Explorer") {
    inv.push({ type: "food", qty: Math.floor(Math.random() * 8) + 3, quantity: 0, basePrice: 15 });
    inv.push({ type: "fuel", qty: Math.floor(Math.random() * 6) + 3, quantity: 0, basePrice: 20 });
    inv.push({ type: "shieldcore", qty: Math.floor(Math.random() * 4) + 1, quantity: 0, basePrice: 30 });
    inv.push({ type: "nanobots", qty: Math.floor(Math.random() * 3) + 1, quantity: 0, basePrice: 40 });
    if (Math.random() < 0.3) {
      inv.push({ type: "contraband", qty: Math.floor(Math.random() * 2) + 1, quantity: 0, basePrice: 120 });
    }
  } else if (personality === "Patrol") {
    inv.push({ type: "fuel", qty: Math.floor(Math.random() * 4) + 3, quantity: 0, basePrice: 20 });
    inv.push({ type: "torpedo", qty: Math.floor(Math.random() * 5) + 3, quantity: 0, basePrice: 25 });
  } else { // Outlaw
    inv.push({ type: "scrap", qty: Math.floor(Math.random() * 10) + 5, quantity: 0, basePrice: 10 });
    inv.push({ type: "contraband", qty: Math.floor(Math.random() * 3) + 1, quantity: 0, basePrice: 120 });
  }
  // Set quantity equal to qty
  return inv.map(i => {
    i.quantity = i.qty;
    return i;
  });
}

export function generateInitialSectorShips(): SectorShip[] {
  const firstNames = [
    "Titan", "Aegis", "Stardust", "Syndicate", "Consortium", "Nova", "Void", "Crimson", "Gilded", 
    "Solar", "Eclipse", "Horizon", "Hegemony", "Acheron", "Astral", "Sovereign", "Specter", "Vanguard", 
    "Nebula", "Rusty", "Dust", "Core", "Silent", "Hammerhead", "Star", "Deep", "Warp", "Astraea", 
    "Polaris", "Celestia", "Phoenix", "Infinity", "Goliath", "Shadow", "Stalker"
  ];
  const secondNames = [
    "Legacy", "Rover", "Sentinel", "Claw", "Venture", "Wanderer", "Seeker", "Blade", "Cargo", 
    "Wind", "Shadow", "Vanguard", "Guardian", "Ghost", "Horizon", "Light", "Runner", "Clipper", 
    "Rift", "Flare", "Shifter", "Miner", "Cruiser", "Stalker", "Enforcer", "Drifter", "Anchor", 
    "Pathfinder", "Falcon", "Grip", "Fury", "Bastion", "Voyager", "Vindicator", "Reaper"
  ];

  const shipClasses = [
    "Light Fighter", "Interceptor", "Heavy Patrol Frigate", "Bulk Armored Hauler", 
    "Mining Excavator Frigate", "Science Exploration Cruiser", "Tactical Destroyer", "Core Drill Frigate"
  ];
  const personalities: ("Merchant" | "Patrol" | "Outlaw" | "Miner" | "Explorer")[] = [
    "Merchant", "Patrol", "Outlaw", "Miner", "Explorer"
  ];
  const factions = ["Hegemony", "Syndicate", "Consortium", "Void Cult", "Independent"];

  const ships: SectorShip[] = [];

  for (let i = 0; i < 35; i++) {
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const sName = secondNames[Math.floor(Math.random() * secondNames.length)];
    const name = `${fName} ${sName}`;

    const personality = personalities[Math.floor(Math.random() * personalities.length)];
    const shipClass = shipClasses[Math.floor(Math.random() * shipClasses.length)];

    let faction = "Independent";
    if (personality === "Patrol") {
      faction = Math.random() < 0.6 ? "Hegemony" : "Consortium";
    } else if (personality === "Outlaw") {
      faction = Math.random() < 0.7 ? "Syndicate" : "Void Cult";
    } else {
      faction = factions[Math.floor(Math.random() * factions.length)];
    }

    const systemIndex = Math.floor(Math.random() * 15);
    const x = Math.floor(Math.random() * 10);
    const y = Math.floor(Math.random() * 10);

    ships.push({
      id: `sec_ship_${i}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name,
      shipClass,
      faction,
      reputation: 40 + Math.floor(Math.random() * 21), // Starts between 40 and 60 (neutral-ish)
      personality,
      systemIndex,
      x,
      y,
      isFriend: false,
      credits: Math.floor(Math.random() * 4000) + 1000,
      inventory: getInventoryForPersonality(personality)
    });
  }

  return ships;
}
