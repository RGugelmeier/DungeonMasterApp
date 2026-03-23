from server.tests.conftest import register_user, login_user


# ── Registration ──────────────────────────────────────────────

class TestRegister:
    def test_register_success(self, client):
        resp = register_user(client)
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"
        assert "id" in data

    def test_register_missing_fields(self, client):
        resp = client.post("/auth/register", json={"username": "u"})
        assert resp.status_code == 400

    def test_register_empty_body(self, client):
        resp = client.post("/auth/register", content_type="application/json")
        assert resp.status_code == 400

    def test_register_password_too_short(self, client):
        resp = register_user(client, password="short")
        assert resp.status_code == 400
        assert "Password too short" in resp.get_json()["error"]

    def test_register_duplicate_username(self, client):
        register_user(client, username="dup", email="a@a.com")
        resp = register_user(client, username="dup", email="b@b.com")
        assert resp.status_code == 409

    def test_register_duplicate_email(self, client):
        register_user(client, username="user1", email="same@e.com")
        resp = register_user(client, username="user2", email="same@e.com")
        assert resp.status_code == 409


# ── Login ─────────────────────────────────────────────────────

class TestLogin:
    def test_login_success(self, client):
        register_user(client)
        resp = login_user(client)
        assert resp.status_code == 200
        assert resp.get_json()["Status"] == "Login successful!"
        # JWT cookie should be set
        cookies = {c.name for c in client.cookie_jar}
        assert "access_token_cookie" in cookies

    def test_login_wrong_password(self, client):
        register_user(client)
        resp = login_user(client, password="wrongpassword")
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client):
        resp = login_user(client, email="nobody@example.com")
        assert resp.status_code == 404

    def test_login_missing_fields(self, client):
        resp = client.post("/auth/login", json={"email": "a@a.com"})
        assert resp.status_code == 400

    def test_login_empty_body(self, client):
        resp = client.post("/auth/login", content_type="application/json")
        assert resp.status_code == 400


# ── Logout ────────────────────────────────────────────────────

class TestLogout:
    def test_logout_success(self, client):
        register_user(client)
        login_user(client)
        resp = client.post("/auth/logout")
        assert resp.status_code == 200
        assert resp.get_json()["Status"] == "Logout successful"

    def test_logout_without_login(self, client):
        resp = client.post("/auth/logout")
        # Should fail because there's no valid JWT
        assert resp.status_code == 401
