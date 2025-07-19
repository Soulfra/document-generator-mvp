import React, { forwardRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface TerminalOutputProps {
  output: string[];
  isLoading?: boolean;
  theme?: 'dark' | 'light' | 'constitutional';
  className?: string;
  maxLines?: number;
  showLineNumbers?: boolean;
  autoScroll?: boolean;
}

const TerminalOutput = forwardRef<HTMLDivElement, TerminalOutputProps>(({
  output,
  isLoading = false,
  theme = 'constitutional',
  className = '',
  maxLines = 1000,
  showLineNumbers = false,
  autoScroll = true
}, ref) => {
  
  // Process output with ANSI color codes
  const processedOutput = useMemo(() => {
    return output.slice(-maxLines).map((line, index) => ({
      id: `line-${output.length - maxLines + index}`,
      content: line,
      processed: processAnsiColors(line)
    }));
  }, [output, maxLines]);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && ref && 'current' in ref && ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [output, autoScroll, ref]);

  // Theme styles
  const themeStyles = {
    dark: {
      background: 'bg-gray-900',
      text: 'text-green-400',
      scrollbar: 'scrollbar-dark'
    },
    light: {
      background: 'bg-white',
      text: 'text-gray-900',
      scrollbar: 'scrollbar-light'
    },
    constitutional: {
      background: 'bg-gray-900/95',
      text: 'text-blue-300',
      scrollbar: 'scrollbar-constitutional'
    }
  };

  const currentTheme = themeStyles[theme];

  return (
    <div
      ref={ref}
      className={`
        ${currentTheme.background}
        ${currentTheme.text}
        ${currentTheme.scrollbar}
        font-mono text-sm
        overflow-y-auto
        p-4
        ${className}
        relative
      `}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#374151 #1f2937'
      }}
    >
      {/* Output Lines */}
      <AnimatePresence initial={false}>
        {processedOutput.map((line, index) => (
          <motion.div
            key={line.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ 
              duration: 0.2,
              delay: index > processedOutput.length - 5 ? index * 0.05 : 0 
            }}
            className={`
              flex items-start
              ${showLineNumbers ? 'pl-12' : ''}
              py-0.5
              hover:bg-gray-800/30
              transition-colors
              whitespace-pre-wrap
              break-words
            `}
          >
            {/* Line Numbers */}
            {showLineNumbers && (
              <span className="absolute left-2 text-gray-500 text-xs select-none w-8 text-right">
                {index + 1}
              </span>
            )}
            
            {/* Line Content */}
            <div 
              className="flex-1 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: line.processed }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Loading Indicator */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center space-x-2 py-2 text-blue-400"
        >
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Processing...</span>
        </motion.div>
      )}

      {/* Empty State */}
      {output.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center h-32 text-gray-500"
        >
          <div className="text-center">
            <div className="text-lg mb-2">🚀</div>
            <div className="text-sm">Terminal ready for commands</div>
            <div className="text-xs text-gray-600 mt-1">
              Type 'help' to get started
            </div>
          </div>
        </motion.div>
      )}

      {/* Scroll to Bottom Indicator */}
      {output.length > 10 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="
            fixed bottom-20 right-6
            bg-blue-500 hover:bg-blue-600
            text-white text-xs
            px-3 py-1 rounded-full
            shadow-lg
            transition-colors
            z-20
          "
          onClick={() => {
            if (ref && 'current' in ref && ref.current) {
              ref.current.scrollTop = ref.current.scrollHeight;
            }
          }}
        >
          ↓ Latest
        </motion.button>
      )}
    </div>
  );
});

