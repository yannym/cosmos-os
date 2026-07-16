import React, { useState } from "react";
import { Position, GalaxyCell, SectorShip, Beacon, BlueprintTemplate } from "../types";
import { ITEM_TEMPLATES, STAR_SYSTEMS_PROFILES, BLUEPRINTS } from "../constants";
import { AudioEngine } from "../audio";
import { Radio, Users, Shield, ArrowRight, DollarSign, HelpCircle, Map, ShoppingCart, UserPlus, LogOut, Flame, ShieldAlert, Zap, Cpu, Bell, Anchor } from "lucide-react";

interface SectorCommsPanelProps {
  sectorShips: SectorShip[];
  setSectorShips: React.Dispatch<React.SetStateAction<SectorShip[]>>;
  playerPosition: Position;
  currentSystemIndex: number;
  galaxy: GalaxyCell[][];
  setGalaxy: React.Dispatch<React.SetStateAction<GalaxyCell[][]>>;
  credits: number;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
  addTerminalLog: (text: string, type?: "info" | "success" | "danger" | "loot") => void;
  onTriggerAttack: (ship: SectorShip) => void;
  addCargoItem: (itemKey: string, qty: number) => boolean;
  removeCargoItem: (itemKey: string, qty: number) => boolean;
  cargo: any[];
  themeColor: "green" | "amber" | "cyan";
  droppedBeacons: Beacon[];
  setDroppedBeacons: React.Dispatch<React.SetStateAction<Beacon[]>>;
  localWaypoint: { x: number; y: number; name: string } | null;
  setLocalWaypoint: React.Dispatch<React.SetStateAction<{ x: number; y: number; name: string } | null>>;
  ownedBlueprints: string[];
  setOwnedBlueprints: React.Dispatch<React.SetStateAction<string[]>>;
}

