"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileLoader = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const context_profile_1 = require("../types/context-profile");
const database_1 = require("./database");
const logger_1 = require("./logger");
const PROFILES_DIR = path_1.default.join(process.cwd(), 'profiles');
const DEFAULTS_DIR = path_1.default.join(PROFILES_DIR, 'defaults');
class ProfileLoader {
    static cache = new Map();
    static async loadProfile(profileId) {
        if (this.cache.has(profileId)) {
            return this.cache.get(profileId);
        }
        try {
            const dbProfile = await database_1.prisma.contextProfile.findUnique({
                where: { id: profileId },
            });
            if (dbProfile) {
                const profile = context_profile_1.contextProfileSchema.parse(dbProfile.data);
                this.cache.set(profileId, profile);
                return profile;
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to load profile from database', { profileId, error });
        }
        try {
            const filePath = path_1.default.join(DEFAULTS_DIR, `${profileId}.json`);
            const fileContent = await fs_1.promises.readFile(filePath, 'utf-8');
            const profile = context_profile_1.contextProfileSchema.parse(JSON.parse(fileContent));
            this.cache.set(profileId, profile);
            return profile;
        }
        catch (error) {
        }
        return null;
    }
    static async loadDefaultProfiles() {
        const profiles = [];
        try {
            const files = await fs_1.promises.readdir(DEFAULTS_DIR);
            const jsonFiles = files.filter(f => f.endsWith('.json'));
            for (const file of jsonFiles) {
                try {
                    const filePath = path_1.default.join(DEFAULTS_DIR, file);
                    const content = await fs_1.promises.readFile(filePath, 'utf-8');
                    const profile = context_profile_1.contextProfileSchema.parse(JSON.parse(content));
                    profiles.push(profile);
                    this.cache.set(profile.id, profile);
                }
                catch (error) {
                    logger_1.logger.error('Failed to load default profile', { file, error });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to read defaults directory', { error });
        }
        return profiles;
    }
    static async getProfileForLanguage(language, framework) {
        if (framework) {
            const frameworkProfile = await this.loadProfile(`${framework}-modern`);
            if (frameworkProfile)
                return frameworkProfile;
        }
        const languageProfiles = {
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
    static buildSystemPrompt(profile) {
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
    static clearCache() {
        this.cache.clear();
    }
}
exports.ProfileLoader = ProfileLoader;
//# sourceMappingURL=profile-loader.js.map