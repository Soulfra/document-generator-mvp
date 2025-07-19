import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ArrowRight, Eye, Code, CheckCircle, AlertCircle, Minus, Plus } from 'lucide-react';

interface CodeExample {
  id: string;
  title: string;
  language: string;
  before: string;
  after: string;
  improvements: string[];
  stats: {
    linesRemoved: number;
    linesAdded: number;
    issuesFixed: number;
  };
}

interface CodeComparisonProps {
  examples?: CodeExample[];
  autoRotate?: boolean;
  showStats?: boolean;
}

const defaultExamples: CodeExample[] = [
  {
    id: 'javascript-cleanup',
    title: 'JavaScript Cleanup',
    language: 'javascript',
    before: `var x=5;
var unused=10;
function   doStuff(){
console.log("test");
var y=x+1;return y;}
function duplicateFunction(){
console.log("duplicate");
}
function duplicateFunction2(){
console.log("duplicate");
}`,
    after: `const x = 5;

function doStuff() {
  console.log('test');
  const y = x + 1;
  return y;
}

function logMessage(message) {
  console.log(message);
}`,
    improvements: [
      'Removed unused variables',
      'Fixed inconsistent formatting', 
      'Eliminated duplicate functions',
      'Used const instead of var',
      'Added proper spacing'
    ],
    stats: {
      linesRemoved: 4,
      linesAdded: 2,
      issuesFixed: 5
    }
  },
  {
    id: 'react-modernization',
    title: 'React Modernization',
    language: 'typescript',
    before: `class UserComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { user: null };
  }
  
  componentDidMount() {
    fetchUser().then(user => {
      this.setState({ user });
    });
  }
  
  render() {
    return <div>{this.state.user?.name}</div>;
  }
}`,
    after: `interface User {
  name: string;
  id: string;
}

const UserComponent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    fetchUser().then(setUser);
  }, []);
  
  return <div>{user?.name}</div>;
};`,
    improvements: [
      'Converted to functional component',
      'Added TypeScript types',
      'Used modern hooks pattern',
      'Improved code readability',
      'Better state management'
    ],
    stats: {
      linesRemoved: 6,
      linesAdded: 4,
      issuesFixed: 3
    }
  },
  {
    id: 'python-optimization',
    title: 'Python Optimization',
    language: 'python',
    before: `def process_data(data):
    result=[]
    for i in range(len(data)):
        if data[i]>0:
            result.append(data[i]*2)
    return result

def unused_function():
    pass

process_data([1,2,3,4,5])`,
    after: `def process_data(data: list[int]) -> list[int]:
    """Process positive numbers by doubling them."""
    return [item * 2 for item in data if item > 0]

result = process_data([1, 2, 3, 4, 5])`,
    improvements: [
      'Added type hints',
      'Used list comprehension',
      'Removed unused function',
      'Added docstring',
      'Improved performance'
    ],
    stats: {
      linesRemoved: 5,
      linesAdded: 2,
      issuesFixed: 4
    }
  }
];

const CodeComparison = ({ 
  examples = defaultExamples, 
  autoRotate = true, 
  showStats = true 
}: CodeComparisonProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentExample = examples[currentIndex];

  const nextExample = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % examples.length);
      setIsAnimating(false);
    }, 300);
  };

  const formatCode = (code: string) => {
    return code.split('\n').map((line, index) => ({
      number: index + 1,
      content: line,
      type: line.trim() === '' ? 'empty' : 'normal'
    }));
  };

  const beforeLines = formatCode(currentExample.before);
  const afterLines = formatCode(currentExample.after);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">
            {currentExample.title}
          </h3>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-400 capitalize">
              {currentExample.language}
            </span>
            {showStats && (
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <Minus className="w-3 h-3 text-red-400" />
                  <span>{currentExample.stats.linesRemoved}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Plus className="w-3 h-3 text-green-400" />
                  <span>{currentExample.stats.linesAdded}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3 text-blue-400" />
                  <span>{currentExample.stats.issuesFixed} fixes</span>
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={nextExample}
          className="btn-secondary text-sm px-4 py-2"
          disabled={isAnimating}
        >
          Next Example
        </button>
      </div>

      {/* Code comparison */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Before */}
        <motion.div
          className="relative"
          animate={{ opacity: isAnimating ? 0.5 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">Before</span>
          </div>
          
          <div className="bg-gray-900 rounded-lg overflow-hidden border border-red-500/20">
            <div className="bg-red-500/10 px-4 py-2 border-b border-red-500/20">
              <span className="text-xs text-red-300">Messy Code</span>
            </div>
            <div className="p-4 font-mono text-sm overflow-x-auto">
              {beforeLines.map((line, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 hover:bg-red-500/5 transition-colors"
                >
                  <span className="text-gray-600 text-xs w-6 text-right flex-shrink-0">
                    {line.number}
                  </span>
                  <span className={`text-red-300 ${line.type === 'empty' ? 'h-5' : ''}`}>
                    {line.content || '\u00A0'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* After */}
        <motion.div
          className="relative"
          animate={{ opacity: isAnimating ? 0.5 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">After</span>
          </div>
          
          <div className="bg-gray-900 rounded-lg overflow-hidden border border-green-500/20">
            <div className="bg-green-500/10 px-4 py-2 border-b border-green-500/20">
              <span className="text-xs text-green-300">Clean Code</span>
            </div>
            <div className="p-4 font-mono text-sm overflow-x-auto">
              {afterLines.map((line, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 hover:bg-green-500/5 transition-colors"
                >
                  <span className="text-gray-600 text-xs w-6 text-right flex-shrink-0">
                    {line.number}
                  </span>
                  <span className={`text-green-300 ${line.type === 'empty' ? 'h-5' : ''}`}>
                    {line.content || '\u00A0'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Arrow between */}
      <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <motion.div
          animate={{ 
            x: [0, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <ArrowRight className="w-6 h-6 text-white" />
        </motion.div>
      </div>

      {/* Improvements list */}
      <motion.div
        animate={{ opacity: isAnimating ? 0.5 : 1 }}
        transition={{ duration: 0.3 }}
        className="bg-gray-900/30 rounded-lg p-4"
      >
        <h4 className="text-sm font-medium text-white mb-3 flex items-center space-x-2">
          <Code className="w-4 h-4 text-primary-400" />
          <span>Improvements Made</span>
        </h4>
        <div className="grid md:grid-cols-2 gap-2">
          {currentExample.improvements.map((improvement, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-2 text-sm text-gray-400"
            >
              <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
              <span>{improvement}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Example indicators */}
      <div className="flex justify-center space-x-2 mt-4">
        {examples.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentIndex 
                ? 'bg-primary-500 w-6' 
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default CodeComparison;