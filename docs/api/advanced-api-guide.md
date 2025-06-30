# NovaGuard Advanced API Guide

## 🚀 Overview

The NovaGuard API provides comprehensive smart contract security analysis, multi-chain deployment, and real-time monitoring capabilities. This guide covers advanced features, best practices, and integration patterns.

## 📋 Table of Contents

- [Authentication & Security](#authentication--security)
- [Advanced Analysis Features](#advanced-analysis-features)
- [Multi-Chain Deployment](#multi-chain-deployment)
- [Real-Time Monitoring](#real-time-monitoring)
- [Collaboration Features](#collaboration-features)
- [Webhook Integration](#webhook-integration)
- [SDK Examples](#sdk-examples)
- [Performance Optimization](#performance-optimization)

## 🔐 Authentication & Security

### API Key Management

```typescript
// Generate API key with specific scopes
POST /api/v1/auth/keys
{
  "name": "CI/CD Pipeline Key",
  "scopes": ["read", "analyze", "deploy"],
  "expiresAt": "2024-12-31T23:59:59Z",
  "ipWhitelist": ["192.168.1.0/24"]
}
```

### JWT Token Authentication

```typescript
// For user-based authentication
POST /api/v1/auth/login
{
  "email": "developer@company.com",
  "password": "secure_password",
  "mfa_code": "123456"
}

// Response includes JWT token
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600,
  "user": {
    "id": "user_123",
    "email": "developer@company.com",
    "plan": "pro"
  }
}
```

### Rate Limiting & Quotas

```typescript
// Check current usage
GET /api/v1/usage/current

{
  "plan": "pro",
  "period": "monthly",
  "usage": {
    "analyses": { "used": 45, "limit": 1000 },
    "deployments": { "used": 12, "limit": 100 },
    "api_calls": { "used": 2340, "limit": 50000 }
  },
  "reset_date": "2024-02-01T00:00:00Z"
}
```

## 🔍 Advanced Analysis Features

### Custom Analysis Configuration

```typescript
POST /api/v1/projects/{projectId}/analyze
{
  "config": {
    "analysis_depth": "comprehensive",
    "enabled_detectors": [
      "reentrancy",
      "access_control",
      "arithmetic_overflow",
      "unchecked_calls",
      "timestamp_dependence",
      "tx_origin_usage",
      "delegatecall_injection",
      "uninitialized_storage"
    ],
    "custom_rules": [
      {
        "name": "Custom Reentrancy Check",
        "pattern": "call\\{value:",
        "severity": "high",
        "message": "Potential reentrancy vulnerability"
      }
    ],
    "gas_optimization": {
      "enabled": true,
      "target_networks": ["ethereum", "polygon"],
      "optimization_level": "aggressive"
    },
    "compliance_checks": {
      "erc_standards": ["ERC20", "ERC721", "ERC1155"],
      "security_standards": ["SWC", "OWASP"]
    },
    "timeout": 600,
    "parallel_analysis": true
  }
}
```

### AI-Powered Analysis

```typescript
POST /api/v1/projects/{projectId}/ai-analysis
{
  "model": "novaguard-v2",
  "analysis_type": "security_focused",
  "context": {
    "project_type": "defi_protocol",
    "business_logic": "Automated market maker with yield farming",
    "risk_tolerance": "low"
  },
  "include_recommendations": true,
  "generate_test_cases": true
}
```

### Comparative Analysis

```typescript
POST /api/v1/analysis/compare
{
  "baseline_analysis_id": "analysis_123",
  "target_analysis_id": "analysis_456",
  "comparison_type": "security_regression",
  "include_gas_comparison": true
}
```

## 🌐 Multi-Chain Deployment

### Supported Networks

```typescript
GET /api/v1/networks

{
  "networks": [
    {
      "id": "ethereum",
      "name": "Ethereum Mainnet",
      "chain_id": 1,
      "type": "mainnet",
      "status": "active",
      "gas_estimation": "dynamic",
      "deployment_cost_usd": 45.20,
      "avg_confirmation_time": 120
    },
    {
      "id": "polygon",
      "name": "Polygon",
      "chain_id": 137,
      "type": "layer2",
      "status": "active",
      "gas_estimation": "fast",
      "deployment_cost_usd": 0.05,
      "avg_confirmation_time": 30
    },
    // ... 20+ more networks
  ]
}
```

### Advanced Deployment Configuration

```typescript
POST /api/v1/projects/{projectId}/deploy
{
  "network_id": "ethereum",
  "deployment_config": {
    "gas_strategy": "optimal", // "fast", "standard", "optimal"
    "gas_limit": "auto", // or specific number
    "gas_price": "auto", // or specific price in wei
    "max_fee_per_gas": "auto", // EIP-1559
    "max_priority_fee_per_gas": "auto", // EIP-1559
    "nonce": "auto",
    "confirmations": 2
  },
  "constructor_args": [
    {
      "type": "string",
      "value": "MyToken"
    },
    {
      "type": "string", 
      "value": "MTK"
    },
    {
      "type": "uint256",
      "value": "1000000000000000000000000"
    }
  ],
  "verification": {
    "enabled": true,
    "source_code": true,
    "compiler_version": "0.8.19",
    "optimization": true,
    "optimization_runs": 200
  },
  "monitoring": {
    "enabled": true,
    "alert_thresholds": {
      "unusual_activity": 0.8,
      "gas_price_spike": 2.0,
      "large_transactions": "1000000000000000000"
    }
  }
}
```

### Multi-Chain Deployment

```typescript
POST /api/v1/projects/{projectId}/deploy-multi
{
  "networks": ["ethereum", "polygon", "arbitrum", "optimism"],
  "deployment_strategy": "sequential", // "parallel", "sequential"
  "shared_config": {
    "verification": true,
    "monitoring": true
  },
  "network_specific": {
    "ethereum": {
      "gas_strategy": "optimal",
      "confirmations": 2
    },
    "polygon": {
      "gas_strategy": "fast",
      "confirmations": 1
    }
  },
  "rollback_on_failure": true
}
```

## 📊 Real-Time Monitoring

### Enable Contract Monitoring

```typescript
POST /api/v1/deployments/{deploymentId}/monitoring
{
  "monitoring_config": {
    "security_monitoring": {
      "enabled": true,
      "check_interval": 300, // seconds
      "alert_on": [
        "reentrancy_attempts",
        "unusual_gas_usage",
        "large_value_transfers",
        "admin_function_calls",
        "emergency_stops"
      ]
    },
    "performance_monitoring": {
      "enabled": true,
      "metrics": [
        "transaction_count",
        "gas_usage_trends",
        "error_rates",
        "response_times"
      ]
    },
    "financial_monitoring": {
      "enabled": true,
      "track_balances": true,
      "alert_thresholds": {
        "balance_change": "10000000000000000000", // 10 ETH
        "daily_volume": "100000000000000000000" // 100 ETH
      }
    }
  }
}
```

### Real-Time Alerts

```typescript
// WebSocket connection for real-time alerts
const ws = new WebSocket('wss://api.novaguard.app/v1/monitoring/stream');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: [
      `deployment:${deploymentId}`,
      `project:${projectId}`,
      'global_alerts'
    ],
    auth_token: 'your_jwt_token'
  }));
};

ws.onmessage = (event) => {
  const alert = JSON.parse(event.data);
  
  switch (alert.type) {
    case 'security_alert':
      handleSecurityAlert(alert);
      break;
    case 'performance_alert':
      handlePerformanceAlert(alert);
      break;
    case 'financial_alert':
      handleFinancialAlert(alert);
      break;
  }
};
```

## 👥 Collaboration Features

### Real-Time Code Collaboration

```typescript
// Join collaboration session
POST /api/v1/projects/{projectId}/collaborate
{
  "session_type": "code_review",
  "participants": ["user_123", "user_456"],
  "permissions": {
    "edit": true,
    "comment": true,
    "analyze": true
  }
}

// Real-time events
WebSocket events:
- cursor_move: { user_id, line, column }
- code_change: { user_id, changes, timestamp }
- comment_add: { user_id, line, comment, timestamp }
- analysis_request: { user_id, config }
```

### Code Review Workflow

```typescript
POST /api/v1/projects/{projectId}/reviews
{
  "title": "Security Review - Token Contract",
  "description": "Pre-deployment security review",
  "reviewers": ["security_expert_123", "lead_dev_456"],
  "checklist": [
    "Access control verification",
    "Reentrancy protection",
    "Gas optimization review",
    "Test coverage validation"
  ],
  "deadline": "2024-02-15T18:00:00Z"
}
```

## 🔗 Webhook Integration

### Webhook Configuration

```typescript
POST /api/v1/webhooks
{
  "url": "https://your-app.com/webhooks/novaguard",
  "events": [
    "analysis.completed",
    "deployment.confirmed",
    "monitoring.alert",
    "review.completed"
  ],
  "secret": "webhook_secret_key",
  "retry_config": {
    "max_retries": 3,
    "retry_delay": 5000,
    "exponential_backoff": true
  }
}
```

### Webhook Event Examples

```typescript
// Analysis completed webhook
{
  "event": "analysis.completed",
  "timestamp": "2024-01-15T14:30:00Z",
  "data": {
    "project_id": "proj_123",
    "analysis_id": "analysis_456",
    "security_score": 85,
    "vulnerabilities_found": 2,
    "gas_score": 92,
    "status": "completed"
  }
}

// Deployment confirmed webhook
{
  "event": "deployment.confirmed",
  "timestamp": "2024-01-15T15:45:00Z",
  "data": {
    "deployment_id": "deploy_789",
    "network": "polygon",
    "contract_address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "transaction_hash": "0x...",
    "gas_used": 2847392,
    "deployment_cost_usd": 0.05
  }
}

// Security alert webhook
{
  "event": "monitoring.alert",
  "timestamp": "2024-01-15T16:20:00Z",
  "data": {
    "alert_id": "alert_321",
    "deployment_id": "deploy_789",
    "severity": "high",
    "type": "unusual_activity",
    "description": "Detected potential reentrancy attempt",
    "transaction_hash": "0x...",
    "recommended_action": "investigate_immediately"
  }
}
```

## 📚 SDK Examples

### TypeScript SDK

```typescript
import { NovaGuard, AnalysisConfig } from '@novaguard/sdk';

const client = new NovaGuard({
  apiKey: process.env.NOVAGUARD_API_KEY,
  environment: 'production' // 'development', 'staging', 'production'
});

// Advanced analysis with custom configuration
const analysisConfig: AnalysisConfig = {
  depth: 'comprehensive',
  enabledDetectors: ['all'],
  gasOptimization: {
    enabled: true,
    targetNetworks: ['ethereum', 'polygon'],
    optimizationLevel: 'aggressive'
  },
  customRules: [
    {
      name: 'Custom Access Control',
      pattern: 'onlyOwner',
      severity: 'medium',
      message: 'Verify access control implementation'
    }
  ]
};

const analysis = await client.projects.analyze(projectId, analysisConfig);

// Multi-chain deployment
const deployment = await client.projects.deployMultiChain(projectId, {
  networks: ['ethereum', 'polygon', 'arbitrum'],
  strategy: 'sequential',
  verification: true,
  monitoring: true
});

// Real-time monitoring
const monitor = client.monitoring.create(deployment.id);
monitor.on('alert', (alert) => {
  console.log(`Security alert: ${alert.type}`);
  // Handle alert
});
```

### Python SDK

```python
from novaguard import NovaGuard, AnalysisConfig, DeploymentConfig

client = NovaGuard(api_key=os.getenv('NOVAGUARD_API_KEY'))

# Comprehensive analysis
analysis_config = AnalysisConfig(
    depth='comprehensive',
    enabled_detectors=['all'],
    gas_optimization=True,
    custom_rules=[
        {
            'name': 'Custom Reentrancy Check',
            'pattern': r'call\{value:',
            'severity': 'high'
        }
    ]
)

analysis = client.projects.analyze(project_id, analysis_config)

# Deployment with monitoring
deployment_config = DeploymentConfig(
    network='polygon',
    gas_strategy='optimal',
    verification=True,
    monitoring={
        'security_alerts': True,
        'performance_tracking': True
    }
)

deployment = client.projects.deploy(project_id, deployment_config)

# Wait for deployment completion
deployment.wait_for_completion(timeout=300)
print(f"Contract deployed at: {deployment.contract_address}")
```

## ⚡ Performance Optimization

### Batch Operations

```typescript
// Batch analysis for multiple contracts
POST /api/v1/analysis/batch
{
  "analyses": [
    {
      "project_id": "proj_123",
      "config": { "depth": "security" }
    },
    {
      "project_id": "proj_456", 
      "config": { "depth": "gas" }
    }
  ],
  "parallel_execution": true,
  "priority": "high"
}
```

### Caching and Optimization

```typescript
// Enable analysis caching
POST /api/v1/projects/{projectId}/analyze
{
  "config": {
    "cache_enabled": true,
    "cache_ttl": 3600, // 1 hour
    "incremental_analysis": true // Only analyze changed code
  }
}
```

### Async Operations

```typescript
// Long-running operations with polling
const operation = await client.projects.analyzeAsync(projectId, config);

// Poll for completion
const result = await operation.poll({
  interval: 5000, // 5 seconds
  timeout: 300000 // 5 minutes
});
```

---

**API Version**: v1  
**Last Updated**: January 2024  
**Support**: [support@novaguard.app](mailto:support@novaguard.app)
