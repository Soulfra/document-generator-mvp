import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, Code2, Zap, DollarSign, Users, Trophy, ArrowRight } from 'lucide-react';
import Hero from '../components/Landing/Hero';
import HowItWorks from '../components/Landing/HowItWorks';
import LiveStats from '../components/Landing/LiveStats';
import Testimonials from '../components/Landing/Testimonials';

const HomePage = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float animation-delay-400" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float animation-delay-600" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <Sparkles className="w-8 h-8 text-primary-500" />
            <span className="text-2xl font-bold gradient-text">FinishThisIdea</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-6"
          >
            <Link
              to="/marketplace"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Marketplace
            </Link>
            <Link
              to="/profiles"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Profiles
            </Link>
            <Link
              to="/upload"
              className="btn-primary flex items-center space-x-2"
            >
              <span>Start Cleaning</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <Hero />

      {/* Social Proof Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="py-8 border-y border-gray-800"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 text-gray-400">
            <div className="flex items-center space-x-2">
              <Code2 className="w-5 h-5 text-primary-500" />
              <span><strong className="text-white">50M+</strong> lines cleaned</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary-500" />
              <span><strong className="text-white">10K+</strong> happy developers</span>
            </div>
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-primary-500" />
              <span><strong className="text-white">4.9/5</strong> average rating</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-primary-500" />
              <span><strong className="text-white">5 min</strong> average time</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* How It Works */}
      <HowItWorks />

      {/* Live Stats */}
      <LiveStats />

      {/* Price Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-12"
          >
            <div className="mb-8">
              <h2 className="text-5xl font-bold mb-4">
                <span className="gradient-text">Simple Pricing</span>
              </h2>
              <p className="text-xl text-gray-400">No subscriptions. No hidden fees. Just results.</p>
            </div>

            <div className="flex items-center justify-center mb-8">
              <DollarSign className="w-16 h-16 text-accent-500" />
              <span className="text-8xl font-bold text-white">1</span>
            </div>

            <p className="text-2xl text-gray-300 mb-8">
              That's less than a cup of coffee ☕
            </p>

            <Link
              to="/upload"
              className="inline-flex items-center space-x-3 btn-primary text-lg px-8 py-4"
            >
              <span>Clean My Code Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <p className="mt-6 text-gray-500">
              🎁 First cleanup is FREE for new users!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Section */}
      <section className="py-24 px-6 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Ready to <span className="gradient-text">transform</span> your code?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 mb-8"
          >
            Join thousands of developers who've already cleaned their codebases
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link
              to="/upload"
              className="inline-flex items-center space-x-3 btn-primary text-lg px-8 py-4 glow"
            >
              <span>Start Now - First One Free!</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center text-gray-500">
          <p>© 2024 FinishThisIdea. Made with ❤️ by developers, for developers.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;