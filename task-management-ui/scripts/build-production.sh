#!/bin/bash

# Production Build Script for Task Management UI
set -e

echo "🚀 Starting production build process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check Node.js version
check_node_version() {
    print_status "Checking Node.js version..."
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    print_success "Node.js version check passed: $(node -v)"
}

# Clean previous builds
clean_build() {
    print_status "Cleaning previous builds..."
    rm -rf dist
    rm -rf node_modules/.vite
    print_success "Build directories cleaned"
}

# Install dependencies
install_dependencies() {
    print_status "Installing production dependencies..."
    npm ci --only=production
    print_success "Dependencies installed successfully"
}

# Run security audit
run_security_audit() {
    print_status "Running security audit..."
    if npm audit --audit-level moderate; then
        print_success "Security audit passed"
    else
        print_warning "Security vulnerabilities found. Please review and fix before deploying to production."
        read -p "Continue with build? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Run linting
run_linting() {
    print_status "Running linting checks..."
    if npm run lint; then
        print_success "Linting passed"
    else
        print_error "Linting failed. Please fix linting errors before building."
        exit 1
    fi
}

# Run type checking
run_type_check() {
    print_status "Running TypeScript type checking..."
    if npm run type-check; then
        print_success "Type checking passed"
    else
        print_error "Type checking failed. Please fix type errors before building."
        exit 1
    fi
}

# Run tests
run_tests() {
    print_status "Running tests..."
    if npm run test; then
        print_success "Tests passed"
    else
        print_error "Tests failed. Please fix failing tests before building."
        exit 1
    fi
}

# Build application
build_application() {
    print_status "Building application for production..."
    
    # Set production environment
    export NODE_ENV=production
    
    # Use production Vite config if available
    if [ -f "vite.config.prod.ts" ]; then
        print_status "Using production Vite configuration..."
        npx vite build --config vite.config.prod.ts
    else
        npm run build
    fi
    
    print_success "Application built successfully"
}

# Analyze bundle size
analyze_bundle() {
    print_status "Analyzing bundle size..."
    
    # Install bundle analyzer if not present
    if ! command -v npx &> /dev/null; then
        print_warning "npx not available, skipping bundle analysis"
        return
    fi
    
    # Generate bundle analysis
    if [ -d "dist" ]; then
        du -sh dist/
        find dist -name "*.js" -exec ls -lh {} \; | sort -k5 -hr | head -10
        print_success "Bundle analysis completed"
    else
        print_warning "Build directory not found, skipping bundle analysis"
    fi
}

# Optimize assets
optimize_assets() {
    print_status "Optimizing assets..."
    
    # Compress images if imagemin is available
    if command -v imagemin &> /dev/null; then
        find dist -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | xargs imagemin --out-dir=dist/optimized
        print_success "Images optimized"
    else
        print_warning "imagemin not available, skipping image optimization"
    fi
    
    # Generate service worker
    if [ -f "public/sw.js" ]; then
        cp public/sw.js dist/
        print_success "Service worker copied"
    fi
}

# Generate build report
generate_build_report() {
    print_status "Generating build report..."
    
    BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    BUILD_VERSION=$(npm pkg get version | tr -d '"')
    BUILD_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    
    cat > dist/build-info.json << EOF
{
  "version": "$BUILD_VERSION",
  "buildTime": "$BUILD_TIME",
  "gitHash": "$BUILD_HASH",
  "nodeVersion": "$(node -v)",
  "environment": "production"
}
EOF
    
    print_success "Build report generated: dist/build-info.json"
}

# Validate build
validate_build() {
    print_status "Validating build..."
    
    # Check if essential files exist
    if [ ! -f "dist/index.html" ]; then
        print_error "index.html not found in build output"
        exit 1
    fi
    
    # Check if assets directory exists
    if [ ! -d "dist/assets" ]; then
        print_error "Assets directory not found in build output"
        exit 1
    fi
    
    # Check build size
    BUILD_SIZE=$(du -sh dist | cut -f1)
    print_status "Total build size: $BUILD_SIZE"
    
    # Warn if build is too large
    BUILD_SIZE_MB=$(du -sm dist | cut -f1)
    if [ "$BUILD_SIZE_MB" -gt 50 ]; then
        print_warning "Build size is quite large ($BUILD_SIZE). Consider optimizing."
    fi
    
    print_success "Build validation completed"
}

# Create deployment package
create_deployment_package() {
    print_status "Creating deployment package..."
    
    # Create deployment directory
    mkdir -p deployment
    
    # Copy build files
    cp -r dist deployment/
    
    # Copy Docker files
    cp Dockerfile deployment/
    cp nginx.conf deployment/
    cp docker-entrypoint.sh deployment/
    
    # Copy environment files
    cp .env.production deployment/
    
    # Create deployment archive
    tar -czf "deployment/task-management-ui-$(date +%Y%m%d-%H%M%S).tar.gz" -C deployment dist Dockerfile nginx.conf docker-entrypoint.sh .env.production
    
    print_success "Deployment package created in deployment/ directory"
}

# Main execution
main() {
    print_status "Starting production build process..."
    
    # Parse command line arguments
    SKIP_TESTS=false
    SKIP_AUDIT=false
    CREATE_PACKAGE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-audit)
                SKIP_AUDIT=true
                shift
                ;;
            --create-package)
                CREATE_PACKAGE=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --skip-tests     Skip running tests"
                echo "  --skip-audit     Skip security audit"
                echo "  --create-package Create deployment package"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Execute build steps
    check_node_version
    clean_build
    install_dependencies
    
    if [ "$SKIP_AUDIT" = false ]; then
        run_security_audit
    fi
    
    run_linting
    run_type_check
    
    if [ "$SKIP_TESTS" = false ]; then
        run_tests
    fi
    
    build_application
    analyze_bundle
    optimize_assets
    generate_build_report
    validate_build
    
    if [ "$CREATE_PACKAGE" = true ]; then
        create_deployment_package
    fi
    
    print_success "🎉 Production build completed successfully!"
    print_status "Build output available in: dist/"
    
    if [ "$CREATE_PACKAGE" = true ]; then
        print_status "Deployment package available in: deployment/"
    fi
}

# Run main function with all arguments
main "$@"