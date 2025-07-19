import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
  velocity: {
    x: number;
    y: number;
  };
}

interface ConfettiProps {
  count?: number;
  duration?: number;
  colors?: string[];
}

const ConfettiComponent = ({ 
  count = 100, 
  duration = 5000,
  colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899']
}: ConfettiProps) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    // Generate confetti pieces
    const pieces: ConfettiPiece[] = [];
    
    for (let i = 0; i < count; i++) {
      pieces.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10,
        rotation: Math.random() * 360,
        scale: Math.random() * 0.8 + 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as any,
        velocity: {
          x: (Math.random() - 0.5) * 8,
          y: Math.random() * 3 + 2
        }
      });
    }
    
    setConfetti(pieces);

    // Clean up after duration
    const cleanup = setTimeout(() => {
      setConfetti([]);
    }, duration);

    return () => clearTimeout(cleanup);
  }, [count, duration, colors]);

  const getShapeElement = (piece: ConfettiPiece) => {
    const size = 8 * piece.scale;
    
    switch (piece.shape) {
      case 'circle':
        return (
          <div
            className="rounded-full"
            style={{
              width: size,
              height: size,
              backgroundColor: piece.color,
            }}
          />
        );
      case 'square':
        return (
          <div
            style={{
              width: size,
              height: size,
              backgroundColor: piece.color,
            }}
          />
        );
      case 'triangle':
        return (
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: `${size / 2}px solid transparent`,
              borderRight: `${size / 2}px solid transparent`,
              borderBottom: `${size}px solid ${piece.color}`,
            }}
          />
        );
      default:
        return null;
    }
  };

  if (confetti.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute"
          initial={{
            x: piece.x,
            y: piece.y,
            rotate: piece.rotation,
            scale: piece.scale,
          }}
          animate={{
            x: piece.x + piece.velocity.x * 20,
            y: window.innerHeight + 100,
            rotate: piece.rotation + 720,
            scale: [piece.scale, piece.scale * 1.2, piece.scale * 0.8],
          }}
          transition={{
            duration: duration / 1000,
            ease: 'linear',
            scale: {
              duration: 1,
              repeat: Infinity,
              repeatType: 'reverse',
            },
          }}
        >
          {getShapeElement(piece)}
        </motion.div>
      ))}
    </div>
  );
};

// Preset confetti effects
export const SuccessConfetti = () => (
  <ConfettiComponent
    count={80}
    duration={4000}
    colors={['#10B981', '#34D399', '#6EE7B7', '#A7F3D0']}
  />
);

export const AchievementConfetti = () => (
  <ConfettiComponent
    count={120}
    duration={6000}
    colors={['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A']}
  />
);

export const LevelUpConfetti = () => (
  <ConfettiComponent
    count={150}
    duration={7000}
    colors={['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE']}
  />
);

export default ConfettiComponent;