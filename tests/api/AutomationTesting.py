import uuid
import unittest
import requests
from tests.api.Utils import register_test_user, pretty_print
from tests.api.TestConfig import   AUTH_URL, ANALYSE_URL, USERS_URL


unique_id = uuid.uuid4().hex[:8]
image_path = r"C:\Users\david\OneDrive\Pictures\gitHub_screenshot.png"

class TestAuthApi(unittest.TestCase):

    def setUp(self):
        self.user_id = None
        self.token = None

    def tearDown(self):
        if self.user_id:
            if not self.token:
                print("[TearDown] No token found, logging in for cleanup...")
                login_res = requests.post(f"{AUTH_URL}/login", json=self.user_creds)
                self.token = login_res.json().get("token")

            try:
                headers = {"Authorization": f"Bearer {self.token}"}
                requests.delete(f"{USERS_URL}/{self.user_id}", headers=headers)
            except Exception as e:
                print(f"Cleanup Error: {e}")

    def test_1_register(self):
        self.user_creds, self.user_id = register_test_user(AUTH_URL)
        self.assertIsNotNone(self.user_id, "Registration failed: no userId returned")
        pretty_print({"message": "User registered", "userId": self.user_id})

    def test_2_login(self):
        self.user_creds, self.user_id = register_test_user(AUTH_URL)

        response = requests.post(f"{AUTH_URL}/login", json={
            "email": self.user_creds["email"],
            "password": self.user_creds["password"]
        })
        try:
            pretty_print(response.json())
        except requests.exceptions.RequestException:
            pretty_print(response.text)
        self.assertEqual(response.status_code, 200, f"Login failed: {response.text}")
        data = response.json()
        self.token = data.get("token")
        self.assertIn("token", data, "No token returned!")


class TestAPI(unittest.TestCase):

    def setUp(self):
        self.user_creds, self.user_id = register_test_user(AUTH_URL)
        login_payload = {
            "email": self.user_creds["email"],
            "password": self.user_creds["password"]
        }
        login_res = requests.post(f"{AUTH_URL}/login", json=login_payload)
        self.assertEqual(login_res.status_code, 200)
        self.token = login_res.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def tearDown(self):
        if hasattr(self, 'user_id') and self.user_id:
            print(f"\n[TearDown] Cleaning up user: {self.user_id}")

            try:
                headers = {"Authorization": f"Bearer {self.token}"}
                requests.delete(f"{USERS_URL}/{self.user_id}", headers=headers)
            except Exception as e:
                print(f"Cleanup Error: {e}")

    def test_3_upload_image(self):
        payload = {
            "location_address": "רחוב ז'בוטינסקי 12, רמת גן"
        }

        with open(image_path, "rb") as before_img, open(image_path, "rb") as after_img:
            files = {
                "beforeImage": (f"before_{unique_id}.png", before_img, "image/png"),
                "afterImage": (f"after_{unique_id}.png", after_img, "image/png"),
            }
            response = requests.post(f"{ANALYSE_URL}/analyse", files=files, data=payload, headers=self.headers)

        try:
            pretty_print(response.json())
        except requests.exceptions.RequestException:
            pretty_print(response.text)

        self.assertEqual(response.status_code, 201)

    def test_4_get_users(self):
        response = requests.get(USERS_URL, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        pretty_print(response.json())

    def test_5_get_user_by_ID(self):
        response = requests.get(f"{USERS_URL}/{self.user_id}", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        try:
            pretty_print(response.json())
        except requests.exceptions.JSONDecodeError:
            pretty_print(response.text)

    def test_6_delete_user(self):
        response = requests.delete(f"{USERS_URL}/{self.user_id}",headers=self.headers)
        pretty_print(f"Status: {response.status_code}, Response: {response.text}")
        self.assertEqual(response.status_code, 200, f"Delete failed: {response.text}")

        delete_user_data = response.json().get("data", {})
        self.assertFalse(delete_user_data.get("is_active"), "User is_active should be False but is TRUE")



if __name__ == '__main__':
    unittest.main()