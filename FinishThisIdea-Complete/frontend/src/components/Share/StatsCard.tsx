import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { TrendingUp, Users, Code, Zap, Star, Heart } from 'lucide-react';

interface StatsCardProps {
  variant?: 'compact' | 'detailed';
  showLive?: boolean;
}

interface LiveStats {
  totalUsers: number;
  linesCleanedToday: number;
  averageRating: number;
  activeNow: number;
  savedHours: number;
  happyDevs: number;
}

const StatsCard = ({ variant = 'detailed', showLive = true }: StatsCardProps) => {
  const [stats, setStats] = useState<LiveStats>({
    totalUsers: 12847,
    linesCleanedToday: 145892,
    averageRating: 4.9,
    activeNow: 23,
    savedHours: 8234,
    happyDevs: 11456
  });

  const [recentActivity] = useState([
    { user: 'Alex', action: 'cleaned 2,543 lines', time: '2m ago', avatar: 'A' },
    { user: 'Sarah', action: 'fixed 45 issues', time: '4m ago', avatar: 'S' },
    { user: 'Mike', action: 'reduced size by 34%', time: '6m ago', avatar: 'M' },
    { user: 'Emma', action: 'organized 156 files', time: '8m ago', avatar: 'E' },
  ]);

  // Simulate live updates
  useEffect(() => {
    if (!showLive) return;

    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        linesCleanedToday: prev.linesCleanedToday + Math.floor(Math.random() * 500) + 100,
        activeNow: Math.floor(Math.random() * 40) + 15,
        totalUsers: prev.totalUsers + (Math.random() > 0.8 ? 1 : 0),
        happyDevs: prev.happyDevs + (Math.random() > 0.9 ? 1 : 0)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [showLive]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                {formatNumber(stats.totalUsers)} developers
              </div>
              <div className="text-xs text-gray-400">already cleaned their code</div>
            </div>
          </div>
          
          {showLive && (
            <div className="flex items-center space-x-1">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs text-green-400">{stats.activeNow} active</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  const statItems = [
    {
      icon: Users,
      label: 'Happy Developers',
      value: formatNumber(stats.happyDevs),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      trend: '+12% this week'
    },
    {
      icon: Code,
      label: 'Lines Cleaned Today',
      value: formatNumber(stats.linesCleanedToday),
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      live: true
    },
    {
      icon: Star,
      label: 'Average Rating',
      value: stats.averageRating.toFixed(1),
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      suffix: '/5.0'
    },
    {
      icon: Zap,
      label: 'Hours Saved',
      value: formatNumber(stats.savedHours),
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      trend: 'This month'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Live Stats</h3>
            <p className="text-sm text-gray-400">Real-time community impact</p>
          </div>
        </div>

        {showLive && (
          <div className="flex items-center space-x-2 glass-card px-3 py-1">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs text-green-400">{stats.activeNow} active now</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {statItems.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="relative p-4 bg-gray-900/30 rounded-lg hover:bg-gray-900/50 transition-colors"
            >
              {stat.live && (
                <div className="absolute top-2 right-2">
                  <span className="flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                </div>
              )}

              <div className={`${stat.bgColor} w-8 h-8 rounded-lg flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>

              <div className="text-lg font-bold text-white">
                <motion.span
                  key={stat.value}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {stat.value}
                </motion.span>
                {stat.suffix && <span className="text-sm text-gray-400">{stat.suffix}</span>}
              </div>
              
              <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
              
              {stat.trend && (
                <div className="text-xs text-gray-600">{stat.trend}</div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="border-t border-gray-800 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Recent Activity</h4>
        <div className="space-y-2">
          {recentActivity.slice(0, 3).map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-3 text-sm"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-semibold text-white">
                {activity.avatar}
              </div>
              <div className="flex-1">
                <span className="text-gray-300">{activity.user}</span>
                <span className="text-gray-500"> {activity.action}</span>
              </div>
              <span className="text-gray-600 text-xs">{activity.time}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Social proof message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 p-3 bg-gradient-to-r from-accent-500/10 to-primary-500/10 rounded-lg border border-accent-500/20"
      >
        <div className="flex items-center space-x-2">
          <Heart className="w-4 h-4 text-accent-400" />
          <p className="text-xs text-gray-400">
            Join <span className="text-accent-400 font-medium">{formatNumber(stats.totalUsers)}</span> developers 
            who've transformed their code for just <span className="text-primary-400 font-medium">$1</span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StatsCard;