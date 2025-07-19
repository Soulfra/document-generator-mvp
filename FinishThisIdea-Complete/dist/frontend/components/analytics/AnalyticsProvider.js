"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingWrapper = exports.useTrackEvent = exports.useAnalytics = exports.AnalyticsProvider = void 0;
exports.withAnalytics = withAnalytics;
const react_1 = __importStar(require("react"));
const AnalyticsContext = (0, react_1.createContext)(undefined);
const AnalyticsProvider = ({ children, apiKey, userId, autoTrack = true, debug = false }) => {
    const [sessionId, setSessionId] = (0, react_1.useState)();
    const [isEnabled, setIsEnabled] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        if (autoTrack) {
            initializeSession();
            trackPageViews();
        }
        return () => {
            if (sessionId) {
                endSession();
            }
        };
    }, []);
    (0, react_1.useEffect)(() => {
        if (userId) {
            identify(userId);
        }
    }, [userId]);
    const initializeSession = async () => {
        try {
            const existingSessionId = localStorage.getItem('analytics_session_id');
            const sessionExpiry = localStorage.getItem('analytics_session_expiry');
            if (existingSessionId && sessionExpiry && new Date() < new Date(sessionExpiry)) {
                setSessionId(existingSessionId);
                return;
            }
            await startSession();
        }
        catch (error) {
            console.error('Failed to initialize analytics session:', error);
        }
    };
    const trackPageViews = () => {
        pageView(window.location.pathname);
        const originalPushState = window.history.pushState;
        const originalReplaceState = window.history.replaceState;
        window.history.pushState = function (...args) {
            originalPushState.apply(this, args);
            setTimeout(() => pageView(window.location.pathname), 0);
        };
        window.history.replaceState = function (...args) {
            originalReplaceState.apply(this, args);
            setTimeout(() => pageView(window.location.pathname), 0);
        };
        window.addEventListener('popstate', () => {
            setTimeout(() => pageView(window.location.pathname), 0);
        });
    };
    const track = async (event, properties) => {
        if (!isEnabled)
            return;
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
        }
        catch (error) {
            console.error('Failed to track analytics event:', error);
        }
    };
    const identify = async (userId, traits) => {
        if (!isEnabled)
            return;
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
        }
        catch (error) {
            console.error('Failed to identify user:', error);
        }
    };
    const pageView = async (page, properties) => {
        if (!isEnabled)
            return;
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
        }
        catch (error) {
            console.error('Failed to track page view:', error);
        }
    };
    const startSession = async () => {
        try {
            const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const sessionExpiry = new Date(Date.now() + 30 * 60 * 1000);
            localStorage.setItem('analytics_session_id', newSessionId);
            localStorage.setItem('analytics_session_expiry', sessionExpiry.toISOString());
            setSessionId(newSessionId);
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
        }
        catch (error) {
            console.error('Failed to start analytics session:', error);
        }
    };
    const endSession = async () => {
        if (!sessionId)
            return;
        try {
            await fetch(`/api/analytics/session/${sessionId}/end`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(apiKey && { 'X-API-Key': apiKey })
                }
            });
            localStorage.removeItem('analytics_session_id');
            localStorage.removeItem('analytics_session_expiry');
            setSessionId(undefined);
            if (debug) {
                console.log('Analytics session ended');
            }
        }
        catch (error) {
            console.error('Failed to end analytics session:', error);
        }
    };
    const contextValue = {
        track,
        identify,
        pageView,
        startSession,
        endSession,
        isEnabled,
        sessionId
    };
    return (<AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>);
};
exports.AnalyticsProvider = AnalyticsProvider;
const useAnalytics = () => {
    const context = (0, react_1.useContext)(AnalyticsContext);
    if (!context) {
        throw new Error('useAnalytics must be used within an AnalyticsProvider');
    }
    return context;
};
exports.useAnalytics = useAnalytics;
function withAnalytics(WrappedComponent, eventName) {
    return function AnalyticsWrappedComponent(props) {
        const { track } = (0, exports.useAnalytics)();
        (0, react_1.useEffect)(() => {
            if (eventName) {
                track(`Component Viewed: ${eventName}`);
            }
        }, []);
        return <WrappedComponent {...props}/>;
    };
}
const useTrackEvent = () => {
    const { track } = (0, exports.useAnalytics)();
    return {
        trackClick: (element, properties) => track('Element Clicked', { element, ...properties }),
        trackForm: (formName, action, properties) => track(`Form ${action}`, { form: formName, ...properties }),
        trackFeature: (feature, action, properties) => track('Feature Used', { feature, action, ...properties }),
        trackError: (error, context) => track('Error Occurred', { error, ...context }),
        trackConversion: (goal, value, properties) => track('Conversion', { goal, value, ...properties })
    };
};
exports.useTrackEvent = useTrackEvent;
const TrackingWrapper = ({ event, properties, children, trackOn = 'click' }) => {
    const { track } = (0, exports.useAnalytics)();
    const handleEvent = () => {
        track(event, properties);
    };
    const eventHandlers = {
        click: { onClick: handleEvent },
        hover: { onMouseEnter: handleEvent },
        focus: { onFocus: handleEvent },
        mount: {}
    };
    (0, react_1.useEffect)(() => {
        if (trackOn === 'mount') {
            handleEvent();
        }
    }, []);
    return (<div {...eventHandlers[trackOn]}>
      {children}
    </div>);
};
exports.TrackingWrapper = TrackingWrapper;
exports.default = exports.AnalyticsProvider;
//# sourceMappingURL=AnalyticsProvider.js.map