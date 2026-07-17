const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /setFittedComponents\(\{\s+shield: "shield_standard",\s+hull: "hull_standard",\s+engine: "engine_standard",\s+scanner: "scanner_standard",\s+cargo: "cargo_standard"\s+\}\);/,
  `setFittedComponents({
      shield: ["shield_standard"],
      hull: ["hull_standard"],
      engine: ["engine_standard"],
      scanner: ["scanner_standard"],
      cargo: ["cargo_standard"],
      mining: ["mining_standard"],
      heat: ["heat_core"]
    });`
);

code = code.replace(
  /function getCargoCapMultiplier\(\) \{\s+const shipSpecs = SHIPS_BLUEPRINTS\[activeShip\];\s+if \(!shipSpecs\) return 10;\s+const bonus = getFittedComponentBonus\("cargo"\);\s+return shipSpecs\.cargoSlots \+ bonus;\s+\}/,
  `function getCargoCapMultiplier() {
    const shipSpecs = SHIPS_BLUEPRINTS[activeShip];
    if (!shipSpecs) return 10;
    const bonus = getFittedComponentBonus("cargo");
    return shipSpecs.cargoSlots + bonus;
  }`
);

fs.writeFileSync('src/App.tsx', code);
