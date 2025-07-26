#!/bin/bash

# AlphaMatrix Migration Script for Unix/Linux/macOS
# This script reads credentials from the .env file and runs Flyway migrations

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Running AlphaMatrix Database Migrations${NC}"
echo "=========================================="

# Read environment variables from .env file in parent directory
ENV_FILE="../.env"

if [[ ! -f "$ENV_FILE" ]]; then
    echo -e "${RED}❌ Error: .env file not found at $ENV_FILE${NC}"
    echo "Please ensure the .env file exists in the infra/ directory"
    exit 1
fi

echo -e "${YELLOW}📖 Reading environment variables from $ENV_FILE${NC}"

# Parse .env file and set variables
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ $key =~ ^[[:space:]]*# ]] || [[ -z $key ]]; then
        continue
    fi
    
    # Remove leading/trailing whitespace and quotes
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs | sed 's/^["'\'']//;s/["'\'']$//')
    
    # Set the variable
    export "$key=$value"
    echo "  Set $key"
done < "$ENV_FILE"

# Set Flyway environment variables from .env values
export FLYWAY_USER="$CH_USER"
export FLYWAY_PASSWORD="$CH_PASSWORD"

echo -e "${YELLOW}🔑 Using credentials from .env file${NC}"

# Run Flyway migration
echo -e "${YELLOW}🚀 Running Flyway migration...${NC}"
mvn flyway:migrate -P local

echo -e "${GREEN}✅ Migration completed successfully!${NC}" 