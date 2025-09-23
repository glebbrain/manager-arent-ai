# Multi-tenant Architecture Script for ManagerAgentAI v2.5
# Scalable cloud infrastructure

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "aws", "azure", "gcp", "kubernetes", "docker", "microservices")]
    [string]$Platform = "all",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "deploy", "configure", "scale", "monitor", "security", "isolation")]
    [string]$Action = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [string]$ConfigPath = "multi-tenant",
    
    [Parameter(Mandatory=$false)]
    [string]$Version = "2.5.0",
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "production"
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "Multi-Tenant-Architecture"
$Version = "2.5.0"
$LogFile = "multi-tenant-architecture.log"

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
    Write-ColorOutput "🏢 ManagerAgentAI Multi-Tenant Architecture v2.5" -Color Header
    Write-ColorOutput "=============================================" -Color Header
    Write-ColorOutput "Scalable cloud infrastructure" -Color Info
    Write-ColorOutput ""
}

function Create-AWSTenantInfrastructure {
    Write-ColorOutput "Creating AWS multi-tenant infrastructure..." -Color Info
    Write-Log "Creating AWS multi-tenant infrastructure" "INFO"
    
    $infrastructureResults = @()
    
    try {
        # Create AWS directory
        $awsDir = Join-Path $ConfigPath "aws"
        if (-not (Test-Path $awsDir)) {
            New-Item -ItemType Directory -Path $awsDir -Force
            Write-ColorOutput "✅ AWS directory created: $awsDir" -Color Success
            Write-Log "AWS directory created: $awsDir" "INFO"
        }
        
        # CloudFormation template for multi-tenant architecture
        $cloudFormationTemplate = @"
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "ManagerAgentAI Multi-Tenant Architecture",
  "Parameters": {
    "Environment": {
      "Type": "String",
      "Default": "$Environment",
      "Description": "Environment name"
    },
    "Version": {
      "Type": "String",
      "Default": "$Version",
      "Description": "Application version"
    },
    "TenantCount": {
      "Type": "Number",
      "Default": 10,
      "Description": "Number of tenants to support"
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "ManagerAgentAI-MultiTenant-VPC"
          }
        ]
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": "" }] },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "ManagerAgentAI-Public-Subnet-1"
          }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": "" }] },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "ManagerAgentAI-Public-Subnet-2"
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": "" }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": "ManagerAgentAI-Private-Subnet-1"
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.4.0/24",
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": "" }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": "ManagerAgentAI-Private-Subnet-2"
          }
        ]
      }
    },
    "EKSCluster": {
      "Type": "AWS::EKS::Cluster",
      "Properties": {
        "Name": "ManagerAgentAI-MultiTenant-Cluster",
        "Version": "1.27",
        "RoleArn": { "Ref": "EKSClusterRole" },
        "ResourcesVpcConfig": {
          "SecurityGroupIds": [{ "Ref": "EKSClusterSecurityGroup" }],
          "SubnetIds": [
            { "Ref": "PrivateSubnet1" },
            { "Ref": "PrivateSubnet2" }
          ]
        }
      }
    },
    "EKSClusterRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "eks.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
        ]
      }
    },
    "EKSClusterSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EKS cluster",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "ManagerAgentAI-EKS-Cluster-SG"
          }
        ]
      }
    },
    "RDSInstance": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": "manageragent-multitenant-db",
        "DBInstanceClass": "db.t3.medium",
        "Engine": "postgres",
        "EngineVersion": "15.4",
        "AllocatedStorage": 100,
        "StorageType": "gp2",
        "MasterUsername": "admin",
        "MasterUserPassword": { "Ref": "DatabasePassword" },
        "VPCSecurityGroups": [{ "Ref": "RDSSecurityGroup" }],
        "DBSubnetGroupName": { "Ref": "DBSubnetGroup" },
        "BackupRetentionPeriod": 7,
        "MultiAZ": true,
        "PubliclyAccessible": false,
        "StorageEncrypted": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "ManagerAgentAI-MultiTenant-Database"
          }
        ]
      }
    },
    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS instance",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "SourceSecurityGroupId": { "Ref": "EKSClusterSecurityGroup" }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "ManagerAgentAI-RDS-SG"
          }
        ]
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for RDS instance",
        "SubnetIds": [
          { "Ref": "PrivateSubnet1" },
          { "Ref": "PrivateSubnet2" }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "ManagerAgentAI-DB-SubnetGroup"
          }
        ]
      }
    },
    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": "manageragent-multitenant-storage",
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "Encryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "ManagerAgentAI-MultiTenant-Storage"
          }
        ]
      }
    },
    "CloudFrontDistribution": {
      "Type": "AWS::CloudFront::Distribution",
      "Properties": {
        "DistributionConfig": {
          "Origins": [
            {
              "Id": "S3Origin",
              "DomainName": { "Fn::GetAtt": ["S3Bucket", "RegionalDomainName"] },
              "S3OriginConfig": {
                "OriginAccessIdentity": ""
              }
            }
          ],
          "Enabled": true,
          "DefaultRootObject": "index.html",
          "DefaultCacheBehavior": {
            "TargetOriginId": "S3Origin",
            "ViewerProtocolPolicy": "redirect-to-https",
            "AllowedMethods": ["GET", "HEAD"],
            "CachedMethods": ["GET", "HEAD"],
            "ForwardedValues": {
              "QueryString": false,
              "Cookies": {
                "Forward": "none"
              }
            }
          },
          "PriceClass": "PriceClass_100",
          "Comment": "ManagerAgentAI Multi-Tenant CDN"
        }
      }
    },
    "ElastiCacheCluster": {
      "Type": "AWS::ElastiCache::CacheCluster",
      "Properties": {
        "CacheNodeType": "cache.t3.micro",
        "Engine": "redis",
        "NumCacheNodes": 1,
        "VpcSecurityGroupIds": [{ "Ref": "ElastiCacheSecurityGroup" }],
        "SubnetGroupName": { "Ref": "ElastiCacheSubnetGroup" },
        "Tags": [
          {
            "Key": "Name",
            "Value": "ManagerAgentAI-MultiTenant-Cache"
          }
        ]
      }
    },
    "ElastiCacheSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for ElastiCache cluster",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 6379,
            "ToPort": 6379,
            "SourceSecurityGroupId": { "Ref": "EKSClusterSecurityGroup" }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "ManagerAgentAI-ElastiCache-SG"
          }
        ]
      }
    },
    "ElastiCacheSubnetGroup": {
      "Type": "AWS::ElastiCache::SubnetGroup",
      "Properties": {
        "Description": "Subnet group for ElastiCache cluster",
        "SubnetIds": [
          { "Ref": "PrivateSubnet1" },
          { "Ref": "PrivateSubnet2" }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "ManagerAgentAI-ElastiCache-SubnetGroup"
          }
        ]
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": { "Ref": "VPC" }
    },
    "EKSClusterName": {
      "Description": "EKS Cluster Name",
      "Value": { "Ref": "EKSCluster" }
    },
    "RDSEndpoint": {
      "Description": "RDS Endpoint",
      "Value": { "Fn::GetAtt": ["RDSInstance", "Endpoint.Address"] }
    },
    "S3BucketName": {
      "Description": "S3 Bucket Name",
      "Value": { "Ref": "S3Bucket" }
    },
    "CloudFrontURL": {
      "Description": "CloudFront URL",
      "Value": { "Fn::GetAtt": ["CloudFrontDistribution", "DomainName"] }
    },
    "ElastiCacheEndpoint": {
      "Description": "ElastiCache Endpoint",
      "Value": { "Fn::GetAtt": ["ElastiCacheCluster", "RedisEndpoint.Address"] }
    }
  }
}
"@
        
        $cloudFormationFile = Join-Path $awsDir "multitenant-cloudformation.json"
        $cloudFormationTemplate | Out-File -FilePath $cloudFormationFile -Encoding UTF8
        $infrastructureResults += @{ Platform = "AWS"; File = $cloudFormationFile; Status = "Created" }
        Write-ColorOutput "✅ AWS multi-tenant CloudFormation template created: $cloudFormationFile" -Color Success
        Write-Log "AWS multi-tenant CloudFormation template created: $cloudFormationFile" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Failed to create AWS multi-tenant infrastructure" -Color Error
        Write-Log "Failed to create AWS multi-tenant infrastructure: $($_.Exception.Message)" "ERROR"
    }
    
    return $infrastructureResults
}

