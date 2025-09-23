#!/bin/bash

# Edge Computing Enhanced v3.1 Deployment Script
# Version: 3.1.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="edge-computing"
APP_NAME="edge-computing-enhanced"
VERSION="3.1.0"
IMAGE_NAME="${APP_NAME}:${VERSION}"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    log_success "kubectl is available"
}

# Check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    log_success "Docker is available"
}

# Build Docker image
build_image() {
    log_info "Building Docker image: ${IMAGE_NAME}"
    docker build -t ${IMAGE_NAME} .
    log_success "Docker image built successfully"
}

# Create namespace
create_namespace() {
    log_info "Creating namespace: ${NAMESPACE}"
    kubectl apply -f k8s/namespace.yaml
    log_success "Namespace created successfully"
}

# Deploy ConfigMap
deploy_configmap() {
    log_info "Deploying ConfigMap"
    kubectl apply -f k8s/configmap.yaml
    log_success "ConfigMap deployed successfully"
}

# Deploy application
deploy_app() {
    log_info "Deploying application"
    kubectl apply -f k8s/deployment.yaml
    log_success "Application deployed successfully"
}

# Deploy services
deploy_services() {
    log_info "Deploying services"
    kubectl apply -f k8s/service.yaml
    log_success "Services deployed successfully"
}

# Deploy HPA
deploy_hpa() {
    log_info "Deploying HorizontalPodAutoscaler"
    kubectl apply -f k8s/hpa.yaml
    log_success "HPA deployed successfully"
}

# Wait for deployment
wait_for_deployment() {
    log_info "Waiting for deployment to be ready"
    kubectl wait --for=condition=available --timeout=300s deployment/${APP_NAME} -n ${NAMESPACE}
    log_success "Deployment is ready"
}

# Get deployment status
get_status() {
    log_info "Getting deployment status"
    kubectl get pods -n ${NAMESPACE}
    kubectl get services -n ${NAMESPACE}
    kubectl get hpa -n ${NAMESPACE}
}

# Main deployment function
deploy() {
    log_info "Starting deployment of Edge Computing Enhanced v3.1"
    
    check_kubectl
    check_docker
    
    build_image
    create_namespace
    deploy_configmap
    deploy_app
    deploy_services
    deploy_hpa
    
    wait_for_deployment
    get_status
    
    log_success "Deployment completed successfully!"
    log_info "Application is available at: http://localhost:3000"
    log_info "Health check: http://localhost:3000/health"
    log_info "Status: http://localhost:3000/status"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up deployment"
    kubectl delete -f k8s/ --ignore-not-found=true
    log_success "Cleanup completed"
}

# Show help
show_help() {
    echo "Edge Computing Enhanced v3.1 Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy     Deploy the application"
    echo "  cleanup    Clean up the deployment"
    echo "  status     Show deployment status"
    echo "  help       Show this help message"
    echo ""
}

# Main script logic
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    cleanup)
        cleanup
        ;;
    status)
        get_status
        ;;
    help)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
