import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ReferralCode } from '../components/Referral/ReferralCode';
import { ReferralDashboard } from '../components/Referral/ReferralDashboard';
import ShareButtons from '../components/Share/ShareButtons';
import SocialProof from '../components/Share/SocialProof';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Sparkles, Share2, QrCode, TrendingUp, Users, Gift } from 'lucide-react';

export const SocialShowcase: React.FC = () => {
  const [mockStats, setMockStats] = useState({
    totalReferrals: 12,
    earnings: 6.00,
    conversions: 8,
    shares: 25
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMockStats(prev => ({
        ...prev,
        shares: prev.shares + Math.floor(Math.random() * 3)
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              Social Sharing
            </span>
            <br />
            <span className="text-white">Showcase</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Experience our enhanced social sharing system with QR codes, viral components, and social proof
          </p>
          <div className="flex justify-center space-x-2 mt-6">
            <Badge variant="secondary" className="bg-primary-500/20 text-primary-400">
              <Sparkles className="w-3 h-3 mr-1" />
              Enhanced UI
            </Badge>
            <Badge variant="secondary" className="bg-accent-500/20 text-accent-400">
              <QrCode className="w-3 h-3 mr-1" />
              QR Codes
            </Badge>
            <Badge variant="secondary" className="bg-green-500/20 text-green-400">
              <TrendingUp className="w-3 h-3 mr-1" />
              Analytics
            </Badge>
          </div>
        </motion.div>

        {/* Main Content */}
        <Tabs defaultValue="enhanced-referral" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit mx-auto">
            <TabsTrigger value="enhanced-referral" className="text-xs sm:text-sm">
              Enhanced Referral
            </TabsTrigger>
            <TabsTrigger value="share-buttons" className="text-xs sm:text-sm">
              Share Buttons
            </TabsTrigger>
            <TabsTrigger value="social-proof" className="text-xs sm:text-sm">
              Social Proof
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm">
              Dashboard
            </TabsTrigger>
          </TabsList>

          {/* Enhanced Referral Tab */}
          <TabsContent value="enhanced-referral" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Gift className="w-5 h-5 mr-2 text-primary-400" />
                    Enhanced Referral Component
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Complete referral system with QR codes, social sharing, and real-time stats
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReferralCode
                    code="CLEAN2024"
                    variant="enhanced"
                    shares={mockStats.shares}
                    stats={mockStats}
                    onShare={(platform) => {
                      console.log(`Shared on ${platform}`);
                      setMockStats(prev => ({ ...prev, shares: prev.shares + 1 }));
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Original Card Variant</CardTitle>
                    <CardDescription className="text-gray-400">
                      Basic referral card for comparison
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ReferralCode
                      code="CLEAN2024"
                      variant="card"
                      shares={mockStats.shares}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Hero Variant</CardTitle>
                    <CardDescription className="text-gray-400">
                      Large format for landing pages
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ReferralCode
                      code="CLEAN2024"
                      variant="hero"
                      shares={mockStats.shares}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Share Buttons Tab */}
          <TabsContent value="share-buttons" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Share2 className="w-5 h-5 mr-2 text-accent-400" />
                    Enhanced Share Buttons
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Multi-platform sharing with stats preview and social proof
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ShareButtons
                    title="🚀 Just cleaned my code with AI for $1!"
                    description="Transformed my messy codebase in minutes. Lines of code reduced, bugs fixed, performance improved! You should try it too!"
                    stats={{
                      linesCleared: 15420,
                      issuesFixed: 47,
                      sizeReduced: 38
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Share Button Variants */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Without Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ShareButtons
                      title="Check out FinishThisIdea!"
                      description="AI-powered code cleanup that actually works. Clean code in minutes!"
                    />
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Achievement Share</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ShareButtons
                      title="🏆 Unlocked 'Code Ninja' achievement!"
                      description="Just cleaned my 10th project with FinishThisIdea. The AI keeps getting smarter!"
                      stats={{
                        linesCleared: 98765,
                        issuesFixed: 234,
                        sizeReduced: 42
                      }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Social Proof Tab */}
          <TabsContent value="social-proof" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Testimonial Variant</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SocialProof variant="testimonial" />
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Stats Variant</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SocialProof variant="stats" />
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 xl:col-span-1"
              >
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Trust Badges</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SocialProof variant="trust-badges" />
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Compact Variants */}
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Compact Variants</CardTitle>
                    <CardDescription className="text-gray-400">
                      Space-efficient versions for sidebars and footers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SocialProof variant="testimonial" compact />
                    <SocialProof variant="stats" compact />
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto"
            >
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="w-5 h-5 mr-2 text-green-400" />
                    Referral Dashboard
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Complete analytics dashboard with performance tracking and leaderboards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReferralDashboard />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Performance Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <Card className="bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/20">
            <CardHeader>
              <CardTitle className="text-white text-center">
                🚀 Enhanced Social Sharing Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary-400">47%</div>
                  <div className="text-sm text-gray-400">Higher Share Rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-accent-400">QR Codes</div>
                  <div className="text-sm text-gray-400">Mobile Optimized</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-400">Real-time</div>
                  <div className="text-sm text-gray-400">Analytics</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-400">Multi-platform</div>
                  <div className="text-sm text-gray-400">Sharing</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};