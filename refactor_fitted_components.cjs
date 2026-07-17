const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Change state definition
code = code.replace(
  /const \[fittedComponents, setFittedComponents\] = useState<Record<string, string>>\(\{([\s\S]*?)\}\);/,
  `const [fittedComponents, setFittedComponents] = useState<Record<string, string[]>>({\n    shield: ["shield_standard"],\n    hull: ["hull_standard"],\n    engine: ["engine_standard"],\n    scanner: ["scanner_standard"],\n    cargo: ["cargo_standard"],\n    mining: ["mining_standard"],\n    heat: ["heat_core"],\n  });`
);

// 2. getFittedComponentBonus - sum bonuses
code = code.replace(
  /function getFittedComponentBonus\(category: string\) \{\s+const fittedId = fittedComponents\[category\];\s+const details = COMPONENT_ITEMS\[fittedId\];\s+return details \? details\.bonus : 0;\s+\}/,
  `function getFittedComponentBonus(category: string) {
    const fittedIds = fittedComponents[category] || [];
    let total = 0;
    for (const id of fittedIds) {
      const details = COMPONENT_ITEMS[id];
      if (details) total += details.bonus;
    }
    return total;
  }`
);

// 3. getShieldRegenRate - sum bonuses
code = code.replace(
  /const shieldId = fittedComponents\.shield;\s+const shieldComponent = shieldId \? COMPONENT_ITEMS\[shieldId\] : undefined;\s+const bonus = shieldComponent \? shieldComponent\.bonus : 0;/,
  `const shieldIds = fittedComponents.shield || [];
    let bonus = 0;
    for (const id of shieldIds) {
      const comp = COMPONENT_ITEMS[id];
      if (comp) bonus += comp.bonus;
    }`
);

// 4. useEffect shield regen
code = code.replace(
  /const shieldId = fittedComponents\.shield;\s+const shieldComponent = shieldId \? COMPONENT_ITEMS\[shieldId\] : undefined;\s+const bonus = shieldComponent \? shieldComponent\.bonus : 0;/g,
  `const shieldIds = fittedComponents.shield || [];
    let bonus = 0;
    for (const id of shieldIds) {
      const comp = COMPONENT_ITEMS[id];
      if (comp) bonus += comp.bonus;
    }`
);

// 5. engine reliability
code = code.replace(
  /const engineId = fittedComponents\.engine \|\| "engine_standard";\s+let reliability = 50;\s+if \(engineId === "engine_ion"\) reliability = 70;\s+else if \(engineId === "engine_fusion"\) reliability = 85;\s+else if \(engineId === "engine_singularity"\) reliability = 99;/,
  `const engineIds = fittedComponents.engine || [];
    let maxReliability = 50;
    for (const engineId of engineIds) {
      let r = 50;
      if (engineId === "engine_ion") r = 70;
      else if (engineId === "engine_fusion") r = 85;
      else if (engineId === "engine_singularity") r = 99;
      if (r > maxReliability) maxReliability = r;
    }
    let reliability = maxReliability;`
);

// 6. engine fuel consumption (in triggerWarpJump)
code = code.replace(
  /const engineId = fittedComponents\.engine \|\| "engine_standard";\s+let reliability = 50;\s+let engineName = "Standard Warp Drive";\s+if \(engineId === "engine_ion"\) \{\s+reliability = 70;\s+engineName = "Ion Thruster Drive";\s+\}\s+else if \(engineId === "engine_fusion"\) \{\s+reliability = 85;\s+engineName = "Thermonuclear Core Drive";\s+\}\s+else if \(engineId === "engine_singularity"\) \{\s+reliability = 99;\s+engineName = "Singularity Fold Drive";\s+\}/,
  `const engineIds = fittedComponents.engine || [];
        let maxReliability = 50;
        let engineName = "Standard Warp Drive";
        for (const engineId of engineIds) {
          if (engineId === "engine_singularity") {
            maxReliability = 99;
            engineName = "Singularity Fold Drive";
          } else if (engineId === "engine_fusion" && maxReliability < 85) {
            maxReliability = 85;
            engineName = "Thermonuclear Core Drive";
          } else if (engineId === "engine_ion" && maxReliability < 70) {
            maxReliability = 70;
            engineName = "Ion Thruster Drive";
          }
        }
        let reliability = maxReliability;`
);


// 7. handleEjectHeatCore
code = code.replace(
  /if \(fittedComponents\.heat !== "heat_core"\)/,
  `if (!(fittedComponents.heat || []).includes("heat_core"))`
);
code = code.replace(
  /setFittedComponents\(\(prev\) => \(\{ \.\.\.prev, heat: "heat_standard" \}\)\);/,
  `setFittedComponents((prev) => {
      const next = { ...prev };
      const heatArray = next.heat || [];
      const idx = heatArray.indexOf("heat_core");
      if (idx !== -1) {
        heatArray[idx] = "heat_standard";
      }
      return next;
    });`
);

