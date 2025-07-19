# Contributing to FinishThisIdea

First off, thank you for considering contributing to FinishThisIdea! It's people like you that help developers worldwide ship their projects faster.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Screenshots** (if applicable)
- **System information**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use case** - Why is this needed?
- **Proposed solution** - How should it work?
- **Alternatives considered** - What other solutions did you think about?
- **Additional context** - Mockups, examples, etc.

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Follow our coding standards** (see `.rules/code-standards.md`)
3. **Write tests** for new functionality
4. **Ensure all tests pass** (`npm test`)
5. **Update documentation** as needed
6. **Submit a PR** with a clear description

## Development Process

### Setting Up Your Environment

```bash
# Clone your fork
git clone https://github.com/your-username/finishthisidea.git
cd finishthisidea

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development
npm run dev
```

### Project Structure

```
finishthisidea/
├── src/                    # Source code
│   ├── mvp-cleanup-service/    # Core cleanup service
│   ├── template-engine/        # Template system
│   ├── tinder-ui/             # Swipe interface
│   └── llm-router/            # AI orchestration
├── templates/              # Service templates
├── docs/                   # Documentation
├── tests/                  # Test suites
└── scripts/               # Build scripts
```

### Coding Standards

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for formatting
- **Conventional Commits** for commit messages

Example commit message:
```
feat(cleanup): add support for Python codebases

- Added Python AST parser
- Implemented Python-specific cleanup rules
- Added tests for Python processing
```

### Testing

We maintain high test coverage:
- **Unit tests** for business logic
- **Integration tests** for API endpoints
- **E2E tests** for user flows

Run tests:
```bash
npm test                # All tests
npm run test:unit      # Unit tests only
npm run test:integration # Integration tests
npm run test:e2e       # E2E tests
```

### Documentation

- Update relevant docs when changing functionality
- Add JSDoc comments to new functions
- Include examples in documentation
- Keep README.md up to date

## Creating New Services

### Using Templates

```bash
# Generate a new service
npm run generate-service

# Follow the interactive prompts
? Select template: code-processor
? Service name: style-formatter
? Description: Format code according to style guides
? Base price: 2
```

### Service Requirements

Every service must:
1. Process in under 30 minutes
2. Have clear pricing
3. Include documentation
4. Pass security review
5. Have 80%+ test coverage

### Template Development

To create a new template:

1. Copy the base template:
```bash
cp -r templates/base-service templates/your-template
```

2. Modify `template.yaml`:
```yaml
name: "{{name}}"
category: "your-category"
description: "What this template does"
```

3. Implement service logic
4. Add tests
5. Submit PR

## Community

### Discord

Join our Discord for:
- Real-time help
- Feature discussions
- Show off your cleaned code
- Beta testing

### Office Hours

Weekly office hours (Thursdays 2pm PST):
- Code reviews
- Architecture discussions
- Feature planning
- Q&A

## Recognition

Contributors are recognized in:
- `CONTRIBUTORS.md` file
- Monthly newsletter
- Discord special role
- Swag for significant contributions

## Financial Contributions

### Template Marketplace

- Create templates and earn 70% revenue share
- Popular templates can earn $1000+/month
- We handle payments and distribution

### Bug Bounties

Security vulnerabilities are eligible for bounties:
- Critical: $500-1000
- High: $200-500
- Medium: $50-200

## Release Process

1. Features developed in feature branches
2. PRs reviewed by 2 maintainers
3. Merged to `develop` branch
4. Weekly releases to `main`
5. Automated deployment to production

## Questions?

- **Discord**: Best for quick questions
- **GitHub Issues**: For bugs and features
- **Email**: opensource@finishthisidea.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to FinishThisIdea! Every contribution helps developers ship faster. 🚀