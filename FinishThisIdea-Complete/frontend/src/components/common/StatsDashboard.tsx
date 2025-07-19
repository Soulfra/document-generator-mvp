import { motion, useInView } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { 
  TrendingUp, 
  Users, 
  Code2, 
  Zap, 
  Clock, 
  Star, 
  Download,
  FileText,
  Trash2,
  Sparkles
} from 'lucide-react';

interface StatItem {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  trend?: {
    value: number;
    period: string;
    direction: 'up' | 'down';
  };
  format?: 'number' | 'decimal' | 'percentage' | 'time';
}

interface StatsDashboardProps {
  variant?: 'grid' | 'horizontal' | 'featured';
  showTrends?: boolean;
  animateOnView?: boolean;
  updateInterval?: number;
}

const defaultStats: StatItem[] = [
  {
    id: 'total-users',
    label: 'Happy Developers',
    value: 12847,
    icon: Users,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    trend: { value: 23, period: 'this week', direction: 'up' },
    format: 'number'
  },
  {
    id: 'lines-cleaned',
    label: 'Lines Cleaned',
    value: 4235892,
    icon: Code2,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    trend: { value: 15, period: 'today', direction: 'up' },
    format: 'number'
  },
  {
    id: 'processing-time',
    label: 'Avg Processing Time',
    value: 4.7,
    suffix: ' min',
    icon: Clock,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    trend: { value: 12, period: 'vs last month', direction: 'down' },
    format: 'decimal'
  },
  {
    id: 'satisfaction',
    label: 'Satisfaction Rate',
    value: 98.7,
    suffix: '%',
    icon: Star,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    trend: { value: 2.1, period: 'this quarter', direction: 'up' },
    format: 'decimal'
  },
  {
    id: 'files-processed',
    label: 'Files Processed',
    value: 89234,
    icon: FileText,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    format: 'number'
  },
  {
    id: 'dead-code-removed',
    label: 'Dead Code Removed',
    value: 1567890,
    suffix: ' lines',
    icon: Trash2,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    format: 'number'
  },
  {
    id: 'downloads',
    label: 'Clean Files Downloaded',
    value: 56789,
    icon: Download,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    format: 'number'
  },
  {
    id: 'performance-boost',
    label: 'Avg Performance Boost',
    value: 34.5,
    suffix: '%',
    icon: Zap,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    format: 'decimal'
  }
];

