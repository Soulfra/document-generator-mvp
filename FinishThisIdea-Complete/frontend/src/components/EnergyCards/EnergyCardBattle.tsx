import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Shield, Sword, Clock, Users, Target, 
  Heart, Flame, Sparkles, Trophy, AlertCircle,
  Play, Pause, RotateCcw
} from 'lucide-react';
import { EnergyCard, EnergyCardBattle, BattlePlayer, BattleLogEntry } from './types';
import { energyCardService } from '../../services/energy-card.service';
import { useWebSocket } from '../../hooks/useWebSocket';

interface EnergyCardBattleProps {
  battleId?: string;
  onBattleEnd?: (winner: string, battleData: EnergyCardBattle) => void;
  className?: string;
}

export const EnergyCardBattleArena: React.FC<EnergyCardBattleProps> = ({
  battleId,
  onBattleEnd,
  className = '',
}) => {
  const [battle, setBattle] = useState<EnergyCardBattle | null>(null);
  const [selectedCard, setSelectedCard] = useState<EnergyCard | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<EnergyCard | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<BattlePlayer | null>(null);
  const [opponent, setOpponent] = useState<BattlePlayer | null>(null);
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([]);
  const [turnTimer, setTurnTimer] = useState(60); // 60 seconds per turn
  const [showBattleLog, setShowBattleLog] = useState(false);

  // WebSocket for real-time battle updates
  const { socket, isConnected } = useWebSocket();

  useEffect(() => {
    if (battleId) {
      loadBattle(battleId);
    }
  }, [battleId]);

  useEffect(() => {
    if (socket && battleId) {
      socket.on(`battle:${battleId}:update`, handleBattleUpdate);
      socket.on(`battle:${battleId}:action`, handleBattleAction);
      
      return () => {
        socket.off(`battle:${battleId}:update`);
        socket.off(`battle:${battleId}:action`);
      };
    }
  }, [socket, battleId]);

  // Turn timer
  useEffect(() => {
    if (battle?.status === 'active' && isCurrentPlayerTurn()) {
      const timer = setInterval(() => {
        setTurnTimer(prev => {
          if (prev <= 1) {
            // Auto-end turn when timer expires
            handleEndTurn();
            return 60;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [battle, currentPlayer]);

  const loadBattle = async (id: string) => {
    try {
      const battles = await energyCardService.getActiveBattles();
      const foundBattle = battles.find(b => b.id === id);
      
      if (foundBattle) {
        setBattle(foundBattle);
        setCurrentPlayer(foundBattle.players[0]);
        setOpponent(foundBattle.players[1]);
        setBattleLog(foundBattle.battleLog);
      }
    } catch (error) {
      console.error('Failed to load battle:', error);
    }
  };

  const handleBattleUpdate = useCallback((data: any) => {
    setBattle(data.battle);
    setBattleLog(data.battle.battleLog);
    
    if (data.battle.status === 'completed' && onBattleEnd) {
      onBattleEnd(data.battle.winner, data.battle);
    }
  }, [onBattleEnd]);

  const handleBattleAction = useCallback((data: any) => {
    setBattleLog(prev => [...prev, data.logEntry]);
    setTurnTimer(60); // Reset timer after action
  }, []);

  const isCurrentPlayerTurn = () => {
    return battle && currentPlayer && battle.currentTurn % 2 === 0;
  };

  const canPlayCard = (card: EnergyCard) => {
    return (
      isCurrentPlayerTurn() &&
      !actionInProgress &&
      currentPlayer &&
      currentPlayer.energy >= (card.cost || 0) &&
      currentPlayer.hand.includes(card)
    );
  };

  const canAttackWith = (card: EnergyCard) => {
    return (
      isCurrentPlayerTurn() &&
      !actionInProgress &&
      currentPlayer &&
      currentPlayer.field.includes(card) &&
      !card.tapped
    );
  };

  const handlePlayCard = async (card: EnergyCard) => {
    if (!canPlayCard(card) || !battle) return;

    setActionInProgress(true);
    try {
      const result = await energyCardService.executeBattleAction(battle.id, {
        type: 'play_card',
        cardId: card.id,
      });

      if (result.success && result.battle) {
        setBattle(result.battle);
      }
    } catch (error) {
      console.error('Failed to play card:', error);
    } finally {
      setActionInProgress(false);
      setSelectedCard(null);
    }
  };

  const handleAttack = async (attackerCard: EnergyCard) => {
    if (!canAttackWith(attackerCard) || !battle) return;

    setActionInProgress(true);
    try {
      const result = await energyCardService.executeBattleAction(battle.id, {
        type: 'attack',
        cardId: attackerCard.id,
        targetId: selectedTarget?.id,
      });

      if (result.success && result.battle) {
        setBattle(result.battle);
      }
    } catch (error) {
      console.error('Failed to attack:', error);
    } finally {
      setActionInProgress(false);
      setSelectedCard(null);
      setSelectedTarget(null);
    }
  };

  const handleUseAbility = async (card: EnergyCard, abilityIndex: number) => {
    if (!isCurrentPlayerTurn() || !battle) return;

    setActionInProgress(true);
    try {
      const result = await energyCardService.executeBattleAction(battle.id, {
        type: 'use_ability',
        cardId: card.id,
        targetId: `ability:${abilityIndex}`,
      });

      if (result.success && result.battle) {
        setBattle(result.battle);
      }
    } catch (error) {
      console.error('Failed to use ability:', error);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleEndTurn = async () => {
    if (!isCurrentPlayerTurn() || !battle) return;

    setActionInProgress(true);
    try {
      const result = await energyCardService.executeBattleAction(battle.id, {
        type: 'end_turn',
      });

      if (result.success && result.battle) {
        setBattle(result.battle);
        setTurnTimer(60);
      }
    } catch (error) {
      console.error('Failed to end turn:', error);
    } finally {
      setActionInProgress(false);
      setSelectedCard(null);
      setSelectedTarget(null);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400 bg-gray-500/10';
      case 'rare': return 'border-blue-400 bg-blue-500/10';
      case 'epic': return 'border-purple-400 bg-purple-500/10';
      case 'legendary': return 'border-yellow-400 bg-yellow-500/10';
      default: return 'border-gray-400 bg-gray-500/10';
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

  if (!battle) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-2" />
          <p className="text-gray-400">Loading battle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-900 ${className}`}>
      {/* Battle Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Sword className="w-5 h-5 text-red-400" />
              <span className="text-white font-semibold">Battle Arena</span>
            </div>
            
            <div className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${battle.status === 'active' 
                ? 'bg-green-500/20 text-green-400' 
                : battle.status === 'completed'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-yellow-500/20 text-yellow-400'
              }
            `}>
              {battle.status.charAt(0).toUpperCase() + battle.status.slice(1)}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Turn Timer */}
            {battle.status === 'active' && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className={`font-mono ${turnTimer <= 10 ? 'text-red-400' : 'text-gray-400'}`}>
                  {Math.floor(turnTimer / 60)}:{(turnTimer % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}

            {/* Battle Log Toggle */}
            <button
              onClick={() => setShowBattleLog(!showBattleLog)}
              className="flex items-center space-x-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300"
            >
              <Target className="w-4 h-4" />
              <span>Battle Log</span>
            </button>

            {/* End Turn Button */}
            {isCurrentPlayerTurn() && battle.status === 'active' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEndTurn}
                disabled={actionInProgress}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 rounded-lg text-white font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                <span>End Turn</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Battle Field */}
          <div className="lg:col-span-3 space-y-6">
            {/* Opponent's Area */}
            <div className="bg-gray-800 rounded-xl p-6 border-2 border-red-500/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{opponent?.username}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Heart className="w-4 h-4" />
                      <span>{opponent?.hp}/100</span>
                      <Zap className="w-4 h-4" />
                      <span>{opponent?.energy}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Cards in hand</div>
                  <div className="text-lg font-semibold text-white">{opponent?.hand.length}</div>
                </div>
              </div>

              {/* Opponent's Field */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <AnimatePresence>
                  {opponent?.field.map((card, index) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`
                        relative p-3 rounded-lg border-2 transition-all cursor-pointer
                        ${getRarityColor(card.rarity)}
                        ${selectedTarget?.id === card.id ? 'ring-2 ring-red-400' : ''}
                      `}
                      onClick={() => setSelectedTarget(selectedTarget?.id === card.id ? null : card)}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{getElementIcon(card.element)}</div>
                        <div className="text-xs font-medium text-white mb-1">{card.name}</div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>⚔️{card.power}</span>
                          <span>🛡️{card.defense}</span>
                        </div>
                      </div>
                      
                      {card.tapped && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-red-400 font-semibold">TAPPED</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Battle Field Center */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-4 mb-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-semibold">Turn {battle.currentTurn}</span>
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-sm text-gray-400">
                  {isCurrentPlayerTurn() ? "Your turn" : `${opponent?.username}'s turn`}
                </div>
              </div>
            </div>

            {/* Player's Area */}
            <div className="bg-gray-800 rounded-xl p-6 border-2 border-blue-500/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{currentPlayer?.username}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Heart className="w-4 h-4" />
                      <span>{currentPlayer?.hp}/100</span>
                      <Zap className="w-4 h-4" />
                      <span>{currentPlayer?.energy}</span>
                    </div>
                  </div>
                </div>
                {isCurrentPlayerTurn() && (
                  <div className="flex items-center space-x-2 text-green-400">
                    <Play className="w-4 h-4" />
                    <span className="text-sm font-medium">Your Turn</span>
                  </div>
                )}
              </div>

              {/* Player's Field */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
                <AnimatePresence>
                  {currentPlayer?.field.map((card, index) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className={`
                        relative p-3 rounded-lg border-2 transition-all cursor-pointer
                        ${getRarityColor(card.rarity)}
                        ${selectedCard?.id === card.id ? 'ring-2 ring-blue-400' : ''}
                        ${canAttackWith(card) ? 'hover:ring-2 hover:ring-green-400' : ''}
                      `}
                      onClick={() => {
                        if (canAttackWith(card)) {
                          setSelectedCard(selectedCard?.id === card.id ? null : card);
                        }
                      }}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{getElementIcon(card.element)}</div>
                        <div className="text-xs font-medium text-white mb-1">{card.name}</div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>⚔️{card.power}</span>
                          <span>🛡️{card.defense}</span>
                        </div>
                      </div>

                      {selectedCard?.id === card.id && canAttackWith(card) && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAttack(card);
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                        >
                          ⚔️
                        </motion.button>
                      )}

                      {card.tapped && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-red-400 font-semibold">TAPPED</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Player's Hand */}
              <div>
                <div className="text-sm text-gray-400 mb-2">Your Hand</div>
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  <AnimatePresence>
                    {currentPlayer?.hand.map((card, index) => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`
                          flex-shrink-0 w-24 p-2 rounded-lg border-2 transition-all cursor-pointer
                          ${getRarityColor(card.rarity)}
                          ${selectedCard?.id === card.id ? 'ring-2 ring-blue-400' : ''}
                          ${canPlayCard(card) ? 'hover:ring-2 hover:ring-green-400' : 'opacity-50'}
                        `}
                        onClick={() => {
                          if (canPlayCard(card)) {
                            handlePlayCard(card);
                          }
                        }}
                      >
                        <div className="text-center">
                          <div className="text-lg mb-1">{getElementIcon(card.element)}</div>
                          <div className="text-xs font-medium text-white mb-1 truncate">{card.name}</div>
                          <div className="text-xs text-gray-400">⚡{card.cost}</div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Battle Log Sidebar */}
          <div className={`${showBattleLog ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 h-96 lg:h-full">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Battle Log
              </h3>
              
              <div className="space-y-2 overflow-y-auto h-full">
                <AnimatePresence>
                  {battleLog.slice(-20).map((entry, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs p-2 bg-gray-700 rounded text-gray-300"
                    >
                      <div className="text-gray-500 text-xs">
                        {entry.timestamp.toLocaleTimeString()}
                      </div>
                      <div>{entry.description}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Battle Complete Modal */}
      <AnimatePresence>
        {battle.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4"
            >
              <div className="text-center">
                <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Battle Complete!</h2>
                <p className="text-gray-400 mb-6">
                  {battle.winner === currentPlayer?.userId ? 'Victory!' : 'Defeat!'}
                </p>
                <button
                  onClick={() => onBattleEnd?.(battle.winner!, battle)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};