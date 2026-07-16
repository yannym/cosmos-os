import React from "react";
import { Skull, RefreshCw, LogOut } from "lucide-react";
import { motion } from "motion/react";

interface DeathScreenProps {
  reason: string;
  onLoadSave: () => void;
  onMainMenu: () => void;
  hasSave: boolean;
}

export const DeathScreen: React.FC<DeathScreenProps> = ({ reason, onLoadSave, onMainMenu, hasSave }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center font-mono p-6 text-red-500 overflow-hidden"
    >
      {/* Glitch Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-red-900/20 to-transparent" />
      
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="max-w-md w-full border-2 border-red-500 p-8 relative bg-black shadow-[0_0_50px_rgba(239,68,68,0.3)]"
      >
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black border-2 border-red-500 p-4 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.5)]">
          <Skull size={48} className="animate-pulse" />
        </div>

        <h1 className="text-4xl font-black text-center mb-2 tracking-[0.2em] mt-4 uppercase">Commander Lost</h1>
        <div className="h-0.5 w-full bg-red-500/30 mb-6" />
        
        <div className="space-y-4 mb-10 text-center">
          <p className="text-red-400/80 text-xs uppercase tracking-widest leading-relaxed">
            Your journey has ended in the cold vacuum of the void.
          </p>
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded">
            <span className="block text-[10px] opacity-50 uppercase mb-1">Final Log Entry:</span>
            <p className="text-sm font-bold italic tracking-tight italic">"{reason}"</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {hasSave ? (
            <button
              onClick={onLoadSave}
              className="group relative flex items-center justify-center gap-3 py-4 bg-red-500 text-black font-black uppercase tracking-widest hover:bg-red-400 transition-all active:scale-95 shadow-[0_4px_0_rgb(153,27,27)] hover:shadow-[0_2px_0_rgb(153,27,27)] hover:translate-y-[2px] active:translate-y-[4px] active:shadow-none"
            >
              <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
              Revert to Last Save
            </button>
          ) : (
            <div className="text-[10px] text-center opacity-40 uppercase mb-2">No recovery data found in sub-space storage.</div>
          )}
          
          <button
            onClick={onMainMenu}
            className="flex items-center justify-center gap-3 py-4 border-2 border-red-500/40 text-red-500/60 font-bold uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-all hover:bg-red-500/5"
          >
            <LogOut size={20} />
            Abandon Mission
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-red-500/10 text-[9px] text-center opacity-30 uppercase tracking-[0.3em]">
          End of transmission // Signal lost
        </div>
      </motion.div>

      {/* Scratches/Film Grain simulation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-0 left-[10%] w-[1px] h-full bg-white/20 animate-pulse" />
        <div className="absolute top-0 left-[85%] w-[1px] h-full bg-white/20 animate-pulse" />
      </div>
    </motion.div>
  );
};
