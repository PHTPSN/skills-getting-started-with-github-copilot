import copy

from fastapi.testclient import TestClient

from src.app import app, activities

client = TestClient(app)


# keep a pristine copy of the activities so tests can reset between runs
_original_activities = copy.deepcopy(activities)


def reset_activities():
    activities.clear()
    activities.update(copy.deepcopy(_original_activities))


def test_get_activities():
    reset_activities()
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # basic sanity
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_duplicate():
    reset_activities()
    activity = "Chess Club"
    email = "test@example.com"
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    # second signup should be rejected
    resp2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp2.status_code == 400
    assert "already signed up" in resp2.json().get("detail", "")


def test_remove_participant():
    reset_activities()
    activity = "Chess Club"
    email = "removeme@example.com"
    # sign up first
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    # remove
    resp2 = client.delete(f"/activities/{activity}/participant?email={email}")
    assert resp2.status_code == 200
    # verify removal
    resp3 = client.delete(f"/activities/{activity}/participant?email={email}")
    assert resp3.status_code == 404
