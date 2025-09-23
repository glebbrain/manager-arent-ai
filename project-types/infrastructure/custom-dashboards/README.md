# 📊 Custom Dashboards Service v2.7.0

## Overview
The Custom Dashboards Service provides a comprehensive platform for creating, managing, and sharing user-customizable dashboards. It features a drag-and-drop interface, real-time data visualization, collaborative editing, and advanced customization capabilities.

## Features

### Core Dashboard Capabilities
- **Drag & Drop Interface**: Intuitive drag-and-drop dashboard builder
- **Real-time Data**: Live data streaming and updates
- **Custom Widgets**: Create and manage custom dashboard widgets
- **Data Visualization**: Advanced charting and visualization capabilities
- **Responsive Design**: Mobile-optimized and responsive layouts
- **Collaborative Editing**: Multi-user dashboard editing and sharing
- **Version Control**: Track and manage dashboard versions
- **Template Library**: Pre-built dashboard templates
- **Data Connections**: Connect to various data sources
- **Advanced Filtering**: Sophisticated data filtering and segmentation
- **Export Capabilities**: Export dashboards in multiple formats
- **Mobile Optimization**: Touch-friendly mobile interface
- **Accessibility**: WCAG compliant accessibility features
- **Performance Optimization**: Fast loading and rendering
- **Security**: Enterprise-grade security and access control
- **Analytics**: Dashboard usage and performance analytics
- **Sharing**: Share dashboards with team members and stakeholders
- **Embedding**: Embed dashboards in external applications
- **Automation**: Automated dashboard updates and notifications
- **AI Insights**: AI-powered insights and recommendations

### Widget Types
- **Charts and Graphs**: Bar, line, pie, area, scatter, bubble, radar, polar charts
- **Key Performance Indicators**: KPI widgets with targets and trends
- **Data Tables**: Sortable and filterable data tables
- **Gauge Charts**: Performance indicators and progress meters
- **Geographic Maps**: Location-based data visualization
- **Heat Maps**: Data density and pattern visualization
- **Tree Maps**: Hierarchical data representation
- **Funnel Charts**: Process flow and conversion analysis
- **Sankey Diagrams**: Flow and relationship visualization
- **Timeline Views**: Time-based data representation
- **Text and Rich Content**: Text widgets with formatting
- **Images and Media**: Image and media widgets
- **Embedded Content**: iFrame widgets for external content
- **Custom Widgets**: User-defined custom widgets

### Layout Types
- **Grid Layout**: Structured grid-based layouts
- **Flexbox Layout**: Flexible and responsive layouts
- **Masonry Layout**: Pinterest-style masonry layouts
- **Freeform Layout**: Unrestricted positioning
- **Responsive Layout**: Adaptive layouts for different screen sizes

### Data Sources
- **Database Connections**: Direct database connectivity
- **API Endpoints**: REST and SOAP API integration
- **File Uploads**: CSV, Excel, JSON, XML file processing
- **Real-time Data Streams**: Live data streaming and processing
- **External Data Sources**: Third-party data source integration
- **CSV Files**: Comma-separated values data
- **Excel Files**: Microsoft Excel spreadsheet data
- **JSON Data**: JavaScript Object Notation data

### Export Formats
- **PDF Documents**: Print-ready dashboard exports
- **PNG Images**: High-quality image exports
- **JPEG Images**: Compressed image exports
- **SVG Vector Graphics**: Scalable vector graphics
- **HTML Files**: Web-ready HTML exports
- **JSON Data**: Structured data exports

## API Endpoints

### Core Dashboard Management
- `GET /health` - Service health check
- `GET /api/config` - Get dashboard engine configuration
- `POST /api/dashboards` - Create a new dashboard
- `GET /api/dashboards` - List dashboards with filtering and pagination
- `GET /api/dashboards/:dashboardId` - Get specific dashboard details
- `POST /api/dashboards/:dashboardId/render` - Render a dashboard

### Widget Management
- `POST /api/widgets` - Create a new widget
- `GET /api/widgets` - List widgets with filtering

### Template Management
- `POST /api/templates` - Create a new template
- `GET /api/templates` - List templates with filtering

### User Management
- `POST /api/users` - Create a new user
- `GET /api/users` - List users with filtering