function Create-KubernetesTenantConfiguration {
    Write-ColorOutput "Creating Kubernetes multi-tenant configuration..." -Color Info
    Write-Log "Creating Kubernetes multi-tenant configuration" "INFO"
    
    $configResults = @()
    
    try {
        # Create Kubernetes directory
        $k8sDir = Join-Path $ConfigPath "kubernetes"
        if (-not (Test-Path $k8sDir)) {
            New-Item -ItemType Directory -Path $k8sDir -Force
            Write-ColorOutput "✅ Kubernetes directory created: $k8sDir" -Color Success
            Write-Log "Kubernetes directory created: $k8sDir" "INFO"
        }
        
        # Multi-tenant namespace configuration
        $namespaceConfig = @"
apiVersion: v1
kind: Namespace
metadata:
  name: manageragent-multitenant
  labels:
    name: manageragent-multitenant
    app: manageragent
    tenant: shared
---
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-1
  labels:
    name: tenant-1
    app: manageragent
    tenant: tenant-1
---
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-2
  labels:
    name: tenant-2
    app: manageragent
    tenant: tenant-2
---
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-3
  labels:
    name: tenant-3
    app: manageragent
    tenant: tenant-3
---
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-4
  labels:
    name: tenant-4
    app: manageragent
    tenant: tenant-4
---
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-5
  labels:
    name: tenant-5
    app: manageragent
    tenant: tenant-5
"@
        
        $namespaceConfigFile = Join-Path $k8sDir "namespaces.yaml"
        $namespaceConfig | Out-File -FilePath $namespaceConfigFile -Encoding UTF8
        $configResults += @{ Platform = "Kubernetes"; File = $namespaceConfigFile; Status = "Created" }
        Write-ColorOutput "✅ Kubernetes namespace configuration created: $namespaceConfigFile" -Color Success
        Write-Log "Kubernetes namespace configuration created: $namespaceConfigFile" "INFO"
        
        # Multi-tenant service configuration
        $serviceConfig = @"
apiVersion: v1
kind: Service
metadata:
  name: manageragent-api
  namespace: manageragent-multitenant
  labels:
    app: manageragent-api
spec:
  selector:
    app: manageragent-api
  ports:
    - port: 3000
      targetPort: 3000
      protocol: TCP
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: manageragent-dashboard
  namespace: manageragent-multitenant
  labels:
    app: manageragent-dashboard
spec:
  selector:
    app: manageragent-dashboard
  ports:
    - port: 3003
      targetPort: 3003
      protocol: TCP
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: manageragent-notifications
  namespace: manageragent-multitenant
  labels:
    app: manageragent-notifications
spec:
  selector:
    app: manageragent-notifications
  ports:
    - port: 3004
      targetPort: 3004
      protocol: TCP
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: manageragent-forecasting
  namespace: manageragent-multitenant
  labels:
    app: manageragent-forecasting
spec:
  selector:
    app: manageragent-forecasting
  ports:
    - port: 3005
      targetPort: 3005
      protocol: TCP
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: manageragent-benchmarking
  namespace: manageragent-multitenant
  labels:
    app: manageragent-benchmarking
spec:
  selector:
    app: manageragent-benchmarking
  ports:
    - port: 3006
      targetPort: 3006
      protocol: TCP
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: manageragent-data-export
  namespace: manageragent-multitenant
  labels:
    app: manageragent-data-export
spec:
  selector:
    app: manageragent-data-export
  ports:
    - port: 3007
      targetPort: 3007
      protocol: TCP
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: manageragent-deadline-prediction
  namespace: manageragent-multitenant
  labels:
    app: manageragent-deadline-prediction
spec:
  selector:
    app: manageragent-deadline-prediction
  ports:
    - port: 3008
      targetPort: 3008
      protocol: TCP
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: manageragent-sprint-planning
  namespace: manageragent-multitenant
  labels:
    app: manageragent-sprint-planning
spec:
  selector:
    app: manageragent-sprint-planning
  ports:
    - port: 3009
      targetPort: 3009
      protocol: TCP
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: manageragent-task-distribution
  namespace: manageragent-multitenant
  labels:
    app: manageragent-task-distribution
spec:
  selector:
    app: manageragent-task-distribution
  ports:
    - port: 3010
      targetPort: 3010
      protocol: TCP
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: manageragent-task-dependency
  namespace: manageragent-multitenant
  labels:
    app: manageragent-task-dependency
spec:
  selector:
    app: manageragent-task-dependency
  ports:
    - port: 3011
      targetPort: 3011
      protocol: TCP
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: manageragent-status-updates
  namespace: manageragent-multitenant
  labels:
    app: manageragent-status-updates
spec:
  selector:
    app: manageragent-status-updates
  ports:
          - port: 3012
      targetPort: 3012
      protocol: TCP
  type: ClusterIP
"@
        
        $serviceConfigFile = Join-Path $k8sDir "services.yaml"
        $serviceConfig | Out-File -FilePath $serviceConfigFile -Encoding UTF8
        $configResults += @{ Platform = "Kubernetes"; File = $serviceConfigFile; Status = "Created" }
        Write-ColorOutput "✅ Kubernetes service configuration created: $serviceConfigFile" -Color Success
        Write-Log "Kubernetes service configuration created: $serviceConfigFile" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Failed to create Kubernetes multi-tenant configuration" -Color Error
        Write-Log "Failed to create Kubernetes multi-tenant configuration: $($_.Exception.Message)" "ERROR"
    }
    
    return $configResults
}

function Create-DockerTenantConfiguration {
    Write-ColorOutput "Creating Docker multi-tenant configuration..." -Color Info
    Write-Log "Creating Docker multi-tenant configuration" "INFO"
    
    $configResults = @()
    
    try {
        # Create Docker directory
        $dockerDir = Join-Path $ConfigPath "docker"
        if (-not (Test-Path $dockerDir)) {
            New-Item -ItemType Directory -Path $dockerDir -Force
            Write-ColorOutput "✅ Docker directory created: $dockerDir" -Color Success
            Write-Log "Docker directory created: $dockerDir" "INFO"
        }
        
        # Docker Compose for multi-tenant architecture
        $dockerCompose = @"
version: '3.8'

services:
  # Shared services
  manageragent-api:
    image: manageragent/api:$Version
    container_name: manageragent-api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=$Environment
      - VERSION=$Version
      - TENANT_MODE=shared
    networks:
      - manageragent-multitenant
    restart: unless-stopped

  manageragent-dashboard:
    image: manageragent/dashboard:$Version
    container_name: manageragent-dashboard
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=$Environment
      - VERSION=$Version
      - TENANT_MODE=shared
    networks:
      - manageragent-multitenant
    restart: unless-stopped

  manageragent-notifications:
    image: manageragent/notifications:$Version
    container_name: manageragent-notifications
    ports:
      - "3004:3004"
    environment:
      - NODE_ENV=$Environment
      - VERSION=$Version
      - TENANT_MODE=shared
    networks:
      - manageragent-multitenant
    restart: unless-stopped

  manageragent-forecasting:
    image: manageragent/forecasting:$Version
    container_name: manageragent-forecasting
    ports:
      - "3005:3005"
    environment:
      - NODE_ENV=$Environment
      - VERSION=$Version
      - TENANT_MODE=shared
    networks:
      - manageragent-multitenant
    restart: unless-stopped

  manageragent-benchmarking:
    image: manageragent/benchmarking:$Version
    container_name: manageragent-benchmarking
    ports:
      - "3006:3006"
    environment:
      - NODE_ENV=$Environment
      - VERSION=$Version
      - TENANT_MODE=shared
    networks:
      - manageragent-multitenant
    restart: unless-stopped

  manageragent-data-export:
    image: manageragent/data-export:$Version
    container_name: manageragent-data-export
    ports:
      - "3007:3007"
    environment:
      - NODE_ENV=$Environment
      - VERSION=$Version
      - TENANT_MODE=shared
    networks:
      - manageragent-multitenant
    restart: unless-stopped

  manageragent-deadline-prediction:
    image: manageragent/deadline-prediction:$Version
    container_name: manageragent-deadline-prediction
    ports:
      - "3008:3008"
    environment:
      - NODE_ENV=$Environment
      - VERSION=$Version
      - TENANT_MODE=shared
    networks:
      - manageragent-multitenant
    restart: unless-stopped

  manageragent-sprint-planning:
    image: manageragent/sprint-planning:$Version
    container_name: manageragent-sprint-planning
    ports:
      - "3009:3009"
    environment:
      - NODE_ENV=$Environment
      - VERSION=$Version
      - TENANT_MODE=shared
    networks:
      - manageragent-multitenant
    restart: unless-stopped

  manageragent-task-distribution:
    image: manageragent/task-distribution:$Version
    container_name: manageragent-task-distribution
    ports:
      - "3010:3010"
    environment:
      - NODE_ENV=$Environment
      - VERSION=$Version
      - TENANT_MODE=shared
    networks:
      - manageragent-multitenant
    restart: unless-stopped

  manageragent-task-dependency:
    image: manageragent/task-dependency:$Version
    container_name: manageragent-task-dependency
    ports:
      - "3011:3011"
    environment:
      - NODE_ENV=$Environment
      - VERSION=$Version
      - TENANT_MODE=shared
    networks:
      - manageragent-multitenant
    restart: unless-stopped

  manageragent-status-updates:
    image: manageragent/status-updates:$Version
    container_name: manageragent-status-updates
    ports:
      - "3012:3012"
    environment:
      - NODE_ENV=$Environment
      - VERSION=$Version
      - TENANT_MODE=shared
    networks:
      - manageragent-multitenant
    restart: unless-stopped

  # Tenant-specific services
  tenant-1-api:
    image: manageragent/api:$Version
    container_name: tenant-1-api
    ports:
      - "3100:3000"
    environment:
      - NODE_ENV=$Environment
      - VERSION=$Version
      - TENANT_MODE=isolated
      - TENANT_ID=tenant-1
    networks:
      - manageragent-multitenant
    restart: unless-stopped

  tenant-2-api:
    image: manageragent/api:$Version
    container_name: tenant-2-api
    ports:
      - "3200:3000"
    environment:
      - NODE_ENV=$Environment
      - VERSION=$Version
      - TENANT_MODE=isolated
      - TENANT_ID=tenant-2
    networks:
      - manageragent-multitenant
    restart: unless-stopped

  tenant-3-api:
    image: manageragent/api:$Version
    container_name: tenant-3-api
    ports:
      - "3300:3000"
    environment:
      - NODE_ENV=$Environment
      - VERSION=$Version
      - TENANT_MODE=isolated
      - TENANT_ID=tenant-3
    networks:
      - manageragent-multitenant
    restart: unless-stopped

  tenant-4-api:
    image: manageragent/api:$Version
    container_name: tenant-4-api
    ports:
      - "3400:3000"
    environment:
      - NODE_ENV=$Environment
      - VERSION=$Version
      - TENANT_MODE=isolated
      - TENANT_ID=tenant-4
    networks:
      - manageragent-multitenant
    restart: unless-stopped

  tenant-5-api:
    image: manageragent/api:$Version
    container_name: tenant-5-api
    ports:
      - "3500:3000"
    environment:
      - NODE_ENV=$Environment
      - VERSION=$Version
      - TENANT_MODE=isolated
      - TENANT_ID=tenant-5
    networks:
      - manageragent-multitenant
    restart: unless-stopped

networks:
  manageragent-multitenant:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
"@
        
        $dockerComposeFile = Join-Path $dockerDir "docker-compose.yml"
        $dockerCompose | Out-File -FilePath $dockerComposeFile -Encoding UTF8
        $configResults += @{ Platform = "Docker"; File = $dockerComposeFile; Status = "Created" }
        Write-ColorOutput "✅ Docker multi-tenant configuration created: $dockerComposeFile" -Color Success
        Write-Log "Docker multi-tenant configuration created: $dockerComposeFile" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Failed to create Docker multi-tenant configuration" -Color Error
        Write-Log "Failed to create Docker multi-tenant configuration: $($_.Exception.Message)" "ERROR"
    }
    
    return $configResults
}

function Create-TenantIsolationPolicies {
    Write-ColorOutput "Creating tenant isolation policies..." -Color Info
    Write-Log "Creating tenant isolation policies" "INFO"
    
    $configResults = @()
    
    try {
        # Create policies directory
        $policiesDir = Join-Path $ConfigPath "policies"
        if (-not (Test-Path $policiesDir)) {
            New-Item -ItemType Directory -Path $policiesDir -Force
            Write-ColorOutput "✅ Policies directory created: $policiesDir" -Color Success
            Write-Log "Policies directory created: $policiesDir" "INFO"
        }
        
        # Network policies for tenant isolation
        $networkPolicies = @"
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tenant-isolation
  namespace: manageragent-multitenant
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: manageragent-multitenant
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: manageragent-multitenant
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tenant-1-isolation
  namespace: tenant-1
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: tenant-1
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: tenant-1
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tenant-2-isolation
  namespace: tenant-2
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: tenant-2
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: tenant-2
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tenant-3-isolation
  namespace: tenant-3
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: tenant-3
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: tenant-3
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tenant-4-isolation
  namespace: tenant-4
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: tenant-4
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: tenant-4
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tenant-5-isolation
  namespace: tenant-5
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: tenant-5
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: tenant-5
"@
        
        $networkPoliciesFile = Join-Path $policiesDir "network-policies.yaml"
        $networkPolicies | Out-File -FilePath $networkPoliciesFile -Encoding UTF8
        $configResults += @{ Platform = "Kubernetes"; File = $networkPoliciesFile; Status = "Created" }
        Write-ColorOutput "✅ Network policies created: $networkPoliciesFile" -Color Success
        Write-Log "Network policies created: $networkPoliciesFile" "INFO"
        
        # Resource quotas for tenant isolation
        $resourceQuotas = @"
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-1-quota
  namespace: tenant-1
spec:
  hard:
    requests.cpu: "2"
    requests.memory: 4Gi
    limits.cpu: "4"
    limits.memory: 8Gi
    persistentvolumeclaims: "4"
"@
        
        $resourceQuotasFile = Join-Path $policiesDir "resource-quotas.yaml"
        $resourceQuotas | Out-File -FilePath $resourceQuotasFile -Encoding UTF8
        $configResults += @{ Platform = "Kubernetes"; File = $resourceQuotasFile; Status = "Created" }
        Write-ColorOutput "✅ Resource quotas created: $resourceQuotasFile" -Color Success
        Write-Log "Resource quotas created: $resourceQuotasFile" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Failed to create tenant isolation policies" -Color Error
        Write-Log "Failed to create tenant isolation policies: $($_.Exception.Message)" "ERROR"
    }
    
    return $configResults
}

function Show-Usage {
    Write-ColorOutput "Multi-Tenant Architecture Configuration Script" -Color Info
    Write-ColorOutput "=============================================" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Usage: .\multi-tenant-architecture.ps1 [OPTIONS]" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Options:" -Color Info
    Write-ColorOutput "  -Action <string>     Action to perform (create, deploy, status, cleanup)" -Color Info
    Write-ColorOutput "  -Platform <string>   Platform to configure (kubernetes, docker, all)" -Color Info
    Write-ColorOutput "  -ConfigPath <string> Path to configuration directory (default: .\config)" -Color Info
    Write-ColorOutput "  -Version <string>    Version to deploy (default: latest)" -Color Info
    Write-ColorOutput "  -Environment <string> Environment (dev, staging, prod) (default: dev)" -Color Info
    Write-ColorOutput "  -Help               Show this help message" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" -Color Info
    Write-ColorOutput "  .\multi-tenant-architecture.ps1 -Action create -Platform kubernetes" -Color Info
    Write-ColorOutput "  .\multi-tenant-architecture.ps1 -Action deploy -Platform all" -Color Info
    Write-ColorOutput "  .\multi-tenant-architecture.ps1 -Action status" -Color Info
    Write-ColorOutput "  .\multi-tenant-architecture.ps1 -Action cleanup -Platform docker" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Available Actions:" -Color Info
    Write-ColorOutput "  create    - Create multi-tenant configuration files" -Color Info
    Write-ColorOutput "  deploy    - Deploy multi-tenant architecture" -Color Info
    Write-ColorOutput "  status    - Show deployment status" -Color Info
    Write-ColorOutput "  cleanup   - Clean up multi-tenant resources" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Available Platforms:" -Color Info
    Write-ColorOutput "  kubernetes - Kubernetes multi-tenant configuration" -Color Info
    Write-ColorOutput "  docker     - Docker multi-tenant configuration" -Color Info
    Write-ColorOutput "  all        - All platforms" -Color Info
}

function Main {
    param(
        [string]$Action = "create",
        [string]$Platform = "all",
        [string]$ConfigPath = ".\config",
        [string]$Version = "latest",
        [string]$Environment = "dev"
    )
    
    # Initialize logging
    Initialize-Logging
    
    Write-ColorOutput "Multi-Tenant Architecture Configuration Script" -Color Info
    Write-ColorOutput "=============================================" -Color Info
    Write-ColorOutput "Action: $Action" -Color Info
    Write-ColorOutput "Platform: $Platform" -Color Info
    Write-ColorOutput "Config Path: $ConfigPath" -Color Info
    Write-ColorOutput "Version: $Version" -Color Info
    Write-ColorOutput "Environment: $Environment" -Color Info
    Write-ColorOutput ""
    
    try {
        $results = @()
        
        switch ($Action.ToLower()) {
            "create" {
                Write-ColorOutput "Creating multi-tenant architecture configuration..." -Color Info
                Write-Log "Creating multi-tenant architecture configuration" "INFO"
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    $k8sResults = Create-KubernetesTenantConfiguration
                    $results += $k8sResults
                }
                
                if ($Platform -eq "all" -or $Platform -eq "docker") {
                    $dockerResults = Create-DockerTenantConfiguration
                    $results += $dockerResults
                }
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    $policyResults = Create-TenantIsolationPolicies
                    $results += $policyResults
                }
                
                Write-ColorOutput "Multi-tenant architecture configuration created successfully!" -Color Success
                Write-Log "Multi-tenant architecture configuration created successfully" "INFO"
            }
            
            "deploy" {
                Write-ColorOutput "Deploying multi-tenant architecture..." -Color Info
                Write-Log "Deploying multi-tenant architecture" "INFO"
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    Write-ColorOutput "Deploying Kubernetes multi-tenant architecture..." -Color Info
                    Write-Log "Deploying Kubernetes multi-tenant architecture" "INFO"
                    
                    # Deploy namespaces
                    $namespacesFile = Join-Path $ConfigPath "kubernetes\namespaces.yaml"
                    if (Test-Path $namespacesFile) {
                        kubectl apply -f $namespacesFile
                        Write-ColorOutput "✅ Kubernetes namespaces deployed" -Color Success
                        Write-Log "Kubernetes namespaces deployed" "INFO"
                    }
                    
                    # Deploy services
                    $servicesFile = Join-Path $ConfigPath "kubernetes\services.yaml"
                    if (Test-Path $servicesFile) {
                        kubectl apply -f $servicesFile
                        Write-ColorOutput "✅ Kubernetes services deployed" -Color Success
                        Write-Log "Kubernetes services deployed" "INFO"
                    }
                    
                    # Deploy network policies
                    $policiesFile = Join-Path $ConfigPath "policies\network-policies.yaml"
                    if (Test-Path $policiesFile) {
                        kubectl apply -f $policiesFile
                        Write-ColorOutput "✅ Network policies deployed" -Color Success
                        Write-Log "Network policies deployed" "INFO"
                    }
                    
                    # Deploy resource quotas
                    $quotasFile = Join-Path $ConfigPath "policies\resource-quotas.yaml"
                    if (Test-Path $quotasFile) {
                        kubectl apply -f $quotasFile
                        Write-ColorOutput "✅ Resource quotas deployed" -Color Success
                        Write-Log "Resource quotas deployed" "INFO"
                    }
                }
                
                if ($Platform -eq "all" -or $Platform -eq "docker") {
                    Write-ColorOutput "Deploying Docker multi-tenant architecture..." -Color Info
                    Write-Log "Deploying Docker multi-tenant architecture" "INFO"
                    
                    $dockerComposeFile = Join-Path $ConfigPath "docker\docker-compose.yml"
                    if (Test-Path $dockerComposeFile) {
                        docker-compose -f $dockerComposeFile up -d
                        Write-ColorOutput "✅ Docker multi-tenant architecture deployed" -Color Success
                        Write-Log "Docker multi-tenant architecture deployed" "INFO"
                    }
                }
                
                Write-ColorOutput "Multi-tenant architecture deployed successfully!" -Color Success
                Write-Log "Multi-tenant architecture deployed successfully" "INFO"
            }
            
            "status" {
                Write-ColorOutput "Checking multi-tenant architecture status..." -Color Info
                Write-Log "Checking multi-tenant architecture status" "INFO"
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    Write-ColorOutput "Kubernetes Status:" -Color Info
                    kubectl get namespaces | Select-String "manageragent\|tenant-"
                    kubectl get services --all-namespaces | Select-String "manageragent\|tenant-"
                    kubectl get networkpolicies --all-namespaces | Select-String "tenant-"
                    kubectl get resourcequotas --all-namespaces | Select-String "tenant-"
                }
                
                if ($Platform -eq "all" -or $Platform -eq "docker") {
                    Write-ColorOutput "Docker Status:" -Color Info
                    docker ps | Select-String "manageragent\|tenant-"
                }
            }
            
            "cleanup" {
                Write-ColorOutput "Cleaning up multi-tenant architecture..." -Color Info
                Write-Log "Cleaning up multi-tenant architecture" "INFO"
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    Write-ColorOutput "Cleaning up Kubernetes resources..." -Color Info
                    Write-Log "Cleaning up Kubernetes resources" "INFO"
                    
                    # Remove namespaces (this will also remove all resources in them)
                    kubectl delete namespace manageragent-multitenant --ignore-not-found=true
                    kubectl delete namespace tenant-1 --ignore-not-found=true
                    kubectl delete namespace tenant-2 --ignore-not-found=true
                    kubectl delete namespace tenant-3 --ignore-not-found=true
                    kubectl delete namespace tenant-4 --ignore-not-found=true
                    kubectl delete namespace tenant-5 --ignore-not-found=true
                    
                    Write-ColorOutput "✅ Kubernetes resources cleaned up" -Color Success
                    Write-Log "Kubernetes resources cleaned up" "INFO"
                }
                
                if ($Platform -eq "all" -or $Platform -eq "docker") {
                    Write-ColorOutput "Cleaning up Docker resources..." -Color Info
                    Write-Log "Cleaning up Docker resources" "INFO"
                    
                    $dockerComposeFile = Join-Path $ConfigPath "docker\docker-compose.yml"
                    if (Test-Path $dockerComposeFile) {
                        docker-compose -f $dockerComposeFile down
                        Write-ColorOutput "✅ Docker resources cleaned up" -Color Success
                        Write-Log "Docker resources cleaned up" "INFO"
                    }
                }
                
                Write-ColorOutput "Multi-tenant architecture cleaned up successfully!" -Color Success
                Write-Log "Multi-tenant architecture cleaned up successfully" "INFO"
            }
            
            default {
                Write-ColorOutput "Unknown action: $Action" -Color Error
                Write-Log "Unknown action: $Action" "ERROR"
                Show-Usage
                return
            }
        }
        
        # Display results
        if ($results.Count -gt 0) {
            Write-ColorOutput ""
            Write-ColorOutput "Configuration Results:" -Color Info
            Write-ColorOutput "====================" -Color Info
            foreach ($result in $results) {
                $statusColor = if ($result.Status -eq "Created") { "Success" } else { "Warning" }
                Write-ColorOutput "✅ $($result.Platform): $($result.File) - $($result.Status)" -Color $statusColor
            }
        }
        
    } catch {
        Write-ColorOutput "❌ Error: $($_.Exception.Message)" -Color Error
        Write-Log "Error: $($_.Exception.Message)" "ERROR"
        exit 1
    }
}

# Main execution
if ($MyInvocation.InvocationName -ne '.') {
    Main -Action $Action -Platform $Platform -ConfigPath $ConfigPath -Version $Version -Environment $Environment
}
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-2-quota
  namespace: tenant-2
spec:
  hard:
    requests.cpu: "2"
    requests.memory: 4Gi
    limits.cpu: "4"
    limits.memory: 8Gi
    persistentvolumeclaims: "4"
"@
        
        $resourceQuotasFile = Join-Path $policiesDir "resource-quotas.yaml"
        $resourceQuotas | Out-File -FilePath $resourceQuotasFile -Encoding UTF8
        $configResults += @{ Platform = "Kubernetes"; File = $resourceQuotasFile; Status = "Created" }
        Write-ColorOutput "✅ Resource quotas created: $resourceQuotasFile" -Color Success
        Write-Log "Resource quotas created: $resourceQuotasFile" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Failed to create tenant isolation policies" -Color Error
        Write-Log "Failed to create tenant isolation policies: $($_.Exception.Message)" "ERROR"
    }
    
    return $configResults
}

function Show-Usage {
    Write-ColorOutput "Multi-Tenant Architecture Configuration Script" -Color Info
    Write-ColorOutput "=============================================" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Usage: .\multi-tenant-architecture.ps1 [OPTIONS]" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Options:" -Color Info
    Write-ColorOutput "  -Action <string>     Action to perform (create, deploy, status, cleanup)" -Color Info
    Write-ColorOutput "  -Platform <string>   Platform to configure (kubernetes, docker, all)" -Color Info
    Write-ColorOutput "  -ConfigPath <string> Path to configuration directory (default: .\config)" -Color Info
    Write-ColorOutput "  -Version <string>    Version to deploy (default: latest)" -Color Info
    Write-ColorOutput "  -Environment <string> Environment (dev, staging, prod) (default: dev)" -Color Info
    Write-ColorOutput "  -Help               Show this help message" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" -Color Info
    Write-ColorOutput "  .\multi-tenant-architecture.ps1 -Action create -Platform kubernetes" -Color Info
    Write-ColorOutput "  .\multi-tenant-architecture.ps1 -Action deploy -Platform all" -Color Info
    Write-ColorOutput "  .\multi-tenant-architecture.ps1 -Action status" -Color Info
    Write-ColorOutput "  .\multi-tenant-architecture.ps1 -Action cleanup -Platform docker" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Available Actions:" -Color Info
    Write-ColorOutput "  create    - Create multi-tenant configuration files" -Color Info
    Write-ColorOutput "  deploy    - Deploy multi-tenant architecture" -Color Info
    Write-ColorOutput "  status    - Show deployment status" -Color Info
    Write-ColorOutput "  cleanup   - Clean up multi-tenant resources" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Available Platforms:" -Color Info
    Write-ColorOutput "  kubernetes - Kubernetes multi-tenant configuration" -Color Info
    Write-ColorOutput "  docker     - Docker multi-tenant configuration" -Color Info
    Write-ColorOutput "  all        - All platforms" -Color Info
}

function Main {
    param(
        [string]$Action = "create",
        [string]$Platform = "all",
        [string]$ConfigPath = ".\config",
        [string]$Version = "latest",
        [string]$Environment = "dev"
    )
    
    # Initialize logging
    Initialize-Logging
    
    Write-ColorOutput "Multi-Tenant Architecture Configuration Script" -Color Info
    Write-ColorOutput "=============================================" -Color Info
    Write-ColorOutput "Action: $Action" -Color Info
    Write-ColorOutput "Platform: $Platform" -Color Info
    Write-ColorOutput "Config Path: $ConfigPath" -Color Info
    Write-ColorOutput "Version: $Version" -Color Info
    Write-ColorOutput "Environment: $Environment" -Color Info
    Write-ColorOutput ""
    
    try {
        $results = @()
        
        switch ($Action.ToLower()) {
            "create" {
                Write-ColorOutput "Creating multi-tenant architecture configuration..." -Color Info
                Write-Log "Creating multi-tenant architecture configuration" "INFO"
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    $k8sResults = Create-KubernetesTenantConfiguration
                    $results += $k8sResults
                }
                
                if ($Platform -eq "all" -or $Platform -eq "docker") {
                    $dockerResults = Create-DockerTenantConfiguration
                    $results += $dockerResults
                }
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    $policyResults = Create-TenantIsolationPolicies
                    $results += $policyResults
                }
                
                Write-ColorOutput "Multi-tenant architecture configuration created successfully!" -Color Success
                Write-Log "Multi-tenant architecture configuration created successfully" "INFO"
            }
            
            "deploy" {
                Write-ColorOutput "Deploying multi-tenant architecture..." -Color Info
                Write-Log "Deploying multi-tenant architecture" "INFO"
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    Write-ColorOutput "Deploying Kubernetes multi-tenant architecture..." -Color Info
                    Write-Log "Deploying Kubernetes multi-tenant architecture" "INFO"
                    
                    # Deploy namespaces
                    $namespacesFile = Join-Path $ConfigPath "kubernetes\namespaces.yaml"
                    if (Test-Path $namespacesFile) {
                        kubectl apply -f $namespacesFile
                        Write-ColorOutput "✅ Kubernetes namespaces deployed" -Color Success
                        Write-Log "Kubernetes namespaces deployed" "INFO"
                    }
                    
                    # Deploy services
                    $servicesFile = Join-Path $ConfigPath "kubernetes\services.yaml"
                    if (Test-Path $servicesFile) {
                        kubectl apply -f $servicesFile
                        Write-ColorOutput "✅ Kubernetes services deployed" -Color Success
                        Write-Log "Kubernetes services deployed" "INFO"
                    }
                    
                    # Deploy network policies
                    $policiesFile = Join-Path $ConfigPath "policies\network-policies.yaml"
                    if (Test-Path $policiesFile) {
                        kubectl apply -f $policiesFile
                        Write-ColorOutput "✅ Network policies deployed" -Color Success
                        Write-Log "Network policies deployed" "INFO"
                    }
                    
                    # Deploy resource quotas
                    $quotasFile = Join-Path $ConfigPath "policies\resource-quotas.yaml"
                    if (Test-Path $quotasFile) {
                        kubectl apply -f $quotasFile
                        Write-ColorOutput "✅ Resource quotas deployed" -Color Success
                        Write-Log "Resource quotas deployed" "INFO"
                    }
                }
                
                if ($Platform -eq "all" -or $Platform -eq "docker") {
                    Write-ColorOutput "Deploying Docker multi-tenant architecture..." -Color Info
                    Write-Log "Deploying Docker multi-tenant architecture" "INFO"
                    
                    $dockerComposeFile = Join-Path $ConfigPath "docker\docker-compose.yml"
                    if (Test-Path $dockerComposeFile) {
                        docker-compose -f $dockerComposeFile up -d
                        Write-ColorOutput "✅ Docker multi-tenant architecture deployed" -Color Success
                        Write-Log "Docker multi-tenant architecture deployed" "INFO"
                    }
                }
                
                Write-ColorOutput "Multi-tenant architecture deployed successfully!" -Color Success
                Write-Log "Multi-tenant architecture deployed successfully" "INFO"
            }
            
            "status" {
                Write-ColorOutput "Checking multi-tenant architecture status..." -Color Info
                Write-Log "Checking multi-tenant architecture status" "INFO"
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    Write-ColorOutput "Kubernetes Status:" -Color Info
                    kubectl get namespaces | Select-String "manageragent\|tenant-"
                    kubectl get services --all-namespaces | Select-String "manageragent\|tenant-"
                    kubectl get networkpolicies --all-namespaces | Select-String "tenant-"
                    kubectl get resourcequotas --all-namespaces | Select-String "tenant-"
                }
                
                if ($Platform -eq "all" -or $Platform -eq "docker") {
                    Write-ColorOutput "Docker Status:" -Color Info
                    docker ps | Select-String "manageragent\|tenant-"
                }
            }
            
            "cleanup" {
                Write-ColorOutput "Cleaning up multi-tenant architecture..." -Color Info
                Write-Log "Cleaning up multi-tenant architecture" "INFO"
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    Write-ColorOutput "Cleaning up Kubernetes resources..." -Color Info
                    Write-Log "Cleaning up Kubernetes resources" "INFO"
                    
                    # Remove namespaces (this will also remove all resources in them)
                    kubectl delete namespace manageragent-multitenant --ignore-not-found=true
                    kubectl delete namespace tenant-1 --ignore-not-found=true
                    kubectl delete namespace tenant-2 --ignore-not-found=true
                    kubectl delete namespace tenant-3 --ignore-not-found=true
                    kubectl delete namespace tenant-4 --ignore-not-found=true
                    kubectl delete namespace tenant-5 --ignore-not-found=true
                    
                    Write-ColorOutput "✅ Kubernetes resources cleaned up" -Color Success
                    Write-Log "Kubernetes resources cleaned up" "INFO"
                }
                
                if ($Platform -eq "all" -or $Platform -eq "docker") {
                    Write-ColorOutput "Cleaning up Docker resources..." -Color Info
                    Write-Log "Cleaning up Docker resources" "INFO"
                    
                    $dockerComposeFile = Join-Path $ConfigPath "docker\docker-compose.yml"
                    if (Test-Path $dockerComposeFile) {
                        docker-compose -f $dockerComposeFile down
                        Write-ColorOutput "✅ Docker resources cleaned up" -Color Success
                        Write-Log "Docker resources cleaned up" "INFO"
                    }
                }
                
                Write-ColorOutput "Multi-tenant architecture cleaned up successfully!" -Color Success
                Write-Log "Multi-tenant architecture cleaned up successfully" "INFO"
            }
            
            default {
                Write-ColorOutput "Unknown action: $Action" -Color Error
                Write-Log "Unknown action: $Action" "ERROR"
                Show-Usage
                return
            }
        }
        
        # Display results
        if ($results.Count -gt 0) {
            Write-ColorOutput ""
            Write-ColorOutput "Configuration Results:" -Color Info
            Write-ColorOutput "====================" -Color Info
            foreach ($result in $results) {
                $statusColor = if ($result.Status -eq "Created") { "Success" } else { "Warning" }
                Write-ColorOutput "✅ $($result.Platform): $($result.File) - $($result.Status)" -Color $statusColor
            }
        }
        
    } catch {
        Write-ColorOutput "❌ Error: $($_.Exception.Message)" -Color Error
        Write-Log "Error: $($_.Exception.Message)" "ERROR"
        exit 1
    }
}

# Main execution
if ($MyInvocation.InvocationName -ne '.') {
    Main -Action $Action -Platform $Platform -ConfigPath $ConfigPath -Version $Version -Environment $Environment
}
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-3-quota
  namespace: tenant-3
spec:
  hard:
    requests.cpu: "2"
    requests.memory: 4Gi
    limits.cpu: "4"
    limits.memory: 8Gi
    persistentvolumeclaims: "4"
"@
        
        $resourceQuotasFile = Join-Path $policiesDir "resource-quotas.yaml"
        $resourceQuotas | Out-File -FilePath $resourceQuotasFile -Encoding UTF8
        $configResults += @{ Platform = "Kubernetes"; File = $resourceQuotasFile; Status = "Created" }
        Write-ColorOutput "✅ Resource quotas created: $resourceQuotasFile" -Color Success
        Write-Log "Resource quotas created: $resourceQuotasFile" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Failed to create tenant isolation policies" -Color Error
        Write-Log "Failed to create tenant isolation policies: $($_.Exception.Message)" "ERROR"
    }
    
    return $configResults
}

function Show-Usage {
    Write-ColorOutput "Multi-Tenant Architecture Configuration Script" -Color Info
    Write-ColorOutput "=============================================" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Usage: .\multi-tenant-architecture.ps1 [OPTIONS]" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Options:" -Color Info
    Write-ColorOutput "  -Action <string>     Action to perform (create, deploy, status, cleanup)" -Color Info
    Write-ColorOutput "  -Platform <string>   Platform to configure (kubernetes, docker, all)" -Color Info
    Write-ColorOutput "  -ConfigPath <string> Path to configuration directory (default: .\config)" -Color Info
    Write-ColorOutput "  -Version <string>    Version to deploy (default: latest)" -Color Info
    Write-ColorOutput "  -Environment <string> Environment (dev, staging, prod) (default: dev)" -Color Info
    Write-ColorOutput "  -Help               Show this help message" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" -Color Info
    Write-ColorOutput "  .\multi-tenant-architecture.ps1 -Action create -Platform kubernetes" -Color Info
    Write-ColorOutput "  .\multi-tenant-architecture.ps1 -Action deploy -Platform all" -Color Info
    Write-ColorOutput "  .\multi-tenant-architecture.ps1 -Action status" -Color Info
    Write-ColorOutput "  .\multi-tenant-architecture.ps1 -Action cleanup -Platform docker" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Available Actions:" -Color Info
    Write-ColorOutput "  create    - Create multi-tenant configuration files" -Color Info
    Write-ColorOutput "  deploy    - Deploy multi-tenant architecture" -Color Info
    Write-ColorOutput "  status    - Show deployment status" -Color Info
    Write-ColorOutput "  cleanup   - Clean up multi-tenant resources" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Available Platforms:" -Color Info
    Write-ColorOutput "  kubernetes - Kubernetes multi-tenant configuration" -Color Info
    Write-ColorOutput "  docker     - Docker multi-tenant configuration" -Color Info
    Write-ColorOutput "  all        - All platforms" -Color Info
}

