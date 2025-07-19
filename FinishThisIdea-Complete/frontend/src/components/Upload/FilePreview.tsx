import { motion } from 'framer-motion';
import { File, X, FileText, Code, Archive, Image as ImageIcon, CheckCircle } from 'lucide-react';

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

const FilePreview = ({ file, onRemove }: FilePreviewProps) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string, fileType: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (extension && ['zip', 'tar', 'gz', 'rar', '7z'].includes(extension)) {
      return Archive;
    }
    if (extension && ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs'].includes(extension)) {
      return Code;
    }
    if (extension && ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension)) {
      return ImageIcon;
    }
    if (extension && ['html', 'css', 'json', 'xml', 'md', 'txt', 'yaml', 'yml'].includes(extension)) {
      return FileText;
    }
    return File;
  };

  const getFileColor = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const colorMap: { [key: string]: string } = {
      'js': 'text-yellow-400',
      'ts': 'text-blue-400',
      'jsx': 'text-cyan-400',
      'tsx': 'text-cyan-400',
      'py': 'text-green-400',
      'java': 'text-orange-400',
      'cpp': 'text-blue-500',
      'c': 'text-blue-500',
      'cs': 'text-purple-400',
      'php': 'text-purple-500',
      'rb': 'text-red-400',
      'go': 'text-cyan-500',
      'rs': 'text-orange-500',
      'html': 'text-orange-400',
      'css': 'text-blue-400',
      'json': 'text-yellow-500',
      'xml': 'text-green-500',
      'md': 'text-gray-400',
      'zip': 'text-purple-400',
      'tar': 'text-purple-400',
      'gz': 'text-purple-400',
    };

    return colorMap[extension || ''] || 'text-gray-400';
  };

  const getFileTypeLabel = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const typeMap: { [key: string]: string } = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'jsx': 'React JSX',
      'tsx': 'React TSX',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'php': 'PHP',
      'rb': 'Ruby',
      'go': 'Go',
      'rs': 'Rust',
      'html': 'HTML',
      'css': 'CSS',
      'json': 'JSON',
      'xml': 'XML',
      'md': 'Markdown',
      'zip': 'ZIP Archive',
      'tar': 'TAR Archive',
      'gz': 'GZIP Archive',
    };

    return typeMap[extension || ''] || extension?.toUpperCase() || 'Unknown';
  };

  const FileIcon = getFileIcon(file.name, file.type);
  const fileColor = getFileColor(file.name);
  const fileTypeLabel = getFileTypeLabel(file.name);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -20 }}
      className="glass-card p-6 relative overflow-hidden"
    >
      {/* Success indicator */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="absolute top-4 right-4 text-green-400"
      >
        <CheckCircle className="w-6 h-6" />
      </motion.div>

      <div className="flex items-start space-x-4">
        {/* File icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className={`w-16 h-16 rounded-xl bg-gray-800/50 flex items-center justify-center ${fileColor}`}
        >
          <FileIcon className="w-8 h-8" />
        </motion.div>

        {/* File details */}
        <div className="flex-1 min-w-0">
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="text-lg font-semibold text-white truncate"
          >
            {file.name}
          </motion.h3>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-4 mt-2"
          >
            <span className="text-sm text-gray-400">{formatFileSize(file.size)}</span>
            <span className="text-sm text-gray-500">•</span>
            <span className={`text-sm font-medium ${fileColor}`}>{fileTypeLabel}</span>
          </motion.div>

          {/* File preview info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-4 space-y-2"
          >
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>File uploaded successfully</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Ready for processing</span>
            </div>
          </motion.div>
        </div>

        {/* Remove button */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          onClick={onRemove}
          className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-all duration-200 flex items-center justify-center group"
        >
          <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </motion.button>
      </div>

      {/* Progress bar animation */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary-500 to-accent-500"
      />

      {/* Sparkle effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Glow effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-transparent to-accent-500/10 rounded-2xl -z-10"
      />
    </motion.div>
  );
};

export default FilePreview;