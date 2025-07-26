#!/bin/bash

# AlphaMatrix Unix/Linux/macOS Setup Script
# Run this script with appropriate permissions

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}📦 $1${NC}"
}

print_header() {
    echo -e "${WHITE}🚀 AlphaMatrix Unix Setup${NC}"
    echo -e "${WHITE}========================${NC}"
}

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        if command -v apt-get &> /dev/null; then
            PACKAGE_MANAGER="apt"
        elif command -v yum &> /dev/null; then
            PACKAGE_MANAGER="yum"
        else
            print_error "Unsupported Linux distribution"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        PACKAGE_MANAGER="brew"
    else
        print_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
}

# Install dependencies based on OS
install_dependencies() {
    print_info "Installing dependencies for $OS..."
    
    if [[ "$OS" == "macos" ]]; then
        # Install Homebrew if not present
        if ! command -v brew &> /dev/null; then
            print_info "Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        
        # Install packages
        brew install openjdk@17 maven docker
        
        # Set up Java PATH
        # Detect Homebrew prefix dynamically
        HOMEBREW_PREFIX=$(brew --prefix)
        
        # Detect user's shell and update the appropriate configuration file
        case "$SHELL" in
            */zsh)
                CONFIG_FILE=~/.zshrc
                ;;
            */bash)
                CONFIG_FILE=~/.bashrc
                ;;
            */fish)
                CONFIG_FILE=~/.config/fish/config.fish
                ;;
            *)
                print_warning "Unsupported shell: $SHELL. Please update your PATH manually."
                CONFIG_FILE=""
                ;;
        esac
        
        if [[ -n "$CONFIG_FILE" ]]; then
            echo "export PATH=\"$HOMEBREW_PREFIX/opt/openjdk@17/bin:\$PATH\"" >> "$CONFIG_FILE"
            source "$CONFIG_FILE"
        fi
        
    elif [[ "$OS" == "linux" ]]; then
        if [[ "$PACKAGE_MANAGER" == "apt" ]]; then
            sudo apt update && sudo apt upgrade -y
            sudo apt install -y openjdk-17-jdk maven curl
            
            # Install Docker
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            
        elif [[ "$PACKAGE_MANAGER" == "yum" ]]; then
            sudo yum update -y
            sudo yum install -y java-17-openjdk-devel maven curl
            
            # Install Docker
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
        fi
    fi
    
    print_status "Dependencies installed successfully"
}

# Verify installations
verify_installations() {
    print_info "Verifying installations..."
    
    local tools=("java" "mvn" "docker")
    local tool_names=("Java" "Maven" "Docker")
    
    for i in "${!tools[@]}"; do
        if command -v "${tools[$i]}" &> /dev/null; then
            local version=$(${tools[$i]} --version 2>&1 | head -n 1)
            print_status "${tool_names[$i]}: $version"
        else
            print_error "${tool_names[$i]}: Not found"
        fi
    done
}

# Setup database
setup_database() {
    print_info "Setting up database..."
    
    # Navigate to project root
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local project_root="$(dirname "$script_dir")"
    cd "$project_root"
    
    # Create .env file if it doesn't exist
    local env_file="infra/.env"
    if [[ ! -f "$env_file" ]]; then
        print_info "🔐 Setting up database credentials..."
        echo "Please provide your database credentials:"
        
        # Prompt for username
        while true; do
            read -p "Enter username for ClickHouse database: " username
            if [[ -n "$username" ]]; then
                break
            else
                print_error "Username cannot be empty. Please try again."
            fi
        done
        
        # Prompt for password
        while true; do
            read -s -p "Enter password for ClickHouse database: " password
            echo
            if [[ -n "$password" ]]; then
                break
            else
                print_error "Password cannot be empty. Please try again."
            fi
        done
        
        # Confirm password
        while true; do
            read -s -p "Confirm password: " confirm_password
            echo
            if [[ "$password" == "$confirm_password" ]]; then
                break
            else
                print_error "Passwords do not match. Please try again."
            fi
        done
        
        print_info "Creating .env file with your credentials..."
        cat > "$env_file" << EOF
###############################################################################
# ClickHouse bootstrap -- container reads these on first start-up
###############################################################################
CLICKHOUSE_DB=alpha
CH_USER=$username
CH_PASSWORD=$password

# The official image maps CH_* onto its own vars, but we set both explicitly
CLICKHOUSE_USER=\${CH_USER}
CLICKHOUSE_PASSWORD=\${CH_PASSWORD}
CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT=1   # tells CH to create the user for you

###############################################################################
# Optional tuning / troubleshooting knobs (uncomment if you hit limits)
# CLICKHOUSE_INIT_TIMEOUT=30             # seconds to wait before health-check
# CLICKHOUSE_MAX_MEMORY_USAGE=8G         # guardrail for runaway queries
###############################################################################
EOF
        print_status ".env file created with your credentials"
    else
        print_status ".env file already exists"
    fi
    
    # Start ClickHouse
    print_info "Starting ClickHouse database..."
    cd infra
    docker-compose up -d
    
    # Wait for database to be ready
    print_info "Waiting for database to be ready..."
    sleep 10
    
    # Test connection
    if curl -s "http://localhost:8123/ping" | grep -q "Ok."; then
        print_status "Database is running and accessible"
    else
        print_warning "Database connection failed. Please check Docker is running."
    fi
    
    # Run migrations
    print_info "Running database migrations..."
    cd migrations
    
    # Set environment variables and run migration
    export FLYWAY_USER="$username"
    export FLYWAY_PASSWORD="$password"
    mvn flyway:migrate -P local
    
    print_status "Database setup completed"
}

# Main execution
main() {
    print_header
    
    # Parse command line arguments
    SKIP_DEPS=false
    SKIP_DB=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-deps)
                SKIP_DEPS=true
                shift
                ;;
            --skip-db)
                SKIP_DB=true
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Usage: $0 [--skip-deps] [--skip-db]"
                exit 1
                ;;
        esac
    done
    
    # Detect OS
    detect_os
    
    # Install dependencies
    if [[ "$SKIP_DEPS" == false ]]; then
        install_dependencies
    else
        print_warning "Skipping dependency installation"
    fi
    
    # Verify installations
    verify_installations
    
    # Setup database
    if [[ "$SKIP_DB" == false ]]; then
        setup_database
    else
        print_warning "Skipping database setup"
    fi
    
    echo ""
    print_status "Setup completed successfully!"
    echo ""
    echo -e "${CYAN}Next steps:${NC}"
    echo -e "${WHITE}1. Start Docker if not already running${NC}"
    echo -e "${WHITE}2. Navigate to the project directory: cd $(pwd)${NC}"
    echo -e "${WHITE}3. Run migrations: cd infra/migrations && ./run-migration.sh${NC}"
    echo -e "${WHITE}4. Check the SETUP.md file for more detailed instructions${NC}"
    echo ""
    echo -e "${GREEN}Happy coding! 🚀${NC}"
}

# Run main function
main "$@" 