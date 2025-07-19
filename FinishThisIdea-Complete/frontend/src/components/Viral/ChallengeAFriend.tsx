import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { 
  Users, 
  Share2, 
  Trophy, 
  Clock, 
  Target,
  X,
  Copy,
  Check,
  Sparkles,
  Zap
} from 'lucide-react';
import { generateId, copyToClipboard, shareOnTwitter } from '../../utils';

interface Challenge {
  id: string;
  type: 'speed' | 'quality' | 'streak' | 'custom';
  title: string;
  description: string;
  target: number;
  unit: string;
  timeLimit?: number; // in hours
  reward: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ChallengeAFriendProps {
  userId?: string;
  variant?: 'modal' | 'widget' | 'page';
  onClose?: () => void;
}

const predefinedChallenges: Challenge[] = [
  {
    id: 'speed-demon',
    type: 'speed',
    title: 'Speed Demon Challenge',
    description: 'Complete 5 code cleanups in under 2 minutes each',
    target: 5,
    unit: 'fast cleanups',
    timeLimit: 24,
    reward: '$5 credit + Speed Badge',
    difficulty: 'hard'
  },
  {
    id: 'quality-master',
    type: 'quality',
    title: 'Quality Master Challenge',
    description: 'Achieve 95%+ improvement on 3 projects',
    target: 3,
    unit: 'perfect cleanups',
    timeLimit: 72,
    reward: '$3 credit + Quality Badge',
    difficulty: 'medium'
  },
  {
    id: 'consistency-king',
    type: 'streak',
    title: 'Consistency King Challenge',
    description: 'Clean code for 7 days straight',
    target: 7,
    unit: 'consecutive days',
    timeLimit: 168, // 7 days
    reward: '$10 credit + Fire Badge',
    difficulty: 'medium'
  },
  {
    id: 'rookie-rumble',
    type: 'custom',
    title: 'Rookie Rumble',
    description: 'Complete your first 3 code cleanups',
    target: 3,
    unit: 'cleanups',
    timeLimit: 48,
    reward: '$2 credit + Beginner Badge',
    difficulty: 'easy'
  }
];

const ChallengeAFriend = ({ userId = 'demo-user', variant = 'modal', onClose }: ChallengeAFriendProps) => {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [customChallenge, setCustomChallenge] = useState({
    title: '',
    description: '',
    target: 5,
    unit: 'cleanups',
    timeLimit: 24,
    reward: '$5 credit'
  });
  const [friendEmails, setFriendEmails] = useState<string[]>(['']);
  const [step, setStep] = useState<'select' | 'customize' | 'invite' | 'sent'>('select');
  const [copied, setCopied] = useState(false);

  const generateChallengeUrl = (challenge: Challenge) => {
    const challengeId = generateId(8);
    return `${window.location.origin}/challenge/${challengeId}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getDifficultyBg = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20';
      case 'medium': return 'bg-yellow-500/20';
      case 'hard': return 'bg-red-500/20';
      default: return 'bg-gray-500/20';
    }
  };

  const handleSelectChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setStep('invite');
  };

  const handleCustomChallenge = () => {
    const challenge: Challenge = {
      id: 'custom-' + generateId(6),
      type: 'custom',
      title: customChallenge.title || 'Custom Challenge',
      description: customChallenge.description || 'A custom challenge',
      target: customChallenge.target,
      unit: customChallenge.unit,
      timeLimit: customChallenge.timeLimit,
      reward: customChallenge.reward,
      difficulty: 'medium'
    };
    setSelectedChallenge(challenge);
    setStep('invite');
  };

  const addFriendEmail = () => {
    setFriendEmails([...friendEmails, '']);
  };

  const updateFriendEmail = (index: number, email: string) => {
    const updated = [...friendEmails];
    updated[index] = email;
    setFriendEmails(updated);
  };

  const removeFriendEmail = (index: number) => {
    setFriendEmails(friendEmails.filter((_, i) => i !== index));
  };

  const sendChallenge = async () => {
    if (!selectedChallenge) return;

    // In real app, this would call the API to send challenges
    console.log('Sending challenge:', selectedChallenge, 'to:', friendEmails);
    
    setStep('sent');
    
    // Simulate API delay
    setTimeout(() => {
      setStep('select');
      onClose?.();
    }, 3000);
  };

  const shareChallengeUrl = async () => {
    if (!selectedChallenge) return;
    
    const url = generateChallengeUrl(selectedChallenge);
    const success = await copyToClipboard(url);
    
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnSocial = () => {
    if (!selectedChallenge) return;
    
    const url = generateChallengeUrl(selectedChallenge);
    const text = `I challenge you to: ${selectedChallenge.title}! Can you beat me at cleaning code? 💻✨`;
    
    shareOnTwitter(text, url, ['CleanCode', 'CodeChallenge', 'FinishThisIdea']);
  };

  if (variant === 'widget') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-4"
      >
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Challenge Friends</h3>
            <p className="text-xs text-gray-400">Make coding social & fun</p>
          </div>
        </div>
        
        <button 
          onClick={() => setStep('select')}
          className="btn-primary w-full text-sm py-2"
        >
          Start Challenge
        </button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Challenge a Friend</h2>
                <p className="text-gray-400">Make code cleaning competitive & fun!</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Step: Select Challenge */}
          {step === 'select' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Choose a Challenge</h3>
                <div className="grid gap-4">
                  {predefinedChallenges.map((challenge) => (
                    <motion.button
                      key={challenge.id}
                      onClick={() => handleSelectChallenge(challenge)}
                      className="p-4 border border-gray-700 rounded-lg hover:border-primary-500 hover:bg-primary-500/5 transition-all text-left"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-white">{challenge.title}</h4>
                          <p className="text-sm text-gray-400 mt-1">{challenge.description}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span className={`text-xs px-2 py-1 rounded ${getDifficultyBg(challenge.difficulty)} ${getDifficultyColor(challenge.difficulty)}`}>
                            {challenge.difficulty}
                          </span>
                          {challenge.timeLimit && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{challenge.timeLimit}h</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-primary-400" />
                          <span className="text-gray-300">
                            {challenge.target} {challenge.unit}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Trophy className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400">{challenge.reward}</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-700 pt-6">
                <button
                  onClick={() => setStep('customize')}
                  className="btn-secondary w-full flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Create Custom Challenge</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step: Customize Challenge */}
          {step === 'customize' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-2 mb-4">
                <button onClick={() => setStep('select')} className="text-gray-400 hover:text-white">
                  ←
                </button>
                <h3 className="text-lg font-semibold text-white">Create Custom Challenge</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Challenge Title</label>
                  <input
                    type="text"
                    value={customChallenge.title}
                    onChange={(e) => setCustomChallenge({ ...customChallenge, title: e.target.value })}
                    placeholder="Epic Code Cleanup Battle"
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={customChallenge.description}
                    onChange={(e) => setCustomChallenge({ ...customChallenge, description: e.target.value })}
                    placeholder="Let's see who can clean more code faster!"
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Target</label>
                    <input
                      type="number"
                      value={customChallenge.target}
                      onChange={(e) => setCustomChallenge({ ...customChallenge, target: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Unit</label>
                    <select
                      value={customChallenge.unit}
                      onChange={(e) => setCustomChallenge({ ...customChallenge, unit: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                    >
                      <option value="cleanups">cleanups</option>
                      <option value="lines processed">lines processed</option>
                      <option value="issues fixed">issues fixed</option>
                      <option value="consecutive days">consecutive days</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Time Limit (hours)</label>
                    <input
                      type="number"
                      value={customChallenge.timeLimit}
                      onChange={(e) => setCustomChallenge({ ...customChallenge, timeLimit: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Reward</label>
                    <input
                      type="text"
                      value={customChallenge.reward}
                      onChange={(e) => setCustomChallenge({ ...customChallenge, reward: e.target.value })}
                      placeholder="$5 credit + Custom Badge"
                      className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('select')}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  onClick={handleCustomChallenge}
                  className="btn-primary flex-1"
                >
                  Create Challenge
                </button>
              </div>
            </motion.div>
          )}

          {/* Step: Invite Friends */}
          {step === 'invite' && selectedChallenge && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-2 mb-4">
                <button onClick={() => setStep('select')} className="text-gray-400 hover:text-white">
                  ←
                </button>
                <h3 className="text-lg font-semibold text-white">Invite Friends</h3>
              </div>

              {/* Challenge Preview */}
              <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700">
                <h4 className="font-medium text-white mb-2">{selectedChallenge.title}</h4>
                <p className="text-sm text-gray-400 mb-3">{selectedChallenge.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary-400">
                    Target: {selectedChallenge.target} {selectedChallenge.unit}
                  </span>
                  <span className="text-yellow-400">
                    Reward: {selectedChallenge.reward}
                  </span>
                </div>
              </div>

              {/* Invite Methods */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-white mb-3">Share Challenge Link</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={shareChallengeUrl}
                      className="btn-secondary flex items-center space-x-2 flex-1"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                    <button
                      onClick={shareOnSocial}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <h4 className="font-medium text-white mb-3">Send Direct Invites</h4>
                  <div className="space-y-2">
                    {friendEmails.map((email, index) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => updateFriendEmail(index, e.target.value)}
                          placeholder="friend@example.com"
                          className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                        />
                        {friendEmails.length > 1 && (
                          <button
                            onClick={() => removeFriendEmail(index)}
                            className="px-3 py-2 text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={addFriendEmail}
                    className="text-primary-400 hover:text-primary-300 text-sm mt-2"
                  >
                    + Add another friend
                  </button>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('select')}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  onClick={sendChallenge}
                  className="btn-primary flex-1 flex items-center justify-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Send Challenge</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step: Challenge Sent */}
          {step === 'sent' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center"
              >
                <Sparkles className="w-12 h-12 text-white" />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Challenge Sent! 🚀</h3>
              <p className="text-gray-400 mb-6">
                Your friends will receive the challenge invitation and can accept to start competing!
              </p>
              
              <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
                <p className="text-sm text-primary-400">
                  You'll be notified when someone accepts your challenge. May the best coder win!
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChallengeAFriend;