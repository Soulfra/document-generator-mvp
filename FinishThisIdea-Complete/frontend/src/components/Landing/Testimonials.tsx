import { motion } from 'framer-motion';
import { Star, Twitter } from 'lucide-react';

const testimonials = [
  {
    name: 'Alex Chen',
    role: 'Senior Developer @ TechCorp',
    avatar: 'AC',
    content: 'Cleaned up our 3-year-old React codebase in 5 minutes. What would have taken me a week was done for $1. Absolutely mind-blowing!',
    rating: 5,
    twitter: '@alexchen',
  },
  {
    name: 'Sarah Rodriguez',
    role: 'CTO @ StartupXYZ',
    avatar: 'SR',
    content: 'The profile system is genius! Created a custom profile for our team standards and now all our code follows the same style. Worth every penny.',
    rating: 5,
    twitter: '@srodriguez',
  },
  {
    name: 'Mike Johnson',
    role: 'Full Stack Developer',
    avatar: 'MJ',
    content: 'I was skeptical about the $1 price, but holy shit it actually works! Removed 2000+ lines of dead code from my Node.js project.',
    rating: 5,
    twitter: '@mikej',
  },
  {
    name: 'Emily Park',
    role: 'Engineering Manager @ BigCo',
    avatar: 'EP',
    content: 'We use this for every PR now. The before/after comparison is amazing for code reviews. Saves us hours every week.',
    rating: 5,
    twitter: '@emilypark',
  },
  {
    name: 'David Liu',
    role: 'Indie Developer',
    avatar: 'DL',
    content: 'As a solo dev, this is a lifesaver. I can focus on building features instead of cleaning code. The AI understands context perfectly.',
    rating: 5,
    twitter: '@davidliu',
  },
  {
    name: 'Rachel Green',
    role: 'Lead Engineer @ DevShop',
    avatar: 'RG',
    content: 'The Python profile cleaned up our Django project beautifully. Even fixed some PEP8 issues our linter missed!',
    rating: 5,
    twitter: '@rachelgreen',
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Developers <span className="gradient-text">love</span> us
          </h2>
          <p className="text-xl text-gray-400">
            Join thousands of happy developers who've transformed their code
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 hover:scale-105 transition-all duration-300"
            >
              {/* Rating */}
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-300 mb-6">"{testimonial.content}"</p>

              {/* Author */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-sm font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
                <a
                  href={`https://twitter.com/${testimonial.twitter.slice(1)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-primary-400 transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center space-x-2 glass-card px-6 py-3">
            <div className="flex -space-x-2">
              {['AC', 'SR', 'MJ', 'EP', 'DL'].map((avatar, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-semibold border-2 border-gray-900"
                >
                  {avatar}
                </div>
              ))}
            </div>
            <span className="text-gray-400">
              +10,234 developers cleaned their code this month
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;