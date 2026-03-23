from server.tests.conftest import register_user, login_user


def _authed_client(client):
    """Register + login so the client has a valid JWT cookie."""
    register_user(client)
    login_user(client)
    return client


# ── GET /users ────────────────────────────────────────────────

class TestGetUsers:
    def test_get_users_authenticated(self, client):
        _authed_client(client)
        resp = client.get("/users")
        assert resp.status_code == 200
        data = resp.get_json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["email"] == "test@example.com"

    def test_get_users_unauthenticated(self, client):
        resp = client.get("/users")
        assert resp.status_code == 401


# ── PATCH /users/modify ──────────────────────────────────────

class TestModifyUser:
    def test_modify_username(self, client):
        _authed_client(client)
        # Get the user_id from the users list
        user_id = client.get("/users").get_json()[0]["user_id"]
        resp = client.patch("/usersmodify", json={
            "user_id": user_id,
            "new_username": "updated_name",
        })
        assert resp.status_code == 200
        assert resp.get_json()["username"] == "updated_name"

    def test_modify_email(self, client):
        _authed_client(client)
        user_id = client.get("/users").get_json()[0]["user_id"]
        resp = client.patch("/usersmodify", json={
            "user_id": user_id,
            "new_email": "newemail@example.com",
        })
        assert resp.status_code == 200
        assert resp.get_json()["email"] == "newemail@example.com"

    def test_modify_missing_data(self, client):
        _authed_client(client)
        resp = client.patch("/usersmodify", json={})
        assert resp.status_code == 400

    def test_modify_unauthenticated(self, client):
        resp = client.patch("/usersmodify", json={"user_id": 1, "new_username": "x"})
        assert resp.status_code == 401


# ── DELETE /users/delete ──────────────────────────────────────

class TestDeleteUser:
    def test_delete_user_success(self, client):
        _authed_client(client)
        user_id = client.get("/users").get_json()[0]["user_id"]
        resp = client.delete("/usersdelete", json={"user_id": user_id})
        assert resp.status_code == 200
        assert resp.get_json()["deleted_user_id"] == user_id

    def test_delete_nonexistent_user(self, client):
        _authed_client(client)
        resp = client.delete("/usersdelete", json={"user_id": 99999})
        assert resp.status_code == 400

    def test_delete_missing_data(self, client):
        _authed_client(client)
        resp = client.delete("/usersdelete", json={})
        assert resp.status_code == 400

    def test_delete_unauthenticated(self, client):
        resp = client.delete("/usersdelete", json={"user_id": 1})
        assert resp.status_code == 401
