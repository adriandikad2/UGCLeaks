'use client';

import { useEffect, useRef } from 'react';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  shape: 'square' | 'triangle' | 'circle';
};

export default function GravityParticles({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const requestRef = useRef<number>();

  // Init particles
  useEffect(() => {
    const colors = ['#FF006E', '#3A86FF', '#FFBE0B', '#8338EC'];
    particles.current = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 10 + 5,
      shape: Math.random() > 0.6 ? 'circle' : Math.random() > 0.3 ? 'square' : 'triangle'
    }));
  }, []);

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.current.forEach(p => {
      // Physics: Attraction to mouse
      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Gravity strength (inverse square law-ish, but capped)
      if (distance < 400 && distance > 10) {
        const force = 500 / (distance * distance); // Stronger when closer
        p.vx += (dx / distance) * force;
        p.vy += (dy / distance) * force;
      }

      // Friction
      p.vx *= 0.96;
      p.vy *= 0.96;

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Wall bounce
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      // Draw
      ctx.fillStyle = p.color;
      ctx.beginPath();
      if (p.shape === 'circle') {
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      } else if (p.shape === 'square') {
        ctx.rect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
      } else {
        ctx.moveTo(p.x, p.y - p.size);
        ctx.lineTo(p.x + p.size, p.y + p.size);
        ctx.lineTo(p.x - p.size, p.y + p.size);
      }
      ctx.fill();
    });

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [mouseX, mouseY]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />;
}