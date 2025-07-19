import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, 
  Users, 
  Activity, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Clock,
  DollarSign,
  Star,
  Zap,
  Brain,
  Database,
  Settings
} from 'lucide-react';

interface TemplateProps {
  template: {
    id: string;
    type: string;
    title: string;
    subtitle: string;
    layout: string;
    theme: string;
    components: any;
    animations?: {
      enter: string;
      exit: string;
      duration: number;
    };
    styles?: {
      background: string;
      primaryColor: string;
      accentColor: string;
      textColor: string;
    };
    context?: any;
  };
  isActive: boolean;
  onTemplateChange?: (templateId: string) => void;
}

const TemplateRenderer: React.FC<TemplateProps> = ({ 
  template, 
  isActive, 
  onTemplateChange 
}) => {
  // Animation variants
  const animationVariants = useMemo(() => ({
    initial: { 
      opacity: 0, 
      scale: 0.9,
      y: 20
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      y: 0
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      y: -20
    }
  }), []);

  // Get animation config
  const animationConfig = {
    initial: 'initial',
    animate: 'animate',
    exit: 'exit',
    variants: animationVariants,
    transition: { 
      duration: (template.animations?.duration || 500) / 1000,
      ease: 'easeInOut'
    }
  };

  // Render different template types
  const renderTemplate = () => {
    switch (template.type) {
      case 'landing':
        return <WelcomeTemplate template={template} />;
      case 'streaming':
        return <ConsultationTemplate template={template} />;
      case 'marketplace':
        return <AgentMarketplaceTemplate template={template} />;
      case 'governance':
        return <ConstitutionalTemplate template={template} />;
      case 'results':
        return <ResultsTemplate template={template} />;
      case 'error':
        return <ErrorTemplate template={template} />;
      default:
        return <DefaultTemplate template={template} />;
    }
  };

  if (!isActive) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={template.id}
        className="absolute inset-0 z-10 pointer-events-none"
        {...animationConfig}
        style={{
          background: template.styles?.background || 'transparent'
        }}
      >
        {renderTemplate()}
      </motion.div>
    </AnimatePresence>
  );
};

// Welcome/Landing Template Component
const WelcomeTemplate: React.FC<{ template: any }> = ({ template }) => {
  return (
    <div className="relative h-full flex flex-col justify-center items-center p-8 text-center">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Content */}
      <motion.div
        className="relative z-10 max-w-4xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {template.title}
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            {template.subtitle}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 hover:bg-gray-700/50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Brain className="w-8 h-8 text-blue-400 mb-3 mx-auto" />
            <h3 className="text-lg font-semibold text-white mb-2">AI Consultation</h3>
            <p className="text-gray-400 text-sm mb-3">Start a consultation with our 3-agent system</p>
            <code className="text-xs bg-gray-900 px-2 py-1 rounded text-green-400">
              cal-compare "your question"
            </code>
          </motion.div>

          <motion.div
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 hover:bg-gray-700/50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Users className="w-8 h-8 text-purple-400 mb-3 mx-auto" />
            <h3 className="text-lg font-semibold text-white mb-2">Agent Marketplace</h3>
            <p className="text-gray-400 text-sm mb-3">Browse 100+ specialized AI agents</p>
            <code className="text-xs bg-gray-900 px-2 py-1 rounded text-green-400">
              agents
            </code>
          </motion.div>

          <motion.div
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 hover:bg-gray-700/50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Shield className="w-8 h-8 text-yellow-400 mb-3 mx-auto" />
            <h3 className="text-lg font-semibold text-white mb-2">Constitutional Governance</h3>
            <p className="text-gray-400 text-sm mb-3">Explore our governance framework</p>
            <code className="text-xs bg-gray-900 px-2 py-1 rounded text-green-400">
              constitution
            </code>
          </motion.div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-sm text-gray-400">Constitutional Governance</span>
            </div>
            <div className="text-green-400 font-medium">Active</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Activity className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-sm text-gray-400">Agent Marketplace</span>
            </div>
            <div className="text-blue-400 font-medium">100+ Agents</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Star className="w-5 h-5 text-yellow-400 mr-2" />
              <span className="text-sm text-gray-400">Confidence</span>
            </div>
            <div className="text-yellow-400 font-medium">94%</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Zap className="w-5 h-5 text-purple-400 mr-2" />
              <span className="text-sm text-gray-400">Trust Scoring</span>
            </div>
            <div className="text-purple-400 font-medium">Enabled</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Consultation Template Component
const ConsultationTemplate: React.FC<{ template: any }> = ({ template }) => {
  return (
    <div className="relative h-full flex flex-col p-6">
      {/* Header */}
      <motion.div
        className="mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-white mb-2">{template.title}</h2>
        <p className="text-gray-300">{template.subtitle}</p>
      </motion.div>

      {/* Agent Progress */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Shield className="w-5 h-5 text-yellow-400 mr-2" />
            <span className="text-white font-medium">Constitutional Expert</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-yellow-400 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, delay: 0.5 }}
            />
          </div>
          <span className="text-xs text-gray-400 mt-1">Analyzing governance patterns...</span>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Settings className="w-5 h-5 text-blue-400 mr-2" />
            <span className="text-white font-medium">Technical Architect</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-blue-400 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '75%' }}
              transition={{ duration: 2, delay: 1 }}
            />
          </div>
          <span className="text-xs text-gray-400 mt-1">Evaluating technical requirements...</span>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Database className="w-5 h-5 text-green-400 mr-2" />
            <span className="text-white font-medium">Database Expert</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-green-400 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '25%' }}
              transition={{ duration: 2, delay: 1.5 }}
            />
          </div>
          <span className="text-xs text-gray-400 mt-1">Waiting for consultation...</span>
        </div>
      </motion.div>

      {/* Live Metrics */}
      <motion.div
        className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-lg p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Live Consultation Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                94%
              </motion.span>
            </div>
            <div className="text-xs text-gray-400">Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                $0.02
              </motion.span>
            </div>
            <div className="text-xs text-gray-400">Cost</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
              >
                85s
              </motion.span>
            </div>
            <div className="text-xs text-gray-400">Duration</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
              >
                3
              </motion.span>
            </div>
            <div className="text-xs text-gray-400">Experts</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Agent Marketplace Template
