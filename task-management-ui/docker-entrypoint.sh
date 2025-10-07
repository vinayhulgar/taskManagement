#!/bin/sh

# Docker entrypoint script for Task Management UI

set -e

echo "Starting Task Management UI container..."

# Function to replace environment variables in built files
replace_env_vars() {
    echo "Replacing environment variables in built files..."
    
    # Find all JS files in the build directory
    find /usr/share/nginx/html -name "*.js" -type f -exec sed -i "s|VITE_API_BASE_URL_PLACEHOLDER|${VITE_API_BASE_URL:-http://localhost:8080}|g" {} \;
    find /usr/share/nginx/html -name "*.js" -type f -exec sed -i "s|VITE_ENVIRONMENT_PLACEHOLDER|${VITE_ENVIRONMENT:-production}|g" {} \;
    find /usr/share/nginx/html -name "*.js" -type f -exec sed -i "s|VITE_APP_NAME_PLACEHOLDER|${VITE_APP_NAME:-Task Management System}|g" {} \;
    find /usr/share/nginx/html -name "*.js" -type f -exec sed -i "s|VITE_APP_VERSION_PLACEHOLDER|${VITE_APP_VERSION:-1.0.0}|g" {} \;
    
    echo "Environment variables replaced successfully"
}

# Function to validate environment variables
validate_env() {
    echo "Validating environment variables..."
    
    if [ -z "$VITE_API_BASE_URL" ]; then
        echo "Warning: VITE_API_BASE_URL not set, using default: http://localhost:8080"
        export VITE_API_BASE_URL="http://localhost:8080"
    fi
    
    echo "Environment validation completed"
}

# Function to setup nginx configuration
setup_nginx() {
    echo "Setting up nginx configuration..."
    
    # Create nginx directories if they don't exist
    mkdir -p /var/log/nginx
    mkdir -p /var/cache/nginx
    mkdir -p /var/run/nginx
    
    # Test nginx configuration
    nginx -t
    
    echo "Nginx configuration validated"
}

# Function to setup monitoring and logging
setup_monitoring() {
    echo "Setting up monitoring and logging..."
    
    # Create log files
    touch /var/log/nginx/access.log
    touch /var/log/nginx/error.log
    
    # Set proper permissions
    chmod 644 /var/log/nginx/*.log
    
    echo "Monitoring and logging setup completed"
}

# Main execution
main() {
    echo "=== Task Management UI Container Startup ==="
    echo "Environment: ${VITE_ENVIRONMENT:-production}"
    echo "API Base URL: ${VITE_API_BASE_URL:-http://localhost:8080}"
    echo "App Version: ${VITE_APP_VERSION:-1.0.0}"
    echo "============================================="
    
    validate_env
    replace_env_vars
    setup_nginx
    setup_monitoring
    
    echo "Container startup completed successfully"
    echo "Starting nginx..."
    
    # Execute the main command
    exec "$@"
}

# Run main function with all arguments
main "$@"