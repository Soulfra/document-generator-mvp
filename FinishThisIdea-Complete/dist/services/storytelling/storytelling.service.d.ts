export interface StoryContext {
    question: string;
    technicalResponse: string;
    userProfile?: {
        preferredStyle?: 'adventure' | 'fairy-tale' | 'modern' | 'sci-fi' | 'mystery';
        complexityLevel?: 'beginner' | 'intermediate' | 'advanced';
        interests?: string[];
    };
    domain?: string;
}
export interface StoryResponse {
    narrative: string;
    characters: string[];
    metaphors: string[];
    moral: string;
    technicalMapping: Record<string, string>;
    memorabilityScore: number;
}
export declare class StorytellingService {
    private narrativeTemplates;
    private characterBank;
    private metaphorLibrary;
    constructor();
    private initializeStorytellingAssets;
    createStoryResponse(context: StoryContext): Promise<StoryResponse>;
    private selectNarrativeStyle;
    private extractTechnicalConcepts;
    private mapConceptsToStory;
    private generateMetaphorFor;
    private generateNarrative;
    private generateOpening;
    private generateJourney;
    private generateResolution;
    private generateWisdom;
    private getMainCharacter;
    private extractCharacters;
    private extractMetaphors;
    private extractMoral;
    private calculateMemorabilityScore;
    enhanceWithStory(question: string, technicalResponse: string, userPreferences?: any): Promise<StoryResponse>;
    private detectDomain;
}
export declare const storytellingService: StorytellingService;
//# sourceMappingURL=storytelling.service.d.ts.map