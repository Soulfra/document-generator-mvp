import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  User, 
  Code, 
  Trash2, 
  TrendingUp, 
  Calendar,
  MapPin,
  Link as LinkIcon,
  Trophy,
  Star,
  Zap,
  Share2,
  ExternalLink
} from 'lucide-react';
import ShareButtons from '../Share/ShareButtons';
import CodeComparison from '../common/CodeComparison';

interface UserStats {
  totalCleanups: number;
  linesProcessed: number;
  issuesFixed: number;
  averageSizeReduction: number;
  languagesUsed: string[];
  totalSavingsGenerated: number; // in dollars saved for others
  joinDate: string;
  lastActive: string;
  rank: number;
  totalUsers: number;
}

interface UserProject {
  id: string;
  name: string;
  language: string;
  description: string;
  stats: {
    before: { lines: number; issues: number; size: string };
    after: { lines: number; issues: number; size: string };
    improvement: { percentage: number; issuesFixed: number };
  };
  date: string;
  isPublic: boolean;
}

interface UserProfileProps {
  userId: string;
  isOwnProfile?: boolean;
  variant?: 'full' | 'card' | 'mini';
}

const UserProfile = ({ userId, isOwnProfile = false, variant = 'full' }: UserProfileProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'activity'>('overview');
  const [showShareModal, setShowShareModal] = useState(false);

  // Mock user data - in real app this would come from API
  const userData = {
    name: 'Alex Chen',
    username: 'alexchen',
    avatar: 'AC',
    title: 'Senior Full Stack Developer',
    company: 'TechCorp',
    location: 'San Francisco, CA',
    website: 'https://alexchen.dev',
    bio: 'Passionate about clean code and developer experience. Building better software one commit at a time.',
    joinDate: '2024-01-15',
    isVerified: true
  };

  const userStats: UserStats = {
    totalCleanups: 47,
    linesProcessed: 234567,
    issuesFixed: 1234,
    averageSizeReduction: 32,
    languagesUsed: ['TypeScript', 'Python', 'Java', 'Go', 'Rust'],
    totalSavingsGenerated: 2340, // Hours saved for other developers
    joinDate: '2024-01-15',
    lastActive: '2 hours ago',
    rank: 12,
    totalUsers: 12847
  };

  const recentProjects: UserProject[] = [
    {
      id: '1',
      name: 'E-commerce Dashboard',
      language: 'TypeScript',
      description: 'React dashboard with complex state management',
      stats: {
        before: { lines: 12543, issues: 67, size: '2.4MB' },
        after: { lines: 8934, issues: 12, size: '1.6MB' },
        improvement: { percentage: 29, issuesFixed: 55 }
      },
      date: '2024-01-20',
      isPublic: true
    },
    {
      id: '2', 
      name: 'API Microservice',
      language: 'Python',
      description: 'FastAPI service with multiple endpoints',
      stats: {
        before: { lines: 8901, issues: 43, size: '1.8MB' },
        after: { lines: 6234, issues: 8, size: '1.3MB' },
        improvement: { percentage: 30, issuesFixed: 35 }
      },
      date: '2024-01-18',
      isPublic: true
    },
    {
      id: '3',
      name: 'Mobile App Backend',
      language: 'Java',
      description: 'Spring Boot application with JWT auth',
      stats: {
        before: { lines: 15678, issues: 89, size: '3.2MB' },
        after: { lines: 11234, issues: 15, size: '2.1MB' },
        improvement: { percentage: 28, issuesFixed: 74 }
      },
      date: '2024-01-15',
      isPublic: false
    }
  ];

  const achievements = [
    { icon: Trophy, title: 'Code Cleaner', description: '10+ cleanups completed', color: 'text-yellow-400' },
    { icon: Star, title: 'Quality Master', description: '90%+ average improvement', color: 'text-blue-400' },
    { icon: Zap, title: 'Speed Demon', description: 'Fastest cleanup times', color: 'text-purple-400' },
    { icon: TrendingUp, title: 'Top Contributor', description: 'Top 1% of users', color: 'text-green-400' }
  ];

  if (variant === 'mini') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-4"
      >
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-lg font-bold text-white">
            {userData.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-white">{userData.name}</h3>
              {userData.isVerified && <Star className="w-4 h-4 text-blue-400" />}
            </div>
            <p className="text-sm text-gray-400">{userData.title}</p>
            <div className="text-xs text-gray-500 mt-1">
              {userStats.totalCleanups} cleanups • Rank #{userStats.rank}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xl font-bold text-white">
              {userData.avatar}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">{userData.name}</h2>
                {userData.isVerified && <Star className="w-5 h-5 text-blue-400" />}
              </div>
              <p className="text-gray-400">{userData.title}</p>
              <p className="text-sm text-gray-500">{userData.company}</p>
            </div>
          </div>
          <button className="btn-secondary text-sm px-4 py-2">
            View Profile
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{userStats.totalCleanups}</div>
            <div className="text-xs text-gray-500">Cleanups</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">#{userStats.rank}</div>
            <div className="text-xs text-gray-500">Rank</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{userStats.averageSizeReduction}%</div>
            <div className="text-xs text-gray-500">Avg Reduction</div>
          </div>
        </div>

        <p className="text-sm text-gray-400">{userData.bio}</p>
      </motion.div>
    );
  }

  // Full profile variant
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 mb-8"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-3xl font-bold text-white">
            {userData.avatar}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{userData.name}</h1>
              {userData.isVerified && <Star className="w-6 h-6 text-blue-400" />}
              <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Rank #{userStats.rank}
              </div>
            </div>
            
            <p className="text-lg text-gray-300 mb-2">{userData.title}</p>
            <p className="text-gray-400 mb-4">{userData.bio}</p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{userData.location}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(userData.joinDate).toLocaleDateString()}</span>
              </div>
              {userData.website && (
                <a 
                  href={userData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 hover:text-primary-400 transition-colors"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Website</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowShareModal(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
            {isOwnProfile && (
              <button className="btn-primary">
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {userStats.linesProcessed.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Lines Processed</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {userStats.issuesFixed.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Issues Fixed</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {userStats.averageSizeReduction}%
          </div>
          <div className="text-sm text-gray-400">Avg Reduction</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {userStats.totalSavingsGenerated}h
          </div>
          <div className="text-sm text-gray-400">Time Saved</div>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 mb-8"
      >
        <h2 className="text-xl font-bold text-white mb-4">Achievements</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map((achievement, index) => {
            const Icon = achievement.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900/30 rounded-lg p-4 text-center hover:bg-gray-900/50 transition-colors"
              >
                <Icon className={`w-8 h-8 ${achievement.color} mx-auto mb-2`} />
                <div className="text-sm font-semibold text-white mb-1">
                  {achievement.title}
                </div>
                <div className="text-xs text-gray-400">
                  {achievement.description}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Projects */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <h2 className="text-xl font-bold text-white mb-6">Recent Projects</h2>
        <div className="space-y-6">
          {recentProjects.filter(p => p.isPublic || isOwnProfile).map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{project.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{project.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="font-mono text-accent-400">{project.language}</span>
                    <span>{new Date(project.date).toLocaleDateString()}</span>
                    {!project.isPublic && isOwnProfile && (
                      <span className="bg-gray-700 px-2 py-1 rounded text-xs">Private</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">
                    -{project.stats.improvement.percentage}%
                  </div>
                  <div className="text-xs text-gray-500">size reduction</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Before</div>
                  <div className="text-white">{project.stats.before.lines.toLocaleString()} lines</div>
                  <div className="text-red-400">{project.stats.before.issues} issues</div>
                </div>
                <div>
                  <div className="text-gray-400">After</div>
                  <div className="text-white">{project.stats.after.lines.toLocaleString()} lines</div>
                  <div className="text-green-400">{project.stats.after.issues} issues</div>
                </div>
                <div>
                  <div className="text-gray-400">Improvement</div>
                  <div className="text-white">{project.stats.improvement.issuesFixed} issues fixed</div>
                  <div className="text-blue-400">{project.stats.improvement.percentage}% cleaner</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Share Modal */}
      {showShareModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setShowShareModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full"
          >
            <ShareButtons
              title={`Check out ${userData.name}'s amazing code transformations!`}
              description={`${userData.name} has cleaned ${userStats.linesProcessed.toLocaleString()} lines of code and fixed ${userStats.issuesFixed} issues. See their profile and try the tool yourself!`}
              stats={{
                linesCleared: userStats.linesProcessed,
                issuesFixed: userStats.issuesFixed,
                sizeReduced: userStats.averageSizeReduction
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default UserProfile;