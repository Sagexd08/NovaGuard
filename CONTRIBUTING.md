# Contributing to NovaGuard

Thank you for your interest in contributing to NovaGuard! We welcome contributions from the community and are excited to work with you to make NovaGuard the best smart contract auditing platform.

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Contributing Guidelines](#contributing-guidelines)
5. [Pull Request Process](#pull-request-process)
6. [Issue Reporting](#issue-reporting)
7. [Development Workflow](#development-workflow)
8. [Code Style](#code-style)
9. [Testing](#testing)
10. [Documentation](#documentation)

## 🤝 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@novaguard.app.

## 🚀 Getting Started

### Ways to Contribute

- **Bug Reports**: Help us identify and fix bugs
- **Feature Requests**: Suggest new features or improvements
- **Code Contributions**: Submit bug fixes, features, or improvements
- **Documentation**: Improve our documentation and guides
- **Testing**: Help test new features and report issues
- **Community Support**: Help other users in our Discord community

### Before You Start

1. Check existing [issues](https://github.com/your-org/novaguard/issues) and [pull requests](https://github.com/your-org/novaguard/pulls)
2. Join our [Discord community](https://discord.gg/novaguard) for discussions
3. Read through this contributing guide
4. Set up your development environment

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ and pnpm
- Git
- Firebase CLI
- Supabase CLI
- Docker (optional)

### Local Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/novaguard.git
   cd novaguard
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Database Setup**
   ```bash
   supabase start
   supabase db push
   pnpm run db:generate
   ```

5. **Start Development Server**
   ```bash
   pnpm dev
   ```

6. **Verify Setup**
   - Open http://localhost:3000
   - Run tests: `pnpm test`
   - Check linting: `pnpm lint`

## 📝 Contributing Guidelines

### Types of Contributions

#### 🐛 Bug Fixes
- Fix existing functionality that isn't working as expected
- Include tests that verify the fix
- Update documentation if necessary

#### ✨ New Features
- Add new functionality to the platform
- Discuss major features in an issue first
- Include comprehensive tests
- Update documentation and user guides

#### 📚 Documentation
- Improve existing documentation
- Add missing documentation
- Fix typos and grammar
- Add examples and tutorials

#### 🧪 Testing
- Add missing test coverage
- Improve existing tests
- Add integration or E2E tests
- Performance testing

### Contribution Process

1. **Create an Issue** (for bugs or feature requests)
2. **Fork the Repository**
3. **Create a Feature Branch**
4. **Make Your Changes**
5. **Add Tests**
6. **Update Documentation**
7. **Submit a Pull Request**

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows our style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Documentation updated
- [ ] Commit messages follow conventional commits
- [ ] No merge conflicts with main branch

### PR Template

When creating a pull request, please include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests pass
- [ ] Documentation updated
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs automatically
2. **Code Review**: Team members review your code
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, your PR will be merged

## 🐛 Issue Reporting

### Bug Reports

Use our bug report template and include:

- **Description**: Clear description of the bug
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Environment**: Browser, OS, Node.js version, etc.
- **Screenshots**: If applicable
- **Additional Context**: Any other relevant information

### Feature Requests

Use our feature request template and include:

- **Problem Statement**: What problem does this solve?
- **Proposed Solution**: Describe your proposed solution
- **Alternatives**: Alternative solutions considered
- **Use Cases**: How would this feature be used?
- **Priority**: How important is this feature?

## 🔧 Development Workflow

### Branch Naming

- `feature/description`: New features
- `fix/description`: Bug fixes
- `docs/description`: Documentation updates
- `refactor/description`: Code refactoring
- `test/description`: Test improvements

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(audit): add MEV detection analysis
fix(deploy): resolve gas estimation error
docs(api): update authentication guide
test(components): add unit tests for editor
```

## 🎨 Code Style

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer functional programming patterns

### React Components

- Use functional components with hooks
- Follow the component structure:
  ```typescript
  // Imports
  import React from 'react'
  
  // Types
  interface ComponentProps {
    // ...
  }
  
  // Component
  export function Component({ prop }: ComponentProps) {
    // Hooks
    // Event handlers
    // Render
  }
  ```

### File Organization

```
components/
  ui/           # Reusable UI components
  forms/        # Form components
  layout/       # Layout components
lib/
  utils/        # Utility functions
  hooks/        # Custom hooks
  services/     # API services
  types/        # Type definitions
```

### CSS/Styling

- Use Tailwind CSS for styling
- Follow mobile-first responsive design
- Use CSS variables for theming
- Prefer utility classes over custom CSS

## 🧪 Testing

### Testing Strategy

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows
- **API Tests**: Test backend endpoints

### Writing Tests

```typescript
// Unit test example
describe('AnalysisService', () => {
  it('should analyze contract successfully', async () => {
    const service = new AnalysisService()
    const result = await service.analyzeContract(mockRequest)
    
    expect(result.status).toBe('completed')
    expect(result.securityScore).toBeGreaterThan(0)
  })
})

// Component test example
describe('CodeEditor', () => {
  it('should render with initial code', () => {
    render(<CodeEditor initialCode="pragma solidity ^0.8.0;" />)
    
    expect(screen.getByDisplayValue(/pragma solidity/)).toBeInTheDocument()
  })
})
```

### Running Tests

```bash
# All tests
pnpm test

# Unit tests only
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

## 📚 Documentation

### Documentation Types

- **User Guides**: Help users understand features
- **API Documentation**: Technical API reference
- **Developer Docs**: Setup and contribution guides
- **Code Comments**: Inline code documentation

### Writing Guidelines

- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep documentation up-to-date with code changes
- Use proper markdown formatting

### Documentation Structure

```markdown
# Title

Brief description

## Table of Contents

## Section 1
Content with examples

## Section 2
More content

## See Also
Links to related documentation
```

## 🏷️ Labels and Milestones

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `priority/high`: High priority issue
- `priority/medium`: Medium priority issue
- `priority/low`: Low priority issue

### Component Labels

- `component/frontend`: Frontend-related
- `component/backend`: Backend-related
- `component/database`: Database-related
- `component/api`: API-related
- `component/docs`: Documentation-related

## 🎯 Development Priorities

### Current Focus Areas

1. **Security Enhancements**: Improving vulnerability detection
2. **Performance Optimization**: Faster analysis and better UX
3. **Multi-chain Support**: Adding more blockchain networks
4. **Collaboration Features**: Real-time editing improvements
5. **API Expansion**: More comprehensive API endpoints

### Roadmap

Check our [public roadmap](https://github.com/your-org/novaguard/projects) for upcoming features and priorities.

## 🤔 Questions?

- **General Questions**: [Discord Community](https://discord.gg/novaguard)
- **Technical Issues**: [GitHub Issues](https://github.com/your-org/novaguard/issues)
- **Security Concerns**: security@novaguard.app
- **Other Inquiries**: contribute@novaguard.app

## 🙏 Recognition

Contributors are recognized in:

- **README**: Listed in contributors section
- **Release Notes**: Mentioned in release announcements
- **Discord**: Special contributor role
- **Website**: Featured on our contributors page

## 📄 License

By contributing to NovaGuard, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to NovaGuard! Together, we're building the future of smart contract security. 🚀
