#!/bin/bash

# NovaGuard Setup Script
# This script helps set up the NovaGuard development environment

set -e

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        REQUIRED_VERSION="18.0.0"
        
        if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
            print_success "Node.js version $NODE_VERSION is compatible"
            return 0
        else
            print_error "Node.js version $NODE_VERSION is too old. Required: $REQUIRED_VERSION+"
            return 1
        fi
    else
        print_error "Node.js is not installed"
        return 1
    fi
}

# Function to check npm version
check_npm_version() {
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        REQUIRED_VERSION="8.0.0"
        
        if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NPM_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
            print_success "npm version $NPM_VERSION is compatible"
            return 0
        else
            print_error "npm version $NPM_VERSION is too old. Required: $REQUIRED_VERSION+"
            return 1
        fi
    else
        print_error "npm is not installed"
        return 1
    fi
}

# Function to check PostgreSQL
check_postgresql() {
    if command_exists psql; then
        print_success "PostgreSQL is installed"
        return 0
    else
        print_warning "PostgreSQL is not installed or not in PATH"
        return 1
    fi
}

# Function to check Redis
check_redis() {
    if command_exists redis-cli; then
        print_success "Redis is installed"
        return 0
    else
        print_warning "Redis is not installed or not in PATH"
        return 1
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    print_success "Dependencies installed successfully"
}

# Function to setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        print_status "Creating backend .env file..."
        cat > backend/.env << EOF
# Server Configuration
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://novaguard:novaguard_password@localhost:5432/novaguard

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=novaguard-development-secret-change-in-production
CORS_ORIGIN=http://localhost:3000

# AI Services (Optional - Add your API keys)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
EOF
        print_success "Backend .env file created"
    else
        print_warning "Backend .env file already exists"
    fi
    
    # Frontend environment
    if [ ! -f "frontend/.env.local" ]; then
        print_status "Creating frontend .env.local file..."
        cat > frontend/.env.local << EOF
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# App Configuration
NEXT_PUBLIC_APP_NAME=NovaGuard
NEXT_PUBLIC_APP_VERSION=1.0.0
EOF
        print_success "Frontend .env.local file created"
    else
        print_warning "Frontend .env.local file already exists"
    fi
}

# Function to setup database
setup_database() {
    print_status "Setting up PostgreSQL database..."
    
    if command_exists psql; then
        # Check if database exists
        if psql -lqt | cut -d \| -f 1 | grep -qw novaguard; then
            print_warning "Database 'novaguard' already exists"
        else
            print_status "Creating database 'novaguard'..."
            createdb novaguard
            print_success "Database 'novaguard' created"
        fi
        
        # Check if user exists
        if psql -t -c "SELECT 1 FROM pg_roles WHERE rolname='novaguard'" | grep -q 1; then
            print_warning "User 'novaguard' already exists"
        else
            print_status "Creating user 'novaguard'..."
            psql -c "CREATE USER novaguard WITH PASSWORD 'novaguard_password';"
            psql -c "GRANT ALL PRIVILEGES ON DATABASE novaguard TO novaguard;"
            print_success "User 'novaguard' created and granted privileges"
        fi
    else
        print_error "PostgreSQL is not available. Please install PostgreSQL and try again."
        return 1
    fi
}

# Function to check services
check_services() {
    print_status "Checking if services are running..."
    
    # Check PostgreSQL
    if pg_isready -q; then
        print_success "PostgreSQL is running"
    else
        print_warning "PostgreSQL is not running. Please start PostgreSQL service."
    fi
    
    # Check Redis
    if redis-cli ping >/dev/null 2>&1; then
        print_success "Redis is running"
    else
        print_warning "Redis is not running. Please start Redis service."
    fi
}

# Function to create logs directory
create_logs_directory() {
    print_status "Creating logs directory..."
    mkdir -p backend/logs
    print_success "Logs directory created"
}

# Function to display next steps
display_next_steps() {
    echo ""
    print_success "Setup completed successfully!"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Make sure PostgreSQL and Redis are running"
    echo "2. Add your AI API keys to backend/.env (optional)"
    echo "3. Start the development servers:"
    echo ""
    echo -e "${YELLOW}Terminal 1 (Backend):${NC}"
    echo "   cd backend && npm run dev"
    echo ""
    echo -e "${YELLOW}Terminal 2 (Frontend):${NC}"
    echo "   cd frontend && npm run dev"
    echo ""
    echo -e "${YELLOW}Access the application:${NC}"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:3001"
    echo "   Health Check: http://localhost:3001/health"
    echo ""
}

# Main setup function
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    NovaGuard Setup Script                   ║"
    echo "║              Smart Contract Auditing Platform               ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    print_status "Starting NovaGuard setup..."
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! check_node_version; then
        print_error "Please install Node.js 18+ and try again"
        exit 1
    fi
    
    if ! check_npm_version; then
        print_error "Please install npm 8+ and try again"
        exit 1
    fi
    
    check_postgresql
    check_redis
    
    # Setup steps
    install_dependencies
    setup_environment
    create_logs_directory
    
    if command_exists psql; then
        setup_database
    fi
    
    check_services
    display_next_steps
}

# Run main function
main "$@"
