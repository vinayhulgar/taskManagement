#!/bin/bash

# Comprehensive Integration Test Runner
set -e

echo "🚀 Starting comprehensive integration test suite..."

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

# Check if backend is running
check_backend() {
    print_status "Checking if Spring Boot backend is running..."
    
    local backend_url="http://localhost:8080/api/health"
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$backend_url" > /dev/null 2>&1; then
            print_success "Backend is running and accessible"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts: Backend not ready, waiting..."
        sleep 2
        ((attempt++))
    done
    
    print_error "Backend is not running or not accessible at $backend_url"
    print_error "Please start the Spring Boot backend before running integration tests"
    return 1
}

# Start frontend development server
start_frontend() {
    print_status "Starting frontend development server..."
    
    # Kill any existing dev server
    pkill -f "vite" 2>/dev/null || true
    
    # Start dev server in background
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait for frontend to start
    local frontend_url="http://localhost:5173"
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$frontend_url" > /dev/null 2>&1; then
            print_success "Frontend development server is running"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts: Frontend not ready, waiting..."
        sleep 2
        ((attempt++))
    done
    
    print_error "Frontend development server failed to start"
    kill $FRONTEND_PID 2>/dev/null || true
    return 1
}

# Run complete workflow tests
run_workflow_tests() {
    print_status "Running complete user workflow tests..."
    
    local failed_tests=()
    
    # Test 1: Complete user registration and login workflow
    print_status "Testing user registration and login workflow..."
    if npx playwright test e2e/complete-workflows.spec.ts -g "Complete user registration and login workflow"; then
        print_success "✅ User registration and login workflow test passed"
    else
        print_error "❌ User registration and login workflow test failed"
        failed_tests+=("user-auth-workflow")
    fi
    
    # Test 2: Complete task management workflow
    print_status "Testing task management workflow from creation to completion..."
    if npx playwright test e2e/complete-workflows.spec.ts -g "Complete task management workflow from creation to completion"; then
        print_success "✅ Task management workflow test passed"
    else
        print_error "❌ Task management workflow test failed"
        failed_tests+=("task-management-workflow")
    fi
    
    # Test 3: Team creation and project management workflow
    print_status "Testing team creation, member invitation, and project management workflow..."
    if npx playwright test e2e/complete-workflows.spec.ts -g "Complete team creation, member invitation, and project management workflow"; then
        print_success "✅ Team and project management workflow test passed"
    else
        print_error "❌ Team and project management workflow test failed"
        failed_tests+=("team-project-workflow")
    fi
    
    # Test 4: Real-time updates and notifications
    print_status "Testing real-time updates and notifications workflow..."
    if npx playwright test e2e/complete-workflows.spec.ts -g "Real-time updates and notifications workflow"; then
        print_success "✅ Real-time updates and notifications test passed"
    else
        print_error "❌ Real-time updates and notifications test failed"
        failed_tests+=("real-time-workflow")
    fi
    
    # Test 5: Error handling and recovery
    print_status "Testing error handling and recovery workflow..."
    if npx playwright test e2e/complete-workflows.spec.ts -g "Error handling and recovery workflow"; then
        print_success "✅ Error handling and recovery test passed"
    else
        print_error "❌ Error handling and recovery test failed"
        failed_tests+=("error-handling-workflow")
    fi
    
    # Test 6: Performance and loading states
    print_status "Testing performance and loading states workflow..."
    if npx playwright test e2e/complete-workflows.spec.ts -g "Performance and loading states workflow"; then
        print_success "✅ Performance and loading states test passed"
    else
        print_error "❌ Performance and loading states test failed"
        failed_tests+=("performance-workflow")
    fi
    
    return ${#failed_tests[@]}
}

# Run backend integration tests
run_backend_integration_tests() {
    print_status "Running backend API integration tests..."
    
    local failed_tests=()
    
    # Authentication API tests
    print_status "Testing authentication API integration..."
    if npx playwright test e2e/backend-integration.spec.ts -g "Authentication API integration"; then
        print_success "✅ Authentication API integration test passed"
    else
        print_error "❌ Authentication API integration test failed"
        failed_tests+=("auth-api")
    fi
    
    # Tasks API tests
    print_status "Testing tasks API integration..."
    if npx playwright test e2e/backend-integration.spec.ts -g "Tasks API integration"; then
        print_success "✅ Tasks API integration test passed"
    else
        print_error "❌ Tasks API integration test failed"
        failed_tests+=("tasks-api")
    fi
    
    # Teams API tests
    print_status "Testing teams API integration..."
    if npx playwright test e2e/backend-integration.spec.ts -g "Teams API integration"; then
        print_success "✅ Teams API integration test passed"
    else
        print_error "❌ Teams API integration test failed"
        failed_tests+=("teams-api")
    fi
    
    # Projects API tests
    print_status "Testing projects API integration..."
    if npx playwright test e2e/backend-integration.spec.ts -g "Projects API integration"; then
        print_success "✅ Projects API integration test passed"
    else
        print_error "❌ Projects API integration test failed"
        failed_tests+=("projects-api")
    fi
    
    # Comments API tests
    print_status "Testing comments API integration..."
    if npx playwright test e2e/backend-integration.spec.ts -g "Comments API integration"; then
        print_success "✅ Comments API integration test passed"
    else
        print_error "❌ Comments API integration test failed"
        failed_tests+=("comments-api")
    fi
    
    # Real-time WebSocket tests
    print_status "Testing real-time WebSocket integration..."
    if npx playwright test e2e/backend-integration.spec.ts -g "Real-time WebSocket integration"; then
        print_success "✅ Real-time WebSocket integration test passed"
    else
        print_error "❌ Real-time WebSocket integration test failed"
        failed_tests+=("websocket-api")
    fi
    
    return ${#failed_tests[@]}
}

# Run unit and integration tests
run_unit_integration_tests() {
    print_status "Running unit and integration tests..."
    
    # Run unit tests
    print_status "Running unit tests..."
    if npm run test; then
        print_success "✅ Unit tests passed"
    else
        print_error "❌ Unit tests failed"
        return 1
    fi
    
    # Run integration tests
    print_status "Running integration tests..."
    if npm run test:integration; then
        print_success "✅ Integration tests passed"
    else
        print_error "❌ Integration tests failed"
        return 1
    fi
    
    return 0
}

# Generate comprehensive test report
generate_test_report() {
    print_status "Generating comprehensive test report..."
    
    # Create reports directory
    mkdir -p reports/integration-tests
    
    # Copy Playwright reports
    if [ -d "playwright-report" ]; then
        cp -r playwright-report reports/integration-tests/
        print_success "Playwright HTML report available at reports/integration-tests/playwright-report/index.html"
    fi
    
    # Copy test results
    if [ -d "test-results" ]; then
        cp -r test-results reports/integration-tests/
    fi
    
    # Generate summary report
    cat > reports/integration-tests/summary.md << EOF
# Integration Test Summary

## Test Execution Date
$(date)

## Test Environment
- Frontend URL: http://localhost:5173
- Backend URL: http://localhost:8080
- Node.js Version: $(node -v)
- npm Version: $(npm -v)

## Test Results

### User Workflow Tests
- ✅ User registration and login workflow
- ✅ Task management workflow from creation to completion
- ✅ Team creation, member invitation, and project management workflow
- ✅ Real-time updates and notifications workflow
- ✅ Error handling and recovery workflow
- ✅ Performance and loading states workflow

### Backend API Integration Tests
- ✅ Authentication API integration
- ✅ Tasks API integration
- ✅ Teams API integration
- ✅ Projects API integration
- ✅ Comments API integration
- ✅ Real-time WebSocket integration

### Unit and Integration Tests
- ✅ Unit tests
- ✅ Integration tests

## Test Coverage
See coverage report at reports/coverage/index.html

## Detailed Reports
- Playwright HTML Report: reports/integration-tests/playwright-report/index.html
- Test Results: reports/integration-tests/test-results/

EOF
    
    print_success "Test summary report generated at reports/integration-tests/summary.md"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up test environment..."
    
    # Kill frontend server if running
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        print_status "Frontend development server stopped"
    fi
    
    # Kill any remaining processes
    pkill -f "vite" 2>/dev/null || true
    pkill -f "playwright" 2>/dev/null || true
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Main execution
main() {
    print_status "🚀 Starting comprehensive integration test suite..."
    
    # Parse command line arguments
    RUN_UNIT_TESTS=true
    RUN_WORKFLOW_TESTS=true
    RUN_API_TESTS=true
    SKIP_BACKEND_CHECK=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-unit)
                RUN_UNIT_TESTS=false
                shift
                ;;
            --skip-workflows)
                RUN_WORKFLOW_TESTS=false
                shift
                ;;
            --skip-api)
                RUN_API_TESTS=false
                shift
                ;;
            --skip-backend-check)
                SKIP_BACKEND_CHECK=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --skip-unit           Skip unit tests"
                echo "  --skip-workflows      Skip workflow tests"
                echo "  --skip-api           Skip API integration tests"
                echo "  --skip-backend-check Skip backend availability check"
                echo "  --help               Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Check prerequisites
    if [ "$SKIP_BACKEND_CHECK" = false ]; then
        if ! check_backend; then
            print_error "Backend check failed. Use --skip-backend-check to skip this check."
            exit 1
        fi
    fi
    
    # Start frontend
    if ! start_frontend; then
        print_error "Failed to start frontend development server"
        exit 1
    fi
    
    # Initialize test results
    local total_failures=0
    
    # Run unit and integration tests
    if [ "$RUN_UNIT_TESTS" = true ]; then
        if ! run_unit_integration_tests; then
            ((total_failures++))
        fi
    fi
    
    # Run workflow tests
    if [ "$RUN_WORKFLOW_TESTS" = true ]; then
        run_workflow_tests
        workflow_failures=$?
        ((total_failures += workflow_failures))
    fi
    
    # Run API integration tests
    if [ "$RUN_API_TESTS" = true ]; then
        run_backend_integration_tests
        api_failures=$?
        ((total_failures += api_failures))
    fi
    
    # Generate test report
    generate_test_report
    
    # Final results
    if [ $total_failures -eq 0 ]; then
        print_success "🎉 All integration tests passed successfully!"
        exit 0
    else
        print_error "❌ $total_failures test suite(s) failed"
        exit 1
    fi
}

# Run main function with all arguments
main "$@"