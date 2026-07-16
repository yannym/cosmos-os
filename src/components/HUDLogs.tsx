/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import { Terminal, ChevronRight, Eraser } from "lucide-react";
import { AudioEngine } from "../audio";

interface LogEntry {
  text: string;
  category: "normal" | "danger" | "success" | "info" | "loot";
}

interface ConsoleOption {
  label: string;
  icon?: string;
  onClick: () => void;
}

interface HUDLogsProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  options: ConsoleOption[];
  themeColor: "green" | "amber" | "cyan";
  onExecuteCommand?: (command: string) => void;
}

export const HUDLogs: React.FC<HUDLogsProps> = ({
  logs,
  onClearLogs,
  options,
  themeColor,
  onExecuteCommand
}) => {
  const feedEndRef = useRef<HTMLDivElement | null>(null);
  const [cmdInput, setCmdInput] = React.useState("");

  useEffect(() => {
    const container = document.getElementById("game-narrative-log");
    if (container) {
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 120;
      if (isAtBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [logs]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = cmdInput.trim();
    if (!trimmed) return;
    if (onExecuteCommand) {
      onExecuteCommand(trimmed);
    }
    setCmdInput("");
  };

  const getLogEntryClass = (category: string) => {
    switch (category) {
      case "danger": return "text-red-500 font-semibold";
      case "success": return "text-emerald-400 font-semibold";
      case "info": return "text-cyan-400";
      case "loot": return "text-yellow-500";
      default: return "text-current";
    }
  };

  const handleOptionClick = (option: ConsoleOption) => {
    AudioEngine.playBeep(500, 0.04);
    option.onClick();
  };

  const themeTextClass =
    themeColor === "green"
      ? "text-green-400"
      : themeColor === "amber"
      ? "text-amber-500"
      : "text-cyan-400";

  return (
    <div id="terminal-action-feed" className="fade-panel flex-grow flex flex-col font-mono p-1">
      {/* Narrative Logs Card */}
      <div className="flex-grow flex flex-col mb-4 border border-current/30 rounded p-3.5 bg-black/40 shadow-inner min-h-[250px] md:min-h-[350px]">
        <div className="flex justify-between items-center border-b border-current/10 pb-1.5 mb-2.5 select-none text-[10px] uppercase opacity-75">
          <span className="flex items-center gap-1.5">
            <Terminal size={12} className="animate-pulse" /> COMMAND LOG SYSTEM
          </span>
          <button
            onClick={() => {
              AudioEngine.playBeep(300, 0.08, "triangle");
              onClearLogs();
            }}
            className="flex items-center gap-1 hover:text-white transition duration-200 cursor-pointer"
          >
            <Eraser size={11} /> Clear Log
          </button>
        </div>

        <div
          id="game-narrative-log"
          className="flex-grow overflow-y-auto h-0 space-y-2 pr-1.5 scroll-smooth text-xs md:text-sm leading-relaxed"
        >
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <p key={index} className={getLogEntryClass(log.category)}>
                &gt; {log.text}
              </p>
            ))
          ) : (
            <p className="italic opacity-35 py-12 text-center text-xs">
              Waiting on terminal flight array signals... Complete sector scans or trigger warp jumps to log coordinates.
            </p>
          )}
          <div ref={feedEndRef} />
        </div>

        {/* Terminal Text Command Console */}
        <div className="mt-3 pt-2.5 border-t border-current/10 flex items-center gap-2 select-none">
          <span className="text-[10px] font-bold text-neutral-400 tracking-wider">COMMAND &gt;</span>
          <form onSubmit={handleCommandSubmit} className="flex-grow flex gap-2">
            <input
              type="text"
              value={cmdInput}
              onChange={(e) => setCmdInput(e.target.value)}
              placeholder="Type 'help' or 'cheat rich/kill/king'..."
              className="flex-grow bg-black/80 border border-current/30 text-xs px-2.5 py-1.5 rounded font-mono text-white focus:outline-none focus:border-current/70 placeholder-neutral-700 h-8"
            />
            <button
              type="submit"
              className="px-3 h-8 border border-current bg-current/10 hover:bg-current hover:text-black font-mono text-[10px] font-bold rounded transition uppercase tracking-widest cursor-pointer shrink-0"
            >
              [ RUN ]
            </button>
          </form>
        </div>
      </div>

      {/* Programmatic Choice Deck Action grid buttons */}
      <div
        id="interactive-console-options"
        className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-auto border-t border-current/20 pt-4"
      >
        {options.map((opt, idx) => (
          <button
            key={`${opt.label}-${idx}`}
            onClick={() => handleOptionClick(opt)}
            className="w-full py-3 px-4 border border-current bg-current/5 hover:bg-current/15 rounded text-left text-xs md:text-sm font-semibold flex items-center justify-between transition focus:outline-none focus:ring-1 focus:ring-current hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <span className="flex items-center gap-2">
              {opt.label}
            </span>
            <ChevronRight size={14} className="opacity-60 text-current" />
          </button>
        ))}
      </div>
    </div>
  );
};
