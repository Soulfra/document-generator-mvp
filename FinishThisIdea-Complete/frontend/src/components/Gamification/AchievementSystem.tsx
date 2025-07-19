import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  Crown, 
  Shield, 
  Flame,
  Sparkles,
  Award,
  TrendingUp,
  Code,
  Trash2,
  Users,
  Clock,
  X
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'cleanup' | 'efficiency' | 'social' | 'milestone' | 'special';
  progress: {
    current: number;
    target: number;
    unit: string;
  };
  unlocked: boolean;
  unlockedAt?: string;
  reward: {
    type: 'credit' | 'badge' | 'title' | 'feature';
    value: string;
  };
}

interface UserLevel {
  current: number;
  xp: number;
  xpToNext: number;
  title: string;
  perks: string[];
}

interface AchievementSystemProps {
  userId?: string;
  showNotifications?: boolean;
  compact?: boolean;
}

const AchievementSystem = ({ 
  userId = 'demo-user', 
  showNotifications = true,
  compact = false 
}: AchievementSystemProps) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userLevel, setUserLevel] = useState<UserLevel>({
    current: 8,
    xp: 2340,
    xpToNext: 660,
    title: 'Code Architect',
    perks: ['Priority processing', 'Custom profiles', 'Extended history']
  });
  const [newUnlocks, setNewUnlocks] = useState<Achievement[]>([]);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Achievement definitions
  const achievementDefinitions: Achievement[] = [
    {
      id: 'first-cleanup',
      title: 'First Steps',
      description: 'Complete your first code cleanup',
      icon: Star,
      rarity: 'common',
      category: 'milestone',
      progress: { current: 1, target: 1, unit: 'cleanup' },
      unlocked: true,
      unlockedAt: '2024-01-15',
      reward: { type: 'credit', value: '$0.50' }
    },
    {
      id: 'speed-demon',
      title: 'Speed Demon',
      description: 'Complete 5 cleanups in under 3 minutes each',
      icon: Zap,
      rarity: 'rare',
      category: 'efficiency',
      progress: { current: 3, target: 5, unit: 'fast cleanups' },
      unlocked: false,
      reward: { type: 'badge', value: 'Lightning Badge' }
    },
    {
      id: 'clean-sweep',
      title: 'Clean Sweep',
      description: 'Process 100,000 lines of code',
      icon: Code,
      rarity: 'epic',
      category: 'cleanup',
      progress: { current: 67420, target: 100000, unit: 'lines' },
      unlocked: false,
      reward: { type: 'title', value: 'Code Surgeon' }
    },
    {
      id: 'perfectionist',
      title: 'Perfectionist',
      description: 'Achieve 95%+ improvement on 10 projects',
      icon: Trophy,
      rarity: 'epic',
      category: 'cleanup',
      progress: { current: 7, target: 10, unit: 'perfect cleanups' },
      unlocked: false,
      reward: { type: 'feature', value: 'Advanced analytics' }
    },
    {
      id: 'social-butterfly',
      title: 'Social Butterfly',
      description: 'Refer 25 successful users',
      icon: Users,
      rarity: 'rare',
      category: 'social',
      progress: { current: 18, target: 25, unit: 'referrals' },
      unlocked: false,
      reward: { type: 'credit', value: '$25.00' }
    },
    {
      id: 'garbage-collector',
      title: 'Garbage Collector',
      description: 'Remove 50,000 lines of dead code',
      icon: Trash2,
      rarity: 'rare',
      category: 'cleanup',
      progress: { current: 34567, target: 50000, unit: 'dead lines removed' },
      unlocked: false,
      reward: { type: 'badge', value: 'Cleaner Badge' }
    },
    {
      id: 'consistency-king',
      title: 'Consistency King',
      description: 'Clean code for 30 days straight',
      icon: Flame,
      rarity: 'legendary',
      category: 'milestone',
      progress: { current: 12, target: 30, unit: 'days' },
      unlocked: false,
      reward: { type: 'title', value: 'Code Master' }
    },
    {
      id: 'early-adopter',
      title: 'Early Adopter',
      description: 'Join within the first 1000 users',
      icon: Crown,
      rarity: 'legendary',
      category: 'special',
      progress: { current: 1, target: 1, unit: 'achievement' },
      unlocked: true,
      unlockedAt: '2024-01-15',
      reward: { type: 'badge', value: 'Founder Badge' }
    }
  ];

  useEffect(() => {
    setAchievements(achievementDefinitions);
  }, []);

  // Simulate achievement unlocks
  useEffect(() => {
    const interval = setInterval(() => {
      setAchievements(prev => {
        const updated = prev.map(achievement => {
          if (!achievement.unlocked && Math.random() > 0.95) {
            const progress = achievement.progress;
            const newProgress = Math.min(progress.current + Math.floor(Math.random() * 500), progress.target);
            
            if (newProgress >= progress.target) {
              setNewUnlocks(current => [...current, { ...achievement, unlocked: true, unlockedAt: new Date().toISOString() }]);
              return {
                ...achievement,
                progress: { ...progress, current: newProgress },
                unlocked: true,
                unlockedAt: new Date().toISOString()
              };
            } else {
              return {
                ...achievement,
                progress: { ...progress, current: newProgress }
              };
            }
          }
          return achievement;
        });
        return updated;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400';
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500/20';
      case 'rare': return 'bg-blue-500/20';
      case 'epic': return 'bg-purple-500/20';
      case 'legendary': return 'bg-yellow-500/20';
      default: return 'bg-gray-500/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cleanup': return Code;
      case 'efficiency': return Zap;
      case 'social': return Users;
      case 'milestone': return Target;
      case 'special': return Crown;
      default: return Award;
    }
  };

  const filteredAchievements = achievements.filter(achievement => {
    const statusMatch = filter === 'all' || 
                       (filter === 'unlocked' && achievement.unlocked) || 
                       (filter === 'locked' && !achievement.unlocked);
    const categoryMatch = categoryFilter === 'all' || achievement.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="font-semibold text-white">Level {userLevel.current}</span>
          </div>
          <span className="text-sm text-gray-400">{unlockedCount}/{totalCount}</span>
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">{userLevel.title}</span>
            <span className="text-gray-400">{userLevel.xp} XP</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(userLevel.xp / (userLevel.xp + userLevel.xpToNext)) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {achievements.slice(0, 4).map((achievement) => {
            const Icon = achievement.icon;
            return (
              <div
                key={achievement.id}
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center transition-all
                  ${achievement.unlocked 
                    ? `${getRarityBg(achievement.rarity)} ${getRarityColor(achievement.rarity)}` 
                    : 'bg-gray-800 text-gray-600'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Level & Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">Level {userLevel.current}</h2>
            <p className="text-lg text-yellow-400 font-medium">{userLevel.title}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
              <span>{userLevel.xp.toLocaleString()} XP</span>
              <span>•</span>
              <span>{userLevel.xpToNext.toLocaleString()} to next level</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(userLevel.xp / (userLevel.xp + userLevel.xpToNext)) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-white mb-2">Level Perks:</h4>
          <div className="flex flex-wrap gap-2">
            {userLevel.perks.map((perk, index) => (
              <span
                key={index}
                className="bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-full text-xs"
              >
                {perk}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Achievements</h3>
            <p className="text-sm text-gray-400">
              {unlockedCount} of {totalCount} unlocked
            </p>
          </div>
          <div className="bg-primary-500/10 text-primary-400 px-3 py-1 rounded-full text-sm">
            {Math.round((unlockedCount / totalCount) * 100)}% Complete
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'unlocked', 'locked'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as any)}
              className={`
                px-3 py-1 rounded-full text-sm transition-colors capitalize
                ${filter === filterOption 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:text-white'
                }
              `}
            >
              {filterOption}
            </button>
          ))}
        </div>

        {/* Achievement Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {filteredAchievements.map((achievement, index) => {
            const Icon = achievement.icon;
            const CategoryIcon = getCategoryIcon(achievement.category);
            const progressPercent = (achievement.progress.current / achievement.progress.target) * 100;

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  p-4 rounded-lg border transition-all duration-300 hover:scale-105
                  ${achievement.unlocked 
                    ? `${getRarityBg(achievement.rarity)} border-current ${getRarityColor(achievement.rarity)}` 
                    : 'bg-gray-900/30 border-gray-700 opacity-60'
                  }
                `}
              >
                <div className="flex items-start space-x-3">
                  <div className={`
                    w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
                    ${achievement.unlocked 
                      ? getRarityBg(achievement.rarity) 
                      : 'bg-gray-800'
                    }
                  `}>
                    <Icon className={`w-6 h-6 ${achievement.unlocked ? getRarityColor(achievement.rarity) : 'text-gray-600'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className={`font-semibold ${achievement.unlocked ? 'text-white' : 'text-gray-500'}`}>
                        {achievement.title}
                      </h4>
                      <CategoryIcon className="w-3 h-3 text-gray-500" />
                    </div>
                    
                    <p className={`text-sm mb-2 ${achievement.unlocked ? 'text-gray-300' : 'text-gray-600'}`}>
                      {achievement.description}
                    </p>

                    {/* Progress */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">
                          {achievement.progress.current.toLocaleString()} / {achievement.progress.target.toLocaleString()} {achievement.progress.unit}
                        </span>
                        <span className="text-gray-500">
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <motion.div
                          className={`h-2 rounded-full ${
                            achievement.unlocked 
                              ? 'bg-gradient-to-r from-green-500 to-green-400'
                              : 'bg-gradient-to-r from-gray-600 to-gray-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                        />
                      </div>
                    </div>

                    {/* Reward */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded capitalize ${getRarityBg(achievement.rarity)} ${getRarityColor(achievement.rarity)}`}>
                        {achievement.rarity}
                      </span>
                      <span className="text-xs text-gray-500">
                        Reward: {achievement.reward.value}
                      </span>
                    </div>

                    {achievement.unlocked && achievement.unlockedAt && (
                      <div className="text-xs text-green-400 mt-1">
                        ✅ Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Achievement Unlock Notifications */}
      <AnimatePresence>
        {showNotifications && newUnlocks.map((achievement) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50 glass-card p-6 max-w-sm border-l-4 border-yellow-500"
          >
            <button
              onClick={() => setNewUnlocks(prev => prev.filter(a => a.id !== achievement.id))}
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <achievement.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-white">Achievement Unlocked!</h4>
                <p className="text-sm text-yellow-400">{achievement.title}</p>
                <p className="text-xs text-gray-400">{achievement.description}</p>
              </div>
            </div>

            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: 2 }}
            >
              <Sparkles className="absolute top-2 left-2 w-4 h-4 text-yellow-400" />
              <Sparkles className="absolute bottom-2 right-8 w-3 h-3 text-yellow-400" />
              <Sparkles className="absolute top-8 right-2 w-2 h-2 text-yellow-400" />
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AchievementSystem;