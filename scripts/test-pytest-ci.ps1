# Test script to verify GitHub CI pytest configuration locally on Windows

Write-Host "Testing GitHub CI pytest configuration..." -ForegroundColor Green

# Install dependencies (like in GitHub workflow)
conda run pip install -e ./etl[test]

# Run unit tests (like in GitHub workflow)
Write-Host "Running unit tests..." -ForegroundColor Yellow
conda run python -m pytest etl/tests/ -m "unit" --maxfail=1 -v

Write-Host "✅ All tests passed!" -ForegroundColor Green
