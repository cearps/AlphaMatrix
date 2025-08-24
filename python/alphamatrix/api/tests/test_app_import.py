"""
Test that API app can be imported successfully.
"""
import pytest

@pytest.mark.unit
def test_imports_ok():
    """Test that the API app module can be imported."""
    import alphamatrix.api.app as appmod
    assert hasattr(appmod, "app")
    assert hasattr(appmod.app, "get")
    assert hasattr(appmod.app, "post")

@pytest.mark.unit
def test_health_endpoint_exists():
    """Test that the health endpoint is registered."""
    import alphamatrix.api.app as appmod
    
    # Check if health endpoint is in the app routes
    routes = [route.path for route in appmod.app.routes]
    assert "/health" in routes
