'use client';

import { useState, useEffect, useRef } from 'react';

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    opacity: number;
}

export default function CursorTrails() {
    const [particles, setParticles] = useState<Particle[]>([]);
    const requestRef = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const mouseRef = useRef({ x: 0, y: 0 });
    const lastPosRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('mousemove', handleMouseMove);

        const animate = () => {
            // Update existing particles
            particlesRef.current = particlesRef.current
                .map(p => ({
                    ...p,
                    y: p.y + 0.5, // Drift down slightly (smoke/exhaust)
                    opacity: p.opacity - 0.05, // Fade out
                    size: p.size - 0.1
                }))
                .filter(p => p.opacity > 0 && p.size > 0);

            // Add new particles if mouse moved enough
            const dx = mouseRef.current.x - lastPosRef.current.x;
            const dy = mouseRef.current.y - lastPosRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) { // Only spawn if moved
                // Offset for engines (behind the nose at 12,2)
                // Roughly 20px down, spaced 8px apart?
                // Left engine: x-6, y+20
                // Right engine: x+6, y+20

                const id = Date.now();
                const opacity = 0.8;

                // Left Engine
                particlesRef.current.push({
                    id: id,
                    x: mouseRef.current.x - 6,
                    y: mouseRef.current.y + 20,
                    size: 3 + Math.random() * 2,
                    opacity
                });

                // Right Engine
                particlesRef.current.push({
                    id: id + 1,
                    x: mouseRef.current.x + 6,
                    y: mouseRef.current.y + 20,
                    size: 3 + Math.random() * 2,
                    opacity
                });

                lastPosRef.current = { ...mouseRef.current };
            }

            setParticles([...particlesRef.current]);
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full bg-red-500 blur-[1px]"
                    style={{
                        left: p.x,
                        top: p.y,
                        width: p.size,
                        height: p.size,
                        opacity: p.opacity,
                        transform: 'translate(-50%, -50%)',
                        boxShadow: '0 0 4px #ff4444' // Glow
                    }}
                />
            ))}
        </div>
    );
}
