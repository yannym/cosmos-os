const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

appCode = appCode.replace(
  /const handleEquipComponent = \(category: string, compId: string\) => \{\s+const nextFitted = \{ \.\.\.fittedComponents \};\s+const prevCompId = nextFitted\[category\];\s+nextFitted\[category\] = compId;\s+setFittedComponents\(nextFitted\);\s+if \(prevCompId && !prevCompId\.endsWith\("_standard"\)\) \{\s+setOwnedComponents\(\(prev\) => \[\.\.\.prev, prevCompId\]\);\s+\}\s+const nextOwned = \[\.\.\.ownedComponents\];\s+const idx = nextOwned\.indexOf\(compId\);\s+if \(idx !== -1\) \{\s+nextOwned\.splice\(idx, 1\);\s+setOwnedComponents\(nextOwned\);\s+\}\s+\};/,
  `const handleEquipComponent = (category: string, compId: string, slotIndex: number = 0) => {
    const nextFitted = { ...fittedComponents };
    if (!nextFitted[category]) nextFitted[category] = [];
    const prevCompId = nextFitted[category][slotIndex];

    nextFitted[category][slotIndex] = compId;
    setFittedComponents(nextFitted);

    if (prevCompId && !prevCompId.endsWith("_standard")) {
      setOwnedComponents((prev) => [...prev, prevCompId]);
    }

    const nextOwned = [...ownedComponents];
    const idx = nextOwned.indexOf(compId);
    if (idx !== -1) {
      nextOwned.splice(idx, 1);
      setOwnedComponents(nextOwned);
    }
  };`
);

appCode = appCode.replace(
  /const handleDismountComponent = \(category: string\) => \{\s+const existing = fittedComponents\[category\];\s+if \(!existing \|\| existing\.endsWith\("_standard"\)\) return;\s+const nextFitted = \{ \.\.\.fittedComponents \};\s+nextFitted\[category\] = \`\$\{category\}_standard\`;\s+setFittedComponents\(nextFitted\);\s+setOwnedComponents\(\(prev\) => \[\.\.\.prev, existing\]\);\s+\};/,
  `const handleDismountComponent = (category: string, slotIndex: number = 0) => {
    const arr = fittedComponents[category] || [];
    const existing = arr[slotIndex];
    if (!existing || existing.endsWith("_standard")) return;

    const nextFitted = { ...fittedComponents };
    nextFitted[category][slotIndex] = \`\$\{category\}_standard\`;
    setFittedComponents(nextFitted);

    setOwnedComponents((prev) => [...prev, existing]);
  };`
);

fs.writeFileSync('src/App.tsx', appCode);
