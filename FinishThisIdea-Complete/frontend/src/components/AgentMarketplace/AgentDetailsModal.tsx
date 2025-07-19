import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Download, GitBranch, Star, User, Calendar, Tag, 
  Code, Play, Copy, CheckCircle, AlertCircle, Zap
} from 'lucide-react';
import { Agent } from '../../services/marketplace.service';
import { marketplaceService } from '../../services/marketplace.service';
import { agentService } from '../../services/agent.service';
import { useNavigate } from 'react-router-dom';

interface AgentDetailsModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
}

export const AgentDetailsModal: React.FC<AgentDetailsModalProps> = ({
  agent,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'code' | 'test'>('overview');
  const [isExecuting, setIsExecuting] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    setError(null);
    
    try {
      await marketplaceService.purchaseAgent(agent.id);
      // Refresh the page or update UI to show purchased state
      window.location.reload();
    } catch (err) {
      setError('Failed to purchase agent. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRemix = () => {
    navigate('/agent-builder', { state: { remixAgent: agent } });
    onClose();
  };

  const handleExecute = async () => {
    if (!testInput.trim()) {
      setError('Please provide test input');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setTestOutput(null);

    try {
      const result = await agentService.testAgent(agent.id, JSON.parse(testInput));
      setTestOutput(result.output);
    } catch (err) {
      setError('Failed to execute agent. Please check your input format.');
    } finally {
      setIsExecuting(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(agent.sourceCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{agent.name}</h2>
                <p className="text-indigo-100">{agent.description}</p>
                
                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-indigo-200">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{agent.creator?.displayName || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(agent.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    <span>{agent.downloads} downloads</span>
                  </div>
                  {agent.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{agent.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-700">
            <div className="flex">
              {(['overview', 'code', 'test'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-indigo-400 border-b-2 border-indigo-400'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Tags */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {agent.agentCard.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
                        >
                          <Tag className="w-3 h-3 inline mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* I/O Types */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Input Types</h3>
                      <div className="space-y-1">
                        {agent.agentCard.inputTypes.map((type, index) => (
                          <div key={index} className="text-gray-300">• {type}</div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Output Types</h3>
                      <div className="space-y-1">
                        {agent.agentCard.outputTypes.map((type, index) => (
                          <div key={index} className="text-gray-300">• {type}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Remix info */}
                  {agent.remixedFromId && (
                    <div className="p-4 bg-indigo-600/10 border border-indigo-600/20 rounded-lg">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <GitBranch className="w-5 h-5" />
                        <span className="font-medium">This is a remix</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        This agent was created by remixing another agent in the marketplace.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'code' && (
                <motion.div
                  key="code"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="relative">
                    <div className="absolute top-2 right-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={copyCode}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 flex items-center gap-2"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </motion.button>
                    </div>
                    <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <code className="text-sm text-gray-300">{agent.sourceCode || '// Source code not available'}</code>
                    </pre>
                  </div>
                </motion.div>
              )}

              {activeTab === 'test' && (
                <motion.div
                  key="test"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Test Input (JSON)
                    </label>
                    <textarea
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      placeholder='{"input": "your test data here"}'
                      className="w-full h-32 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExecute}
                    disabled={isExecuting}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isExecuting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Execute Agent
                      </>
                    )}
                  </motion.button>

                  {testOutput && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Output</h4>
                      <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <code className="text-sm text-gray-300">
                          {JSON.stringify(testOutput, null, 2)}
                        </code>
                      </pre>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-700 p-6">
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPurchasing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    {agent.price === 0 ? 'Get Free' : `Purchase for $${agent.price}`}
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRemix}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium flex items-center gap-2"
              >
                <GitBranch className="w-5 h-5" />
                Remix
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};