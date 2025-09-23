# Istio Service Mesh Installation Script
# Installs and configures Istio for ManagerAgentAI microservices

param(
    [Parameter(Mandatory=$false)]
    [string]$Version = "1.19.0",
    
    [Parameter(Mandatory=$false)]
    [string]$Profile = "default",
    
    [Parameter(Mandatory=$false)]
    [switch]$Production = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false
)

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Show-Header {
    Write-ColorOutput "☸️ Istio Service Mesh Installation v$Version" -Color Header
    Write-ColorOutput "=============================================" -Color Header
}

function Test-KubectlInstalled {
    try {
        $null = kubectl version --client
        return $true
    }
    catch {
        Write-ColorOutput "❌ kubectl is not installed or not in PATH" -Color Error
        return $false
    }
}

function Test-IstioInstalled {
    try {
        $null = istioctl version
        return $true
    }
    catch {
        return $false
    }
}

function Install-IstioCLI {
    Write-ColorOutput "📥 Installing Istio CLI..." -Color Info
    
    $istioUrl = "https://github.com/istio/istio/releases/download/$Version/istio-$Version-win.zip"
    $tempDir = "$env:TEMP\istio-$Version"
    $zipFile = "$tempDir\istio-$Version-win.zip"
    
    try {
        # Create temp directory
        if (Test-Path $tempDir) {
            Remove-Item $tempDir -Recurse -Force
        }
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
        
        # Download Istio
        Write-ColorOutput "Downloading Istio $Version..." -Color Info
        Invoke-WebRequest -Uri $istioUrl -OutFile $zipFile
        
        # Extract Istio
        Write-ColorOutput "Extracting Istio..." -Color Info
        Expand-Archive -Path $zipFile -DestinationPath $tempDir -Force
        
        # Add to PATH
        $istioPath = "$tempDir\istio-$Version\bin"
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
        if ($currentPath -notlike "*$istioPath*") {
            [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$istioPath", "User")
            $env:PATH = "$env:PATH;$istioPath"
        }
        
        Write-ColorOutput "✅ Istio CLI installed successfully" -Color Success
    }
    catch {
        Write-ColorOutput "❌ Error installing Istio CLI: $_" -Color Error
        exit 1
    }
}

function Install-IstioOperator {
    Write-ColorOutput "🔧 Installing Istio Operator..." -Color Info
    
    try {
        # Install Istio operator
        istioctl operator init
        
        # Wait for operator to be ready
        Write-ColorOutput "Waiting for Istio operator to be ready..." -Color Info
        kubectl wait --for=condition=available --timeout=300s deployment/istio-operator -n istio-operator
        
        Write-ColorOutput "✅ Istio Operator installed successfully" -Color Success
    }
    catch {
        Write-ColorOutput "❌ Error installing Istio Operator: $_" -Color Error
        exit 1
    }
}

function Install-IstioControlPlane {
    Write-ColorOutput "🎛️ Installing Istio Control Plane..." -Color Info
    
    $profile = if ($Production) { "production" } else { $Profile }
    
    try {
        # Install Istio with specified profile
        istioctl install --set values.defaultRevision=default -y
        
        # Wait for Istio to be ready
        Write-ColorOutput "Waiting for Istio control plane to be ready..." -Color Info
        kubectl wait --for=condition=ready --timeout=300s pod -l app=istiod -n istio-system
        
        Write-ColorOutput "✅ Istio Control Plane installed successfully" -Color Success
    }
    catch {
        Write-ColorOutput "❌ Error installing Istio Control Plane: $_" -Color Error
        exit 1
    }
}

function Install-IstioAddons {
    Write-ColorOutput "🔌 Installing Istio Addons..." -Color Info
    
    try {
        # Install Prometheus
        kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.19/samples/addons/prometheus.yaml
        
        # Install Grafana
        kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.19/samples/addons/grafana.yaml
        
        # Install Jaeger
        kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.19/samples/addons/jaeger.yaml
        
        # Install Kiali
        kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.19/samples/addons/kiali.yaml
        
        # Wait for addons to be ready
        Write-ColorOutput "Waiting for Istio addons to be ready..." -Color Info
        kubectl wait --for=condition=available --timeout=300s deployment/prometheus -n istio-system
        kubectl wait --for=condition=available --timeout=300s deployment/grafana -n istio-system
        kubectl wait --for=condition=available --timeout=300s deployment/jaeger -n istio-system
        kubectl wait --for=condition=available --timeout=300s deployment/kiali -n istio-system
        
        Write-ColorOutput "✅ Istio Addons installed successfully" -Color Success
    }
    catch {
        Write-ColorOutput "❌ Error installing Istio Addons: $_" -Color Error
        exit 1
    }
}

function Configure-ManagerAgentAI {
    Write-ColorOutput "⚙️ Configuring ManagerAgentAI for Service Mesh..." -Color Info
    
    try {
        # Label namespace for Istio injection
        kubectl label namespace manager-agent-ai istio-injection=enabled --overwrite
        
        # Apply Istio configurations
        kubectl apply -f service-mesh/istio/gateway.yaml
        kubectl apply -f service-mesh/istio/virtual-service.yaml
        kubectl apply -f service-mesh/istio/destination-rule.yaml
        kubectl apply -f service-mesh/istio/authorization-policy.yaml
        
        Write-ColorOutput "✅ ManagerAgentAI configured for Service Mesh" -Color Success
    }
    catch {
        Write-ColorOutput "❌ Error configuring ManagerAgentAI: $_" -Color Error
        exit 1
    }
}

function Show-Status {
    Write-ColorOutput "📊 Istio Status:" -Color Info
    Write-ColorOutput "===============" -Color Info
    
    try {
        # Show Istio version
        istioctl version
        
        # Show Istio components
        kubectl get pods -n istio-system
        
        # Show Istio services
        kubectl get services -n istio-system
        
        # Show Istio configuration
        istioctl proxy-status
    }
    catch {
        Write-ColorOutput "❌ Error getting Istio status: $_" -Color Error
    }
}

function Show-AccessInfo {
    Write-ColorOutput "🌐 Service Access Information:" -Color Info
    Write-ColorOutput "==============================" -Color Info
    
    Write-ColorOutput "Istio Gateway: http://localhost:80" -Color Info
    Write-ColorOutput "Kiali Dashboard: http://localhost:20001" -Color Info
    Write-ColorOutput "Grafana Dashboard: http://localhost:3000" -Color Info
    Write-ColorOutput "Jaeger Tracing: http://localhost:16686" -Color Info
    Write-ColorOutput "Prometheus: http://localhost:9090" -Color Info
    
    Write-ColorOutput "`nTo access services, run:" -Color Info
    Write-ColorOutput "kubectl port-forward -n istio-system service/istio-ingressgateway 80:80" -Color Info
    Write-ColorOutput "kubectl port-forward -n istio-system service/kiali 20001:20001" -Color Info
    Write-ColorOutput "kubectl port-forward -n istio-system service/grafana 3000:3000" -Color Info
    Write-ColorOutput "kubectl port-forward -n istio-system service/jaeger 16686:16686" -Color Info
    Write-ColorOutput "kubectl port-forward -n istio-system service/prometheus 9090:9090" -Color Info
}

# Main execution
Show-Header

# Check prerequisites
if (-not (Test-KubectlInstalled)) {
    Write-ColorOutput "❌ kubectl is required but not installed" -Color Error
    exit 1
}

# Check if Istio is already installed
if ((Test-IstioInstalled) -and (-not $Force)) {
    Write-ColorOutput "⚠️ Istio is already installed. Use -Force to reinstall" -Color Warning
    Show-Status
    exit 0
}

# Install Istio
if (-not (Test-IstioInstalled)) {
    Install-IstioCLI
}

Install-IstioOperator
Install-IstioControlPlane
Install-IstioAddons
Configure-ManagerAgentAI

# Show status and access info
Show-Status
Show-AccessInfo

Write-ColorOutput "`n🎉 Istio Service Mesh installation completed!" -Color Success