const AgentMarketplaceTemplate: React.FC<{ template: any }> = ({ template }) => {
  return (
    <div className="relative h-full p-6">
      <motion.div
        className="mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-white mb-2">{template.title}</h2>
        <p className="text-gray-300">{template.subtitle}</p>
      </motion.div>

      {/* Agent Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: 'Constitutional', icon: Shield, color: 'yellow', count: 25 },
          { name: 'Technical', icon: Settings, color: 'blue', count: 30 },
          { name: 'Database', icon: Database, color: 'green', count: 20 },
          { name: 'Orchestration', icon: Users, color: 'purple', count: 25 }
        ].map((category, index) => (
          <motion.div
            key={category.name}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <category.icon className={`w-8 h-8 text-${category.color}-400 mx-auto mb-3`} />
            <h3 className="text-lg font-semibold text-white mb-1">{category.name}</h3>
            <p className="text-gray-400 text-sm mb-2">{category.count} agents</p>
            <div className="flex items-center justify-center text-xs text-gray-500">
              <Star className="w-3 h-3 mr-1" />
              <span>Avg trust: 0.9+</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Constitutional Template
const ConstitutionalTemplate: React.FC<{ template: any }> = ({ template }) => {
  return (
    <div className="relative h-full p-6">
      <motion.div
        className="mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-white mb-2">{template.title}</h2>
        <p className="text-gray-300">{template.subtitle}</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Shield className="w-6 h-6 mr-2 text-yellow-400" />
            Governance Framework
          </h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
              100+ Constitutional clauses
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
              Formal amendment process
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
              Trust scoring system
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
              Violation tracking
            </li>
          </ul>
        </motion.div>

        <motion.div
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-blue-400" />
            System Metrics
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Trust Accuracy</span>
                <span className="text-blue-400">96%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-400 h-2 rounded-full" style={{ width: '96%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Consensus Rate</span>
                <span className="text-green-400">91%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-green-400 h-2 rounded-full" style={{ width: '91%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">System Uptime</span>
                <span className="text-yellow-400">99.9%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '99.9%' }} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Results Template
const ResultsTemplate: React.FC<{ template: any }> = ({ template }) => {
  return (
    <div className="relative h-full p-6">
      <motion.div
        className="mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-white mb-2">{template.title}</h2>
        <p className="text-gray-300">{template.subtitle}</p>
      </motion.div>

      <motion.div
        className="bg-gradient-to-r from-green-800/50 to-blue-800/50 backdrop-blur-sm border border-green-500/30 rounded-lg p-6 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Consultation Completed Successfully!</h3>
        <p className="text-gray-300 mb-4">
          Your consultation has been processed by our 3-agent system with constitutional governance validation.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">✅</div>
            <div className="text-sm text-gray-400">Validated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">94%</div>
            <div className="text-sm text-gray-400">Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">3</div>
            <div className="text-sm text-gray-400">Experts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">$0.02</div>
            <div className="text-sm text-gray-400">Cost</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Error Template
const ErrorTemplate: React.FC<{ template: any }> = ({ template }) => {
  return (
    <div className="relative h-full flex items-center justify-center p-6">
      <motion.div
        className="bg-red-800/50 backdrop-blur-sm border border-red-500/30 rounded-lg p-8 text-center max-w-md"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">System Error</h3>
        <p className="text-gray-300 mb-4">
          Something went wrong, but constitutional governance protocols are monitoring the situation.
        </p>
        <div className="text-sm text-gray-400">
          Error recovery systems are active. Please try again or contact support.
        </div>
      </motion.div>
    </div>
  );
};

// Default Template
const DefaultTemplate: React.FC<{ template: any }> = ({ template }) => {
  return (
    <div className="relative h-full flex items-center justify-center p-6">
      <div className="text-center">
        <Terminal className="w-16 h-16 text-blue-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">{template.title}</h3>
        <p className="text-gray-300">{template.subtitle}</p>
      </div>
    </div>
  );
};

export default TemplateRenderer;