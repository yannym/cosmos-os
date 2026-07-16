import React, { useState, useEffect } from "react";
import { AudioEngine } from "../audio";
import { Activity, X, HelpCircle, ArrowUp, ArrowDown } from "lucide-react";

interface MiningFrequencyMiniGameProps {
  onClose: (finalFrequency: number | null) => void;
  targetFrequency: number;
  initialFrequency: number;
}

export const MiningFrequencyMiniGame: React.FC<MiningFrequencyMiniGameProps> = ({ 
  onClose, 
  targetFrequency,
  initialFrequency
}) => {
  const [currentFrequency, setCurrentFrequency] = useState(initialFrequency || 65);
  const [time, setTime] = useState(0);

  // Animate the oscilloscope waveforms
  useEffect(() => {
    let animId: number;
    const tick = () => {
      setTime(t => (t + 0.1) % 100);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setCurrentFrequency(f => {
          const next = Math.min(90, f + 1);
          AudioEngine.playBeep(200 + next * 4, 0.02, "triangle");
          return next;
        });
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCurrentFrequency(f => {
          const next = Math.max(40, f - 1);
          AudioEngine.playBeep(200 + next * 4, 0.02, "triangle");
          return next;
        });
      }
      if (e.key === "Enter") {
        e.preventDefault();
        onClose(currentFrequency);
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onClose(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentFrequency, onClose]);

  const diff = Math.abs(currentFrequency - targetFrequency);
  const isPerfect = diff <= 4;
  const isDangerous = diff >= 20;

  // Generate SVG path for a sine wave
  const getSinePath = (freq: number, color: string, amplitude: number, phaseShift = 0) => {
    const points = [];
    const width = 400;
    const height = 120;
    const midY = height / 2;
    
    // Scale frequency for visualization
    const cycles = freq / 15;
    
    for (let x = 0; x <= width; x += 2) {
      const angle = (x / width) * cycles * Math.PI * 2 + phaseShift + time;
      const y = midY + Math.sin(angle) * amplitude;
      points.push(`${x},${y}`);
    }
    return `M ${points.join(" L ")}`;
  };

  // Interference path (the sum/resonance of both waves)
  const getResonancePath = () => {
    const points = [];
    const width = 400;
    const height = 120;
    const midY = height / 2;
    
    const cyclesTarget = targetFrequency / 15;
    const cyclesCurrent = currentFrequency / 15;
    
    for (let x = 0; x <= width; x += 2) {
      const angleTarget = (x / width) * cyclesTarget * Math.PI * 2 + time;
      const angleCurrent = (x / width) * cyclesCurrent * Math.PI * 2 + time;
      
      // If close to matching, the waves interfere constructively
      const yTarget = Math.sin(angleTarget) * 20;
      const yCurrent = Math.sin(angleCurrent) * 20;
      const y = midY + (yTarget + yCurrent);
      points.push(`${x},${y}`);
    }
    return `M ${points.join(" L ")}`;
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-mono select-none">
      <div className="border border-yellow-500/80 bg-neutral-950 w-full max-w-lg rounded shadow-[0_0_30px_rgba(234,179,8,0.15)] overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="bg-yellow-950/40 border-b border-yellow-500/40 px-4 py-2.5 flex justify-between items-center text-yellow-500 text-xs font-bold">
          <span className="flex items-center gap-1.5 animate-pulse">
            <Activity size={13} className="text-yellow-500 animate-spin" /> PRECISION CORE COUPLER
          </span>
          <button 
            onClick={() => onClose(null)}
            className="text-yellow-500 hover:text-white transition cursor-pointer"
            title="Close Tuner"
          >
            <X size={15} />
          </button>
        </div>

        {/* Oscilloscope Display */}
        <div className="p-4 bg-black border-b border-yellow-500/20 relative">
          <div className="absolute top-2 right-2 flex gap-2 text-[8px] font-bold">
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> TARGET CORE
            </span>
            <span className="flex items-center gap-1 text-yellow-400">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> DRILL BEAM
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> HARMONICS
            </span>
          </div>

          {/* CRT Screen Frame */}
          <div className="bg-neutral-950 border border-neutral-800 rounded relative overflow-hidden aspect-[4/3] flex items-center justify-center p-2">
            {/* Retro CRT grid effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.07] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] z-20" />
            
            {/* Oscilloscope lines SVG */}
            <svg viewBox="0 0 400 300" className="w-full h-full opacity-90 z-10">
              {/* Scope Grid Lines */}
              <defs>
                <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 30" fill="none" stroke="rgba(234,179,8,0.06)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              <line x1="0" y1="150" x2="400" y2="150" stroke="rgba(234,179,8,0.15)" strokeWidth="1" strokeDasharray="4,4" />
              <line x1="200" y1="0" x2="200" y2="300" stroke="rgba(234,179,8,0.15)" strokeWidth="1" strokeDasharray="4,4" />

              {/* Waveforms */}
              {/* Target Wave */}
              <path 
                d={getSinePath(targetFrequency, "#06b6d4", 25)} 
                fill="none" 
                stroke="#06b6d4" 
                strokeWidth="1.5" 
                className="opacity-60" 
              />
              
              {/* User Wave */}
              <path 
                d={getSinePath(currentFrequency, "#eab308", 25, Math.PI)} 
                fill="none" 
                stroke="#eab308" 
                strokeWidth="1.5" 
                className="opacity-60" 
              />

              {/* Combined Resonance Wave (shows coherence) */}
              <path 
                d={getResonancePath()} 
                fill="none" 
                stroke={isPerfect ? "#10b981" : isDangerous ? "#ef4444" : "#eab308"} 
                strokeWidth={isPerfect ? "2.5" : "1"} 
                className="transition-all duration-150"
              />
            </svg>

            {/* Perfect Alignment Flare overlay */}
            {isPerfect && (
              <div className="absolute inset-0 bg-emerald-500/5 animate-pulse flex items-center justify-center pointer-events-none z-10">
                <span className="text-emerald-500 text-[10px] uppercase font-bold tracking-widest bg-emerald-950/80 border border-emerald-500 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  HARMONIC RESONANCE LOCK
                </span>
              </div>
            )}
            
            {isDangerous && (
              <div className="absolute inset-0 bg-red-500/5 animate-pulse flex items-center justify-center pointer-events-none z-10">
                <span className="text-red-500 text-[10px] uppercase font-bold tracking-widest bg-red-950/80 border border-red-500 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                  TECTONIC RUNAWAY WARNING
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Control and feedback panel */}
        <div className="p-4 bg-neutral-900/90 flex flex-col space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="border border-cyan-500/30 bg-cyan-950/10 p-2.5 rounded">
              <span className="text-[10px] text-cyan-400 block uppercase font-bold tracking-wider mb-0.5">Target Resonance</span>
              <span className="text-xl font-bold font-mono text-cyan-300">{targetFrequency} Hz</span>
            </div>
            <div className={`border p-2.5 rounded transition ${
              isPerfect ? "border-emerald-500/40 bg-emerald-950/10 text-emerald-400" : 
              isDangerous ? "border-red-500/40 bg-red-950/10 text-red-400" : 
              "border-yellow-500/30 bg-yellow-950/10 text-yellow-400"
            }`}>
              <span className="text-[10px] block uppercase font-bold tracking-wider mb-0.5">Your Frequency</span>
              <span className="text-xl font-bold font-mono">{currentFrequency} Hz</span>
            </div>
          </div>

          <div className="bg-black/40 border border-neutral-800 p-3 rounded text-[11px] leading-relaxed text-neutral-400 text-center">
            <p className="flex items-center justify-center gap-1.5 text-neutral-300 font-bold mb-1">
              <HelpCircle size={12} className="text-yellow-500" /> TUNING MANUAL
            </p>
            Press <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-yellow-500 font-mono text-[10px] border border-neutral-700">Arrow Up</kbd> / <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-yellow-500 font-mono text-[10px] border border-neutral-700">Arrow Down</kbd> on your keyboard to tune. 
            Align your drill frequency within <span className="text-emerald-400 font-bold">±4 Hz</span> of the planetary core signature to trigger perfect resonance, unlocking <span className="text-emerald-400 font-bold">+50% mineral yields</span>!
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => onClose(null)}
              className="px-4 py-2 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 rounded text-xs transition font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => onClose(currentFrequency)}
              className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded text-xs transition shadow-lg shadow-yellow-500/10 cursor-pointer"
            >
              Lock Frequency [Enter]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
