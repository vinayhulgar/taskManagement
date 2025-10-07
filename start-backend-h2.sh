#!/bin/bash

echo "🚀 Starting backend with H2 database..."

# Create logs directory
mkdir -p logs

# Start backend with H2 profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=h2