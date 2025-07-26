# AlphaMatrix Database Setup Guide

This guide will help you set up the AlphaMatrix database on your local machine, including ClickHouse setup and running migrations.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation by Operating System](#installation-by-operating-system)
3. [Database Setup](#database-setup)
4. [Running Migrations](#running-migrations)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Git** - for cloning the repository
- **Docker** - for running ClickHouse database
- **Java 17** - for Maven and Flyway migrations
- **Maven 3.9+** - for database migrations

## Installation by Operating System

### Windows

#### 1. Install Chocolatey (Package Manager)

Open PowerShell as Administrator and run:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### 2. Install Dependencies

```powershell
# Install Java 17
choco install openjdk17 -y

# Install Maven
choco install maven -y

# Install Docker Desktop
choco install docker-desktop -y
```

#### 3. Verify Installations

```powershell
java -version
mvn -version
docker --version
```

### macOS

#### 1. Install Homebrew (if not already installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 2. Install Dependencies

```bash
# Install Java 17
brew install openjdk@17

# Install Maven
brew install maven

# Install Docker Desktop
brew install --cask docker
```

#### 3. Set up Java PATH (macOS)

```bash
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

#### 4. Verify Installations

```bash
java -version
mvn -version
docker --version
```

### Linux (Ubuntu/Debian)

#### 1. Update Package Manager

```bash
sudo apt update && sudo apt upgrade -y
```

#### 2. Install Dependencies

```bash
# Install Java 17
sudo apt install openjdk-17-jdk -y

# Install Maven
sudo apt install maven -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

#### 3. Logout and Login

After installing Docker, logout and login again for group changes to take effect.

#### 4. Verify Installations

```bash
java -version
mvn -version
docker --version
```

## Database Setup

### 1. Clone the Repository

```bash
git clone https://github.com/alphamatrix/alphamatrix.git
cd alphamatrix
```

### 2. Create Environment File

The setup scripts will automatically prompt you for database credentials and create the `.env` file. If you prefer to create it manually, follow the instructions below.

**Note:** The automated setup scripts will handle this step for you and prompt for credentials interactively.

**Windows (PowerShell):**

```powershell
cd infra
@"
###############################################################################
# ClickHouse bootstrap -- container reads these on first start-up
###############################################################################
CLICKHOUSE_DB=alpha
CH_USER=your_username_here
CH_PASSWORD=your_secure_password_here

# The official image maps CH_* onto its own vars, but we set both explicitly
CLICKHOUSE_USER=${CH_USER}
CLICKHOUSE_PASSWORD=${CH_PASSWORD}
CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT=1   # tells CH to create the user for you

###############################################################################
# Optional tuning / troubleshooting knobs (uncomment if you hit limits)
# CLICKHOUSE_INIT_TIMEOUT=30             # seconds to wait before health-check
# CLICKHOUSE_MAX_MEMORY_USAGE=8G         # guardrail for runaway queries
###############################################################################
"@ | Out-File -FilePath ".env" -Encoding UTF8
```

**macOS/Linux:**

```bash
cd infra
cat > .env << 'EOF'
###############################################################################
# ClickHouse bootstrap -- container reads these on first start-up
###############################################################################
CLICKHOUSE_DB=alpha
CH_USER=your_username_here
CH_PASSWORD=your_secure_password_here

# The official image maps CH_* onto its own vars, but we set both explicitly
CLICKHOUSE_USER=${CH_USER}
CLICKHOUSE_PASSWORD=${CH_PASSWORD}
CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT=1   # tells CH to create the user for you

###############################################################################
# Optional tuning / troubleshooting knobs (uncomment if you hit limits)
# CLICKHOUSE_INIT_TIMEOUT=30             # seconds to wait before health-check
# CLICKHOUSE_MAX_MEMORY_USAGE=8G         # guardrail for runaway queries
###############################################################################
EOF
```

**⚠️ Security Note:**

- Use a strong, unique password
- Never commit the `.env` file to version control
- Consider using environment variables or secrets management for production

### 2.5. Manual Credential Setup (Optional)

If you're not using the automated setup scripts, you'll need to manually update the credentials in your `.env` file:

1. Open `infra/.env` in your text editor
2. Replace `your_username_here` with your desired username
3. Replace `your_secure_password_here` with a strong, secure password
4. Save the file

**Example:**

```bash
# Change from:
CH_USER=your_username_here
CH_PASSWORD=your_secure_password_here

# To something like:
CH_USER=myuser
CH_PASSWORD=MySecurePassword123!
```

**Note:** The automated setup scripts will prompt for these credentials and create the `.env` file automatically.

### 3. Start ClickHouse Database

```bash
# From the infra/ directory
docker-compose up -d
```

### 4. Verify Database is Running

```bash
# Check if container is running
docker-compose ps

# Test connection (should return "Ok.")
curl "http://localhost:8123/ping"
```

## Running Migrations

### Option 1: Using PowerShell Script (Windows)

```powershell
cd infra/migrations
.\run-migration.ps1
```

### Option 2: Using Batch Script (Windows)

```cmd
cd infra/migrations
.\run-migration.bat
```

### Option 3: Using Bash Script (macOS/Linux)

```bash
cd infra/migrations
chmod +x run-migration.sh
./run-migration.sh
```

### Option 4: Manual Maven Command

```bash
cd infra/migrations

# Set environment variables (replace with your actual credentials)
export FLYWAY_USER=your_username_here
export FLYWAY_PASSWORD=your_secure_password_here

# Run migration
mvn flyway:migrate -P local
```

### Option 5: Using System Properties

```bash
cd infra/migrations
mvn flyway:migrate -P local -Dflyway.user=your_username_here -Dflyway.password=your_secure_password_here
```

## Verification

### 1. Check Migration Status

```bash
cd infra/migrations
mvn flyway:info -P local
```

### 2. Connect to Database

**Windows (PowerShell):**

```powershell
Invoke-WebRequest -Uri "http://localhost:8123/?user=your_username_here&password=your_secure_password_here" -Method POST -Body "SELECT * FROM alpha.test_table"
```

**macOS/Linux:**

```bash
curl "http://localhost:8123/?user=your_username_here&password=your_secure_password_here" \
  --data-binary "SELECT * FROM alpha.test_table"
```

**Note:** Replace `your_username_here` and `your_secure_password_here` with the credentials you set in your `.env` file.

### 3. Expected Output

You should see:

```
1	example
```

## Troubleshooting

### Common Issues

#### 1. Maven Not Found

**Error:** `'mvn' is not recognized as an internal or external command`

**Solution:**

- Ensure Maven is installed and in your PATH
- On Windows, try running the `scripts/ensure-mvn.ps1` script as administrator
- Restart your terminal after installation

#### 2. Docker Not Running

**Error:** `Cannot connect to the Docker daemon`

**Solution:**

- Start Docker Desktop
- On Linux, ensure Docker service is running: `sudo systemctl start docker`

#### 3. Port Already in Use

**Error:** `Ports are not available`

**Solution:**

- Check if ClickHouse is already running: `docker ps`
- Stop existing containers: `docker-compose down`
- Or change ports in `docker-compose.yml`

#### 4. Environment Variables Not Set

**Error:** `Unable to resolve environment variable: 'FLYWAY_PASSWORD'`

**Solution:**

- Ensure the `.env` file exists in the `infra/` directory
- Check that the script is reading from the correct path
- Verify the `.env` file format is correct (no extra spaces, proper line endings)

#### 5. Database Connection Failed

**Error:** `Connection refused`

**Solution:**

- Ensure ClickHouse container is running: `docker-compose ps`
- Check container logs: `docker-compose logs clickhouse`
- Verify the database is ready: `curl http://localhost:8123/ping`

### Getting Help

If you encounter issues not covered here:

1. Check the [ClickHouse documentation](https://clickhouse.com/docs/en/)
2. Review [Flyway documentation](https://flywaydb.org/documentation/)
3. Check container logs: `docker-compose logs`
4. Open an issue on the project repository

## Next Steps

Once you have the database and migrations running successfully:

1. **Database is ready** - ClickHouse is running with initial schema
2. **Migrations working** - Flyway can apply new database changes
3. **Ready for development** - You can now build the API, core, and web components

For more information about the project architecture and development workflow, see the main [README.md](README.md).