// ANSI Color Processing
function processAnsiColors(text: string): string {
  // ANSI color code mappings
  const ansiColorMap: { [key: string]: string } = {
    '30': 'color: #000000', // Black
    '31': 'color: #ef4444', // Red
    '32': 'color: #10b981', // Green
    '33': 'color: #f59e0b', // Yellow
    '34': 'color: #3b82f6', // Blue
    '35': 'color: #8b5cf6', // Magenta
    '36': 'color: #06b6d4', // Cyan
    '37': 'color: #f3f4f6', // White
    '90': 'color: #6b7280', // Bright Black (Gray)
    '91': 'color: #f87171', // Bright Red
    '92': 'color: #34d399', // Bright Green
    '93': 'color: #fbbf24', // Bright Yellow
    '94': 'color: #60a5fa', // Bright Blue
    '95': 'color: #a78bfa', // Bright Magenta
    '96': 'color: #22d3ee', // Bright Cyan
    '97': 'color: #ffffff', // Bright White
    '0': '',  // Reset
    '1': 'font-weight: bold', // Bold
    '2': 'opacity: 0.7', // Dim
    '3': 'font-style: italic', // Italic
    '4': 'text-decoration: underline', // Underline
  };

  // Process ANSI escape sequences
  return text
    .replace(/\x1b\[([0-9;]+)m/g, (match, codes) => {
      const codeList = codes.split(';');
      const styles: string[] = [];
      
      codeList.forEach((code: string) => {
        if (ansiColorMap[code]) {
          styles.push(ansiColorMap[code]);
        }
      });
      
      if (codes === '0' || codes === '') {
        return '</span>';
      }
      
      return `<span style="${styles.join('; ')}">`;
    })
    // Handle special characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    // Convert URLs to clickable links
    .replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">$1</a>'
    )
    // Highlight file paths
    .replace(
      /([\/\w-]+\.(js|ts|jsx|tsx|json|md|txt|py|rb|go|rs|java|cpp|c|h))/g,
      '<span class="text-green-400">$1</span>'
    )
    // Highlight commands
    .replace(
      /^(\$\s*)(.+)/gm,
      '$1<span class="text-yellow-400">$2</span>'
    )
    // Highlight success/error messages
    .replace(
      /(✅|SUCCESS|COMPLETED|DONE)/g,
      '<span class="text-green-400 font-semibold">$1</span>'
    )
    .replace(
      /(❌|ERROR|FAILED|TIMEOUT)/g,
      '<span class="text-red-400 font-semibold">$1</span>'
    )
    .replace(
      /(⚠️|WARNING|WARN)/g,
      '<span class="text-yellow-400 font-semibold">$1</span>'
    )
    // Highlight constitutional governance terms
    .replace(
      /(Constitutional|Governance|Trust|Consensus|Agent|Marketplace)/gi,
      '<span class="text-purple-400 font-medium">$1</span>'
    )
    // Highlight metrics
    .replace(
      /(\d+(?:\.\d+)?%|\$\d+(?:\.\d+)?|\d+(?:\.\d+)?s|\d+ms)/g,
      '<span class="text-cyan-400 font-medium">$1</span>'
    );
}

// Add custom scrollbar styles
const scrollbarStyles = `
  .scrollbar-dark::-webkit-scrollbar {
    width: 8px;
  }
  .scrollbar-dark::-webkit-scrollbar-track {
    background: #1f2937;
  }
  .scrollbar-dark::-webkit-scrollbar-thumb {
    background: #374151;
    border-radius: 4px;
  }
  .scrollbar-dark::-webkit-scrollbar-thumb:hover {
    background: #4b5563;
  }
  
  .scrollbar-constitutional::-webkit-scrollbar {
    width: 8px;
  }
  .scrollbar-constitutional::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.8);
  }
  .scrollbar-constitutional::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.5);
    border-radius: 4px;
  }
  .scrollbar-constitutional::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.7);
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('terminal-scrollbar-styles')) {
  const style = document.createElement('style');
  style.id = 'terminal-scrollbar-styles';
  style.textContent = scrollbarStyles;
  document.head.appendChild(style);
}

TerminalOutput.displayName = 'TerminalOutput';

export default TerminalOutput;