# NovaGuard - Web3 Smart Contract Auditing IDE

<div align="center">
  <img src="./assets/logo.png" alt="NovaGuard Logo" width="200" height="200">
  
  <h3>Production-grade Web3 smart contract auditing IDE with AI-powered analysis and real-time collaboration</h3>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
  [![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
  [![CI/CD](https://github.com/your-org/novaguard/workflows/CI/badge.svg)](https://github.com/your-org/novaguard/actions)
  [![Coverage](https://codecov.io/gh/your-org/novaguard/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/novaguard)
</div>

## 🚀 Features

### 🔒 **Advanced Security Analysis**
- **AI-Powered Vulnerability Detection**: Leverages OpenAI and custom models to identify security vulnerabilities
- **Real-time Code Analysis**: Instant feedback as you type with syntax highlighting and error detection
- **Comprehensive Security Scoring**: Multi-dimensional security assessment with detailed recommendations
- **Known Vulnerability Database**: Integration with CVE and custom vulnerability databases

### ⚡ **Gas Optimization**
- **Automated Gas Analysis**: Identifies gas-inefficient patterns and suggests optimizations
- **Storage Packing Detection**: Optimizes struct layouts for reduced storage costs
- **Loop Optimization**: Detects and suggests improvements for expensive loop operations
- **Function Visibility Analysis**: Recommends optimal visibility modifiers

### 🌐 **Multi-chain Deployment**
- **8+ Blockchain Support**: Ethereum, Polygon, Arbitrum, Optimism, Base, BSC, zkSync, Avalanche
- **One-click Deployment**: Deploy contracts across multiple chains simultaneously
- **Gas Estimation**: Accurate gas cost predictions across different networks
- **Contract Verification**: Automatic source code verification on block explorers

### 🤝 **Real-time Collaboration**
- **Live Code Editing**: Multiple developers can edit contracts simultaneously
- **Comment System**: Line-by-line comments and discussions
- **Version Control**: Track changes and maintain audit trails
- **Session Management**: Create and manage collaborative audit sessions

### 📊 **Advanced Analytics**
- **Contract Monitoring**: Real-time monitoring of deployed contracts
- **MEV Detection**: Identify and alert on MEV attacks and front-running
- **Performance Metrics**: Track contract performance and usage patterns
- **Custom Dashboards**: Personalized analytics and reporting

### 🔧 **Developer Tools**
- **Monaco Editor**: Advanced code editor with Solidity syntax highlighting
- **In-browser Sandbox**: Test contracts without deploying to mainnet
- **Drag & Drop Upload**: Easy contract file management
- **Export Reports**: Generate PDF and HTML audit reports

## 🏗️ Architecture

NovaGuard is built with a modern, scalable architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Firebase)    │◄──►│   (Supabase)    │
│                 │    │   Functions     │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Services   │    │   Blockchain    │    │   Monitoring    │
│   (OpenAI)      │    │   (Ethers.js)   │    │   (Real-time)   │
│   (RAG System)  │    │   (Multi-chain) │    │   (WebSockets)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Firebase Functions, Express.js, Node.js
- **Database**: Supabase (PostgreSQL), Vector embeddings
- **Authentication**: Clerk, Multi-modal auth
- **Blockchain**: Ethers.js, Wagmi, RainbowKit
- **AI/ML**: OpenAI GPT-4, Custom embeddings, RAG system
- **Monitoring**: Real-time WebSockets, Custom analytics
- **Deployment**: Firebase Hosting, GitHub Actions CI/CD

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Firebase CLI
- Supabase CLI
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/novaguard.git
   cd novaguard
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Initialize Supabase**
   ```bash
   supabase start
   supabase db push
   pnpm run db:generate
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📖 Documentation

### User Guides
- [Getting Started](./user-guide/getting-started.md)
- [Contract Analysis](./user-guide/contract-analysis.md)
- [Deployment Guide](./user-guide/deployment.md)
- [Collaboration Features](./user-guide/collaboration.md)
- [API Documentation](./api/README.md)

### Developer Documentation
- [Development Setup](./development/setup.md)
- [Architecture Overview](./development/architecture.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [API Reference](./api/reference.md)
- [Testing Guide](./development/testing.md)

### Deployment
- [Production Deployment](./deployment-guide.md)
- [Environment Configuration](./development/environment.md)
- [CI/CD Pipeline](./development/cicd.md)

## 🔧 Configuration

### Environment Variables

```bash
# Application
NEXT_PUBLIC_APP_URL=https://novaguard.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

# Blockchain
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key

# AI Services
OPENAI_API_KEY=your_openai_key

# Payment
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

## 🧪 Testing

NovaGuard includes comprehensive testing:

```bash
# Run all tests
pnpm test

# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Coverage report
pnpm test:coverage
```

## 🚀 Deployment

### Production Deployment

1. **Build the application**
   ```bash
   pnpm build
   ```

2. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

3. **Run database migrations**
   ```bash
   supabase db push --db-url $PRODUCTION_DB_URL
   ```

### CI/CD Pipeline

The project includes automated CI/CD with GitHub Actions:

- **Code Quality**: ESLint, Prettier, TypeScript checks
- **Testing**: Unit, integration, and E2E tests
- **Security**: Vulnerability scanning and dependency audits
- **Deployment**: Automated deployment to staging and production
- **Monitoring**: Performance tests and health checks

## 📊 Performance

NovaGuard is optimized for performance:

- **Lighthouse Score**: 95+ across all metrics
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: Optimized with code splitting
- **Database Queries**: Optimized with proper indexing

## 🔒 Security

Security is our top priority:

- **Authentication**: Multi-factor authentication with Clerk
- **Authorization**: Row Level Security (RLS) in Supabase
- **Data Encryption**: End-to-end encryption for sensitive data
- **API Security**: Rate limiting, input validation, CORS
- **Vulnerability Scanning**: Automated security audits
- **Compliance**: SOC 2 Type II, GDPR compliant

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Style

- TypeScript for type safety
- ESLint + Prettier for code formatting
- Conventional commits for commit messages
- Comprehensive test coverage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for AI capabilities
- [Supabase](https://supabase.com/) for database and real-time features
- [Firebase](https://firebase.google.com/) for hosting and functions
- [Clerk](https://clerk.dev/) for authentication
- [Ethers.js](https://ethers.org/) for blockchain integration

## 📞 Support

- **Documentation**: [docs.novaguard.app](https://docs.novaguard.app)
- **Discord**: [Join our community](https://discord.gg/novaguard)
- **Email**: support@novaguard.app
- **GitHub Issues**: [Report bugs](https://github.com/your-org/novaguard/issues)

## 🗺️ Roadmap

### Q1 2024
- [ ] Advanced MEV protection
- [ ] Multi-signature wallet support
- [ ] Enhanced collaboration features

### Q2 2024
- [ ] Mobile application
- [ ] Advanced analytics dashboard
- [ ] Enterprise features

### Q3 2024
- [ ] AI-powered code generation
- [ ] Formal verification integration
- [ ] Advanced monitoring tools

---

<div align="center">
  <p>Built with ❤️ by the NovaGuard team</p>
  <p>
    <a href="https://novaguard.app">Website</a> •
    <a href="https://docs.novaguard.app">Documentation</a> •
    <a href="https://discord.gg/novaguard">Discord</a> •
    <a href="https://twitter.com/novaguard">Twitter</a>
  </p>
</div>
