import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, Shield, Zap, Heart, Clock, Users, 
  Play, Pause, RotateCcw, Target, Settings,
  ChevronUp, ChevronDown, Menu, X,
  Flame, Sparkles, Trophy
} from 'lucide-react';
import { EnergyCard, EnergyCardBattle, BattlePlayer } from './types';
import { MobileEnergyCard } from './MobileEnergyCard';

interface MobileBattleInterfaceProps {
  battle: EnergyCardBattle;
  currentPlayer: BattlePlayer;
  opponent: BattlePlayer;
  onBattleAction: (action: any) => void;
  onEndTurn: () => void;
  isCurrentPlayerTurn: boolean;
  turnTimer: number;
  className?: string;
}

export const MobileBattleInterface: React.FC<MobileBattleInterfaceProps> = ({
  battle,
  currentPlayer,
  opponent,
  onBattleAction,
  onEndTurn,
  isCurrentPlayerTurn,
  turnTimer,
  className = '',
}) => {
  const [selectedCard, setSelectedCard] = useState<EnergyCard | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<EnergyCard | null>(null);
  const [showBattleLog, setShowBattleLog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'field' | 'hand' | 'energy'>('field');

  const handleCardSelect = (card: EnergyCard) => {
    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  };

  const handleCardAction = (action: string, card: EnergyCard) => {
    switch (action) {
      case 'play':
        onBattleAction({
          type: 'play_card',
          cardId: card.id,
        });
        break;
      case 'attack':
        onBattleAction({
          type: 'attack',
          cardId: card.id,
          targetId: selectedTarget?.id,
        });
        break;
      case 'ability':
        onBattleAction({
          type: 'use_ability',
          cardId: card.id,
        });
        break;
    }
    setSelectedCard(null);
    setSelectedTarget(null);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getHealthPercentage = (hp: number) => (hp / 100) * 100;

  return (
    <div className={`min-h-screen bg-gray-900 flex flex-col ${className}`}>
      {/* Mobile Battle Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Battle Status */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Sword className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-white">Turn {battle.currentTurn}</span>
            </div>
            <div className={`
              px-2 py-1 rounded-full text-xs font-medium
              ${battle.status === 'active' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-gray-500/20 text-gray-400'
              }
            `}>
              {isCurrentPlayerTurn ? 'Your Turn' : `${opponent.username}'s Turn`}
            </div>
          </div>

          {/* Timer and Menu */}
          <div className="flex items-center space-x-3">
            {battle.status === 'active' && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className={`text-sm font-mono ${turnTimer <= 10 ? 'text-red-400' : 'text-gray-400'}`}>
                  {formatTimer(turnTimer)}
                </span>
              </div>
            )}
            
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-white"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Player Health Bars */}
      <div className="bg-gray-800 px-4 py-3 space-y-3">
        {/* Opponent */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white font-medium">{opponent.username}</span>
              <div className="flex items-center space-x-2 text-gray-400">
                <Heart className="w-3 h-3" />
                <span>{opponent.hp}/100</span>
                <Zap className="w-3 h-3" />
                <span>{opponent.energy}</span>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getHealthPercentage(opponent.hp)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Current Player */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white font-medium">{currentPlayer.username}</span>
              <div className="flex items-center space-x-2 text-gray-400">
                <Heart className="w-3 h-3" />
                <span>{currentPlayer.hp}/100</span>
                <Zap className="w-3 h-3" />
                <span>{currentPlayer.energy}</span>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getHealthPercentage(currentPlayer.hp)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Battle Area */}
      <div className="flex-1 overflow-hidden">
        {/* Opponent's Field */}
        <div className="bg-gray-800/50 p-4 border-b border-red-500/30">
          <div className="text-xs text-gray-400 mb-2">Opponent's Field</div>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {opponent.field.length === 0 ? (
              <div className="text-xs text-gray-500 italic py-4">No cards on field</div>
            ) : (
              opponent.field.map((card) => (
                <div key={card.id} className="flex-shrink-0 w-20">
                  <MobileEnergyCard
                    card={card}
                    variant="battle"
                    onCardTap={() => setSelectedTarget(selectedTarget?.id === card.id ? null : card)}
                    isSelected={selectedTarget?.id === card.id}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Battle Field Center */}
        <div className="bg-gray-900 p-4 text-center border-b border-gray-700">
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-400">
              {selectedCard && selectedTarget ? 'Tap to attack!' : 
               selectedCard ? 'Select target' : 
               'Select a card to play'}
            </span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>
        </div>

        {/* Player's Field */}
        <div className="bg-gray-800/50 p-4 border-b border-blue-500/30">
          <div className="text-xs text-gray-400 mb-2">Your Field</div>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {currentPlayer.field.length === 0 ? (
              <div className="text-xs text-gray-500 italic py-4">No cards on field</div>
            ) : (
              currentPlayer.field.map((card) => (
                <div key={card.id} className="flex-shrink-0 w-20">
                  <MobileEnergyCard
                    card={card}
                    variant="battle"
                    onCardTap={() => handleCardSelect(card)}
                    isSelected={selectedCard?.id === card.id}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Panel Tabs */}
        <div className="bg-gray-800 border-t border-gray-700">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700">
            {[
              { key: 'hand', label: 'Hand', count: currentPlayer.hand.length },
              { key: 'energy', label: 'Energy', count: currentPlayer.energyZone.length },
              { key: 'field', label: 'Field', count: currentPlayer.field.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key as any)}
                className={`flex-1 py-3 px-4 text-sm font-medium ${
                  viewMode === tab.key 
                    ? 'text-indigo-400 border-b-2 border-indigo-400' 
                    : 'text-gray-400'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 max-h-48 overflow-y-auto">
            <AnimatePresence mode="wait">
              {viewMode === 'hand' && (
                <motion.div
                  key="hand"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-2"
                >
                  {currentPlayer.hand.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">No cards in hand</div>
                  ) : (
                    currentPlayer.hand.map((card) => (
                      <MobileEnergyCard
                        key={card.id}
                        card={card}
                        variant="compact"
                        onCardTap={() => handleCardAction('play', card)}
                        isSelected={selectedCard?.id === card.id}
                      />
                    ))
                  )}
                </motion.div>
              )}

              {viewMode === 'energy' && (
                <motion.div
                  key="energy"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-2"
                >
                  {currentPlayer.energyZone.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">No energy cards</div>
                  ) : (
                    currentPlayer.energyZone.map((card) => (
                      <MobileEnergyCard
                        key={card.id}
                        card={card}
                        variant="compact"
                        onCardTap={() => handleCardSelect(card)}
                        isSelected={selectedCard?.id === card.id}
                      />
                    ))
                  )}
                </motion.div>
              )}

              {viewMode === 'field' && (
                <motion.div
                  key="field"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-2"
                >
                  {currentPlayer.field.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">No cards on field</div>
                  ) : (
                    currentPlayer.field.map((card) => (
                      <MobileEnergyCard
                        key={card.id}
                        card={card}
                        variant="compact"
                        onCardTap={() => handleCardSelect(card)}
                        isSelected={selectedCard?.id === card.id}
                      />
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isCurrentPlayerTurn && battle.status === 'active' && (
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          <div className="flex space-x-3">
            {/* Attack Button */}
            {selectedCard && selectedTarget && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCardAction('attack', selectedCard)}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center space-x-2"
              >
                <Sword className="w-4 h-4" />
                <span>Attack</span>
              </motion.button>
            )}

            {/* Use Ability Button */}
            {selectedCard && selectedCard.abilities.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCardAction('ability', selectedCard)}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ability</span>
              </motion.button>
            )}

            {/* End Turn Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onEndTurn}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>End Turn</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-gray-900 rounded-t-2xl w-full p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Battle Menu</h3>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-2 text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowBattleLog(true);
                    setShowMenu(false);
                  }}
                  className="w-full p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-left flex items-center space-x-3"
                >
                  <Target className="w-5 h-5" />
                  <span>View Battle Log</span>
                </button>

                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-left flex items-center space-x-3"
                >
                  <Settings className="w-5 h-5" />
                  <span>Battle Settings</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Battle Log Modal */}
      <AnimatePresence>
        {showBattleLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl w-full max-w-lg max-h-96 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Battle Log</h3>
                <button
                  onClick={() => setShowBattleLog(false)}
                  className="p-1 text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-80 space-y-2">
                {battle.battleLog.slice(-20).map((entry, index) => (
                  <div key={index} className="text-sm p-2 bg-gray-800 rounded">
                    <div className="text-xs text-gray-500 mb-1">
                      {entry.timestamp.toLocaleTimeString()}
                    </div>
                    <div className="text-gray-300">{entry.description}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Battle Complete Modal */}
      <AnimatePresence>
        {battle.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl p-6 w-full max-w-sm text-center"
            >
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Battle Complete!</h2>
              <p className="text-gray-400 mb-6">
                {battle.winner === currentPlayer.userId ? 'Victory!' : 'Defeat!'}
              </p>
              <button
                onClick={() => window.history.back()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};