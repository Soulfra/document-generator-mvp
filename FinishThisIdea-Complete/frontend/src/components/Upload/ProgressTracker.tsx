import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Search, Wand2, Download, Check, Clock, Zap } from 'lucide-react';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  estimatedTime: number; // in seconds
  status: 'pending' | 'active' | 'completed';
}

interface ProgressTrackerProps {
  isActive: boolean;
  onComplete?: () => void;
}

const initialSteps: ProgressStep[] = [
  {
    id: 'upload',
    title: 'Analyzing Upload',
    description: 'Scanning your codebase structure and file types',
    icon: Upload,
    estimatedTime: 5,
    status: 'pending'
  },
  {
    id: 'scan',
    title: 'Deep Code Analysis',
    description: 'Identifying issues, dead code, and optimization opportunities',
    icon: Search,
    estimatedTime: 15,
    status: 'pending'
  },
  {
    id: 'clean',
    title: 'AI Transformation',
    description: 'Applying style rules, removing dead code, and reorganizing',
    icon: Wand2,
    estimatedTime: 20,
    status: 'pending'
  },
  {
    id: 'finalize',
    title: 'Preparing Download',
    description: 'Packaging your cleaned codebase with detailed reports',
    icon: Download,
    estimatedTime: 5,
    status: 'pending'
  }
];

const ProgressTracker = ({ isActive, onComplete }: ProgressTrackerProps) => {
  const [steps, setSteps] = useState<ProgressStep[]>(initialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [totalEstimatedTime] = useState(initialSteps.reduce((sum, step) => sum + step.estimatedTime, 0));

  useEffect(() => {
    if (!isActive) {
      setSteps(initialSteps);
      setCurrentStepIndex(0);
      setTimeElapsed(0);
      return;
    }

    const progressInterval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
      
      setSteps(prevSteps => {
        const newSteps = [...prevSteps];
        const currentStep = newSteps[currentStepIndex];
        
        if (currentStep && currentStep.status === 'pending') {
          newSteps[currentStepIndex] = { ...currentStep, status: 'active' };
        }
        
        return newSteps;
      });
    }, 1000);

    const stepInterval = setInterval(() => {
      setCurrentStepIndex(prevIndex => {
        if (prevIndex < steps.length - 1) {
          setSteps(prevSteps => {
            const newSteps = [...prevSteps];
            newSteps[prevIndex] = { ...newSteps[prevIndex], status: 'completed' };
            return newSteps;
          });
          return prevIndex + 1;
        } else {
          setSteps(prevSteps => {
            const newSteps = [...prevSteps];
            newSteps[prevIndex] = { ...newSteps[prevIndex], status: 'completed' };
            return newSteps;
          });
          
          setTimeout(() => {
            onComplete?.();
          }, 2000);
          
          return prevIndex;
        }
      });
    }, 12000); // 12 seconds per step on average

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [isActive, currentStepIndex, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progress = (completedSteps / steps.length) * 100;
  const isCompleted = completedSteps === steps.length;

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-card p-8 max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          animate={{ rotate: isCompleted ? 0 : 360 }}
          transition={{ duration: 2, repeat: isCompleted ? 0 : Infinity, ease: "linear" }}
          className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center"
        >
          {isCompleted ? (
            <Check className="w-8 h-8 text-white" />
          ) : (
            <Zap className="w-8 h-8 text-white" />
          )}
        </motion.div>
        
        <h2 className="text-2xl font-bold mb-2">
          {isCompleted ? 'Your Code is Ready!' : 'Processing Your Code'}
        </h2>
        
        <p className="text-gray-400">
          {isCompleted 
            ? 'Download your beautifully cleaned codebase below'
            : `${formatTime(timeElapsed)} elapsed • ~${formatTime(Math.max(0, totalEstimatedTime - timeElapsed))} remaining`
          }
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>{Math.round(progress)}% Complete</span>
          <span>{completedSteps} of {steps.length} steps</span>
        </div>
        
        <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.status === 'active';
          const isCompleted = step.status === 'completed';
          const isPending = step.status === 'pending';

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                flex items-center space-x-4 p-4 rounded-xl transition-all duration-300
                ${isActive ? 'bg-primary-500/10 border border-primary-500/20' : ''}
                ${isCompleted ? 'bg-green-500/10 border border-green-500/20' : ''}
                ${isPending ? 'bg-gray-800/20' : ''}
              `}
            >
              {/* Icon */}
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                ${isActive ? 'bg-primary-500/20 text-primary-400' : ''}
                ${isCompleted ? 'bg-green-500/20 text-green-400' : ''}
                ${isPending ? 'bg-gray-700/50 text-gray-500' : ''}
              `}>
                <AnimatePresence mode="wait">
                  {isCompleted ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <Check className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="icon"
                      animate={{ 
                        rotate: isActive ? [0, 360] : 0,
                        scale: isActive ? [1, 1.1, 1] : 1
                      }}
                      transition={{ 
                        rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                        scale: { duration: 1, repeat: Infinity }
                      }}
                    >
                      <Icon className="w-6 h-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className={`font-semibold transition-colors duration-300 ${
                  isActive ? 'text-primary-400' : 
                  isCompleted ? 'text-green-400' : 
                  'text-gray-400'
                }`}>
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>

              {/* Status */}
              <div className="text-right">
                {isActive && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-primary-400" />
                    <span className="text-sm text-primary-400">Processing...</span>
                  </div>
                )}
                {isCompleted && (
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">Complete</span>
                  </div>
                )}
                {isPending && (
                  <span className="text-sm text-gray-500">Waiting</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Completion message */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-green-500/10 border border-green-500/20 rounded-xl text-center"
          >
            <h3 className="text-lg font-semibold text-green-400 mb-2">
              🎉 Code Cleanup Complete!
            </h3>
            <p className="text-gray-400 mb-4">
              Your codebase has been transformed and is ready for download
            </p>
            <button className="btn-primary">
              Download Cleaned Code
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-6 grid grid-cols-3 gap-4 text-center text-sm"
      >
        <div>
          <div className="font-semibold text-primary-400">
            {Math.floor(Math.random() * 5000) + 1000}
          </div>
          <div className="text-gray-500">Lines Processed</div>
        </div>
        <div>
          <div className="font-semibold text-accent-400">
            {Math.floor(Math.random() * 200) + 50}
          </div>
          <div className="text-gray-500">Issues Fixed</div>
        </div>
        <div>
          <div className="font-semibold text-green-400">
            {Math.floor(Math.random() * 30) + 10}%
          </div>
          <div className="text-gray-500">Size Reduced</div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProgressTracker;