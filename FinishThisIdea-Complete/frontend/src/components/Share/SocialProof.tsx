import { motion } from 'framer-motion';
import { Star, Quote, Users, Verified } from 'lucide-react';

interface SocialProofProps {
  variant?: 'testimonial' | 'stats' | 'trust-badges';
  compact?: boolean;
}

const testimonials = [
  {
    text: "Holy shit, this actually works! Cleaned 3 years of messy React code in 5 minutes.",
    author: "Alex Chen",
    role: "Senior Dev @ TechCorp",
    avatar: "AC",
    rating: 5
  },
  {
    text: "Best $1 I've ever spent. My entire team now uses this for every PR.",
    author: "Sarah Rodriguez", 
    role: "CTO @ StartupXYZ",
    avatar: "SR",
    rating: 5
  },
  {
    text: "Removed 2000+ lines of dead code from my Node.js project. Mind blown! 🤯",
    author: "Mike Johnson",
    role: "Full Stack Developer",
    avatar: "MJ", 
    rating: 5
  }
];

const trustBadges = [
  { icon: Verified, text: "SOC 2 Compliant", color: "text-green-400" },
  { icon: Users, text: "12K+ Developers", color: "text-blue-400" },
  { icon: Star, text: "4.9/5 Rating", color: "text-yellow-400" },
];

const SocialProof = ({ variant = 'testimonial', compact = false }: SocialProofProps) => {
  if (variant === 'trust-badges') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${compact ? 'flex-col space-y-2' : 'flex-row space-x-6'} items-center justify-center`}
      >
        {trustBadges.map((badge, index) => {
          const Icon = badge.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-2 glass-card px-3 py-2"
            >
              <Icon className={`w-4 h-4 ${badge.color}`} />
              <span className="text-sm text-gray-300">{badge.text}</span>
            </motion.div>
          );
        })}
      </motion.div>
    );
  }

  if (variant === 'stats') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4"
      >
        <div className="text-center">
          <div className="flex justify-center space-x-6 mb-4">
            <div>
              <div className="text-2xl font-bold text-primary-400">12.8K+</div>
              <div className="text-xs text-gray-500">Happy Devs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent-400">2.1M+</div>
              <div className="text-xs text-gray-500">Lines Cleaned</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">4.9★</div>
              <div className="text-xs text-gray-500">Average Rating</div>
            </div>
          </div>
          
          {/* Avatar stack */}
          <div className="flex justify-center -space-x-2 mb-2">
            {['AC', 'SR', 'MJ', 'EP', 'DL'].map((avatar, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-semibold border-2 border-gray-900"
              >
                {avatar}
              </div>
            ))}
          </div>
          
          <p className="text-sm text-gray-400">
            Join thousands of developers who've cleaned their code
          </p>
        </div>
      </motion.div>
    );
  }

  // Default testimonial variant
  const randomTestimonial = testimonials[Math.floor(Math.random() * testimonials.length)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card ${compact ? 'p-4' : 'p-6'} relative overflow-hidden`}
    >
      <Quote className="absolute top-2 right-2 w-8 h-8 text-primary-500/20" />
      
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
          {randomTestimonial.avatar}
        </div>
        
        <div className="flex-1">
          {/* Rating */}
          <div className="flex mb-2">
            {[...Array(randomTestimonial.rating)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            ))}
          </div>
          
          {/* Testimonial */}
          <p className={`text-gray-300 mb-3 ${compact ? 'text-sm' : 'text-base'}`}>
            "{randomTestimonial.text}"
          </p>
          
          {/* Author */}
          <div>
            <div className={`font-semibold text-white ${compact ? 'text-sm' : 'text-base'}`}>
              {randomTestimonial.author}
            </div>
            <div className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
              {randomTestimonial.role}
            </div>
          </div>
        </div>
      </div>

      {/* Verification badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        className="absolute bottom-2 right-2 flex items-center space-x-1 bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs"
      >
        <Verified className="w-3 h-3" />
        <span>Verified</span>
      </motion.div>

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 3,
          ease: "easeInOut",
          repeat: Infinity,
          repeatDelay: 5,
        }}
      />
    </motion.div>
  );
};

export default SocialProof;