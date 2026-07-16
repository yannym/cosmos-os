import React, { useState } from "react";
import { CargoSlot, Caravan, GalaxyCell } from "../types";
import { ITEM_TEMPLATES } from "../constants";
import { Coins } from "lucide-react";
import { AudioEngine } from "../audio";

interface CaravanMarketProps {
  credits: number;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
  cargo: CargoSlot[];
  addCargoItem: (itemKey: string, qty?: number) => boolean;
  removeCargoItem: (itemKey: string, qty?: number) => boolean;
  activeSector: GalaxyCell | null;
  addTerminalLog: (msg: string, type?: "success" | "danger" | "info" | "loot" | "warning") => void;
  themeColor: "green" | "amber" | "cyan";
}

export const CaravanMarket: React.FC<CaravanMarketProps> = ({
  credits,
  setCredits,
  cargo,
  addCargoItem,
  removeCargoItem,
  activeSector,
  addTerminalLog,
  themeColor,
}) => {
  const caravan = activeSector?.caravan;
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [tradeQty, setTradeQty] = useState<number>(1);
  const [mode, setMode] = useState<"buy" | "sell">("buy");

  if (!caravan) return null;

  const handleBuy = () => {
    if (!selectedItemId) return;
    const item = caravan.inventory.find(i => i.type === selectedItemId);
    if (!item) return;
    const totalCost = item.price * tradeQty;

    if (credits < totalCost) {
      addTerminalLog("COMMERCE DECLINED: Insufficient credits.", "danger");
      AudioEngine.playUIError();
      return;
    }

    const success = addCargoItem(selectedItemId, tradeQty);
    if (success) {
      setCredits(c => c - totalCost);
      addTerminalLog(`Purchased ${tradeQty}x ${ITEM_TEMPLATES[selectedItemId]?.name || selectedItemId}.`, "success");
      AudioEngine.playResourcePickup();
      setTradeQty(1);
    } else {
      addTerminalLog("COMMERCE DECLINED: Cargo hold full.", "danger");
      AudioEngine.playUIError();
    }
  };

  const handleSell = () => {
    if (!selectedItemId) return;
    const qtyInCargo = cargo.reduce((sum, slot) => (slot.type === selectedItemId ? sum + slot.qty : sum), 0);
    if (qtyInCargo < tradeQty) return;

    const ok = removeCargoItem(selectedItemId, tradeQty);
    if (ok) {
      const payout = Math.round((ITEM_TEMPLATES[selectedItemId]?.value || 0) * 0.8) * tradeQty;
      setCredits(c => c + payout);
      addTerminalLog(`Sold ${tradeQty}x ${ITEM_TEMPLATES[selectedItemId]?.name || selectedItemId} for ${payout} credits.`, "loot");
      AudioEngine.playUIConfirm();

      const remaining = qtyInCargo - tradeQty;
      if (remaining <= 0) {
        setSelectedItemId(null);
      }
      setTradeQty(1);
    } else {
      addTerminalLog("COMMERCE DECLINED: Cargo transfer error.", "danger");
      AudioEngine.playUIError();
    }
  };

  return (
    <div className="fade-panel flex-grow flex flex-col font-mono p-4 border border-orange-500/30 rounded bg-black/80 shadow-lg">
      {/* Top Header & Credits ledger */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-orange-500/20 pb-3 mb-4 gap-2">
        <div>
          <h3 className="text-orange-400 font-bold uppercase text-sm tracking-wide">{caravan.name} ({caravan.faction})</h3>
          <p className="text-[9px] text-neutral-400 uppercase tracking-widest">INTERSTELLAR TRADE MANIFEST</p>
        </div>
        <div className="text-yellow-400 font-bold text-xs bg-yellow-950/30 border-2 border-yellow-500/40 px-3.5 py-2 rounded flex items-center gap-2 shadow-[0_0_8px_rgba(234,179,8,0.2)] animate-pulse">
          <Coins size={14} className="text-yellow-500" />
          <span className="tracking-wider uppercase text-[9px] opacity-75">STARSHIP BALANCE:</span>
          <span className="text-sm font-black font-mono">{credits.toLocaleString()} CR</span>
        </div>
      </div>

      <div className="flex border-b border-orange-500/10 pb-2 mb-3 gap-2 select-none text-[10px] font-bold">
        <button 
          onClick={() => { AudioEngine.playBeep(450, 0.04); setMode("buy"); setSelectedItemId(null); setTradeQty(1); }} 
          className={`px-4 py-1.5 border rounded cursor-pointer transition ${mode === "buy" ? "border-orange-500 bg-orange-950/20 text-orange-400" : "border-neutral-800 text-neutral-500 hover:text-neutral-400"}`}
        >
          BUY FROM CARAVAN
        </button>
        <button 
          onClick={() => { AudioEngine.playBeep(450, 0.04); setMode("sell"); setSelectedItemId(null); setTradeQty(1); }} 
          className={`px-4 py-1.5 border rounded cursor-pointer transition ${mode === "sell" ? "border-orange-500 bg-orange-950/20 text-orange-400" : "border-neutral-800 text-neutral-500 hover:text-neutral-400"}`}
        >
          SELL TO CARAVAN
        </button>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto p-1 bg-black/50 border border-orange-500/5 rounded">
        {mode === "buy" ? (
          caravan.inventory.map(item => {
            const template = ITEM_TEMPLATES[item.type];
            const isSelected = selectedItemId === item.type;
            return (
              <button 
                key={item.type} 
                onClick={() => { AudioEngine.playBeep(650, 0.04); setSelectedItemId(item.type); setTradeQty(1); }} 
                className={`border p-2 text-left rounded transition flex flex-col ${isSelected ? "border-orange-500 bg-orange-950/20" : "border-neutral-800 hover:border-orange-500/50 hover:bg-neutral-900/30"}`}
              >
                <span className="font-bold text-xs text-neutral-200">{template?.name || item.type}</span>
                <span className="text-[10px] text-yellow-500 font-bold mt-0.5">{item.price} CR</span>
              </button>
            );
          })
        ) : (
          cargo.map((slot, idx) => {
            const template = ITEM_TEMPLATES[slot.type];
            const isSelected = selectedItemId === slot.type;
            const sellPrice = Math.round((template?.value || 0) * 0.8);
            return (
              <button 
                key={idx} 
                onClick={() => { AudioEngine.playBeep(650, 0.04); setSelectedItemId(slot.type); setTradeQty(1); }} 
                className={`border p-2 text-left rounded transition flex flex-col ${isSelected ? "border-orange-500 bg-orange-950/20" : "border-neutral-800 hover:border-orange-500/50 hover:bg-neutral-900/30"}`}
              >
                <span className="font-bold text-xs text-neutral-200">{template?.name || slot.type} (x{slot.qty})</span>
                <span className="text-[10px] text-orange-400 font-bold mt-0.5">Est. Sell Price: {sellPrice} CR / ea</span>
              </button>
            );
          })
        )}

        {mode === "sell" && cargo.length === 0 && (
          <div className="col-span-2 py-8 text-center text-xs italic text-neutral-500">
            No items in your cargo hold to sell.
          </div>
        )}
      </div>

      {selectedItemId && (
        <div className="mt-4 pt-4 border-t border-orange-500/20 flex flex-col gap-3 animate-fade-in">
          <div className="flex justify-between items-center text-xs">
            <span>Item: <strong className="text-orange-400">{ITEM_TEMPLATES[selectedItemId]?.name || selectedItemId}</strong></span>
            <span>
              {mode === "buy" ? "Unit Buy Cost:" : "Unit Sell Value:"} <strong className="text-yellow-500">
                {mode === "buy" 
                  ? (caravan.inventory.find(i => i.type === selectedItemId)?.price || 0) 
                  : Math.round((ITEM_TEMPLATES[selectedItemId]?.value || 0) * 0.8)
                } CR
              </strong>
            </span>
          </div>
          
          <div className="flex gap-2 items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-neutral-400">Qty:</span>
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded p-0.5">
                <button 
                  onClick={() => { AudioEngine.playBeep(400, 0.05); setTradeQty(q => Math.max(1, q - 1)); }} 
                  className="px-2 py-0.5 text-xs hover:bg-neutral-800 rounded font-bold text-neutral-400"
                >
                  -
                </button>
                <span className="px-3 text-xs font-bold text-white font-mono">{tradeQty}</span>
                <button 
                  onClick={() => { 
                    AudioEngine.playBeep(400, 0.05); 
                    const maxLimit = mode === "sell" 
                      ? cargo.reduce((sum, slot) => (slot.type === selectedItemId ? sum + slot.qty : sum), 0)
                      : 50;
                    setTradeQty(q => Math.min(maxLimit, q + 1)); 
                  }} 
                  className="px-2 py-0.5 text-xs hover:bg-neutral-800 rounded font-bold text-neutral-400"
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="text-xs">
              {mode === "buy" ? "Total Price:" : "Total Payout proceeds:"} <strong className="text-yellow-500 font-mono">
                {((mode === "buy" 
                  ? (caravan.inventory.find(i => i.type === selectedItemId)?.price || 0) 
                  : Math.round((ITEM_TEMPLATES[selectedItemId]?.value || 0) * 0.8)
                ) * tradeQty).toLocaleString()} CR
              </strong>
            </div>
          </div>

          <button 
            onClick={mode === "buy" ? handleBuy : handleSell} 
            className="w-full bg-orange-500 hover:bg-orange-400 text-black py-2 font-bold uppercase transition text-xs rounded cursor-pointer"
          >
            {mode === "buy" ? "Execute Purchase Transaction" : "Execute Liquidation Sale"}
          </button>
        </div>
      )}
    </div>
  );
};
