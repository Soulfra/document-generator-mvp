import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, TrendingUp, Clock, Star, DollarSign, Loader2, Zap, Package, Flame } from 'lucide-react';
import { EnergyCardPack, EnergyCard } from './types';
import { energyCardService } from '../../services/energy-card.service';

interface EnergyCardMarketplaceProps {
  onPackPurchase?: (pack: EnergyCardPack) => void;
  onCardSelect?: (card: EnergyCard) => void;
}

type SortOption = 'newest' | 'popular' | 'price-low' | 'price-high' | 'rarity';
type CategoryFilter = 'all' | 'starter' | 'premium' | 'quantum' | 'legendary';
type RarityFilter = 'all' | 'common' | 'rare' | 'epic' | 'legendary';

export const EnergyCardMarketplace: React.FC<EnergyCardMarketplaceProps> = ({
  onPackPurchase,
  onCardSelect,
}) => {
  const [packs, setPacks] = useState<EnergyCardPack[]>([]);
  const [filteredPacks, setFilteredPacks] = useState<EnergyCardPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [rarity, setRarity] = useState<RarityFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [userTokens, setUserTokens] = useState(0);
  const [purchasedPacks, setPurchasedPacks] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPacks();
    loadUserData();
  }, []);

  useEffect(() => {
    filterAndSortPacks();
  }, [packs, searchQuery, sortBy, category, rarity]);

  const loadPacks = async () => {
    try {
      setLoading(true);
      const data = await energyCardService.getAvailablePacks();
      setPacks(data);
    } catch (error) {
      console.error('Failed to load energy card packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const userData = await energyCardService.getUserData();
      setUserTokens(userData.tokens);
      setPurchasedPacks(new Set(userData.purchasedPacks));
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const filterAndSortPacks = () => {
    let filtered = [...packs];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(pack =>
        pack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pack.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pack.guaranteedTypes.some(type => type.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (category !== 'all') {
      filtered = filtered.filter(pack => pack.rarity === category);
    }

    // Rarity filter (for guaranteed cards)
    if (rarity !== 'all') {
      filtered = filtered.filter(pack => 
        pack.guaranteedRarities?.includes(rarity) || 
        (rarity === 'common' && !pack.guaranteedRarities)
      );
    }

    // Sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => (b.purchases || 0) - (a.purchases || 0));
        break;
      case 'price-low':
        filtered.sort((a, b) => a.cost - b.cost);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.cost - a.cost);
        break;
      case 'rarity':
        const rarityOrder = { 'starter': 1, 'premium': 2, 'quantum': 3, 'legendary': 4 };
        filtered.sort((a, b) => (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0));
        break;
    }

    setFilteredPacks(filtered);
  };

  const handlePurchase = async (pack: EnergyCardPack) => {
    try {
      if (userTokens < pack.cost) {
        // Show insufficient tokens error
        return;
      }

      const result = await energyCardService.purchasePack(pack.id);
      if (result.success) {
        setPurchasedPacks(prev => new Set([...prev, pack.id]));
        setUserTokens(prev => prev - pack.cost);
        
        if (onPackPurchase) {
          onPackPurchase(pack);
        }
      }
    } catch (error) {
      console.error('Failed to purchase pack:', error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'starter': return 'text-gray-400 bg-gray-500/20';
      case 'premium': return 'text-blue-400 bg-blue-500/20';
      case 'quantum': return 'text-purple-400 bg-purple-500/20';
      case 'legendary': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'starter': return Package;
      case 'premium': return Star;
      case 'quantum': return Zap;
      case 'legendary': return Flame;
      default: return Package;
    }
  };

  const categories: { value: CategoryFilter; label: string; color: string }[] = [
    { value: 'all', label: 'All Packs', color: 'bg-gray-500' },
    { value: 'starter', label: 'Starter', color: 'bg-gray-500' },
    { value: 'premium', label: 'Premium', color: 'bg-blue-500' },
    { value: 'quantum', label: 'Quantum', color: 'bg-purple-500' },
    { value: 'legendary', label: 'Legendary', color: 'bg-yellow-500' },
  ];

  const rarityFilters: { value: RarityFilter; label: string; color: string }[] = [
    { value: 'all', label: 'All Rarities', color: 'bg-gray-500' },
    { value: 'common', label: 'Common', color: 'bg-gray-500' },
    { value: 'rare', label: 'Rare', color: 'bg-blue-500' },
    { value: 'epic', label: 'Epic', color: 'bg-purple-500' },
    { value: 'legendary', label: 'Legendary', color: 'bg-yellow-500' },
  ];

  const sortOptions: { value: SortOption; label: string; icon: React.FC<any> }[] = [
    { value: 'popular', label: 'Most Popular', icon: TrendingUp },
    { value: 'newest', label: 'Newest', icon: Clock },
    { value: 'rarity', label: 'By Rarity', icon: Star },
    { value: 'price-low', label: 'Price: Low to High', icon: DollarSign },
    { value: 'price-high', label: 'Price: High to Low', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* User Stats */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-400" />
              Energy Card Marketplace
            </h1>
            <div className="flex items-center gap-4">
              <div className="bg-gray-800 px-4 py-2 rounded-lg">
                <span className="text-gray-400 text-sm">Tokens: </span>
                <span className="text-yellow-400 font-semibold">{userTokens.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search energy card packs..."
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
                {/* Pack Categories */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Pack Type</h3>
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

                {/* Card Rarities */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Guaranteed Rarity</h3>
                  <div className="flex flex-wrap gap-2">
                    {rarityFilters.map((rar) => (
                      <motion.button
                        key={rar.value}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setRarity(rar.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          rarity === rar.value
                            ? `${rar.color} text-white`
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {rar.label}
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
        ) : filteredPacks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-400 text-lg">No card packs found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setCategory('all');
                setRarity('all');
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
                Showing {filteredPacks.length} of {packs.length} card packs
              </p>
            </div>

            {/* Pack Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredPacks.map((pack, index) => {
                  const RarityIcon = getRarityIcon(pack.rarity);
                  const canAfford = userTokens >= pack.cost;
                  const isPurchased = purchasedPacks.has(pack.id);

                  return (
                    <motion.div
                      key={pack.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        group relative bg-gray-800 rounded-xl border transition-all duration-300 hover:scale-105
                        ${getRarityColor(pack.rarity)} border-current
                      `}
                    >
                      {/* Pack Image/Icon */}
                      <div className="p-6">
                        <div className={`
                          w-16 h-16 mx-auto mb-4 rounded-lg flex items-center justify-center
                          ${getRarityColor(pack.rarity)}
                        `}>
                          <RarityIcon className="w-8 h-8" />
                        </div>

                        {/* Pack Info */}
                        <div className="text-center mb-4">
                          <h3 className="text-lg font-semibold text-white mb-1">{pack.name}</h3>
                          <p className="text-sm text-gray-400 mb-2">{pack.description}</p>
                          
                          {/* Card Count */}
                          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-2">
                            <Package className="w-3 h-3" />
                            <span>{pack.cardCount} cards</span>
                          </div>

                          {/* Guaranteed Types */}
                          {pack.guaranteedTypes.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 mb-1">Guaranteed:</p>
                              <div className="flex flex-wrap gap-1 justify-center">
                                {pack.guaranteedTypes.slice(0, 3).map(type => (
                                  <span key={type} className="text-xs bg-gray-700 px-2 py-1 rounded">
                                    {type}
                                  </span>
                                ))}
                                {pack.guaranteedTypes.length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{pack.guaranteedTypes.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Price */}
                          <div className="text-center mb-4">
                            <span className="text-2xl font-bold text-yellow-400">
                              {pack.cost.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-400 ml-1">tokens</span>
                          </div>

                          {/* Purchase Button */}
                          <motion.button
                            whileHover={{ scale: canAfford && !isPurchased ? 1.02 : 1 }}
                            whileTap={{ scale: canAfford && !isPurchased ? 0.98 : 1 }}
                            onClick={() => canAfford && !isPurchased && handlePurchase(pack)}
                            disabled={!canAfford || isPurchased}
                            className={`
                              w-full py-2 px-4 rounded-lg text-sm font-medium transition-all
                              ${isPurchased 
                                ? 'bg-green-600 text-white cursor-not-allowed'
                                : canAfford
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              }
                            `}
                          >
                            {isPurchased ? 'Purchased' : canAfford ? 'Purchase Pack' : 'Insufficient Tokens'}
                          </motion.button>
                        </div>
                      </div>

                      {/* Hover Effects */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
};