import { logger } from '../../utils/logger';
import { AppError } from '../../utils/errors';
import { aiConductorService } from '../ai-conductor/ai-conductor.service';
import { agentMarketplaceService } from '../agent-marketplace/agent-marketplace.service';
import { uploadService } from '../upload/upload.service';
import { prisma } from '../../utils/database';
import FormData from 'form-data';
import axios from 'axios';
import { env } from '../../utils/env-validation';

interface VoiceToAgentRequest {
  audioBuffer: Buffer;
  mimeType: string;
  userId: string;
  description?: string;
  category?: string;
  remixFromId?: string;
}

interface TranscriptionResult {
  text: string;
  duration: number;
  language?: string;
}

interface VoiceToAgentResult {
  transcription: TranscriptionResult;
  agent: any;
}

class VoiceService {
  private readonly WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';
  private readonly SUPPORTED_AUDIO_FORMATS = [
    'audio/mp3',
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/m4a'
  ];

  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<TranscriptionResult> {
    try {
      // Validate audio format
      if (!this.SUPPORTED_AUDIO_FORMATS.includes(mimeType)) {
        throw new AppError('Unsupported audio format', 400);
      }

      // If OpenAI is not enabled, use a mock transcription for development
      if (!env.ENABLE_OPENAI || !env.OPENAI_API_KEY) {
        logger.warn('OpenAI not enabled, using mock transcription');
        return {
          text: 'Create an AI agent that helps users manage their daily tasks and schedule',
          duration: 5.2,
          language: 'en'
        };
      }

      // Create form data for Whisper API
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: 'audio.webm',
        contentType: mimeType
      });
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');

