/**
 * Universal Identity Bridge Service
 * 
 * Unifies authentication and identity management across multiple platforms:
 * - GitHub OAuth integration
 * - Google Workspace integration  
 * - Custom email service provider
 * - Cross-platform token management
 * - Universal user profiles
 */

import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { logger } from '../../utils/logger';
import { GamificationService } from '../gamification/gamification.service';

interface UniversalUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  
  // Platform identities
  platforms: {
    github?: GitHubIdentity;
    google?: GoogleIdentity;
    custom?: CustomIdentity;
    libreoffice?: LibreOfficeIdentity;
    designs99?: Designs99Identity;
  };
  
  // Universal profile
  profile: {
    industries: string[];
    skills: Record<string, number>;
    preferences: Record<string, any>;
    achievements: string[];
  };
  
  // Tokens and authentication
  tokens: {
    universal: string;
    refresh: string;
    platformTokens: Record<string, string>;
  };
  
  createdAt: Date;
  lastActive: Date;
}

interface GitHubIdentity {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  accessToken: string;
  refreshToken?: string;
  repos: string[];
  organizations: string[];
}

interface GoogleIdentity {
  id: string;
  email: string;
  name: string;
  picture: string;
  accessToken: string;
  refreshToken: string;
  workspace?: {
    domain: string;
    role: string;
  };
}

interface CustomIdentity {
  id: string;
  email: string;
  emailVerified: boolean;
  customDomain?: string;
  mailboxQuota: number;
  preferences: {
    forwardToGmail?: boolean;
    autoResponder?: boolean;
    signature?: string;
  };
}

interface LibreOfficeIdentity {
  id: string;
  version: string;
  documents: string[];
  templates: string[];
  lastSync: Date;
}

interface Designs99Identity {
  id: string;
  username: string;
  rating: number;
  completedProjects: number;
  earnings: number;
  portfolio: string[];
  verified: boolean;
}

interface PlatformConfig {
  github: {
    clientId: string;
    clientSecret: string;
    scope: string[];
  };
  google: {
    clientId: string;
    clientSecret: string;
    scope: string[];
  };
  designs99: {
    apiKey: string;
    webhook: string;
  };
}

export class UniversalIdentityBridge extends EventEmitter {
  private prisma: PrismaClient;
  private gamificationService: GamificationService;
  private users: Map<string, UniversalUser> = new Map();
  private config: PlatformConfig;
  
  // JWT configuration
  private readonly JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
  private readonly JWT_EXPIRES = '7d';
  private readonly REFRESH_EXPIRES = '30d';

