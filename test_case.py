import pytest
from fastapi.testclient import TestClient
from app.main import app  # Make sure your FastAPI app is imported correctly
from app.models import Product

client = TestClient(app)

def test_home_page():
    response = client.get("/")
    assert response.status_code == 200

def test_add_product():
    # Example form data
    data = {
        "id": 1,
        "name": "Test Product",
        "sku": "TP001",
        "price": 99.99,
        "stock": 10
    }
    response = client.post("/add", data=data)
    assert response.status_code == 200
    assert "Test Product" in response.text

def test_add_to_cart():
    # First, add a product
    product = Product(id=2, name="Cart Product", sku="CP001", price=50.0, stock=5)
    response = client.post(f"/add-to-cart/{product.id}")
    assert response.status_code == 200


def test_view_cart():
    response = client.get("/cart")
    assert response.status_code == 200
    # Just check the cart HTML has some expected content
    assert "Cart" in response.text
