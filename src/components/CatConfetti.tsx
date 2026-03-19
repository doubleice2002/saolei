import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

const CAT_EMOJIS = ['🐱', '😸', '😻', '😽', '😼', '🐾', '🐟'];

type CatParticle = {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  rotation: number;
};

export default function CatConfetti() {
  const [particles, setParticles] = useState<CatParticle[]>([]);

  useEffect(() => {
    // Generate random cat particles
    const newParticles: CatParticle[] = Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      emoji: CAT_EMOJIS[Math.floor(Math.random() * CAT_EMOJIS.length)],
      x: Math.random() * 100, // vw
      y: -20 - Math.random() * 50, // start above screen
      size: 20 + Math.random() * 40, // px
      duration: 3 + Math.random() * 4, // seconds
      delay: Math.random() * 2, // seconds
      rotation: -180 + Math.random() * 360, // degrees
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: `${p.x}vw`,
            y: `${p.y}vh`,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            y: '120vh',
            rotate: p.rotation,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'linear',
            repeat: Infinity,
          }}
          style={{
            position: 'absolute',
            fontSize: `${p.size}px`,
            lineHeight: 1,
          }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
}