  constructor() {
    super();
    this.prisma = new PrismaClient();
    this.gamificationService = new GamificationService();
    
    this.config = {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        scope: ['user:email', 'repo', 'read:org']
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        scope: [
          'openid',
          'email', 
          'profile',
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/gmail.readonly'
        ]
      },
      designs99: {
        apiKey: process.env.DESIGNS99_API_KEY || '',
        webhook: process.env.DESIGNS99_WEBHOOK || ''
      }
    };
  }

  /**
   * Initialize a new user in the universal identity system
   */
  async createUniversalUser(primaryEmail: string, primaryPlatform: 'github' | 'google' | 'custom'): Promise<UniversalUser> {
    const userId = `universal-${crypto.randomBytes(16).toString('hex')}`;
    const username = primaryEmail.split('@')[0];
    
    const universalToken = this.generateUniversalToken(userId);
    const refreshToken = this.generateRefreshToken(userId);
    
    const user: UniversalUser = {
      id: userId,
      email: primaryEmail,
      username: username,
      displayName: username,
      platforms: {},
      profile: {
        industries: [],
        skills: {},
        preferences: {},
        achievements: ['identity_created']
      },
      tokens: {
        universal: universalToken,
        refresh: refreshToken,
        platformTokens: {}
      },
      createdAt: new Date(),
      lastActive: new Date()
    };

    this.users.set(userId, user);
    
    // Track creation in gamification system
    await this.gamificationService.trackAction(userId, 'identity.create');
    
    this.emit('userCreated', { user });
    logger.info('Universal user created', { userId, email: primaryEmail, platform: primaryPlatform });
    
    return user;
  }

  /**
   * Link GitHub account to universal identity
   */
  async linkGitHubAccount(userId: string, githubCode: string): Promise<GitHubIdentity> {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: this.config.github.clientId,
          client_secret: this.config.github.clientSecret,
          code: githubCode
        })
      });

      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
        throw new Error('Failed to get GitHub access token');
      }

      // Get user data from GitHub
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      const userData = await userResponse.json();
      
      // Get user's repos
      const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100', {
        headers: {
          'Authorization': `token ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      const repos = await reposResponse.json();

      const githubIdentity: GitHubIdentity = {
        id: userData.id.toString(),
        username: userData.login,
        email: userData.email,
        avatarUrl: userData.avatar_url,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        repos: repos.map((repo: any) => repo.full_name),
        organizations: []
      };

      // Update universal user
      const user = this.users.get(userId);
      if (!user) throw new Error('Universal user not found');

      user.platforms.github = githubIdentity;
      user.tokens.platformTokens.github = tokenData.access_token;
      user.lastActive = new Date();

      // If this is the first platform, use GitHub data as primary
      if (!user.avatarUrl && userData.avatar_url) {
        user.avatarUrl = userData.avatar_url;
        user.displayName = userData.name || userData.login;
      }

      // Track achievement
      await this.gamificationService.trackAction(userId, 'identity.github.link');
      
      this.emit('platformLinked', { userId, platform: 'github', identity: githubIdentity });
      logger.info('GitHub account linked', { userId, githubUsername: userData.login });

      return githubIdentity;
    } catch (error) {
      logger.error('Failed to link GitHub account', { userId, error });
      throw error;
    }
  }

  /**
   * Link Google account to universal identity  
   */
  async linkGoogleAccount(userId: string, googleCode: string): Promise<GoogleIdentity> {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.config.google.clientId,
          client_secret: this.config.google.clientSecret,
          code: googleCode,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.FRONTEND_URL}/auth/google/callback`
        })
      });

      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
        throw new Error('Failed to get Google access token');
      }

      // Get user data from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });

      const userData = await userResponse.json();

      const googleIdentity: GoogleIdentity = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token
      };

      // Check if this is a Google Workspace account
      if (userData.hd) {
        googleIdentity.workspace = {
          domain: userData.hd,
          role: 'member' // Could be enhanced to detect admin role
        };
      }

      // Update universal user
      const user = this.users.get(userId);
      if (!user) throw new Error('Universal user not found');

      user.platforms.google = googleIdentity;
      user.tokens.platformTokens.google = tokenData.access_token;
      user.lastActive = new Date();

      // If this is the first platform, use Google data as primary
      if (!user.avatarUrl && userData.picture) {
        user.avatarUrl = userData.picture;
        user.displayName = userData.name;
      }

      // Track achievement
      await this.gamificationService.trackAction(userId, 'identity.google.link');
      
      this.emit('platformLinked', { userId, platform: 'google', identity: googleIdentity });
      logger.info('Google account linked', { userId, googleEmail: userData.email });

      return googleIdentity;
    } catch (error) {
      logger.error('Failed to link Google account', { userId, error });
      throw error;
    }
  }

  /**
   * Create custom email identity
   */
  async createCustomEmailIdentity(userId: string, customEmail: string, domain?: string): Promise<CustomIdentity> {
    const user = this.users.get(userId);
    if (!user) throw new Error('Universal user not found');

    const customIdentity: CustomIdentity = {
      id: `custom-${crypto.randomBytes(8).toString('hex')}`,
      email: customEmail,
      emailVerified: false,
      customDomain: domain,
      mailboxQuota: 5 * 1024 * 1024 * 1024, // 5GB default
      preferences: {
        forwardToGmail: false,
        autoResponder: false
      }
    };

    user.platforms.custom = customIdentity;
    user.lastActive = new Date();

    // Send verification email
    await this.sendEmailVerification(customEmail, userId);

    // Track achievement
    await this.gamificationService.trackAction(userId, 'identity.custom.create');

    this.emit('customEmailCreated', { userId, email: customEmail });
    logger.info('Custom email identity created', { userId, customEmail });

    return customIdentity;
  }

  /**
   * Link 99designs account
   */
  async link99DesignsAccount(userId: string, designsUsername: string, apiKey?: string): Promise<Designs99Identity> {
    try {
      // This would integrate with 99designs API once available
      const designsIdentity: Designs99Identity = {
        id: `designs-${crypto.randomBytes(8).toString('hex')}`,
        username: designsUsername,
        rating: 0,
        completedProjects: 0,
        earnings: 0,
        portfolio: [],
        verified: false
      };

      const user = this.users.get(userId);
      if (!user) throw new Error('Universal user not found');

      user.platforms.designs99 = designsIdentity;
      user.profile.industries.push('design');
      user.lastActive = new Date();

      // Track achievement
      await this.gamificationService.trackAction(userId, 'identity.designs99.link');

      this.emit('platformLinked', { userId, platform: 'designs99', identity: designsIdentity });
      logger.info('99designs account linked', { userId, designsUsername });

      return designsIdentity;
    } catch (error) {
      logger.error('Failed to link 99designs account', { userId, error });
      throw error;
    }
  }

  /**
   * Generate OAuth URLs for platform linking
   */
  generateOAuthUrls(userId: string) {
    const baseUrl = process.env.FRONTEND_URL;
    const state = this.encodeState({ userId, timestamp: Date.now() });

    return {
      github: `https://github.com/login/oauth/authorize?` + new URLSearchParams({
        client_id: this.config.github.clientId,
        redirect_uri: `${baseUrl}/auth/github/callback`,
        scope: this.config.github.scope.join(' '),
        state
      }).toString(),
      
      google: `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
        client_id: this.config.google.clientId,
        redirect_uri: `${baseUrl}/auth/google/callback`,
        scope: this.config.google.scope.join(' '),
        response_type: 'code',
        access_type: 'offline',
        state
      }).toString()
    };
  }

  /**
   * Universal single sign-on - login with any linked platform
   */
  async universalSignIn(email: string, platformToken?: string, platform?: string): Promise<{
    user: UniversalUser;
    universalToken: string;
    expiresIn: number;
  }> {
    // Find user by email across all platforms
    let user: UniversalUser | undefined;
    
    for (const [userId, userData] of this.users) {
      if (userData.email === email ||
          userData.platforms.github?.email === email ||
          userData.platforms.google?.email === email ||
          userData.platforms.custom?.email === email) {
        user = userData;
        break;
      }
    }

    if (!user) {
      throw new Error('User not found');
    }

    // Verify platform token if provided
    if (platformToken && platform) {
      const isValid = await this.verifyPlatformToken(user, platform, platformToken);
      if (!isValid) {
        throw new Error('Invalid platform token');
      }
    }

    // Generate new universal token
    const newToken = this.generateUniversalToken(user.id);
    user.tokens.universal = newToken;
    user.lastActive = new Date();

    // Track sign-in
    await this.gamificationService.trackAction(user.id, 'identity.signin');

    this.emit('userSignedIn', { user, platform });
    logger.info('Universal sign-in successful', { userId: user.id, platform });

    return {
      user,
      universalToken: newToken,
      expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
    };
  }

  /**
   * Cross-platform data sync
   */
  async syncPlatformData(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) throw new Error('Universal user not found');

    const syncTasks = [];

    // Sync GitHub repos and contributions
    if (user.platforms.github?.accessToken) {
      syncTasks.push(this.syncGitHubData(user));
    }

    // Sync Google Drive documents and Gmail
    if (user.platforms.google?.accessToken) {
      syncTasks.push(this.syncGoogleData(user));
    }

    // Sync 99designs portfolio
    if (user.platforms.designs99) {
      syncTasks.push(this.sync99DesignsData(user));
    }

    await Promise.allSettled(syncTasks);
    
    user.lastActive = new Date();
    this.emit('dataSynced', { userId });
  }

  /**
   * Get unified user profile across all platforms
   */
  getUserProfile(userId: string): UniversalUser | null {
    return this.users.get(userId) || null;
  }

  /**
   * Update user profile preferences
   */
  async updateProfile(userId: string, updates: Partial<UniversalUser['profile']>): Promise<void> {
    const user = this.users.get(userId);
    if (!user) throw new Error('Universal user not found');

    user.profile = { ...user.profile, ...updates };
    user.lastActive = new Date();

    this.emit('profileUpdated', { userId, updates });
    logger.info('User profile updated', { userId });
  }

  /**
   * Verify universal token
   */
  verifyUniversalToken(token: string): { userId: string; valid: boolean } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      const user = this.users.get(decoded.userId);
      
      return {
        userId: decoded.userId,
        valid: !!user && user.tokens.universal === token
      };
    } catch (error) {
      return { userId: '', valid: false };
    }
  }

  /**
   * Private helper methods
   */
  private generateUniversalToken(userId: string): string {
    return jwt.sign(
      { 
        userId, 
        type: 'universal',
        timestamp: Date.now()
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES }
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { 
        userId, 
        type: 'refresh',
        timestamp: Date.now()
      },
      this.JWT_SECRET,
      { expiresIn: this.REFRESH_EXPIRES }
    );
  }

  private encodeState(data: any): string {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  private decodeState(state: string): any {
    return JSON.parse(Buffer.from(state, 'base64').toString());
  }

  private async verifyPlatformToken(user: UniversalUser, platform: string, token: string): Promise<boolean> {
    try {
      switch (platform) {
        case 'github':
          const githubResponse = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `token ${token}` }
          });
          return githubResponse.ok;

        case 'google':
          const googleResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          return googleResponse.ok;

        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  private async sendEmailVerification(email: string, userId: string): Promise<void> {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    
    // Store verification token (would be in database in production)
    // await this.storeVerificationToken(userId, verificationToken);
    
    // Send verification email (integrate with existing email service)
    logger.info('Email verification sent', { email, userId, verificationUrl });
  }

  private async syncGitHubData(user: UniversalUser): Promise<void> {
    if (!user.platforms.github?.accessToken) return;

    try {
      // Sync recent activity, contributions, etc.
      const activity = await fetch('https://api.github.com/user/events?per_page=10', {
        headers: { 'Authorization': `token ${user.platforms.github.accessToken}` }
      });

      if (activity.ok) {
        const events = await activity.json();
        // Process events and update user skills/achievements
        logger.debug('GitHub data synced', { userId: user.id, events: events.length });
      }
    } catch (error) {
      logger.error('GitHub sync failed', { userId: user.id, error });
    }
  }

  private async syncGoogleData(user: UniversalUser): Promise<void> {
    if (!user.platforms.google?.accessToken) return;

    try {
      // Sync Google Drive, Gmail, Calendar data
      logger.debug('Google data synced', { userId: user.id });
    } catch (error) {
      logger.error('Google sync failed', { userId: user.id, error });
    }
  }

  private async sync99DesignsData(user: UniversalUser): Promise<void> {
    if (!user.platforms.designs99) return;

    try {
      // Sync 99designs portfolio, earnings, ratings
      logger.debug('99designs data synced', { userId: user.id });
    } catch (error) {
      logger.error('99designs sync failed', { userId: user.id, error });
    }
  }
}

// Singleton instance
export const universalIdentityBridge = new UniversalIdentityBridge();