import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Wand2 } from 'lucide-react';
import { AgentBuilder } from '../components/AgentMarketplace/AgentBuilder';

const AgentBuilderPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const remixAgent = location.state?.remixAgent;

  const handleAgentCreated = (agent: any) => {
    // Navigate to the marketplace with a success message
    navigate('/marketplace', {
      state: { 
        newAgentId: agent.id,
        showSuccess: true,
        message: `Successfully created "${agent.name}"!`
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => navigate('/marketplace')}
              className="flex items-center gap-2 text-indigo-100 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Marketplace
            </button>
            
            <div className="flex items-center gap-3">
              <Wand2 className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-bold text-white">
                {remixAgent ? 'Remix Agent' : 'Create New Agent'}
              </h1>
            </div>
            
            {remixAgent && (
              <p className="text-indigo-100 mt-2">
                Creating a remix of "{remixAgent.name}"
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Builder Component */}
      <div className="py-8">
        <AgentBuilder
          remixFromAgent={remixAgent}
          onAgentCreated={handleAgentCreated}
        />
      </div>
    </div>
  );
};

export default AgentBuilderPage;