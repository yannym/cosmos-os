const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /if \(data\.fittedComponents !== undefined\) \{\s+const fc = data\.fittedComponents;\s+const normalized = \{\};\s+for \(const cat of \["shield", "hull", "engine", "scanner", "cargo", "mining", "heat"\]\) \{\s+if \(Array\.isArray\(fc\[cat\]\)\) \{\s+normalized\[cat\] = fc\[cat\];\s+\} else if \(typeof fc\[cat\] === "string"\) \{\s+normalized\[cat\] = \[fc\[cat\]\];\s+\} else \{\s+normalized\[cat\] = \[cat === "heat" \? "heat_core" : cat \+ "_standard"\];\s+\}\s+\}\s+setFittedComponents\(normalized\);\s+\}/;

const replacement = `if (data.fittedComponents !== undefined) {
      const fc = data.fittedComponents;
      const normalized = {};
      const shipSpecs = SHIPS_BLUEPRINTS[data.activeShip || "interceptor"] || SHIPS_BLUEPRINTS.interceptor;
      for (const cat of ["shield", "hull", "engine", "scanner", "cargo", "mining", "heat"]) {
        const maxSlots = shipSpecs.componentSlots?.[cat as keyof typeof shipSpecs.componentSlots] || 1;
        let arr = [];
        if (Array.isArray(fc[cat])) {
          arr = fc[cat];
        } else if (typeof fc[cat] === "string") {
          arr = [fc[cat]];
        } else {
          arr = [cat === "heat" ? "heat_core" : cat + "_standard"];
        }
        normalized[cat] = arr.slice(0, maxSlots);
      }
      setFittedComponents(normalized);
    }`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
