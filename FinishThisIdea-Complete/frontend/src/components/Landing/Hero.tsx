import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Code2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const codeExamples = [
  { lang: 'JavaScript', messy: 'var x=5;function   doStuff(){console.log("test")}', clean: 'const x = 5;\n\nfunction doStuff() {\n  console.log("test");\n}' },
  { lang: 'Python', messy: 'def func(x):return x*2\nprint(  func(5)  )', clean: 'def func(x):\n    return x * 2\n\nprint(func(5))' },
  { lang: 'TypeScript', messy: 'interface User{name:string,age:number}', clean: 'interface User {\n  name: string;\n  age: number;\n}' },
];

const Hero = () => {
  const [codeIndex, setCodeIndex] = useState(0);
  const [isTransforming, setIsTransforming] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransforming(true);
      setTimeout(() => {
        setCodeIndex((prev) => (prev + 1) % codeExamples.length);
        setIsTransforming(false);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const currentExample = codeExamples[codeIndex];

  return (
    <section className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center space-x-2 mb-6">
              <div className="px-3 py-1 bg-accent-500/20 text-accent-400 rounded-full text-sm font-semibold">
                🎉 First cleanup FREE
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              Transform your
              <span className="block gradient-text">messy code</span>
              for just $1
            </h1>

            <p className="text-xl text-gray-400 mb-8">
              AI-powered code cleanup that removes dead code, fixes formatting, 
              organizes files, and makes your codebase shine. All in minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link
                to="/upload"
                className="inline-flex items-center justify-center space-x-2 btn-primary text-lg px-8 py-4"
              >
                <Sparkles className="w-5 h-5" />
                <span>Clean My Code</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/profiles"
                className="inline-flex items-center justify-center space-x-2 btn-secondary text-lg px-8 py-4"
              >
                <Code2 className="w-5 h-5" />
                <span>Browse Profiles</span>
              </Link>
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-500">
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

          {/* Right content - Code transformation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="glass-card p-8 relative overflow-hidden">
              {/* Language badge */}
              <div className="absolute top-4 right-4 px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm font-semibold">
                {currentExample.lang}
              </div>

              {/* Before */}
              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-2">Before</div>
                <div className={`code-block transition-all duration-500 ${isTransforming ? 'opacity-50 scale-95' : ''}`}>
                  <pre className="text-red-400 whitespace-pre-wrap">
                    {currentExample.messy}
                  </pre>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center my-4">
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <ArrowRight className="w-6 h-6 text-primary-500 rotate-90" />
                </motion.div>
              </div>

              {/* After */}
              <div>
                <div className="text-sm text-gray-500 mb-2">After</div>
                <div className={`code-block transition-all duration-500 ${isTransforming ? 'opacity-50 scale-105' : ''}`}>
                  <pre className="text-green-400 whitespace-pre">
                    {currentExample.clean}
                  </pre>
                </div>
              </div>

              {/* Sparkle effect */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: isTransforming ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-primary-500" />
              </motion.div>
            </div>

            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute -top-4 -left-4 glass-card px-4 py-2 text-sm"
            >
              <span className="text-accent-400">50M+ lines cleaned</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, delay: 1 }}
              className="absolute -bottom-4 -right-4 glass-card px-4 py-2 text-sm"
            >
              <span className="text-primary-400">10K+ happy devs</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;