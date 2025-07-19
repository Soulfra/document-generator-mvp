import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Target, 
  Clock, 
  Code, 
  Trash2, 
  Zap, 
  Users, 
  Calendar,
  Gift,
  CheckCircle,
  Star,
  Flame,
  TrendingUp
} from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  icon: React.ComponentType<any>;
  difficulty: 'easy' | 'medium' | 'hard';
  progress: {
    current: number;
    target: number;
    unit: string;
  };
  reward: {
    xp: number;
    credits?: number;
    badge?: string;
  };
  expiresAt: string;
  completed: boolean;
  isNew?: boolean;
}

interface ChallengesProps {
  userId?: string;
  variant?: 'full' | 'widget';
}

const Challenges = ({ userId = 'demo-user', variant = 'full' }: ChallengesProps) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'special'>('daily');
  const [completedToday, setCompletedToday] = useState(2);
  const [streak, setStreak] = useState(7);

  // Challenge definitions
  const challengePool: Omit<Challenge, 'id' | 'expiresAt' | 'completed' | 'isNew'>[] = [
    {
      title: 'Quick Start',
      description: 'Complete 3 code cleanups',
      type: 'daily',
      icon: Code,
      difficulty: 'easy',
      progress: { current: 1, target: 3, unit: 'cleanups' },
      reward: { xp: 100, credits: 0.25 }
    },
    {
      title: 'Speed Cleaner',
      description: 'Finish a cleanup in under 2 minutes',
      type: 'daily',
      icon: Zap,
      difficulty: 'medium',
      progress: { current: 0, target: 1, unit: 'fast cleanup' },
      reward: { xp: 200, credits: 0.50 }
    },
    {
      title: 'Dead Code Hunter',
      description: 'Remove 5,000 lines of dead code',
      type: 'daily',
      icon: Trash2,
      difficulty: 'hard',
      progress: { current: 2340, target: 5000, unit: 'dead lines' },
      reward: { xp: 300, credits: 1.00 }
    },
    {
      title: 'Social Sharer',
      description: 'Share your results on social media',
      type: 'daily',
      icon: Users,
      difficulty: 'easy',
      progress: { current: 0, target: 1, unit: 'share' },
      reward: { xp: 150, credits: 0.50 }
    },
    {
      title: 'Week Warrior',
      description: 'Complete 20 cleanups this week',
      type: 'weekly',
      icon: Target,
      difficulty: 'medium',
      progress: { current: 12, target: 20, unit: 'cleanups' },
      reward: { xp: 1000, credits: 5.00 }
    },
    {
      title: 'Quality Master',
      description: 'Achieve 90%+ improvement on 5 projects',
      type: 'weekly',
      icon: Star,
      difficulty: 'hard',
      progress: { current: 3, target: 5, unit: 'perfect cleanups' },
      reward: { xp: 1500, badge: 'Quality Badge' }
    },
    {
      title: 'Streak Master',
      description: 'Maintain a 10-day cleaning streak',
      type: 'weekly',
      icon: Flame,
      difficulty: 'hard',
      progress: { current: 7, target: 10, unit: 'days' },
      reward: { xp: 2000, credits: 10.00, badge: 'Fire Badge' }
    },
    {
      title: 'Community Champion',
      description: 'Limited time: Clean 100k lines during event',
      type: 'special',
      icon: TrendingUp,
      difficulty: 'hard',
      progress: { current: 45670, target: 100000, unit: 'lines' },
      reward: { xp: 5000, credits: 25.00, badge: 'Champion Badge' }
    }
  ];

  // Initialize challenges
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const eventEnd = new Date(now);
    eventEnd.setDate(eventEnd.getDate() + 3);

    const initialChallenges: Challenge[] = challengePool.map((challenge, index) => ({
      ...challenge,
      id: `challenge-${index}`,
      expiresAt: challenge.type === 'daily' ? tomorrow.toISOString() :
                challenge.type === 'weekly' ? nextWeek.toISOString() :
                eventEnd.toISOString(),
      completed: Math.random() > 0.7,
      isNew: Math.random() > 0.8
    }));

    setChallenges(initialChallenges);
  }, []);

  // Simulate progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setChallenges(prev => prev.map(challenge => {
        if (!challenge.completed && Math.random() > 0.85) {
          const increment = Math.floor(Math.random() * 100) + 1;
          const newCurrent = Math.min(
            challenge.progress.current + increment,
            challenge.progress.target
          );
          
          const completed = newCurrent >= challenge.progress.target;
          if (completed) {
            setCompletedToday(prev => prev + 1);
          }

          return {
            ...challenge,
            progress: { ...challenge.progress, current: newCurrent },
            completed
          };
        }
        return challenge;
      }));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getDifficultyBg = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20';
      case 'medium': return 'bg-yellow-500/20';
      case 'hard': return 'bg-red-500/20';
      default: return 'bg-gray-500/20';
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const activeChallenges = challenges.filter(c => c.type === activeTab);
  const completedCount = activeChallenges.filter(c => c.completed).length;

  if (variant === 'widget') {
    const todaysChallenges = challenges.filter(c => c.type === 'daily');
    const completedToday = todaysChallenges.filter(c => c.completed).length;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-primary-400" />
            <span className="font-semibold text-white">Daily Challenges</span>
          </div>
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-orange-400">{streak} day streak</span>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Progress Today</span>
            <span className="text-gray-400">{completedToday}/{todaysChallenges.length}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completedToday / todaysChallenges.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          {todaysChallenges.slice(0, 2).map((challenge) => {
            const Icon = challenge.icon;
            const progressPercent = (challenge.progress.current / challenge.progress.target) * 100;
            
            return (
              <div
                key={challenge.id}
                className={`flex items-center space-x-3 p-2 rounded-lg transition-all ${
                  challenge.completed ? 'bg-green-500/10' : 'bg-gray-900/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  challenge.completed ? 'bg-green-500/20 text-green-400' : getDifficultyBg(challenge.difficulty)
                }`}>
                  {challenge.completed ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Icon className={`w-4 h-4 ${getDifficultyColor(challenge.difficulty)}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{challenge.title}</div>
                  <div className="text-xs text-gray-500">
                    {challenge.progress.current}/{challenge.progress.target} {challenge.progress.unit}
                  </div>
                </div>
                <div className="text-xs text-primary-400">+{challenge.reward.xp} XP</div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // Full variant
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-4"
      >
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">{completedToday}</div>
          <div className="text-sm text-gray-400">Completed Today</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-orange-400 mb-1 flex items-center justify-center space-x-1">
            <Flame className="w-6 h-6" />
            <span>{streak}</span>
          </div>
          <div className="text-sm text-gray-400">Day Streak</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">+2,340</div>
          <div className="text-sm text-gray-400">XP This Week</div>
        </div>
      </motion.div>

      {/* Challenge Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-900/50 rounded-lg p-1">
          {(['daily', 'weekly', 'special'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all capitalize
                ${activeTab === tab 
                  ? 'bg-primary-500 text-white' 
                  : 'text-gray-400 hover:text-white'
                }
              `}
            >
              {tab}
              {tab === 'special' && (
                <span className="ml-1 bg-red-500 text-white text-xs px-1 rounded">NEW</span>
              )}
            </button>
          ))}
        </div>

        {/* Progress Overview */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">
              {completedCount} of {activeChallenges.length} {activeTab} challenges completed
            </span>
            <span className="text-gray-400">
              {Math.round((completedCount / activeChallenges.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / activeChallenges.length) * 100}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>

        {/* Challenges List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {activeChallenges.map((challenge, index) => {
              const Icon = challenge.icon;
              const progressPercent = (challenge.progress.current / challenge.progress.target) * 100;
              const timeRemaining = getTimeRemaining(challenge.expiresAt);

              return (
                <motion.div
                  key={challenge.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    p-4 rounded-lg border transition-all relative overflow-hidden
                    ${challenge.completed 
                      ? 'bg-green-500/10 border-green-500/20' 
                      : 'bg-gray-900/30 border-gray-700 hover:border-gray-600'
                    }
                  `}
                >
                  {/* New Challenge Badge */}
                  {challenge.isNew && !challenge.completed && (
                    <div className="absolute top-2 right-2 bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                      NEW
                    </div>
                  )}

                  <div className="flex items-start space-x-4">
                    <div className={`
                      w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
                      ${challenge.completed 
                        ? 'bg-green-500/20 text-green-400' 
                        : getDifficultyBg(challenge.difficulty)
                      }
                    `}>
                      {challenge.completed ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Icon className={`w-6 h-6 ${getDifficultyColor(challenge.difficulty)}`} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-white">{challenge.title}</h4>
                        <span className={`
                          text-xs px-2 py-1 rounded capitalize
                          ${getDifficultyBg(challenge.difficulty)} ${getDifficultyColor(challenge.difficulty)}
                        `}>
                          {challenge.difficulty}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-3">{challenge.description}</p>

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">
                            {challenge.progress.current.toLocaleString()} / {challenge.progress.target.toLocaleString()} {challenge.progress.unit}
                          </span>
                          <span className="text-gray-500">{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <motion.div
                            className={`h-2 rounded-full ${
                              challenge.completed 
                                ? 'bg-gradient-to-r from-green-500 to-green-400'
                                : 'bg-gradient-to-r from-primary-500 to-accent-500'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                          />
                        </div>
                      </div>

                      {/* Rewards & Time */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-3">
                          <span className="text-blue-400">+{challenge.reward.xp} XP</span>
                          {challenge.reward.credits && (
                            <span className="text-green-400">+${challenge.reward.credits}</span>
                          )}
                          {challenge.reward.badge && (
                            <span className="text-yellow-400">+{challenge.reward.badge}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{timeRemaining}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Completion Effect */}
                  {challenge.completed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 bg-green-500/5 rounded-lg"
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Challenges;