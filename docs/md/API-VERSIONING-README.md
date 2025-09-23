# API Versioning System v2.4

## Overview

The API Versioning System provides comprehensive version management for ManagerAgentAI microservices, supporting multiple versioning strategies, migration management, and lifecycle control.

## Architecture

### Core Components

- **API Versioning Service** (`api-versioning/`): Central service managing API versions
- **Version Manager** (`version-manager.js`): Core versioning logic and middleware
- **Management Script** (`scripts/api-versioning-manager.ps1`): PowerShell automation
- **Documentation** (`api-versioning/documentation/`): Auto-generated API docs
- **Backups** (`api-versioning/backups/`): Configuration backups

### Versioning Strategies

1. **Header-based**: `X-API-Version: v2`
2. **Path-based**: `/api/v2/tasks`
3. **Query-based**: `/api/tasks?version=v2`
4. **Accept-header**: `Accept: application/vnd.api+json;version=2`

## Quick Start

### 1. Start the Service

```powershell
# Start API versioning service
.\scripts\api-versioning-manager.ps1 -Action start

# Check status
.\scripts\api-versioning-manager.ps1 -Action status
```

### 2. Test Versions

```powershell
# Test all versions
.\scripts\api-versioning-manager.ps1 -Action test

# Test specific version
.\scripts\api-versioning-manager.ps1 -Action test -Version v2
```

### 3. Generate Documentation

```powershell
# Generate API documentation
.\scripts\api-versioning-manager.ps1 -Action documentation
```

## Management Commands

### Service Management

```powershell
# Start service
.\scripts\api-versioning-manager.ps1 -Action start

# Stop service
.\scripts\api-versioning-manager.ps1 -Action stop

# Restart service
.\scripts\api-versioning-manager.ps1 -Action restart

# Check status
.\scripts\api-versioning-manager.ps1 -Action status
```

### Version Management

```powershell
# Deploy new version
.\scripts\api-versioning-manager.ps1 -Action deploy -TargetVersion v3

# Rollback to previous version
.\scripts\api-versioning-manager.ps1 -Action rollback -TargetVersion v2

# Deprecate version
.\scripts\api-versioning-manager.ps1 -Action deprecate -TargetVersion v1

# Sunset version
.\scripts\api-versioning-manager.ps1 -Action sunset -TargetVersion v1
```

### Migration and Analytics

```powershell
# Get migration guide
.\scripts\api-versioning-manager.ps1 -Action migrate -Version v1 -TargetVersion v2

# Get analytics
.\scripts\api-versioning-manager.ps1 -Action analytics

# Validate configuration
.\scripts\api-versioning-manager.ps1 -Action validate
```

### Backup and Restore

```powershell
# Backup configuration
.\scripts\api-versioning-manager.ps1 -Action backup

# Restore from backup
.\scripts\api-versioning-manager.ps1 -Action restore -Service "api-versioning/backups/versioning-backup-20240905-100000.json"
```

## Configuration

### Version Registration

```javascript
// Register new version
versionManager.registerVersion('v3', {
    description: 'Advanced AI Features API version',
    baseUrl: '/api/v3',
    endpoints: {
        '/tasks/ai-recommendations': {
            methods: ['GET'],
            description: 'AI-powered task recommendations'
        }
    },
    changelog: [
        'Added AI-powered code analysis',
        'Implemented real-time updates'
    ]
});
```

### Deprecation Management

```javascript
// Set deprecation dates
versionManager.deprecateVersion('v1', {
    deprecationDate: '2024-12-01',
    sunsetDate: '2025-06-01'
});
```

### Migration Configuration

```javascript
// Define migration steps
versionManager.addMigration('v1', 'v2', {
    migrationSteps: [
        'Update API endpoints from /api/v1 to /api/v2',
        'Replace deprecated fields with new ones',
        'Update authentication headers'
    ],
    breakingChanges: [
        'Removed legacy field "oldField"',
        'Changed response format for /tasks endpoint'
    ]
});
```

## API Endpoints

### Health and Status

- `GET /health` - Service health check
- `GET /api/versions` - List all versions
- `GET /api/versions/{version}` - Get specific version info

### Version Management

