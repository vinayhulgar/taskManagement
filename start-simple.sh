#!/bin/bash

echo "🚀 Starting Task Management System (Simple Mode)..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[INFO]${NC} This will start both applications in simple mode"
echo -e "${BLUE}[INFO]${NC} Backend will use H2 in-memory database"
echo

# Create a temporary simple application.yml
echo -e "${BLUE}[INFO]${NC} Creating temporary H2 configuration..."

# Backup original application.yml
cp src/main/resources/application.yml src/main/resources/application.yml.backup

# Create simple H2 configuration
cat > src/main/resources/application.yml << 'EOF'
server:
  port: 8080

spring:
  application:
    name: task-management-api
    
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
    org.springframework.web: WARN
    
management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: when-authorized

jwt:
  secret: mySecretKey123456789012345678901234567890
  expiration: 86400000
EOF

echo -e "${GREEN}[SUCCESS]${NC} Temporary configuration created"

# Function to restore original config on exit
cleanup() {
    echo
    echo -e "${BLUE}[INFO]${NC} Restoring original configuration..."
    mv src/main/resources/application.yml.backup src/main/resources/application.yml
    echo -e "${GREEN}[SUCCESS]${NC} Original configuration restored"
}

# Set trap to restore config on script exit
trap cleanup EXIT

echo -e "${BLUE}[INFO]${NC} Starting backend..."
echo -e "${BLUE}[INFO]${NC} Press Ctrl+C to stop"
echo

# Start backend
./mvnw spring-boot:run