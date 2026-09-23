import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"
    assert "database" in data

def test_presets_endpoint(client):
    response = client.get("/api/products/presets")
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert len(data["presets"]) > 0

def test_single_text_sentiment(client):
    response = client.post("/api/sentiment/analyze", json={"text": "This product works exceptionally well!"})
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["analysis"]["sentiment"] == "Positive"

def test_analyze_demo_product(client):
    response = client.post("/api/products/analyze", json={
        "query_or_url": "demo_iphone_15_pro",
        "source": "Amazon",
        "max_reviews": 10
    })
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["is_demo"] is True
    assert "analytics" in data
    assert data["analytics"]["total_reviews"] > 0
