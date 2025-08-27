from http import HTTPStatus


def test_list_symbols_ok(client):
    r = client.get("/v1/symbols")
    assert r.status_code == HTTPStatus.OK
    body = r.json()
    assert isinstance(body, dict)
    assert "symbols" in body
    assert isinstance(body["symbols"], list)
    assert all(isinstance(s, str) for s in body["symbols"])  # basic schema


def test_list_symbols_with_query_and_limit(client):
    r = client.get("/v1/symbols", params={"q": "AA", "limit": 2})
    assert r.status_code == HTTPStatus.OK
    body = r.json()
    assert len(body["symbols"]) <= 2

