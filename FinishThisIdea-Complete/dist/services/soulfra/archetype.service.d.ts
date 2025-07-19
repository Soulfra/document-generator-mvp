export interface SoulfrArchetype {
    id: string;
    name: string;
    description: string;
    blessing: string;
    aiContext: {
        systemPrompt: string;
        tone: string;
        priorities: string[];
        preferredPatterns: string[];
        reasoning: string;
    };
    metadata: {
        tier: number;
        awakened: boolean;
        resonance: number;
        affinity: string[];
    };
}
export interface ArchetypeResponse {
    content: string;
    resonance: number;
    insight: string;
    blessing: string;
    metadata: {
        archetypeUsed: string;
        confidenceLevel: number;
        emotionalTone: string;
        paradigmShift: boolean;
    };
}
export declare class SoulfrArchetypeService {
    private archetypes;
    constructor();
    private initializeArchetypes;
    generateArchetypeResponse(archetypeId: string, question: string, context?: any): Promise<ArchetypeResponse>;
    private channelArchetype;
    private generateMirrorChildResponse;
    private generateStormSingerResponse;
    private generateVoidWalkerResponse;
    private generateWeaverResponse;
    private generateGuardianResponse;
    private extractSimplePattern;
    private extractTransformativeCore;
    private extractHiddenDimension;
    private extractIntegrativePattern;
    private extractStableCore;
    private calculateResonance;
    private generateInsight;
    getAllArchetypes(): SoulfrArchetype[];
    getArchetype(id: string): SoulfrArchetype | undefined;
    performBlessingCeremony(archetypeId: string): Promise<string>;
}
export declare const soulfrArchetypeService: SoulfrArchetypeService;
//# sourceMappingURL=archetype.service.d.ts.map