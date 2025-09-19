# Contributing to Document Generator

Thank you for your interest in contributing to Document Generator! We welcome contributions from the community and are grateful for your support.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a friendly, safe, and welcoming environment for all contributors.

### Expected Behavior

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Accept feedback gracefully
- Respect differing viewpoints

### Unacceptable Behavior

- Harassment or discrimination
- Inappropriate language or imagery
- Personal attacks
- Trolling or insulting comments
- Publishing private information

## 🚀 Getting Started

### Prerequisites

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/yourusername/document-generator.git
   cd document-generator
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/original/document-generator.git
   ```

4. Install dependencies:
   ```bash
   npm install
   # OR use the setup wizard
   node install.js
   ```

### First Contribution

Looking for a place to start? Check out:
- Issues labeled `good first issue`
- Issues labeled `help wanted`
- Documentation improvements
- Test coverage improvements

## 🤝 How to Contribute

### Reporting Bugs

**Before submitting a bug report:**
- Check existing issues
- Try reproducing with latest version
- Collect relevant information

**Bug report should include:**
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- System information
- Error messages/logs

### Suggesting Features

**Feature requests should include:**
- Use case description
- Proposed solution
- Alternative solutions considered
- Potential impact on existing features

### Contributing Code

1. **Discuss first**: For major changes, open an issue first
2. **One feature per PR**: Keep pull requests focused
3. **Follow standards**: Match existing code style
4. **Write tests**: Include tests for new features
5. **Update docs**: Document new features/changes

## 💻 Development Setup

### Environment Setup

1. **Configure development environment**:
   ```bash
   cp .env.example .env.development
   NODE_ENV=development npm start
   ```

2. **Use local AI for development**:
   ```env
   ENABLE_LOCAL_AI=true
   ENABLE_CLOUD_AI=false
   USE_MOCK_PAYMENTS=true
   ```

3. **Enable debug logging**:
   ```env
   ENABLE_DEBUG_LOGS=true
   LOG_LEVEL=debug
   ```

### Project Structure

```
document-generator/
├── api/               # REST API endpoints
├── config/            # Configuration files
├── database/          # Database schemas and migrations
├── docs/              # Documentation
├── mcp/               # MCP service implementation
├── scripts/           # Utility scripts
├── services/          # Business logic services
├── styles/            # CSS and design system
├── templates/         # Document templates
├── tests/             # Test suites
└── vault-manager.js   # Security vault implementation
```

### Key Technologies

- **Backend**: Node.js, Express
- **Database**: SQLite/PostgreSQL
- **AI**: Ollama, OpenAI, Anthropic
- **Testing**: Jest, Supertest
- **Docker**: Container orchestration
- **CSS**: Custom design system

## 📝 Coding Standards

### JavaScript Style Guide

```javascript
// Use meaningful variable names
const userDocument = await processDocument(input);  // ✓
const doc = await proc(i);                         // ✗

// Use async/await over callbacks
async function loadData() {                         // ✓
    const data = await fetchData();
    return processData(data);
}

// Handle errors properly
try {                                              // ✓
    const result = await riskyOperation();
} catch (error) {
    logger.error('Operation failed:', error);
    throw new CustomError('Failed to process', error);
}

// Use JSDoc comments
/**
 * Process a document through AI pipeline
 * @param {Object} document - Input document
 * @param {string} document.content - Document content
 * @param {string} document.type - Document type
 * @returns {Promise<Object>} Processed result
 */
async function processDocument(document) {
    // Implementation
}
```

### CSS Style Guide

```css
/* Use design system variables */
.component {
    color: var(--text-primary);           /* ✓ */
    background: var(--bg-secondary);      /* ✓ */
    padding: var(--space-4);             /* ✓ */
    
    color: #333;                         /* ✗ */
    padding: 16px;                       /* ✗ */
}

/* Component-based naming */
.dashboard-header { }                    /* ✓ */
.dashboard-header__title { }             /* ✓ */
.dashboard-header--dark { }              /* ✓ */
```

### Git Commit Messages

```bash
# Format: <type>(<scope>): <subject>

feat(ai): add support for Claude 3 models
fix(auth): resolve JWT expiration issue
docs(api): update endpoint documentation
style(dashboard): improve responsive layout
refactor(database): optimize query performance
test(vault): add encryption test cases
chore(deps): update dependencies
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testPathPattern=vault

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Writing Tests

```javascript
// Example test structure
describe('DocumentProcessor', () => {
    let processor;
    
    beforeEach(() => {
        processor = new DocumentProcessor();
    });
    
    describe('processDocument', () => {
        it('should process markdown documents', async () => {
            const input = { type: 'markdown', content: '# Test' };
            const result = await processor.processDocument(input);
            
            expect(result).toBeDefined();
            expect(result.status).toBe('success');
            expect(result.output).toContain('Test');
        });
        
        it('should handle errors gracefully', async () => {
            const input = { type: 'invalid' };
            
            await expect(processor.processDocument(input))
                .rejects.toThrow('Unsupported document type');
        });
    });
});
```

### Test Coverage Requirements

- New features: 80% coverage minimum
- Bug fixes: Include regression tests
- Critical paths: 90% coverage target

## 📤 Submitting Changes

### Pull Request Process

1. **Update your fork**:
   ```bash
   git checkout main
   git pull upstream main
   git push origin main
   ```

2. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes**:
   - Write code
   - Add tests
   - Update documentation
   - Run linting: `npm run lint`

4. **Commit changes**:
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**:
   - Go to GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill out PR template

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests
- [ ] Updated existing tests

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Updated documentation
- [ ] No console.log statements
- [ ] No hardcoded values
```

### Code Review Process

1. Automated checks must pass
2. At least one maintainer review
3. Address feedback
4. Maintain clean commit history
5. Ensure CI/CD passes

## 🚀 Release Process

### Version Numbering

We use [Semantic Versioning](https://semver.org/):
- MAJOR.MINOR.PATCH (e.g., 2.4.1)
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Security audit passed
- [ ] Release notes prepared

## 🌟 Recognition

### Contributors

We maintain a list of all contributors in:
- [CONTRIBUTORS.md](./CONTRIBUTORS.md)
- [All Contributors](https://allcontributors.org/) spec

### Types of Contributions

We recognize all contributions:
- 💻 Code
- 📖 Documentation
- 🎨 Design
- 🤔 Ideas
- 👀 Reviews
- 📢 Talks
- 🔧 Tools

## 📞 Getting Help

### Resources

- [Documentation](./docs/)
- [API Reference](./docs/api/)
- [Discord Community](https://discord.gg/docgen)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/document-generator)

### Communication Channels

- **Issues**: Bug reports and features
- **Discussions**: General questions
- **Discord**: Real-time chat
- **Email**: security@documentgenerator.com (security only)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Document Generator! 🎉