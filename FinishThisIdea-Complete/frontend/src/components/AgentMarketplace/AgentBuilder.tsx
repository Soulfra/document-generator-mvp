import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wand2, Code, FileText, Tag, DollarSign, Save, 
  Upload, Eye, EyeOff, Sparkles, AlertCircle, CheckCircle,
  Mic, Keyboard, GitBranch
} from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import { agentService } from '../../services/agent.service';
import { voiceService } from '../../services/voice.service';

interface AgentBuilderProps {
  remixFromAgent?: any;
  onAgentCreated?: (agent: any) => void;
}

type InputMode = 'text' | 'voice' | 'code';
type Category = 'productivity' | 'creative' | 'analysis' | 'automation' | 'general';

export const AgentBuilder: React.FC<AgentBuilderProps> = ({
  remixFromAgent,
  onAgentCreated,
}) => {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState(remixFromAgent?.name ? `${remixFromAgent.name} (Remix)` : '');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('general');
  const [tags, setTags] = useState<string[]>([]);
  const [inputTypes, setInputTypes] = useState<string[]>([]);
  const [outputTypes, setOutputTypes] = useState<string[]>([]);
  const [price, setPrice] = useState(1.0);
  const [sourceCode, setSourceCode] = useState(remixFromAgent?.sourceCode || '');
  const [voiceDescription, setVoiceDescription] = useState('');

  const codeEditorRef = useRef<HTMLTextAreaElement>(null);

  const categories: { value: Category; label: string; color: string }[] = [
    { value: 'productivity', label: 'Productivity', color: 'bg-blue-500' },
    { value: 'creative', label: 'Creative', color: 'bg-purple-500' },
    { value: 'analysis', label: 'Analysis', color: 'bg-green-500' },
    { value: 'automation', label: 'Automation', color: 'bg-orange-500' },
    { value: 'general', label: 'General', color: 'bg-gray-500' },
  ];

  const commonTags = [
    'AI', 'Automation', 'Data', 'Text', 'Image', 'Audio', 'Video',
    'API', 'Integration', 'Utility', 'Tool', 'Assistant', 'Generator',
    'Analyzer', 'Converter', 'Optimizer', 'Validator'
  ];

  const commonInputTypes = ['text', 'json', 'csv', 'url', 'file', 'image', 'audio'];
  const commonOutputTypes = ['text', 'json', 'csv', 'file', 'image', 'audio', 'markdown'];

  const handleVoiceRecordingComplete = async (audioBlob: Blob, transcription?: string) => {
    if (transcription) {
      setVoiceDescription(transcription);
      await generateAgentFromDescription(transcription);
    }
  };

  const generateAgentFromDescription = async (description: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await voiceService.createAgentFromVoice({
        description,
        category,
        remixFromId: remixFromAgent?.id
      });

      // Populate form with generated data
      setName(result.name);
      setDescription(result.description);
      setSourceCode(result.sourceCode);
      setTags(result.tags || []);
      setInputTypes(result.inputTypes || ['text']);
      setOutputTypes(result.outputTypes || ['text']);
      
      setSuccess('Agent generated successfully! Review and customize as needed.');
    } catch (err) {
      setError('Failed to generate agent. Please try again.');
      console.error('Agent generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTextGeneration = async () => {
    if (!description.trim()) {
      setError('Please provide a description for your agent.');
      return;
    }

    await generateAgentFromDescription(description);
  };

  const handleSaveAgent = async () => {
    if (!name || !description || !sourceCode) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const agentData = {
        name,
        description,
        sourceCode,
        price,
        agentCard: {
          category,
          tags,
          inputTypes,
          outputTypes,
        },
        manifest: {
          version: '1.0.0',
          runtime: 'node',
          entryPoint: 'index.js',
          dependencies: {},
        },
        remixedFromId: remixFromAgent?.id,
      };

      const createdAgent = await agentService.createAgent(agentData);
      
      setSuccess('Agent created successfully!');
      
      if (onAgentCreated) {
        onAgentCreated(createdAgent);
      }

      // Reset form after successful creation
      setTimeout(() => {
        resetForm();
      }, 2000);
    } catch (err) {
      setError('Failed to save agent. Please try again.');
      console.error('Save agent error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('general');
    setTags([]);
    setInputTypes([]);
    setOutputTypes([]);
    setPrice(1.0);
    setSourceCode('');
    setVoiceDescription('');
    setError(null);
    setSuccess(null);
  };

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const toggleInputType = (type: string) => {
    if (inputTypes.includes(type)) {
      setInputTypes(inputTypes.filter(t => t !== type));
    } else {
      setInputTypes([...inputTypes, type]);
    }
  };

  const toggleOutputType = (type: string) => {
    if (outputTypes.includes(type)) {
      setOutputTypes(outputTypes.filter(t => t !== type));
    } else {
      setOutputTypes([...outputTypes, type]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Wand2 className="w-6 h-6" />
                Agent Builder
              </h1>
              <p className="text-indigo-100 mt-1">
                {remixFromAgent ? `Remixing from: ${remixFromAgent.name}` : 'Create your AI agent'}
              </p>
            </div>
            {remixFromAgent && (
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                <GitBranch className="w-4 h-4 text-white" />
                <span className="text-sm text-white">Remix Mode</span>
              </div>
            )}
          </div>
        </div>

        {/* Input Mode Selector */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex gap-2">
            {[
              { mode: 'text' as InputMode, icon: Keyboard, label: 'Text Description' },
              { mode: 'voice' as InputMode, icon: Mic, label: 'Voice Description' },
              { mode: 'code' as InputMode, icon: Code, label: 'Direct Code' },
            ].map(({ mode, icon: Icon, label }) => (
              <motion.button
                key={mode}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setInputMode(mode)}
                className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  inputMode === mode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Input Section */}
          <AnimatePresence mode="wait">
            {inputMode === 'text' && (
              <motion.div
                key="text"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Describe your agent
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="E.g., An agent that analyzes code quality and suggests improvements..."
                    className="w-full h-32 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTextGeneration}
                  disabled={isGenerating || !description.trim()}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      Generating Agent...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Agent
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}

            {inputMode === 'voice' && (
              <motion.div
                key="voice"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <VoiceRecorder
                  onRecordingComplete={handleVoiceRecordingComplete}
                  showTranscription={true}
                />
                {voiceDescription && (
                  <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-300">{voiceDescription}</p>
                  </div>
                )}
              </motion.div>
            )}

            {inputMode === 'code' && (
              <motion.div
                key="code"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="text-center py-8 text-gray-400"
              >
                <Code className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p>Skip to the form below to directly write your agent code</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Agent Details Form */}
          <div className="space-y-6 pt-6 border-t border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Agent Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome Agent"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <motion.button
                    key={cat.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCategory(cat.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      category === cat.value
                        ? `${cat.color} text-white`
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {cat.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-indigo-200"
                    >
                      ×
                    </button>
                  </motion.span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {commonTags.filter(t => !tags.includes(t)).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm hover:bg-gray-600 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Input/Output Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Input Types
                </label>
                <div className="space-y-2">
                  {commonInputTypes.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={inputTypes.includes(type)}
                        onChange={() => toggleInputType(type)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-gray-300">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Output Types
                </label>
                <div className="space-y-2">
                  {commonOutputTypes.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={outputTypes.includes(type)}
                        onChange={() => toggleOutputType(type)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-gray-300">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Source Code */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Agent Source Code <span className="text-red-400">*</span>
                </label>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>
              <textarea
                ref={codeEditorRef}
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                placeholder="// Your agent code here..."
                className="w-full h-64 px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white font-mono text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
              />
            </div>

            {/* Code Preview */}
            <AnimatePresence>
              {showPreview && sourceCode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Preview</h4>
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {sourceCode}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400">{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-green-400">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveAgent}
              disabled={isSaving || !name || !description || !sourceCode}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Save className="w-5 h-5 animate-pulse" />
                  Saving Agent...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Agent
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={resetForm}
              className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Reset
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};