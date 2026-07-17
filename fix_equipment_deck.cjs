const fs = require('fs');

let code = fs.readFileSync('src/components/EquipmentDeck.tsx', 'utf8');

code = code.replace(
  /fittedComponents: Record<string, string>;/,
  `fittedComponents: Record<string, string[]>;`
);

code = code.replace(
  /onEquipComponent: \(category: string, compId: string\) => void;/,
  `onEquipComponent: (category: string, compId: string, slotIndex?: number) => void;`
);

code = code.replace(
  /onDismountComponent: \(category: string\) => void;/,
  `onDismountComponent: (category: string, slotIndex?: number) => void;`
);

fs.writeFileSync('src/components/EquipmentDeck.tsx', code);
