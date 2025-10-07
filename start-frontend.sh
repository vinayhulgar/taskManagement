#!/bin/bash

echo "🚀 Starting frontend..."

cd task-management-ui

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start frontend
npm run dev