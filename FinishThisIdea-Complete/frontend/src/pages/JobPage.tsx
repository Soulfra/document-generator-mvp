import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Code,
  Trash2,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { useJob } from '../hooks/useApi';
import { useJobUpdates } from '../hooks/useWebSocket';
import { useJobNotifications } from '../hooks/useNotifications';
import { formatTimeAgo, formatBytes, formatPercentage } from '../utils';
import ProgressTracker from '../components/Upload/ProgressTracker';
import CodeComparison from '../components/common/CodeComparison';
import ShareButtons from '../components/Share/ShareButtons';
import ConfettiComponent from '../components/Effects/Confetti';

const JobPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { data: job, loading, error, refetch } = useJob(jobId || '');
  const { jobStatus } = useJobUpdates(jobId || '');
  const { notifyJobComplete, notifyJobFailed } = useJobNotifications();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Handle job updates from WebSocket
  useEffect(() => {
    if (jobStatus) {
      refetch(); // Refresh job data when status updates
      
      if (jobStatus.status === 'completed' && job?.status !== 'completed') {
        setShowConfetti(true);
        notifyJobComplete(jobStatus);
        setTimeout(() => setShowConfetti(false), 5000);
      }
      
      if (jobStatus.status === 'failed') {
        notifyJobFailed(jobStatus, jobStatus.error || 'Unknown error');
      }
    }
  }, [jobStatus, job?.status, notifyJobComplete, notifyJobFailed, refetch]);

  if (!jobId) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" />
          <div className="absolute bottom-1/4 -right-4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float animation-delay-400" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Job Details</h2>
          <p className="text-gray-400">Fetching your cleanup progress...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" />
          <div className="absolute bottom-1/4 -right-4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float animation-delay-400" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 bg-red-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">Job Not Found</h1>
          <p className="text-gray-400 mb-8">
            {error || "The cleanup job you're looking for doesn't exist or has been removed."}
          </p>
          
          <Link to="/" className="btn-primary">
            Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  const isProcessing = job.status === 'pending' || job.status === 'processing';
  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" />
        <div className="absolute bottom-1/4 -right-4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float animation-delay-400" />
      </div>

      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && <ConfettiComponent />}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center space-x-4">
            {isCompleted && (
              <>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Results</span>
                </button>
                <a
                  href={job.results?.downloadUrl}
                  download
                  className="btn-primary flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        {/* Job Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 mb-8"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className={`
                w-16 h-16 rounded-xl flex items-center justify-center
                ${isCompleted ? 'bg-green-500/20 text-green-400' :
                  isProcessing ? 'bg-blue-500/20 text-blue-400' :
                  isFailed ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'}
              `}>
                {isCompleted ? <CheckCircle className="w-8 h-8" /> :
                 isProcessing ? <Clock className="w-8 h-8" /> :
                 isFailed ? <AlertCircle className="w-8 h-8" /> :
                 <FileText className="w-8 h-8" />}
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{job.file.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                  <span className="font-mono text-accent-400">{job.file.language}</span>
                  <span>•</span>
                  <span>{formatBytes(job.file.size)}</span>
                  <span>•</span>
                  <span>{job.profile.name}</span>
                </div>
                
                <div className={`
                  inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                  ${isCompleted ? 'bg-green-500/20 text-green-400' :
                    isProcessing ? 'bg-blue-500/20 text-blue-400' :
                    isFailed ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'}
                `}>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Started</div>
              <div className="text-white">{formatTimeAgo(job.createdAt)}</div>
              {job.completedAt && (
                <>
                  <div className="text-sm text-gray-500 mb-1 mt-2">Completed</div>
                  <div className="text-white">{formatTimeAgo(job.completedAt)}</div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Processing State */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ProgressTracker 
              isActive={true}
              onComplete={() => {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
              }}
            />
          </motion.div>
        )}

        {/* Failed State */}
        {isFailed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8 text-center"
          >
            <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Cleanup Failed</h2>
            <p className="text-gray-400 mb-6">
              We encountered an issue while processing your code. This could be due to unsupported file format or corrupted data.
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/upload" className="btn-primary">
                Try Again
              </Link>
              <button className="btn-secondary">
                Contact Support
              </button>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {isCompleted && job.results && (
          <div className="space-y-8">
            {/* Results Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-8"
            >
              <div className="flex items-center space-x-3 mb-6">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                <h2 className="text-2xl font-bold text-white">Cleanup Results</h2>
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Trash2 className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="text-2xl font-bold text-red-400 mb-1">
                    {job.results.improvements.linesRemoved}
                  </div>
                  <div className="text-sm text-gray-400">Lines Removed</div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {job.results.improvements.issuesFixed}
                  </div>
                  <div className="text-sm text-gray-400">Issues Fixed</div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <TrendingDown className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {job.results.improvements.sizeReduction}%
                  </div>
                  <div className="text-sm text-gray-400">Size Reduction</div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Code className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {formatPercentage(job.results.afterStats.lines, job.results.beforeStats.lines)}
                  </div>
                  <div className="text-sm text-gray-400">Code Quality</div>
                </div>
              </div>
            </motion.div>

            {/* Before/After Comparison */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CodeComparison 
                examples={[{
                  id: job.id,
                  title: job.file.name,
                  language: job.file.language,
                  before: "// Sample before code would be shown here\nvar x = 5;\nvar unused = 10;\nfunction doStuff() {\n  console.log('test');\n}",
                  after: "// Clean code after processing\nconst x = 5;\n\nfunction doStuff() {\n  console.log('test');\n}",
                  improvements: [
                    `Removed ${job.results.improvements.linesRemoved} lines of dead code`,
                    `Fixed ${job.results.improvements.issuesFixed} issues`,
                    `Reduced file size by ${job.results.improvements.sizeReduction}%`,
                    'Improved code consistency',
                    'Enhanced readability'
                  ],
                  stats: {
                    linesRemoved: job.results.improvements.linesRemoved,
                    linesAdded: job.results.improvements.linesAdded,
                    issuesFixed: job.results.improvements.issuesFixed
                  }
                }]}
                autoRotate={false}
              />
            </motion.div>

            {/* Download Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-8 text-center"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Your Clean Code is Ready!</h2>
              <p className="text-gray-400 mb-6">
                Download your beautifully cleaned and optimized codebase below.
              </p>
              
              <div className="flex justify-center space-x-4">
                <a
                  href={job.results.downloadUrl}
                  download
                  className="btn-primary text-lg px-8 py-4 flex items-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Clean Code</span>
                </a>
                
                {job.results.reportUrl && (
                  <a
                    href={job.results.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-lg px-8 py-4 flex items-center space-x-2"
                  >
                    <FileText className="w-5 h-5" />
                    <span>View Report</span>
                  </a>
                )}
              </div>

              <p className="text-sm text-gray-500 mt-4">
                Files are automatically deleted after 30 days for your privacy.
              </p>
            </motion.div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && isCompleted && job.results && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-md w-full"
            >
              <ShareButtons
                title="I just cleaned my messy code for $1!"
                description={`Transformed ${job.file.name} and fixed ${job.results.improvements.issuesFixed} issues in minutes!`}
                stats={{
                  linesCleared: job.results.beforeStats.lines,
                  issuesFixed: job.results.improvements.issuesFixed,
                  sizeReduced: job.results.improvements.sizeReduction
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobPage;