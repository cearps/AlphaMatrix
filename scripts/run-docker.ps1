# Simple AlphaMatrix Docker Runner
# Usage: .\scripts\run-docker.ps1 [command] [parameters]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("build", "api", "backfill", "incremental", "help", "test", "unit", "integration")]
    [string]$Command,
    
    [string]$Symbol = "AAPL",
    [string]$StartDate = "2024-01-01",
    [string]$EndDate = "2024-01-05",
    [string]$Interval = "1d",
    [int]$LookbackDays = 365,
    [switch]$DryRun
)

Write-Host "AlphaMatrix Docker Runner" -ForegroundColor Green
Write-Host "=======================" -ForegroundColor Green

switch ($Command) {
    "build" {
        Write-Host "Building Docker images..." -ForegroundColor Yellow
        docker build -f infra/Dockerfile.api -t alphamatrix-api .
        docker build -f infra/Dockerfile.etl -t alphamatrix-etl .
        docker build -f infra/Dockerfile.test -t alphamatrix-test .
        Write-Host "Images built successfully!" -ForegroundColor Green
    }
    
    "api" {
        Write-Host "Starting API service..." -ForegroundColor Yellow
        Write-Host "API will be available at: http://localhost:8000" -ForegroundColor Cyan
        docker run --rm -p 8000:8000 -v "$(Get-Location)/infra/.env:/app/infra/.env:ro" alphamatrix-api
    }
    
    "backfill" {
        $dryRunFlag = if ($DryRun) { "--dry-run" } else { "" }
        Write-Host "Running backfill ETL job..." -ForegroundColor Yellow
        Write-Host "Symbol: $Symbol, Start: $StartDate, End: $EndDate, Interval: $Interval" -ForegroundColor Cyan
        docker run --rm --add-host=host.docker.internal:host-gateway -v "$(Get-Location)/infra/.env:/app/infra/.env:ro" alphamatrix-etl python -m alphamatrix.etl.jobs.backfill_ohlcv --symbol $Symbol --start $StartDate --end $EndDate --interval $Interval $dryRunFlag
    }
    
    "incremental" {
        $dryRunFlag = if ($DryRun) { "--dry-run" } else { "" }
        Write-Host "Running incremental ETL job..." -ForegroundColor Yellow
        Write-Host "Symbol: $Symbol, Interval: $Interval, Lookback: $LookbackDays days" -ForegroundColor Cyan
        docker run --rm --add-host=host.docker.internal:host-gateway -v "$(Get-Location)/infra/.env:/app/infra/.env:ro" alphamatrix-etl python -m alphamatrix.etl.jobs.incremental_ohlcv --symbol $Symbol --interval $Interval --lookback-days $LookbackDays $dryRunFlag
    }
    
    "help" {
        Write-Host "Showing ETL help..." -ForegroundColor Yellow
        docker run --rm alphamatrix-etl
    }
    
    "test" {
        Write-Host "Running all tests..." -ForegroundColor Yellow
        docker run --rm alphamatrix-test
    }
    
    "unit" {
        Write-Host "Running unit tests..." -ForegroundColor Yellow
        docker run --rm alphamatrix-test pytest -m "unit"
    }
    
    "integration" {
        Write-Host "Running integration tests..." -ForegroundColor Yellow
        docker run --rm alphamatrix-test pytest -m "integration"
    }
}
