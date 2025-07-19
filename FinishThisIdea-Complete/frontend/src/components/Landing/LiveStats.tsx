import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Code2, Users, Zap, TrendingUp } from 'lucide-react';

interface Stats {
  linesCleanedToday: number;
  activeJobs: number;
  happyDevs: number;
  avgTime: number;
}

const LiveStats = () => {
  const [stats, setStats] = useState<Stats>({
    linesCleanedToday: 125432,
    activeJobs: 23,
    happyDevs: 10234,
    avgTime: 5.2,
  });

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        linesCleanedToday: prev.linesCleanedToday + Math.floor(Math.random() * 1000),
        activeJobs: Math.floor(Math.random() * 50) + 10,
        happyDevs: prev.happyDevs + (Math.random() > 0.7 ? 1 : 0),
        avgTime: 5 + Math.random() * 2,
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const statCards = [
    {
      icon: Code2,
      label: 'Lines Cleaned Today',
      value: formatNumber(stats.linesCleanedToday),
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/20',
    },
    {
      icon: Zap,
      label: 'Active Jobs',
      value: stats.activeJobs,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/20',
      live: true,
    },
    {
      icon: Users,
      label: 'Happy Developers',
      value: formatNumber(stats.happyDevs),
      color: 'text-green-500',
      bgColor: 'bg-green-500/20',
    },
    {
      icon: TrendingUp,
      label: 'Avg. Processing Time',
      value: `${stats.avgTime.toFixed(1)} min`,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/20',
    },
  ];

  return (
    <section className="py-24 px-6 border-t border-gray-800">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">
            Live <span className="gradient-text">Statistics</span>
          </h2>
          <p className="text-xl text-gray-400">
            Real-time data from our code cleaning engine
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 relative overflow-hidden group"
            >
              {stat.live && (
                <div className="absolute top-2 right-2">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </div>
              )}

              <div className={`${stat.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>

              <div className="text-3xl font-bold mb-1">
                <motion.span
                  key={stat.value}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {stat.value}
                </motion.span>
              </div>
              <div className="text-gray-500 text-sm">{stat.label}</div>

              {/* Background decoration */}
              <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-xl" />
            </motion.div>
          ))}
        </div>

        {/* Activity feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 glass-card p-6"
        >
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <ActivityItem
              user="Alex K."
              action="cleaned"
              detail="React project - 12,543 lines"
              time="2 minutes ago"
            />
            <ActivityItem
              user="Sarah M."
              action="transformed"
              detail="Python codebase - removed 234 unused imports"
              time="5 minutes ago"
            />
            <ActivityItem
              user="John D."
              action="organized"
              detail="Node.js API - restructured into 15 logical modules"
              time="8 minutes ago"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const ActivityItem = ({ user, action, detail, time }: {
  user: string;
  action: string;
  detail: string;
  time: string;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
  >
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-semibold">
        {user.split(' ').map(n => n[0]).join('')}
      </div>
      <div>
        <span className="font-medium">{user}</span>
        <span className="text-gray-500"> {action} </span>
        <span className="text-gray-400">{detail}</span>
      </div>
    </div>
    <span className="text-sm text-gray-600">{time}</span>
  </motion.div>
);

export default LiveStats;