import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Shield, Sword, Clock, Star, 
  Heart, Flame, Sparkles, Trophy, 
  ChevronDown, ChevronRight, Eye, 
  TrendingUp, Users, ShoppingCart
} from 'lucide-react';
import { EnergyCard } from './types';

interface MobileEnergyCardProps {
  card: EnergyCard;
  variant?: 'compact' | 'detailed' | 'marketplace' | 'battle';
  onCardTap?: (card: EnergyCard) => void;
  onQuickAction?: (action: 'buy' | 'trade' | 'use' | 'view', card: EnergyCard) => void;
  showQuickActions?: boolean;
  isSelected?: boolean;
  className?: string;
}

export const MobileEnergyCard: React.FC<MobileEnergyCardProps> = ({
  card,
  variant = 'compact',
  onCardTap,
  onQuickAction,
  showQuickActions = false,
  isSelected = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400 bg-gray-500/5 text-gray-300';
      case 'rare': return 'border-blue-400 bg-blue-500/5 text-blue-300';
      case 'epic': return 'border-purple-400 bg-purple-500/5 text-purple-300';
      case 'legendary': return 'border-yellow-400 bg-yellow-500/5 text-yellow-300';
      default: return 'border-gray-400 bg-gray-500/5 text-gray-300';
    }
  };

  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-400/20 to-gray-600/20';
      case 'rare': return 'from-blue-400/20 to-blue-600/20';
      case 'epic': return 'from-purple-400/20 to-purple-600/20';
      case 'legendary': return 'from-yellow-400/20 to-yellow-600/20';
      default: return 'from-gray-400/20 to-gray-600/20';
    }
  };

  const getElementIcon = (element: string) => {
    switch (element) {
      case 'session': return '🍪';
      case 'auth': return '🔐';
      case 'storage': return '💾';
      case 'realtime': return '⚡';
      case 'compute': return '🖥️';
      case 'data': return '📊';
      case 'network': return '🌐';
      case 'system': return '⚙️';
      default: return '❓';
    }
  };

  const handleCardTap = () => {
    if (variant === 'detailed') {
      setIsExpanded(!isExpanded);
    }
    onCardTap?.(card);
  };

  const handleQuickAction = (action: 'buy' | 'trade' | 'use' | 'view', e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickAction?.(action, card);
  };

  // Compact variant for mobile lists
  if (variant === 'compact') {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={handleCardTap}
        className={`
          relative flex items-center p-3 rounded-lg border
          ${getRarityColor(card.rarity)}
          ${isSelected ? 'ring-2 ring-indigo-400' : ''}
          ${className}
        `}
      >
        {/* Card Icon and Basic Info */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br ${getRarityGradient(card.rarity)} flex items-center justify-center text-xl border border-current">
          {getElementIcon(card.element)}
        </div>

        <div className="flex-1 ml-3 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white truncate">{card.name}</h3>
            <div className="flex items-center space-x-1 text-xs">
              <Zap className="w-3 h-3" />
              <span>{card.currentCharge}/{card.maxCharge}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-400 capitalize">{card.rarity}</span>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span>Lv.{card.level}</span>
              {card.tradeable && <span>💎{card.marketValue}</span>}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {showQuickActions && (
          <div className="flex-shrink-0 ml-2">
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </motion.div>
    );
  }

  // Marketplace variant for mobile marketplace
  if (variant === 'marketplace') {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        className={`
          relative p-4 rounded-xl border bg-gray-800/50 backdrop-blur-sm
          ${getRarityColor(card.rarity)}
          ${isSelected ? 'ring-2 ring-indigo-400' : ''}
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br ${getRarityGradient(card.rarity)} flex items-center justify-center text-lg border border-current">
              {getElementIcon(card.element)}
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">{card.name}</h3>
              <p className="text-xs text-gray-400 capitalize">{card.rarity} • {card.element}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-white">💎{card.marketValue}</div>
            <div className="text-xs text-gray-400">Level {card.level}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center">
            <div className="text-xs text-gray-400">Energy</div>
            <div className="text-sm font-medium text-white">{card.currentCharge}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Power</div>
            <div className="text-sm font-medium text-white">{card.power || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Regen</div>
            <div className="text-sm font-medium text-white">{card.regenRate}/s</div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex space-x-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => handleQuickAction('view', e)}
            className="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-white flex items-center justify-center space-x-1"
          >
            <Eye className="w-3 h-3" />
            <span>View</span>
          </motion.button>
          
          {card.tradeable && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => handleQuickAction('buy', e)}
              className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs text-white flex items-center justify-center space-x-1"
            >
              <ShoppingCart className="w-3 h-3" />
              <span>Buy</span>
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  // Battle variant for mobile battle interface
  if (variant === 'battle') {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={handleCardTap}
        className={`
          relative p-3 rounded-lg border bg-gray-800/80 backdrop-blur-sm
          ${getRarityColor(card.rarity)}
          ${isSelected ? 'ring-2 ring-indigo-400' : ''}
          ${card.tapped ? 'opacity-50' : ''}
          ${className}
        `}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br ${getRarityGradient(card.rarity)} flex items-center justify-center text-sm border border-current">
              {getElementIcon(card.element)}
            </div>
            <span className="text-xs font-medium text-white truncate">{card.name}</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <Zap className="w-3 h-3" />
            <span>{card.cost || 0}</span>
          </div>
        </div>

        {/* Battle Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1 text-red-400">
              <Sword className="w-3 h-3" />
              <span>{card.power || 0}</span>
            </div>
            <div className="flex items-center space-x-1 text-blue-400">
              <Shield className="w-3 h-3" />
              <span>{card.defense || 0}</span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {card.currentCharge}/{card.maxCharge}
          </div>
        </div>

        {/* Tapped Overlay */}
        {card.tapped && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
            <span className="text-xs text-red-400 font-semibold">TAPPED</span>
          </div>
        )}
      </motion.div>
    );
  }

  // Detailed variant with expandable info
  return (
    <motion.div
      className={`
        relative p-4 rounded-xl border bg-gray-800/50 backdrop-blur-sm
        ${getRarityColor(card.rarity)}
        ${isSelected ? 'ring-2 ring-indigo-400' : ''}
        ${className}
      `}
    >
      {/* Main Card Content */}
      <div onClick={handleCardTap} className="cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br ${getRarityGradient(card.rarity)} flex items-center justify-center text-2xl border border-current">
              {getElementIcon(card.element)}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">{card.name}</h3>
              <p className="text-sm text-gray-400 capitalize">{card.rarity} • {card.element}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="text-lg font-bold text-white">Lv.{card.level}</div>
              {card.tradeable && (
                <div className="text-sm text-yellow-400">💎{card.marketValue}</div>
              )}
            </div>
            <ChevronDown 
              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>

        {/* Energy Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-400">Energy</span>
            <span className="text-white">{card.currentCharge}/{card.maxCharge}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(card.currentCharge / card.maxCharge) * 100}%` }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
            />
          </div>
        </div>

        {/* Base Stats */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center p-2 bg-gray-700/50 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Base Energy</div>
            <div className="text-sm font-semibold text-white">{card.baseEnergy}</div>
          </div>
          <div className="text-center p-2 bg-gray-700/50 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Regen Rate</div>
            <div className="text-sm font-semibold text-white">{card.regenRate}/s</div>
          </div>
          <div className="text-center p-2 bg-gray-700/50 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Power</div>
            <div className="text-sm font-semibold text-white">{card.power || 0}</div>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-700 pt-3 mt-3"
          >
            {/* Description */}
            {card.description && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-white mb-1">Description</h4>
                <p className="text-xs text-gray-400">{card.description}</p>
              </div>
            )}

            {/* Abilities */}
            {card.abilities.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-white mb-2">Abilities</h4>
                <div className="space-y-1">
                  {card.abilities.map((ability, index) => (
                    <div key={index} className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                      {ability}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trading Info */}
            {card.tradeable && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-white mb-2">Trading</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-400">Market Value: <span className="text-yellow-400">💎{card.marketValue}</span></div>
                  <div className="text-gray-400">Owner: <span className="text-white">{card.owner}</span></div>
                </div>
              </div>
            )}

            {/* Last Used */}
            {card.lastUsed && (
              <div className="text-xs text-gray-400">
                Last used: {card.lastUsed.toLocaleDateString()}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      {showQuickActions && !isExpanded && (
        <div className="flex space-x-2 mt-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => handleQuickAction('use', e)}
            className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 rounded-lg text-xs text-white font-medium"
          >
            Use Card
          </motion.button>
          
          {card.tradeable && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => handleQuickAction('trade', e)}
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs text-white font-medium"
            >
              Trade
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
};