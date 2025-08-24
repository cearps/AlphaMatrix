"""
API tests configuration and fixtures.
"""
import pytest
from fastapi.testclient import TestClient
from alphamatrix.api.tests.test_app import test_app

@pytest.fixture
def client():
    """Provide a test client with mocked dependencies."""
    return TestClient(test_app)
