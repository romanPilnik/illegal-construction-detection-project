import uuid
import unittest
import requests
from pprint import pprint


AUTH_URL = "http://localhost:5001/api/v1/auth"
ANALYSE_URL = "http://localhost:5001/api/v1/analyses"
USERS_URL = "http://localhost:5001/api/v1/users"

unique_id = uuid.uuid4().hex[:8]
image_path = r"C:\Users\david\OneDrive\Pictures\gitHub_screenshot.png"

TEST_USER = {
    "email": f"inspector_{unique_id}test@co.il",
    "password": "Password123!",
    "role": "Admin",
    "username": f"Test_USER_{unique_id}",
}

LOGIN_USER = {
    "email": TEST_USER["email"],
    "password": TEST_USER["password"]
}

def pretty_print(msg, indent=2):
    print("\n--- Server Response ---")
    pprint(msg, indent=indent)
    print("-----------------------\n")


class TestAPI(unittest.TestCase):
    token = None
    user_id = None

    def test_1_register(self):
        response = requests.post(f"{AUTH_URL}/register", json=TEST_USER)
        try:
            pretty_print(response.json())
        except requests.exceptions.RequestException as e:
            pretty_print(response.text)
        self.assertEqual(response.status_code, 201, f"Registration failed: {response.text}")
        data = response.json()
        TestAPI.user_id = data.get("userId")

    def test_2_login(self):
        response = requests.post(f"{AUTH_URL}/login", json=LOGIN_USER)
        try:
            pretty_print(response.json())
        except requests.exceptions.RequestException as e:
            pretty_print(response.text)
        self.assertEqual(response.status_code, 200, f"Login failed: {response.text}")
        data = response.json()
        TestAPI.token = data.get("token")
        self.assertIn("token", data, "No token returned!")


    def test_3_upload_image(self):
        if not TestAPI.token:
            self.skipTest("No token available.")

        headers = {
            "Authorization": f"Bearer {TestAPI.token}"
        }

        payload = {
            "location_address": "רחוב ז'בוטינסקי 12, רמת גן"
        }

        with open(image_path, "rb") as before_img, open(image_path, "rb") as after_img:
            files = {
                "beforeImage": (f"before_{unique_id}.png", before_img, "image/png"),
                "afterImage": (f"after_{unique_id}.png", after_img, "image/png"),
            }
            response = requests.post(f"{ANALYSE_URL}/analyse", files=files, data=payload, headers=headers)

        try:
            pretty_print(response.json())
        except requests.exceptions.RequestException as e:
            pretty_print(response.text)

        self.assertEqual(response.status_code, 201)

    def test_4_get_users(self):
        if not TestAPI.token:
            self.skipTest("No token available.")
        headers = {"Authorization" : f"Bearer {TestAPI.token}"}

        response = requests.get(USERS_URL, headers=headers)
        self.assertEqual(response.status_code, 200)
        pretty_print(response.json())

    def test_5_get_user_by_ID(self):
        if not TestAPI.token or not TestAPI.user_id:
            self.skipTest("Missing Token or User ID.")
        headers = {"Authorization" : f"Bearer {TestAPI.token}"}

        response = requests.get(f"{USERS_URL}/{TestAPI.user_id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        try:
            pretty_print(response.json())
        except requests.exceptions.JSONDecodeError:
            pretty_print(response.text)


    def test_6_delete_user(self):
        if not TestAPI.token or not TestAPI.user_id:
            self.skipTest("Missing Token or User ID.")

        headers = {
            "Authorization": f"Bearer {TestAPI.token}"
        }

        response = requests.delete(f"{USERS_URL}/{TestAPI.user_id}",headers=headers)
        pretty_print(f"Status: {response.status_code}, Response: {response.text}")
        self.assertEqual(response.status_code, 200, f"Delete failed: {response.text}")

        delete_user_data = response.json().get("data", {})
        self.assertFalse(delete_user_data.get("is_active"), "User is_active should be False but is TRUE")



if __name__ == '__main__':
    unittest.main()