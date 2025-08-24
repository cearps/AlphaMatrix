#!/bin/bash
# Test script to verify GitHub CI pytest configuration locally

set -e

echo "Testing GitHub CI pytest configuration..."

# Install dependencies (like in GitHub workflow)
pip install -e ./etl[test]

# Run unit tests (like in GitHub workflow)
echo "Running unit tests..."
python -m pytest etl/tests/ -m "unit" --maxfail=1 -v

echo "✅ All tests passed!"
