import { motion } from 'framer-motion';
import { Upload, Wand2, Download, Sparkles } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload Your Code',
    description: 'Drop your ZIP file or connect your GitHub repo. We support all major languages.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
  },
  {
    icon: Wand2,
    title: 'Choose Your Style',
    description: 'Pick from pre-built profiles or create custom rules for your team\'s standards.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/20',
  },
  {
    icon: Sparkles,
    title: 'AI Does Its Magic',
    description: 'Our AI analyzes, cleans, and reorganizes your code in minutes, not hours.',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/20',
  },
  {
    icon: Download,
    title: 'Download & Ship',
    description: 'Get your cleaned codebase with detailed reports on what was improved.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How it <span className="gradient-text">works</span>
          </h2>
          <p className="text-xl text-gray-400">
            Four simple steps to transform your codebase
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-gray-700 to-transparent" />
              )}

              <div className="glass-card p-6 h-full hover:scale-105 transition-transform">
                <div className={`${step.bgColor} w-16 h-16 rounded-xl flex items-center justify-center mb-4`}>
                  <step.icon className={`w-8 h-8 ${step.color}`} />
                </div>

                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>

                {/* Step number */}
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Before/After comparison */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 glass-card p-8 overflow-hidden"
        >
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-red-400">❌ Before</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Inconsistent formatting and indentation</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Dead code and unused imports cluttering files</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Files scattered with no clear organization</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Duplicated functions across multiple files</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-4 text-green-400">✅ After</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Perfectly formatted code following your standards</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Clean imports with only what's actually used</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Logical folder structure that makes sense</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>DRY code with shared utilities extracted</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;