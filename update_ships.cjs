const fs = require('fs');

const data = JSON.parse(fs.readFileSync('public/data/ships.json', 'utf8'));

for (let key in data) {
  let ship = data[key];
  if (!ship.componentSlots) {
    if (ship.name.includes('rig') || ship.name.includes('Colossus') || ship.name.includes('Mining Super Rig')) {
      // already exists?
    } else if (ship.price > 10000) {
      ship.componentSlots = { shield: 3, hull: 3, engine: 3, scanner: 2, cargo: 4, mining: 2, heat: 2 };
    } else if (ship.price > 4000) {
      ship.componentSlots = { shield: 2, hull: 2, engine: 2, scanner: 1, cargo: 2, mining: 1, heat: 1 };
    } else {
      ship.componentSlots = { shield: 1, hull: 1, engine: 1, scanner: 1, cargo: 1, mining: 1, heat: 1 };
    }
  }
}

// Add Mining Super Rig
data['mining_super_rig'] = {
  "id": "mining_super_rig",
  "name": "Colossus Mining Super Rig",
  "price": 45000,
  "maxHull": 500,
  "maxShield": 400,
  "maxFuel": 200,
  "fuelConsumption": 4.0,
  "cargoSlots": 60,
  "hardpoints": 2,
  "componentSlots": {
    "shield": 4,
    "hull": 4,
    "engine": 2,
    "scanner": 2,
    "cargo": 6,
    "mining": 6,
    "heat": 2
  },
  "maxCrew": 8,
  "perk": "Industrial Behemoth: Massive mining capabilities and holds.",
  "techLevel": 8
};

fs.writeFileSync('public/data/ships.json', JSON.stringify(data, null, 2));

const consts = fs.readFileSync('src/constants.ts', 'utf8');
const newConsts = consts.replace(
  /interceptor: \{[^}]+\}/,
  `interceptor: ` + JSON.stringify(data.interceptor)
).replace(
  /starter_miner: \{[^}]+\}/,
  `starter_miner: ` + JSON.stringify(data.starter_miner)
).replace(
  /starter_patrol: \{[^}]+\}/,
  `starter_patrol: ` + JSON.stringify(data.starter_patrol)
).replace(
  /starter_explorer: \{[^}]+\}/,
  `starter_explorer: ` + JSON.stringify(data.starter_explorer)
);

// wait the regex for replace in constants is hard because of the nested brackets, just modify constants manually if needed.
