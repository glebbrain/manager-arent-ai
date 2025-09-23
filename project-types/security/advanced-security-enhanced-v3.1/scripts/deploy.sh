#!/bin/bash

# Advanced Security Enhancement v3.1 Deployment Script
# Version: 3.1.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="advanced-security"
APP_NAME="advanced-security"
VERSION="3.1.0"
IMAGE_NAME="advanced-security-v3.1"

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

# Check if kubectl is installed
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    log_success "kubectl is available"
}

# Check if cluster is accessible
check_cluster() {
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    log_success "Kubernetes cluster is accessible"
}

# Create namespace
create_namespace() {
    log_info "Creating namespace: $NAMESPACE"
    kubectl apply -f k8s/namespace.yaml
    log_success "Namespace created"
}

# Create secrets
create_secrets() {
    log_info "Creating secrets"
    
    # Create blockchain secrets if they don't exist
    if ! kubectl get secret blockchain-secrets -n $NAMESPACE &> /dev/null; then
        kubectl create secret generic blockchain-secrets \
            --from-literal=contract-address="0x0000000000000000000000000000000000000000" \
            --from-literal=private-key="0x0000000000000000000000000000000000000000000000000000000000000000" \
            -n $NAMESPACE
        log_success "Blockchain secrets created"
    else
        log_warning "Blockchain secrets already exist"
    fi
}

# Deploy application
deploy_app() {
    log_info "Deploying Advanced Security Enhancement v3.1"
    
    # Apply ConfigMap
    kubectl apply -f k8s/configmap.yaml
    log_success "ConfigMap applied"
    
    # Apply Deployment
    kubectl apply -f k8s/deployment.yaml
    log_success "Deployment applied"
    
    # Apply Service
    kubectl apply -f k8s/service.yaml
    log_success "Service applied"
    
    # Apply HPA
    kubectl apply -f k8s/hpa.yaml
    log_success "HPA applied"
}

# Wait for deployment
wait_for_deployment() {
    log_info "Waiting for deployment to be ready"
    kubectl wait --for=condition=available --timeout=300s deployment/$APP_NAME -n $NAMESPACE
    log_success "Deployment is ready"
}

# Show status
show_status() {
    log_info "Deployment status:"
    kubectl get pods -n $NAMESPACE
    echo
    kubectl get services -n $NAMESPACE
    echo
    kubectl get hpa -n $NAMESPACE
}

# Show logs
show_logs() {
    log_info "Showing logs for $APP_NAME:"
    kubectl logs -l app=$APP_NAME -n $NAMESPACE --tail=50
}

# Cleanup
cleanup() {
    log_info "Cleaning up deployment"
    kubectl delete -f k8s/ --ignore-not-found=true
    log_success "Cleanup completed"
}

# Main deployment function
deploy() {
    log_info "Starting Advanced Security Enhancement v3.1 deployment"
    
    check_kubectl
    check_cluster
    create_namespace
    create_secrets
    deploy_app
    wait_for_deployment
    show_status
    
    log_success "Deployment completed successfully!"
    log_info "You can access the application at:"
    kubectl get service advanced-security-nodeport -n $NAMESPACE -o jsonpath='{.spec.clusterIP}:{.spec.ports[0].port}'
}

# Main function
main() {
    case "${1:-deploy}" in
        deploy)
            deploy
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        cleanup)
            cleanup
            ;;
        *)
            echo "Usage: $0 {deploy|status|logs|cleanup}"
            echo "  deploy  - Deploy the application (default)"
            echo "  status  - Show deployment status"
            echo "  logs    - Show application logs"
            echo "  cleanup - Remove the deployment"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
