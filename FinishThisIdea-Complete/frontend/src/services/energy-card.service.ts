import { EnergyCard, EnergyCardPack, EnergyCardCollection, TradeRecord, EnergyCardBattle, EnergyCardAchievement } from '../components/EnergyCards/types';

class EnergyCardService {
  private baseUrl = process.env.REACT_APP_API_URL || '';

  /**
   * Get available card packs from marketplace
   */
  async getAvailablePacks(): Promise<EnergyCardPack[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/energy/packs`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch card packs');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching card packs:', error);
      // Return mock data for development
      return this.getMockPacks();
    }
  }

  /**
   * Get user's energy card data
   */
  async getUserData(): Promise<{
    tokens: number;
    collection: EnergyCardCollection;
    purchasedPacks: string[];
    achievements: EnergyCardAchievement[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/energy/user`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Return mock data for development
      return this.getMockUserData();
    }
  }

  /**
   * Purchase a card pack
   */
  async purchasePack(packId: string): Promise<{
    success: boolean;
    cards?: EnergyCard[];
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/energy/purchase-pack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ packId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message };
      }
      
      const result = await response.json();
      return { success: true, cards: result.cards };
    } catch (error) {
      console.error('Error purchasing pack:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's card collection
   */
  async getUserCollection(): Promise<EnergyCardCollection> {
    try {
      const response = await fetch(`${this.baseUrl}/api/energy/collection`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch collection');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching collection:', error);
      return this.getMockCollection();
    }
  }

  /**
   * Trade cards with another user
   */
  async initiateCardTrade(toUserId: string, fromCardId: string, toCardId: string): Promise<{
    success: boolean;
    tradeId?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/energy/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          toUserId,
          fromCardId,
          toCardId,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message };
      }
      
      const result = await response.json();
      return { success: true, tradeId: result.tradeId };
    } catch (error) {
      console.error('Error initiating trade:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start a card battle
   */
  async startBattle(opponentId: string, deckCardIds: string[]): Promise<{
    success: boolean;
    battleId?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/energy/battle/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          opponentId,
          deckCardIds,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message };
      }
      
      const result = await response.json();
      return { success: true, battleId: result.battleId };
    } catch (error) {
      console.error('Error starting battle:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get active battles
   */
  async getActiveBattles(): Promise<EnergyCardBattle[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/energy/battles`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch battles');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching battles:', error);
      return [];
    }
  }

  /**
   * Execute a battle action
   */
  async executeBattleAction(battleId: string, action: {
    type: 'play_card' | 'attack' | 'use_ability' | 'end_turn';
    cardId?: string;
    targetId?: string;
  }): Promise<{
    success: boolean;
    battle?: EnergyCardBattle;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/energy/battle/${battleId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(action),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message };
      }
      
      const result = await response.json();
      return { success: true, battle: result.battle };
    } catch (error) {
      console.error('Error executing battle action:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get energy card achievements
   */
  async getAchievements(): Promise<EnergyCardAchievement[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/energy/achievements`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return this.getMockAchievements();
    }
  }

  /**
   * Combine cards for special effects
   */
  async combineCards(cardIds: string[], combinationId: string): Promise<{
    success: boolean;
    result?: {
      type: 'card' | 'ability' | 'bonus';
      value: string;
    };
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/energy/combine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          cardIds,
          combinationId,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message };
      }
      
      const result = await response.json();
      return { success: true, result: result.result };
    } catch (error) {
      console.error('Error combining cards:', error);
      return { success: false, error: error.message };
    }
  }

  // Mock data for development
  private getMockPacks(): EnergyCardPack[] {
    return [
      {
        id: 'starter-pack',
        name: 'Starter Energy Pack',
        description: 'Perfect for new energy card collectors',
        rarity: 'starter',
        cardCount: 5,
        guaranteedTypes: ['cookie', 'localStorage', 'userProfile'],
        cost: 50,
        purchases: 1250,
        createdAt: new Date('2024-01-15'),
      },
      {
        id: 'premium-pack',
        name: 'Premium Energy Pack',
        description: 'Advanced cards for serious collectors',
        rarity: 'premium',
        cardCount: 10,
        guaranteedTypes: ['jwt', 'websocket', 'apiKey'],
        guaranteedRarities: ['rare'],
        cost: 200,
        purchases: 850,
        createdAt: new Date('2024-02-01'),
      },
      {
        id: 'quantum-pack',
        name: 'Quantum Energy Pack',
        description: 'Rare quantum-enhanced energy cards',
        rarity: 'quantum',
        cardCount: 15,
        guaranteedTypes: ['quantumState', 'dockerContainer', 'redis'],
        guaranteedRarities: ['epic', 'legendary'],
        cost: 1000,
        purchases: 125,
        createdAt: new Date('2024-02-15'),
      },
    ];
  }

  private getMockUserData() {
    return {
      tokens: 1250,
      collection: this.getMockCollection(),
      purchasedPacks: ['starter-pack'],
      achievements: this.getMockAchievements(),
    };
  }

  private getMockCollection(): EnergyCardCollection {
    return {
      userId: 'user-123',
      cards: [
        {
          id: 'card-1',
          name: 'HTTP Cookie Card',
          type: 'cookie',
          element: 'session',
          rarity: 'common',
          level: 3,
          baseEnergy: 15,
          maxCharge: 100,
          currentCharge: 85,
          regenRate: 5,
          abilities: ['session_persistence'],
          description: 'Manages user session data',
          tradeable: true,
          marketValue: 25,
          owner: 'user-123',
          createdAt: new Date(),
          power: 20,
          defense: 15,
          speed: 10,
          cost: 1,
        },
      ],
      totalCards: 12,
      uniqueTypes: 8,
      totalValue: 450,
      favoriteCards: ['card-1'],
      tradingHistory: [],
    };
  }

  private getMockAchievements(): EnergyCardAchievement[] {
    return [
      {
        id: 'first-card',
        title: 'Energy Awakening',
        description: 'Acquire your first energy card',
        icon: '⚡',
        rarity: 'common',
        category: 'cards',
        requirements: {
          type: 'collect',
          target: 1,
        },
        reward: {
          type: 'tokens',
          value: 50,
        },
        progress: {
          current: 1,
          target: 1,
        },
        unlocked: true,
        unlockedAt: new Date(),
      },
      {
        id: 'collector',
        title: 'Energy Collector',
        description: 'Own 50 different energy card types',
        icon: '🎴',
        rarity: 'rare',
        category: 'collection',
        requirements: {
          type: 'collect',
          target: 50,
        },
        reward: {
          type: 'pack',
          value: 'premium-pack',
        },
        progress: {
          current: 8,
          target: 50,
        },
        unlocked: false,
      },
    ];
  }
}

export const energyCardService = new EnergyCardService();