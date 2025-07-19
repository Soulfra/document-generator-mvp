import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, TrendingUp, Clock, Star, DollarSign, Loader2 } from 'lucide-react';
import { AgentCard, Agent } from './AgentCard';
import { marketplaceService } from '../../services/marketplace.service';

interface MarketplaceBrowseProps {
  onAgentSelect?: (agent: Agent) => void;
  onPurchase?: (agent: Agent) => void;
}

type SortOption = 'newest' | 'popular' | 'trending' | 'price-low' | 'price-high' | 'rating';
type CategoryFilter = 'all' | 'productivity' | 'creative' | 'analysis' | 'automation' | 'general';

export const MarketplaceBrowse: React.FC<MarketplaceBrowseProps> = ({
  onAgentSelect,
  onPurchase,
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [showFilters, setShowFilters] = useState(false);
  const [purchasedAgents, setPurchasedAgents] = useState<Set<string>>(new Set());
  const [ownedAgents, setOwnedAgents] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAgents();
    loadUserData();
  }, []);

  useEffect(() => {
    filterAndSortAgents();
  }, [agents, searchQuery, sortBy, category, priceRange]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await marketplaceService.browseAgents();
      setAgents(data);
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const purchases = await marketplaceService.getUserPurchases();
      setPurchasedAgents(new Set(purchases.map(p => p.agentId)));
      
      const owned = await marketplaceService.getUserAgents();
      setOwnedAgents(new Set(owned.map(a => a.id)));
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const filterAndSortAgents = () => {
    let filtered = [...agents];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.agentCard.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (category !== 'all') {
      filtered = filtered.filter(agent => agent.agentCard.category === category);
    }

    // Price filter
    filtered = filtered.filter(agent => 
      agent.price >= priceRange[0] && agent.price <= priceRange[1]
    );

    // Sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'trending':
        // Mock trending calculation based on recent downloads
        filtered.sort((a, b) => (b.downloads / 7) - (a.downloads / 7));
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }

    setFilteredAgents(filtered);
  };

  const handlePurchase = async (agent: Agent) => {
    try {
      await marketplaceService.purchaseAgent(agent.id);
      setPurchasedAgents(prev => new Set([...prev, agent.id]));
      if (onPurchase) {
        onPurchase(agent);
      }
    } catch (error) {
      console.error('Failed to purchase agent:', error);
    }
  };

  const categories: { value: CategoryFilter; label: string; color: string }[] = [
    { value: 'all', label: 'All Categories', color: 'bg-gray-500' },
    { value: 'productivity', label: 'Productivity', color: 'bg-blue-500' },
    { value: 'creative', label: 'Creative', color: 'bg-purple-500' },
    { value: 'analysis', label: 'Analysis', color: 'bg-green-500' },
    { value: 'automation', label: 'Automation', color: 'bg-orange-500' },
    { value: 'general', label: 'General', color: 'bg-gray-500' },
  ];

  const sortOptions: { value: SortOption; label: string; icon: React.FC<any> }[] = [
    { value: 'popular', label: 'Most Popular', icon: TrendingUp },
    { value: 'newest', label: 'Newest', icon: Clock },
    { value: 'rating', label: 'Highest Rated', icon: Star },
    { value: 'price-low', label: 'Price: Low to High', icon: DollarSign },
    { value: 'price-high', label: 'Price: High to Low', icon: DollarSign },
    { value: 'trending', label: 'Trending', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agents by name, description, or tags..."
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                showFilters
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </motion.button>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4 overflow-hidden"
              >
                {/* Categories */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Category</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <motion.button
                        key={cat.value}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCategory(cat.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          category === cat.value
                            ? `${cat.color} text-white`
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {cat.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Sort By</h3>
                  <div className="flex flex-wrap gap-2">
                    {sortOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <motion.button
                          key={option.value}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSortBy(option.value)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                            sortBy === option.value
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {option.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </h3>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="flex-1"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-400 text-lg">No agents found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setCategory('all');
                setPriceRange([0, 100]);
              }}
              className="mt-4 text-indigo-400 hover:text-indigo-300"
            >
              Clear filters
            </button>
          </motion.div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-6">
              <p className="text-gray-400">
                Showing {filteredAgents.length} of {agents.length} agents
              </p>
            </div>

            {/* Agent Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredAgents.map((agent, index) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <AgentCard
                      agent={agent}
                      onPurchase={handlePurchase}
                      onDetails={onAgentSelect}
                      isPurchased={purchasedAgents.has(agent.id)}
                      isOwned={ownedAgents.has(agent.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
};