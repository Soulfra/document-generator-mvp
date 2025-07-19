import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, 
  TrendingUp, 
  Users, 
  Zap, 
  Star, 
  Crown, 
  Target,
  DollarSign,
  Calendar,
  Trophy,
  ArrowRight,
  Copy,
  Share2,
  TwitterIcon,
  LinkedinIcon
} from 'lucide-react';
import { ReferralCode } from './ReferralCode';
import { ReferralStats } from './ReferralStats';

interface ReferralData {
  totalReferrals: number;
  successfulConversions: number;
  totalEarnings: number;
  monthlyEarnings: number;
  conversionRate: number;
  rank: number;
  referralCode: string;
  recentActivity: Array<{
    id: string;
    username: string;
    action: string;
    timestamp: Date;
    status: 'completed' | 'pending' | 'processing';
    earnings: number;
  }>;
  leaderboard: Array<{
    rank: number;
    username: string;
    referrals: number;
    earnings: number;
    badge: 'crown' | 'star' | 'medal' | null;
  }>;
}

interface TabProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabNavigation: React.FC<TabProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'performance', label: 'Performance', icon: Target },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            <Icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

const OverviewTab: React.FC<{ data: ReferralData }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Referrals</p>
              <p className="text-2xl font-bold">{data.totalReferrals}</p>
            </div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Conversions</p>
              <p className="text-2xl font-bold">{data.successfulConversions}</p>
            </div>
            <Target className="w-8 h-8 text-green-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Total Earnings</p>
              <p className="text-2xl font-bold">${data.totalEarnings}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-pink-500 to-red-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm">Conversion Rate</p>
              <p className="text-2xl font-bold">{data.conversionRate}%</p>
            </div>
            <Zap className="w-8 h-8 text-pink-200" />
          </div>
        </motion.div>
      </div>

      {/* Referral Code Section */}
      <ReferralCode 
        code={data.referralCode}
        variant="card"
        shares={data.totalReferrals}
      />

      {/* Recent Activity */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {data.recentActivity.slice(0, 5).map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                <div className={`
                  w-2 h-2 rounded-full
                  ${activity.status === 'completed' ? 'bg-green-400' : 
                    activity.status === 'processing' ? 'bg-yellow-400' : 'bg-gray-400'}
                `} />
                <div>
                  <p className="text-sm font-medium">{activity.username} {activity.action}</p>
                  <p className="text-xs text-gray-500">
                    {activity.timestamp.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-600">
                  +${activity.earnings}
                </p>
                <p className="text-xs text-gray-500 capitalize">{activity.status}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        {data.recentActivity.length > 5 && (
          <button className="mt-4 text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center">
            View all activity <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        )}
      </div>
    </div>
  );
};

const PerformanceTab: React.FC<{ data: ReferralData }> = ({ data }) => {
  const channels = [
    { name: 'Twitter', referrals: 45, conversion: 78, color: 'bg-blue-500' },
    { name: 'Direct Share', referrals: 32, conversion: 85, color: 'bg-green-500' },
    { name: 'LinkedIn', referrals: 28, conversion: 72, color: 'bg-indigo-500' },
    { name: 'Other', referrals: 15, conversion: 65, color: 'bg-gray-500' },
  ];

  const tips = [
    {
      title: 'Share on Social Media',
      description: 'Twitter and LinkedIn have the highest conversion rates',
      icon: Share2,
      color: 'text-blue-600',
    },
    {
      title: 'Personal Touch',
      description: 'Add a personal message when sharing your referral code',
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: 'Follow Up',
      description: 'Check in with your referrals to see if they need help',
      icon: Zap,
      color: 'text-yellow-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Performance Charts */}
      <ReferralStats userId="current-user" />

      {/* Channel Performance */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Channel Performance</h3>
        <div className="space-y-4">
          {channels.map((channel, index) => (
            <motion.div
              key={channel.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${channel.color}`} />
                <span className="font-medium">{channel.name}</span>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <span>{channel.referrals} referrals</span>
                <span className="font-medium text-green-600">{channel.conversion}% conversion</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tips for Success */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Tips for Success</h3>
        <div className="grid gap-4">
          {tips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <motion.div
                key={tip.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg"
              >
                <Icon className={`w-5 h-5 mt-0.5 ${tip.color}`} />
                <div>
                  <h4 className="font-medium text-gray-900">{tip.title}</h4>
                  <p className="text-sm text-gray-600">{tip.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const LeaderboardTab: React.FC<{ data: ReferralData }> = ({ data }) => {
  const getBadgeIcon = (badge: string | null, rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Star className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Trophy className="w-5 h-5 text-orange-500" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* User Rank */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Your Current Rank</h3>
            <p className="text-purple-100">Out of all referrers</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">#{data.rank}</p>
            <p className="text-purple-100">{data.totalReferrals} referrals</p>
          </div>
        </div>
      </motion.div>

      {/* Leaderboard */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Top Referrers</h3>
          <p className="text-gray-600">See how you stack up against other users</p>
        </div>
        <div className="divide-y divide-gray-100">
          {data.leaderboard.map((user, index) => (
            <motion.div
              key={user.username}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                p-4 flex items-center justify-between
                ${user.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}
                ${user.rank === data.rank ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
              `}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-8 h-8">
                  {getBadgeIcon(user.badge, user.rank) || (
                    <span className="text-lg font-bold text-gray-600">#{user.rank}</span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {user.username}
                    {user.rank === data.rank && <span className="ml-2 text-blue-600">(You)</span>}
                  </p>
                  <p className="text-sm text-gray-600">{user.referrals} successful referrals</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">${user.earnings}</p>
                <p className="text-sm text-gray-500">earned</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Achievement Milestones */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Next Milestones</h3>
        <div className="space-y-4">
          {[
            { referrals: 25, reward: '$25 bonus', completed: data.totalReferrals >= 25 },
            { referrals: 50, reward: '$75 bonus', completed: data.totalReferrals >= 50 },
            { referrals: 100, reward: '$200 bonus', completed: data.totalReferrals >= 100 },
          ].map((milestone, index) => (
            <div
              key={milestone.referrals}
              className={`
                flex items-center justify-between p-4 rounded-lg border-2 transition-all
                ${milestone.completed 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-gray-50'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <div className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center
                  ${milestone.completed 
                    ? 'border-green-500 bg-green-500' 
                    : 'border-gray-300'
                  }
                `}>
                  {milestone.completed && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="font-medium">
                  {milestone.referrals} referrals
                </span>
              </div>
              <div className="text-right">
                <span className={`
                  font-medium
                  ${milestone.completed ? 'text-green-600' : 'text-gray-600'}
                `}>
                  {milestone.reward}
                </span>
                {milestone.completed && (
                  <p className="text-sm text-green-600">Completed!</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ReferralDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const fetchData = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setData({
        totalReferrals: 42,
        successfulConversions: 33,
        totalEarnings: 147.50,
        monthlyEarnings: 89.25,
        conversionRate: 78.6,
        rank: 8,
        referralCode: 'CLEAN42FREE',
        recentActivity: [
          {
            id: '1',
            username: 'alex_dev',
            action: 'signed up using your code',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            status: 'completed',
            earnings: 5.50,
          },
          {
            id: '2',
            username: 'sarah_designer',
            action: 'completed first cleanup',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            status: 'completed',
            earnings: 3.25,
          },
          {
            id: '3',
            username: 'mike_startup',
            action: 'signed up using your code',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            status: 'processing',
            earnings: 5.50,
          },
        ],
        leaderboard: [
          { rank: 1, username: 'referral_king', referrals: 127, earnings: 892.75, badge: 'crown' },
          { rank: 2, username: 'code_queen', referrals: 98, earnings: 687.50, badge: 'star' },
          { rank: 3, username: 'dev_master', referrals: 84, earnings: 546.25, badge: 'medal' },
          { rank: 4, username: 'tech_guru', referrals: 76, earnings: 498.50, badge: null },
          { rank: 5, username: 'startup_hero', referrals: 69, earnings: 423.75, badge: null },
          { rank: 6, username: 'clean_machine', referrals: 58, earnings: 384.25, badge: null },
          { rank: 7, username: 'quality_first', referrals: 51, earnings: 312.50, badge: null },
          { rank: 8, username: 'You', referrals: 42, earnings: 147.50, badge: null },
        ],
      });
      
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center">
        <p className="text-gray-600">Failed to load referral data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Referral Dashboard</h1>
          <p className="text-gray-600">Track your referrals and earn rewards</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">This month</p>
            <p className="text-lg font-semibold text-green-600">${data.monthlyEarnings}</p>
          </div>
          <Gift className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && <OverviewTab data={data} />}
          {activeTab === 'performance' && <PerformanceTab data={data} />}
          {activeTab === 'leaderboard' && <LeaderboardTab data={data} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};