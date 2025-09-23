# 🔢 ManagerAgentAI API Versioning Guide v2.4

Complete API versioning system supporting multiple versioning strategies, migration management, and comprehensive documentation.

## 🎯 Overview

This guide covers the implementation of a comprehensive API versioning system for ManagerAgentAI, providing:
- **Multiple Versioning Strategies** - Header, path, query, and Accept header versioning
- **Version Management** - Easy addition, removal, and deprecation of API versions
- **Migration Support** - Automated migration guides and breaking change tracking
- **Documentation Generation** - Automatic API documentation for all versions
- **Validation and Testing** - Comprehensive validation and testing tools

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │───▶│   Version       │───▶│   API           │
│                 │    │   Manager       │    │   Endpoints     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Version       │    │   Migration     │    │   Documentation │
│   Detection     │    │   Management    │    │   Generation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Prerequisites

```powershell
# Check Node.js installation
node --version

# Check if API versioning is initialized
Test-Path "api-versioning\config.json"
```

### 2. Initialize API Versioning

```powershell
# Initialize API versioning system
.\scripts\api-versioning-manager.ps1 -Action init

# List available versions
.\scripts\api-versioning-manager.ps1 -Action list-versions

# Generate documentation
.\scripts\api-versioning-manager.ps1 -Action docs
```

### 3. Use in Your Application

```javascript
const VersionManager = require('./api-versioning/version-manager');
const v1Config = require('./api-versioning/versions/v1');
const v2Config = require('./api-versioning/versions/v2');

// Initialize version manager
const versionManager = new VersionManager({
    defaultVersion: 'v1',
    supportedVersions: ['v1', 'v2'],
    versioningStrategy: 'header'
});

// Register versions
versionManager.registerVersion('v1', v1Config);
versionManager.registerVersion('v2', v2Config);

// Use middleware
app.use(versionManager.middleware);
```

## 📋 Version Management

### Adding New Versions

```powershell
# Add new version
.\scripts\api-versioning-manager.ps1 -Action add-version -Version "v3"

# Validate version
.\scripts\api-versioning-manager.ps1 -Action validate -Version "v3"

# Generate documentation
.\scripts\api-versioning-manager.ps1 -Action docs
```

### Managing Existing Versions

```powershell
# List all versions
.\scripts\api-versioning-manager.ps1 -Action list-versions

# Deprecate version
.\scripts\api-versioning-manager.ps1 -Action deprecate -Version "v1" -DeprecationDate "2025-06-01"

# Set sunset date
.\scripts\api-versioning-manager.ps1 -Action sunset -Version "v1" -SunsetDate "2025-12-31"

# Remove version
.\scripts\api-versioning-manager.ps1 -Action remove-version -Version "v1"
```

### Migration Management

```powershell
# Create migration guide
.\scripts\api-versioning-manager.ps1 -Action migrate -FromVersion "v1" -ToVersion "v2"

# Test versioning
.\scripts\api-versioning-manager.ps1 -Action test
```

## 🔧 Versioning Strategies

### 1. Header Versioning

```javascript
// Client request
fetch('/api/projects', {
    headers: {
        'api-version': 'v2',
        'Authorization': 'Bearer token'
    }
});

// Server configuration
const versionManager = new VersionManager({
    versioningStrategy: 'header'
});
```

### 2. Path Versioning

```javascript
// Client request
fetch('/api/v2/projects');

// Server configuration
const versionManager = new VersionManager({
    versioningStrategy: 'path'
});
```

### 3. Query Parameter Versioning

```javascript
// Client request
fetch('/api/projects?version=v2');

// Server configuration
const versionManager = new VersionManager({
    versioningStrategy: 'query'
});
```

### 4. Accept Header Versioning

```javascript
// Client request
fetch('/api/projects', {
    headers: {
        'Accept': 'application/json; version=2'
    }
});

// Server configuration
const versionManager = new VersionManager({
    versioningStrategy: 'accept'
});
```

## 📊 Version Configuration

### Version Structure

```javascript
const versionConfig = {
    version: 'v2',
    description: 'Enhanced API version with new features',
    baseUrl: '/api/v2',
    deprecationDate: null,
    sunsetDate: null,
    migrationGuide: {
        v1: [
            'Update API version header to v2',
            'Replace /api/v1 with /api/v2 in all requests',
            'Update response format to include new fields'
        ]
    },
    breakingChanges: {
        v1: [
            'Response format changed',
            'New required fields added'
        ]
    },
    changelog: [
        {
            version: '2.0.0',
            date: '2025-01-31',
            changes: [
                'Enhanced project management',
                'New analytics endpoints',
                'Improved error handling'
            ]
        }
    ],
    endpoints: {
        '/projects': {
            methods: ['GET', 'POST'],
            description: 'Project management endpoints',
            schema: {
                required: ['name'],
                properties: {
                    name: { type: 'string', minLength: 1 },
                    description: { type: 'string' },
                    type: { type: 'string', enum: ['web', 'mobile', 'desktop'] }
                }
            },
            examples: {
                GET: {
                    description: 'List all projects',
                    response: {
                        status: 200,
                        body: {
                            projects: [],
                            total: 0,
                            page: 1,
                            limit: 10
                        }
                    }
                }
            }
        }
    },
    middleware: [
        // Version-specific middleware
        (req, res, next) => {
            console.log(`Processing request for version ${req.apiVersion}`);
            next();
        }
    ],
    schemas: {
        Project: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' }
            },
            required: ['id', 'name', 'createdAt']
        }
    }
};
```

## 🔒 Security Features

### Version Validation

