import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  ArrowUp,
  ArrowDown,
  Target,
  Clock,
  Award
} from 'lucide-react';

interface ReferralStatsProps {
  userId: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

interface StatsData {
  overview: {
    totalReferrals: number;
    successfulConversions: number;
    conversionRate: number;
    totalEarnings: number;
    monthlyEarnings: number;
    avgEarningsPerReferral: number;
  };
  trends: {
    referrals: { current: number; previous: number; change: number };
    conversions: { current: number; previous: number; change: number };
    earnings: { current: number; previous: number; change: number };
  };
  timeline: Array<{
    date: string;
    referrals: number;
    conversions: number;
    earnings: number;
  }>;
  funnel: Array<{
    stage: string;
    count: number;
    percentage: number;
    color: string;
  }>;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<any>;
  color: string;
  format?: 'number' | 'currency' | 'percentage';
}> = ({ title, value, change, icon: Icon, color, format = 'number' }) => {
  const formatValue = (val: string | number) => {
    if (format === 'currency') {
      return typeof val === 'number' ? `$${val.toFixed(2)}` : val;
    }
    if (format === 'percentage') {
      return typeof val === 'number' ? `${val.toFixed(1)}%` : val;
    }
    return val;
  };

  const getChangeColor = (change?: number) => {
    if (!change) return 'text-gray-500';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change?: number) => {
    if (!change) return null;
    return change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-6 shadow-sm border"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
          </div>
        </div>
        {change !== undefined && (
          <div className={`flex items-center space-x-1 ${getChangeColor(change)}`}>
            {getChangeIcon(change)}
            <span className="text-sm font-medium">
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ConversionFunnel: React.FC<{ data: StatsData['funnel'] }> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Target className="w-5 h-5 mr-2 text-blue-600" />
        Conversion Funnel
      </h3>
      <div className="space-y-4">
        {data.map((stage, index) => (
          <motion.div
            key={stage.stage}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{stage.count}</span>
                <span className="text-xs text-gray-500">({stage.percentage}%)</span>
              </div>
            </div>
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stage.percentage}%` }}
                transition={{ duration: 1, delay: index * 0.2 }}
                className={`h-full rounded-full ${stage.color}`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const TimelineChart: React.FC<{ data: StatsData['timeline'] }> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => Math.max(d.referrals, d.conversions, d.earnings * 10)));

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Calendar className="w-5 h-5 mr-2 text-blue-600" />
        Performance Timeline
      </h3>
      <div className="space-y-4">
        {data.slice(-7).map((item, index) => (
          <motion.div
            key={item.date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-4"
          >
            <div className="w-16 text-xs text-gray-500">
              {new Date(item.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Referrals</span>
                <span className="text-xs font-medium">{item.referrals}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.referrals / maxValue) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Conversions</span>
                <span className="text-xs font-medium">{item.conversions}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.conversions / maxValue) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                  className="h-full bg-green-500 rounded-full"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Earnings</span>
                <span className="text-xs font-medium">${item.earnings}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.earnings * 10 / maxValue) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.4 }}
                  className="h-full bg-yellow-500 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const ReferralStats: React.FC<ReferralStatsProps> = ({ 
  userId, 
  timeRange = '30d' 
}) => {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data
      setData({
        overview: {
          totalReferrals: 42,
          successfulConversions: 33,
          conversionRate: 78.6,
          totalEarnings: 147.50,
          monthlyEarnings: 89.25,
          avgEarningsPerReferral: 3.51,
        },
        trends: {
          referrals: { current: 12, previous: 8, change: 50.0 },
          conversions: { current: 9, previous: 7, change: 28.6 },
          earnings: { current: 42.75, previous: 31.50, change: 35.7 },
        },
        timeline: [
          { date: '2024-01-01', referrals: 3, conversions: 2, earnings: 7.50 },
          { date: '2024-01-02', referrals: 5, conversions: 4, earnings: 12.25 },
          { date: '2024-01-03', referrals: 2, conversions: 1, earnings: 3.75 },
          { date: '2024-01-04', referrals: 7, conversions: 6, earnings: 18.50 },
          { date: '2024-01-05', referrals: 4, conversions: 3, earnings: 11.25 },
          { date: '2024-01-06', referrals: 6, conversions: 5, earnings: 15.75 },
          { date: '2024-01-07', referrals: 8, conversions: 6, earnings: 21.50 },
        ],
        funnel: [
          { stage: 'Link Clicks', count: 156, percentage: 100, color: 'bg-blue-500' },
          { stage: 'Page Views', count: 134, percentage: 86, color: 'bg-indigo-500' },
          { stage: 'Sign Ups', count: 42, percentage: 27, color: 'bg-purple-500' },
          { stage: 'Conversions', count: 33, percentage: 21, color: 'bg-green-500' },
          { stage: 'Paid Users', count: 28, percentage: 18, color: 'bg-yellow-500' },
        ],
      });
      
      setLoading(false);
    };

    fetchStats();
  }, [userId, timeRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Failed to load referral statistics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Referrals"
          value={data.overview.totalReferrals}
          change={data.trends.referrals.change}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Conversion Rate"
          value={data.overview.conversionRate}
          change={data.trends.conversions.change}
          icon={Target}
          color="bg-green-500"
          format="percentage"
        />
        <StatCard
          title="Monthly Earnings"
          value={data.overview.monthlyEarnings}
          change={data.trends.earnings.change}
          icon={DollarSign}
          color="bg-yellow-500"
          format="currency"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Earnings"
          value={data.overview.totalEarnings}
          icon={Award}
          color="bg-purple-500"
          format="currency"
        />
        <StatCard
          title="Successful Conversions"
          value={data.overview.successfulConversions}
          icon={TrendingUp}
          color="bg-indigo-500"
        />
        <StatCard
          title="Avg. per Referral"
          value={data.overview.avgEarningsPerReferral}
          icon={Clock}
          color="bg-pink-500"
          format="currency"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConversionFunnel data={data.funnel} />
        <TimelineChart data={data.timeline} />
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Best Performing Day</h4>
            <p className="text-sm text-green-700">
              January 7th with 8 referrals and $21.50 earned
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Conversion Tip</h4>
            <p className="text-sm text-blue-700">
              Your conversion rate is 15% above average! Keep sharing personal messages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};