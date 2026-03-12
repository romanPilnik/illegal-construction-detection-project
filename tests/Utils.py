from pprint import pprint
import uuid
import requests

def pretty_print(msg, indent=2):
    print("\n--- Server Response ---")
    pprint(msg, indent=indent)
    print("-----------------------\n")


def register_test_user(auth_url):
    uid = uuid.uuid4().hex[:8]
    user_data = {
        "email": f"inspector_{uid}@test.co.il",
        "password": "Password123!",
        "role": "Admin",
        "username": f"Test_USER_{uid}",
    }
    response = requests.post(f"{auth_url}/register", json=user_data)
    user_id = response.json().get("userId")
    return user_data, user_id

