'use client';

import React, { useEffect, useState } from 'react';

interface Block {
  id: number;
  size: number;
  color: string;
  top: number;
  left: number;
  delay: number;
  duration: number;
  rotation: number;
}

const colors = [
  '#ff006e',
  '#00d9ff',
  '#ffbe0b',
  '#00ff41',
  '#b54eff',
  '#ff8c42',
  '#ff1744',
  '#2196f3',
];

export function FloatingBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    // Generate random blocks
    const generatedBlocks: Block[] = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      size: Math.random() * 60 + 30, // 30-90px
      color: colors[Math.floor(Math.random() * colors.length)],
      top: Math.random() * 80,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: Math.random() * 6 + 4, // 4-10s
      rotation: Math.random() * 360,
    }));
    setBlocks(generatedBlocks);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {blocks.map((block) => (
        <div
          key={block.id}
          className="absolute floating-block"
          style={{
            width: `${block.size}px`,
            height: `${block.size}px`,
            backgroundColor: block.color,
            top: `${block.top}%`,
            left: `${block.left}%`,
            borderRadius: '8px',
            opacity: 0.3,
            animationDelay: `${block.delay}s`,
            animationDuration: `${block.duration}s`,
            transform: `rotate(${block.rotation}deg)`,
            boxShadow: `0 0 30px ${block.color}80`,
          }}
        />
      ))}
    </div>
  );
}
