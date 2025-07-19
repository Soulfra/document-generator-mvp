import axios from 'axios';
import { authService } from './auth.service';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface TranscriptionResult {
  transcription: string;
  language?: string;
  confidence?: number;
  duration?: number;
}

export interface VoiceToAgentRequest {
  audioPath?: string;
  description?: string;
  category?: string;
  remixFromId?: string;
}

export interface VoiceToAgentResult {
  success: boolean;
  name: string;
  description: string;
  sourceCode: string;
  tags?: string[];
  inputTypes?: string[];
  outputTypes?: string[];
  agentCard?: any;
  manifest?: any;
}

class VoiceService {
  private getHeaders(isFormData = false) {
    const token = authService.getToken();
    const headers: any = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    return headers;
  }

  async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await axios.post(`${API_URL}/api/voice/transcribe`, formData, {
        headers: this.getHeaders(true),
      });
      
      return response.data;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  async createAgentFromVoice(request: VoiceToAgentRequest): Promise<VoiceToAgentResult> {
    try {
      const response = await axios.post(`${API_URL}/api/voice/create-agent`, request, {
        headers: this.getHeaders(),
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating agent from voice:', error);
      throw error;
    }
  }

  async uploadVoiceDescription(audioBlob: Blob, metadata?: {
    category?: string;
    remixFromId?: string;
  }): Promise<VoiceToAgentResult> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-description.webm');
      
      if (metadata?.category) {
        formData.append('category', metadata.category);
      }
      
      if (metadata?.remixFromId) {
        formData.append('remixFromId', metadata.remixFromId);
      }

      const response = await axios.post(`${API_URL}/api/marketplace/voice-upload`, formData, {
        headers: this.getHeaders(true),
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading voice description:', error);
      throw error;
    }
  }

  async getVoiceHistory(): Promise<Array<{
    id: string;
    transcription: string;
    agentId?: string;
    createdAt: string;
  }>> {
    try {
      const response = await axios.get(`${API_URL}/api/voice/history`, {
        headers: this.getHeaders(),
      });
      
      return response.data.history;
    } catch (error) {
      console.error('Error getting voice history:', error);
      throw error;
    }
  }

  async analyzeVoiceDescription(transcription: string): Promise<{
    suggestedName: string;
    suggestedCategory: string;
    suggestedTags: string[];
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedImplementationTime: string;
  }> {
    try {
      const response = await axios.post(
        `${API_URL}/api/voice/analyze`,
        { transcription },
        { headers: this.getHeaders() }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error analyzing voice description:', error);
      throw error;
    }
  }

  async getSupportedLanguages(): Promise<string[]> {
    try {
      const response = await axios.get(`${API_URL}/api/voice/languages`, {
        headers: this.getHeaders(),
      });
      
      return response.data.languages;
    } catch (error) {
      console.error('Error getting supported languages:', error);
      throw error;
    }
  }

  // Browser-based audio recording utilities
  async startRecording(): Promise<MediaRecorder> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm',
    });
    
    return mediaRecorder;
  }

  stopRecording(mediaRecorder: MediaRecorder): Promise<Blob> {
    return new Promise((resolve) => {
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        resolve(blob);
        
        // Clean up stream
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.stop();
    });
  }

  async checkMicrophonePermission(): Promise<boolean> {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state === 'granted';
    } catch (error) {
      // Fallback for browsers that don't support permissions API
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch {
        return false;
      }
    }
  }
}

export const voiceService = new VoiceService();