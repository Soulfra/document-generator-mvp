import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Users, 
  Crown, 
  Star,
  MapPin,
  Code,
  ArrowLeft
} from 'lucide-react';
import { useLeaderboard } from '../hooks/useApi';
import UserProfile from '../components/Profile/UserProfile';
import StatsCard from '../components/Share/StatsCard';
import { formatNumber } from '../utils';

const ProfilesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'top' | 'recent' | 'local'>('all');
  const [sortBy, setSortBy] = useState<'rank' | 'cleanups' | 'recent'>('rank');
  const { data: leaderboard, loading } = useLeaderboard('all-time');

  // Mock user data - in real app this would come from API
  const mockUsers = [
    {
      id: '1',
      username: 'alexchen',
      name: 'Alex Chen',
      avatar: 'AC',
      title: 'Senior Full Stack Developer',
      company: 'TechCorp',
      location: 'San Francisco, CA',
      bio: 'Passionate about clean code and developer experience.',
      rank: 1,
      stats: {
        totalCleanups: 89,
        linesProcessed: 450000,
        averageImprovement: 34,
        streak: 45
      },
      isVerified: true,
      badges: ['🏆', '⚡', '🔥']
    },
    {
      id: '2',
      username: 'sarahrodriguez',
      name: 'Sarah Rodriguez',
      avatar: 'SR',
      title: 'CTO @ StartupXYZ',
      company: 'StartupXYZ',
      location: 'Austin, TX',
      bio: 'Building scalable systems and mentoring developers.',
      rank: 2,
      stats: {
        totalCleanups: 76,
        linesProcessed: 380000,
        averageImprovement: 31,
        streak: 23
      },
      isVerified: true,
      badges: ['⭐', '🚀']
    },
    {
      id: '3',
      username: 'mikejohnson',
      name: 'Mike Johnson',
      avatar: 'MJ',
      title: 'Full Stack Developer',
      company: 'FreelanceWorks',
      location: 'New York, NY',
      bio: 'Love turning messy code into beautiful, maintainable systems.',
      rank: 3,
      stats: {
        totalCleanups: 68,
        linesProcessed: 340000,
        averageImprovement: 29,
        streak: 12
      },
      isVerified: false,
      badges: ['💎', '🎯']
    },
    {
      id: '4',
      username: 'emmawilson',
      name: 'Emma Wilson',
      avatar: 'EW',
      title: 'Lead Engineer @ DevShop',
      company: 'DevShop',
      location: 'Seattle, WA',
      bio: 'Advocating for clean code practices and team collaboration.',
      rank: 4,
      stats: {
        totalCleanups: 52,
        linesProcessed: 260000,
        averageImprovement: 27,
        streak: 8
      },
      isVerified: true,
      badges: ['🌟', '💻']
    },
    {
      id: '5',
      username: 'davidliu',
      name: 'David Liu',
      avatar: 'DL',
      title: 'Software Architect',
      company: 'BigTech Inc',
      location: 'Los Angeles, CA',
      bio: 'Designing clean architecture and promoting best practices.',
      rank: 5,
      stats: {
        totalCleanups: 45,
        linesProcessed: 225000,
        averageImprovement: 25,
        streak: 15
      },
      isVerified: true,
      badges: ['🏅', '⚡']
    },
    {
      id: '6',
      username: 'rachelgreen',
      name: 'Rachel Green',
      avatar: 'RG',
      title: 'Python Developer',
      company: 'DataCorp',
      location: 'Chicago, IL',
      bio: 'Specializing in data engineering and clean Python code.',
      rank: 6,
      stats: {
        totalCleanups: 38,
        linesProcessed: 190000,
        averageImprovement: 23,
        streak: 6
      },
      isVerified: false,
      badges: ['🐍', '📊']
    }
  ];

  const filteredUsers = mockUsers.filter(user => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.title.toLowerCase().includes(query) ||
        user.company?.toLowerCase().includes(query)
      );
    }
    return true;
  }).filter(user => {
    switch (filterBy) {
      case 'top':
        return user.rank <= 10;
      case 'recent':
        return user.stats.streak > 0;
      case 'local':
        return user.location?.includes('CA'); // Mock local filter
      default:
        return true;
    }
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case 'cleanups':
        return b.stats.totalCleanups - a.stats.totalCleanups;
      case 'recent':
        return b.stats.streak - a.stats.streak;
      default:
        return a.rank - b.rank;
    }
  });

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" />
        <div className="absolute bottom-1/4 -right-4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float animation-delay-400" />
      </div>

      {/* Navigation */}
      <nav className="px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <Link to="/upload" className="btn-primary text-sm px-4 py-2">
            Join the Community
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Developer <span className="gradient-text">Profiles</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Discover amazing developers who've transformed their code
          </p>
          
          <div className="flex justify-center space-x-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white">{formatNumber(12847)}</div>
              <div className="text-sm text-gray-500">Developers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-400">{formatNumber(234567)}</div>
              <div className="text-sm text-gray-500">Lines Cleaned</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent-400">89</div>
              <div className="text-sm text-gray-500">Countries</div>
            </div>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search developers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as any)}
                  className="bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="all">All Developers</option>
                  <option value="top">Top 10</option>
                  <option value="recent">Recently Active</option>
                  <option value="local">Local (CA)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="rank">By Rank</option>
                  <option value="cleanups">By Cleanups</option>
                  <option value="recent">By Activity</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Profile List */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {loading ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="glass-card p-6 animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                sortedUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-6 hover:scale-[1.02] transition-transform"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Rank */}
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                        ${user.rank === 1 
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-gray-900' 
                          : user.rank <= 3 
                            ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-white'
                            : 'bg-gray-700 text-gray-300'
                        }
                      `}>
                        {user.rank <= 3 && user.rank === 1 ? (
                          <Crown className="w-4 h-4" />
                        ) : (
                          user.rank
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xl font-bold text-white">
                        {user.avatar}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Link
                            to={`/profile/${user.username}`}
                            className="text-lg font-bold text-white hover:text-primary-400 transition-colors"
                          >
                            {user.name}
                          </Link>
                          {user.isVerified && <Star className="w-4 h-4 text-blue-400" />}
                          <div className="flex space-x-1">
                            {user.badges.map((badge, i) => (
                              <span key={i} className="text-sm">{badge}</span>
                            ))}
                          </div>
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-1">{user.title}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{user.company}</span>
                          <span>•</span>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{user.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-white mb-1">
                          {user.stats.totalCleanups}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">cleanups</div>
                        
                        <div className="text-sm text-primary-400">
                          {formatNumber(user.stats.linesProcessed)} lines
                        </div>
                        
                        {user.stats.streak > 0 && (
                          <div className="text-xs text-orange-400 mt-1">
                            🔥 {user.stats.streak} day streak
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}

              {!loading && sortedUsers.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No developers found</h3>
                  <p className="text-gray-400">Try adjusting your search or filters</p>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <StatsCard variant="detailed" />
            </motion.div>

            {/* Top Languages */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Popular Languages</h3>
              <div className="space-y-3">
                {[
                  { name: 'JavaScript', percentage: 34, color: 'bg-yellow-500' },
                  { name: 'TypeScript', percentage: 28, color: 'bg-blue-500' },
                  { name: 'Python', percentage: 22, color: 'bg-green-500' },
                  { name: 'Java', percentage: 16, color: 'bg-orange-500' },
                ].map((lang, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{lang.name}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-800 rounded-full h-2">
                        <div
                          className={`${lang.color} h-2 rounded-full`}
                          style={{ width: `${lang.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{lang.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Join CTA */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-6 text-center"
            >
              <Code className="w-12 h-12 text-primary-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Join the Community</h3>
              <p className="text-sm text-gray-400 mb-4">
                Start cleaning your code and climb the leaderboard!
              </p>
              <Link to="/upload" className="btn-primary w-full">
                Get Started for $1
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilesPage;