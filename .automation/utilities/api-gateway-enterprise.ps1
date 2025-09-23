# API Gateway Enterprise Script for ManagerAgentAI v2.5
# Enterprise service integration

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "kong", "nginx", "traefik", "istio", "aws-api-gateway", "azure-api-management", "google-cloud-endpoints")]
    [string]$Platform = "all",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "deploy", "configure", "monitor", "scale", "security", "routing")]
    [string]$Action = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [string]$ConfigPath = "api-gateway",
    
    [Parameter(Mandatory=$false)]
    [string]$Version = "2.5.0",
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "production"
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "API-Gateway-Enterprise"
$Version = "2.5.0"
$LogFile = "api-gateway-enterprise.log"

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    if ($Verbose -or $Level -eq "ERROR") {
        Write-ColorOutput $logEntry -Color $Level.ToLower()
    }
    Add-Content -Path $LogFile -Value $logEntry -ErrorAction SilentlyContinue
}

function Show-Header {
    Write-ColorOutput "🌐 ManagerAgentAI API Gateway Enterprise v2.5" -Color Header
    Write-ColorOutput "===========================================" -Color Header
    Write-ColorOutput "Enterprise service integration" -Color Info
    Write-ColorOutput ""
}

function Create-KongConfiguration {
    Write-ColorOutput "Creating Kong API Gateway configuration..." -Color Info
    Write-Log "Creating Kong API Gateway configuration" "INFO"
    
    $configResults = @()
    
    try {
        # Create Kong directory
        $kongDir = Join-Path $ConfigPath "kong"
        if (-not (Test-Path $kongDir)) {
            New-Item -ItemType Directory -Path $kongDir -Force
            Write-ColorOutput "✅ Kong directory created: $kongDir" -Color Success
            Write-Log "Kong directory created: $kongDir" "INFO"
        }
        
        # Kong configuration
        $kongConfig = @"
_format_version: "3.0"
_transform: true

services:
- name: manageragent-api
  url: http://manageragent-api:3000/
  routes:
  - name: manageragent-api-route
    paths:
    - /api/v1
    - /api/v2
    methods:
    - GET
    - POST
    - PUT
    - DELETE
    - PATCH
    strip_path: true
    plugins:
    - name: rate-limiting
      config:
        minute: 100
        hour: 1000
        day: 10000
    - name: cors
      config:
        origins:
        - "*"
        methods:
        - GET
        - POST
        - PUT
        - DELETE
        - PATCH
        - OPTIONS
        headers:
        - Accept
        - Accept-Version
        - Content-Length
        - Content-MD5
        - Content-Type
        - Date
        - X-Auth-Token
        exposed_headers:
        - X-Auth-Token
        credentials: true
        max_age: 3600
    - name: jwt
      config:
        secret_is_base64: false
        key_claim_name: iss
        claims_to_verify:
        - exp
        - iat
    - name: request-transformer
      config:
        add:
          headers:
          - "X-API-Version: $Version"
          - "X-Environment: $Environment"
        remove:
          headers:
          - "X-Forwarded-For"
    - name: response-transformer
      config:
        add:
          headers:
          - "X-Response-Time: $(date)"
          - "X-API-Version: $Version"
        remove:
          headers:
          - "Server"

- name: manageragent-dashboard
  url: http://manageragent-dashboard:3003/
  routes:
  - name: manageragent-dashboard-route
    paths:
    - /dashboard
    - /admin
    methods:
    - GET
    - POST
    strip_path: true
    plugins:
    - name: rate-limiting
      config:
        minute: 200
        hour: 2000
    - name: cors
      config:
        origins:
        - "*"
        methods:
        - GET
        - POST
        - OPTIONS
        headers:
        - Accept
        - Content-Type
        - Authorization
        credentials: true
    - name: jwt
      config:
        secret_is_base64: false
        key_claim_name: iss
        claims_to_verify:
        - exp
        - iat

- name: manageragent-notifications
  url: http://manageragent-notifications:3004/
  routes:
  - name: manageragent-notifications-route
    paths:
    - /notifications
    - /alerts
    methods:
    - GET
    - POST
    - PUT
    - DELETE
    strip_path: true
    plugins:
    - name: rate-limiting
      config:
        minute: 50
        hour: 500
    - name: cors
      config:
        origins:
        - "*"
        methods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
        headers:
        - Accept
        - Content-Type
        - Authorization
        credentials: true
    - name: jwt
      config:
        secret_is_base64: false
        key_claim_name: iss
        claims_to_verify:
        - exp
        - iat

- name: manageragent-forecasting
  url: http://manageragent-forecasting:3005/
  routes:
  - name: manageragent-forecasting-route
    paths:
    - /forecasting
    - /predictions
    methods:
    - GET
    - POST
    strip_path: true
    plugins:
    - name: rate-limiting
      config:
        minute: 30
        hour: 300
    - name: cors
      config:
        origins:
        - "*"
        methods:
        - GET
        - POST
        - OPTIONS
        headers:
        - Accept
        - Content-Type
        - Authorization
        credentials: true
    - name: jwt
      config:
        secret_is_base64: false
        key_claim_name: iss
        claims_to_verify:
        - exp
        - iat

- name: manageragent-benchmarking
  url: http://manageragent-benchmarking:3006/
  routes:
  - name: manageragent-benchmarking-route
    paths:
    - /benchmarking
    - /metrics
    methods:
    - GET
    - POST
    strip_path: true
    plugins:
    - name: rate-limiting
      config:
        minute: 20
        hour: 200
    - name: cors
      config:
        origins:
        - "*"
        methods:
        - GET
        - POST
        - OPTIONS
        headers:
        - Accept
        - Content-Type
        - Authorization
        credentials: true
    - name: jwt
      config:
        secret_is_base64: false
        key_claim_name: iss
        claims_to_verify:
        - exp
        - iat

- name: manageragent-data-export
  url: http://manageragent-data-export:3007/
  routes:
  - name: manageragent-data-export-route
    paths:
    - /data-export
    - /reports
    methods:
    - GET
    - POST
    strip_path: true
    plugins:
    - name: rate-limiting
      config:
        minute: 10
        hour: 100
    - name: cors
      config:
        origins:
        - "*"
        methods:
        - GET
        - POST
        - OPTIONS
        headers:
        - Accept
        - Content-Type
        - Authorization
        credentials: true
    - name: jwt
      config:
        secret_is_base64: false
        key_claim_name: iss
        claims_to_verify:
        - exp
        - iat

- name: manageragent-deadline-prediction
  url: http://manageragent-deadline-prediction:3008/
  routes:
  - name: manageragent-deadline-prediction-route
    paths:
    - /deadline-prediction
    - /predictions
    methods:
    - GET
    - POST
    strip_path: true
    plugins:
    - name: rate-limiting
      config:
        minute: 25
        hour: 250
    - name: cors
      config:
        origins:
        - "*"
        methods:
        - GET
        - POST
        - OPTIONS
        headers:
        - Accept
        - Content-Type
        - Authorization
        credentials: true
    - name: jwt
      config:
        secret_is_base64: false
        key_claim_name: iss
        claims_to_verify:
        - exp
        - iat

- name: manageragent-sprint-planning
  url: http://manageragent-sprint-planning:3009/
  routes:
  - name: manageragent-sprint-planning-route
    paths:
    - /sprint-planning
    - /sprints
    methods:
    - GET
    - POST
    - PUT
    - DELETE
    strip_path: true
    plugins:
    - name: rate-limiting
      config:
        minute: 40
        hour: 400
    - name: cors
      config:
        origins:
        - "*"
        methods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
        headers:
        - Accept
        - Content-Type
        - Authorization
        credentials: true
    - name: jwt
      config:
        secret_is_base64: false
        key_claim_name: iss
        claims_to_verify:
        - exp
        - iat

- name: manageragent-task-distribution
  url: http://manageragent-task-distribution:3010/
  routes:
  - name: manageragent-task-distribution-route
    paths:
    - /task-distribution
    - /tasks
    methods:
    - GET
    - POST
    - PUT
    - DELETE
    strip_path: true
    plugins:
    - name: rate-limiting
      config:
        minute: 60
        hour: 600
    - name: cors
      config:
        origins:
        - "*"
        methods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
        headers:
        - Accept
        - Content-Type
        - Authorization
        credentials: true
    - name: jwt
      config:
        secret_is_base64: false
        key_claim_name: iss
        claims_to_verify:
        - exp
        - iat

- name: manageragent-task-dependency
  url: http://manageragent-task-dependency:3011/
  routes:
  - name: manageragent-task-dependency-route
    paths:
    - /task-dependency
    - /dependencies
    methods:
    - GET
    - POST
    - PUT
    - DELETE
    strip_path: true
    plugins:
    - name: rate-limiting
      config:
        minute: 35
        hour: 350
    - name: cors
      config:
        origins:
        - "*"
        methods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
        headers:
        - Accept
        - Content-Type
        - Authorization
        credentials: true
    - name: jwt
      config:
        secret_is_base64: false
        key_claim_name: iss
        claims_to_verify:
        - exp
        - iat

- name: manageragent-status-updates
  url: http://manageragent-status-updates:3012/
  routes:
  - name: manageragent-status-updates-route
    paths:
    - /status-updates
    - /status
    methods:
    - GET
    - POST
    - PUT
    strip_path: true
    plugins:
    - name: rate-limiting
      config:
        minute: 80
        hour: 800
    - name: cors
      config:
        origins:
        - "*"
        methods:
        - GET
        - POST
        - PUT
        - OPTIONS
        headers:
        - Accept
        - Content-Type
        - Authorization
        credentials: true
    - name: jwt
      config:
        secret_is_base64: false
        key_claim_name: iss
        claims_to_verify:
        - exp
        - iat

consumers:
- username: manageragent-client
  custom_id: manageragent-client-id
  keyauth_credentials:
  - key: manageragent-api-key-12345
  jwt_secrets:
  - key: manageragent-jwt-secret
    algorithm: HS256

plugins:
- name: prometheus
  config:
    per_consumer: true
    status_code_metrics: true
    latency_metrics: true
    bandwidth_metrics: true
    upstream_health_metrics: true
- name: datadog
  config:
    host: datadog-agent
    port: 8126
    service: manageragent-api-gateway
    environment: $Environment
    version: $Version
"@
        
        $kongConfigFile = Join-Path $kongDir "kong.yml"
        $kongConfig | Out-File -FilePath $kongConfigFile -Encoding UTF8
        $configResults += @{ Platform = "Kong"; File = $kongConfigFile; Status = "Created" }
        Write-ColorOutput "✅ Kong configuration created: $kongConfigFile" -Color Success
        Write-Log "Kong configuration created: $kongConfigFile" "INFO"
        
        # Kong Docker Compose
        $kongDockerCompose = @"
version: '3.8'

services:
  kong-database:
    image: postgres:13
    environment:
      POSTGRES_USER: kong
      POSTGRES_PASSWORD: kong
      POSTGRES_DB: kong
    volumes:
      - kong_data:/var/lib/postgresql/data
    networks:
      - manageragent-network

  kong-migrations:
    image: kong:3.4
    command: kong migrations bootstrap
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-database
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: kong
      KONG_PG_DATABASE: kong
    depends_on:
      - kong-database
    networks:
      - manageragent-network

  kong:
    image: kong:3.4
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-database
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: kong
      KONG_PG_DATABASE: kong
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
      KONG_ADMIN_GUI_URL: http://localhost:8002
      KONG_ADMIN_GUI_LISTEN: 0.0.0.0:8002
    ports:
      - "8000:8000"
      - "8001:8001"
      - "8002:8002"
      - "8443:8443"
      - "8444:8444"
    depends_on:
      - kong-migrations
    networks:
      - manageragent-network

  kong-dashboard:
    image: pgbi/kong-dashboard:latest
    environment:
      KONG_API_URL: http://kong:8001
    ports:
      - "8080:8080"
    depends_on:
      - kong
    networks:
      - manageragent-network

volumes:
  kong_data:

networks:
  manageragent-network:
    driver: bridge
"@
        
        $kongDockerComposeFile = Join-Path $kongDir "docker-compose.yml"
        $kongDockerCompose | Out-File -FilePath $kongDockerComposeFile -Encoding UTF8
        $configResults += @{ Platform = "Kong"; File = $kongDockerComposeFile; Status = "Created" }
        Write-ColorOutput "✅ Kong Docker Compose created: $kongDockerComposeFile" -Color Success
        Write-Log "Kong Docker Compose created: $kongDockerComposeFile" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Failed to create Kong configuration" -Color Error
        Write-Log "Failed to create Kong configuration: $($_.Exception.Message)" "ERROR"
    }
    
    return $configResults
}

