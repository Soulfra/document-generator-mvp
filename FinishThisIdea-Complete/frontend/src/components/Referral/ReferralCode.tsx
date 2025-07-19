import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Share2, Twitter, Linkedin, Users, Gift, Zap, QrCode, Sparkles } from 'lucide-react';
import { copyToClipboard, shareOnTwitter, shareOnLinkedIn, generateQRCode } from '../../utils/sharing';
import ShareButtons from '../Share/ShareButtons';
import SocialProof from '../Share/SocialProof';

interface ReferralCodeProps {
  code: string;
  variant?: 'card' | 'inline' | 'hero' | 'enhanced';
  shares?: number;
  onShare?: (platform: string) => void;
  stats?: {
    totalReferrals: number;
    earnings: number;
    conversions: number;
  };
}

export const ReferralCode: React.FC<ReferralCodeProps> = ({ 
  code, 
  variant = 'card', 
  shares = 0, 
  onShare,
  stats
}) => {
  const [copied, setCopied] = useState(false);
  const [shareCount, setShareCount] = useState(shares);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showShareButtons, setShowShareButtons] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateQR = async () => {
    if (!qrCode) {
      const url = `https://finishthisidea.com?ref=${code}`;
      const qrDataUrl = await generateQRCode(url, {
        type: 'referral',
        referralCode: code,
        width: 256
      });
      setQrCode(qrDataUrl);
    }
    setShowQR(!showQR);
  };

  const handleShare = (platform: string) => {
    const message = `🚀 Check out FinishThisIdea - the AI-powered code cleanup tool! Use my referral code ${code} to get your first cleanup FREE and I'll earn $0.50! Win-win! 💻✨`;
    const url = `https://finishthisidea.com?ref=${code}`;

    switch (platform) {
      case 'twitter':
        shareOnTwitter(message, url);
        break;
      case 'linkedin':
        shareOnLinkedIn(url, 'FinishThisIdea - AI Code Cleanup', message);
        break;
      default:
        handleCopy();
    }

    setShareCount(prev => prev + 1);
    onShare?.(platform);
  };

  if (variant === 'enhanced') {
    return (
      <div className="space-y-6">
        {/* Enhanced Referral Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 relative overflow-hidden"
        >
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-accent-500/5 to-transparent" />
          <motion.div
            className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent rounded-full blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-primary-400" />
                  Your Referral Code
                </h3>
                <p className="text-gray-400 text-sm">Share and earn $0.50 per successful referral</p>
              </div>
              {stats && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-400">${stats.earnings}</div>
                  <div className="text-xs text-gray-500">Total Earned</div>
                </div>
              )}
            </div>

            {/* Referral Code Display */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-xl p-6 border border-primary-500/20 mb-6"
            >
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-white mb-2 tracking-wider">
                  {code}
                </div>
                <div className="text-sm text-gray-400">
                  Use this code at signup for a free first cleanup
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex justify-center space-x-3 mt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className={`
                    flex items-center px-4 py-2 rounded-lg font-medium transition-all
                    ${copied 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border-gray-600/30'
                    } border
                  `}
                >
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? 'Copied!' : 'Copy'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGenerateQR}
                  className="flex items-center px-4 py-2 bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded-lg hover:bg-primary-500/30 transition-all"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  QR Code
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowShareButtons(!showShareButtons)}
                  className="flex items-center px-4 py-2 bg-accent-500/20 text-accent-400 border border-accent-500/30 rounded-lg hover:bg-accent-500/30 transition-all"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </motion.button>
              </div>
            </motion.div>

            {/* QR Code Display */}
            {showQR && qrCode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-center mb-6"
              >
                <div className="inline-block p-4 bg-white rounded-xl">
                  <img src={qrCode} alt="Referral QR Code" className="w-32 h-32" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Scan to use referral code</p>
              </motion.div>
            )}

            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                  <div className="text-xl font-bold text-primary-400">{stats.totalReferrals}</div>
                  <div className="text-xs text-gray-500">Total Referrals</div>
                </div>
                <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                  <div className="text-xl font-bold text-accent-400">{stats.conversions}</div>
                  <div className="text-xs text-gray-500">Conversions</div>
                </div>
                <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                  <div className="text-xl font-bold text-green-400">{shareCount}</div>
                  <div className="text-xs text-gray-500">Shares</div>
                </div>
              </div>
            )}

            {/* URL Preview */}
            <div className="p-3 bg-gray-900/30 rounded-lg border border-gray-700/50">
              <div className="text-xs text-gray-500 mb-1">Referral Link:</div>
              <div className="text-sm font-mono text-gray-300 break-all">
                https://finishthisidea.com?ref={code}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Share Buttons */}
        {showShareButtons && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ShareButtons 
              title={`🚀 Check out FinishThisIdea - AI-powered code cleanup! Use my referral code ${code} for FREE first cleanup!`}
              description="Transform your messy codebase in minutes. Clean code, better performance, happier developers! 💻✨"
              stats={{
                linesCleared: 15000 + Math.floor(Math.random() * 5000),
                issuesFixed: 42 + Math.floor(Math.random() * 20),
                sizeReduced: 35 + Math.floor(Math.random() * 15)
              }}
            />
          </motion.div>
        )}

        {/* Social Proof */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SocialProof variant="testimonial" />
          <SocialProof variant="stats" compact />
        </div>

        {/* Trust Badges */}
        <SocialProof variant="trust-badges" />
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-2xl"
      >
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Your Referral Code</h2>
            <p className="text-blue-100">Share this code and earn $0.50 for every signup!</p>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30"
          >
            <div className="text-4xl font-mono font-bold tracking-wider mb-4">
              {code}
            </div>
            <div className="flex justify-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="flex items-center px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy'}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShare('twitter')}
                className="flex items-center px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Share
              </motion.button>
            </div>
          </motion.div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{shareCount}</div>
              <div className="text-blue-100 text-sm">Total Shares</div>
            </div>
            <div>
              <div className="text-2xl font-bold">$0.50</div>
              <div className="text-blue-100 text-sm">Per Referral</div>
            </div>
            <div>
              <div className="text-2xl font-bold">∞</div>
              <div className="text-blue-100 text-sm">Unlimited</div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <span className="text-sm text-gray-600">Your referral code: </span>
          <span className="font-mono font-semibold text-blue-600">{code}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    );
  }

  // Default 'card' variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-6 shadow-sm border"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <Gift className="w-5 h-5 mr-2 text-blue-600" />
            Your Referral Code
          </h3>
          <p className="text-gray-600 text-sm">Share and earn $0.50 per successful referral</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Shares</div>
          <div className="text-lg font-semibold text-blue-600">{shareCount}</div>
        </div>
      </div>

      {/* Referral Code Display */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-mono font-bold text-gray-900 mb-2 tracking-wider">
            {code}
          </div>
          <div className="text-sm text-gray-600">
            Use this code at signup for a free first cleanup
          </div>
        </div>
      </div>

      {/* Benefits Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <Users className="w-5 h-5 mx-auto text-green-600 mb-1" />
          <div className="text-sm font-medium text-green-700">Free First Cleanup</div>
          <div className="text-xs text-green-600">For your referrals</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <Gift className="w-5 h-5 mx-auto text-blue-600 mb-1" />
          <div className="text-sm font-medium text-blue-700">$0.50 Per Referral</div>
          <div className="text-xs text-blue-600">Earn money for each signup</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <Zap className="w-5 h-5 mx-auto text-purple-600 mb-1" />
          <div className="text-sm font-medium text-purple-700">Unlimited Referrals</div>
          <div className="text-xs text-purple-600">No limits on earnings</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCopy}
          className={`
            flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all
            ${copied 
              ? 'bg-green-100 text-green-700 border-green-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
            } border
          `}
        >
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? 'Copied!' : 'Copy Code'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleShare('twitter')}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Twitter className="w-4 h-4 mr-2" />
          Share
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleShare('linkedin')}
          className="flex items-center justify-center px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
        >
          <Linkedin className="w-4 h-4 mr-2" />
          LinkedIn
        </motion.button>
      </div>

      {/* URL Preview */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-500 mb-1">Referral Link:</div>
        <div className="text-sm font-mono text-gray-700 break-all">
          https://finishthisidea.com?ref={code}
        </div>
      </div>
    </motion.div>
  );
};