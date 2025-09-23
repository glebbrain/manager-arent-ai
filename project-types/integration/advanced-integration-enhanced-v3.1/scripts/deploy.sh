#!/bin/bash

# Advanced Integration Enhanced v3.1 Deployment Script
# This script deploys the Advanced Integration Enhanced v3.1 module to Kubernetes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="advanced-integration-v3-1"
APP_NAME="advanced-integration"
VERSION="3.1"

echo -e "${BLUE}🚀 Starting Advanced Integration Enhanced v3.1 deployment...${NC}"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed or not in PATH${NC}"
    exit 1
fi

# Check if we can connect to Kubernetes cluster
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Cannot connect to Kubernetes cluster${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Kubernetes cluster connection verified${NC}"

# Create namespace
echo -e "${YELLOW}📦 Creating namespace...${NC}"
kubectl apply -f k8s/namespace.yaml

# Apply ConfigMap
echo -e "${YELLOW}⚙️  Applying configuration...${NC}"
kubectl apply -f k8s/configmap.yaml

# Apply Deployment
echo -e "${YELLOW}🚀 Deploying application...${NC}"
kubectl apply -f k8s/deployment.yaml

# Apply Service
echo -e "${YELLOW}🌐 Creating service...${NC}"
kubectl apply -f k8s/service.yaml

# Apply HPA
echo -e "${YELLOW}📈 Setting up autoscaling...${NC}"
kubectl apply -f k8s/hpa.yaml

# Wait for deployment to be ready
echo -e "${YELLOW}⏳ Waiting for deployment to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/advanced-integration-deployment -n $NAMESPACE

# Get deployment status
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${BLUE}📊 Deployment status:${NC}"
kubectl get deployment advanced-integration-deployment -n $NAMESPACE

echo -e "${BLUE}🔍 Pod status:${NC}"
kubectl get pods -n $NAMESPACE -l app=advanced-integration

echo -e "${BLUE}🌐 Service status:${NC}"
kubectl get service advanced-integration-service -n $NAMESPACE

echo -e "${BLUE}📈 HPA status:${NC}"
kubectl get hpa advanced-integration-hpa -n $NAMESPACE

echo -e "${GREEN}🎉 Advanced Integration Enhanced v3.1 is now running!${NC}"
echo -e "${YELLOW}💡 To access the service, use port-forward:${NC}"
echo -e "${YELLOW}   kubectl port-forward service/advanced-integration-service 3000:80 -n $NAMESPACE${NC}"
echo -e "${YELLOW}💡 Available endpoints:${NC}"
echo -e "${YELLOW}   - Health: http://localhost:3000/health${NC}"
echo -e "${YELLOW}   - Metrics: http://localhost:3000/metrics${NC}"
echo -e "${YELLOW}   - IoT API: http://localhost:3000/api/iot/*${NC}"
echo -e "${YELLOW}   - 5G API: http://localhost:3000/api/5g/*${NC}"
echo -e "${YELLOW}   - AR/VR API: http://localhost:3000/api/arvr/*${NC}"
echo -e "${YELLOW}   - Blockchain API: http://localhost:3000/api/blockchain/*${NC}"
echo -e "${YELLOW}   - Quantum API: http://localhost:3000/api/quantum/*${NC}"