function Create-NginxConfiguration {
    Write-ColorOutput "Creating Nginx configuration..." -Color Info
    Write-Log "Creating Nginx configuration" "INFO"
    
    $configResults = @()
    
    try {
        # Create Nginx directory
        $nginxDir = Join-Path $ConfigPath "nginx"
        if (-not (Test-Path $nginxDir)) {
            New-Item -ItemType Directory -Path $nginxDir -Force
            Write-ColorOutput "✅ Nginx directory created: $nginxDir" -Color Success
            Write-Log "Nginx directory created: $nginxDir" "INFO"
        }
        
        # Nginx configuration
        $nginxConfig = @"
upstream manageragent_api {
    server manageragent-api:3000;
    server manageragent-api-2:3000;
    server manageragent-api-3:3000;
}

upstream manageragent_dashboard {
    server manageragent-dashboard:3003;
    server manageragent-dashboard-2:3003;
}

upstream manageragent_notifications {
    server manageragent-notifications:3004;
}

upstream manageragent_forecasting {
    server manageragent-forecasting:3005;
}

upstream manageragent_benchmarking {
    server manageragent-benchmarking:3006;
}

upstream manageragent_data_export {
    server manageragent-data-export:3007;
}

upstream manageragent_deadline_prediction {
    server manageragent-deadline-prediction:3008;
}

upstream manageragent_sprint_planning {
    server manageragent-sprint-planning:3009;
}

upstream manageragent_task_distribution {
    server manageragent-task-distribution:3010;
}

upstream manageragent_task_dependency {
    server manageragent-task-dependency:3011;
}

upstream manageragent_status_updates {
    server manageragent-status-updates:3012;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=dashboard:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=notifications:10m rate=5r/s;
limit_req_zone $binary_remote_addr zone=forecasting:10m rate=3r/s;
limit_req_zone $binary_remote_addr zone=benchmarking:10m rate=2r/s;
limit_req_zone $binary_remote_addr zone=data_export:10m rate=1r/s;
limit_req_zone $binary_remote_addr zone=deadline_prediction:10m rate=2r/s;
limit_req_zone $binary_remote_addr zone=sprint_planning:10m rate=4r/s;
limit_req_zone $binary_remote_addr zone=task_distribution:10m rate=6r/s;
limit_req_zone $binary_remote_addr zone=task_dependency:10m rate=3r/s;
limit_req_zone $binary_remote_addr zone=status_updates:10m rate=8r/s;

# Main server block
server {
    listen 80;
    server_name manageragent.ai www.manageragent.ai;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self';" always;
    
    # API Gateway routes
    location /api/v1/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://manageragent_api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "1.0";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /api/v2/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://manageragent_api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "2.0";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /dashboard/ {
        limit_req zone=dashboard burst=40 nodelay;
        proxy_pass http://manageragent_dashboard/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "$Version";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /admin/ {
        limit_req zone=dashboard burst=40 nodelay;
        proxy_pass http://manageragent_dashboard/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "$Version";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /notifications/ {
        limit_req zone=notifications burst=10 nodelay;
        proxy_pass http://manageragent_notifications/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "$Version";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /alerts/ {
        limit_req zone=notifications burst=10 nodelay;
        proxy_pass http://manageragent_notifications/alerts/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "$Version";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /forecasting/ {
        limit_req zone=forecasting burst=6 nodelay;
        proxy_pass http://manageragent_forecasting/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "$Version";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /predictions/ {
        limit_req zone=forecasting burst=6 nodelay;
        proxy_pass http://manageragent_forecasting/predictions/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "$Version";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /benchmarking/ {
        limit_req zone=benchmarking burst=4 nodelay;
        proxy_pass http://manageragent_benchmarking/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "$Version";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /metrics/ {
        limit_req zone=benchmarking burst=4 nodelay;
        proxy_pass http://manageragent_benchmarking/metrics/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "$Version";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /data-export/ {
        limit_req zone=data_export burst=2 nodelay;
        proxy_pass http://manageragent_data_export/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "$Version";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /reports/ {
        limit_req zone=data_export burst=2 nodelay;
        proxy_pass http://manageragent_data_export/reports/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "$Version";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /deadline-prediction/ {
        limit_req zone=deadline_prediction burst=4 nodelay;
        proxy_pass http://manageragent_deadline_prediction/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "$Version";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /sprint-planning/ {
        limit_req zone=sprint_planning burst=8 nodelay;
        proxy_pass http://manageragent_sprint_planning/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "$Version";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /sprints/ {
        limit_req zone=sprint_planning burst=8 nodelay;
        proxy_pass http://manageragent_sprint_planning/sprints/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "$Version";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /task-distribution/ {
        limit_req zone=task_distribution burst=12 nodelay;
        proxy_pass http://manageragent_task_distribution/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "$Version";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /tasks/ {
        limit_req zone=task_distribution burst=12 nodelay;
        proxy_pass http://manageragent_task_distribution/tasks/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "$Version";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /task-dependency/ {
        limit_req zone=task_dependency burst=6 nodelay;
        proxy_pass http://manageragent_task_dependency/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "$Version";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /dependencies/ {
        limit_req zone=task_dependency burst=6 nodelay;
        proxy_pass http://manageragent_task_dependency/dependencies/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "$Version";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /status-updates/ {
        limit_req zone=status_updates burst=16 nodelay;
        proxy_pass http://manageragent_status_updates/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "$Version";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    location /status/ {
        limit_req zone=status_updates burst=16 nodelay;
        proxy_pass http://manageragent_status_updates/status/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-API-Version "$Version";
        proxy_set_header X-Environment "$Environment";
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Metrics endpoint
    location /metrics {
        access_log off;
        return 200 "nginx metrics\n";
        add_header Content-Type text/plain;
    }
    
    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /404.html {
        root /usr/share/nginx/html;
    }
    
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
"@
        
        $nginxConfigFile = Join-Path $nginxDir "nginx.conf"
        $nginxConfig | Out-File -FilePath $nginxConfigFile -Encoding UTF8
        $configResults += @{ Platform = "Nginx"; File = $nginxConfigFile; Status = "Created" }
        Write-ColorOutput "✅ Nginx configuration created: $nginxConfigFile" -Color Success
        Write-Log "Nginx configuration created: $nginxConfigFile" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Failed to create Nginx configuration" -Color Error
        Write-Log "Failed to create Nginx configuration: $($_.Exception.Message)" "ERROR"
    }
    
    return $configResults
}

function Create-TraefikConfiguration {
    Write-ColorOutput "Creating Traefik configuration..." -Color Info
    Write-Log "Creating Traefik configuration" "INFO"
    
    $configResults = @()
    
    try {
        # Create Traefik directory
        $traefikDir = Join-Path $ConfigPath "traefik"
        if (-not (Test-Path $traefikDir)) {
            New-Item -ItemType Directory -Path $traefikDir -Force
            Write-ColorOutput "✅ Traefik directory created: $traefikDir" -Color Success
            Write-Log "Traefik directory created: $traefikDir" "INFO"
        }
        
        # Traefik configuration
        $traefikConfig = @"
# Traefik configuration
[global]
  checkNewVersion = false
  sendAnonymousUsage = false

[entryPoints]
  [entryPoints.web]
    address = ":80"
    [entryPoints.web.http.redirections.entrypoint]
      to = "websecure"
      scheme = "https"
      permanent = true

  [entryPoints.websecure]
    address = ":443"
    [entryPoints.websecure.http.tls]
      options = "default"

[providers]
  [providers.docker]
    endpoint = "unix:///var/run/docker.sock"
    exposedByDefault = false
    network = "manageragent-network"

  [providers.file]
    filename = "/etc/traefik/dynamic.yml"
    watch = true

[api]
  dashboard = true
  insecure = false

[metrics]
  [metrics.prometheus]
    addEntryPointsLabels = true
    addServicesLabels = true

[log]
  level = "INFO"
  filePath = "/var/log/traefik/traefik.log"

[accessLog]
  filePath = "/var/log/traefik/access.log"

[certificatesResolvers]
  [certificatesResolvers.letsencrypt]
    [certificatesResolvers.letsencrypt.acme]
      email = "admin@manageragent.ai"
      storage = "/etc/traefik/acme.json"
      [certificatesResolvers.letsencrypt.acme.httpChallenge]
        entryPoint = "web"
"@
        
        $traefikConfigFile = Join-Path $traefikDir "traefik.yml"
        $traefikConfig | Out-File -FilePath $traefikConfigFile -Encoding UTF8
        $configResults += @{ Platform = "Traefik"; File = $traefikConfigFile; Status = "Created" }
        Write-ColorOutput "✅ Traefik configuration created: $traefikConfigFile" -Color Success
        Write-Log "Traefik configuration created: $traefikConfigFile" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Failed to create Traefik configuration" -Color Error
        Write-Log "Failed to create Traefik configuration: $($_.Exception.Message)" "ERROR"
    }
    
    return $configResults
}

function Show-Usage {
    Write-ColorOutput "Usage: .\api-gateway-enterprise.ps1 -Platform <platform> [options]" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Platforms:" -Color Info
    Write-ColorOutput "  all           - All API Gateway platforms" -Color Info
    Write-ColorOutput "  kong          - Kong API Gateway" -Color Info
    Write-ColorOutput "  nginx         - Nginx" -Color Info
    Write-ColorOutput "  traefik       - Traefik" -Color Info
    Write-ColorOutput "  istio         - Istio Service Mesh" -Color Info
    Write-ColorOutput "  aws-api-gateway - AWS API Gateway" -Color Info
    Write-ColorOutput "  azure-api-management - Azure API Management" -Color Info
    Write-ColorOutput "  google-cloud-endpoints - Google Cloud Endpoints" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Actions:" -Color Info
    Write-ColorOutput "  all      - All actions" -Color Info
    Write-ColorOutput "  deploy   - Deploy API Gateway" -Color Info
    Write-ColorOutput "  configure - Configure API Gateway" -Color Info
    Write-ColorOutput "  monitor  - Monitor API Gateway" -Color Info
    Write-ColorOutput "  scale    - Scale API Gateway" -Color Info
    Write-ColorOutput "  security - Security configuration" -Color Info
    Write-ColorOutput "  routing  - Routing configuration" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Options:" -Color Info
    Write-ColorOutput "  -Verbose     - Show detailed output" -Color Info
    Write-ColorOutput "  -ConfigPath  - Path for configuration files" -Color Info
    Write-ColorOutput "  -Version     - Version number" -Color Info
    Write-ColorOutput "  -Environment - Environment name" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" -Color Info
    Write-ColorOutput "  .\api-gateway-enterprise.ps1 -Platform all" -Color Info
    Write-ColorOutput "  .\api-gateway-enterprise.ps1 -Platform kong -Action deploy" -Color Info
    Write-ColorOutput "  .\api-gateway-enterprise.ps1 -Platform nginx -Action configure" -Color Info
    Write-ColorOutput "  .\api-gateway-enterprise.ps1 -Platform traefik -Action monitor" -Color Info
}

# Main execution
function Main {
    Show-Header
    
    # Create configuration directory
    if (-not (Test-Path $ConfigPath)) {
        New-Item -ItemType Directory -Path $ConfigPath -Force
        Write-ColorOutput "✅ Configuration directory created: $ConfigPath" -Color Success
        Write-Log "Configuration directory created: $ConfigPath" "INFO"
    }
    
    $allResults = @()
    
    # Execute action based on platform parameter
    switch ($Platform) {
        "all" {
            Write-ColorOutput "Creating API Gateway configurations for all platforms..." -Color Info
            Write-Log "Creating API Gateway configurations for all platforms" "INFO"
            
            $kongResults = Create-KongConfiguration
            $nginxResults = Create-NginxConfiguration
            $traefikResults = Create-TraefikConfiguration
            
            $allResults += $kongResults
            $allResults += $nginxResults
            $allResults += $traefikResults
        }
        "kong" {
            Write-ColorOutput "Creating Kong configuration..." -Color Info
            Write-Log "Creating Kong configuration" "INFO"
            $allResults += Create-KongConfiguration
        }
        "nginx" {
            Write-ColorOutput "Creating Nginx configuration..." -Color Info
            Write-Log "Creating Nginx configuration" "INFO"
            $allResults += Create-NginxConfiguration
        }
        "traefik" {
            Write-ColorOutput "Creating Traefik configuration..." -Color Info
            Write-Log "Creating Traefik configuration" "INFO"
            $allResults += Create-TraefikConfiguration
        }
        default {
            Write-ColorOutput "Unknown platform: $Platform" -Color Error
            Write-Log "Unknown platform: $Platform" "ERROR"
            Show-Usage
        }
    }
    
    # Show summary
    Write-ColorOutput ""
    Write-ColorOutput "API Gateway Enterprise Summary:" -Color Header
    Write-ColorOutput "==============================" -Color Header
    
    $successfulConfigs = ($allResults | Where-Object { $_.Status -eq "Created" }).Count
    $totalConfigs = $allResults.Count
    Write-ColorOutput "Configurations: $successfulConfigs/$totalConfigs created" -Color $(if ($successfulConfigs -eq $totalConfigs) { "Success" } else { "Warning" })
    
    $platforms = $allResults | Group-Object Platform
    foreach ($platform in $platforms) {
        $platformSuccess = ($platform.Group | Where-Object { $_.Status -eq "Created" }).Count
        $platformTotal = $platform.Group.Count
        Write-ColorOutput "$($platform.Name): $platformSuccess/$platformTotal successful" -Color $(if ($platformSuccess -eq $platformTotal) { "Success" } else { "Warning" })
    }
    
    Write-Log "API Gateway enterprise configuration completed for platform: $Platform" "INFO"
}

# Run main function
Main
