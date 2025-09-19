export interface EnergyCard {
  id: string;
  name: string;
  type: string;
  element: 'session' | 'auth' | 'storage' | 'realtime' | 'compute' | 'data' | 'network' | 'system';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  level: number;
  baseEnergy: number;
  maxCharge: number;
  currentCharge: number;
  regenRate: number;
  abilities: string[];
  description: string;
  imageUrl?: string;
  
  // Game properties
  power?: number;
  defense?: number;
  speed?: number;
  cost?: number;
  
  // Trading properties
  tradeable: boolean;
  marketValue: number;
  owner: string;
  createdAt: Date;
  lastUsed?: Date;
}

export interface EnergyCardPack {
  id: string;
  name: string;
  description: string;
  rarity: 'starter' | 'premium' | 'quantum' | 'legendary';
  cardCount: number;
  guaranteedTypes: string[];
  guaranteedRarities?: string[];
  cost: number;
  imageUrl?: string;
  createdAt?: Date;
  purchases?: number;
}

export interface EnergyCardCollection {
  userId: string;
  cards: EnergyCard[];
  totalCards: number;
  uniqueTypes: number;
  totalValue: number;
  favoriteCards: string[];
  tradingHistory: TradeRecord[];
}

export interface TradeRecord {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromCard: EnergyCard;
  toCard: EnergyCard;
  timestamp: Date;
  status: 'pending' | 'completed' | 'cancelled';
  tradeValue: number;
}

export interface EnergyCardBattle {
  id: string;
  players: BattlePlayer[];
  status: 'waiting' | 'active' | 'completed';
  currentTurn: number;
  winner?: string;
  battleLog: BattleLogEntry[];
  createdAt: Date;
  completedAt?: Date;
}

export interface BattlePlayer {
  userId: string;
  username: string;
  deck: EnergyCard[];
  hand: EnergyCard[];
  field: EnergyCard[];
  energyZone: EnergyCard[];
  hp: number;
  energy: number;
}

export interface BattleLogEntry {
  timestamp: Date;
  playerId: string;
  action: 'play_card' | 'attack' | 'use_ability' | 'end_turn';
  cardId?: string;
  targetId?: string;
  damage?: number;
  description: string;
}

export interface EnergyCardAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'energy' | 'cards' | 'trading' | 'battle' | 'collection';
  requirements: {
    type: 'collect' | 'trade' | 'battle' | 'use' | 'combine';
    target: number;
    cardType?: string;
    rarity?: string;
  };
  reward: {
    type: 'card' | 'pack' | 'tokens' | 'title' | 'multiplier';
    value: string | number;
  };
  progress: {
    current: number;
    target: number;
  };
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface CardCombination {
  id: string;
  name: string;
  description: string;
  requiredCards: {
    type: string;
    level: number;
    count: number;
  }[];
  result: {
    type: 'card' | 'ability' | 'bonus';
    value: string;
  };
  energyCost: number;
  cooldown: number;
  category: 'offensive' | 'defensive' | 'utility' | 'economic';
}

export interface EnergyCardStats {
  totalCards: number;
  uniqueTypes: number;
  averageLevel: number;
  totalValue: number;
  rareCount: number;
  epicCount: number;
  legendaryCount: number;
  battlesWon: number;
  battlesLost: number;
  successfulTrades: number;
  achievementsUnlocked: number;
}