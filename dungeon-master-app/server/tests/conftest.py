import os
import tempfile

# Set env vars BEFORE importing from server.
# server/__init__.py calls load_dotenv at import time, but load_dotenv
# does not override existing env vars, so these take precedence.
_db_path = os.path.join(tempfile.gettempdir(), "dm_app_test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_db_path}"
os.environ["JWT_SECRET"] = "test-secret-key-for-testing-only"

import pytest
from server import create_app
from server.database import db as _db


@pytest.fixture()
def app():
    """Create a fresh test app with a file-based SQLite database."""
    if os.path.exists(_db_path):
        try:
            os.remove(_db_path)
        except OSError:
            pass

    test_app = create_app()
    test_app.config["TESTING"] = True
    # Disable CSRF for cookie-based JWT so tests don't need CSRF tokens
    test_app.config["JWT_COOKIE_CSRF_PROTECT"] = False

    yield test_app

    with test_app.app_context():
        _db.session.remove()
        _db.drop_all()
        _db.engine.dispose()


@pytest.fixture()
def client(app):
    """A Flask test client."""
    return app.test_client()


def register_user(client, username="testuser", email="test@example.com", password="password123"):
    """Helper to register a user. Returns the response."""
    return client.post("/auth/register", json={
        "username": username,
        "email": email,
        "password": password,
    })


def login_user(client, email="test@example.com", password="password123"):
    """Helper to log in a user. Returns the response (which sets JWT cookies)."""
    return client.post("/auth/login", json={
        "email": email,
        "password": password,
    })
