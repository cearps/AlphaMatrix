#!/usr/bin/env python3
"""
Simple test script to verify imports work correctly.
"""
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_import():
    """Run a series of import checks and assert success."""
    def try_import(module_name, description):
        try:
            __import__(module_name)
            print(f"✅ {description}: {module_name}")
            return True
        except Exception as e:
            print(f"❌ {description}: {module_name}")
            print(f"   Error: {e}")
            return False

def main():
    print("Testing AlphaMatrix imports...")
    print("=" * 50)
    
    tests = [
        ("alphamatrix", "Main package"),
        ("alphamatrix.common", "Common utilities"),
        ("alphamatrix.common.logging", "Logging utilities"),
        ("alphamatrix.common.env", "Environment utilities"),
        ("alphamatrix.common.ids", "ID generation"),
        ("alphamatrix.api", "API package"),
        ("alphamatrix.api.tests", "API tests"),
        ("alphamatrix.etl", "ETL package"),
        ("alphamatrix.etl.tests", "ETL tests"),
    ]
    
    success_count = 0
    total_count = len(tests)
    
    for module_name, description in tests:
        if try_import(module_name, description):
            success_count += 1
        print()
    
    print("=" * 50)
    print(f"Results: {success_count}/{total_count} imports successful")
    
    assert success_count == total_count, "Some imports failed"

if __name__ == "__main__":
    sys.exit(main())
