#!/bin/bash

# Quick Start Script for Task Management System (using H2 database)
set -e

echo "🚀 Quick Start - Task Management System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if Java is installed
check_java() {
    print_status "Checking Java..."
    if ! command -v java &> /dev/null; then
        print_error "Java is not installed. Please install Java 17 or higher."
        exit 1
    fi
    print_success "Java is available"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js version check passed: $(node -v)"
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    if [ -d "task-management-ui" ]; then
        cd task-management-ui
        if [ ! -d "node_modules" ]; then
            print_status "Installing frontend dependencies..."
            npm install
        fi
        cd ..
        print_success "Frontend setup completed"
    else
        print_warning "Frontend directory not found"
    fi
}

# Start backend with H2 database
start_backend() {
    print_status "Starting backend server with H2 database..."
    
    # Create logs directory
    mkdir -p logs
    
    # Set H2 database profile
    export SPRING_PROFILES_ACTIVE=h2
    
    # Start backend in background
    nohup ./mvnw spring-boot:run -Dspring-boot.run.profiles=h2 > logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > backend.pid
    
    print_status "Backend starting with H2 database... (PID: $BACKEND_PID)"
    print_status "Waiting for backend to be ready..."
    
    # Wait for backend to start
    for i in {1..60}; do
        if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
            print_success "Backend is ready at http://localhost:8080"
            break
        fi
        if [ $i -eq 60 ]; then
            print_error "Backend failed to start. Check logs/backend.log for details."
            print_status "Last few lines of backend log:"
            tail -20 logs/backend.log
            exit 1
        fi
        sleep 2
        if [ $((i % 10)) -eq 0 ]; then
            echo -n " ${i}s"
        else
            echo -n "."
        fi
    done
    echo
}

# Start frontend
start_frontend() {
    print_status "Starting frontend server..."
    
    if [ -d "task-management-ui" ]; then
        cd task-management-ui
        
        # Start frontend in background
        nohup npm run dev > ../logs/frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > ../frontend.pid
        
        cd ..
        
        print_status "Frontend starting... (PID: $FRONTEND_PID)"
        print_status "Waiting for frontend to be ready..."
        
        # Wait for frontend to start
        for i in {1..30}; do
            if curl -s http://localhost:5173 > /dev/null 2>&1; then
                print_success "Frontend is ready at http://localhost:5173"
                break
            fi
            if [ $i -eq 30 ]; then
                print_error "Frontend failed to start. Check logs/frontend.log for details."
                print_status "Last few lines of frontend log:"
                tail -20 logs/frontend.log
                exit 1
            fi
            sleep 2
            if [ $((i % 5)) -eq 0 ]; then
                echo -n " ${i}s"
            else
                echo -n "."
            fi
        done
        echo
    else
        print_warning "Frontend directory not found"
    fi
}

# Create H2 application properties
create_h2_config() {
    print_status "Creating H2 database configuration..."
    
    cat > src/main/resources/application-h2.yml << 'EOF'
spring:
  profiles:
    active: h2
  
  datasource:
    url: jdbc:h2:mem:taskmanagement;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
    driver-class-name: org.h2.Driver
    username: sa
    password: 
    
  h2:
    console:
      enabled: true
      path: /h2-console
      
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    hibernate:
      ddl-auto: create-drop
    show-sql: false
    
  flyway:
    enabled: false
    
  cache:
    type: simple
    
  data:
    redis:
      repositories:
        enabled: false

logging:
  level:
    com.taskmanagement: INFO
    org.springframework.security: WARN
    org.hibernate: WARN
EOF

    print_success "H2 configuration created"
}

# Create stop script
create_stop_script() {
    cat > stop-quick-start.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Task Management System..."

# Stop backend
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        rm backend.pid
    fi
fi

# Stop frontend
if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        rm frontend.pid
    fi
fi

echo "✅ All services stopped"
EOF

    chmod +x stop-quick-start.sh
    print_success "Created stop-quick-start.sh script"
}

# Main execution
main() {
    print_status "Starting quick development setup..."
    
    check_java
    check_node
    create_h2_config
    setup_frontend
    create_stop_script
    
    start_backend
    start_frontend
    
    echo
    print_success "🎉 Task Management System is now running!"
    echo
    print_status "📱 Frontend: http://localhost:5173"
    print_status "🔧 Backend API: http://localhost:8080"
    print_status "📊 API Documentation: http://localhost:8080/swagger-ui.html"
    print_status "🗄️  H2 Database Console: http://localhost:8080/h2-console"
    print_status "    JDBC URL: jdbc:h2:mem:taskmanagement"
    print_status "    Username: sa"
    print_status "    Password: (leave empty)"
    echo
    print_status "📝 Logs:"
    print_status "  Backend: logs/backend.log"
    print_status "  Frontend: logs/frontend.log"
    echo
    print_status "🛑 To stop all services: ./stop-quick-start.sh"
    echo
    print_status "🔍 To monitor logs:"
    print_status "  Backend: tail -f logs/backend.log"
    print_status "  Frontend: tail -f logs/frontend.log"
    echo
    print_warning "Note: Using H2 in-memory database. Data will be lost when backend stops."
    print_status "For persistent data, install PostgreSQL and use setup-local-dev.sh instead."
}

# Run main function
main "$@"