export const SectorCommsPanel: React.FC<SectorCommsPanelProps> = ({
  sectorShips,
  setSectorShips,
  playerPosition,
  currentSystemIndex,
  galaxy,
  setGalaxy,
  credits,
  setCredits,
  addTerminalLog,
  onTriggerAttack,
  addCargoItem,
  removeCargoItem,
  cargo,
  themeColor,
  droppedBeacons,
  setDroppedBeacons,
  localWaypoint,
  setLocalWaypoint,
  ownedBlueprints,
  setOwnedBlueprints
}) => {
  const [activeTab, setActiveTab] = useState<"vicinity" | "friends" | "beacons">("vicinity");
  const [hailedShipId, setHailedShipId] = useState<string | null>(null);
  const [hailMode, setHailMode] = useState<"menu" | "trade">("menu");
  const [commsTradeTab, setCommsTradeTab] = useState<"buy" | "sell">("buy");
  const [conversationLog, setConversationLog] = useState<string[]>([]);
  const [hasGreeted, setHasGreeted] = useState<boolean>(false);

  const [blueprintForSale, setBlueprintForSale] = useState<BlueprintTemplate | null>(null);
  const [blueprintPrice, setBlueprintPrice] = useState<number>(0);

  // A helper to generate a highly unique speech accent / voice signature for each pilot
  const getPilotVoiceStyle = (ship: SectorShip) => {
    let hash = 0;
    const str = ship.id + ship.name;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idNum = Math.abs(hash);

    const ticks = [
      ", over.",
      ", copy that?",
      ", ye hear me?",
      ", clear and loud.",
      ", by the skies.",
      "... [static hiss] ...",
      ", stay safe out there.",
      ", kid.",
      ", mate.",
      ", comrade.",
      ", under the Void-Light.",
      ", for the Faction."
    ];
    const tick = ticks[idNum % ticks.length];

    const prefixes = [
      "[Sub-comms chirping] ",
      "[Holographic flicker] ",
      "[Synthesizer hum] ",
      "[Encrypted line established] ",
      "[Transponder beacon locked] "
    ];
    const prefix = prefixes[idNum % prefixes.length];

    let factionLingo = "";
    if (ship.faction.toLowerCase().includes("hegemony")) {
      factionLingo = "[MILITARY CODEX PROTOCOL] ";
    } else if (ship.faction.toLowerCase().includes("syndicate")) {
      factionLingo = "[OUTLAW BAND FREQUENCY] ";
    } else if (ship.faction.toLowerCase().includes("cult")) {
      factionLingo = "[VOID SACRAMENT TRANSVEC] ";
    } else {
      factionLingo = "[COMMERCIAL PORT-BRIDGE] ";
    }

    return { prefix, tick, factionLingo };
  };

  // Filter vicinity ships (must be in current system and current player x, y coordinates)
  const vicinityShips = sectorShips.filter(
    (ship) =>
      ship.systemIndex === currentSystemIndex &&
      ship.x === playerPosition.x &&
      ship.y === playerPosition.y
  );

  // Filter tracked friends
  const friendShips = sectorShips.filter((ship) => ship.isFriend);

  const hailedShip = sectorShips.find((s) => s.id === hailedShipId);

  // Color mappings based on themeColor
  const themeStyles = {
    green: {
      text: "text-green-400",
      border: "border-green-500/30",
      bg: "bg-green-950/10",
      accent: "text-green-300",
      button: "border-green-500/40 hover:bg-green-500/10 text-green-300",
      badge: "bg-green-950/50 text-green-400 border-green-500/20"
    },
    amber: {
      text: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-950/10",
      accent: "text-amber-300",
      button: "border-amber-500/40 hover:bg-amber-500/10 text-amber-300",
      badge: "bg-amber-950/50 text-amber-400 border-amber-500/20"
    },
    cyan: {
      text: "text-cyan-400",
      border: "border-cyan-500/30",
      bg: "bg-cyan-950/10",
      accent: "text-cyan-300",
      button: "border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-300",
      badge: "bg-cyan-950/50 text-cyan-400 border-cyan-500/20"
    }
  }[themeColor];

  // Helper to trigger a response dialogue based on personality and reputation
  const getInitialDialogue = (ship: SectorShip) => {
    const rep = ship.reputation;
    const isHostile = rep < 30;
    const { prefix, tick, factionLingo } = getPilotVoiceStyle(ship);

    let baseText = "";
    if (isHostile) {
      switch (ship.personality) {
        case "Patrol":
          baseText = `State your credentials immediately! Our scan arrays indicate you are operating on a flagged threat vector. Do not match airlocks`;
          break;
        case "Merchant":
          baseText = `I don't trust freelancers. We've charged our kinetic defense batteries. Speak quickly or clear out of our sector`;
          break;
        case "Outlaw":
          baseText = `Look what floated in. Your hyper-cores belong to us now! Hand over your cargo manifests or prepare for scrap metal`;
          break;
        default:
          baseText = `Target locks established. We have nothing to discuss. Clear the sector grid before we open fire`;
          break;
      }
    } else {
      // Friendly / Neutral dialogue
      switch (ship.personality) {
        case "Patrol":
          baseText = `Aegis Patrol vessel here. We are conducting sector scanning sweeps. Space lanes are safe. State your communication request, Captain`;
          break;
        case "Merchant":
          baseText = `Greetings, explorer! Consortium trade vessel matching transponder. We carry warp fuel cores, ore minerals, and biological packs. Care to trade cargo`;
          break;
        case "Miner":
          baseText = `Drilling rigs active on local asteroid grids! Just breaking heavy rocks here. Looking to buy extra provisions or unload raw ore`;
          break;
        case "Explorer":
          baseText = `Fascinating coordinates! Sub-space matrices show high energy fluctuations. Let's trade navigational databases or system chart telemetry`;
          break;
        case "Outlaw":
          baseText = `Keep your sub-engines cold, traveler. We aren't looking for a dogfight today, but we keep our lasers calibrated. Got any credits to share`;
          break;
        default:
          baseText = `Airlock link synchronized. Communications online. Safe traveling, captain`;
          break;
      }
    }

    return `${prefix}${factionLingo}"${baseText}${tick}"`;
  };

  const startHail = (ship: SectorShip) => {
    AudioEngine.playBeep(600, 0.25, "triangle");
    setHailedShipId(ship.id);
    setHailMode("menu");
    setHasGreeted(false);
    const welcomeText = `[COMMS LINK SECURED]: "${ship.name}" [${ship.shipClass}] connected at coordinate vectors.`;
    const initialMsg = `[TRANS]: "${getInitialDialogue(ship)}"`;
    setConversationLog([welcomeText, initialMsg]);

    // 5% chance of ship offering a random level item blueprint over comms channel
    if (Math.random() < 0.05) {
      const available = BLUEPRINTS.filter(bp => !ownedBlueprints.includes(bp.id));
      if (available.length > 0) {
        const bp = available[Math.floor(Math.random() * available.length)];
        setBlueprintForSale(bp);
        let cost = 1200;
        if (bp.resultType === "weapon") cost = 2400;
        else if (bp.resultType === "module") cost = 2800;
        else if (bp.resultType === "spirit") cost = 900;
        setBlueprintPrice(cost);
      } else {
        setBlueprintForSale(null);
      }
    } else {
      setBlueprintForSale(null);
    }

    // Small random attack chance if reputation is extremely low and they are hostile/outlaws
    if (ship.reputation < 30 && ship.personality === "Outlaw" && Math.random() < 0.4) {
      setTimeout(() => {
        addTerminalLog(`⚠️ ALERT: "${ship.name}" felt threatened by your approach and engaged weapon batteries!`, "danger");
        onTriggerAttack(ship);
        setHailedShipId(null);
      }, 2500);
    }
  };

  const handleBuyShipBlueprint = () => {
    if (!hailedShip || !blueprintForSale) return;
    if (credits < blueprintPrice) {
      addDialogueText("YOU", `"My balance reports insufficient credits for the file encryption key."`);
      return;
    }

    setCredits(prev => prev - blueprintPrice);
    setOwnedBlueprints(prev => [...prev, blueprintForSale.id]);

    addDialogueText("YOU", `"Payment authorized. Extracting decrypted schematic databurst for ${blueprintForSale.name}."`);
    const { prefix, tick } = getPilotVoiceStyle(hailedShip);
    const successMsg = `[TRANS]: ${prefix}"Transaction verified. Decrypted schematic for ${blueprintForSale.name} pushed to your local mainframe. Over${tick}"`;
    setConversationLog(prev => [...prev, successMsg]);

    addTerminalLog(`TRANSACTIONS: Purchased ${blueprintForSale.name} Decrypted Blueprint for ${blueprintPrice} CR over Comms.`, "loot");
    AudioEngine.playBeep(1100, 0.4, "sine");

    setBlueprintForSale(null);
  };

  const addDialogueText = (sender: string, text: string) => {
    setConversationLog((prev) => [...prev, `${sender}: ${text}`]);
  };

  const handleSayHello = () => {
    if (!hailedShip) return;
    AudioEngine.playBeep(750, 0.15, "sine");
    setHasGreeted(true);
    addDialogueText("YOU", `"Exchanging friendly transponder signals and comms handshakes."`);

    const isHostile = hailedShip.reputation < 30;
    let repGain = 0;
    let reply = "";

    if (isHostile) {
      reply = `"Your greetings won't save your skin. Stand clear or launch interceptors!"`;
    } else {
      repGain = Math.floor(Math.random() * 4) + 3; // +3 to +6 rep
      reply = `"Signal verified. Safe sailing in the void, Captain. May your fuel remain high."`;

      // Update individual ship rep and set hasHandshaked
      setSectorShips((prev) =>
        prev.map((s) =>
          s.id === hailedShip.id
            ? { ...s, reputation: Math.min(100, s.reputation + repGain), hasHandshaked: true }
            : s
        )
      );
      addTerminalLog(`[COMMS]: Exchanged greeting matrices with ${hailedShip.name}. Per-ship reputation improved by +${repGain}.`, "success");
    }

    setTimeout(() => {
      addDialogueText(hailedShip.name.toUpperCase(), reply);
    }, 600);
  };

  const handleInsultPilot = () => {
    if (!hailedShip) return;
    AudioEngine.playBeep(220, 0.3, "sawtooth");
    
    const insultPen = Math.floor(Math.random() * 10) + 15; // 15-25 points reputation penalty
    
    addDialogueText("YOU", `"Your vessel is an obsolete pile of space trash, and your captaincy is a galaxy-wide joke!"`);

    let reply = "";
    const { tick } = getPilotVoiceStyle(hailedShip);
    switch (hailedShip.personality) {
      case "Patrol":
        reply = `"This is a direct violation of communication protocols! Your threat profile has been updated on our tactical scanner arrays${tick}"`;
        break;
      case "Merchant":
        reply = `"Such unprovoked hostility! Our trade agreements are terminated. We are charging our engines to leave${tick}"`;
        break;
      case "Outlaw":
        reply = `"You've got a death wish, spacer! Say that again and we'll paint the asteroid belts with your remains${tick}"`;
        break;
      case "Miner":
        reply = `"Go suck on asteroid dust! We're busy doing real work, not listening to scrap-brained fools${tick}"`;
        break;
      case "Explorer":
        reply = `"Fascinating. An organic unit displaying severe linguistic degradation. Closing communication link${tick}"`;
        break;
      default:
        reply = `"Insults won't help you, captain. Disconnecting secure link${tick}"`;
        break;
    }

    setSectorShips((prev) =>
      prev.map((s) =>
        s.id === hailedShip.id
          ? { ...s, reputation: Math.max(0, s.reputation - insultPen) }
          : s
      )
    );

    addTerminalLog(`[COMMS INSULT]: You insulted ${hailedShip.name}. Ship reputation plummeted by -${insultPen}.`, "danger");

    setTimeout(() => {
      addDialogueText(hailedShip.name.toUpperCase(), reply);
    }, 600);
  };

  const handleTradeBeaconCoord = (beacon: Beacon) => {
    if (!hailedShip) return;
    AudioEngine.playBeep(900, 0.25, "sine");

    // Check if already shared
    const alreadyShared = beacon.tradedShipIds?.includes(hailedShip.id);
    if (alreadyShared) {
      addDialogueText("SYSTEM", `Telemetry Link: Coordinate data for ${beacon.name} has already been synchronized with this vessel.`);
      return;
    }

    // Add 300 credits & +8 reputation!
    setCredits(prev => prev + 300);
    setSectorShips(prev => 
      prev.map(s => s.id === hailedShip.id ? { ...s, reputation: Math.min(100, s.reputation + 8) } : s)
    );

    // Update beacon's tradedShipIds
    setDroppedBeacons(prev => 
      prev.map(b => b.id === beacon.id ? { ...b, tradedShipIds: [...(b.tradedShipIds || []), hailedShip.id] } : b)
    );

    addDialogueText("YOU", `"Transmitting high-fidelity orbital telemetry logs and coordinate charts for ${beacon.name} located at sector coordinates [X: ${beacon.x - 4}, Y: ${beacon.y - 4}]."`);

    let reply = "";
    const { tick } = getPilotVoiceStyle(hailedShip);
    switch (hailedShip.personality) {
      case "Patrol":
        reply = `"Excellent telemetry data, Captain. We will dispatch a scout ship to confirm these coordinate anomalies. Bounty logged${tick}"`;
        break;
      case "Merchant":
        reply = `"A fresh warp coordinate point! This will save our cargo haul routes hours of sub-light drift. Thank you${tick}"`;
        break;
      case "Miner":
        reply = `"Wait, is there asteroid activity near these coords? We might survey it for mineral nodes. Solid tip${tick}"`;
        break;
      case "Explorer":
        reply = `"Splendid! Actual field coordinate logs are the lifeblood of our galactic cartography drive. Transmitting credits${tick}"`;
        break;
      case "Outlaw":
        reply = `"A custom hiding spot? We'll make sure to scout it out or lay low there when the patrols come snooping${tick}"`;
        break;
      default:
        reply = `"Coordinates validated. Telemetry files added to our sub-space navigation decks. Credits transferred${tick}"`;
        break;
    }

    addTerminalLog(`[COORDS TRADED]: Successfully sold coordinates of ${beacon.name} to ${hailedShip.name} for +300 Credits and +8 Rep!`, "success");

    setTimeout(() => {
      addDialogueText(hailedShip.name.toUpperCase(), reply);
    }, 700);
  };

  const handleAskTip = () => {
    if (!hailedShip) return;
    AudioEngine.playBeep(850, 0.2, "sine");

    const cost = hailedShip.reputation >= 60 ? 0 : 150;
    if (credits < cost) {
      addDialogueText("SYSTEM", `Inquiry cancelled. Insufficient Credits ledger to cover tip trade (Requires: ${cost} Credits).`);
      return;
    }

    if (cost > 0) {
      setCredits((prev) => Math.max(0, prev - cost));
    }

    addDialogueText("YOU", `"Any navigational anomalies or coordinate sweeps worth looking at?"`);

    // Let's find an unexplored coordinate in this star system
    const coordinates: { x: number; y: number; content: string }[] = [];
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        const cell = galaxy[x]?.[y];
        if (cell && !cell.explored) {
          let desc = "unknown anomalies indications";
          if (cell.station) desc = `Station: ${cell.station.name}`;
          else if (cell.planet) desc = `Planet: ${cell.planet.name}`;
          else if (cell.anomaly) desc = `Unidentified Anomaly Signatures`;
          else if (cell.caravan) desc = `Active Trader Caravan`;
          else desc = `Unexplored Space debris`;

          coordinates.push({ x, y, content: desc });
        }
      }
    }

    let reply = "";
    if (coordinates.length > 0) {
      // Pick a random coordinates
      const tip = coordinates[Math.floor(Math.random() * coordinates.length)];
      
      // Explore it!
      const updatedGalaxy = [...galaxy];
      if (updatedGalaxy[tip.x]?.[tip.y]) {
        updatedGalaxy[tip.x][tip.y].explored = true;
        setGalaxy(updatedGalaxy);
      }

      reply = `"Our sector telemetry arrays swept coordinates [X: ${tip.x - 4}, Y: ${tip.y - 4}]. We found: ${tip.content}."`;
      addTerminalLog(`[NAV tip INFO]: Registered sector coordinates [X: ${tip.x - 4}, Y: ${tip.y - 4}] on your warp chart grids.`, "info");
    } else {
      reply = `"All local coordinate matrices seem thoroughly swept and mapped. No special coordinates to report."`;
    }

    setTimeout(() => {
      addDialogueText(hailedShip.name.toUpperCase(), reply);
    }, 700);
  };

  const handleBuyNavData = () => {
    if (!hailedShip) return;
    AudioEngine.playBeep(950, 0.3, "sine");

    const cost = 5800;
    if (credits < cost) {
      addDialogueText("SYSTEM", `Purchase failed. Insufficient credits for whole-system coordinate log synchronization.`);
      return;
    }

    setCredits((prev) => prev - cost);
    addDialogueText("YOU", `"I'll pay the ${cost} Credits. Synchronize our navigational log archives."`);

    // Map all cells in current system
    const updatedGalaxy = galaxy.map((row) =>
      row.map((cell) => ({
        ...cell,
        explored: true
      }))
    );
    setGalaxy(updatedGalaxy);

    const reply = `"Warp chart authorization cleared. Transmitting secure sector navigational telemetry. Happy exploring, Captain!"`;
    addTerminalLog(`[SYSTEM WIDE SCAN]: Map coordinates 100% unlocked for the current Star System!`, "success");

    setTimeout(() => {
      addDialogueText(hailedShip.name.toUpperCase(), reply);
    }, 600);
  };

  const handleBefriend = () => {
    if (!hailedShip) return;
    AudioEngine.playBeep(1100, 0.2, "sine");

    setSectorShips((prev) =>
      prev.map((s) => (s.id === hailedShip.id ? { ...s, isFriend: true } : s))
    );

    addDialogueText("YOU", `"Let's save transponder tracking codes to maintain secure sub-space comms across sectors."`);

    const reply = `"Handshake confirmed, captain. Your ship is registered on our allied friends list. We'll monitor each other's coordinates."`;
    addTerminalLog(`[FRIEND ACQUIRED]: ${hailedShip.name} added to your permanent sub-space friend trackers list!`, "success");

    setTimeout(() => {
      addDialogueText(hailedShip.name.toUpperCase(), reply);
    }, 600);
  };

  // Trade item actions
  const isRawMaterial = (key: string): boolean => {
    return ["ore", "scrap", "titanium_plates", "heavy_water", "helium_3", "hydroponics_fiber"].includes(key);
  };

  const getTradePrices = (ship: SectorShip, itemKey: string) => {
    const template = ITEM_TEMPLATES[itemKey];
    if (!template) return { buy: 0, sell: 0 };

    const baseVal = template.value;

    // System tech level influence (1 to 5)
    const sysProfile = STAR_SYSTEMS_PROFILES[currentSystemIndex];
    const techLevel = sysProfile?.techLevel || 3;

    let techMult = 1.0;
    if (isRawMaterial(itemKey)) {
      // Raw materials: tech level 1 -> 0.7x, tech level 5 -> 1.4x
      techMult = 0.7 + (techLevel - 1) * 0.175;
    } else {
      // Tech goods: tech level 1 -> 1.4x, tech level 5 -> 0.7x
      techMult = 1.4 - (techLevel - 1) * 0.175;
    }

    // Reputation impact
    // Allied (100) -> 30% discount on buy, 30% bonus on sell
    // Hostile (0) -> 80% markup on buy, 40% discount on sell
    const repInfluence = (ship.reputation - 50) / 100; // range: -0.5 to +0.5
    const buyFactor = 1.0 - repInfluence * 0.5;
    const sellFactor = 1.0 + repInfluence * 0.4;

    // Personality impact
    let modifier = 1.0;
    if (ship.personality === "Merchant") modifier = 0.9; // Merch buys/sells better
    if (ship.personality === "Outlaw") {
      if (itemKey === "contraband") modifier = 1.4; // Outlaws pay premium for contraband
      else modifier = 1.2; // premium on standard commodities
    }

    const finalBuy = Math.ceil(baseVal * techMult * buyFactor * modifier * 1.1);
    const finalSell = Math.max(1, Math.floor(baseVal * techMult * sellFactor / modifier * 0.9));

    return { buy: finalBuy, sell: finalSell };
  };

  const handleBuyItem = (itemKey: string) => {
    if (!hailedShip) return;

    const prices = getTradePrices(hailedShip, itemKey);
    if (credits < prices.buy) {
      addTerminalLog("TRANSACTION DENIED: Insufficient Credits to complete purchase.", "danger");
      return;
    }

    // Check ship has inventory
    const shipInvItem = hailedShip.inventory.find((i) => i.type === itemKey);
    const stock = shipInvItem ? (shipInvItem.quantity ?? shipInvItem.qty ?? 0) : 0;
    if (stock <= 0) {
      addTerminalLog(`TRANSACTION DENIED: ${hailedShip.name} does not have enough items in cargo.`, "danger");
      return;
    }

    // Add to player cargo
    const added = addCargoItem(itemKey, 1);
    if (!added) {
      addTerminalLog("TRANSACTION DENIED: Your ship's cargo bays are completely full!", "danger");
      return;
    }

    // Deduct credits and update ship inventory
    setCredits((prev) => Math.max(0, prev - prices.buy));
    setSectorShips((prev) =>
      prev.map((s) => {
        if (s.id === hailedShip.id) {
          const updatedInv = s.inventory.map((inv) =>
            inv.type === itemKey ? {
              ...inv,
              quantity: Math.max(0, (inv.quantity ?? inv.qty ?? 0) - 1),
              qty: Math.max(0, (inv.qty ?? inv.quantity ?? 0) - 1)
            } : inv
          );
          // Increase reputation slightly for trade
          return {
            ...s,
            inventory: updatedInv,
            reputation: Math.min(100, s.reputation + 1)
          };
        }
        return s;
      })
    );

    AudioEngine.playBeep(900, 0.1, "sine");
    addTerminalLog(`Bought 1x ${ITEM_TEMPLATES[itemKey].name} from ${hailedShip.name} for ${prices.buy} Credits.`, "loot");
  };

  const handleSellItem = (itemKey: string) => {
    if (!hailedShip) return;

    // Check player has item in cargo
    const playerHasItem = cargo.some((slot) => slot.type === itemKey && slot.qty > 0);
    if (!playerHasItem) {
      addTerminalLog("TRANSACTION DENIED: You do not have this commodity in cargo hold.", "danger");
      return;
    }

    const prices = getTradePrices(hailedShip, itemKey);

    // Remove from player cargo
    const removed = removeCargoItem(itemKey, 1);
    if (!removed) return;

    // Add credits and update ship inventory
    setCredits((prev) => prev + prices.sell);
    setSectorShips((prev) =>
      prev.map((s) => {
        if (s.id === hailedShip.id) {
          const exists = s.inventory.some((inv) => inv.type === itemKey);
          let updatedInv;
          if (exists) {
            updatedInv = s.inventory.map((inv) =>
              inv.type === itemKey ? {
                ...inv,
                quantity: (inv.quantity ?? inv.qty ?? 0) + 1,
                qty: (inv.qty ?? inv.quantity ?? 0) + 1
              } : inv
            );
          } else {
            updatedInv = [...s.inventory, { type: itemKey, qty: 1, quantity: 1, basePrice: ITEM_TEMPLATES[itemKey]?.value || 10 }];
          }
          // Increase reputation slightly for trade
          return {
            ...s,
            inventory: updatedInv,
            reputation: Math.min(100, s.reputation + 1)
          };
        }
        return s;
      })
    );

    AudioEngine.playBeep(1000, 0.1, "sine");
    addTerminalLog(`Sold 1x ${ITEM_TEMPLATES[itemKey].name} to ${hailedShip.name} for ${prices.sell} Credits.`, "success");
  };

  return (
    <div className={`flex flex-col h-full border ${themeStyles.border} rounded-lg p-3 bg-black/60`}>
      {/* Title Comms Receiver Header */}
      <div className="flex items-center justify-between border-b border-current/25 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio size={16} className={`${themeStyles.text} animate-pulse`} />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <span className="font-sans font-bold text-xs tracking-wider uppercase">
            Comms Array Vector
          </span>
        </div>

        {/* Tab Selection */}
        {!hailedShipId && (
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("vicinity")}
              className={`px-2 py-0.5 text-[9px] border rounded transition font-medium uppercase ${
                activeTab === "vicinity"
                  ? "bg-current text-black border-current"
                  : "border-current/30 hover:bg-current/10"
              }`}
            >
              Vicinity ({vicinityShips.length})
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={`px-2 py-0.5 text-[9px] border rounded transition font-medium uppercase ${
                activeTab === "friends"
                  ? "bg-current text-black border-current"
                  : "border-current/30 hover:bg-current/10"
              }`}
            >
              Friends ({friendShips.length})
            </button>
            <button
              onClick={() => setActiveTab("beacons")}
              className={`px-2 py-0.5 text-[9px] border rounded transition font-medium uppercase ${
                activeTab === "beacons"
                  ? "bg-current text-black border-current"
                  : "border-current/30 hover:bg-current/10"
              }`}
            >
              Beacons ({droppedBeacons.filter(b => b.systemIndex === currentSystemIndex).length})
            </button>
          </div>
        )}
      </div>

      {/* Hail Connection Modal Display */}
      {hailedShipId && hailedShip ? (
        <div className="flex-grow flex flex-col gap-3 min-h-[300px]">
          {/* Hailed Ship Stats header */}
          <div className="border border-current/25 rounded p-2 bg-black/50">
            <div className="flex justify-between items-start mb-1">
              <div>
                <h4 className="font-bold text-sm tracking-tight text-white flex items-center gap-1">
                  {hailedShip.name}
                </h4>
                <p className="text-[10px] opacity-75">
                  Class: <span className="font-semibold text-white">{hailedShip.shipClass}</span>
                </p>
                <p className="text-[10px] opacity-75">
                  Faction:{" "}
                  <span className="font-semibold text-white uppercase">{hailedShip.faction}</span>
                </p>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                hailedShip.personality === "Patrol" ? "bg-blue-950/70 text-blue-300 border border-blue-500/20" :
                hailedShip.personality === "Merchant" ? "bg-emerald-950/70 text-emerald-300 border border-emerald-500/20" :
                hailedShip.personality === "Outlaw" ? "bg-red-950/70 text-red-300 border border-red-500/20" :
                hailedShip.personality === "Miner" ? "bg-amber-950/70 text-amber-300 border border-amber-500/20" :
                "bg-purple-950/70 text-purple-300 border border-purple-500/20"
              }`}>
                {hailedShip.personality}
              </span>
            </div>

            {/* Ship Rep bar */}
            <div className="mt-2 pt-1 border-t border-current/10">
              <div className="flex justify-between text-[9px] mb-0.5">
                <span>Ship Reputation:</span>
                <span className="font-mono">
                  {hailedShip.reputation}% ({
                    hailedShip.reputation < 30 ? "Hostile" :
                    hailedShip.reputation < 50 ? "Neutral" :
                    hailedShip.reputation < 75 ? "Friendly" : "Allied"
                  })
                </span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    hailedShip.reputation < 30 ? "bg-red-500" :
                    hailedShip.reputation < 50 ? "bg-amber-500" :
                    hailedShip.reputation < 75 ? "bg-cyan-500" : "bg-emerald-500 animate-pulse"
                  }`}
                  style={{ width: `${hailedShip.reputation}%` }}
                ></div>
              </div>
            </div>
          </div>

          {hailMode === "menu" ? (
            <>
              {/* Comms Transmission Log Window */}
              <div className="flex-grow bg-black/80 border border-current/20 rounded p-2 text-[10.5px] font-mono overflow-y-auto max-h-[160px] flex flex-col gap-1">
                {conversationLog.map((log, i) => (
                  <p key={i} className={
                    log.startsWith("YOU:") ? "text-cyan-300" :
                    log.startsWith("[COMMS") ? "text-emerald-400 font-semibold" :
                    log.startsWith("[TRANS") ? "text-white italic" : "text-neutral-300"
                  }>
                    {log}
                  </p>
                ))}
              </div>

              {/* Player choices buttons options */}
              <div className="grid grid-cols-1 gap-1.5 mt-auto">
                {/* 1. Say hello */}
                <button
                  onClick={handleSayHello}
                  disabled={hasGreeted || hailedShip.hasHandshaked}
                  className={`px-3 py-1.5 border rounded text-[11px] font-sans font-medium text-left flex items-center justify-between transition ${
                    (hasGreeted || hailedShip.hasHandshaked)
                      ? "border-neutral-800 text-neutral-600 bg-neutral-950/20 cursor-not-allowed"
                      : "border-current/40 hover:bg-current/10 text-white cursor-pointer"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Radio size={11} /> 1. {hailedShip.hasHandshaked ? "Handshake Completed" : "Say Hello"}
                  </span>
                  <span className="text-[9px] opacity-60">{hailedShip.hasHandshaked ? "Once per Pilot" : "Handshake"}</span>
                </button>

                {/* 2. Ask for a tip */}
                <button
                  onClick={handleAskTip}
                  className="px-3 py-1.5 border border-current/40 hover:bg-current/10 text-white rounded text-[11px] font-sans font-medium text-left flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle size={11} /> 2. Ask for Sector Tip
                  </span>
                  <span className="text-[9px] opacity-60">
                    {hailedShip.reputation >= 60 ? "Free (Ally)" : "150 Credits"}
                  </span>
                </button>

                {/* 3. System nav log purchase */}
                <button
                  onClick={handleBuyNavData}
                  disabled={credits < 5800}
                  className={`px-3 py-1.5 border rounded text-[11px] font-sans font-medium text-left flex items-center justify-between transition ${
                    credits < 5800
                      ? "border-neutral-800 text-neutral-600 bg-neutral-950/20 cursor-not-allowed"
                      : "border-current/40 hover:bg-current/10 text-white cursor-pointer"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Map size={11} /> 3. Purchase Star Nav-Logs
                  </span>
                  <span className="text-[9px] font-mono">5,800 Credits</span>
                </button>

                {/* 4. Dock to trade */}
                <button
                  onClick={() => {
                    AudioEngine.playBeep(900, 0.2, "sine");
                    setHailMode("trade");
                  }}
                  className="px-3 py-1.5 border border-current/40 hover:bg-current/10 text-white rounded text-[11px] font-sans font-medium text-left flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <ShoppingCart size={11} /> 4. Dock to Trade Goods
                  </span>
                  <span className="text-[9px] opacity-60">Cargo & Fuel</span>
                </button>

                {/* 5. Befriend ship */}
                {!hailedShip.isFriend && (
                  <button
                    onClick={handleBefriend}
                    disabled={hailedShip.reputation < 65}
                    className={`px-3 py-1.5 border rounded text-[11px] font-sans font-medium text-left flex items-center justify-between transition ${
                      hailedShip.reputation < 65
                        ? "border-neutral-800 text-neutral-600 bg-neutral-950/20 cursor-not-allowed"
                        : "border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-300 cursor-pointer"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <UserPlus size={11} /> 5. Befriend & Save Tracking Code
                    </span>
                    <span className="text-[9px] opacity-60">Req: 65% Rep</span>
                  </button>
                )}

                {/* Rare Blueprint Option */}
                {blueprintForSale && (
                  <button
                    onClick={handleBuyShipBlueprint}
                    disabled={credits < blueprintPrice}
                    className={`px-3 py-1.5 border rounded text-[11px] font-sans font-medium text-left flex items-center justify-between transition ${
                      credits < blueprintPrice
                        ? "border-neutral-800 text-neutral-600 bg-neutral-950/20 cursor-not-allowed"
                        : "border-cyan-500/60 bg-cyan-950/10 hover:bg-cyan-500/25 text-cyan-300 cursor-pointer animate-pulse"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Cpu size={11} className="text-cyan-400" /> [RARE SPEC 5%] Buy Blueprint: {blueprintForSale.name}
                    </span>
                    <span className="text-[9px] font-mono text-cyan-400">{blueprintPrice} CR</span>
                  </button>
                )}

                {/* 6. Insult Pilot */}
                <button
                  onClick={handleInsultPilot}
                  className="px-3 py-1.5 border border-red-500/30 hover:bg-red-500/10 text-red-400 rounded text-[11px] font-sans font-medium text-left flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Flame size={11} className="text-red-500" /> 6. Insult Pilot
                  </span>
                  <span className="text-[9px] opacity-60">Lower Rep</span>
                </button>

                {/* 7. Flee / Disconnect */}
                <button
                  onClick={() => {
                    AudioEngine.playBeep(500, 0.1, "sine");
                    setHailedShipId(null);
                  }}
                  className="px-3 py-1.5 border border-red-500/30 hover:bg-red-500/10 text-red-400 rounded text-[11px] font-sans font-medium text-left flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <LogOut size={11} /> Close Comms Connection
                  </span>
                  <span className="text-[9px] opacity-60">Secure line</span>
                </button>
              </div>

              {/* Trade Custom Beacon Coordinates section */}
              {droppedBeacons.filter(b => b.isCustom).length > 0 && (
                <div className="border border-emerald-500/30 p-2 rounded bg-emerald-950/10 mt-2 space-y-1.5">
                  <div className="text-[9px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                    <Anchor size={10} className="animate-pulse" /> 📡 Sell Custom Beacon Telemetry
                  </div>
                  <div className="space-y-1 max-h-[85px] overflow-y-auto">
                    {droppedBeacons.filter(b => b.isCustom).map((beacon) => {
                      const alreadyShared = beacon.tradedShipIds?.includes(hailedShip.id);
                      return (
                        <div key={beacon.id} className="flex justify-between items-center text-[10px] bg-black/40 p-1 rounded border border-neutral-900 gap-1">
                          <span className="truncate max-w-[120px] text-white font-mono font-semibold">{beacon.name}</span>
                          <button
                            disabled={alreadyShared}
                            onClick={() => handleTradeBeaconCoord(beacon)}
                            className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase transition shrink-0 ${
                              alreadyShared
                                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                : "bg-emerald-900 hover:bg-emerald-500 hover:text-black text-emerald-300 cursor-pointer"
                            }`}
                          >
                            {alreadyShared ? "Shared" : "Sell (+300c)"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* COMMERCE TRADING SUB-INTERFACE */
            <div className="flex-grow flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                <span className="text-[11px] font-semibold text-neutral-400">Merchant Trade Portal</span>
                <button
                  onClick={() => {
                    AudioEngine.playBeep(650, 0.15, "triangle");
                    setHailMode("menu");
                  }}
                  className="text-[10px] hover:underline text-cyan-400 cursor-pointer"
                >
                  &lt; Back to Comms
                </button>
              </div>

              {/* BUY / SELL SUB-TABS */}
              <div className="flex border-b border-current/10 pb-1.5 gap-2 select-none text-[10px] font-bold">
                <button
                  onClick={() => {
                    AudioEngine.playBeep(450, 0.04);
                    setCommsTradeTab("buy");
                  }}
                  className={`px-3 py-1 border rounded cursor-pointer transition ${
                    commsTradeTab === "buy" ? "border-cyan-500 bg-cyan-950/20 text-cyan-400 font-bold" : "border-neutral-800 text-neutral-500 hover:text-neutral-400"
                  }`}
                >
                  BUY FROM SHIP
                </button>
                <button
                  onClick={() => {
                    AudioEngine.playBeep(450, 0.04);
                    setCommsTradeTab("sell");
                  }}
                  className={`px-3 py-1 border rounded cursor-pointer transition ${
                    commsTradeTab === "sell" ? "border-cyan-500 bg-cyan-950/20 text-cyan-400 font-bold" : "border-neutral-800 text-neutral-500 hover:text-neutral-400"
                  }`}
                >
                  SELL TO SHIP
                </button>
              </div>

              {/* Trade commodities list */}
              <div className="flex-grow flex flex-col gap-2 max-h-[220px] overflow-y-auto">
                {commsTradeTab === "buy" ? (
                  (() => {
                    const buyableItems = (hailedShip.inventory || []).filter(
                      (item) => (item.quantity ?? item.qty ?? 0) > 0
                    );
                    if (buyableItems.length === 0) {
                      return (
                        <p className="text-[10px] text-neutral-500 italic text-center py-4">
                          This ship has no goods available in cargo bay.
                        </p>
                      );
                    }
                    return buyableItems.map((item) => {
                      const itemKey = item.type;
                      const template = ITEM_TEMPLATES[itemKey];
                      if (!template) return null;

                      const prices = getTradePrices(hailedShip, itemKey);
                      const shipStock = item.quantity ?? item.qty ?? 0;
                      const playerStock = cargo.find((slot) => slot.type === itemKey)?.qty || 0;

                      return (
                        <div
                          key={itemKey}
                          className="border border-neutral-800 p-1.5 rounded bg-black/40 flex items-center justify-between gap-1.5 text-[10.5px]"
                        >
                          <div>
                            <span className={`font-semibold ${template.color}`}>
                              {template.name}
                            </span>
                            <div className="flex gap-2 text-[9px] opacity-60 mt-0.5">
                              <span>Ship holds: {shipStock}</span>
                              <span>In cargo: {playerStock}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleBuyItem(itemKey)}
                            disabled={shipStock <= 0 || credits < prices.buy}
                            className={`px-2 py-1 border rounded text-[10px] font-mono transition flex items-center gap-1.5 shrink-0 ${
                              shipStock <= 0 || credits < prices.buy
                                ? "border-neutral-900 text-neutral-700 cursor-not-allowed"
                                : "border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-300 cursor-pointer"
                            }`}
                          >
                            <span>BUY</span>
                            <span className="font-bold">{prices.buy}c</span>
                          </button>
                        </div>
                      );
                    });
                  })()
                ) : (
                  (() => {
                    const sellableItems = cargo.filter((slot) => slot.qty > 0);
                    if (sellableItems.length === 0) {
                      return (
                        <p className="text-[10px] text-neutral-500 italic text-center py-4">
                          Your cargo hold is completely empty.
                        </p>
                      );
                    }
                    return sellableItems.map((slot) => {
                      const itemKey = slot.type;
                      const template = ITEM_TEMPLATES[itemKey];
                      if (!template) return null;

                      const prices = getTradePrices(hailedShip, itemKey);
                      const shipInvItem = hailedShip.inventory.find((i) => i.type === itemKey);
                      const shipStock = shipInvItem ? (shipInvItem.quantity ?? shipInvItem.qty ?? 0) : 0;
                      const playerStock = slot.qty;

                      return (
                        <div
                          key={itemKey}
                          className="border border-neutral-800 p-1.5 rounded bg-black/40 flex items-center justify-between gap-1.5 text-[10.5px]"
                        >
                          <div>
                            <span className={`font-semibold ${template.color}`}>
                              {template.name}
                            </span>
                            <div className="flex gap-2 text-[9px] opacity-60 mt-0.5">
                              <span>In cargo: {playerStock}</span>
                              <span>Ship holds: {shipStock}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleSellItem(itemKey)}
                            disabled={playerStock <= 0}
                            className={`px-2 py-1 border rounded text-[10px] font-mono transition flex items-center gap-1.5 shrink-0 ${
                              playerStock <= 0
                                ? "border-neutral-900 text-neutral-700 cursor-not-allowed"
                                : "border-amber-500/40 hover:bg-amber-500/10 text-amber-300 cursor-pointer"
                            }`}
                          >
                            <span>SELL</span>
                            <span className="font-bold">{prices.sell}c</span>
                          </button>
                        </div>
                      );
                    });
                  })()
                )}
              </div>

              <div className="mt-auto border-t border-neutral-800 pt-2 flex justify-between text-[11px] font-mono bg-black/40 p-1.5 rounded">
                <span>YOUR BALANCE:</span>
                <span className="font-bold text-yellow-400">{credits.toLocaleString()} C</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* STANDARD VICINITY / FRIENDS / BEACONS LIST TAB VIEW */
        <div className="flex-grow flex flex-col overflow-y-auto max-h-[350px]">
          {activeTab === "vicinity" && (
            vicinityShips.length > 0 ? (
              <div className="flex flex-col gap-2">
                {vicinityShips.map((ship) => (
                  <div
                    key={ship.id}
                    className={`border border-current/15 rounded p-2 bg-black/40 hover:bg-black/60 transition flex flex-col gap-1.5`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-[11.5px] tracking-tight text-white">
                          {ship.name}
                        </h4>
                        <p className="text-[9px] opacity-70">
                          {ship.shipClass} • {ship.faction}
                        </p>
                        <p className="text-[9px] opacity-60">
                          Rep: {ship.reputation}% ({
                            ship.reputation < 30 ? "Hostile" :
                            ship.reputation < 50 ? "Neutral" :
                            ship.reputation < 75 ? "Friendly" : "Allied"
                          })
                        </p>
                      </div>
                      <span className={`text-[8px] px-1 py-0.5 rounded font-bold uppercase ${
                        ship.personality === "Patrol" ? "bg-blue-950/70 text-blue-300 border border-blue-500/20" :
                        ship.personality === "Merchant" ? "bg-emerald-950/70 text-emerald-300 border border-emerald-500/20" :
                        ship.personality === "Outlaw" ? "bg-red-950/70 text-red-300 border border-red-500/20" :
                        ship.personality === "Miner" ? "bg-amber-950/70 text-amber-300 border border-amber-500/20" :
                        "bg-purple-950/70 text-purple-300 border border-purple-500/20"
                      }`}>
                        {ship.personality}
                      </span>
                    </div>

                    <button
                      onClick={() => startHail(ship)}
                      className={`w-full py-1 mt-0.5 border text-center font-sans font-bold text-[10px] tracking-wider uppercase rounded transition ${
                        ship.reputation < 30 && ship.personality === "Outlaw"
                          ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
                          : themeStyles.button
                      }`}
                    >
                      [ Establish Hail Link ]
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center py-12 text-neutral-500">
                <Radio size={24} className="opacity-30 mb-2 animate-pulse" />
                <p className="text-[10.5px] font-mono uppercase tracking-wide px-4">
                  Scanner Silent. No other vessel transponders detected in local coordinate grid.
                </p>
              </div>
            )
          )}

          {activeTab === "friends" && (
            friendShips.length > 0 ? (
              <div className="flex flex-col gap-2">
                {friendShips.map((ship) => {
                  const sysName = STAR_SYSTEMS_PROFILES[ship.systemIndex]?.name || "Unknown Void";
                  const isHere =
                    ship.systemIndex === currentSystemIndex &&
                    ship.x === playerPosition.x &&
                    ship.y === playerPosition.y;

                  return (
                    <div
                      key={ship.id}
                      className="border border-emerald-500/25 rounded p-2 bg-emerald-950/5 flex flex-col gap-1 text-[11px]"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-[11.5px] text-white flex items-center gap-1">
                            {ship.name}
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          </h4>
                          <p className="text-[9px] opacity-70">
                            {ship.shipClass} • {ship.faction}
                          </p>
                        </div>
                        {isHere && (
                          <span className="text-[8px] bg-emerald-900/50 border border-emerald-500/30 text-emerald-400 px-1 rounded font-bold uppercase animate-pulse">
                            HERE
                          </span>
                        )}
                      </div>

                      {/* Current coordinates tracking */}
                      <div className="mt-1 pt-1 border-t border-emerald-500/10 flex items-center justify-between text-[9px] opacity-80">
                        <span>LATEST TRACKED VECTOR:</span>
                        <span className="font-mono text-emerald-300 font-bold">
                          {sysName} [{ship.x - 4}, {ship.y - 4}]
                        </span>
                      </div>

                      {isHere ? (
                        <button
                          onClick={() => startHail(ship)}
                          className="w-full py-1 mt-1 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 text-center font-sans font-bold text-[10px] tracking-wider uppercase rounded transition"
                        >
                          [ Hail Friend ]
                        </button>
                      ) : (
                        <div className="text-[8px] opacity-50 italic text-center mt-1">
                          OutOfRange: Distance exceeds short-range sector radio boards.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center py-12 text-neutral-500">
                <Users size={24} className="opacity-30 mb-2" />
                <p className="text-[10.5px] font-mono uppercase tracking-wide px-4">
                  Your secure friend transponder network list is currently empty.
                </p>
                <p className="text-[9px] opacity-60 mt-1 max-w-[180px] mx-auto">
                  Improve reputation with other ships to &ge;65% in active sectors to add them to your tracker.
                </p>
              </div>
            )
          )}

          {activeTab === "beacons" && (
            (() => {
              const systemBeacons = droppedBeacons.filter(b => b.systemIndex === currentSystemIndex);
              return systemBeacons.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {systemBeacons.map((beacon) => {
                    const isLocked = localWaypoint?.x === beacon.x && localWaypoint?.y === beacon.y;
                    const isPlayerHere = playerPosition.x === beacon.x && playerPosition.y === beacon.y;
                    return (
                      <div
                        key={beacon.id}
                        className={`border ${isLocked ? "border-emerald-500/50 bg-emerald-950/10" : "border-neutral-800 bg-neutral-950/20"} rounded p-2.5 flex flex-col gap-1.5`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-mono font-bold text-[11px] text-white flex items-center gap-1.5">
                              <Bell size={11} className={`${isLocked ? "text-emerald-400 animate-bounce" : "text-neutral-500"}`} />
                              {beacon.name}
                              {beacon.isCustom && (
                                <span className="text-[8px] px-1 bg-emerald-950/80 border border-emerald-500/20 text-emerald-400 rounded">CUSTOM</span>
                              )}
                            </h4>
                            <p className="text-[9px] text-neutral-400 mt-0.5">
                              Coordinate Vector: <strong className="text-white">[{beacon.x - 4}, {beacon.y - 4}]</strong>
                            </p>
                            <p className="text-[9px] text-neutral-500 font-mono">
                              Sub-space Freq: {beacon.frequency}
                            </p>
                          </div>
                          {isPlayerHere && (
                            <span className="text-[8px] bg-emerald-900/50 border border-emerald-500/30 text-emerald-400 px-1 rounded font-bold uppercase animate-pulse">
                              LOCAL RANGE
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 mt-1.5">
                          <button
                            onClick={() => {
                              AudioEngine.playBeep(isLocked ? 300 : 950, 0.15, "sine");
                              if (isLocked) {
                                setLocalWaypoint(null);
                                addTerminalLog(`WAYPOINT DISENGAGED: Cleared coordinates locking telemetry.`, "info");
                              } else {
                                setLocalWaypoint({ x: beacon.x, y: beacon.y, name: beacon.name });
                                addTerminalLog(`WAYPOINT LOCKED: Sector navigation computer focused on ${beacon.name} [X: ${beacon.x - 4}, Y: ${beacon.y - 4}].`, "success");
                              }
                            }}
                            className={`flex-1 py-1 text-center font-sans font-bold text-[9px] tracking-wider uppercase rounded transition cursor-pointer ${
                              isLocked
                                ? "bg-emerald-900/50 hover:bg-red-900 border border-emerald-500 text-white hover:border-red-500 hover:text-white"
                                : themeStyles.button
                            }`}
                          >
                            {isLocked ? "Locked 🎯 (Click to Clear)" : "Set Nav-Waypoint"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center py-12 text-neutral-500">
                  <Bell size={24} className="opacity-30 mb-2 animate-pulse" />
                  <p className="text-[10.5px] font-mono uppercase tracking-wide px-4">
                    No active navigational beacons detected on system scanners.
                  </p>
                  <p className="text-[9px] opacity-60 mt-1 max-w-[180px] mx-auto">
                    Buy Navigational Beacons at spaceport markets and drop them to tag interesting sector points!
                  </p>
                </div>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
};
