import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Shield, Verified } from 'lucide-react';
import UserProfile from '../components/Profile/UserProfile';
import ActivityWidget from '../components/Activity/ActivityWidget';
import StatsCard from '../components/Share/StatsCard';
import SocialProof from '../components/Share/SocialProof';

const PublicProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(true);

  // Mock loading and validation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      // In real app, validate if profile exists
      setProfileExists(!!username);
    }, 1000);

    return () => clearTimeout(timer);
  }, [username]);

  // SEO Meta tags (in real app, this would be handled by helmet or similar)
  useEffect(() => {
    if (!isLoading && profileExists) {
      document.title = `${username}'s Code Transformation Profile | FinishThisIdea`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 
          `See ${username}'s amazing code transformations! Clean code for just $1. Join thousands of developers transforming their codebase.`
        );
      }
    }
  }, [username, isLoading, profileExists]);

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" />
          <div className="absolute bottom-1/4 -right-4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float animation-delay-400" />
        </div>

        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <h2 className="text-xl font-semibold text-white mb-2">Loading Profile</h2>
            <p className="text-gray-400">Fetching {username}'s achievements...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!profileExists) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" />
          <div className="absolute bottom-1/4 -right-4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float animation-delay-400" />
        </div>

        <div className="flex items-center justify-center min-h-screen px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-24 h-24 bg-gray-800 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Shield className="w-12 h-12 text-gray-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">Profile Not Found</h1>
            <p className="text-gray-400 mb-8">
              The profile you're looking for doesn't exist or has been made private.
            </p>
            
            <div className="space-y-4">
              <Link to="/" className="btn-primary inline-block">
                Go to Homepage
              </Link>
              <Link to="/upload" className="btn-secondary inline-block ml-4">
                Clean Your Code
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" />
        <div className="absolute bottom-1/4 -right-4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float animation-delay-400" />
      </div>

      {/* Navigation */}
      <nav className="px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-sm">
              <Verified className="w-4 h-4" />
              <span>Verified Profile</span>
            </div>
            
            <Link to="/upload" className="btn-primary text-sm px-4 py-2">
              Clean Your Code
            </Link>
          </div>
        </div>
      </nav>

      {/* Profile Content */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Profile */}
          <div className="lg:col-span-2">
            <UserProfile userId={username || ''} isOwnProfile={false} variant="full" />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ActivityWidget variant="stats" />
            </motion.div>

            {/* Community Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <StatsCard variant="compact" />
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <SocialProof variant="testimonial" compact={true} />
            </motion.div>

            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-card p-6 text-center"
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                Ready to Transform Your Code?
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Join {username} and thousands of other developers who've cleaned their code for just $1
              </p>
              <Link to="/upload" className="btn-primary w-full">
                Start Your Transformation
              </Link>
              <p className="text-xs text-gray-500 mt-2">
                🎉 First cleanup is FREE for new users!
              </p>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <SocialProof variant="trust-badges" compact={true} />
            </motion.div>
          </div>
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center glass-card p-8"
        >
          <h2 className="text-3xl font-bold mb-4">
            Inspired by <span className="gradient-text">{username}'s</span> Results?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Your codebase transformation is just one click away
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/upload" className="btn-primary text-lg px-8 py-4">
              Transform Your Code for $1
            </Link>
            <Link to="/profiles" className="btn-secondary text-lg px-8 py-4">
              Browse More Profiles
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <span>✅</span>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>⚡</span>
              <span>5 minute average</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>🔒</span>
              <span>Secure & Private</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "mainEntity": {
              "@type": "Person",
              "name": username,
              "description": `${username}'s code transformation profile on FinishThisIdea`,
              "url": `${window.location.origin}/profile/${username}`,
              "sameAs": [`${window.location.origin}/profile/${username}`]
            },
            "about": {
              "@type": "Service",
              "name": "FinishThisIdea Code Cleanup",
              "description": "AI-powered code cleanup service for just $1",
              "provider": {
                "@type": "Organization",
                "name": "FinishThisIdea"
              }
            }
          })
        }}
      />
    </div>
  );
};

export default PublicProfilePage;