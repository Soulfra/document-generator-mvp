import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Activity, TrendingUp, Users, Zap } from 'lucide-react';

interface ActivityWidgetProps {
  variant?: 'mini' | 'stats' | 'ticker';
  className?: string;
}

const ActivityWidget = ({ variant = 'mini', className = '' }: ActivityWidgetProps) => {
  const [currentActivity, setCurrentActivity] = useState(0);
  const [liveStats, setLiveStats] = useState({
    activeUsers: 23,
    todayCleanups: 1247,
    liveCleanups: 3
  });

  const recentActivities = [
    { user: 'Alex', action: 'cleaned 2,543 lines of React code', time: '2m ago' },
    { user: 'Sarah', action: 'removed 45 unused imports', time: '4m ago' },
    { user: 'Mike', action: 'reduced bundle size by 34%', time: '6m ago' },
    { user: 'Emma', action: 'fixed 18 ESLint errors', time: '8m ago' },
    { user: 'David', action: 'restructured 12 components', time: '10m ago' },
  ];

  // Rotate through activities
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActivity(prev => (prev + 1) % recentActivities.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update live stats
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        activeUsers: prev.activeUsers + (Math.random() > 0.7 ? Math.floor(Math.random() * 3) - 1 : 0),
        todayCleanups: prev.todayCleanups + (Math.random() > 0.8 ? 1 : 0),
        liveCleanups: Math.max(1, prev.liveCleanups + (Math.random() > 0.6 ? Math.floor(Math.random() * 3) - 1 : 0))
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (variant === 'ticker') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-2 ${className}`}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-green-400">LIVE</span>
          </div>
          
          <motion.div
            key={currentActivity}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-sm text-gray-300"
          >
            <span className="font-medium text-white">
              {recentActivities[currentActivity].user}
            </span>
            <span className="text-gray-400"> {recentActivities[currentActivity].action}</span>
            <span className="text-gray-600 ml-2">{recentActivities[currentActivity].time}</span>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'stats') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`glass-card p-4 ${className}`}
      >
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="w-5 h-5 text-primary-400" />
          <span className="text-sm font-semibold text-white">Live Activity</span>
        </div>
        
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <motion.div
              key={liveStats.activeUsers}
              initial={{ scale: 1.2, color: '#10b981' }}
              animate={{ scale: 1, color: '#ffffff' }}
              transition={{ duration: 0.3 }}
              className="text-lg font-bold text-white"
            >
              {liveStats.activeUsers}
            </motion.div>
            <div className="text-xs text-gray-500">Active Now</div>
          </div>
          
          <div>
            <motion.div
              key={liveStats.todayCleanups}
              initial={{ scale: 1.2, color: '#3b82f6' }}
              animate={{ scale: 1, color: '#ffffff' }}
              transition={{ duration: 0.3 }}
              className="text-lg font-bold text-white"
            >
              {liveStats.todayCleanups.toLocaleString()}
            </motion.div>
            <div className="text-xs text-gray-500">Today</div>
          </div>
          
          <div>
            <motion.div
              key={liveStats.liveCleanups}
              initial={{ scale: 1.2, color: '#f59e0b' }}
              animate={{ scale: 1, color: '#ffffff' }}
              transition={{ duration: 0.3 }}
              className="text-lg font-bold text-white"
            >
              {liveStats.liveCleanups}
            </motion.div>
            <div className="text-xs text-gray-500">Processing</div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default mini variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-4 ${className}`}
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Live Activity</div>
          <div className="text-xs text-gray-400">Real-time transformations</div>
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center space-x-1">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs text-green-400">{liveStats.activeUsers} active</span>
        </div>
      </div>

      <div className="space-y-3">
        {recentActivities.slice(0, 3).map((activity, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-3"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-semibold text-white">
              {activity.user[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-300 truncate">
                <span className="font-medium text-white">{activity.user}</span>
                <span className="text-gray-400"> {activity.action}</span>
              </div>
              <div className="text-xs text-gray-600">{activity.time}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500"
      >
        <span>+{liveStats.todayCleanups} cleanups today</span>
        <div className="flex items-center space-x-1">
          <TrendingUp className="w-3 h-3" />
          <span>Live updates</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ActivityWidget;