function Main {
    param(
        [string]$Action = "create",
        [string]$Platform = "all",
        [string]$ConfigPath = ".\config",
        [string]$Version = "latest",
        [string]$Environment = "dev"
    )
    
    # Initialize logging
    Initialize-Logging
    
    Write-ColorOutput "Multi-Tenant Architecture Configuration Script" -Color Info
    Write-ColorOutput "=============================================" -Color Info
    Write-ColorOutput "Action: $Action" -Color Info
    Write-ColorOutput "Platform: $Platform" -Color Info
    Write-ColorOutput "Config Path: $ConfigPath" -Color Info
    Write-ColorOutput "Version: $Version" -Color Info
    Write-ColorOutput "Environment: $Environment" -Color Info
    Write-ColorOutput ""
    
    try {
        $results = @()
        
        switch ($Action.ToLower()) {
            "create" {
                Write-ColorOutput "Creating multi-tenant architecture configuration..." -Color Info
                Write-Log "Creating multi-tenant architecture configuration" "INFO"
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    $k8sResults = Create-KubernetesTenantConfiguration
                    $results += $k8sResults
                }
                
                if ($Platform -eq "all" -or $Platform -eq "docker") {
                    $dockerResults = Create-DockerTenantConfiguration
                    $results += $dockerResults
                }
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    $policyResults = Create-TenantIsolationPolicies
                    $results += $policyResults
                }
                
                Write-ColorOutput "Multi-tenant architecture configuration created successfully!" -Color Success
                Write-Log "Multi-tenant architecture configuration created successfully" "INFO"
            }
            
            "deploy" {
                Write-ColorOutput "Deploying multi-tenant architecture..." -Color Info
                Write-Log "Deploying multi-tenant architecture" "INFO"
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    Write-ColorOutput "Deploying Kubernetes multi-tenant architecture..." -Color Info
                    Write-Log "Deploying Kubernetes multi-tenant architecture" "INFO"
                    
                    # Deploy namespaces
                    $namespacesFile = Join-Path $ConfigPath "kubernetes\namespaces.yaml"
                    if (Test-Path $namespacesFile) {
                        kubectl apply -f $namespacesFile
                        Write-ColorOutput "✅ Kubernetes namespaces deployed" -Color Success
                        Write-Log "Kubernetes namespaces deployed" "INFO"
                    }
                    
                    # Deploy services
                    $servicesFile = Join-Path $ConfigPath "kubernetes\services.yaml"
                    if (Test-Path $servicesFile) {
                        kubectl apply -f $servicesFile
                        Write-ColorOutput "✅ Kubernetes services deployed" -Color Success
                        Write-Log "Kubernetes services deployed" "INFO"
                    }
                    
                    # Deploy network policies
                    $policiesFile = Join-Path $ConfigPath "policies\network-policies.yaml"
                    if (Test-Path $policiesFile) {
                        kubectl apply -f $policiesFile
                        Write-ColorOutput "✅ Network policies deployed" -Color Success
                        Write-Log "Network policies deployed" "INFO"
                    }
                    
                    # Deploy resource quotas
                    $quotasFile = Join-Path $ConfigPath "policies\resource-quotas.yaml"
                    if (Test-Path $quotasFile) {
                        kubectl apply -f $quotasFile
                        Write-ColorOutput "✅ Resource quotas deployed" -Color Success
                        Write-Log "Resource quotas deployed" "INFO"
                    }
                }
                
                if ($Platform -eq "all" -or $Platform -eq "docker") {
                    Write-ColorOutput "Deploying Docker multi-tenant architecture..." -Color Info
                    Write-Log "Deploying Docker multi-tenant architecture" "INFO"
                    
                    $dockerComposeFile = Join-Path $ConfigPath "docker\docker-compose.yml"
                    if (Test-Path $dockerComposeFile) {
                        docker-compose -f $dockerComposeFile up -d
                        Write-ColorOutput "✅ Docker multi-tenant architecture deployed" -Color Success
                        Write-Log "Docker multi-tenant architecture deployed" "INFO"
                    }
                }
                
                Write-ColorOutput "Multi-tenant architecture deployed successfully!" -Color Success
                Write-Log "Multi-tenant architecture deployed successfully" "INFO"
            }
            
            "status" {
                Write-ColorOutput "Checking multi-tenant architecture status..." -Color Info
                Write-Log "Checking multi-tenant architecture status" "INFO"
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    Write-ColorOutput "Kubernetes Status:" -Color Info
                    kubectl get namespaces | Select-String "manageragent\|tenant-"
                    kubectl get services --all-namespaces | Select-String "manageragent\|tenant-"
                    kubectl get networkpolicies --all-namespaces | Select-String "tenant-"
                    kubectl get resourcequotas --all-namespaces | Select-String "tenant-"
                }
                
                if ($Platform -eq "all" -or $Platform -eq "docker") {
                    Write-ColorOutput "Docker Status:" -Color Info
                    docker ps | Select-String "manageragent\|tenant-"
                }
            }
            
            "cleanup" {
                Write-ColorOutput "Cleaning up multi-tenant architecture..." -Color Info
                Write-Log "Cleaning up multi-tenant architecture" "INFO"
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    Write-ColorOutput "Cleaning up Kubernetes resources..." -Color Info
                    Write-Log "Cleaning up Kubernetes resources" "INFO"
                    
                    # Remove namespaces (this will also remove all resources in them)
                    kubectl delete namespace manageragent-multitenant --ignore-not-found=true
                    kubectl delete namespace tenant-1 --ignore-not-found=true
                    kubectl delete namespace tenant-2 --ignore-not-found=true
                    kubectl delete namespace tenant-3 --ignore-not-found=true
                    kubectl delete namespace tenant-4 --ignore-not-found=true
                    kubectl delete namespace tenant-5 --ignore-not-found=true
                    
                    Write-ColorOutput "✅ Kubernetes resources cleaned up" -Color Success
                    Write-Log "Kubernetes resources cleaned up" "INFO"
                }
                
                if ($Platform -eq "all" -or $Platform -eq "docker") {
                    Write-ColorOutput "Cleaning up Docker resources..." -Color Info
                    Write-Log "Cleaning up Docker resources" "INFO"
                    
                    $dockerComposeFile = Join-Path $ConfigPath "docker\docker-compose.yml"
                    if (Test-Path $dockerComposeFile) {
                        docker-compose -f $dockerComposeFile down
                        Write-ColorOutput "✅ Docker resources cleaned up" -Color Success
                        Write-Log "Docker resources cleaned up" "INFO"
                    }
                }
                
                Write-ColorOutput "Multi-tenant architecture cleaned up successfully!" -Color Success
                Write-Log "Multi-tenant architecture cleaned up successfully" "INFO"
            }
            
            default {
                Write-ColorOutput "Unknown action: $Action" -Color Error
                Write-Log "Unknown action: $Action" "ERROR"
                Show-Usage
                return
            }
        }
        
        # Display results
        if ($results.Count -gt 0) {
            Write-ColorOutput ""
            Write-ColorOutput "Configuration Results:" -Color Info
            Write-ColorOutput "====================" -Color Info
            foreach ($result in $results) {
                $statusColor = if ($result.Status -eq "Created") { "Success" } else { "Warning" }
                Write-ColorOutput "✅ $($result.Platform): $($result.File) - $($result.Status)" -Color $statusColor
            }
        }
        
    } catch {
        Write-ColorOutput "❌ Error: $($_.Exception.Message)" -Color Error
        Write-Log "Error: $($_.Exception.Message)" "ERROR"
        exit 1
    }
}

# Main execution
if ($MyInvocation.InvocationName -ne '.') {
    Main -Action $Action -Platform $Platform -ConfigPath $ConfigPath -Version $Version -Environment $Environment
}
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-4-quota
  namespace: tenant-4
spec:
  hard:
    requests.cpu: "2"
    requests.memory: 4Gi
    limits.cpu: "4"
    limits.memory: 8Gi
    persistentvolumeclaims: "4"
"@
        
        $resourceQuotasFile = Join-Path $policiesDir "resource-quotas.yaml"
        $resourceQuotas | Out-File -FilePath $resourceQuotasFile -Encoding UTF8
        $configResults += @{ Platform = "Kubernetes"; File = $resourceQuotasFile; Status = "Created" }
        Write-ColorOutput "✅ Resource quotas created: $resourceQuotasFile" -Color Success
        Write-Log "Resource quotas created: $resourceQuotasFile" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Failed to create tenant isolation policies" -Color Error
        Write-Log "Failed to create tenant isolation policies: $($_.Exception.Message)" "ERROR"
    }
    
    return $configResults
}

function Show-Usage {
    Write-ColorOutput "Multi-Tenant Architecture Configuration Script" -Color Info
    Write-ColorOutput "=============================================" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Usage: .\multi-tenant-architecture.ps1 [OPTIONS]" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Options:" -Color Info
    Write-ColorOutput "  -Action <string>     Action to perform (create, deploy, status, cleanup)" -Color Info
    Write-ColorOutput "  -Platform <string>   Platform to configure (kubernetes, docker, all)" -Color Info
    Write-ColorOutput "  -ConfigPath <string> Path to configuration directory (default: .\config)" -Color Info
    Write-ColorOutput "  -Version <string>    Version to deploy (default: latest)" -Color Info
    Write-ColorOutput "  -Environment <string> Environment (dev, staging, prod) (default: dev)" -Color Info
    Write-ColorOutput "  -Help               Show this help message" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" -Color Info
    Write-ColorOutput "  .\multi-tenant-architecture.ps1 -Action create -Platform kubernetes" -Color Info
    Write-ColorOutput "  .\multi-tenant-architecture.ps1 -Action deploy -Platform all" -Color Info
    Write-ColorOutput "  .\multi-tenant-architecture.ps1 -Action status" -Color Info
    Write-ColorOutput "  .\multi-tenant-architecture.ps1 -Action cleanup -Platform docker" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Available Actions:" -Color Info
    Write-ColorOutput "  create    - Create multi-tenant configuration files" -Color Info
    Write-ColorOutput "  deploy    - Deploy multi-tenant architecture" -Color Info
    Write-ColorOutput "  status    - Show deployment status" -Color Info
    Write-ColorOutput "  cleanup   - Clean up multi-tenant resources" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Available Platforms:" -Color Info
    Write-ColorOutput "  kubernetes - Kubernetes multi-tenant configuration" -Color Info
    Write-ColorOutput "  docker     - Docker multi-tenant configuration" -Color Info
    Write-ColorOutput "  all        - All platforms" -Color Info
}

