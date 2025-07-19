import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Sparkles, Zap } from 'lucide-react';

interface TypewriterCodeProps {
  beforeCode: string;
  afterCode: string;
  language: string;
  speed?: number; // milliseconds per character
  pauseDuration?: number; // pause between before and after
  onComplete?: () => void;
}

const TypewriterCode = ({
  beforeCode,
  afterCode,
  language,
  speed = 50,
  pauseDuration = 1000,
  onComplete
}: TypewriterCodeProps) => {
  const [phase, setPhase] = useState<'typing-before' | 'transforming' | 'typing-after' | 'complete'>('typing-before');
  const [displayedBefore, setDisplayedBefore] = useState('');
  const [displayedAfter, setDisplayedAfter] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Main typing animation logic
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (phase === 'typing-before') {
      if (displayedBefore.length < beforeCode.length) {
        timeoutId = setTimeout(() => {
          setDisplayedBefore(beforeCode.slice(0, displayedBefore.length + 1));
        }, speed);
      } else {
        timeoutId = setTimeout(() => {
          setPhase('transforming');
        }, pauseDuration);
      }
    } else if (phase === 'transforming') {
      timeoutId = setTimeout(() => {
        setPhase('typing-after');
        setDisplayedBefore(''); // Clear before code
      }, 1500);
    } else if (phase === 'typing-after') {
      if (displayedAfter.length < afterCode.length) {
        timeoutId = setTimeout(() => {
          setDisplayedAfter(afterCode.slice(0, displayedAfter.length + 1));
        }, speed);
      } else {
        setPhase('complete');
        onComplete?.();
      }
    }

    return () => clearTimeout(timeoutId);
  }, [phase, displayedBefore, displayedAfter, beforeCode, afterCode, speed, pauseDuration, onComplete]);

  const getLanguageColor = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'javascript': return 'text-yellow-400';
      case 'typescript': return 'text-blue-400';
      case 'python': return 'text-green-400';
      case 'java': return 'text-orange-400';
      case 'cpp':
      case 'c++': return 'text-blue-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className={`text-sm font-mono ${getLanguageColor(language)}`}>
            {language}
          </span>
        </div>

        <AnimatePresence>
          {phase === 'transforming' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center space-x-2 text-primary-400"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-4 h-4" />
              </motion.div>
              <span className="text-sm font-medium">Transforming...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Code Content */}
      <div className="relative p-6 min-h-[200px] font-mono text-sm">
        <AnimatePresence mode="wait">
          {/* Before Code Phase */}
          {(phase === 'typing-before' || phase === 'transforming') && (
            <motion.div
              key="before"
              initial={{ opacity: 1 }}
              exit={{ 
                opacity: 0, 
                scale: 0.95,
                filter: 'blur(4px)'
              }}
              transition={{ duration: 0.8 }}
              className="absolute inset-6"
            >
              <div className="text-xs text-red-400 mb-2 flex items-center space-x-2">
                <span>❌ Before</span>
                {phase === 'transforming' && (
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-gray-500"
                  >
                    (analyzing issues...)
                  </motion.span>
                )}
              </div>
              <pre className="text-red-300 whitespace-pre-wrap">
                {displayedBefore}
                {phase === 'typing-before' && showCursor && (
                  <span className="bg-red-400 text-gray-900 animate-pulse">|</span>
                )}
              </pre>
            </motion.div>
          )}

          {/* Transformation Effect */}
          {phase === 'transforming' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 1.5 }}
                className="bg-primary-500/20 rounded-full p-8"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-12 h-12 text-primary-400" />
                </motion.div>
              </motion.div>

              {/* Magical particles */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-primary-400 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.1,
                    repeat: Infinity,
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* After Code Phase */}
          {(phase === 'typing-after' || phase === 'complete') && (
            <motion.div
              key="after"
              initial={{ 
                opacity: 0, 
                scale: 1.05,
                filter: 'blur(4px)'
              }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                filter: 'blur(0px)'
              }}
              transition={{ duration: 0.8 }}
              className="absolute inset-6"
            >
              <div className="text-xs text-green-400 mb-2 flex items-center space-x-2">
                <span>✅ After</span>
                {phase === 'complete' && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-green-400"
                  >
                    (clean & optimized!)
                  </motion.span>
                )}
              </div>
              <pre className="text-green-300 whitespace-pre-wrap">
                {displayedAfter}
                {phase === 'typing-after' && showCursor && (
                  <span className="bg-green-400 text-gray-900 animate-pulse">|</span>
                )}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion celebration */}
        <AnimatePresence>
          {phase === 'complete' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 right-4"
            >
              <div className="flex items-center space-x-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs">
                <Sparkles className="w-3 h-3" />
                <span>Transformation Complete!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TypewriterCode;