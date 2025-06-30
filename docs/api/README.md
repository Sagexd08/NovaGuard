# NovaGuard API Documentation

The NovaGuard API provides programmatic access to our smart contract auditing platform. This RESTful API allows you to integrate NovaGuard's security analysis, gas optimization, and deployment capabilities into your development workflow.

## 🚀 Quick Start

### Authentication

All API requests require authentication using an API key. You can generate API keys from your NovaGuard dashboard.

```bash
curl -H "X-API-Key: your-api-key" \
     -H "Content-Type: application/json" \
     https://api.novaguard.app/v1/audit
```

### Base URL

```
https://api.novaguard.app/v1
```

### Rate Limits

- **Free Tier**: 100 requests per hour
- **Pro Tier**: 1,000 requests per hour  
- **Enterprise**: 10,000 requests per hour

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Request limit per hour
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## 📋 Endpoints

### Audit Endpoints

#### Submit Audit Request

Submit a smart contract for security analysis.

```http
POST /audit
```

**Request Body:**

```json
{
  "contractCode": "pragma solidity ^0.8.0; contract Example { ... }",
  "analysisType": "comprehensive",
  "options": {
    "includeGasAnalysis": true,
    "includeMEVAnalysis": true,
    "severity": "medium",
    "webhookUrl": "https://your-app.com/webhook"
  },
  "metadata": {
    "projectName": "My DeFi Project",
    "version": "1.0.0",
    "tags": ["defi", "token"]
  }
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contractCode` | string | Yes | Solidity contract source code |
| `analysisType` | string | No | `quick`, `security`, `gas`, `comprehensive` (default) |
| `options.includeGasAnalysis` | boolean | No | Include gas optimization analysis |
| `options.includeMEVAnalysis` | boolean | No | Include MEV vulnerability analysis |
| `options.severity` | string | No | Minimum severity level: `low`, `medium`, `high`, `critical` |
| `options.webhookUrl` | string | No | URL to receive completion notification |
| `metadata` | object | No | Additional metadata for the audit |

**Response:**

