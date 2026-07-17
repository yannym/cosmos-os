const fs = require('fs');

let code = fs.readFileSync('src/components/EquipmentDeck.tsx', 'utf8');

// Replace Schematics matrix
const schematicsRegex = /\{\/\* Schematics matrix \*\/\}\s+<div className="flex-grow grid grid-cols-7 gap-2 justify-center items-center text-center my-6">\s+\{\["shield", "hull", "engine", "scanner", "cargo", "mining", "heat"\]\.map\(\(cat\) => \{[\s\S]*?\}\)\}\s+<\/div>/;

const newSchematics = `{/* Schematics matrix */}
              <div className="flex-grow flex flex-col justify-center gap-2 my-2 overflow-y-auto">
                {["shield", "hull", "engine", "scanner", "cargo", "mining", "heat"].map((cat) => {
                  const slotsCount = SHIPS_BLUEPRINTS[activeShipId]?.componentSlots?.[cat as keyof typeof SHIPS_BLUEPRINTS[string]['componentSlots']] || 1;
                  const fittedArr = fittedComponents[cat] || [];
                  return Array.from({ length: slotsCount }).map((_, slotIndex) => {
                    const fittedId = fittedArr[slotIndex] || \`\${cat}_standard\`;
                    const comp = COMPONENT_ITEMS[fittedId];
                    const rarityClass = getRarityStyleClass(comp ? comp.rarity : "common");
                    
                    let CatIcon = Shield;
                    if (cat === "engine") CatIcon = Rocket;
                    else if (cat === "hull") CatIcon = Wrench;
                    else if (cat === "scanner") CatIcon = Radar;
                    else if (cat === "cargo") CatIcon = Box;
                    else if (cat === "mining") CatIcon = Pickaxe;
                    else if (cat === "heat") CatIcon = Flame;

                    return (
                      <div key={\`\${cat}-\${slotIndex}\`} className="flex flex-col items-center justify-center p-2">
                        <CatIcon className={\`w-6 h-6 mb-1 \${rarityClass}\`} />
                        <div className="text-[10px] uppercase opacity-70 mb-1">{cat} Slot {slotIndex + 1}</div>
                        <div className={\`text-xs font-bold \${rarityClass}\`}>
                          {comp ? comp.name : "STOCK"}
                        </div>
                      </div>
                    );
                  });
                })}
              </div>`;
code = code.replace(schematicsRegex, newSchematics);


// Replace Module Upgrade slots
const moduleUpgradeRegex = /\{\/\* Module Upgrade slots \*\/\}\s+<div id="fitting-component-rack" className="w-full grid grid-cols-3 md:grid-cols-7 gap-1\.5 mt-auto">\s+\{\["shield", "hull", "engine", "scanner", "cargo", "mining", "heat"\]\.map\(\(cat\) => \{[\s\S]*?\}\)\}\s+<\/div>/;

const newModuleUpgrade = `{/* Module Upgrade slots */}
              <div id="fitting-component-rack" className="w-full flex flex-wrap gap-1.5 mt-auto max-h-48 overflow-y-auto">
                {["shield", "hull", "engine", "scanner", "cargo", "mining", "heat"].map((cat) => {
                  const slotsCount = SHIPS_BLUEPRINTS[activeShipId]?.componentSlots?.[cat as keyof typeof SHIPS_BLUEPRINTS[string]['componentSlots']] || 1;
                  const fittedArr = fittedComponents[cat] || [];
                  
                  return Array.from({ length: slotsCount }).map((_, slotIndex) => {
                    const fittedId = fittedArr[slotIndex] || \`\${cat}_standard\`;
                    const comp = COMPONENT_ITEMS[fittedId];
                    const isStock = fittedId.endsWith("_standard");

                    // Check if currently selected inventory component matches this category
                    const canEquipSelected =
                      selectedInventoryComponentIndex !== null &&
                      COMPONENT_ITEMS[ownedComponents[selectedInventoryComponentIndex]]?.category === cat;

                    return (
                      <button
                        key={\`\${cat}-\${slotIndex}\`}
                        id={\`upgrade-category-\${cat}-\${slotIndex}\`}
                        onClick={() => {
                          if (canEquipSelected && selectedInventoryComponentIndex !== null) {
                            AudioEngine.playBeep(850, 0.15, "sine");
                            handleEquipComponentClick(cat, ownedComponents[selectedInventoryComponentIndex], slotIndex);
                          } else if (!isStock) {
                            AudioEngine.playBeep(400, 0.1, "triangle");
                            handleDismountComponentClick(cat, slotIndex);
                          }
                        }}
                        className={\`flex-grow min-w-[100px] p-2 border text-[10px] rounded text-center transition flex flex-col justify-center items-center gap-0.5 \${
                          canEquipSelected
                            ? "border-yellow-400 text-yellow-300 bg-yellow-500/10 animate-pulse font-bold"
                            : isStock
                            ? "border-current/20 opacity-60 bg-black/20 cursor-default"
                            : "border-current hover:bg-red-500/10 hover:border-red-500 hover:text-red-400"
                        }\`}
                      >
                        <div className="uppercase font-bold tracking-widest opacity-80 border-b border-current/20 pb-0.5 w-full">
                          {cat} {slotIndex + 1}
                        </div>
                        <div className="pt-1">
                          {comp ? (
                            <span className={getRarityStyleClass(comp.rarity)}>{comp.name}</span>
                          ) : (
                            "EMPTY"
                          )}
                        </div>
                      </button>
                    );
                  });
                })}
              </div>`;
code = code.replace(moduleUpgradeRegex, newModuleUpgrade);

// Update click handlers
code = code.replace(
  /const handleEquipComponentClick = \(category: string, compId: string\) => \{/,
  `const handleEquipComponentClick = (category: string, compId: string, slotIndex: number) => {`
);
code = code.replace(
  /onEquipComponent\(category, compId\);/,
  `onEquipComponent(category, compId, slotIndex);`
);

code = code.replace(
  /const handleDismountComponentClick = \(category: string\) => \{/,
  `const handleDismountComponentClick = (category: string, slotIndex: number) => {`
);
code = code.replace(
  /onDismountComponent\(category\);/,
  `onDismountComponent(category, slotIndex);`
);

fs.writeFileSync('src/components/EquipmentDeck.tsx', code);
