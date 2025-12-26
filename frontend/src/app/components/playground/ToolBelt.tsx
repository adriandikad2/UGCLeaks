'use client';

import { usePlayground, ToolType } from './PlaygroundContext';
import { Crosshair, Hammer, CircleDashed, Sticker, Zap, Trash2, MousePointer2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ToolBelt() {
  const { activeTool, setActiveTool, clearElements } = usePlayground();

  const tools: { id: ToolType; icon: any; label: string; color: string }[] = [
    { id: 'none', icon: MousePointer2, label: 'Cursor', color: 'bg-gray-500' },
    { id: 'paintball', icon: Crosshair, label: 'Paintball', color: 'bg-pink-500' },
    { id: 'hammer', icon: Hammer, label: 'Smash', color: 'bg-blue-600' },
    { id: 'gravity', icon: CircleDashed, label: 'Gravity', color: 'bg-purple-600' },
    { id: 'sticker', icon: Sticker, label: 'Sticker', color: 'bg-yellow-500' },
    { id: 'laser', icon: Zap, label: 'Laser', color: 'bg-red-500' },
  ];

  return (
    <motion.div
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      className="fixed left-2 md:left-4 top-[48%] -translate-y-1/2 z-[60] flex flex-col gap-1.5 md:gap-3 p-2 md:p-3 bg-black/40 backdrop-blur-xl border border-white/30 rounded-xl md:rounded-2xl shadow-2xl"
    >
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          className={`relative p-2 md:p-3 rounded-lg md:rounded-xl transition-all duration-300 group ${activeTool === tool.id ? `${tool.color} text-white shadow-lg scale-110` : 'hover:bg-white/10 text-white/70'
            }`}
        >
          <tool.icon className="w-4 h-4 md:w-6 md:h-6" />
          {/* Tooltip */}
          <span className="absolute left-full ml-4 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {tool.label}
          </span>
          {activeTool === tool.id && (
            <motion.div
              layoutId="active-ring"
              className="absolute inset-0 rounded-lg md:rounded-xl border-2 border-white/50"
              transition={{ duration: 0.2 }}
            />
          )}
        </button>
      ))}

      <div className="h-px w-full bg-white/20 my-0.5 md:my-1" />

      <button
        onClick={clearElements}
        className="p-2 md:p-3 rounded-lg md:rounded-xl text-red-400 hover:bg-red-500/20 transition-all"
      >
        <Trash2 className="w-4 h-4 md:w-6 md:h-6" />
      </button>
    </motion.div>
  );
}