function Main {
    param(
        [string]$Action = "create",
        [string]$Platform = "all",
        [string]$ConfigPath = ".\config",
        [string]$Version = "latest",
        [string]$Environment = "dev"
    )
    
    # Initialize logging
    Initialize-Logging
    
    Write-ColorOutput "Multi-Tenant Architecture Configuration Script" -Color Info
    Write-ColorOutput "=============================================" -Color Info
    Write-ColorOutput "Action: $Action" -Color Info
    Write-ColorOutput "Platform: $Platform" -Color Info
    Write-ColorOutput "Config Path: $ConfigPath" -Color Info
    Write-ColorOutput "Version: $Version" -Color Info
    Write-ColorOutput "Environment: $Environment" -Color Info
    Write-ColorOutput ""
    
    try {
        $results = @()
        
        switch ($Action.ToLower()) {
            "create" {
                Write-ColorOutput "Creating multi-tenant architecture configuration..." -Color Info
                Write-Log "Creating multi-tenant architecture configuration" "INFO"
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    $k8sResults = Create-KubernetesTenantConfiguration
                    $results += $k8sResults
                }
                
                if ($Platform -eq "all" -or $Platform -eq "docker") {
                    $dockerResults = Create-DockerTenantConfiguration
                    $results += $dockerResults
                }
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    $policyResults = Create-TenantIsolationPolicies
                    $results += $policyResults
                }
                
                Write-ColorOutput "Multi-tenant architecture configuration created successfully!" -Color Success
                Write-Log "Multi-tenant architecture configuration created successfully" "INFO"
            }
            
            "deploy" {
                Write-ColorOutput "Deploying multi-tenant architecture..." -Color Info
                Write-Log "Deploying multi-tenant architecture" "INFO"
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    Write-ColorOutput "Deploying Kubernetes multi-tenant architecture..." -Color Info
                    Write-Log "Deploying Kubernetes multi-tenant architecture" "INFO"
                    
                    # Deploy namespaces
                    $namespacesFile = Join-Path $ConfigPath "kubernetes\namespaces.yaml"
                    if (Test-Path $namespacesFile) {
                        kubectl apply -f $namespacesFile
                        Write-ColorOutput "✅ Kubernetes namespaces deployed" -Color Success
                        Write-Log "Kubernetes namespaces deployed" "INFO"
                    }
                    
                    # Deploy services
                    $servicesFile = Join-Path $ConfigPath "kubernetes\services.yaml"
                    if (Test-Path $servicesFile) {
                        kubectl apply -f $servicesFile
                        Write-ColorOutput "✅ Kubernetes services deployed" -Color Success
                        Write-Log "Kubernetes services deployed" "INFO"
                    }
                    
                    # Deploy network policies
                    $policiesFile = Join-Path $ConfigPath "policies\network-policies.yaml"
                    if (Test-Path $policiesFile) {
                        kubectl apply -f $policiesFile
                        Write-ColorOutput "✅ Network policies deployed" -Color Success
                        Write-Log "Network policies deployed" "INFO"
                    }
                    
                    # Deploy resource quotas
                    $quotasFile = Join-Path $ConfigPath "policies\resource-quotas.yaml"
                    if (Test-Path $quotasFile) {
                        kubectl apply -f $quotasFile
                        Write-ColorOutput "✅ Resource quotas deployed" -Color Success
                        Write-Log "Resource quotas deployed" "INFO"
                    }
                }
                
                if ($Platform -eq "all" -or $Platform -eq "docker") {
                    Write-ColorOutput "Deploying Docker multi-tenant architecture..." -Color Info
                    Write-Log "Deploying Docker multi-tenant architecture" "INFO"
                    
                    $dockerComposeFile = Join-Path $ConfigPath "docker\docker-compose.yml"
                    if (Test-Path $dockerComposeFile) {
                        docker-compose -f $dockerComposeFile up -d
                        Write-ColorOutput "✅ Docker multi-tenant architecture deployed" -Color Success
                        Write-Log "Docker multi-tenant architecture deployed" "INFO"
                    }
                }
                
                Write-ColorOutput "Multi-tenant architecture deployed successfully!" -Color Success
                Write-Log "Multi-tenant architecture deployed successfully" "INFO"
            }
            
            "status" {
                Write-ColorOutput "Checking multi-tenant architecture status..." -Color Info
                Write-Log "Checking multi-tenant architecture status" "INFO"
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    Write-ColorOutput "Kubernetes Status:" -Color Info
                    kubectl get namespaces | Select-String "manageragent\|tenant-"
                    kubectl get services --all-namespaces | Select-String "manageragent\|tenant-"
                    kubectl get networkpolicies --all-namespaces | Select-String "tenant-"
                    kubectl get resourcequotas --all-namespaces | Select-String "tenant-"
                }
                
                if ($Platform -eq "all" -or $Platform -eq "docker") {
                    Write-ColorOutput "Docker Status:" -Color Info
                    docker ps | Select-String "manageragent\|tenant-"
                }
            }
            
            "cleanup" {
                Write-ColorOutput "Cleaning up multi-tenant architecture..." -Color Info
                Write-Log "Cleaning up multi-tenant architecture" "INFO"
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    Write-ColorOutput "Cleaning up Kubernetes resources..." -Color Info
                    Write-Log "Cleaning up Kubernetes resources" "INFO"
                    
                    # Remove namespaces (this will also remove all resources in them)
                    kubectl delete namespace manageragent-multitenant --ignore-not-found=true
                    kubectl delete namespace tenant-1 --ignore-not-found=true
                    kubectl delete namespace tenant-2 --ignore-not-found=true
                    kubectl delete namespace tenant-3 --ignore-not-found=true
                    kubectl delete namespace tenant-4 --ignore-not-found=true
                    kubectl delete namespace tenant-5 --ignore-not-found=true
                    
                    Write-ColorOutput "✅ Kubernetes resources cleaned up" -Color Success
                    Write-Log "Kubernetes resources cleaned up" "INFO"
                }
                
                if ($Platform -eq "all" -or $Platform -eq "docker") {
                    Write-ColorOutput "Cleaning up Docker resources..." -Color Info
                    Write-Log "Cleaning up Docker resources" "INFO"
                    
                    $dockerComposeFile = Join-Path $ConfigPath "docker\docker-compose.yml"
                    if (Test-Path $dockerComposeFile) {
                        docker-compose -f $dockerComposeFile down
                        Write-ColorOutput "✅ Docker resources cleaned up" -Color Success
                        Write-Log "Docker resources cleaned up" "INFO"
                    }
                }
                
                Write-ColorOutput "Multi-tenant architecture cleaned up successfully!" -Color Success
                Write-Log "Multi-tenant architecture cleaned up successfully" "INFO"
            }
            
            default {
                Write-ColorOutput "Unknown action: $Action" -Color Error
                Write-Log "Unknown action: $Action" "ERROR"
                Show-Usage
                return
            }
        }
        
        # Display results
        if ($results.Count -gt 0) {
            Write-ColorOutput ""
            Write-ColorOutput "Configuration Results:" -Color Info
            Write-ColorOutput "====================" -Color Info
            foreach ($result in $results) {
                $statusColor = if ($result.Status -eq "Created") { "Success" } else { "Warning" }
                Write-ColorOutput "✅ $($result.Platform): $($result.File) - $($result.Status)" -Color $statusColor
            }
        }
        
    } catch {
        Write-ColorOutput "❌ Error: $($_.Exception.Message)" -Color Error
        Write-Log "Error: $($_.Exception.Message)" "ERROR"
        exit 1
    }
}

# Main execution
if ($MyInvocation.InvocationName -ne '.') {
    Main -Action $Action -Platform $Platform -ConfigPath $ConfigPath -Version $Version -Environment $Environment
}
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-5-quota
  namespace: tenant-5
spec:
  hard:
    requests.cpu: "2"
    requests.memory: 4Gi
    limits.cpu: "4"
    limits.memory: 8Gi
    persistentvolumeclaims: "4"
"@
        
        $resourceQuotasFile = Join-Path $policiesDir "resource-quotas.yaml"
        $resourceQuotas | Out-File -FilePath $resourceQuotasFile -Encoding UTF8
        $configResults += @{ Platform = "Kubernetes"; File = $resourceQuotasFile; Status = "Created" }
        Write-ColorOutput "✅ Resource quotas created: $resourceQuotasFile" -Color Success
        Write-Log "Resource quotas created: $resourceQuotasFile" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Failed to create tenant isolation policies" -Color Error
        Write-Log "Failed to create tenant isolation policies: $($_.Exception.Message)" "ERROR"
    }
    
    return $configResults
}

