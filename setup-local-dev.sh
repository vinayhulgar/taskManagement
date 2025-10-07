#!/bin/bash

# Local Development Setup Script for Task Management System
set -e

echo "🚀 Setting up Task Management System for local development..."

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

# Check if PostgreSQL is running
check_postgres() {
    print_status "Checking PostgreSQL..."
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL is not installed. Please install PostgreSQL first."
        print_status "On macOS: brew install postgresql"
        print_status "On Ubuntu: sudo apt-get install postgresql postgresql-contrib"
        exit 1
    fi
    
    if ! pg_isready -q; then
        print_warning "PostgreSQL is not running. Starting PostgreSQL..."
        if command -v brew &> /dev/null; then
            brew services start postgresql
        else
            sudo systemctl start postgresql
        fi
        sleep 3
    fi
    
    print_success "PostgreSQL is running"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Create database and user
    psql -d postgres -c "CREATE USER taskmanagement WITH PASSWORD 'taskmanagement123';" 2>/dev/null || true
    psql -d postgres -c "CREATE DATABASE taskmanagement OWNER taskmanagement;" 2>/dev/null || true
    psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE taskmanagement TO taskmanagement;" 2>/dev/null || true
    
    print_success "Database setup completed"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js version check passed: $(node -v)"
}

# Check if Java is installed
check_java() {
    print_status "Checking Java..."
    if ! command -v java &> /dev/null; then
        print_error "Java is not installed. Please install Java 17 or higher."
        exit 1
    fi
    
    print_success "Java is available: $(java -version 2>&1 | head -n 1)"
}

# Install frontend dependencies
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

# Start backend
start_backend() {
    print_status "Starting backend server..."
    
    # Create logs directory
    mkdir -p logs
    
    # Start backend in background
    nohup ./mvnw spring-boot:run > logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > backend.pid
    
    print_status "Backend starting... (PID: $BACKEND_PID)"
    print_status "Waiting for backend to be ready..."
    
    # Wait for backend to start
    for i in {1..30}; do
        if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
            print_success "Backend is ready at http://localhost:8080"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Backend failed to start. Check logs/backend.log for details."
            exit 1
        fi
        sleep 2
        echo -n "."
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
        for i in {1..20}; do
            if curl -s http://localhost:5173 > /dev/null 2>&1; then
                print_success "Frontend is ready at http://localhost:5173"
                break
            fi
            if [ $i -eq 20 ]; then
                print_error "Frontend failed to start. Check logs/frontend.log for details."
                exit 1
            fi
            sleep 2
            echo -n "."
        done
        echo
    else
        print_warning "Frontend directory not found"
    fi
}

# Create stop script
create_stop_script() {
    cat > stop-local-dev.sh << 'EOF'
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

    chmod +x stop-local-dev.sh
    print_success "Created stop-local-dev.sh script"
}

# Main execution
main() {
    print_status "Starting local development setup..."
    
    check_postgres
    setup_database
    check_java
    check_node
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
    echo
    print_status "📝 Logs:"
    print_status "  Backend: logs/backend.log"
    print_status "  Frontend: logs/frontend.log"
    echo
    print_status "🛑 To stop all services: ./stop-local-dev.sh"
    echo
    print_status "🔍 To monitor logs:"
    print_status "  Backend: tail -f logs/backend.log"
    print_status "  Frontend: tail -f logs/frontend.log"
}

# Run main function
main "$@"