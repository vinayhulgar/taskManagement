#!/bin/bash

# Comprehensive E2E Test Runner Script
set -e

echo "🚀 Starting comprehensive E2E test suite..."

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

# Check if Node.js version is compatible
check_node_version() {
    print_status "Checking Node.js version..."
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    print_success "Node.js version check passed: $(node -v)"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci
    print_success "Dependencies installed successfully"
}

# Install Playwright browsers
install_browsers() {
    print_status "Installing Playwright browsers..."
    if npx playwright install --with-deps; then
        print_success "Playwright browsers installed successfully"
    else
        print_warning "Playwright browser installation failed, continuing with existing browsers..."
    fi
}

# Run linting
run_linting() {
    print_status "Running linting checks..."
    if npm run lint; then
        print_success "Linting passed"
    else
        print_error "Linting failed"
        exit 1
    fi
}

# Run type checking
run_type_check() {
    print_status "Running TypeScript type checking..."
    if npm run type-check; then
        print_success "Type checking passed"
    else
        print_error "Type checking failed"
        exit 1
    fi
}

# Run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    if npm run test:coverage; then
        print_success "Unit tests passed"
    else
        print_error "Unit tests failed"
        exit 1
    fi
}

# Run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    if npm run test:integration; then
        print_success "Integration tests passed"
    else
        print_error "Integration tests failed"
        exit 1
    fi
}

# Build application
build_application() {
    print_status "Building application..."
    if npm run build; then
        print_success "Application built successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Start development server in background
start_dev_server() {
    print_status "Starting development server..."
    npm run dev &
    DEV_SERVER_PID=$!
    
    # Wait for server to start
    print_status "Waiting for development server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:5173 > /dev/null; then
            print_success "Development server is running"
            return 0
        fi
        sleep 2
    done
    
    print_error "Development server failed to start"
    kill $DEV_SERVER_PID 2>/dev/null || true
    exit 1
}

# Run E2E tests
run_e2e_tests() {
    print_status "Running E2E tests..."
    
    # Run different test suites
    local failed_tests=()
    
    # Authentication tests
    print_status "Running authentication tests..."
    if npx playwright test e2e/auth.spec.ts; then
        print_success "Authentication tests passed"
    else
        print_error "Authentication tests failed"
        failed_tests+=("authentication")
    fi
    
    # Dashboard tests
    print_status "Running dashboard tests..."
    if npx playwright test e2e/dashboard.spec.ts; then
        print_success "Dashboard tests passed"
    else
        print_error "Dashboard tests failed"
        failed_tests+=("dashboard")
    fi
    
    # Task management tests
    print_status "Running task management tests..."
    if npx playwright test e2e/tasks.spec.ts; then
        print_success "Task management tests passed"
    else
        print_error "Task management tests failed"
        failed_tests+=("tasks")
    fi
    
    # Team management tests
    print_status "Running team management tests..."
    if npx playwright test e2e/teams.spec.ts; then
        print_success "Team management tests passed"
    else
        print_error "Team management tests failed"
        failed_tests+=("teams")
    fi
    
    # Project management tests
    print_status "Running project management tests..."
    if npx playwright test e2e/projects.spec.ts; then
        print_success "Project management tests passed"
    else
        print_error "Project management tests failed"
        failed_tests+=("projects")
    fi
    
    # Accessibility tests
    print_status "Running accessibility tests..."
    if npx playwright test e2e/accessibility.spec.ts; then
        print_success "Accessibility tests passed"
    else
        print_error "Accessibility tests failed"
        failed_tests+=("accessibility")
    fi
    
    # Responsive design tests
    print_status "Running responsive design tests..."
    if npx playwright test e2e/responsive.spec.ts; then
        print_success "Responsive design tests passed"
    else
        print_error "Responsive design tests failed"
        failed_tests+=("responsive")
    fi
    
    # API integration tests
    print_status "Running API integration tests..."
    if npx playwright test e2e/api-integration.spec.ts; then
        print_success "API integration tests passed"
    else
        print_error "API integration tests failed"
        failed_tests+=("api-integration")
    fi
    
    # Error handling tests
    print_status "Running error handling tests..."
    if npx playwright test e2e/error-handling.spec.ts; then
        print_success "Error handling tests passed"
    else
        print_error "Error handling tests failed"
        failed_tests+=("error-handling")
    fi
    
    # Check if any tests failed
    if [ ${#failed_tests[@]} -gt 0 ]; then
        print_error "The following test suites failed: ${failed_tests[*]}"
        return 1
    else
        print_success "All E2E tests passed!"
        return 0
    fi
}

# Run cross-browser tests
run_cross_browser_tests() {
    print_status "Running cross-browser tests..."
    
    local browsers=("chromium" "firefox" "webkit")
    local failed_browsers=()
    
    for browser in "${browsers[@]}"; do
        print_status "Testing on $browser..."
        if npx playwright test --project="$browser" e2e/auth.spec.ts e2e/dashboard.spec.ts; then
            print_success "$browser tests passed"
        else
            print_error "$browser tests failed"
            failed_browsers+=("$browser")
        fi
    done
    
    if [ ${#failed_browsers[@]} -gt 0 ]; then
        print_error "Cross-browser tests failed on: ${failed_browsers[*]}"
        return 1
    else
        print_success "All cross-browser tests passed!"
        return 0
    fi
}

# Generate test report
generate_report() {
    print_status "Generating test report..."
    
    # Create reports directory
    mkdir -p reports
    
    # Generate HTML report
    if [ -d "playwright-report" ]; then
        cp -r playwright-report reports/
        print_success "Playwright HTML report available at reports/playwright-report/index.html"
    fi
    
    # Generate coverage report
    if [ -d "coverage" ]; then
        cp -r coverage reports/
        print_success "Coverage report available at reports/coverage/index.html"
    fi
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    
    # Kill development server if running
    if [ ! -z "$DEV_SERVER_PID" ]; then
        kill $DEV_SERVER_PID 2>/dev/null || true
        print_status "Development server stopped"
    fi
    
    # Kill any remaining processes
    pkill -f "vite" 2>/dev/null || true
    pkill -f "playwright" 2>/dev/null || true
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Main execution
main() {
    print_status "Starting comprehensive E2E test suite..."
    
    # Parse command line arguments
    RUN_UNIT_TESTS=true
    RUN_E2E_TESTS=true
    RUN_CROSS_BROWSER=false
    SKIP_BUILD=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-unit)
                RUN_UNIT_TESTS=false
                shift
                ;;
            --skip-e2e)
                RUN_E2E_TESTS=false
                shift
                ;;
            --cross-browser)
                RUN_CROSS_BROWSER=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --skip-unit      Skip unit tests"
                echo "  --skip-e2e       Skip E2E tests"
                echo "  --cross-browser  Run cross-browser tests"
                echo "  --skip-build     Skip application build"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run test suite
    check_node_version
    install_dependencies
    install_browsers
    run_linting
    run_type_check
    
    if [ "$RUN_UNIT_TESTS" = true ]; then
        run_unit_tests
        run_integration_tests
    fi
    
    if [ "$SKIP_BUILD" = false ]; then
        build_application
    fi
    
    if [ "$RUN_E2E_TESTS" = true ]; then
        start_dev_server
        run_e2e_tests
        
        if [ "$RUN_CROSS_BROWSER" = true ]; then
            run_cross_browser_tests
        fi
    fi
    
    generate_report
    
    print_success "🎉 All tests completed successfully!"
}

# Run main function with all arguments
main "$@"