import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Code, 
  Trash2, 
  FileText, 
  Zap, 
  Star, 
  TrendingDown,
  Clock,
  MapPin,
  Activity as ActivityIcon
} from 'lucide-react';

interface ActivityItem {
  id: string;
  user: {
    name: string;
    avatar: string;
    location?: string;
  };
  action: {
    type: 'cleanup' | 'optimization' | 'dead_code' | 'formatting' | 'refactor';
    description: string;
    stats: {
      linesProcessed?: number;
      issuesFixed?: number;
      sizeReduced?: number;
      filesAffected?: number;
    };
  };
  timestamp: Date;
  language: string;
  projectType?: string;
}

interface ActivityFeedProps {
  variant?: 'widget' | 'full' | 'compact';
  maxItems?: number;
  showLocation?: boolean;
  autoUpdate?: boolean;
  className?: string;
}

const ActivityFeed = ({ 
  variant = 'widget', 
  maxItems = 10, 
  showLocation = true,
  autoUpdate = true,
  className = ''
}: ActivityFeedProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sample activity data pool
  const activityPool: Omit<ActivityItem, 'id' | 'timestamp'>[] = [
    {
      user: { name: 'Alex Chen', avatar: 'AC', location: 'San Francisco, CA' },
      action: {
        type: 'cleanup',
        description: 'cleaned React components',
        stats: { linesProcessed: 2543, issuesFixed: 12, filesAffected: 8 }
      },
      language: 'TypeScript',
      projectType: 'E-commerce App'
    },
    {
      user: { name: 'Sarah Kim', avatar: 'SK', location: 'Austin, TX' },
      action: {
        type: 'dead_code',
        description: 'removed unused imports',
        stats: { linesProcessed: 1234, issuesFixed: 45 }
      },
      language: 'JavaScript',
      projectType: 'Portfolio Site'
    },
    {
      user: { name: 'Mike Rodriguez', avatar: 'MR', location: 'New York, NY' },
      action: {
        type: 'optimization',
        description: 'optimized database queries',
        stats: { linesProcessed: 892, sizeReduced: 34, issuesFixed: 8 }
      },
      language: 'Python',
      projectType: 'API Service'
    },
    {
      user: { name: 'Emma Thompson', avatar: 'ET', location: 'London, UK' },
      action: {
        type: 'formatting',
        description: 'standardized code style',
        stats: { linesProcessed: 4567, filesAffected: 23 }
      },
      language: 'Java',
      projectType: 'Mobile App'
    },
    {
      user: { name: 'David Liu', avatar: 'DL', location: 'Seattle, WA' },
      action: {
        type: 'refactor',
        description: 'restructured components',
        stats: { linesProcessed: 3456, issuesFixed: 15, sizeReduced: 28 }
      },
      language: 'React',
      projectType: 'Dashboard'
    },
    {
      user: { name: 'Lisa Wang', avatar: 'LW', location: 'Toronto, ON' },
      action: {
        type: 'cleanup',
        description: 'cleaned legacy codebase',
        stats: { linesProcessed: 8901, issuesFixed: 67, sizeReduced: 42 }
      },
      language: 'PHP',
      projectType: 'CRM System'
    },
    {
      user: { name: 'James Park', avatar: 'JP', location: 'Los Angeles, CA' },
      action: {
        type: 'dead_code',
        description: 'removed deprecated functions',
        stats: { linesProcessed: 2103, issuesFixed: 28 }
      },
      language: 'C++',
      projectType: 'Game Engine'
    },
    {
      user: { name: 'Maya Patel', avatar: 'MP', location: 'Bangalore, IN' },
      action: {
        type: 'optimization',
        description: 'improved performance',
        stats: { linesProcessed: 1876, sizeReduced: 56, issuesFixed: 19 }
      },
      language: 'Python',
      projectType: 'ML Pipeline'
    }
  ];

  // Initialize with some activities
  useEffect(() => {
    const initialActivities = activityPool
      .slice(0, maxItems)
      .map((activity, index) => ({
        ...activity,
        id: `init-${index}`,
        timestamp: new Date(Date.now() - index * 60000 * Math.random() * 60)
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    setActivities(initialActivities);
    setIsLoading(false);
  }, [maxItems]);

  // Add new activities periodically
  useEffect(() => {
    if (!autoUpdate) return;

    const interval = setInterval(() => {
      const randomActivity = activityPool[Math.floor(Math.random() * activityPool.length)];
      const newActivity: ActivityItem = {
        ...randomActivity,
        id: `activity-${Date.now()}`,
        timestamp: new Date()
      };

      setActivities(prev => [newActivity, ...prev.slice(0, maxItems - 1)]);
    }, Math.random() * 10000 + 5000); // Random interval between 5-15 seconds

    return () => clearInterval(interval);
  }, [autoUpdate, maxItems]);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'cleanup': return Code;
      case 'dead_code': return Trash2;
      case 'formatting': return FileText;
      case 'optimization': return Zap;
      case 'refactor': return Star;
      default: return ActivityIcon;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'cleanup': return 'text-blue-400';
      case 'dead_code': return 'text-red-400';
      case 'formatting': return 'text-purple-400';
      case 'optimization': return 'text-green-400';
      case 'refactor': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const formatStats = (stats: ActivityItem['action']['stats']) => {
    const parts = [];
    if (stats.linesProcessed) parts.push(`${stats.linesProcessed.toLocaleString()} lines`);
    if (stats.issuesFixed) parts.push(`${stats.issuesFixed} issues fixed`);
    if (stats.sizeReduced) parts.push(`${stats.sizeReduced}% smaller`);
    if (stats.filesAffected) parts.push(`${stats.filesAffected} files`);
    return parts.slice(0, 2).join(' • ');
  };

  if (isLoading) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex space-x-3 mb-4">
              <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-700 rounded w-2/3 mb-2"></div>
                <div className="h-2 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`glass-card p-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-white">Live Activity</span>
        </div>
        <div className="space-y-2">
          {activities.slice(0, 3).map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2 text-xs"
            >
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[10px] font-semibold text-white">
                {activity.user.avatar.slice(0, 1)}
              </div>
              <span className="text-gray-300 truncate">
                {activity.user.name} {activity.action.description}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-card p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
            <ActivityIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className={`font-semibold text-white ${variant === 'widget' ? 'text-lg' : 'text-xl'}`}>
              Live Activity
            </h3>
            <p className="text-sm text-gray-400">Real-time code transformations</p>
          </div>
        </div>

        {autoUpdate && (
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs text-green-400">Live</span>
          </div>
        )}
      </div>

      {/* Activity List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {activities.map((activity) => {
            const ActionIcon = getActionIcon(activity.action.type);
            const actionColor = getActionColor(activity.action.type);
            
            return (
              <motion.div
                key={activity.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex items-start space-x-3 p-3 bg-gray-900/20 rounded-lg hover:bg-gray-900/40 transition-colors"
              >
                {/* User Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                  {activity.user.avatar}
                </div>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-white">{activity.user.name}</span>
                    <ActionIcon className={`w-4 h-4 ${actionColor}`} />
                    <span className="text-sm text-gray-400">{activity.action.description}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span className="font-mono text-accent-400">{activity.language}</span>
                    {activity.projectType && (
                      <>
                        <span>•</span>
                        <span>{activity.projectType}</span>
                      </>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="mt-2 text-xs text-gray-400">
                    {formatStats(activity.action.stats)}
                  </div>

                  {/* Location and time */}
                  <div className="flex items-center justify-between mt-2">
                    {showLocation && activity.user.location && (
                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span>{activity.user.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {/* Size reduction indicator */}
                {activity.action.stats.sizeReduced && (
                  <div className="flex items-center space-x-1 text-xs text-green-400">
                    <TrendingDown className="w-3 h-3" />
                    <span>{activity.action.stats.sizeReduced}%</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500"
      >
        <span>{activities.length} recent activities</span>
        <span>Updates every few seconds</span>
      </motion.div>
    </div>
  );
};

export default ActivityFeed;