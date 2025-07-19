import { motion } from 'framer-motion';
import { Share2, Twitter, Facebook, Linkedin, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ShareButtonsProps {
  title?: string;
  description?: string;
  stats?: {
    linesCleared: number;
    issuesFixed: number;
    sizeReduced: number;
  };
}

const ShareButtons = ({ 
  title = "I just cleaned my messy code for $1!", 
  description = "Transformed my codebase in minutes with AI-powered cleanup. You should try it too!",
  stats
}: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false);
  
  const url = typeof window !== 'undefined' ? window.location.origin : 'https://finishthisidea.com';
  
  const shareText = stats 
    ? `${title} ✨\n\n📊 ${stats.linesCleared.toLocaleString()} lines processed\n🐛 ${stats.issuesFixed} issues fixed\n📉 ${stats.sizeReduced}% size reduced\n\n${description}\n\n${url}`
    : `${title}\n\n${description}\n\n${url}`;

  const shareUrl = encodeURIComponent(url);
  const shareTitle = encodeURIComponent(title);
  const shareDescription = encodeURIComponent(description);

  const socialLinks = [
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      color: 'hover:bg-blue-500/20 hover:text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}&title=${shareTitle}&summary=${shareDescription}`,
      color: 'hover:bg-blue-600/20 hover:text-blue-300',
      bgColor: 'bg-blue-600/10'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareTitle}`,
      color: 'hover:bg-blue-700/20 hover:text-blue-200',
      bgColor: 'bg-blue-700/10'
    }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
          <Share2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Share Your Success</h3>
          <p className="text-sm text-gray-400">Help others discover clean code for $1</p>
        </div>
      </div>

      {/* Stats Preview */}
      {stats && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/50 rounded-lg p-4 mb-6"
        >
          <h4 className="text-sm font-medium text-gray-300 mb-3">Your Cleanup Results:</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-primary-400">
                {stats.linesCleared.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Lines Processed</div>
            </div>
            <div>
              <div className="text-xl font-bold text-accent-400">
                {stats.issuesFixed}
              </div>
              <div className="text-xs text-gray-500">Issues Fixed</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-400">
                {stats.sizeReduced}%
              </div>
              <div className="text-xs text-gray-500">Size Reduced</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Social buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {socialLinks.map((social, index) => {
          const Icon = social.icon;
          return (
            <motion.a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                flex items-center justify-center space-x-2 p-3 rounded-lg border border-gray-700
                transition-all duration-200 ${social.color} ${social.bgColor}
                hover:scale-105 hover:border-gray-600
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{social.name}</span>
            </motion.a>
          );
        })}
      </div>

      {/* Copy link button */}
      <motion.button
        onClick={copyToClipboard}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`
          w-full flex items-center justify-center space-x-2 p-3 rounded-lg border transition-all duration-200
          ${copied 
            ? 'border-green-500/50 bg-green-500/10 text-green-400' 
            : 'border-gray-700 bg-gray-800/20 text-gray-300 hover:border-gray-600 hover:bg-gray-800/40'
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Copied to Clipboard!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span className="text-sm font-medium">Copy Share Link</span>
          </>
        )}
      </motion.button>

      {/* Incentive message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 p-3 bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-lg border border-primary-500/20"
      >
        <p className="text-xs text-center text-gray-400">
          💡 <span className="text-primary-400 font-medium">Pro tip:</span> Share and get others hooked on clean code! 
          Every developer who tries it helps build the movement.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default ShareButtons;