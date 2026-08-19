"""
Integration tests for authentication endpoints.
Tests public/protected endpoints, token rejection, and registration/login contracts.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_protected_endpoint_without_token_returns_401():
    response = client.get("/api/v1/cases")
    assert response.status_code == 401
    assert "detail" in response.json()


def test_protected_endpoint_with_invalid_token_returns_401():
    headers = {"Authorization": "Bearer invalid_garbage_jwt_token_12345"}
    response = client.get("/api/v1/cases", headers=headers)
    assert response.status_code == 401


def test_login_validation_error_on_short_password():
    response = client.post("/api/v1/auth/login", json={"email": "invalid", "password": "123"})
    assert response.status_code == 422  # Validation error


def test_register_validation_error_on_invalid_email():
    response = client.post("/api/v1/auth/register", json={"email": "not-an-email", "password": "123"})
    assert response.status_code == 422
