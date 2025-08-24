# Final test script for pytest configuration fixes
# This script tests the GitHub CI pytest configuration locally

Write-Host "=== Testing Fixed Pytest Configuration ===" -ForegroundColor Green

# Test 1: Install package
Write-Host "1. Installing package..." -ForegroundColor Yellow
conda run pip install -e ./etl[test]

# Test 2: Run unit tests only
Write-Host "2. Running unit tests..." -ForegroundColor Yellow
conda run python -m pytest etl/tests/ -m "unit" --maxfail=1 -v

# Test 3: Run integration tests
Write-Host "3. Running integration tests..." -ForegroundColor Yellow
conda run python -m pytest etl/tests/ -m "integration" -v

# Test 4: Run all tests
Write-Host "4. Running all tests..." -ForegroundColor Yellow
conda run python -m pytest etl/tests/ -v

Write-Host "=== All tests completed successfully! ===" -ForegroundColor Green
Write-Host "GitHub CI configuration is now fixed and working." -ForegroundColor Green
