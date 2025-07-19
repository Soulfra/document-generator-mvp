import { ContextProfile } from '../types/context-profile';
export declare class ProfileLoader {
    private static cache;
    static loadProfile(profileId: string): Promise<ContextProfile | null>;
    static loadDefaultProfiles(): Promise<ContextProfile[]>;
    static getProfileForLanguage(language: string, framework?: string): Promise<ContextProfile | null>;
    static buildSystemPrompt(profile: ContextProfile): string;
    static clearCache(): void;
}
//# sourceMappingURL=profile-loader.d.ts.map