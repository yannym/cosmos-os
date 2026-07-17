const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/data/components.json', 'utf8'));

// update mining targets
data.mining_standard.miningTarget = "ore";
data.mining_heavy.miningTarget = "ore";
data.mining_heavy.techLevel = 4;
data.mining_plasma.miningTarget = "ore";
data.mining_plasma.techLevel = 7;
data.mining_gas.miningTarget = "gas";
data.mining_gas.techLevel = 4;

// other techlevels
data.shield_carbon.techLevel = 2;
data.shield_aegis.techLevel = 4;
data.shield_void.techLevel = 7;

data.hull_reinforced.techLevel = 2;
data.hull_nanite.techLevel = 4;
data.hull_neutron.techLevel = 7;

data.engine_ion.techLevel = 2;
data.engine_fusion.techLevel = 4;
data.engine_singularity.techLevel = 7;

data.scanner_mk1.techLevel = 1;
data.scanner_mk2.techLevel = 2;
data.scanner_mk3.techLevel = 4;
data.scanner_mk4.techLevel = 7;
data.scanner_tachyon.techLevel = 2;
data.scanner_quantum.techLevel = 4;

data.cargo_compression.techLevel = 2;
data.cargo_dimensional.techLevel = 4;
data.cargo_pocket_void.techLevel = 7;

data.heat_core.techLevel = 4;

fs.writeFileSync('public/data/components.json', JSON.stringify(data, null, 2));
