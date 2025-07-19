# Analytics System Documentation

## Overview

The FinishThisIdea Analytics System provides comprehensive user behavior tracking, business intelligence, and real-time analytics capabilities. It integrates with multiple analytics providers and offers privacy-compliant data collection with enterprise-grade insights.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │────│  Analytics       │────│  Providers      │
│   Components    │    │  Middleware      │    │  (External)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌──────────────────┐
                       │  Redis Cache     │
                       │  (Real-time)     │
                       └──────────────────┘
```

## Features

### 🔍 Event Tracking
- **Custom Events**: Track any user interaction or business event
- **Automatic Events**: Page views, API calls, sessions
- **Business Events**: Job creation, file uploads, payments
- **Real-time Processing**: Events processed immediately

### 👥 User Analytics
- **User Identification**: Link events to specific users
- **Session Management**: Track user sessions with automatic timeout
- **User Profiles**: Comprehensive user trait tracking
- **Behavioral Segmentation**: Automatic user categorization

### 📊 Real-time Dashboard
- **Live Metrics**: Active users, sessions, events
- **Interactive Charts**: Time series, pie charts, bar charts
- **Custom Time Ranges**: Hour, day, week, month, quarter
- **Export Capabilities**: Download analytics data

### 🎯 Business Intelligence
- **Conversion Tracking**: Goal completion and funnel analysis
- **Feature Usage**: Track feature adoption and usage patterns
- **Revenue Analytics**: Payment and subscription tracking
- **Retention Analysis**: User engagement over time

## Supported Providers

### Mixpanel
- **Use Case**: Product analytics and user behavior
- **Features**: Events, funnels, cohorts, retention
- **Configuration**: Set `MIXPANEL_TOKEN` in environment

### Segment
- **Use Case**: Customer data platform
- **Features**: Event streaming, data warehouse integration
- **Configuration**: Set `SEGMENT_WRITE_KEY` in environment

### PostHog
- **Use Case**: Open-source product analytics
- **Features**: Events, feature flags, session recordings
- **Configuration**: Set `POSTHOG_API_KEY` and `POSTHOG_HOST`

### Google Analytics 4
- **Use Case**: Web analytics and attribution
- **Features**: Traffic analysis, goal tracking
- **Configuration**: Set `GA_MEASUREMENT_ID` and `GA_API_SECRET`

## Implementation

### Backend Integration

#### Analytics Service
```typescript
import { analyticsService } from './services/analytics/analytics.service';

// Track custom event
await analyticsService.track({
  userId: 'user_123',
  event: 'Feature Used',
  properties: {
    feature: 'code_cleanup',
    duration: 1500
  }
});

// Identify user
await analyticsService.identify({
  userId: 'user_123',
  email: 'user@example.com',
  tier: 'pro'
});
```

#### Middleware Integration
```typescript
import { trackingSuite } from './middleware/analytics.middleware';

app.use(trackingSuite.session);      // Session management
app.use(trackingSuite.analytics);    // Event tracking
app.use(trackingSuite.user);         // User identification
app.use(trackingSuite.businessEvents); // Business events
```

#### API Routes
```typescript
import { analyticsRouter } from './api/routes/analytics.route';

app.use('/api/analytics', analyticsRouter);
```

### Frontend Integration

#### React Provider
```jsx
import { AnalyticsProvider } from './components/analytics/AnalyticsProvider';

function App() {
  return (
    <AnalyticsProvider
      userId={user?.id}
      autoTrack={true}
      debug={process.env.NODE_ENV === 'development'}
    >
      <YourApp />
    </AnalyticsProvider>
  );
}
```

#### Using Analytics Hook
```jsx
import { useAnalytics } from './components/analytics/AnalyticsProvider';

function MyComponent() {
  const { track, identify } = useAnalytics();

  const handleButtonClick = () => {
    track('Button Clicked', {
      button: 'primary-cta',
      location: 'header'
    });
  };

  return <button onClick={handleButtonClick}>Click Me</button>;
}
```

#### Tracking Wrapper
```jsx
import { TrackingWrapper } from './components/analytics/AnalyticsProvider';

function FeatureComponent() {
  return (
    <TrackingWrapper
      event="Feature Viewed"
      properties={{ feature: 'dashboard' }}
      trackOn="mount"
    >
      <Dashboard />
    </TrackingWrapper>
  );
}
```

## API Endpoints

### Event Tracking
```http
POST /api/analytics/track
Content-Type: application/json

{
  "event": "Job Created",
  "properties": {
    "jobType": "cleanup",
    "profileId": "js-standard"
  },
  "userId": "user_123"
}
```

### User Identification
```http
POST /api/analytics/identify
Content-Type: application/json

{
  "userId": "user_123",
  "traits": {
    "email": "user@example.com",
    "name": "John Doe",
    "tier": "pro"
  }
}
```

### Page View Tracking
```http
POST /api/analytics/pageview
Content-Type: application/json

{
  "page": "/dashboard",
  "properties": {
    "title": "Dashboard",
    "referrer": "/login"
  }
}
```

### Real-time Analytics
```http
GET /api/analytics/realtime
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "data": {
    "activeUsers": 45,
    "activeSessions": 52,
    "recentEvents": [...],
    "topEvents": [...]
  }
}
```

### Dashboard Data
```http
GET /api/analytics/dashboard/overview?timeRange=7d
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "activeUsers": 340,
    "totalSessions": 2100,
    "avgSessionDuration": 420,
    "topEvents": [...],
    "userGrowth": [...]
  }
}
```

## Event Schema

### Standard Events
- `Session Started` - User session begins
- `Session Ended` - User session ends
- `Page Viewed` - Page navigation
- `API Call` - Backend API request
- `User Registered` - Account creation
- `User Login` - Authentication
- `Feature Used` - Feature interaction

### Business Events
- `Job Created` - Code cleanup job started
- `Job Completed` - Job finished successfully
- `File Uploaded` - File upload completed
- `Credits Purchased` - Payment processed
- `Profile Created` - Custom profile saved
- `Profile Used` - Profile applied to job

### Custom Events
You can track any custom event with properties:

```typescript
await analytics.track('Custom Event Name', {
  category: 'user_action',
  value: 100,
  metadata: {
    source: 'dashboard',
    experiment: 'test_a'
  }
});
```

## Dashboard Features

### Real-time Monitoring
- **Active Users**: Currently active users count
- **Live Events**: Real-time event stream
- **Session Activity**: Active sessions with duration
- **Error Tracking**: Failed events and issues

### Analytics Overview
- **User Metrics**: Total, active, new users
- **Session Metrics**: Count, duration, bounce rate
- **Event Metrics**: Volume, top events, conversion rates
- **Feature Metrics**: Usage, adoption, retention

### Interactive Charts
- **Time Series**: User growth, event volume over time
- **Pie Charts**: Event distribution, user segments
- **Bar Charts**: Feature usage, page popularity
- **Funnel Charts**: Conversion analysis

### Data Export
- **CSV Export**: Download analytics data
- **Date Range**: Custom time periods
- **Filtered Data**: Export specific segments
- **Automated Reports**: Scheduled exports

## Privacy & Compliance

### Data Collection
- **Opt-in Tracking**: User consent required
- **Anonymization**: PII removal options
- **Data Retention**: Configurable retention periods
- **GDPR Compliance**: Right to deletion, data portability

### Security
- **Encrypted Storage**: All data encrypted at rest
- **Secure Transmission**: HTTPS/TLS for all requests
- **Access Control**: Role-based access to analytics
- **Audit Logging**: Track data access and changes

## Configuration

### Environment Variables
```bash
# Analytics Providers
MIXPANEL_TOKEN=your_mixpanel_token
SEGMENT_WRITE_KEY=your_segment_write_key
POSTHOG_API_KEY=your_posthog_api_key
POSTHOG_HOST=https://app.posthog.com

# Google Analytics
GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA_API_SECRET=your_ga_api_secret

# Feature Flags
ENABLE_ANALYTICS=true
ANALYTICS_DEBUG=false
ANALYTICS_BATCH_SIZE=20
ANALYTICS_FLUSH_INTERVAL=10000
```

### Analytics Middleware Options
```typescript
const analyticsMiddleware = new AnalyticsMiddleware({
  trackPageViews: true,
  trackApiCalls: true,
  excludePaths: ['/health', '/metrics'],
  includeRequestData: false,
  sessionTimeout: 1800 // 30 minutes
});
```

## Performance Considerations

### Batching
- Events are batched for efficient transmission
- Configurable batch size and flush intervals
- Automatic flushing on session end

### Caching
- Redis cache for real-time analytics
- Session data cached for quick access
- Event counters for performance metrics

### Rate Limiting
- Analytics endpoints have rate limits
- Prevents abuse and ensures performance
- Configurable limits per user tier

## Monitoring & Alerting

### Health Checks
- Analytics service health endpoint
- Provider connectivity monitoring
- Event processing status

### Error Tracking
- Failed events logged and retried
- Provider errors captured
- Performance bottlenecks identified

### Alerts
- Event volume anomalies
- Provider downtime
- High error rates
- Performance degradation

## Best Practices

### Event Design
1. **Consistent Naming**: Use clear, descriptive event names
2. **Property Structure**: Maintain consistent property schemas
3. **Event Hierarchy**: Group related events logically
4. **Avoid PII**: Don't include sensitive user data

### Performance
1. **Async Tracking**: Don't block user interactions
2. **Batch Events**: Group events for efficiency
3. **Error Handling**: Graceful degradation when analytics fails
4. **Resource Management**: Monitor memory and CPU usage

### Privacy
1. **User Consent**: Implement consent management
2. **Data Minimization**: Collect only necessary data
3. **Retention Policies**: Implement data deletion
4. **Transparency**: Clearly communicate data usage

## Troubleshooting

### Common Issues

#### Events Not Appearing
- Check provider configuration
- Verify API keys and tokens
- Review network connectivity
- Check event payload format

#### Performance Issues
- Monitor batch size and flush intervals
- Check Redis connectivity
- Review event volume and rate limits
- Optimize event properties

#### Data Discrepancies
- Compare provider data
- Check timezone configurations
- Verify event deduplication
- Review user identification logic

### Debug Mode
Enable debug mode for detailed logging:

```typescript
const analytics = new AnalyticsService({
  debug: true,
  logLevel: 'debug'
});
```

### Health Monitoring
Check analytics health:

```bash
curl http://localhost:3000/api/analytics/health
```

## Future Enhancements

### Planned Features
- **Machine Learning**: Predictive analytics and recommendations
- **Advanced Segmentation**: AI-powered user clustering
- **Real-time Alerts**: Custom threshold monitoring
- **Data Warehouse**: Advanced query capabilities
- **A/B Testing**: Integrated experiment framework

### Integration Roadmap
- **CRM Integration**: Salesforce, HubSpot connectivity
- **Marketing Tools**: Email, advertising platform sync
- **Business Intelligence**: Tableau, PowerBI connectors
- **Data Science**: Jupyter, R integration

## Support

For analytics-related issues:
1. Check the health endpoint: `/api/analytics/health`
2. Review logs for error messages
3. Verify environment configuration
4. Contact the development team

## Resources

- [Mixpanel Documentation](https://developer.mixpanel.com/)
- [Segment Documentation](https://segment.com/docs/)
- [PostHog Documentation](https://posthog.com/docs)
- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)