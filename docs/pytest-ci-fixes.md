# Pytest CI Configuration Fixes

## Issues Found and Fixed

### 1. Duplicate Test Directories

**Problem**: There were duplicate test directories at both `tests/` and `etl/tests/`, causing import conflicts.

**Solution**: Removed the duplicate `tests/` directory, keeping only `etl/tests/`.

### 2. Pytest Configuration Issues

**Problem**: The pytest configuration in `etl/pyproject.toml` had incorrect testpaths and missing pythonpath.

**Solution**:

- Updated `testpaths` from `["etl/tests"]` to `["tests"]` (relative to where pytest runs)
- Added `pythonpath = ["."]` to ensure the etl module can be imported

### 3. GitHub Workflow Configuration

**Problem**: The workflow was running pytest from the wrong directory.

**Solution**: Updated the workflow to run from the root directory:

```yaml
- name: Run unit tests
  run: |
    python -m pytest etl/tests/ -m "unit" --maxfail=1 -v
```

### 4. Docker Test Configuration

**Problem**: Docker test configuration was running from the wrong directory.

**Solution**: Updated Docker commands to run from root directory:

```dockerfile
CMD ["python", "-m", "pytest", "etl/tests/", "-m", "unit", "--maxfail=1", "-v"]
```

## Files Modified

1. **`.github/workflows/pytest.yml`** - Updated to run pytest from root directory
2. **`etl/pyproject.toml`** - Fixed testpaths and added pythonpath
3. **`infra/etl/Dockerfile.test`** - Updated test command
4. **`infra/etl/docker-compose.test.yml`** - Updated test command
5. **`scripts/test-pytest-ci.ps1`** - Updated for Windows testing
6. **`scripts/test-pytest-ci.sh`** - Updated for Unix testing

## Test Results

After fixes:

- ✅ Unit tests: 24 passed, 2 deselected
- ✅ Integration tests: 2 passed, 24 deselected
- ✅ All tests: 26 passed
- ✅ Coverage reporting working
- ✅ Custom markers (unit, integration) working

## How to Test Locally

### Windows (PowerShell)

```powershell
.\scripts\test-pytest-final.ps1
```

### Unix/Linux

```bash
./scripts/test-pytest-ci.sh
```

### Docker

```bash
cd infra/etl
docker-compose -f docker-compose.test.yml build
docker-compose -f docker-compose.test.yml run test
```

## Key Learnings

1. **Module Import**: The `etl` module must be installed in development mode from the root directory
2. **Pytest Paths**: Test paths should be relative to where pytest is executed from
3. **Python Path**: The `pythonpath` configuration is crucial for module discovery
4. **Directory Structure**: Running from the correct directory is essential for proper module resolution

The GitHub CI workflow should now work correctly when triggered by pull requests that modify files in the `etl/` directory.
