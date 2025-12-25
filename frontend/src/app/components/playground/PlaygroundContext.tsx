'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ToolType = 'none' | 'paintball' | 'hammer' | 'gravity' | 'sticker' | 'laser';

export type PlaygroundElement = {
  id: string;
  type: 'splat' | 'crack' | 'sticker';
  x: number;
  y: number;
  rotation: number;
  scale: number;
  content?: string; // URL for sticker or specific crack variant
  color?: string; // For splats
  createdAt: number;
};

interface PlaygroundContextType {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  elements: PlaygroundElement[];
  addElement: (el: Omit<PlaygroundElement, 'id' | 'createdAt'>) => void;
  clearElements: () => void;
}

const PlaygroundContext = createContext<PlaygroundContextType | undefined>(undefined);

export const PlaygroundProvider = ({ children }: { children: ReactNode }) => {
  const [activeTool, setActiveTool] = useState<ToolType>('none');
  const [elements, setElements] = useState<PlaygroundElement[]>([]);

  const addElement = (el: Omit<PlaygroundElement, 'id' | 'createdAt'>) => {
    const newElement = {
      ...el,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
    };
    
    // Performance limit: keep max 100 items
    setElements((prev) => [...prev.slice(-74), newElement]);
  };

  const clearElements = () => setElements([]);

  return (
    <PlaygroundContext.Provider value={{ activeTool, setActiveTool, elements, addElement, clearElements }}>
      {children}
    </PlaygroundContext.Provider>
  );
};

export const usePlayground = () => {
  const context = useContext(PlaygroundContext);
  if (!context) throw new Error('usePlayground must be used within PlaygroundProvider');
  return context;
};