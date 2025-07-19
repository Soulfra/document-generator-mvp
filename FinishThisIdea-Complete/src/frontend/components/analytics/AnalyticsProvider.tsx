import React, { createContext, useContext, useEffect, useState } from 'react';

interface AnalyticsContextType {
  track: (event: string, properties?: Record<string, any>) => Promise<void>;
  identify: (userId: string, traits?: Record<string, any>) => Promise<void>;
  pageView: (page: string, properties?: Record<string, any>) => Promise<void>;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  isEnabled: boolean;
  sessionId?: string;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: React.ReactNode;
  apiKey?: string;
  userId?: string;
  autoTrack?: boolean;
  debug?: boolean;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
  apiKey,
  userId,
  autoTrack = true,
  debug = false
}) => {
  const [sessionId, setSessionId] = useState<string>();
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (autoTrack) {
      initializeSession();
      trackPageViews();
    }

    // Cleanup on unmount
    return () => {
      if (sessionId) {
        endSession();
      }
    };
  }, []);

  useEffect(() => {
    if (userId) {
      identify(userId);
    }
  }, [userId]);

  const initializeSession = async () => {
    try {
      // Check if session exists in localStorage
      const existingSessionId = localStorage.getItem('analytics_session_id');
      const sessionExpiry = localStorage.getItem('analytics_session_expiry');
      
      if (existingSessionId && sessionExpiry && new Date() < new Date(sessionExpiry)) {
        setSessionId(existingSessionId);
        return;
      }

      // Create new session
      await startSession();
    } catch (error) {
      console.error('Failed to initialize analytics session:', error);
    }
  };

  const trackPageViews = () => {
    // Track initial page view
    pageView(window.location.pathname);

    // Track navigation in SPAs
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      setTimeout(() => pageView(window.location.pathname), 0);
    };

    window.history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      setTimeout(() => pageView(window.location.pathname), 0);
    };

    window.addEventListener('popstate', () => {
      setTimeout(() => pageView(window.location.pathname), 0);
    });
  };

  const track = async (event: string, properties?: Record<string, any>) => {
    if (!isEnabled) return;

    try {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'X-API-Key': apiKey })
        },
        body: JSON.stringify({
          event,
          properties: {
            ...properties,
            url: window.location.href,
            referrer: document.referrer,
            timestamp: new Date().toISOString()
          },
          sessionId,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`Analytics tracking failed: ${response.statusText}`);
      }

      if (debug) {
        console.log('Analytics event tracked:', { event, properties });
      }
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  };

  const identify = async (userId: string, traits?: Record<string, any>) => {
    if (!isEnabled) return;

    try {
      const response = await fetch('/api/analytics/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'X-API-Key': apiKey })
        },
        body: JSON.stringify({
          userId,
          traits: {
            ...traits,
            identifiedAt: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Analytics identification failed: ${response.statusText}`);
      }

      if (debug) {
        console.log('User identified:', { userId, traits });
      }
    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  };

  const pageView = async (page: string, properties?: Record<string, any>) => {
    if (!isEnabled) return;

    try {
      const response = await fetch('/api/analytics/pageview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'X-API-Key': apiKey })
        },
        body: JSON.stringify({
          page,
          properties: {
            ...properties,
            title: document.title,
            url: window.location.href,
            referrer: document.referrer,
            timestamp: new Date().toISOString()
          },
          sessionId,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`Analytics page view failed: ${response.statusText}`);
      }

      if (debug) {
        console.log('Page view tracked:', { page, properties });
      }
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  };

  const startSession = async () => {
    try {
      // Generate session ID
      const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Store session info
      const sessionExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      localStorage.setItem('analytics_session_id', newSessionId);
      localStorage.setItem('analytics_session_expiry', sessionExpiry.toISOString());
      
      setSessionId(newSessionId);

      // Track session start
      await track('Session Started', {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screen: {
          width: screen.width,
          height: screen.height
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });

      if (debug) {
        console.log('Analytics session started:', newSessionId);
      }
    } catch (error) {
      console.error('Failed to start analytics session:', error);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;

    try {
      await fetch(`/api/analytics/session/${sessionId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'X-API-Key': apiKey })
        }
      });

      // Clean up localStorage
      localStorage.removeItem('analytics_session_id');
      localStorage.removeItem('analytics_session_expiry');
      
      setSessionId(undefined);

      if (debug) {
        console.log('Analytics session ended');
      }
    } catch (error) {
      console.error('Failed to end analytics session:', error);
    }
  };

  const contextValue: AnalyticsContextType = {
    track,
    identify,
    pageView,
    startSession,
    endSession,
    isEnabled,
    sessionId
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

// Higher-order component for automatic event tracking
export function withAnalytics<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  eventName?: string
) {
  return function AnalyticsWrappedComponent(props: P) {
    const { track } = useAnalytics();

    useEffect(() => {
      if (eventName) {
        track(`Component Viewed: ${eventName}`);
      }
    }, []);

    return <WrappedComponent {...props} />;
  };
}

// Hook for tracking component interactions
export const useTrackEvent = () => {
  const { track } = useAnalytics();

  return {
    trackClick: (element: string, properties?: Record<string, any>) =>
      track('Element Clicked', { element, ...properties }),
    
    trackForm: (formName: string, action: 'submit' | 'error', properties?: Record<string, any>) =>
      track(`Form ${action}`, { form: formName, ...properties }),
    
    trackFeature: (feature: string, action: string, properties?: Record<string, any>) =>
      track('Feature Used', { feature, action, ...properties }),
    
    trackError: (error: string, context?: Record<string, any>) =>
      track('Error Occurred', { error, ...context }),
    
    trackConversion: (goal: string, value?: number, properties?: Record<string, any>) =>
      track('Conversion', { goal, value, ...properties })
  };
};

// Component for tracking specific user interactions
interface TrackingWrapperProps {
  event: string;
  properties?: Record<string, any>;
  children: React.ReactNode;
  trackOn?: 'click' | 'hover' | 'focus' | 'mount';
}

export const TrackingWrapper: React.FC<TrackingWrapperProps> = ({
  event,
  properties,
  children,
  trackOn = 'click'
}) => {
  const { track } = useAnalytics();

  const handleEvent = () => {
    track(event, properties);
  };

  const eventHandlers = {
    click: { onClick: handleEvent },
    hover: { onMouseEnter: handleEvent },
    focus: { onFocus: handleEvent },
    mount: {}
  };

  useEffect(() => {
    if (trackOn === 'mount') {
      handleEvent();
    }
  }, []);

  return (
    <div {...eventHandlers[trackOn]}>
      {children}
    </div>
  );
};

export default AnalyticsProvider;