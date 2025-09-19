import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, Search, SortAsc, SortDesc, Grid3X3, 
  List, Star, Zap, TrendingUp, Trophy, 
  ChevronDown, X, Eye, ShoppingCart
} from 'lucide-react';
import { EnergyCard, EnergyCardCollection } from './types';
import { MobileEnergyCard } from './MobileEnergyCard';

interface MobileEnergyCardGridProps {
  cards: EnergyCard[];
  collection?: EnergyCardCollection;
  variant?: 'collection' | 'marketplace' | 'battle-deck' | 'trading';
  isLoading?: boolean;
  onCardSelect?: (card: EnergyCard) => void;
  onCardAction?: (action: string, card: EnergyCard) => void;
  selectedCards?: string[];
  maxSelect?: number;
  showFilters?: boolean;
  showSearch?: boolean;
  className?: string;
}

interface FilterState {
  rarity: string[];
  element: string[];
  minLevel: number;
  maxLevel: number;
  priceRange: [number, number];
  tradeable: boolean | null;
  owned: boolean | null;
}

export const MobileEnergyCardGrid: React.FC<MobileEnergyCardGridProps> = ({
  cards,
  collection,
  variant = 'collection',
  isLoading = false,
  onCardSelect,
  onCardAction,
  selectedCards = [],
  maxSelect,
  showFilters = true,
  showSearch = true,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'level' | 'rarity' | 'power' | 'value'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    rarity: [],
    element: [],
    minLevel: 1,
    maxLevel: 100,
    priceRange: [0, 10000],
    tradeable: null,
    owned: null,
  });

  const rarities = ['common', 'rare', 'epic', 'legendary'];
  const elements = ['session', 'auth', 'storage', 'realtime', 'compute', 'data', 'network', 'system'];

  // Filter and sort cards
  const filteredAndSortedCards = useMemo(() => {
    let filtered = cards.filter(card => {
      // Search filter
      if (searchQuery && !card.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !card.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Rarity filter
      if (filters.rarity.length > 0 && !filters.rarity.includes(card.rarity)) {
        return false;
      }

      // Element filter
      if (filters.element.length > 0 && !filters.element.includes(card.element)) {
        return false;
      }

      // Level range
      if (card.level < filters.minLevel || card.level > filters.maxLevel) {
        return false;
      }

      // Price range (marketplace variant)
      if (variant === 'marketplace' && 
          (card.marketValue < filters.priceRange[0] || card.marketValue > filters.priceRange[1])) {
        return false;
      }

      // Tradeable filter
      if (filters.tradeable !== null && card.tradeable !== filters.tradeable) {
        return false;
      }

      // Owned filter (marketplace variant)
      if (variant === 'marketplace' && filters.owned !== null) {
        const isOwned = collection?.cards.some(c => c.id === card.id) || false;
        if (isOwned !== filters.owned) {
          return false;
        }
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'level':
          aValue = a.level;
          bValue = b.level;
          break;
        case 'rarity':
          const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
          aValue = rarityOrder[a.rarity as keyof typeof rarityOrder];
          bValue = rarityOrder[b.rarity as keyof typeof rarityOrder];
          break;
        case 'power':
          aValue = a.power || 0;
          bValue = b.power || 0;
          break;
        case 'value':
          aValue = a.marketValue;
          bValue = b.marketValue;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [cards, searchQuery, sortBy, sortOrder, filters, collection, variant]);

  const handleCardSelect = (card: EnergyCard) => {
    if (maxSelect && selectedCards.length >= maxSelect && !selectedCards.includes(card.id)) {
      return;
    }
    onCardSelect?.(card);
  };

  const handleQuickAction = (action: 'buy' | 'trade' | 'use' | 'view', card: EnergyCard) => {
    onCardAction?.(action, card);
  };

  const getCardVariant = () => {
    switch (variant) {
      case 'marketplace': return 'marketplace';
      case 'battle-deck': return 'battle';
      case 'trading': return 'detailed';
      default: return viewMode === 'list' ? 'compact' : 'detailed';
    }
  };

  const resetFilters = () => {
    setFilters({
      rarity: [],
      element: [],
      minLevel: 1,
      maxLevel: 100,
      priceRange: [0, 10000],
      tradeable: null,
      owned: null,
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.rarity.length > 0) count++;
    if (filters.element.length > 0) count++;
    if (filters.minLevel > 1 || filters.maxLevel < 100) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) count++;
    if (filters.tradeable !== null) count++;
    if (filters.owned !== null) count++;
    return count;
  }, [filters]);

  if (isLoading) {
    return (
      <div className="min-h-64 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"
          />
          <p className="text-gray-400">Loading energy cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mobile Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {variant === 'marketplace' ? 'Card Marketplace' :
             variant === 'battle-deck' ? 'Battle Deck' :
             variant === 'trading' ? 'Trading Cards' : 'My Collection'}
          </h2>
          <p className="text-sm text-gray-400">
            {filteredAndSortedCards.length} of {cards.length} cards
            {maxSelect && ` • ${selectedCards.length}/${maxSelect} selected`}
          </p>
        </div>

        {/* View Toggle */}
        {variant === 'collection' && (
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="space-y-3">
          {/* Search Bar */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Filter and Sort Controls */}
          {showFilters && (
            <div className="flex space-x-2">
              {/* Filter Button */}
              <button
                onClick={() => setShowFilterPanel(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-');
                    setSortBy(newSortBy as any);
                    setSortOrder(newSortOrder as any);
                  }}
                  className="appearance-none px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white pr-8"
                >
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="level-desc">Level High-Low</option>
                  <option value="level-asc">Level Low-High</option>
                  <option value="rarity-desc">Rarity High-Low</option>
                  <option value="rarity-asc">Rarity Low-High</option>
                  <option value="power-desc">Power High-Low</option>
                  <option value="power-asc">Power Low-High</option>
                  {variant === 'marketplace' && (
                    <>
                      <option value="value-desc">Price High-Low</option>
                      <option value="value-asc">Price Low-High</option>
                    </>
                  )}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Card Grid */}
      <div className={`
        ${viewMode === 'grid' && variant !== 'battle-deck' 
          ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' 
          : 'space-y-3'
        }
      `}>
        <AnimatePresence>
          {filteredAndSortedCards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <MobileEnergyCard
                card={card}
                variant={getCardVariant()}
                onCardTap={handleCardSelect}
                onQuickAction={handleQuickAction}
                showQuickActions={variant === 'marketplace' || variant === 'trading'}
                isSelected={selectedCards.includes(card.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredAndSortedCards.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No cards found</h3>
          <p className="text-gray-400 mb-4">
            {searchQuery || activeFilterCount > 0 
              ? 'Try adjusting your search or filters' 
              : 'Start collecting energy cards to see them here'}
          </p>
          {(searchQuery || activeFilterCount > 0) && (
            <button
              onClick={() => {
                setSearchQuery('');
                resetFilters();
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Filter Panel Modal */}
      <AnimatePresence>
        {showFilterPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-gray-900 rounded-t-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Filters</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={resetFilters}
                    className="text-sm text-indigo-400"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowFilterPanel(false)}
                    className="p-1 text-gray-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Filter Content */}
              <div className="p-4 space-y-6">
                {/* Rarity Filter */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Rarity</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {rarities.map(rarity => (
                      <label key={rarity} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.rarity.includes(rarity)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                rarity: [...prev.rarity, rarity]
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                rarity: prev.rarity.filter(r => r !== rarity)
                              }));
                            }
                          }}
                          className="text-indigo-600"
                        />
                        <span className="text-sm text-white capitalize">{rarity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Element Filter */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Element</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {elements.map(element => (
                      <label key={element} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.element.includes(element)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                element: [...prev.element, element]
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                element: prev.element.filter(el => el !== element)
                              }));
                            }
                          }}
                          className="text-indigo-600"
                        />
                        <span className="text-sm text-white capitalize">{element}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Level Range */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Level Range</h4>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={filters.minLevel}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        minLevel: parseInt(e.target.value) || 1
                      }))}
                      className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={filters.maxLevel}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        maxLevel: parseInt(e.target.value) || 100
                      }))}
                      className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                    />
                  </div>
                </div>

                {/* Additional Filters */}
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.tradeable === true}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        tradeable: e.target.checked ? true : null
                      }))}
                      className="text-indigo-600"
                    />
                    <span className="text-sm text-white">Tradeable only</span>
                  </label>

                  {variant === 'marketplace' && (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.owned === false}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          owned: e.target.checked ? false : null
                        }))}
                        className="text-indigo-600"
                      />
                      <span className="text-sm text-white">Not owned</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-700">
                <button
                  onClick={() => setShowFilterPanel(false)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                >
                  Apply Filters ({filteredAndSortedCards.length} cards)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};