      // Call OpenAI Whisper API
      const response = await axios.post(this.WHISPER_API_URL, formData, {
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          ...formData.getHeaders()
        }
      });

      return {
        text: response.data.text,
        duration: response.data.duration || 0,
        language: response.data.language
      };
    } catch (error) {
      logger.error('Error transcribing audio:', error);
      if (axios.isAxiosError(error)) {
        throw new AppError(`Transcription failed: ${error.response?.data?.error?.message || error.message}`, 500);
      }
      throw new AppError('Failed to transcribe audio', 500);
    }
  }

  async createAgentFromVoice(request: VoiceToAgentRequest): Promise<VoiceToAgentResult> {
    try {
      // Transcribe the audio
      const transcription = await this.transcribeAudio(request.audioBuffer, request.mimeType);
      
      // Use the transcription as the base description
      const fullDescription = request.description 
        ? `${transcription.text}\n\nAdditional context: ${request.description}`
        : transcription.text;

      // Generate agent configuration from description
      const agentConfig = await this.generateAgentFromDescription(fullDescription, request.category);

      // Create the agent
      const agent = await agentMarketplaceService.createAgent({
        ...agentConfig,
        creatorId: request.userId,
        remixFromId: request.remixFromId,
        tags: [...agentConfig.tags, 'voice-created']
      });

      // Store the audio file for reference
      const audioUrl = await uploadService.uploadFile({
        buffer: request.audioBuffer,
        mimetype: request.mimeType,
        filename: `voice-${agent.id}.webm`,
        userId: request.userId
      });

      // Update agent metadata with audio reference
      await this.updateAgentMetadata(agent.id, {
        voiceAudioUrl: audioUrl,
        voiceTranscription: transcription.text,
        voiceDuration: transcription.duration
      });

      return {
        transcription,
        agent
      };
    } catch (error) {
      logger.error('Error creating agent from voice:', error);
      throw error;
    }
  }

  private async generateAgentFromDescription(description: string, category?: string): Promise<any> {
    try {
      // Use AI to generate agent configuration
      const prompt = `
        Based on this description, create a configuration for an AI agent:
        
        Description: ${description}
        ${category ? `Category preference: ${category}` : ''}
        
        Generate a JSON configuration with:
        - name: A catchy, descriptive name (max 50 chars)
        - description: A clear description of what the agent does (max 500 chars)
        - category: One of: utility, creative, analysis, automation, communication, other
        - systemPrompt: A detailed system prompt for the agent
        - tags: 3-5 relevant tags
        - inputTypes: Array of supported input types (text, json, file, image)
        - outputTypes: Array of output types (text, json, file, image, stream)
        - price: Suggested price in vibes (0-100)
        - exampleInputs: 2-3 example inputs
        - exampleOutputs: Corresponding example outputs
        
        Make the agent focused and useful. The system prompt should be detailed and instructive.
      `;

      const response = await aiConductorService.generateResponse({
        prompt,
        model: 'claude-3-sonnet',
        temperature: 0.7,
        responseFormat: 'json'
      });

      const config = JSON.parse(response);
      
      // Validate and sanitize the generated config
      return {
        name: this.sanitizeString(config.name, 50),
        description: this.sanitizeString(config.description, 500),
        category: this.validateCategory(config.category || category || 'other'),
        systemPrompt: config.systemPrompt || this.generateDefaultSystemPrompt(description),
        tags: this.validateTags(config.tags || []),
        inputTypes: this.validateTypes(config.inputTypes || ['text'], ['text', 'json', 'file', 'image']),
        outputTypes: this.validateTypes(config.outputTypes || ['text'], ['text', 'json', 'file', 'image', 'stream']),
        price: Math.min(Math.max(config.price || 1, 0), 100),
        exampleInputs: config.exampleInputs || [],
        exampleOutputs: config.exampleOutputs || [],
        configSchema: {
          temperature: { type: 'number', default: 0.7, min: 0, max: 1 },
          maxTokens: { type: 'number', default: 1000, min: 100, max: 4000 }
        }
      };
    } catch (error) {
      logger.error('Error generating agent from description:', error);
      
      // Fallback to basic configuration
      return {
        name: 'Voice-Created Agent',
        description: description.substring(0, 500),
        category: category || 'other',
        systemPrompt: this.generateDefaultSystemPrompt(description),
        tags: ['voice-created', 'ai-assistant'],
        inputTypes: ['text'],
        outputTypes: ['text'],
        price: 1,
        exampleInputs: [],
        exampleOutputs: [],
        configSchema: {}
      };
    }
  }

  private generateDefaultSystemPrompt(description: string): string {
    return `You are an AI assistant created to help with the following task:

${description}

Please provide helpful, accurate, and relevant responses based on this purpose. Be concise but thorough in your responses.`;
  }

  private sanitizeString(str: string, maxLength: number): string {
    return str.trim().substring(0, maxLength);
  }

  private validateCategory(category: string): string {
    const validCategories = ['utility', 'creative', 'analysis', 'automation', 'communication', 'other'];
    return validCategories.includes(category) ? category : 'other';
  }

  private validateTags(tags: string[]): string[] {
    return tags
      .filter(tag => typeof tag === 'string')
      .map(tag => tag.toLowerCase().replace(/[^a-z0-9-]/g, ''))
      .filter(tag => tag.length > 0 && tag.length <= 20)
      .slice(0, 10);
  }

  private validateTypes(types: string[], validTypes: string[]): string[] {
    return types.filter(type => validTypes.includes(type));
  }

  private async updateAgentMetadata(agentId: string, metadata: any): Promise<void> {
    try {
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          metadata: {
            ...(await prisma.agent.findUnique({ where: { id: agentId }, select: { metadata: true } }))?.metadata,
            ...metadata
          }
        }
      });
    } catch (error) {
      logger.error('Error updating agent metadata:', error);
      // Non-critical error, don't throw
    }
  }

  async processVoiceCommand(audioBuffer: Buffer, mimeType: string): Promise<any> {
    try {
      // Transcribe the voice command
      const transcription = await this.transcribeAudio(audioBuffer, mimeType);
      
      // Process the command
      const command = await this.parseVoiceCommand(transcription.text);
      
      return {
        transcription,
        command,
        response: await this.executeVoiceCommand(command)
      };
    } catch (error) {
      logger.error('Error processing voice command:', error);
      throw error;
    }
  }

  private async parseVoiceCommand(text: string): Promise<any> {
    // Simple command parsing - could be enhanced with NLP
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('create') && lowerText.includes('agent')) {
      return { type: 'create_agent', text };
    } else if (lowerText.includes('search') || lowerText.includes('find')) {
      return { type: 'search', query: text };
    } else if (lowerText.includes('buy') || lowerText.includes('purchase')) {
      return { type: 'purchase', text };
    } else {
      return { type: 'unknown', text };
    }
  }

  private async executeVoiceCommand(command: any): Promise<any> {
    switch (command.type) {
      case 'create_agent':
        return { 
          action: 'redirect',
          target: '/agent-builder',
          message: 'Opening agent builder with your description'
        };
      
      case 'search':
        return {
          action: 'search',
          query: command.query,
          message: 'Searching for agents...'
        };
      
      case 'purchase':
        return {
          action: 'info',
          message: 'Please select an agent from the marketplace to purchase'
        };
      
      default:
        return {
          action: 'help',
          message: 'I can help you create agents, search the marketplace, or make purchases. What would you like to do?'
        };
    }
  }
}

export const voiceService = new VoiceService();