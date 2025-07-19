# FinishThisIdea Workflow Guide

## Step-by-Step Workflows for Common Tasks

This guide provides detailed, step-by-step workflows for all common development tasks in the FinishThisIdea project. Follow these workflows to maintain consistency and quality.

## Table of Contents

1. [Starting a New Day](#starting-a-new-day)
2. [Creating a New Service](#creating-a-new-service)
3. [Writing Documentation](#writing-documentation)
4. [Implementing a Feature](#implementing-a-feature)
5. [Fixing a Bug](#fixing-a-bug)
6. [Creating a Pull Request](#creating-a-pull-request)
7. [Reviewing Code](#reviewing-code)
8. [Deploying to Production](#deploying-to-production)

## Starting a New Day

### Objective
Set up your development environment for a productive day.

### Steps

1. **Update Your Main Branch**
   ```bash
   cd finishthisidea
   git checkout main
   git pull origin main
   ```

2. **Check System Health**
   ```bash
   # Run cleanup to check for issues
   ./scripts/cleanup.sh
   
   # If issues found, address them before continuing
   ```

3. **Update Memory System**
   ```bash
   # Sync memory with current state
   ./scripts/memory-update.sh
   
   # Review current context
   cat .claude/context.md
   ```

4. **Review Worktrees**
   ```bash
   # Check active worktrees
   ./scripts/worktree-manager.sh status
   
   # Clean up any merged worktrees
   ./scripts/worktree-manager.sh clean
   ```

5. **Check Todos**
   ```bash
   # Review high-priority items
   grep -A 20 "High Priority" .claude/todo.md
   
   # Or open in editor
   code .claude/todo.md
   ```

6. **Plan Your Day**
   - Choose 1-3 high-priority tasks
   - Update context.md with your focus
   - Create worktrees for each major task

### Checklist
- [ ] Main branch updated
- [ ] No cleanup issues
- [ ] Memory system current
- [ ] Worktrees organized
- [ ] Daily plan created

## Creating a New Service

### Objective
Create a new AI-powered service following the standard pattern.

### Steps

1. **Create Service Specification First**
   ```bash
   # Create docs worktree
   ./scripts/worktree-manager.sh new docs service-name
   cd ../finishthisidea-worktrees/docs-service-name
   
   # Create specification
   cp ../../finishthisidea/templates/service-spec.md \
      docs/03-services/service-name.md
   
   # Edit specification
   code docs/03-services/service-name.md
   ```

2. **Design the Service**
   - Define input/output formats
   - Specify pricing tiers
   - Document LLM requirements
   - Create usage examples

3. **Create Implementation Worktree**
   ```bash
   # After docs are complete
   cd ../../finishthisidea
   ./scripts/worktree-manager.sh new feature service-name
   cd ../finishthisidea-worktrees/feature-service-name
   ```

4. **Set Up Service Structure**
   ```bash
   # Create service directory
   mkdir -p src/services/service-name
   cd src/services/service-name
   
   # Create standard files
   touch index.ts
   touch service.ts
   touch types.ts
   touch service.test.ts
   touch README.md
   ```

5. **Implement Service Class**
   ```typescript
   // service.ts
   import { LLMRouter } from '../../llm-router';
   
   export class ServiceNameService {
     private llmRouter: LLMRouter;
     
     constructor() {
       this.llmRouter = new LLMRouter({
         ollama: { enabled: true, models: ['codellama'] },
         openai: { enabled: !!process.env.OPENAI_API_KEY },
       });
     }
     
     async process(input: ServiceInput): Promise<ServiceResult> {
       // Implementation
     }
   }
   ```

6. **Create API Endpoint**
   ```bash
   # Create route file
   touch src/routes/service-name.ts
   ```

7. **Add Tests**
   ```bash
   # Run tests as you develop
   npm test -- service-name
   ```

8. **Update Documentation**
   - Add API documentation
   - Update integration guide
   - Add to service catalog

9. **Create PR**
   ```bash
   # Commit and push
   git add .
   git commit -m "feat: add service-name service"
   git push -u origin feature/service-name
   
   # Create PR
   gh pr create
   ```

### Checklist
- [ ] Service specification written
- [ ] Service class implemented
- [ ] API endpoint created
- [ ] Tests written (>80% coverage)
- [ ] Documentation updated
- [ ] PR created

## Writing Documentation

### Objective
Create comprehensive documentation that follows our standards.

### Steps

1. **Choose Documentation Type**
   - Service specification → `docs/03-services/`
   - API documentation → `docs/06-api/`
   - Integration guide → `docs/07-integrations/`
   - Troubleshooting → `docs/09-troubleshooting/`

2. **Create Documentation Worktree**
   ```bash
   ./scripts/worktree-manager.sh new docs topic-name
   cd ../finishthisidea-worktrees/docs-topic-name
   ```

3. **Use Appropriate Template**
   ```bash
   # For service specs
   cp templates/service-spec.md docs/03-services/new-service.md
   
   # For API docs
   cp templates/api-endpoint.md docs/06-api/new-endpoint.md
   
   # For guides
   cp templates/integration-guide.md docs/07-integrations/new-guide.md
   ```

4. **Write Content**
   - **Overview**: Clear value proposition
   - **Details**: Comprehensive coverage
   - **Examples**: Real-world usage
   - **Code**: Working snippets
   - **Troubleshooting**: Common issues

5. **Add Visual Aids**
   ```markdown
   ## Architecture Diagram
   ```mermaid
   graph TD
     A[User Request] --> B[API Gateway]
     B --> C[Service]
     C --> D[LLM Router]
     D --> E[Ollama/OpenAI/Claude]
   ```
   ```

6. **Include Metadata**
   ```markdown
   ---
   title: Service Name
   version: 1.0.0
   last_updated: 2024-01-20
   author: Your Name
   ---
   ```

7. **Cross-Reference**
   ```markdown
   ## Related Documentation
   - [API Reference](../06-api/service-name.md)
   - [Integration Guide](../07-integrations/service-name.md)
   - [Troubleshooting](../09-troubleshooting/service-name.md)
   ```

8. **Validate Documentation**
   ```bash
   # Check for broken links
   # Check for completeness
   # Run through doc validator
   node scripts/validate-docs.js
   ```

### Checklist
- [ ] Template used
- [ ] All sections complete
- [ ] Examples included
- [ ] Code snippets tested
- [ ] Cross-references added
- [ ] Metadata included

## Implementing a Feature

### Objective
Implement a new feature with proper testing and documentation.

### Steps

1. **Review Requirements**
   - Read feature specification
   - Understand acceptance criteria
   - Identify dependencies

2. **Create Feature Worktree**
   ```bash
   ./scripts/worktree-manager.sh new feature feature-name
   cd ../finishthisidea-worktrees/feature-feature-name
   ./.worktree-setup.sh
   ```

3. **Design Implementation**
   - Create technical design
   - Identify affected components
   - Plan testing strategy

4. **Write Tests First (TDD)**
   ```typescript
   // feature.test.ts
   describe('FeatureName', () => {
     it('should handle expected behavior', () => {
       // Test implementation
     });
   });
   ```

5. **Implement Feature**
   ```typescript
   // Progressive implementation
   // 1. Basic functionality
   // 2. Error handling
   // 3. Edge cases
   // 4. Performance optimization
   ```

6. **Integration Testing**
   ```bash
   # Run all tests
   npm test
   
   # Run specific feature tests
   npm test -- feature-name
   
   # Check coverage
   npm run coverage
   ```

7. **Update Documentation**
   - API changes
   - New configuration options
   - Usage examples
   - Migration guide (if breaking)

8. **Manual Testing**
   - Test happy path
   - Test error cases
   - Test edge cases
   - Performance testing

9. **Code Review Prep**
   ```bash
   # Self-review
   git diff main
   
   # Check for issues
   npm run lint
   ./scripts/cleanup.sh
   ```

### Checklist
- [ ] Requirements understood
- [ ] Tests written first
- [ ] Feature implemented
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Manual testing complete
- [ ] Code review ready

## Fixing a Bug

### Objective
Fix a bug while preventing regression.

### Steps

1. **Reproduce the Bug**
   ```bash
   # Create bug fix worktree
   ./scripts/worktree-manager.sh new fix bug-description
   cd ../finishthisidea-worktrees/fix-bug-description
   ```

2. **Write Failing Test**
   ```typescript
   // Reproduce bug in test
   it('should not have bug behavior', () => {
     // This should fail initially
   });
   ```

3. **Investigate Root Cause**
   - Use debugger
   - Add logging
   - Review related code
   - Check recent changes

4. **Implement Fix**
   - Minimal change to fix issue
   - Don't refactor unless necessary
   - Preserve existing behavior

5. **Verify Fix**
   ```bash
   # Run the failing test
   npm test -- --grep "bug test"
   
   # Run full test suite
   npm test
   ```

6. **Check for Regressions**
   - Run integration tests
   - Manual testing
   - Performance check

7. **Document Fix**
   ```bash
   # In commit message
   git commit -m "fix: resolve issue with X causing Y
   
   The problem was caused by Z. Fixed by doing W.
   
   Fixes #123"
   ```

### Checklist
- [ ] Bug reproduced
- [ ] Failing test written
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Tests passing
- [ ] No regressions
- [ ] Fix documented

## Creating a Pull Request

### Objective
Create a high-quality PR that's easy to review.

### Steps

1. **Prepare Your Branch**
   ```bash
   # Sync with main
   ./scripts/worktree-manager.sh sync feature-name
   
   # Clean up commits
   git rebase -i origin/main
   ```

2. **Self-Review**
   ```bash
   # Review all changes
   git diff origin/main
   
   # Check each file
   git diff origin/main --name-only | \
     xargs -I {} git diff origin/main -- {}
   ```

3. **Run Quality Checks**
   ```bash
   # Full test suite
   npm test
   
   # Linting
   npm run lint
   
   # Type checking
   npm run type-check
   
   # Cleanup check
   ./scripts/cleanup.sh
   ```

4. **Update Documentation**
   - Ensure docs reflect changes
   - Update CHANGELOG.md
   - Add migration notes if needed

5. **Create PR**
   ```bash
   # Push branch
   git push -u origin feature/feature-name
   
   # Create PR with template
   gh pr create \
     --title "feat: add feature name" \
     --body "$(cat .github/pr-template.md)" \
     --assignee @me
   ```

6. **Fill PR Description**
   ```markdown
   ## Summary
   Brief description of changes
   
   ## Changes
   - Added X functionality
   - Updated Y component
   - Fixed Z issue
   
   ## Testing
   - [x] Unit tests added
   - [x] Integration tests pass
   - [x] Manual testing complete
   
   ## Screenshots
   [If applicable]
   ```

7. **Request Reviews**
   ```bash
   # Add reviewers
   gh pr edit --add-reviewer teammate1,teammate2
   
   # Add labels
   gh pr edit --add-label "ready-for-review,enhancement"
   ```

### Checklist
- [ ] Branch synced with main
- [ ] Commits cleaned up
- [ ] All tests passing
- [ ] Documentation updated
- [ ] PR description complete
- [ ] Reviewers assigned

## Reviewing Code

### Objective
Provide constructive code review that improves quality.

### Steps

1. **Understand Context**
   - Read PR description
   - Review linked issues
   - Understand the goal

2. **Check Big Picture**
   - Architecture decisions
   - API design
   - Performance implications
   - Security concerns

3. **Review Code Quality**
   ```bash
   # Check out PR locally
   gh pr checkout 123
   
   # Run tests
   npm test
   
   # Check documentation
   ```

4. **Provide Feedback**
   ```markdown
   # Constructive comment
   Consider using a Map here instead of an object for better performance with frequent lookups.
   
   ```suggestion
   const cache = new Map<string, CacheEntry>();
   ```
   ```

5. **Test Locally**
   - Run the application
   - Test new features
   - Check edge cases

6. **Approve or Request Changes**
   ```bash
   # Approve
   gh pr review --approve
   
   # Request changes
   gh pr review --request-changes \
     --body "See comments for required changes"
   ```

### Review Checklist
- [ ] Code follows patterns
- [ ] Tests are comprehensive
- [ ] Documentation updated
- [ ] No security issues
- [ ] Performance acceptable
- [ ] Error handling proper

## Deploying to Production

### Objective
Deploy changes to production safely.

### Steps

1. **Pre-Deployment Checks**
   ```bash
   # Ensure on main branch
   git checkout main
   git pull origin main
   
   # Run full test suite
   npm test
   
   # Build application
   npm run build
   ```

2. **Create Release**
   ```bash
   # Tag release
   git tag -a v1.2.3 -m "Release version 1.2.3"
   git push origin v1.2.3
   
   # Create GitHub release
   gh release create v1.2.3 \
     --title "Release v1.2.3" \
     --notes "$(cat CHANGELOG.md | sed -n '/## 1.2.3/,/## 1.2.2/p')"
   ```

3. **Deploy to Staging**
   ```bash
   # Deploy to staging first
   npm run deploy:staging
   
   # Run smoke tests
   npm run test:staging
   ```

4. **Production Deployment**
   ```bash
   # Deploy to production
   npm run deploy:production
   
   # Monitor deployment
   npm run monitor:deployment
   ```

5. **Post-Deployment**
   - Monitor error rates
   - Check performance metrics
   - Verify key features
   - Update status page

6. **Rollback if Needed**
   ```bash
   # If issues found
   npm run rollback:production
   
   # Investigate issues
   # Fix and redeploy
   ```

### Deployment Checklist
- [ ] All tests passing
- [ ] Build successful
- [ ] Staging deployment tested
- [ ] Production deployment complete
- [ ] Monitoring active
- [ ] Team notified

## Emergency Procedures

### Hotfix Workflow

1. **Create Hotfix Branch**
   ```bash
   git checkout -b hotfix/critical-issue main
   ```

2. **Fix Issue**
   - Minimal change
   - Add test
   - Verify fix

3. **Fast-Track Deploy**
   ```bash
   # Create PR
   gh pr create --title "hotfix: critical issue"
   
   # Get emergency approval
   # Merge and deploy
   ```

### Rollback Procedure

1. **Identify Last Good Version**
2. **Execute Rollback**
3. **Verify Services**
4. **Notify Team**
5. **Post-Mortem**

## Best Practices Summary

1. **Always Update Memory**: Keep .claude directory current
2. **Use Worktrees**: One task = one worktree
3. **Test First**: Write tests before code
4. **Document Everything**: If you changed it, document it
5. **Small PRs**: Easier to review and merge
6. **Regular Syncing**: Stay current with main
7. **Clean Commits**: Clear, purposeful commits

---

*Last Updated: 2024-01-20*
*Version: 1.0.0*