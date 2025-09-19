import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Star, Zap, Gift, ShoppingCart, 
  Eye, TrendingUp, Users, Clock, Sparkles,
  ChevronRight, Lock, Unlock, Trophy
} from 'lucide-react';
import { EnergyCardPack, EnergyCard } from './types';

interface MobileEnergyCardPackProps {
  pack: EnergyCardPack;
  onPurchase?: (pack: EnergyCardPack) => void;
  onPreview?: (pack: EnergyCardPack) => void;
  userTokens?: number;
  variant?: 'marketplace' | 'owned' | 'preview';
  isLoading?: boolean;
  className?: string;
}

interface PackOpeningModalProps {
  isOpen: boolean;
  pack: EnergyCardPack;
  revealedCards?: EnergyCard[];
  onClose: () => void;
  isRevealing?: boolean;
}

export const MobileEnergyCardPack: React.FC<MobileEnergyCardPackProps> = ({
  pack,
  onPurchase,
  onPreview,
  userTokens = 0,
  variant = 'marketplace',
  isLoading = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'starter': return 'border-green-400 bg-green-500/5';
      case 'premium': return 'border-blue-400 bg-blue-500/5';
      case 'quantum': return 'border-purple-400 bg-purple-500/5';
      case 'legendary': return 'border-yellow-400 bg-yellow-500/5';
      default: return 'border-gray-400 bg-gray-500/5';
    }
  };

  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'starter': return 'from-green-400/20 to-green-600/20';
      case 'premium': return 'from-blue-400/20 to-blue-600/20';
      case 'quantum': return 'from-purple-400/20 to-purple-600/20';
      case 'legendary': return 'from-yellow-400/20 to-yellow-600/20';
      default: return 'from-gray-400/20 to-gray-600/20';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'starter': return '📦';
      case 'premium': return '💎';
      case 'quantum': return '🌌';
      case 'legendary': return '👑';
      default: return '📦';
    }
  };

  const canAfford = userTokens >= pack.cost;

  const handlePurchase = () => {
    if (canAfford && !isLoading) {
      onPurchase?.(pack);
    }
  };

  const handlePreview = () => {
    onPreview?.(pack);
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={`
        relative p-4 rounded-xl border backdrop-blur-sm
        ${getRarityColor(pack.rarity)}
        ${className}
      `}
    >
      {/* Pack Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`
            w-12 h-12 rounded-xl bg-gradient-to-br ${getRarityGradient(pack.rarity)} 
            flex items-center justify-center text-2xl border border-current
          `}>
            {getRarityIcon(pack.rarity)}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white">{pack.name}</h3>
            <p className="text-sm text-gray-400 capitalize">{pack.rarity} Pack</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-bold text-white">
            💎{pack.cost}
          </div>
          <div className="text-xs text-gray-400">
            {pack.cardCount} cards
          </div>
        </div>
      </div>

      {/* Pack Stats */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center p-2 bg-gray-800/50 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Cards</div>
          <div className="text-sm font-semibold text-white">{pack.cardCount}</div>
        </div>
        <div className="text-center p-2 bg-gray-800/50 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Sold</div>
          <div className="text-sm font-semibold text-white">{pack.purchases || 0}</div>
        </div>
        <div className="text-center p-2 bg-gray-800/50 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Rarity</div>
          <div className="text-sm font-semibold text-white capitalize">{pack.rarity}</div>
        </div>
      </div>

      {/* Pack Description */}
      <p className="text-sm text-gray-300 mb-3">{pack.description}</p>

      {/* Guaranteed Cards */}
      {pack.guaranteedTypes.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">Guaranteed Types:</div>
          <div className="flex flex-wrap gap-1">
            {pack.guaranteedTypes.slice(0, 3).map((type, index) => (
              <span key={index} className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">
                {type}
              </span>
            ))}
            {pack.guaranteedTypes.length > 3 && (
              <span className="text-xs text-gray-400">
                +{pack.guaranteedTypes.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Guaranteed Rarities */}
      {pack.guaranteedRarities && pack.guaranteedRarities.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">Guaranteed Rarities:</div>
          <div className="flex space-x-1">
            {pack.guaranteedRarities.map((rarity, index) => (
              <span key={index} className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded capitalize">
                {rarity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {variant === 'marketplace' && (
          <>
            <div className="flex space-x-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handlePreview}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium flex items-center justify-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handlePurchase}
                disabled={!canAfford || isLoading}
                className={`
                  flex-1 py-3 rounded-lg text-sm font-medium flex items-center justify-center space-x-2
                  ${canAfford && !isLoading
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Buy</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Affordability Status */}
            {!canAfford && (
              <div className="flex items-center justify-center space-x-1 text-xs text-red-400">
                <Lock className="w-3 h-3" />
                <span>Need {pack.cost - userTokens} more tokens</span>
              </div>
            )}
          </>
        )}

        {variant === 'owned' && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onPurchase?.(pack)}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center justify-center space-x-2"
          >
            <Gift className="w-4 h-4" />
            <span>Open Pack</span>
          </motion.button>
        )}

        {variant === 'preview' && (
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">Preview Mode</div>
            <div className="text-sm text-indigo-400">Tap cards to see details</div>
          </div>
        )}
      </div>

      {/* Popular Badge */}
      {pack.purchases && pack.purchases > 1000 && (
        <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
          Popular!
        </div>
      )}

      {/* New Badge */}
      {pack.createdAt && new Date().getTime() - pack.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000 && (
        <div className="absolute -top-2 -left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          New!
        </div>
      )}
    </motion.div>
  );
};

export const PackOpeningModal: React.FC<PackOpeningModalProps> = ({
  isOpen,
  pack,
  revealedCards = [],
  onClose,
  isRevealing = false,
}) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAllCards, setShowAllCards] = useState(false);

  const handleNextCard = () => {
    if (currentCardIndex < revealedCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      setShowAllCards(true);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-400/20 to-gray-600/20';
      case 'rare': return 'from-blue-400/20 to-blue-600/20';
      case 'epic': return 'from-purple-400/20 to-purple-600/20';
      case 'legendary': return 'from-yellow-400/20 to-yellow-600/20';
      default: return 'from-gray-400/20 to-gray-600/20';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-xl w-full max-w-md"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-700 text-center">
            <h2 className="text-xl font-bold text-white">Pack Opening</h2>
            <p className="text-sm text-gray-400">{pack.name}</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {isRevealing ? (
              <div className="text-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-xl flex items-center justify-center text-4xl border-2 border-purple-400"
                >
                  📦
                </motion.div>
                <div className="text-white font-medium mb-2">Opening pack...</div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3 }}
                    className="bg-purple-500 h-2 rounded-full"
                  />
                </div>
              </div>
            ) : showAllCards ? (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    🎉 Pack Opened! 🎉
                  </h3>
                  <p className="text-sm text-gray-400">
                    You received {revealedCards.length} new cards
                  </p>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {revealedCards.map((card, index) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`
                        p-3 rounded-lg border bg-gradient-to-r
                        ${getRarityColor(card.rarity)}
                        border-current
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {card.element === 'session' ? '🍪' :
                           card.element === 'auth' ? '🔐' :
                           card.element === 'storage' ? '💾' :
                           card.element === 'realtime' ? '⚡' :
                           card.element === 'compute' ? '🖥️' :
                           card.element === 'data' ? '📊' :
                           card.element === 'network' ? '🌐' :
                           card.element === 'system' ? '⚙️' : '❓'}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-white">{card.name}</h4>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <span className="capitalize">{card.rarity}</span>
                            <span>•</span>
                            <span>Lv.{card.level}</span>
                            <span>•</span>
                            <span>💎{card.marketValue}</span>
                          </div>
                        </div>
                        {card.rarity === 'legendary' && (
                          <Trophy className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                >
                  Continue
                </button>
              </div>
            ) : revealedCards.length > 0 ? (
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ rotateY: 180, scale: 0.8 }}
                  animate={{ rotateY: 0, scale: 1 }}
                  className={`
                    w-32 h-48 mx-auto rounded-xl border-2 bg-gradient-to-br p-4
                    ${getRarityColor(revealedCards[currentCardIndex].rarity)}
                    border-current
                  `}
                >
                  <div className="text-center h-full flex flex-col justify-between">
                    <div className="text-3xl">
                      {revealedCards[currentCardIndex].element === 'session' ? '🍪' :
                       revealedCards[currentCardIndex].element === 'auth' ? '🔐' :
                       revealedCards[currentCardIndex].element === 'storage' ? '💾' :
                       revealedCards[currentCardIndex].element === 'realtime' ? '⚡' :
                       revealedCards[currentCardIndex].element === 'compute' ? '🖥️' :
                       revealedCards[currentCardIndex].element === 'data' ? '📊' :
                       revealedCards[currentCardIndex].element === 'network' ? '🌐' :
                       revealedCards[currentCardIndex].element === 'system' ? '⚙️' : '❓'}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">
                        {revealedCards[currentCardIndex].name}
                      </h4>
                      <div className="text-xs text-gray-400 capitalize">
                        {revealedCards[currentCardIndex].rarity}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {revealedCards[currentCardIndex].name}
                  </h3>
                  <p className="text-sm text-gray-400 capitalize">
                    {revealedCards[currentCardIndex].rarity} • Level {revealedCards[currentCardIndex].level}
                  </p>
                </div>

                <div className="text-xs text-gray-400">
                  Card {currentCardIndex + 1} of {revealedCards.length}
                </div>

                <button
                  onClick={handleNextCard}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                >
                  {currentCardIndex < revealedCards.length - 1 ? 'Next Card' : 'View All Cards'}
                </button>
              </div>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};