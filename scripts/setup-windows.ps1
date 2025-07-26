# AlphaMatrix Windows Setup Script
# Run this script as Administrator

param(
    [switch]$SkipDependencies = $false,
    [switch]$SkipDatabase = $false
)

Write-Host "🚀 AlphaMatrix Windows Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Step 1: Install Dependencies
if (-not $SkipDependencies) {
    Write-Host "📦 Installing Dependencies..." -ForegroundColor Yellow
    
    # Install Chocolatey if not present
    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Host "Installing Chocolatey..." -ForegroundColor Cyan
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    }
    
    # Install required packages
    $packages = @(
        "openjdk17",
        "maven", 
        "docker-desktop"
    )
    
    foreach ($package in $packages) {
        Write-Host "Installing $package..." -ForegroundColor Cyan
        choco install $package -y
    }
    
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipping dependency installation" -ForegroundColor Yellow
}

# Step 2: Verify Installations
Write-Host "🔍 Verifying installations..." -ForegroundColor Yellow

$tools = @{
    "Java" = "java -version"
    "Maven" = "mvn -version"
    "Docker" = "docker --version"
}

foreach ($tool in $tools.GetEnumerator()) {
    try {
        $output = Invoke-Expression $tool.Value 2>&1
        Write-Host "✅ $($tool.Key): $($output[0])" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($tool.Key): Not found" -ForegroundColor Red
    }
}

# Step 3: Setup Database
if (-not $SkipDatabase) {
    Write-Host "🗄️  Setting up database..." -ForegroundColor Yellow
    
    # Navigate to project root
    $projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    Set-Location $projectRoot
    
    # Create .env file if it doesn't exist
    $envFile = "infra\.env"
    if (-not (Test-Path $envFile)) {
        Write-Host "🔐 Setting up database credentials..." -ForegroundColor Cyan
        Write-Host "Please provide your database credentials:" -ForegroundColor Yellow
        
        # Prompt for username
        do {
            $username = Read-Host "Enter username for ClickHouse database"
            if ([string]::IsNullOrWhiteSpace($username)) {
                Write-Host "❌ Username cannot be empty. Please try again." -ForegroundColor Red
            }
        } while ([string]::IsNullOrWhiteSpace($username))
        
        # Prompt for password
        do {
            $password = Read-Host "Enter password for ClickHouse database" -AsSecureString
            $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
            if ([string]::IsNullOrWhiteSpace($passwordPlain)) {
                Write-Host "❌ Password cannot be empty. Please try again." -ForegroundColor Red
            }
        } while ([string]::IsNullOrWhiteSpace($passwordPlain))
        
        # Confirm password
        do {
            $confirmPassword = Read-Host "Confirm password" -AsSecureString
            $confirmPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirmPassword))
            if ($passwordPlain -ne $confirmPasswordPlain) {
                Write-Host "❌ Passwords do not match. Please try again." -ForegroundColor Red
            }
        } while ($passwordPlain -ne $confirmPasswordPlain)
        
        Write-Host "Creating .env file with your credentials..." -ForegroundColor Cyan
        
        @"
###############################################################################
# ClickHouse bootstrap -- container reads these on first start-up
###############################################################################
CLICKHOUSE_DB=alpha
CH_USER=$username
CH_PASSWORD=$passwordPlain

# The official image maps CH_* onto its own vars, but we set both explicitly
CLICKHOUSE_USER=${CH_USER}
CLICKHOUSE_PASSWORD=${CH_PASSWORD}
CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT=1   # tells CH to create the user for you

###############################################################################
# Optional tuning / troubleshooting knobs (uncomment if you hit limits)
# CLICKHOUSE_INIT_TIMEOUT=30             # seconds to wait before health-check
# CLICKHOUSE_MAX_MEMORY_USAGE=8G         # guardrail for runaway queries
###############################################################################
"@ | Out-File -FilePath $envFile -Encoding UTF8
        Write-Host "✅ .env file created with your credentials" -ForegroundColor Green
    } else {
        Write-Host "✅ .env file already exists" -ForegroundColor Green
    }
    
    # Start ClickHouse
    Write-Host "Starting ClickHouse database..." -ForegroundColor Cyan
    Set-Location "infra"
    docker-compose up -d
    
    # Wait for database to be ready
    Write-Host "Waiting for database to be ready..." -ForegroundColor Cyan
    Start-Sleep -Seconds 10
    
    # Test connection
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8123/ping" -UseBasicParsing
        if ($response.Content -eq "Ok.") {
            Write-Host "✅ Database is running and accessible" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Database responded but with unexpected content" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Database connection failed. Please check Docker is running." -ForegroundColor Red
    }
    
    # Run migrations
    Write-Host "🔄 Running database migrations..." -ForegroundColor Cyan
    Set-Location "migrations"
    .\run-migration.ps1
    
    Write-Host "✅ Database setup completed" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipping database setup" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start Docker Desktop if not already running" -ForegroundColor White
Write-Host "2. Navigate to the project directory: cd $projectRoot" -ForegroundColor White
Write-Host "3. Run migrations: cd infra/migrations && .\run-migration.ps1" -ForegroundColor White
Write-Host "4. Check the SETUP.md file for more detailed instructions" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green 