"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileService = exports.ProfileService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
const context_profile_1 = require("../types/context-profile");
const database_1 = require("../utils/database");
const errors_1 = require("../utils/errors");
class ProfileService {
    defaultProfiles = new Map();
    profilesPath;
    constructor() {
        this.profilesPath = path_1.default.join(__dirname, '../profiles/defaults');
    }
    async initialize() {
        try {
            const files = await promises_1.default.readdir(this.profilesPath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const filePath = path_1.default.join(this.profilesPath, file);
                        const content = await promises_1.default.readFile(filePath, 'utf-8');
                        const rawProfile = JSON.parse(content);
                        const profile = context_profile_1.contextProfileSchema.parse(rawProfile);
                        this.defaultProfiles.set(profile.id, profile);
                        logger_1.logger.info('Loaded default profile', {
                            id: profile.id,
                            name: profile.name
                        });
                    }
                    catch (error) {
                        logger_1.logger.error('Failed to load profile', { file, error });
                    }
                }
            }
            logger_1.logger.info('Profile service initialized', {
                defaultProfileCount: this.defaultProfiles.size
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize profile service', { error });
            throw error;
        }
    }
    async getProfile(profileId, userId) {
        if (userId) {
            const customProfile = await database_1.prisma.contextProfile.findFirst({
                where: {
                    id: profileId,
                    OR: [
                        { userId },
                        { isPublic: true },
                    ],
                },
            });
            if (customProfile) {
                return customProfile.data;
            }
        }
        return this.defaultProfiles.get(profileId) || null;
    }
    async listProfiles(userId) {
        const profiles = [];
        this.defaultProfiles.forEach(profile => profiles.push(profile));
        if (userId) {
            const customProfiles = await database_1.prisma.contextProfile.findMany({
                where: {
                    OR: [
                        { userId },
                        { isPublic: true },
                    ],
                },
            });
            customProfiles.forEach(cp => {
                profiles.push(cp.data);
            });
        }
        return profiles;
    }
    async createProfile(profile, userId) {
        const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        const fullProfile = {
            ...profile,
            id,
            createdAt: now,
            updatedAt: now,
            createdBy: userId,
        };
        const validatedProfile = context_profile_1.contextProfileSchema.parse(fullProfile);
        await database_1.prisma.contextProfile.create({
            data: {
                id: validatedProfile.id,
                name: validatedProfile.name,
                userId,
                data: validatedProfile,
                isPublic: false,
            },
        });
        logger_1.logger.info('Created custom profile', {
            profileId: validatedProfile.id,
            userId
        });
        return validatedProfile;
    }
    async updateProfile(profileId, updates, userId) {
        const existing = await database_1.prisma.contextProfile.findFirst({
            where: {
                id: profileId,
                userId,
            },
        });
        if (!existing) {
            throw new errors_1.AppError('Profile not found or no permission', 404, 'PROFILE_NOT_FOUND');
        }
        const currentProfile = existing.data;
        const updatedProfile = {
            ...currentProfile,
            ...updates,
            id: profileId,
            updatedAt: new Date(),
        };
        const validatedProfile = context_profile_1.contextProfileSchema.parse(updatedProfile);
        await database_1.prisma.contextProfile.update({
            where: { id: profileId },
            data: {
                name: validatedProfile.name,
                data: validatedProfile,
            },
        });
        logger_1.logger.info('Updated profile', { profileId, userId });
        return validatedProfile;
    }
    async deleteProfile(profileId, userId) {
        const result = await database_1.prisma.contextProfile.deleteMany({
            where: {
                id: profileId,
                userId,
            },
        });
        if (result.count === 0) {
            throw new errors_1.AppError('Profile not found or no permission', 404, 'PROFILE_NOT_FOUND');
        }
        logger_1.logger.info('Deleted profile', { profileId, userId });
    }
    async getSuggestedProfile(language, framework) {
        if (framework) {
            for (const profile of this.defaultProfiles.values()) {
                if (profile.language === language && profile.framework === framework) {
                    return profile;
                }
            }
        }
        for (const profile of this.defaultProfiles.values()) {
            if (profile.language === language) {
                return profile;
            }
        }
        return null;
    }
    async exportProfile(profileId, userId) {
        const profile = await this.getProfile(profileId, userId);
        if (!profile) {
            throw new errors_1.AppError('Profile not found', 404, 'PROFILE_NOT_FOUND');
        }
        return JSON.stringify(profile, null, 2);
    }
    async importProfile(jsonContent, userId) {
        try {
            const rawProfile = JSON.parse(jsonContent);
            delete rawProfile.id;
            delete rawProfile.createdAt;
            delete rawProfile.updatedAt;
            delete rawProfile.createdBy;
            delete rawProfile.isDefault;
            return await this.createProfile(rawProfile, userId);
        }
        catch (error) {
            if (error instanceof SyntaxError) {
                throw new errors_1.AppError('Invalid JSON format', 400, 'INVALID_JSON');
            }
            throw error;
        }
    }
    async cloneProfile(profileId, newName, userId) {
        const sourceProfile = await this.getProfile(profileId, userId);
        if (!sourceProfile) {
            throw new errors_1.AppError('Source profile not found', 404, 'PROFILE_NOT_FOUND');
        }
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
exports.ProfileService = ProfileService;
exports.profileService = new ProfileService();
//# sourceMappingURL=profile.service.js.map