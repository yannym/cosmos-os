const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /setEquippedWeapons\(\(prev\) => \{\s+const next = \[\.\.\.prev\];\s+if \(next\.length > ship\.hardpoints\) \{\s+return next\.slice\(0, ship\.hardpoints\);\s+\}\s+while \(next\.length < ship\.hardpoints\) \{\s+next\.push\(null\);\s+\}\s+return next;\s+\}\);/;

const replacement = `setEquippedWeapons((prev) => {
      const next = [...prev];
      if (next.length > ship.hardpoints) {
        return next.slice(0, ship.hardpoints);
      }
      while (next.length < ship.hardpoints) {
        next.push(null);
      }
      return next;
    });

    setFittedComponents(prev => {
      const next = { ...prev };
      for (const cat of ["shield", "hull", "engine", "scanner", "cargo", "mining", "heat"]) {
        const allowedSlots = ship.componentSlots?.[cat as keyof typeof ship.componentSlots] || 1;
        const currentArr = next[cat] || [];
        
        if (currentArr.length > allowedSlots) {
           // Move overflow to inventory
           const overflow = currentArr.slice(allowedSlots);
           const legitOverflow = overflow.filter(id => !id.endsWith("_standard"));
           if (legitOverflow.length > 0) {
             setOwnedComponents(owned => [...owned, ...legitOverflow]);
           }
           next[cat] = currentArr.slice(0, allowedSlots);
        } else if (currentArr.length < allowedSlots) {
           const expanded = [...currentArr];
           while (expanded.length < allowedSlots) {
             expanded.push(\`\${cat}_standard\`);
           }
           next[cat] = expanded;
        }
      }
      return next;
    });`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