// 8. scanner in handleTerminalCommand
code = code.replace(
  /const scannerId = fittedComponents\.scanner \|\| "scanner_standard";\s+let maxYieldCap = 55;\s+if \(scannerId === "scanner_mk1"\) maxYieldCap = 65;\s+else if \(scannerId === "scanner_tachyon"\) maxYieldCap = 72;\s+else if \(scannerId === "scanner_mk2"\) maxYieldCap = 80;\s+else if \(scannerId === "scanner_quantum"\) maxYieldCap = 88;\s+else if \(scannerId === "scanner_mk3"\) maxYieldCap = 93;\s+else if \(scannerId === "scanner_mk4"\) maxYieldCap = 98;/,
  `const scannerIds = fittedComponents.scanner || [];
      let maxYieldCap = 55;
      for (const scannerId of scannerIds) {
        if (scannerId === "scanner_mk4" && maxYieldCap < 98) maxYieldCap = 98;
        else if (scannerId === "scanner_mk3" && maxYieldCap < 93) maxYieldCap = 93;
        else if (scannerId === "scanner_quantum" && maxYieldCap < 88) maxYieldCap = 88;
        else if (scannerId === "scanner_mk2" && maxYieldCap < 80) maxYieldCap = 80;
        else if (scannerId === "scanner_tachyon" && maxYieldCap < 72) maxYieldCap = 72;
        else if (scannerId === "scanner_mk1" && maxYieldCap < 65) maxYieldCap = 65;
      }`
);

// 9. mining startDrills
code = code.replace(
  /const drillId = fittedComponents\.mining \|\| "mining_standard";\s+const drillComponent = COMPONENT_ITEMS\[drillId\];\s+const hasTier2Drill = drillComponent \? \(drillComponent\.techLevel \|\| 1\) >= 4 : false;\s+const isGaseous = cell\.planet\.resourceNode\.isGaseous;\s+const canMineGas = drillComponent\?\.miningTarget === "gas" \|\| drillComponent\?\.miningTarget === "both";\s+const canMineOre = drillComponent\?\.miningTarget === "ore" \|\| drillComponent\?\.miningTarget === "both" \|\| !drillComponent\?\.miningTarget;/,
  `const drillIds = fittedComponents.mining || [];
    let hasTier2Drill = false;
    let canMineGas = false;
    let canMineOre = false;
    for (const dId of drillIds) {
      const drillComponent = COMPONENT_ITEMS[dId];
      if (drillComponent) {
        if ((drillComponent.techLevel || 1) >= 4) hasTier2Drill = true;
        const target = drillComponent.miningTarget;
        if (target) {
          if (target.includes("gas") || target.includes("both")) canMineGas = true;
          if (target.includes("ore") || target.includes("both")) canMineOre = true;
        } else {
          canMineOre = true;
        }
      }
    }
    const isGaseous = cell.planet.resourceNode.isGaseous;`
);

// 10. scanner quality
code = code.replace(
  /fittedComponents\.scanner === "scanner_mk4" \? 1\.0 :\s+fittedComponents\.scanner === "scanner_mk3" \? 0\.8 :\s+fittedComponents\.scanner === "scanner_mk2" \? 0\.6 :\s+fittedComponents\.scanner === "scanner_mk1" \? 0\.4 : 0\.2/g,
  `((fittedComponents.scanner || []).includes("scanner_mk4") ? 1.0 :
                  (fittedComponents.scanner || []).includes("scanner_mk3") ? 0.8 :
                  (fittedComponents.scanner || []).includes("scanner_mk2") ? 0.6 :
                  (fittedComponents.scanner || []).includes("scanner_mk1") ? 0.4 : 0.2)`
);

// 11. loading state
code = code.replace(
  /if \(data\.fittedComponents !== undefined\) \{\s+setFittedComponents\(\{\s+engine: "engine_standard",\s+scanner: "scanner_standard",\s+cargo: "cargo_standard",\s+mining: "mining_standard",\s+heat: "heat_core",\s+\.\.\.data\.fittedComponents\s+\}\);\s+\}/,
  `if (data.fittedComponents !== undefined) {
      const fc = data.fittedComponents;
      const normalized = {};
      for (const cat of ["shield", "hull", "engine", "scanner", "cargo", "mining", "heat"]) {
        if (Array.isArray(fc[cat])) {
          normalized[cat] = fc[cat];
        } else if (typeof fc[cat] === "string") {
          normalized[cat] = [fc[cat]];
        } else {
          normalized[cat] = [cat === "heat" ? "heat_core" : cat + "_standard"];
        }
      }
      setFittedComponents(normalized);
    }`
);


fs.writeFileSync('src/App.tsx', code);