```javascript
// Automatic version validation
const versionManager = new VersionManager({
    supportedVersions: ['v1', 'v2'],
    deprecatedVersions: ['v1']
});

// Check if version is supported
if (!versionManager.isVersionSupported(version)) {
    return res.status(400).json({
        error: 'Unsupported Version',
        message: `Version ${version} is not supported`,
        supportedVersions: versionManager.supportedVersions
    });
}
```

### Deprecation Warnings

```javascript
// Automatic deprecation warnings
if (versionManager.isVersionDeprecated(version)) {
    res.set('X-API-Version-Deprecated', 'true');
    res.set('Warning', '299 - "API version is deprecated"');
}
```

### Sunset Handling

```javascript
// Automatic sunset handling
if (versionConfig.sunsetDate && new Date() > new Date(versionConfig.sunsetDate)) {
    return res.status(410).json({
        error: 'Gone',
        message: 'API version has been sunset',
        supportedVersions: versionManager.supportedVersions
    });
}
```

## 📈 Performance Optimization

### Caching

```javascript
// Version-specific caching
const cacheKey = `api:${version}:${endpoint}`;
const cached = cache.get(cacheKey);
if (cached) {
    return res.json(cached);
}
```

### Middleware Optimization

```javascript
// Optimized middleware chain
const versionMiddleware = versionManager.middleware;
const endpointMiddleware = versionConfig.middleware;

// Combine middleware efficiently
app.use('/api', versionMiddleware, endpointMiddleware);
```

### Request Validation

```javascript
// Efficient request validation
const validation = versionManager.validateRequest(req, endpoint, version);
if (!validation.valid) {
    return res.status(400).json({
        error: 'Validation Error',
        details: validation.errors
    });
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Version Not Found**
   ```powershell
   # Check if version exists
   .\scripts\api-versioning-manager.ps1 -Action list-versions
   
   # Validate version configuration
   .\scripts\api-versioning-manager.ps1 -Action validate -Version "v2"
   ```

2. **Migration Issues**
   ```powershell
   # Create migration guide
   .\scripts\api-versioning-manager.ps1 -Action migrate -FromVersion "v1" -ToVersion "v2"
   
   # Check breaking changes
   cat "api-versioning\migrations\v1-to-v2.js"
   ```

3. **Documentation Issues**
   ```powershell
   # Regenerate documentation
   .\scripts\api-versioning-manager.ps1 -Action docs
   
   # Check generated docs
   Get-ChildItem "api-versioning\docs\"
   ```

4. **Testing Issues**
   ```powershell
   # Run versioning tests
   .\scripts\api-versioning-manager.ps1 -Action test
   
   # Check test results
   cat "api-versioning\test-results.log"
   ```

### Debug Commands

```powershell
# Check version manager status
.\scripts\api-versioning-manager.ps1 -Action list-versions

# Validate specific version
.\scripts\api-versioning-manager.ps1 -Action validate -Version "v2"

# Test versioning functionality
.\scripts\api-versioning-manager.ps1 -Action test

# Generate documentation
.\scripts\api-versioning-manager.ps1 -Action docs
```

## 🔄 CI/CD Integration

### Automated Version Management

```yaml
# GitHub Actions workflow
name: API Versioning
on:
  push:
    branches: [main]
    paths: ['api-versioning/**']

jobs:
  versioning:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Validate versions
        run: |
          .\scripts\api-versioning-manager.ps1 -Action validate -Version "v1"
          .\scripts\api-versioning-manager.ps1 -Action validate -Version "v2"
      - name: Run tests
        run: .\scripts\api-versioning-manager.ps1 -Action test
      - name: Generate docs
        run: .\scripts\api-versioning-manager.ps1 -Action docs
```

### Version Deployment

```yaml
# Deploy specific version
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway-v2
spec:
  template:
    spec:
      containers:
      - name: api-gateway
        image: manager-agent-ai/api-gateway:v2.4.0
        env:
        - name: API_VERSION
          value: "v2"
        - name: VERSIONING_STRATEGY
          value: "header"
```

## 📚 Best Practices

### Version Design

1. **Semantic Versioning** - Use semantic versioning for API versions
2. **Backward Compatibility** - Maintain backward compatibility when possible
3. **Clear Migration Paths** - Provide clear migration guides
4. **Deprecation Timeline** - Give adequate notice for deprecations
5. **Sunset Planning** - Plan sunset dates well in advance

### Documentation

1. **Comprehensive Changelogs** - Document all changes
2. **Migration Guides** - Provide step-by-step migration instructions
3. **Breaking Changes** - Clearly document breaking changes
4. **Examples** - Include practical examples for each endpoint
5. **Schema Documentation** - Document all request/response schemas

### Testing

1. **Version Testing** - Test all supported versions
2. **Migration Testing** - Test migration scenarios
3. **Backward Compatibility** - Test backward compatibility
4. **Performance Testing** - Test version-specific performance
5. **Security Testing** - Test version-specific security features

## 🎉 Success Metrics

### Version Adoption

- **Version Distribution** - Track usage of each version
- **Migration Success Rate** - Measure successful migrations
- **Deprecation Compliance** - Track deprecation warnings
- **Sunset Compliance** - Monitor sunset date compliance

### Performance Metrics

- **Response Time** - Version-specific response times
- **Error Rate** - Version-specific error rates
- **Throughput** - Version-specific throughput
- **Cache Hit Rate** - Version-specific cache performance

### Developer Experience

- **Documentation Quality** - Developer feedback on documentation
- **Migration Ease** - Time to complete migrations
- **Error Clarity** - Clarity of version-related errors
- **Support Requests** - Version-related support requests

---

**ManagerAgentAI API Versioning v2.4** - Complete API versioning solution for scalable, maintainable, and developer-friendly APIs.
