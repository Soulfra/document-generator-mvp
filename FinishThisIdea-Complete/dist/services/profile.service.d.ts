import { ContextProfile } from '../types/context-profile';
export declare class ProfileService {
    private defaultProfiles;
    private profilesPath;
    constructor();
    initialize(): Promise<void>;
    getProfile(profileId: string, userId?: string): Promise<ContextProfile | null>;
    listProfiles(userId?: string): Promise<ContextProfile[]>;
    createProfile(profile: Omit<ContextProfile, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<ContextProfile>;
    updateProfile(profileId: string, updates: Partial<ContextProfile>, userId: string): Promise<ContextProfile>;
    deleteProfile(profileId: string, userId: string): Promise<void>;
    getSuggestedProfile(language: string, framework?: string): Promise<ContextProfile | null>;
    exportProfile(profileId: string, userId?: string): Promise<string>;
    importProfile(jsonContent: string, userId: string): Promise<ContextProfile>;
    cloneProfile(profileId: string, newName: string, userId: string): Promise<ContextProfile>;
}
export declare const profileService: ProfileService;
//# sourceMappingURL=profile.service.d.ts.map