### File Management
- `POST /api/upload` - Upload files for dashboard use

### Analytics and Monitoring
- `GET /api/analytics` - Get dashboard analytics and performance metrics

## Configuration

### Environment Variables
```bash
PORT=3022                          # Server port
LOG_LEVEL=info                    # Logging level
```

### Dashboard Engine Limits
- **Max Dashboards**: 1,000
- **Max Widgets per Dashboard**: 100
- **Max Data Points**: 1,000,000
- **Max Dashboard Size**: 50MB
- **Max Concurrent Users**: 100
- **Dashboard Timeout**: 30 minutes
- **Max File Size**: 10MB

## Getting Started

### 1. Installation
```bash
cd custom-dashboards
npm install
```

### 2. Configuration
Create a `.env` file with your configuration:
```bash
PORT=3022
LOG_LEVEL=info
```

### 3. Start the Service
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 4. Health Check
```bash
curl http://localhost:3022/health
```

## Usage Examples

### Create a Dashboard
```bash
curl -X POST http://localhost:3022/api/dashboards \
  -H "Content-Type: application/json" \
  -d '{
    "dashboardData": {
      "name": "Sales Dashboard",
      "description": "Real-time sales performance dashboard",
      "layout": {
        "type": "grid",
        "columns": 12,
        "rows": 8
      },
      "theme": "modern",
      "settings": {
        "refreshInterval": 300,
        "autoSave": true
      },
      "permissions": {
        "public": false,
        "users": ["user1", "user2"]
      }
    }
  }'
```

### Create a Chart Widget
```bash
curl -X POST http://localhost:3022/api/widgets \
  -H "Content-Type: application/json" \
  -d '{
    "widgetData": {
      "type": "chart",
      "title": "Sales Trend",
      "description": "Monthly sales trend chart",
      "position": {
        "x": 0,
        "y": 0,
        "width": 6,
        "height": 4
      },
      "configuration": {
        "chartType": "line",
        "dataPoints": 12
      },
      "dataSource": {
        "type": "api",
        "endpoint": "/api/sales-data"
      },
      "styling": {
        "backgroundColor": "#ffffff",
        "borderColor": "#e0e0e0"
      }
    }
  }'
```

### Create a KPI Widget
```bash
curl -X POST http://localhost:3022/api/widgets \
  -H "Content-Type: application/json" \
  -d '{
    "widgetData": {
      "type": "kpi",
      "title": "Total Revenue",
      "description": "Current total revenue",
      "position": {
        "x": 6,
        "y": 0,
        "width": 3,
        "height": 2
      },
      "configuration": {
        "target": 1000000,
        "unit": "$"
      },
      "dataSource": {
        "type": "api",
        "endpoint": "/api/revenue"
      }
    }
  }'
```

### Render a Dashboard
```bash
curl -X POST http://localhost:3022/api/dashboards/{dashboardId}/render \
  -H "Content-Type: application/json" \
  -d '{
    "options": {
      "includeData": true,
      "includeCharts": true,
      "theme": "dark"
    }
  }'
```

### Create a Template
```bash
curl -X POST http://localhost:3022/api/templates \
  -H "Content-Type: application/json" \
  -d '{
    "templateData": {
      "name": "Executive Dashboard Template",
      "description": "Template for executive-level dashboards",
      "category": "executive",
      "layout": {
        "type": "grid",
        "columns": 12,
        "rows": 8
      },
      "widgets": [
        {
          "type": "kpi",
          "title": "Revenue",
          "position": { "x": 0, "y": 0, "width": 3, "height": 2 }
        },
        {
          "type": "chart",
          "title": "Trends",
          "position": { "x": 3, "y": 0, "width": 9, "height": 4 }
        }
      ],
      "theme": "executive",
      "isPublic": true
    }
  }'
```

### Upload a File
```bash
curl -X POST http://localhost:3022/api/upload \
  -F "file=@data.csv"
```

### Get Dashboard Analytics
```bash
curl "http://localhost:3022/api/analytics?period=24h"
```

## WebSocket Support

The dashboard service supports real-time updates via WebSocket:

