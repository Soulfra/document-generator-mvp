import React from 'react';
interface AnalyticsContextType {
    track: (event: string, properties?: Record<string, any>) => Promise<void>;
    identify: (userId: string, traits?: Record<string, any>) => Promise<void>;
    pageView: (page: string, properties?: Record<string, any>) => Promise<void>;
    startSession: () => Promise<void>;
    endSession: () => Promise<void>;
    isEnabled: boolean;
    sessionId?: string;
}
interface AnalyticsProviderProps {
    children: React.ReactNode;
    apiKey?: string;
    userId?: string;
    autoTrack?: boolean;
    debug?: boolean;
}
export declare const AnalyticsProvider: React.FC<AnalyticsProviderProps>;
export declare const useAnalytics: () => AnalyticsContextType;
export declare function withAnalytics<P extends object>(WrappedComponent: React.ComponentType<P>, eventName?: string): (props: P) => any;
export declare const useTrackEvent: () => {
    trackClick: (element: string, properties?: Record<string, any>) => Promise<void>;
    trackForm: (formName: string, action: "submit" | "error", properties?: Record<string, any>) => Promise<void>;
    trackFeature: (feature: string, action: string, properties?: Record<string, any>) => Promise<void>;
    trackError: (error: string, context?: Record<string, any>) => Promise<void>;
    trackConversion: (goal: string, value?: number, properties?: Record<string, any>) => Promise<void>;
};
interface TrackingWrapperProps {
    event: string;
    properties?: Record<string, any>;
    children: React.ReactNode;
    trackOn?: 'click' | 'hover' | 'focus' | 'mount';
}
export declare const TrackingWrapper: React.FC<TrackingWrapperProps>;
export default AnalyticsProvider;
//# sourceMappingURL=AnalyticsProvider.d.ts.map