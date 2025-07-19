import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Image, Code, Archive, X } from 'lucide-react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
}

const DropZone = ({ onFileSelect }: DropZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const acceptedTypes = [
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    'text/javascript',
    'text/typescript',
    'application/javascript',
    'application/json',
    'text/css',
    'text/html',
    'application/xml',
    'text/xml',
    'application/python',
    'text/x-python',
    'application/java',
    'text/x-java-source',
    'text/x-c',
    'text/x-c++',
    'application/x-tar',
    'application/x-gzip'
  ];

  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const getFileIcon = (type: string) => {
    if (type.includes('zip') || type.includes('tar') || type.includes('gzip')) {
      return Archive;
    }
    if (type.includes('image')) {
      return Image;
    }
    if (type.includes('text') || type.includes('javascript') || type.includes('json') || type.includes('python') || type.includes('java')) {
      return Code;
    }
    return FileText;
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return 'File size must be less than 50MB';
    }
    
    if (!acceptedTypes.includes(file.type) && !file.name.match(/\.(js|ts|jsx|tsx|py|java|cpp|c|html|css|json|xml|zip|tar|gz)$/i)) {
      return 'Please upload a supported file type (code files or ZIP archives)';
    }
    
    return null;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setError(null);
    setIsProcessing(true);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      setIsProcessing(false);
      return;
    }

    setTimeout(() => {
      onFileSelect(file);
      setIsProcessing(false);
    }, 800);
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsProcessing(true);

    setTimeout(() => {
      onFileSelect(file);
      setIsProcessing(false);
    }, 800);
  }, [onFileSelect]);

  const clearError = () => setError(null);

  return (
    <div className="relative">
      <motion.div
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer
          ${isDragOver 
            ? 'border-primary-400 bg-primary-500/10 scale-105' 
            : error 
              ? 'border-red-400 bg-red-500/10' 
              : 'border-gray-600 bg-gray-800/20 hover:border-primary-500 hover:bg-primary-500/5'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input
          type="file"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.xml,.zip,.tar,.gz"
        />

        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full mb-4"
              />
              <p className="text-lg font-semibold text-primary-400">Processing your file...</p>
              <div className="flex space-x-1 mt-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-2 h-2 bg-primary-500 rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={{ 
                  y: isDragOver ? -5 : 0,
                  scale: isDragOver ? 1.1 : 1
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`
                  w-16 h-16 rounded-full flex items-center justify-center mb-6
                  ${isDragOver 
                    ? 'bg-primary-500/20 text-primary-400' 
                    : error 
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-gray-700/50 text-gray-400'
                  }
                `}
              >
                <Upload className="w-8 h-8" />
              </motion.div>

              <h3 className={`text-2xl font-bold mb-2 ${error ? 'text-red-400' : 'text-white'}`}>
                {isDragOver ? 'Drop your file here' : 'Upload your codebase'}
              </h3>
              
              <p className={`text-lg mb-6 ${error ? 'text-red-400' : 'text-gray-400'}`}>
                {isDragOver 
                  ? 'Release to upload' 
                  : 'Drag & drop your files or click to browse'
                }
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-6">
                {[
                  { icon: Code, label: 'JS/TS/PY', color: 'text-blue-400' },
                  { icon: Archive, label: 'ZIP/TAR', color: 'text-green-400' },
                  { icon: FileText, label: 'HTML/CSS', color: 'text-purple-400' },
                ].map((type, index) => {
                  const Icon = type.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-2 glass-card px-3 py-2"
                    >
                      <Icon className={`w-4 h-4 ${type.color}`} />
                      <span className="text-sm text-gray-400">{type.label}</span>
                    </motion.div>
                  );
                })}
              </div>

              <div className="text-sm text-gray-500 space-y-1">
                <p>• Maximum file size: 50MB</p>
                <p>• Supports all major programming languages</p>
                <p>• Your code is processed securely and never stored</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating particles effect */}
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-primary-500 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <X className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DropZone;