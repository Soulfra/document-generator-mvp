#!/usr/bin/env node

/**
 * SOULFRA IDEA MATCHER
 * When people talk about ideas, AI matches them with others building similar things
 * Like a dating app but for builders and ideas
 */

class SoulfraIdeaMatcher {
  constructor(llmRouter, semanticSearch) {
    this.llmRouter = llmRouter;
    this.semanticSearch = semanticSearch;
    this.ideas = new Map();
    this.matches = new Map();
    this.conversations = new Map();
  }
  
  async submitIdea(userId, voiceId, ideaText) {
    console.log(`💡 New idea from ${voiceId.slice(0, 8)}...`);
    
    // Store idea
    const ideaId = crypto.randomBytes(16).toString('hex');
    const idea = {
      id: ideaId,
      userId,
      voiceId,
      text: ideaText,
      timestamp: Date.now(),
      embeddings: null,
      matches: []
    };
    
    // Generate embeddings for semantic matching
    idea.embeddings = await this.generateEmbeddings(ideaText);
    
    // Find similar ideas
    const similarIdeas = await this.findSimilarIdeas(idea);
    
    // Store matches
    idea.matches = similarIdeas.map(s => ({
      ideaId: s.id,
      userId: s.userId,
      similarity: s.similarity,
      commonThemes: s.themes
    }));
    
    this.ideas.set(ideaId, idea);
    
    // Notify matches
    for (const match of idea.matches) {
      this.notifyMatch(idea, match);
    }
    
    return {
      ideaId,
      matches: idea.matches.length,
      topMatch: idea.matches[0] || null,
      message: idea.matches.length > 0 
        ? `Found ${idea.matches.length} people building similar things!`
        : `You're the first with this idea! Keep building.`
    };
  }
  
  async generateEmbeddings(text) {
    // Use local LLM to understand idea
    try {
      const response = await fetch('http://localhost:4000/llm/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Extract key themes and concepts from this idea: "${text}". Return as JSON array.`,
          model: 'local'
        })
      });
      
      const result = await response.json();
      return {
        themes: this.extractThemes(result.result || text),
        vector: this.simpleVectorize(text)
      };
    } catch (error) {
      // Fallback to simple extraction
      return {
        themes: this.extractThemes(text),
        vector: this.simpleVectorize(text)
      };
    }
  }
  
  extractThemes(text) {
    // Simple theme extraction
    const keywords = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const commonWords = ['want', 'build', 'make', 'like', 'need', 'help', 'create'];
    
    return keywords
      .filter(w => !commonWords.includes(w))
      .slice(0, 5);
  }
  
  simpleVectorize(text) {
    // Super simple vectorization for MVP
    const words = text.toLowerCase().split(/\s+/);
    const vector = new Array(100).fill(0);
    
    words.forEach((word, i) => {
      const hash = word.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      vector[hash % 100] += 1;
    });
    
    return vector;
  }
  
  async findSimilarIdeas(newIdea) {
    const similar = [];
    
    // Compare with all existing ideas
    for (const [id, idea] of this.ideas) {
      if (idea.userId === newIdea.userId) continue; // Skip own ideas
      
      const similarity = this.calculateSimilarity(newIdea, idea);
      if (similarity > 0.3) { // 30% similarity threshold
        similar.push({
          ...idea,
          similarity,
          themes: this.findCommonThemes(newIdea, idea)
        });
      }
    }
    
    // Sort by similarity
    return similar.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  }
  
  calculateSimilarity(idea1, idea2) {
    // Compare vectors
    const v1 = idea1.embeddings?.vector || [];
    const v2 = idea2.embeddings?.vector || [];
    
    if (v1.length === 0 || v2.length === 0) return 0;
    
    // Cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i];
      norm1 += v1[i] * v1[i];
      norm2 += v2[i] * v2[i];
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
  
  findCommonThemes(idea1, idea2) {
    const themes1 = idea1.embeddings?.themes || [];
    const themes2 = idea2.embeddings?.themes || [];
    
    return themes1.filter(t => themes2.includes(t));
  }
  
  notifyMatch(newIdea, match) {
    // In real system, send notification
    console.log(`🎯 Match found! ${newIdea.voiceId.slice(0, 8)} ↔ ${match.userId.slice(0, 8)}`);
    
    // Create conversation opportunity
    const conversationId = crypto.randomBytes(16).toString('hex');
    this.conversations.set(conversationId, {
      id: conversationId,
      participants: [newIdea.userId, match.userId],
      ideas: [newIdea.id, match.ideaId],
      status: 'pending',
      created: Date.now()
    });
  }
  
  async connectWithMatch(userId, matchId, credits) {
    // Costs credits to connect
    if (credits < 5) {
      return { success: false, message: 'Need 5 credits to connect' };
    }
    
    // Create secure communication channel
    const channel = {
      id: crypto.randomBytes(16).toString('hex'),
      participants: [userId, matchId],
      messages: [],
      created: Date.now()
    };
    
    return {
      success: true,
      channelId: channel.id,
      creditsCharged: 5,
      message: 'Connected! Start building together.'
    };
  }
  
  getIdeaStats() {
    const stats = {
      totalIdeas: this.ideas.size,
      totalMatches: 0,
      activeConversations: 0,
      topThemes: new Map()
    };
    
    for (const idea of this.ideas.values()) {
      stats.totalMatches += idea.matches.length;
      
      // Count themes
      const themes = idea.embeddings?.themes || [];
      themes.forEach(theme => {
        stats.topThemes.set(theme, (stats.topThemes.get(theme) || 0) + 1);
      });
    }
    
    stats.activeConversations = Array.from(this.conversations.values())
      .filter(c => c.status === 'active').length;
    
    // Get top 10 themes
    stats.topThemes = Array.from(stats.topThemes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([theme, count]) => ({ theme, count }));
    
    return stats;
  }
}

// Example usage
if (require.main === module) {
  const matcher = new SoulfraIdeaMatcher();
  
  console.log(`
💡 SOULFRA IDEA MATCHER
======================

How it works:
1. Users submit ideas (text or voice)
2. AI extracts themes and concepts
3. Finds similar ideas from other users
4. Matches builders with similar visions
5. Costs credits to connect (prevents spam)

Example ideas to test matching:
- "AI assistant that helps with coding"
- "Social network for dog owners"
- "Marketplace for digital art"
- "Tool for managing remote teams"

The more specific, the better the matches!
  `);
  
  // Simulate some ideas
  (async () => {
    const testIdeas = [
      { userId: 'user1', voiceId: 'voice_123', idea: 'Building an AI coding assistant that understands context' },
      { userId: 'user2', voiceId: 'voice_456', idea: 'Creating AI helper for programmers to write better code' },
      { userId: 'user3', voiceId: 'voice_789', idea: 'Social platform where dog owners can meet at parks' },
      { userId: 'user4', voiceId: 'voice_abc', idea: 'App for finding dog-friendly locations and meetups' }
    ];
    
    for (const test of testIdeas) {
      const result = await matcher.submitIdea(test.userId, test.voiceId, test.idea);
      console.log(`\n${test.voiceId}: "${test.idea}"`);
      console.log(`→ ${result.message}`);
    }
    
    console.log('\n📊 Idea Stats:', matcher.getIdeaStats());
  })();
}

module.exports = SoulfraIdeaMatcher;