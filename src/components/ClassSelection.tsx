import React from "react";
import { Pickaxe, Shield, Compass } from "lucide-react";

interface ClassSelectionProps {
  onSelect: (starterClass: "Miner" | "Patrol" | "Explorer") => void;
}

export const ClassSelection: React.FC<ClassSelectionProps> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 font-mono text-neutral-200">
      <div className="max-w-4xl w-full border border-cyan-500/30 bg-black/90 p-8 rounded-lg space-y-8">
        <h2 className="text-2xl text-center text-cyan-400 font-bold uppercase tracking-widest">Select Your Starter Class</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => onSelect("Miner")}
            className="border border-neutral-700 p-6 rounded-lg hover:border-emerald-500 transition space-y-4 text-left"
          >
            <Pickaxe size={32} className="text-emerald-500" />
            <h3 className="text-lg font-bold text-emerald-400">Miner</h3>
            <p className="text-xs text-neutral-400">Mining focused. 3 Crew, 1 Weapon, 16 Cargo.</p>
          </button>
          <button 
            onClick={() => onSelect("Patrol")}
            className="border border-neutral-700 p-6 rounded-lg hover:border-cyan-500 transition space-y-4 text-left"
          >
            <Shield size={32} className="text-cyan-500" />
            <h3 className="text-lg font-bold text-cyan-400">Patrol</h3>
            <p className="text-xs text-neutral-400">Interceptor. 110 Hull, 90 Shield.</p>
          </button>
          <button 
            onClick={() => onSelect("Explorer")}
            className="border border-neutral-700 p-6 rounded-lg hover:border-amber-500 transition space-y-4 text-left"
          >
            <Compass size={32} className="text-amber-500" />
            <h3 className="text-lg font-bold text-amber-400">Explorer</h3>
            <p className="text-xs text-neutral-400">Explorer. 80 Fuel, 20 Cargo, 1 Weapon.</p>
          </button>
        </div>
      </div>
    </div>
  );
};