- `POST /api/versions` - Register new version
- `PUT /api/versions/{version}` - Update version
- `DELETE /api/versions/{version}` - Remove version
- `PUT /api/versions/{version}/deprecate` - Deprecate version
- `PUT /api/versions/{version}/sunset` - Sunset version

### Migration and Documentation

- `GET /api/migration/{from}/{to}` - Get migration guide
- `GET /api/documentation` - Generate API documentation
- `GET /api/validate` - Validate configuration
- `GET /api/analytics` - Get usage analytics

### Backup and Restore

- `GET /api/backup` - Backup configuration
- `POST /api/restore` - Restore configuration

## Version Lifecycle

### 1. Development
- Register new version
- Define endpoints and features
- Set up migration guides

### 2. Active
- Version is actively supported
- Regular updates and bug fixes
- Performance monitoring

### 3. Deprecated
- Version marked for removal
- Warning headers added
- Migration guides provided

### 4. Sunset
- Version no longer supported
- Requests return 410 Gone
- Complete removal scheduled

## Security Features

### Authentication
- API key validation
- JWT token support
- Rate limiting per version

### Authorization
- Role-based access control
- Version-specific permissions
- Audit logging

### Data Protection
- Input validation
- Output sanitization
- SQL injection prevention

## Performance Optimization

### Caching
- Version metadata caching
- Response caching
- CDN integration

### Load Balancing
- Version-aware routing
- Health check integration
- Circuit breaker pattern

### Monitoring
- Request metrics
- Error rate tracking
- Performance analytics

## Troubleshooting

### Common Issues

1. **Version Not Found**
   ```powershell
   # Check if version is registered
   .\scripts\api-versioning-manager.ps1 -Action status
   ```

2. **Migration Errors**
   ```powershell
   # Validate migration configuration
   .\scripts\api-versioning-manager.ps1 -Action validate
   ```

3. **Service Not Starting**
   ```powershell
   # Check logs and restart
   .\scripts\api-versioning-manager.ps1 -Action restart
   ```

### Debug Mode

```powershell
# Enable verbose logging
.\scripts\api-versioning-manager.ps1 -Action status -Verbose
```

### Log Files

- `api-versioning/logs/error.log` - Error logs
- `api-versioning/logs/combined.log` - All logs
- `api-versioning/logs/access.log` - Access logs

## CI/CD Integration

### GitHub Actions

```yaml
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
      - name: Test API versions
        run: |
          .\scripts\api-versioning-manager.ps1 -Action test
      - name: Generate documentation
        run: |
          .\scripts\api-versioning-manager.ps1 -Action documentation
```

### Docker Integration

```dockerfile
# API Versioning Service
FROM node:18-alpine
WORKDIR /app
COPY api-versioning/ .
RUN npm install
EXPOSE 3008
CMD ["node", "server.js"]
```

## Best Practices

### Version Naming
- Use semantic versioning (v1.0.0)
- Maintain backward compatibility
- Clear deprecation timelines

### Documentation
- Keep changelogs updated
- Provide migration guides
- Document breaking changes

### Testing
- Test all version combinations
- Validate migration paths
- Monitor performance impact

### Monitoring
- Track version usage
- Monitor error rates
- Alert on deprecation warnings

## Advanced Features

### Custom Middleware
- Version-specific middleware
- Request/response transformation
- Custom validation rules

### Analytics Integration
- Usage tracking
- Performance metrics
- Business intelligence

### Multi-tenant Support
- Tenant-specific versions
- Isolated configurations
- Custom migration paths

## Support

For issues and questions:
- Check logs in `api-versioning/logs/`
- Run validation: `.\scripts\api-versioning-manager.ps1 -Action validate`
- Generate documentation: `.\scripts\api-versioning-manager.ps1 -Action documentation`

## Changelog

### v2.4 (Current)
- Enhanced PowerShell management script
- Added backup/restore functionality
- Improved analytics and monitoring
- Added deprecation and sunset management
- Enhanced documentation generation

### v2.3
- Added migration management
- Improved error handling
- Enhanced security features

### v2.2
- Added multiple versioning strategies
- Improved performance
- Enhanced monitoring

### v2.1
- Initial release
- Basic version management
- Health checks and logging