function Show-Usage {
    Write-ColorOutput "Multi-Tenant Architecture Configuration Script" -Color Info
    Write-ColorOutput "=============================================" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Usage: .\multi-tenant-architecture.ps1 [OPTIONS]" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Options:" -Color Info
    Write-ColorOutput "  -Action <string>     Action to perform (create, deploy, status, cleanup)" -Color Info
    Write-ColorOutput "  -Platform <string>   Platform to configure (kubernetes, docker, all)" -Color Info
    Write-ColorOutput "  -ConfigPath <string> Path to configuration directory (default: .\config)" -Color Info
    Write-ColorOutput "  -Version <string>    Version to deploy (default: latest)" -Color Info
    Write-ColorOutput "  -Environment <string> Environment (dev, staging, prod) (default: dev)" -Color Info
    Write-ColorOutput "  -Help               Show this help message" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" -Color Info
    Write-ColorOutput "  .\multi-tenant-architecture.ps1 -Action create -Platform kubernetes" -Color Info
    Write-ColorOutput "  .\multi-tenant-architecture.ps1 -Action deploy -Platform all" -Color Info
    Write-ColorOutput "  .\multi-tenant-architecture.ps1 -Action status" -Color Info
    Write-ColorOutput "  .\multi-tenant-architecture.ps1 -Action cleanup -Platform docker" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Available Actions:" -Color Info
    Write-ColorOutput "  create    - Create multi-tenant configuration files" -Color Info
    Write-ColorOutput "  deploy    - Deploy multi-tenant architecture" -Color Info
    Write-ColorOutput "  status    - Show deployment status" -Color Info
    Write-ColorOutput "  cleanup   - Clean up multi-tenant resources" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Available Platforms:" -Color Info
    Write-ColorOutput "  kubernetes - Kubernetes multi-tenant configuration" -Color Info
    Write-ColorOutput "  docker     - Docker multi-tenant configuration" -Color Info
    Write-ColorOutput "  all        - All platforms" -Color Info
}

function Main {
    param(
        [string]$Action = "create",
        [string]$Platform = "all",
        [string]$ConfigPath = ".\config",
        [string]$Version = "latest",
        [string]$Environment = "dev"
    )
    
    # Initialize logging
    Initialize-Logging
    
    Write-ColorOutput "Multi-Tenant Architecture Configuration Script" -Color Info
    Write-ColorOutput "=============================================" -Color Info
    Write-ColorOutput "Action: $Action" -Color Info
    Write-ColorOutput "Platform: $Platform" -Color Info
    Write-ColorOutput "Config Path: $ConfigPath" -Color Info
    Write-ColorOutput "Version: $Version" -Color Info
    Write-ColorOutput "Environment: $Environment" -Color Info
    Write-ColorOutput ""
    
    try {
        $results = @()
        
        switch ($Action.ToLower()) {
            "create" {
                Write-ColorOutput "Creating multi-tenant architecture configuration..." -Color Info
                Write-Log "Creating multi-tenant architecture configuration" "INFO"
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    $k8sResults = Create-KubernetesTenantConfiguration
                    $results += $k8sResults
                }
                
                if ($Platform -eq "all" -or $Platform -eq "docker") {
                    $dockerResults = Create-DockerTenantConfiguration
                    $results += $dockerResults
                }
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    $policyResults = Create-TenantIsolationPolicies
                    $results += $policyResults
                }
                
                Write-ColorOutput "Multi-tenant architecture configuration created successfully!" -Color Success
                Write-Log "Multi-tenant architecture configuration created successfully" "INFO"
            }
            
            "deploy" {
                Write-ColorOutput "Deploying multi-tenant architecture..." -Color Info
                Write-Log "Deploying multi-tenant architecture" "INFO"
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    Write-ColorOutput "Deploying Kubernetes multi-tenant architecture..." -Color Info
                    Write-Log "Deploying Kubernetes multi-tenant architecture" "INFO"
                    
                    # Deploy namespaces
                    $namespacesFile = Join-Path $ConfigPath "kubernetes\namespaces.yaml"
                    if (Test-Path $namespacesFile) {
                        kubectl apply -f $namespacesFile
                        Write-ColorOutput "✅ Kubernetes namespaces deployed" -Color Success
                        Write-Log "Kubernetes namespaces deployed" "INFO"
                    }
                    
                    # Deploy services
                    $servicesFile = Join-Path $ConfigPath "kubernetes\services.yaml"
                    if (Test-Path $servicesFile) {
                        kubectl apply -f $servicesFile
                        Write-ColorOutput "✅ Kubernetes services deployed" -Color Success
                        Write-Log "Kubernetes services deployed" "INFO"
                    }
                    
                    # Deploy network policies
                    $policiesFile = Join-Path $ConfigPath "policies\network-policies.yaml"
                    if (Test-Path $policiesFile) {
                        kubectl apply -f $policiesFile
                        Write-ColorOutput "✅ Network policies deployed" -Color Success
                        Write-Log "Network policies deployed" "INFO"
                    }
                    
                    # Deploy resource quotas
                    $quotasFile = Join-Path $ConfigPath "policies\resource-quotas.yaml"
                    if (Test-Path $quotasFile) {
                        kubectl apply -f $quotasFile
                        Write-ColorOutput "✅ Resource quotas deployed" -Color Success
                        Write-Log "Resource quotas deployed" "INFO"
                    }
                }
                
                if ($Platform -eq "all" -or $Platform -eq "docker") {
                    Write-ColorOutput "Deploying Docker multi-tenant architecture..." -Color Info
                    Write-Log "Deploying Docker multi-tenant architecture" "INFO"
                    
                    $dockerComposeFile = Join-Path $ConfigPath "docker\docker-compose.yml"
                    if (Test-Path $dockerComposeFile) {
                        docker-compose -f $dockerComposeFile up -d
                        Write-ColorOutput "✅ Docker multi-tenant architecture deployed" -Color Success
                        Write-Log "Docker multi-tenant architecture deployed" "INFO"
                    }
                }
                
                Write-ColorOutput "Multi-tenant architecture deployed successfully!" -Color Success
                Write-Log "Multi-tenant architecture deployed successfully" "INFO"
            }
            
            "status" {
                Write-ColorOutput "Checking multi-tenant architecture status..." -Color Info
                Write-Log "Checking multi-tenant architecture status" "INFO"
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    Write-ColorOutput "Kubernetes Status:" -Color Info
                    kubectl get namespaces | Select-String "manageragent\|tenant-"
                    kubectl get services --all-namespaces | Select-String "manageragent\|tenant-"
                    kubectl get networkpolicies --all-namespaces | Select-String "tenant-"
                    kubectl get resourcequotas --all-namespaces | Select-String "tenant-"
                }
                
                if ($Platform -eq "all" -or $Platform -eq "docker") {
                    Write-ColorOutput "Docker Status:" -Color Info
                    docker ps | Select-String "manageragent\|tenant-"
                }
            }
            
            "cleanup" {
                Write-ColorOutput "Cleaning up multi-tenant architecture..." -Color Info
                Write-Log "Cleaning up multi-tenant architecture" "INFO"
                
                if ($Platform -eq "all" -or $Platform -eq "kubernetes") {
                    Write-ColorOutput "Cleaning up Kubernetes resources..." -Color Info
                    Write-Log "Cleaning up Kubernetes resources" "INFO"
                    
                    # Remove namespaces (this will also remove all resources in them)
                    kubectl delete namespace manageragent-multitenant --ignore-not-found=true
                    kubectl delete namespace tenant-1 --ignore-not-found=true
                    kubectl delete namespace tenant-2 --ignore-not-found=true
                    kubectl delete namespace tenant-3 --ignore-not-found=true
                    kubectl delete namespace tenant-4 --ignore-not-found=true
                    kubectl delete namespace tenant-5 --ignore-not-found=true
                    
                    Write-ColorOutput "✅ Kubernetes resources cleaned up" -Color Success
                    Write-Log "Kubernetes resources cleaned up" "INFO"
                }
                
                if ($Platform -eq "all" -or $Platform -eq "docker") {
                    Write-ColorOutput "Cleaning up Docker resources..." -Color Info
                    Write-Log "Cleaning up Docker resources" "INFO"
                    
                    $dockerComposeFile = Join-Path $ConfigPath "docker\docker-compose.yml"
                    if (Test-Path $dockerComposeFile) {
                        docker-compose -f $dockerComposeFile down
                        Write-ColorOutput "✅ Docker resources cleaned up" -Color Success
                        Write-Log "Docker resources cleaned up" "INFO"
                    }
                }
                
                Write-ColorOutput "Multi-tenant architecture cleaned up successfully!" -Color Success
                Write-Log "Multi-tenant architecture cleaned up successfully" "INFO"
            }
            
            default {
                Write-ColorOutput "Unknown action: $Action" -Color Error
                Write-Log "Unknown action: $Action" "ERROR"
                Show-Usage
                return
            }
        }
        
        # Display results
        if ($results.Count -gt 0) {
            Write-ColorOutput ""
            Write-ColorOutput "Configuration Results:" -Color Info
            Write-ColorOutput "====================" -Color Info
            foreach ($result in $results) {
                $statusColor = if ($result.Status -eq "Created") { "Success" } else { "Warning" }
                Write-ColorOutput "✅ $($result.Platform): $($result.File) - $($result.Status)" -Color $statusColor
            }
        }
        
    } catch {
        Write-ColorOutput "❌ Error: $($_.Exception.Message)" -Color Error
        Write-Log "Error: $($_.Exception.Message)" "ERROR"
        exit 1
    }
}

# Main execution
if ($MyInvocation.InvocationName -ne '.') {
    Main -Action $Action -Platform $Platform -ConfigPath $ConfigPath -Version $Version -Environment $Environment
}
