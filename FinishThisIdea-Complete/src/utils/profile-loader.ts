import { promises as fs } from 'fs';
import path from 'path';
import { ContextProfile, contextProfileSchema } from '../types/context-profile';
import { prisma } from './database';
import { logger } from './logger';

const PROFILES_DIR = path.join(process.cwd(), 'profiles');
const DEFAULTS_DIR = path.join(PROFILES_DIR, 'defaults');

export class ProfileLoader {
  private static cache = new Map<string, ContextProfile>();
  
  /**
   * Load a profile by ID, checking cache, database, and filesystem
   */
  static async loadProfile(profileId: string): Promise<ContextProfile | null> {
    // Check cache first
    if (this.cache.has(profileId)) {
      return this.cache.get(profileId)!;
    }
    
    // Try database
    try {
      const dbProfile = await prisma.contextProfile.findUnique({
        where: { id: profileId },
      });
      
      if (dbProfile) {
        const profile = contextProfileSchema.parse(dbProfile.data);
        this.cache.set(profileId, profile);
        return profile;
      }
    } catch (error) {
      logger.error('Failed to load profile from database', { profileId, error });
    }
    
    // Try filesystem (default profiles)
    try {
      const filePath = path.join(DEFAULTS_DIR, `${profileId}.json`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const profile = contextProfileSchema.parse(JSON.parse(fileContent));
      this.cache.set(profileId, profile);
      return profile;
    } catch (error) {
      // Not found in filesystem either
    }
    
    return null;
  }
  
  /**
   * Load all default profiles from filesystem
   */
  static async loadDefaultProfiles(): Promise<ContextProfile[]> {
    const profiles: ContextProfile[] = [];
    
    try {
      const files = await fs.readdir(DEFAULTS_DIR);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(DEFAULTS_DIR, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const profile = contextProfileSchema.parse(JSON.parse(content));
          profiles.push(profile);
          this.cache.set(profile.id, profile);
        } catch (error) {
          logger.error('Failed to load default profile', { file, error });
        }
      }
    } catch (error) {
      logger.error('Failed to read defaults directory', { error });
    }
    
    return profiles;
  }
  
  /**
   * Get profile for a specific language/framework combination
   */
  static async getProfileForLanguage(
    language: string,
    framework?: string
  ): Promise<ContextProfile | null> {
    // First try to find a framework-specific profile
    if (framework) {
      const frameworkProfile = await this.loadProfile(`${framework}-modern`);
      if (frameworkProfile) return frameworkProfile;
    }
    
    // Then try language-specific
    const languageProfiles: Record<string, string> = {
      javascript: 'js-standard',
      typescript: 'ts-strict',
      python: 'python-pep8',
      react: 'react-modern',
    };
    
    const profileId = languageProfiles[language.toLowerCase()];
    if (profileId) {
      return this.loadProfile(profileId);
    }
    
    return null;
  }
  
  /**
   * Build a custom system prompt from a profile
   */
  static buildSystemPrompt(profile: ContextProfile): string {
    const { aiContext, style, rules } = profile;
    
    let prompt = aiContext.systemPrompt || 
      `You are an expert ${profile.language || 'software'} developer focused on clean, maintainable code.`;
    
    prompt += `\n\nCode Style Guidelines:`;
    prompt += `\n- Use ${style.indentation === 'spaces' ? `${style.indentSize} spaces` : 'tabs'} for indentation`;
    prompt += `\n- ${style.semicolons ? 'Use' : 'Omit'} semicolons`;
    prompt += `\n- Use ${style.quoteStyle} quotes for strings`;
    prompt += `\n- Maximum line length: ${style.maxLineLength || 'no limit'}`;
    
    prompt += `\n\nNaming Conventions:`;
    prompt += `\n- Functions: ${rules.naming.functions}`;
    prompt += `\n- Variables: ${rules.naming.variables}`;
    prompt += `\n- Constants: ${rules.naming.constants}`;
    prompt += `\n- Classes: ${rules.naming.classes}`;
    
    if (aiContext.priorities.length > 0) {
      prompt += `\n\nPriorities: ${aiContext.priorities.join(', ')}`;
    }
    
    if (aiContext.avoidPatterns?.length) {
      prompt += `\n\nAvoid these patterns: ${aiContext.avoidPatterns.join(', ')}`;
    }
    
    if (aiContext.preferredPatterns?.length) {
      prompt += `\n\nPrefer these patterns: ${aiContext.preferredPatterns.join(', ')}`;
    }
    
    if (aiContext.additionalContext) {
      prompt += `\n\n${aiContext.additionalContext}`;
    }
    
    return prompt;
  }
  
  /**
   * Clear the profile cache
   */
  static clearCache(): void {
    this.cache.clear();
  }
}