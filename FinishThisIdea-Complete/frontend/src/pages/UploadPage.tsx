import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DropZone from '../components/Upload/DropZone';
import ProfileSelector from '../components/Upload/ProfileSelector';
import FilePreview from '../components/Upload/FilePreview';

const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string>('js-standard');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    // TODO: Implement actual upload logic
    console.log('Uploading file:', selectedFile.name);
    console.log('Selected profile:', selectedProfile);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" />
        <div className="absolute bottom-1/4 -right-4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float animation-delay-400" />
      </div>

      {/* Navigation */}
      <nav className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Let's <span className="gradient-text">clean your code</span>
          </h1>
          <p className="text-xl text-gray-400">
            Upload your codebase and choose your preferred style
          </p>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 mb-8"
        >
          <h2 className="text-2xl font-semibold mb-6">1. Upload Your Code</h2>
          
          {!selectedFile ? (
            <DropZone onFileSelect={handleFileSelect} />
          ) : (
            <FilePreview file={selectedFile} onRemove={() => setSelectedFile(null)} />
          )}
        </motion.div>

        {/* Profile Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8 mb-8"
        >
          <h2 className="text-2xl font-semibold mb-6">2. Choose Your Style</h2>
          <ProfileSelector
            selectedProfile={selectedProfile}
            onProfileSelect={setSelectedProfile}
          />
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className={`btn-primary text-lg px-12 py-4 ${
              (!selectedFile || isUploading) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isUploading ? 'Uploading...' : 'Clean My Code for $1'}
          </button>
          
          <p className="mt-4 text-gray-500">
            🎉 First cleanup is FREE for new users!
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default UploadPage;