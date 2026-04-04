import os
from dotenv import load_dotenv

load_dotenv()


BASE_URL = os.getenv("SERVER_URL", "http://localhost:5001/api/v1")
AUTH_URL = f"{BASE_URL}/auth"
ANALYSE_URL = f"{BASE_URL}/analyses"
USERS_URL = f"{BASE_URL}/users"