```javascript
const socket = io('http://localhost:3022');

// Subscribe to dashboard updates
socket.emit('subscribe-dashboard', 'dashboard-id');

// Listen for dashboard updates
socket.on('dashboard-updated', (data) => {
  console.log('Dashboard updated:', data);
});

// Send dashboard updates
socket.emit('dashboard-update', {
  dashboardId: 'dashboard-id',
  changes: { /* changes */ }
});
```

## Dashboard Themes

### Default Theme
- Clean and minimal design
- Light color scheme
- Standard typography
- Basic animations

### Modern Theme
- Contemporary design
- Dark/light mode support
- Advanced animations
- Custom color palettes

### Executive Theme
- Professional appearance
- Corporate color schemes
- High-contrast elements
- Formal typography

### Creative Theme
- Vibrant colors
- Creative layouts
- Custom animations
- Artistic elements

## Widget Configuration

### Chart Widgets
```javascript
{
  "type": "chart",
  "configuration": {
    "chartType": "bar|line|pie|area|scatter|bubble|radar|polar",
    "dataPoints": 10,
    "showLegend": true,
    "showGrid": true,
    "animation": true
  }
}
```

### KPI Widgets
```javascript
{
  "type": "kpi",
  "configuration": {
    "target": 1000,
    "unit": "$|%|count",
    "showTrend": true,
    "showTarget": true,
    "colorScheme": "green|yellow|red"
  }
}
```

### Table Widgets
```javascript
{
  "type": "table",
  "configuration": {
    "rows": 10,
    "columns": 5,
    "sortable": true,
    "filterable": true,
    "pagination": true
  }
}
```

### Gauge Widgets
```javascript
{
  "type": "gauge",
  "configuration": {
    "min": 0,
    "max": 100,
    "thresholds": [50, 80],
    "showValue": true,
    "showPercentage": true
  }
}
```

## Data Source Configuration

### API Data Source
```javascript
{
  "type": "api",
  "endpoint": "https://api.example.com/data",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer token"
  },
  "params": {
    "limit": 100
  },
  "refreshInterval": 300
}
```

### Database Data Source
```javascript
{
  "type": "database",
  "connection": "production_db",
  "query": "SELECT * FROM sales_data",
  "refreshInterval": 600
}
```

### File Data Source
```javascript
{
  "type": "file",
  "path": "/uploads/data.csv",
  "format": "csv",
  "refreshInterval": 3600
}
```

## Security Features

- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Data Encryption**: Sensitive data encryption
- **File Upload Security**: Secure file upload handling
- **Access Control**: Fine-grained permissions
- **Audit Logging**: Complete audit trail
- **Compliance**: GDPR, HIPAA, SOX compliance support

## Performance Optimization

- **Lazy Loading**: Load widgets on demand
- **Caching**: Intelligent data caching
- **Compression**: Data compression for faster loading
- **CDN Support**: Content delivery network integration
- **Resource Optimization**: Optimized asset loading
- **Load Balancing**: Horizontal scaling support

## Monitoring and Observability

- **Real-time Metrics**: Live performance monitoring
- **Dashboard Analytics**: Usage and performance analytics
- **Error Reporting**: Detailed error reporting
- **Performance Tracking**: Load time and render time tracking
- **Health Checks**: Comprehensive health monitoring
- **Alerting**: Automated alerting for issues

## Troubleshooting

### Common Issues

1. **Dashboard Not Loading**
   - Check data source connectivity
   - Verify widget configurations
   - Review error logs

2. **Slow Dashboard Performance**
   - Optimize data queries
   - Reduce widget count
   - Check data volume

3. **Widget Not Displaying**
   - Verify widget configuration
   - Check data source availability
   - Review widget permissions

### Debug Mode
Enable debug logging by setting `LOG_LEVEL=debug` in your environment variables.

### Log Files
- `logs/custom-dashboards-error.log` - Error logs
- `logs/custom-dashboards-combined.log` - Combined logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide

## Changelog

### v2.7.0
- Initial release with comprehensive dashboard capabilities
- Drag-and-drop interface support
- Real-time data visualization
- Custom widget creation
- Template library
- Collaborative editing
- WebSocket support for real-time updates
- Multiple export formats
- Mobile optimization
- Enterprise-grade security and compliance features