const StatsDashboard = ({ 
  variant = 'grid', 
  showTrends = true, 
  animateOnView = true,
  updateInterval = 5000
}: StatsDashboardProps) => {
  const [stats, setStats] = useState(defaultStats);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, threshold: 0.1 });

  useEffect(() => {
    if (inView) {
      setIsVisible(true);
    }
  }, [inView]);

  // Simulate live updates
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setStats(prevStats => 
        prevStats.map(stat => {
          if (stat.id === 'lines-cleaned' || stat.id === 'total-users') {
            const increment = Math.floor(Math.random() * 100) + 10;
            return { ...stat, value: stat.value + increment };
          }
          return stat;
        })
      );
    }, updateInterval);

    return () => clearInterval(interval);
  }, [isVisible, updateInterval]);

  const formatValue = (value: number, format: string = 'number', decimals: number = 0) => {
    switch (format) {
      case 'decimal':
        return value.toFixed(decimals);
      case 'percentage':
        return `${value.toFixed(decimals)}%`;
      case 'time':
        return `${Math.floor(value)}:${((value % 1) * 60).toFixed(0).padStart(2, '0')}`;
      default:
        if (value >= 1000000) {
          return (value / 1000000).toFixed(1) + 'M';
        }
        if (value >= 1000) {
          return (value / 1000).toFixed(1) + 'K';
        }
        return value.toString();
    }
  };

  const AnimatedCounter = ({ stat, delay = 0 }: { stat: StatItem; delay?: number }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
      if (!isVisible || hasAnimated) return;

      const duration = 2000;
      const steps = 60;
      const increment = stat.value / steps;
      let currentStep = 0;

      const timer = setTimeout(() => {
        const counter = setInterval(() => {
          currentStep++;
          setDisplayValue(Math.min(increment * currentStep, stat.value));
          
          if (currentStep >= steps) {
            clearInterval(counter);
            setDisplayValue(stat.value);
            setHasAnimated(true);
          }
        }, duration / steps);
      }, delay);

      return () => clearTimeout(timer);
    }, [isVisible, stat.value, hasAnimated, delay]);

    // Update display value when stat changes (for live updates)
    useEffect(() => {
      if (hasAnimated) {
        setDisplayValue(stat.value);
      }
    }, [stat.value, hasAnimated]);

    return (
      <motion.span
        key={displayValue}
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {stat.prefix}
        {formatValue(displayValue, stat.format)}
        {stat.suffix}
      </motion.span>
    );
  };

  const StatCard = ({ stat, index }: { stat: StatItem; index: number }) => {
    const Icon = stat.icon;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20, scale: isVisible ? 1 : 0.95 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        className="glass-card p-6 relative overflow-hidden hover:scale-105 transition-transform duration-300"
      >
        {/* Background decoration */}
        <div className={`absolute -top-8 -right-8 w-24 h-24 ${stat.bgColor} rounded-full blur-2xl opacity-20`} />
        
        {/* Icon */}
        <div className={`${stat.bgColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
          <Icon className={`w-6 h-6 ${stat.color}`} />
        </div>

        {/* Value */}
        <div className="text-3xl font-bold text-white mb-1">
          <AnimatedCounter stat={stat} delay={index * 100} />
        </div>

        {/* Label */}
        <div className="text-gray-400 text-sm mb-2">{stat.label}</div>

        {/* Trend */}
        {showTrends && stat.trend && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -10 }}
            transition={{ delay: index * 0.1 + 0.5 }}
            className={`flex items-center space-x-1 text-xs ${
              stat.trend.direction === 'up' ? 'text-green-400' : 'text-red-400'
            }`}
          >
            <TrendingUp className={`w-3 h-3 ${stat.trend.direction === 'down' ? 'rotate-180' : ''}`} />
            <span>{stat.trend.value}% {stat.trend.period}</span>
          </motion.div>
        )}

        {/* Live indicator for updating stats */}
        {(stat.id === 'lines-cleaned' || stat.id === 'total-users') && (
          <div className="absolute top-4 right-4">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </div>
        )}
      </motion.div>
    );
  };

  if (variant === 'horizontal') {
    return (
      <div ref={ref} className="flex overflow-x-auto space-x-6 pb-4">
        {stats.slice(0, 4).map((stat, index) => (
          <div key={stat.id} className="flex-shrink-0 w-64">
            <StatCard stat={stat} index={index} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'featured') {
    const featuredStats = stats.slice(0, 3);
    return (
      <div ref={ref} className="space-y-6">
        {/* Main featured stat */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.95 }}
          transition={{ duration: 0.8 }}
          className="glass-card p-8 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10" />
          <Sparkles className="w-16 h-16 text-primary-400 mx-auto mb-4" />
          <div className="text-5xl font-bold text-white mb-2">
            <AnimatedCounter stat={featuredStats[0]} />
          </div>
          <div className="text-xl text-gray-300 mb-4">{featuredStats[0].label}</div>
          <p className="text-gray-400">Join the community of developers transforming their code</p>
        </motion.div>

        {/* Secondary stats */}
        <div className="grid md:grid-cols-2 gap-6">
          {featuredStats.slice(1).map((stat, index) => (
            <StatCard key={stat.id} stat={stat} index={index + 1} />
          ))}
        </div>
      </div>
    );
  }

  // Default grid variant
  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={stat.id} stat={stat} index={index} />
      ))}
    </div>
  );
};

export default StatsDashboard;