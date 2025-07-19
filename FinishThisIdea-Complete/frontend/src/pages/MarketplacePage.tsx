import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MarketplaceBrowse } from '../components/AgentMarketplace/MarketplaceBrowse';
import { AgentDetailsModal } from '../components/AgentMarketplace/AgentDetailsModal';
import { Agent } from '../services/marketplace.service';
import { Store, TrendingUp, Sparkles } from 'lucide-react';

const MarketplacePage: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setTimeout(() => setSelectedAgent(null), 300);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Store className="w-10 h-10 text-white" />
              <h1 className="text-4xl font-bold text-white">Agent Marketplace</h1>
            </div>
            <p className="text-xl text-indigo-100 mb-6">
              Discover, purchase, and remix AI agents created by the community
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-white" />
                  <div className="text-left">
                    <p className="text-sm text-indigo-100">Active Agents</p>
                    <p className="text-2xl font-bold text-white">14,700+</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-white" />
                  <div className="text-left">
                    <p className="text-sm text-indigo-100">Total Downloads</p>
                    <p className="text-2xl font-bold text-white">779K+</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Marketplace Browse Component */}
      <MarketplaceBrowse
        onAgentSelect={handleAgentSelect}
      />

      {/* Agent Details Modal */}
      {selectedAgent && (
        <AgentDetailsModal
          agent={selectedAgent}
          isOpen={showDetailsModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default MarketplacePage;