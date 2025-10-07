# Task Management System - Local Demo Instructions

## 🚀 Quick Demo Setup

Since the applications have some configuration complexities, here are the manual steps to run both applications locally for testing:

### Prerequisites
- Java 17+ installed
- Node.js 18+ installed
- (Optional) PostgreSQL for persistent data

### Option 1: Quick Demo with Default Configuration

#### 1. Start Backend (Terminal 1)
```bash
# Navigate to project root
cd /path/to/taskManagement

# Start backend with default profile (will use PostgreSQL)
./mvnw spring-boot:run
```

**Note**: If you don't have PostgreSQL installed, the backend will fail to start. See Option 2 below.

#### 2. Start Frontend (Terminal 2)
```bash
# Navigate to frontend directory
cd task-management-ui

# Install dependencies (first time only)
npm install

# Start frontend development server
npm run dev
```

### Option 2: Demo with H2 In-Memory Database

If you don't have PostgreSQL installed, you can use H2 database:

#### 1. Modify application.yml temporarily
Edit `src/main/resources/application.yml` and comment out the PostgreSQL configuration:

```yaml
spring:
  profiles:
    active: development
  
  # Comment out PostgreSQL config
  # datasource:
  #   url: jdbc:postgresql://localhost:5432/taskmanagement
  #   username: taskmanagement
  #   password: taskmanagement123
  #   driver-class-name: org.postgresql.Driver
  
  # Add H2 config instead
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
```

#### 2. Start Backend
```bash
./mvnw spring-boot:run
```

#### 3. Start Frontend
```bash
cd task-management-ui
npm install
npm run dev
```

### Option 3: Full PostgreSQL Setup

#### 1. Install PostgreSQL
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### 2. Create Database and User
```bash
# Connect to PostgreSQL
psql -d postgres

# Create user and database
CREATE USER taskmanagement WITH PASSWORD 'taskmanagement123';
CREATE DATABASE taskmanagement OWNER taskmanagement;
GRANT ALL PRIVILEGES ON DATABASE taskmanagement TO taskmanagement;
\q
```

#### 3. Start Applications
```bash
# Terminal 1: Backend
./mvnw spring-boot:run

# Terminal 2: Frontend
cd task-management-ui
npm install
npm run dev
```

## 📱 Access the Applications

Once both applications are running:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/swagger-ui.html
- **H2 Console** (if using H2): http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:mem:taskmanagement`
  - Username: `sa`
  - Password: (leave empty)

## 🧪 Testing the Integration

1. **Open Frontend**: Navigate to http://localhost:5173
2. **Register/Login**: Create a new account or login
3. **Test Features**:
   - Create teams and projects
   - Add tasks and move them through different statuses
   - Test real-time updates (open multiple browser tabs)
   - Test notifications and comments

## 🛑 Stopping the Applications

- **Backend**: Press `Ctrl+C` in the backend terminal
- **Frontend**: Press `Ctrl+C` in the frontend terminal

## 📝 Notes

- The H2 database is in-memory, so data will be lost when the backend stops
- For persistent data, use the PostgreSQL setup
- The frontend is configured to connect to the backend at `http://localhost:8080`
- Both applications have hot-reload enabled for development

## 🔧 Troubleshooting

### Backend Issues
- **Port 8080 in use**: Change the port in `application.yml` (`server.port: 8081`)
- **Database connection**: Ensure PostgreSQL is running or use H2 configuration
- **Java version**: Ensure Java 17+ is installed

### Frontend Issues
- **Port 5173 in use**: Vite will automatically use the next available port
- **Dependencies**: Run `npm install` if you encounter module errors
- **API connection**: Ensure backend is running on port 8080

### Integration Issues
- **CORS errors**: The backend is configured to allow requests from `http://localhost:5173`
- **API calls failing**: Check that both applications are running and accessible