import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';
import { ContextProfile, contextProfileSchema } from '../types/context-profile';
import { prisma } from '../utils/database';
import { AppError } from '../utils/errors';

export class ProfileService {
  private defaultProfiles: Map<string, ContextProfile> = new Map();
  private profilesPath: string;

  constructor() {
    this.profilesPath = path.join(__dirname, '../profiles/defaults');
  }

  async initialize(): Promise<void> {
    try {
      // Load default profiles from JSON files
      const files = await fs.readdir(this.profilesPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(this.profilesPath, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const rawProfile = JSON.parse(content);
            
            // Validate profile
            const profile = contextProfileSchema.parse(rawProfile);
            this.defaultProfiles.set(profile.id, profile);
            
            logger.info('Loaded default profile', { 
              id: profile.id, 
              name: profile.name 
            });
          } catch (error) {
            logger.error('Failed to load profile', { file, error });
          }
        }
      }
      
      logger.info('Profile service initialized', { 
        defaultProfileCount: this.defaultProfiles.size 
      });
    } catch (error) {
      logger.error('Failed to initialize profile service', { error });
      throw error;
    }
  }

  /**
   * Get a profile by ID (checks custom profiles first, then defaults)
   */
  async getProfile(profileId: string, userId?: string): Promise<ContextProfile | null> {
    // Check custom profiles in database first
    if (userId) {
      const customProfile = await prisma.contextProfile.findFirst({
        where: {
          id: profileId,
          OR: [
            { userId },
            { isPublic: true },
          ],
        },
      });

      if (customProfile) {
        return customProfile.data as ContextProfile;
      }
    }

    // Check default profiles
    return this.defaultProfiles.get(profileId) || null;
  }

  /**
   * List all available profiles for a user
   */
  async listProfiles(userId?: string): Promise<ContextProfile[]> {
    const profiles: ContextProfile[] = [];

    // Add default profiles
    this.defaultProfiles.forEach(profile => profiles.push(profile));

    // Add user's custom profiles if userId provided
    if (userId) {
      const customProfiles = await prisma.contextProfile.findMany({
        where: {
          OR: [
            { userId },
            { isPublic: true },
          ],
        },
      });

      customProfiles.forEach(cp => {
        profiles.push(cp.data as ContextProfile);
      });
    }

    return profiles;
  }

  /**
   * Create a custom profile
   */
  async createProfile(
    profile: Omit<ContextProfile, 'id' | 'createdAt' | 'updatedAt'>, 
    userId: string
  ): Promise<ContextProfile> {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const fullProfile: ContextProfile = {
      ...profile,
      id,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    };

    // Validate profile
    const validatedProfile = contextProfileSchema.parse(fullProfile);

    // Save to database
    await prisma.contextProfile.create({
      data: {
        id: validatedProfile.id,
        name: validatedProfile.name,
        userId,
        data: validatedProfile,
        isPublic: false,
      },
    });

    logger.info('Created custom profile', { 
      profileId: validatedProfile.id, 
      userId 
    });

    return validatedProfile;
  }

  /**
   * Update a custom profile
   */
  async updateProfile(
    profileId: string, 
    updates: Partial<ContextProfile>, 
    userId: string
  ): Promise<ContextProfile> {
    // Check if profile exists and user has permission
    const existing = await prisma.contextProfile.findFirst({
      where: {
        id: profileId,
        userId,
      },
    });

    if (!existing) {
      throw new AppError('Profile not found or no permission', 404, 'PROFILE_NOT_FOUND');
    }

    const currentProfile = existing.data as ContextProfile;
    const updatedProfile: ContextProfile = {
      ...currentProfile,
      ...updates,
      id: profileId, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    // Validate updated profile
    const validatedProfile = contextProfileSchema.parse(updatedProfile);

    // Update in database
    await prisma.contextProfile.update({
      where: { id: profileId },
      data: {
        name: validatedProfile.name,
        data: validatedProfile,
      },
    });

    logger.info('Updated profile', { profileId, userId });

    return validatedProfile;
  }

  /**
   * Delete a custom profile
   */
  async deleteProfile(profileId: string, userId: string): Promise<void> {
    const result = await prisma.contextProfile.deleteMany({
      where: {
        id: profileId,
        userId,
      },
    });

    if (result.count === 0) {
      throw new AppError('Profile not found or no permission', 404, 'PROFILE_NOT_FOUND');
    }

    logger.info('Deleted profile', { profileId, userId });
  }

  /**
   * Get profile for a specific language/framework combination
   */
  async getSuggestedProfile(language: string, framework?: string): Promise<ContextProfile | null> {
    // First try to find exact match with framework
    if (framework) {
      for (const profile of this.defaultProfiles.values()) {
        if (profile.language === language && profile.framework === framework) {
          return profile;
        }
      }
    }

    // Then try to find language match
    for (const profile of this.defaultProfiles.values()) {
      if (profile.language === language) {
        return profile;
      }
    }

    return null;
  }

  /**
   * Export profile to JSON
   */
  async exportProfile(profileId: string, userId?: string): Promise<string> {
    const profile = await this.getProfile(profileId, userId);
    
    if (!profile) {
      throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    return JSON.stringify(profile, null, 2);
  }

  /**
   * Import profile from JSON
   */
  async importProfile(jsonContent: string, userId: string): Promise<ContextProfile> {
    try {
      const rawProfile = JSON.parse(jsonContent);
      
      // Remove existing ID and metadata
      delete rawProfile.id;
      delete rawProfile.createdAt;
      delete rawProfile.updatedAt;
      delete rawProfile.createdBy;
      delete rawProfile.isDefault;

      // Create as new profile
      return await this.createProfile(rawProfile, userId);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new AppError('Invalid JSON format', 400, 'INVALID_JSON');
      }
      throw error;
    }
  }

  /**
   * Clone an existing profile
   */
  async cloneProfile(
    profileId: string, 
    newName: string, 
    userId: string
  ): Promise<ContextProfile> {
    const sourceProfile = await this.getProfile(profileId, userId);
    
    if (!sourceProfile) {
      throw new AppError('Source profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    // Create new profile based on source
    const clonedProfile = {
      ...sourceProfile,
      name: newName,
      description: `${sourceProfile.description} (cloned)`,
    };

    delete clonedProfile.id;
    delete clonedProfile.createdAt;
    delete clonedProfile.updatedAt;
    delete clonedProfile.createdBy;
    delete clonedProfile.isDefault;

    return await this.createProfile(clonedProfile, userId);
  }
}

// Singleton instance
export const profileService = new ProfileService();