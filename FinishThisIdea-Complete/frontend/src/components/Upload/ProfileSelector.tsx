import { motion } from 'framer-motion';
import { Check, Zap, Shield, Sparkles, Code2 } from 'lucide-react';

interface ProfileSelectorProps {
  selectedProfile: string;
  onProfileSelect: (profileId: string) => void;
}

const profiles = [
  {
    id: 'js-standard',
    name: 'JavaScript Standard',
    description: 'Clean, readable JavaScript following community standards',
    icon: Code2,
    color: 'from-yellow-500 to-orange-500',
    features: [
      'ESLint Standard Style',
      'Consistent semicolons',
      'Proper indentation',
      'Clean imports'
    ],
    example: `// Before
var x=5;function   doStuff(){
console.log("test");}

// After  
const x = 5;

function doStuff() {
  console.log('test');
}`,
    popular: true
  },
  {
    id: 'ts-strict',
    name: 'TypeScript Strict',
    description: 'Type-safe TypeScript with strict compiler options',
    icon: Shield,
    color: 'from-blue-500 to-purple-500',
    features: [
      'Strict type checking',
      'Explicit return types',
      'No implicit any',
      'Proper interfaces'
    ],
    example: `// Before
function calc(a, b) {
  return a + b;
}

// After
function calc(a: number, b: number): number {
  return a + b;
}`,
    popular: false
  },
  {
    id: 'python-pep8',
    name: 'Python PEP8',
    description: 'Pythonic code following PEP8 style guidelines',
    icon: Zap,
    color: 'from-green-500 to-blue-500',
    features: [
      'PEP8 compliant',
      'Proper line length',
      'Snake_case naming',
      'Clean docstrings'
    ],
    example: `# Before
def func(x):return x*2
print(  func(5)  )

# After
def func(x: int) -> int:
    """Double the input value."""
    return x * 2

print(func(5))`,
    popular: false
  },
  {
    id: 'react-modern',
    name: 'React Modern',
    description: 'Modern React with hooks, TypeScript, and best practices',
    icon: Sparkles,
    color: 'from-cyan-500 to-pink-500',
    features: [
      'Functional components',
      'Custom hooks',
      'TypeScript props',
      'JSX best practices'
    ],
    example: `// Before
class MyComponent extends React.Component {
  render() {
    return <div>{this.props.text}</div>;
  }
}

// After
interface Props {
  text: string;
}

const MyComponent: React.FC<Props> = ({ text }) => {
  return <div>{text}</div>;
};`,
    popular: true
  }
];

const ProfileSelector = ({ selectedProfile, onProfileSelect }: ProfileSelectorProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {profiles.map((profile, index) => {
        const Icon = profile.icon;
        const isSelected = selectedProfile === profile.id;
        
        return (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            {/* Popular badge */}
            {profile.popular && (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.1 + 0.2, type: "spring", stiffness: 200 }}
                className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-accent-400 to-accent-600 text-white text-xs font-bold px-3 py-1 rounded-full"
              >
                POPULAR
              </motion.div>
            )}

            <motion.button
              onClick={() => onProfileSelect(profile.id)}
              className={`
                w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden
                ${isSelected 
                  ? 'border-primary-400 bg-primary-500/10 scale-105' 
                  : 'border-gray-600 bg-gray-800/20 hover:border-primary-500/50 hover:bg-primary-500/5'
                }
              `}
              whileHover={{ scale: isSelected ? 1.05 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Selection indicator */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: isSelected ? 1 : 0 }}
                className="absolute top-4 right-4 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>

              {/* Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${profile.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{profile.name}</h3>
                  <p className="text-sm text-gray-400">{profile.description}</p>
                </div>
              </div>

              {/* Features */}
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-2">
                  {profile.features.map((feature, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${profile.color}`} />
                      <span className="text-xs text-gray-400">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code example */}
              <div className="bg-gray-900/50 rounded-lg p-3 mt-4">
                <pre className="text-xs text-gray-300 overflow-hidden">
                  {profile.example}
                </pre>
              </div>

              {/* Gradient overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isSelected ? 0.1 : 0 }}
                className={`absolute inset-0 bg-gradient-to-br ${profile.color} rounded-2xl -z-10`}
              />

              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                animate={{
                  x: isSelected ? ['-100%', '200%'] : '-100%',
                }}
                transition={{
                  duration: 1.5,
                  ease: "easeInOut",
                  repeat: isSelected ? Infinity : 0,
                  repeatDelay: 2,
                }}
              />
            </motion.button>
          </motion.div>
        );
      })}

      {/* Custom profile option */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: profiles.length * 0.1 }}
        className="md:col-span-2"
      >
        <div className="glass-card p-6 text-center border-2 border-dashed border-gray-600">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Code2 className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Need a Custom Profile?</h3>
          <p className="text-gray-400 mb-4">
            Create your own coding style profile with custom rules and preferences
          </p>
          <button className="btn-secondary text-sm px-6 py-2">
            Coming Soon
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileSelector;