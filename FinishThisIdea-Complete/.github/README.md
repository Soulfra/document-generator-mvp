# 🚀 GitHub Actions CI/CD Pipeline

This directory contains comprehensive GitHub Actions workflows for automated testing, building, security scanning, and deployment of the FinishThisIdea Platform.

## 📋 Overview

Our CI/CD pipeline provides enterprise-grade automation with the following workflows:

### 🔄 Workflows

| Workflow | Trigger | Purpose | Duration |
|----------|---------|---------|----------|
| **CI/CD Pipeline** | Push/PR to main/develop | Full testing, building, deployment | ~15-20 min |
| **Security Scan** | Daily + Push/PR | Security analysis, vulnerability scanning | ~10-15 min |
| **Performance Testing** | Daily + Push to main | Load testing, performance benchmarks | ~5-10 min |
| **Release** | Tag push (`v*`) | Automated releases with artifacts | ~25-30 min |

### 🛠️ Features

#### ✅ Comprehensive Testing
- **Frontend Tests**: Unit, integration, E2E with coverage
- **Backend Tests**: API tests, database tests, integration tests
- **Type Checking**: Full TypeScript validation
- **Lint & Format**: Code quality enforcement

#### 🔒 Security & Quality
- **Dependency Scanning**: npm audit, Snyk, Trivy
- **Code Analysis**: CodeQL, ESLint, Prettier
- **Secret Scanning**: TruffleHog for credential detection
- **License Compliance**: Automated license checking
- **Container Security**: Docker image vulnerability scanning

#### ⚡ Performance Monitoring
- **Frontend Performance**: Lighthouse CI for web vitals
- **Backend Performance**: Artillery load testing
- **Database Performance**: Query optimization testing
- **Bundle Analysis**: Frontend asset size monitoring

#### 🚀 Automated Deployment
- **Docker Images**: Multi-architecture builds (amd64, arm64)
- **Release Artifacts**: Automated packaging and distribution
- **Health Checks**: Post-deployment verification
- **Rollback Support**: Automated failure recovery

### 📦 Dependabot Configuration

Automated dependency updates with intelligent grouping:

```yaml
# Backend Dependencies (Weekly Monday 9 AM UTC)
- npm packages with smart grouping (Prisma, Express, Testing, Linting)

# Frontend Dependencies (Weekly Monday 10 AM UTC)  
- React ecosystem, Vite tooling, UI libraries

# Docker Dependencies (Weekly Tuesday 9 AM UTC)
- Base image updates

# GitHub Actions (Weekly Tuesday 10 AM UTC)
- Action version updates with security focus
```

## 🚀 Getting Started

### Prerequisites

1. **Repository Secrets** (configure in GitHub Settings > Secrets):
   ```bash
   GITHUB_TOKEN          # Automatically provided
   SNYK_TOKEN           # Optional: Snyk security scanning
   ```

2. **Package Scripts** (already configured):
   ```bash
   # Testing
   npm run test:coverage
   npm run test:integration
   npm run test:db:performance
   
   # Building
   npm run build:production
   
   # Quality
   npm run lint:report
   npm run format:check
   npm run type-check
   
   # Docker
   npm run docker:build
   npm run docker:build:ai-api
   npm run docker:build:analytics
   ```

### 🎯 Manual Triggers

#### Release Workflow
```bash
# Create a new release
git tag v1.2.3
git push origin v1.2.3

# Or use GitHub UI to trigger manual release
# Go to Actions > Release > Run workflow
```

#### Performance Testing
```bash
# Trigger manual performance test
# Go to Actions > Performance Testing > Run workflow
# Configure: test_duration=10, concurrent_users=100
```

## 📊 Workflow Details

### 🔄 CI/CD Pipeline (`ci.yml`)

**Triggers**: Push/PR to main/develop

**Jobs**:
1. **Documentation Check** - Validates required docs exist
2. **Frontend Tests** - React testing with coverage
3. **Backend Tests** - API and database testing  
4. **Security Scan** - Vulnerability assessment
5. **Code Quality** - Linting and formatting
6. **Build** - Production builds for frontend/backend
7. **Docker Build** - Container images with caching
8. **Migration Check** - Database schema validation
9. **Performance Tests** - Basic performance validation
10. **Deploy** - Automated deployment (main branch only)

**Optimizations**:
- Parallel job execution
- Docker layer caching
- Dependency caching
- Artifact sharing between jobs

### 🔒 Security Scan (`security.yml`)

**Triggers**: Daily 2 AM UTC, Push/PR to main, Manual

**Security Checks**:
- **Dependency Scan**: npm audit + vulnerability analysis
- **Code Analysis**: CodeQL for security issues
- **Secret Detection**: TruffleHog for exposed credentials
- **Container Security**: Trivy + Snyk image scanning
- **License Compliance**: GPL/LGPL/AGPL detection
- **Environment Security**: Sensitive file detection

**Reporting**: SARIF uploads to GitHub Security tab

### ⚡ Performance Testing (`performance.yml`)

**Triggers**: Daily 3 AM UTC, Push to main, Manual

**Performance Tests**:
- **Frontend**: Lighthouse CI (Performance, A11y, SEO, Best Practices)
- **Backend**: Artillery load testing with thresholds
- **Database**: Query performance benchmarking
- **Bundle Analysis**: Frontend asset size monitoring

**Thresholds**:
```javascript
Performance Score: > 80%
Accessibility: > 90%
P95 Response Time: < 1000ms
Success Rate: > 95%
Error Rate: < 5%
```

### 🚀 Release Workflow (`release.yml`)

**Triggers**: Version tags (`v*`), Manual workflow dispatch

**Release Process**:
1. **Version Validation** - Semantic versioning check
2. **Build & Test** - Full CI pipeline execution
3. **Artifact Creation** - Deployment packages (.tar.gz, .zip)
4. **Docker Images** - Multi-architecture container builds
5. **Release Notes** - Auto-generated changelog
6. **GitHub Release** - Release creation with assets
7. **Post-Release** - Documentation updates and notifications

**Artifacts**:
- Source code packages with checksums
- Docker images (main, ai-api, analytics)
- Comprehensive release notes
- Quick start documentation

## 🔧 Configuration

### Environment Variables

```bash
# CI/CD Configuration
NODE_VERSION=18.x
DOCKER_REGISTRY=ghcr.io
IMAGE_NAME=${{ github.repository }}

# Database (Test)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test_db
REDIS_URL=redis://localhost:6379

# Performance Testing
MAX_P95_RESPONSE_TIME=1000
MIN_SUCCESS_RATE=95
MAX_ERROR_RATE=5
```

### Service Dependencies

**CI Services** (automatically configured):
- PostgreSQL 15 (testing)
- Redis 7 (caching)
- Node.js 18.x (runtime)

**External Integrations**:
- GitHub Container Registry (Docker images)
- Codecov (coverage reporting)  
- GitHub Security (SARIF uploads)

## 📈 Monitoring & Metrics

### Pipeline Metrics
- **Success Rate**: 95%+ target
- **Build Time**: ~15-20 minutes average
- **Test Coverage**: Frontend 80%+, Backend 85%+
- **Security Score**: Zero high/critical vulnerabilities

### Performance Benchmarks
- **Frontend Load Time**: < 3 seconds
- **API Response Time**: P95 < 1 second
- **Database Queries**: < 200ms average
- **Bundle Size**: Monitored with size limits

## 🛡️ Security Features

### Dependency Management
- **Automated Updates**: Dependabot with security prioritization
- **Vulnerability Scanning**: Multi-tool approach (npm audit, Snyk, Trivy)
- **License Compliance**: GPL family license detection
- **Supply Chain Security**: Lock file validation

### Container Security
- **Base Image Scanning**: Trivy vulnerability assessment
- **Multi-architecture**: Linux amd64/arm64 support
- **Security Contexts**: Non-root containers
- **Layer Optimization**: Minimal attack surface

### Access Control
- **Branch Protection**: Required status checks
- **Review Requirements**: PR approval workflows
- **Secret Management**: GitHub Secrets integration
- **Audit Logging**: Complete pipeline traceability

## 🚀 Deployment Strategy

### Production Deployment
- **Blue-Green**: Zero-downtime deployments
- **Health Checks**: Automated verification
- **Rollback**: Automatic failure recovery
- **Monitoring**: Real-time deployment tracking

### Infrastructure
- **Container Registry**: GitHub Container Registry
- **Image Tagging**: Semantic versioning + latest
- **Multi-Environment**: Development, staging, production
- **Scaling**: Horizontal scaling support

## 📚 Troubleshooting

### Common Issues

**Build Failures**:
```bash
# Check logs in GitHub Actions
# Verify package.json scripts
npm run type-check
npm run lint
npm run test
```

**Test Failures**:
```bash
# Run tests locally
npm run test:coverage
npm run test:integration

# Check database setup
npm run db:migrate:deploy
npm run db:seed:performance
```

**Docker Build Issues**:
```bash
# Build locally
npm run docker:build
docker run --rm finishthisidea npm run health-check
```

**Performance Issues**:
```bash
# Run performance tests locally
npm run test:db:performance
# Check bundle size
cd frontend && npm run analyze
```

### Getting Help

1. **Check Workflow Logs**: GitHub Actions tab
2. **Review PR Checks**: Status details in PRs
3. **Local Testing**: Reproduce issues locally
4. **Documentation**: Refer to workflow-specific docs

## 🎯 Best Practices

### Commits & PRs
- Use conventional commit messages
- Keep PRs focused and atomic
- Ensure all checks pass before merge
- Add appropriate labels for automation

### Testing
- Write tests for new features
- Maintain test coverage thresholds
- Include integration tests for APIs
- Performance test critical paths

### Security
- Never commit secrets or credentials
- Review dependency updates carefully
- Monitor security advisories
- Use secure coding practices

### Performance
- Monitor bundle sizes
- Optimize database queries
- Cache frequently accessed data
- Profile performance regularly

---

🎉 **This CI/CD pipeline provides enterprise-grade automation for reliable, secure, and performant software delivery!**