```json
{
  "auditId": "audit_1234567890_abcdef",
  "status": "queued",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### Get Audit Status

Retrieve the status and results of an audit.

```http
GET /audit/{auditId}
```

**Response:**

```json
{
  "auditId": "audit_1234567890_abcdef",
  "status": "completed",
  "result": {
    "securityScore": 85,
    "gasScore": 92,
    "overallScore": 88,
    "vulnerabilities": [
      {
        "id": "vuln_001",
        "type": "reentrancy",
        "severity": "high",
        "title": "Potential Reentrancy Attack",
        "description": "The withdraw function is vulnerable to reentrancy attacks...",
        "location": {
          "line": 42,
          "column": 8,
          "function": "withdraw"
        },
        "recommendation": "Use the checks-effects-interactions pattern...",
        "cweId": "CWE-362",
        "confidence": 0.95
      }
    ],
    "gasOptimizations": [
      {
        "id": "gas_001",
        "type": "storage_packing",
        "title": "Optimize Storage Layout",
        "description": "Variables can be packed to save gas...",
        "location": {
          "line": 15,
          "function": "constructor"
        },
        "estimatedSavings": 2000,
        "difficulty": "easy",
        "codeExample": "struct OptimizedStruct { uint128 a; uint128 b; }"
      }
    ],
    "recommendations": [
      {
        "id": "rec_001",
        "category": "security",
        "priority": "high",
        "title": "Implement Access Control",
        "description": "Add proper access control mechanisms...",
        "implementation": "Use OpenZeppelin's AccessControl contract..."
      }
    ],
    "summary": "The contract shows good overall security practices...",
    "metadata": {
      "analysisTime": 15420,
      "linesOfCode": 156,
      "complexity": 8,
      "timestamp": "2024-01-15T10:32:30Z"
    }
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "completedAt": "2024-01-15T10:32:30Z"
}
```

#### List Audits

Retrieve a list of your audit requests.

```http
GET /audits?page=1&limit=20&status=completed
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (max: 100, default: 20) |
| `status` | string | Filter by status: `queued`, `processing`, `completed`, `failed` |

**Response:**

```json
{
  "audits": [
    {
      "auditId": "audit_1234567890_abcdef",
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00Z",
      "completedAt": "2024-01-15T10:32:30Z",
      "metadata": {
        "projectName": "My DeFi Project",
        "version": "1.0.0"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Deployment Endpoints

#### Deploy Contract

Deploy a smart contract to one or more blockchain networks.

```http
POST /deploy
```

**Request Body:**

```json
{
  "contractCode": "pragma solidity ^0.8.0; contract Example { ... }",
  "contractName": "MyContract",
  "networks": ["ethereum", "polygon", "arbitrum"],
  "constructorArgs": ["arg1", "arg2"],
  "options": {
    "gasLimit": 3000000,
    "gasPrice": "20000000000",
    "verify": true
  }
}
```

**Response:**

```json
{
  "deploymentId": "deploy_1234567890_abcdef",
  "status": "pending",
  "networks": {
    "ethereum": {
      "status": "pending",
      "transactionHash": null
    },
    "polygon": {
      "status": "pending", 
      "transactionHash": null
    }
  },
  "createdAt": "2024-01-15T11:00:00Z"
}
```

#### Get Deployment Status

Check the status of a contract deployment.

```http
GET /deploy/{deploymentId}
```

### Monitoring Endpoints

#### Add Contract to Monitoring

Start monitoring a deployed contract.

```http
POST /monitor
```

**Request Body:**

```json
{
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "chain": "ethereum",
  "name": "My DeFi Contract",
  "abi": [...],
  "alertRules": [
    {
      "type": "gas_price",
      "threshold": 100,
      "condition": "above"
    },
    {
      "type": "mev_attack",
      "enabled": true
    }
  ]
}
```

#### Get Monitoring Alerts

Retrieve alerts for monitored contracts.

```http
GET /monitor/alerts?contractId=contract_123&limit=50
```

### Usage Statistics

#### Get API Usage

Retrieve your API usage statistics.

```http
GET /usage
```

**Response:**

```json
{
  "totalRequests": 1250,
  "avgRequestsPerDay": 42,
  "dailyUsage": [
    {
      "date": "2024-01-15",
      "requests": 45,
      "credits": 135
    }
  ],
  "rateLimit": {
    "limit": 1000,
    "remaining": 856,
    "resetTime": "2024-01-15T12:00:00Z"
  }
}
```

## 🔧 SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @novaguard/sdk
```

```typescript
import { NovaGuardClient } from '@novaguard/sdk'

const client = new NovaGuardClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.novaguard.app/v1'
})

// Submit audit
const audit = await client.audit.submit({
  contractCode: contractSource,
  analysisType: 'comprehensive'
})

// Get results
const results = await client.audit.get(audit.auditId)
```

### Python

```bash
pip install novaguard-python
```

```python
from novaguard import NovaGuardClient

client = NovaGuardClient(api_key='your-api-key')

# Submit audit
audit = client.audit.submit(
    contract_code=contract_source,
    analysis_type='comprehensive'
)

# Get results
results = client.audit.get(audit['auditId'])
```

### Go

```bash
go get github.com/novaguard/go-sdk
```

```go
package main

import (
    "github.com/novaguard/go-sdk"
)

func main() {
    client := novaguard.NewClient("your-api-key")
    
    audit, err := client.Audit.Submit(&novaguard.AuditRequest{
        ContractCode: contractSource,
        AnalysisType: "comprehensive",
    })
    
    results, err := client.Audit.Get(audit.AuditID)
}
```

## 🔒 Security

### API Key Management

- Store API keys securely (environment variables, secret managers)
- Rotate keys regularly
- Use different keys for different environments
- Monitor key usage in the dashboard

### Request Signing

For enhanced security, you can sign requests using HMAC:

```javascript
const crypto = require('crypto')

function signRequest(method, path, body, timestamp, secret) {
  const payload = `${method}${path}${body}${timestamp}`
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

// Add headers
const timestamp = Date.now().toString()
const signature = signRequest('POST', '/audit', JSON.stringify(body), timestamp, apiSecret)

headers['X-Timestamp'] = timestamp
headers['X-Signature'] = signature
```

## 📊 Webhooks

Configure webhooks to receive real-time notifications about audit completions, deployment status, and monitoring alerts.

### Webhook Events

- `audit.completed`: Audit analysis finished
- `audit.failed`: Audit analysis failed
- `deployment.completed`: Contract deployment finished
- `deployment.failed`: Contract deployment failed
- `monitor.alert`: Monitoring alert triggered

### Webhook Payload

```json
{
  "event": "audit.completed",
  "timestamp": "2024-01-15T10:32:30Z",
  "data": {
    "auditId": "audit_1234567890_abcdef",
    "status": "completed",
    "result": { ... }
  }
}
```

### Webhook Security

Verify webhook authenticity using the signature header:

```javascript
const crypto = require('crypto')

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

## 🚨 Error Handling

### HTTP Status Codes

- `200`: Success
- `202`: Accepted (async operation started)
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (invalid API key)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_CONTRACT_CODE",
    "message": "The provided contract code contains syntax errors",
    "details": {
      "line": 15,
      "column": 8,
      "description": "Expected ';' after variable declaration"
    }
  }
}
```

## 📞 Support

- **API Documentation**: [docs.novaguard.app/api](https://docs.novaguard.app/api)
- **Discord Community**: [discord.gg/novaguard](https://discord.gg/novaguard)
- **Email Support**: api-support@novaguard.app
- **Status Page**: [status.novaguard.app](https://status.novaguard.app)
