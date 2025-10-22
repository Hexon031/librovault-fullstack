import os
from dotenv import load_dotenv
from supabase import create_client, Client

# --- SCRIPT CONFIGURATION ---
# 1. PASTE THE USER ID YOU COPIED FROM THE SUPABASE DASHBOARD
USER_ID_TO_UPDATE = "8ae33fc0-883f-44b7-8ba8-ac37c95c8e0b"

# 2. SET THE USERNAME YOU WANT TO DISPLAY
NEW_USERNAME = "Sayan" 

# --- DO NOT CHANGE ANYTHING BELOW THIS LINE ---
print("Loading environment variables...")
load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
service_key: str = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not service_key:
    print("Error: Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are in your .env file.")
    exit()

print("Connecting to Supabase as admin...")
supabase: Client = create_client(url, service_key)

print(f"Attempting to update user {USER_ID_TO_UPDATE}...")

try:
    # Update both the role and username in the user's metadata
    response = supabase.auth.admin.update_user_by_id(
        USER_ID_TO_UPDATE,
        {"user_metadata": {"role": "admin", "username": NEW_USERNAME}}
    )
    print("✅ Successfully updated user metadata!")
    print(f"   Role set to: admin")
    print(f"   Username set to: {NEW_USERNAME}")
    print("You can now delete this script (`set_admin.py`).")
except Exception as e:
    print(f"❌ An error occurred: {e}")