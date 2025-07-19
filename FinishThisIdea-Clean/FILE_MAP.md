# File Map - Single Source of Truth

## 🚨 BEFORE CREATING ANY FILE, CHECK THIS MAP

### Root Level Files

| File | Purpose | Content |
|------|---------|---------|
| README.md | GitHub landing page | Brief intro, quick start, links to docs |
| CLAUDE.md | AI assistant rules | Specific instructions for Claude/Cursor |
| AGENT.md | Generic AI rules | Instructions for any AI/LLM |
| QUALITY_STANDARDS.md | Code quality rules | No stubs, testing requirements |
| FILE_MAP.md | This file | Prevents duplicates |
| CONTRIBUTING.md | How to contribute | For open source contributors |
| LICENSE | MIT License | Legal stuff |
| .env.example | Environment template | All env vars with examples |
| package.json | Node.js config | Dependencies and scripts |
| docker-compose.yml | Local dev setup | All services for development |
| Dockerfile | Production image | How to build for deployment |
| tsconfig.json | TypeScript config | TS compiler settings |
| .gitignore | Git ignore rules | What not to commit |

### Documentation Structure (`/docs`)

| Path | Purpose | What goes here |
|------|---------|----------------|
| **01-overview/** | | |
| → README.md | Detailed project overview | Full explanation of what/why/how |
| → vision.md | Vision & mission | Long-term goals and beliefs |
| → quickstart.md | 5-minute guide | Simplest path to first success |
| → roadmap.md | Development timeline | Week-by-week plan |
| | | |
| **02-architecture/** | | |
| → README.md | Architecture overview | System design, components |
| → system-design.md | Detailed design | Component interactions |
| → data-flow.md | How data moves | Request lifecycle |
| → security.md | Security design | Auth, encryption, threats |
| → scalability.md | Scaling strategy | How to handle growth |
| | | |
| **03-services/** | | |
| → README.md | Services overview | List of all services |
| → service-catalog.md | Detailed catalog | Every service explained |
| → mvp-cleanup.md | Cleanup service | $1 service details |
| → [service-name].md | Other services | One file per service |
| | | |
| **04-implementation/** | | |
| → README.md | Implementation overview | How to build features |
| → week-1-mvp.md | Week 1 guide | Building the MVP |
| → week-2-tinder-ai.md | Week 2 guide | Tinder UI + AI router |
| → week-3-services.md | Week 3 guide | Additional services |
| → week-4-enterprise.md | Week 4 guide | Enterprise features |
| | | |
| **05-deployment/** | | |
| → README.md | Deployment overview | How to deploy |
| → local-development.md | Local setup | Dev environment |
| → docker-deployment.md | Docker guide | Container deployment |
| → railway-deployment.md | Railway guide | Production on Railway |
| → monitoring.md | Monitoring setup | Logs, metrics, alerts |
| | | |
| **06-api/** | | |
| → README.md | API overview | REST API intro |
| → api-reference.md | Full API docs | Every endpoint |
| → authentication.md | Auth guide | How auth works |
| → webhooks.md | Webhook guide | Event notifications |
| → rate-limiting.md | Rate limits | Quotas and limits |
| | | |
| **07-guides/** | | |
| → README.md | Guides overview | List of guides |
| → getting-started.md | Detailed start | Step-by-step first use |
| → creating-services.md | Service creation | How to add services |
| → using-templates.md | Template guide | Template system |
| → best-practices.md | Best practices | Do's and don'ts |
| | | |
| **08-operations/** | | |
| → README.md | Ops overview | Running in production |
| → maintenance.md | Maintenance | Regular tasks |
| → backup-recovery.md | Backups | Disaster recovery |
| → security-procedures.md | Security ops | Incident response |
| | | |
| **09-troubleshooting/** | | |
| → README.md | Troubleshooting overview | Common problems |
| → common-issues.md | Known issues | Solutions to problems |
| → debugging.md | Debug guide | How to debug |
| → performance.md | Perf issues | Optimization guide |
| → faq.md | FAQ | Frequent questions |

### Source Code Structure (`/src`)

| Path | Purpose |
|------|---------|
| mvp-cleanup-service/ | $1 cleanup service |
| tinder-ui/ | Swipe interface components |
| llm-router/ | AI routing logic |
| template-engine/ | Service generator |
| shared/ | Shared utilities |
| types/ | TypeScript types |

### Other Directories

| Path | Purpose |
|------|---------|
| /templates | Service templates |
| /.mcp | Cursor/MCP integration |
| /scripts | Build and deploy scripts |
| /tests | Test files |

## Rules to Prevent Duplicates

### 1. One Concept, One File
- ❌ DON'T: Have "overview" in multiple places
- ✅ DO: Put overview in `/docs/01-overview/README.md`

### 2. Clear Hierarchy
- Root README = GitHub landing (brief)
- Docs README = Detailed documentation
- No overlap in content

### 3. Before Creating a File
1. Check this FILE_MAP.md
2. Search for similar files: `find . -name "*keyword*"`
3. If exists, UPDATE don't CREATE

### 4. Naming Conventions
- Services: `service-name.md` (kebab-case)
- Guides: `verb-noun.md` (e.g., `creating-services.md`)
- Implementation: `week-X-feature.md`

### 5. Cross-References
Instead of duplicating, link:
```markdown
For detailed architecture, see [Architecture Overview](/docs/02-architecture/)
```

## Quick Checks

**Q: Where does project overview go?**
A: `/docs/01-overview/README.md` (detailed) + `/README.md` (brief)

**Q: Where does API documentation go?**
A: `/docs/06-api/api-reference.md`

**Q: Where do I document a new service?**
A: `/docs/03-services/service-name.md`

**Q: Where do deployment instructions go?**
A: `/docs/05-deployment/platform>