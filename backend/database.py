import os
import datetime
from pymongo import MongoClient
from bson.objectid import ObjectId
import bcrypt

# MongoDB Connection String from User
MONGO_URI = "mongodb+srv://admin:YDtEVdA8TepWvSeA@cluster0.cmnwha1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

# Initialize Client and Database
client = MongoClient(MONGO_URI)
db = client['attention_trace_db']

# Collections
users_collection = db['users']
campaigns_collection = db['campaigns']
sessions_collection = db['sessions']
otps_collection = db['otps']
settings_collection = db['settings']
payments_collection = db['payments']

def save_otp(email, otp):
    # Upsert OTP so previous ones are overwritten
    otps_collection.update_one(
        {"email": email},
        {"$set": {
            "otp": otp,
            "created_at": datetime.datetime.utcnow(),
            "expires_at": datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
        }},
        upsert=True
    )

def verify_otp(email, otp):
    doc = otps_collection.find_one({"email": email, "otp": otp})
    if not doc:
        return False
    if datetime.datetime.utcnow() > doc["expires_at"]:
        return False
    # OTP is valid, delete it
    otps_collection.delete_one({"_id": doc["_id"]})
    return True

def verify_password(plain_password, hashed_password):
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except ValueError:
        return False

def get_password_hash(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_user(email, username, name, password):
    # Check if email or username already exists
    if users_collection.find_one({"$or": [{"email": email}, {"username": username}]}):
        return False
    
    hashed_password = get_password_hash(password)
    users_collection.insert_one({
        "email": email,
        "username": username,
        "name": name,
        "password": hashed_password,
        "auth_provider": "local",
        "role": "user",
        "created_at": datetime.datetime.utcnow()
    })
    return True

def update_user_password(email, new_password):
    hashed_password = get_password_hash(new_password)
    result = users_collection.update_one(
        {"email": email, "auth_provider": "local"},
        {"$set": {"password": hashed_password}}
    )
    return result.modified_count > 0

def verify_user(identifier, password):
    # Identifier can be email or username
    user = users_collection.find_one({"$or": [{"email": identifier}, {"username": identifier}]})
    if not user:
        return None
    # Google users won't have a password set the same way, or might have "auth_provider": "google"
    if not user.get("password") or not verify_password(password, user["password"]):
        return None
    return str(user["_id"])

def get_or_create_google_user(email, name):
    user = users_collection.find_one({"email": email})
    if user:
        return str(user["_id"])
    
    # Create new google user
    username = email.split("@")[0]
    
    # Ensure username is unique
    base_username = username
    counter = 1
    while users_collection.find_one({"username": username}):
        username = f"{base_username}{counter}"
        counter += 1

    result = users_collection.insert_one({
        "email": email,
        "username": username,
        "name": name,
        "auth_provider": "google",
        "role": "user",
        "created_at": datetime.datetime.utcnow()
    })
    return str(result.inserted_id)

def create_campaign(user_id, website_url, ad_media, ad_name="", click_url=""):
    campaigns_collection.insert_one({
        "user_id": str(user_id),
        "website_url": website_url,
        "ad_media": ad_media,
        "ad_name": ad_name,
        "click_url": click_url,
        "created_at": datetime.datetime.utcnow()
    })

def delete_campaign(campaign_id, user_id):
    result = campaigns_collection.delete_one({"_id": ObjectId(campaign_id), "user_id": str(user_id)})
    return result.deleted_count > 0

def delete_sessions_by_campaign(campaign_id):
    sessions_collection.delete_many({"campaign_id": str(campaign_id)})

def get_campaigns_by_user(user_id):
    cursor = campaigns_collection.find({"user_id": str(user_id)})
    campaigns = []
    for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        campaigns.append(doc)
    return campaigns

def get_all_campaigns():
    cursor = campaigns_collection.find({})
    campaigns = []
    for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        campaigns.append(doc)
    return campaigns

def save_session(campaign_id, time_spent, clicks, avg_emotion, heatmap_data,
                  emotion_timeline=None, gaze_timeline=None,
                  hover_zones=None, mouse_velocity_avg=0,
                  idle_time=0, active_time=0, tab_hidden_time=0,
                  face_detected_pct=0, gaze_on_ad_pct=0):
    sessions_collection.insert_one({
        "campaign_id": str(campaign_id),
        "time_spent": time_spent,
        "clicks": clicks,
        "avg_emotion": avg_emotion,
        "heatmap_data": heatmap_data,
        "emotion_timeline": emotion_timeline or [],
        "gaze_timeline": gaze_timeline or [],
        "hover_zones": hover_zones or {},
        "mouse_velocity_avg": mouse_velocity_avg,
        "idle_time": idle_time,
        "active_time": active_time,
        "tab_hidden_time": tab_hidden_time,
        "face_detected_pct": face_detected_pct,
        "gaze_on_ad_pct": gaze_on_ad_pct,
        "created_at": datetime.datetime.utcnow()
    })

def get_sessions_by_campaign(campaign_id):
    cursor = sessions_collection.find({"campaign_id": str(campaign_id)})
    sessions = []
    for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        sessions.append(doc)
    return sessions

def get_user_by_id(user_id):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user:
        user["id"] = str(user["_id"])
        del user["_id"]
        if "password" in user:
            del user["password"]
    return user

def get_global_setting(key, default=None):
    setting = settings_collection.find_one({"key": key})
    if setting:
        return setting.get("value")
    return default

def set_global_setting(key, value):
    settings_collection.update_one(
        {"key": key},
        {"$set": {"value": value, "updated_at": datetime.datetime.utcnow()}},
        upsert=True
    )

def get_platform_stats():
    total_users = users_collection.count_documents({})
    total_campaigns = campaigns_collection.count_documents({})
    total_sessions = sessions_collection.count_documents({})
    total_subscribers = users_collection.count_documents({"subscription_status": "active"})
    return {
        "total_users": total_users,
        "total_campaigns": total_campaigns,
        "total_sessions": total_sessions,
        "total_subscribers": total_subscribers
    }

def get_user_campaign_count(user_id):
    return campaigns_collection.count_documents({"user_id": str(user_id)})

def set_user_subscription(user_id, plan, duration_days=30):
    now = datetime.datetime.utcnow()
    expiry = now + datetime.timedelta(days=duration_days)
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "subscription_status": "active",
            "subscription_plan": plan,
            "subscription_start": now,
            "subscription_expiry": expiry
        }}
    )

def cancel_user_subscription(user_id):
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"subscription_status": "cancelled"}}
    )

def create_payment_record(user_id, plan, amount, transaction_id, billing_name, billing_address, billing_phone):
    payment = {
        "user_id": str(user_id),
        "plan": plan,
        "amount": amount,
        "transaction_id": transaction_id,
        "billing_name": billing_name,
        "billing_address": billing_address,
        "billing_phone": billing_phone,
        "status": "pending",
        "created_at": datetime.datetime.utcnow()
    }
    payments_collection.insert_one(payment)
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"subscription_status": "pending_verification"}}
    )

def get_pending_payments():
    cursor = payments_collection.find({"status": "pending"})
    payments = []
    for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        # Add user email for admin context
        user = get_user_by_id(doc["user_id"])
        doc["user_email"] = user.get("email", "Unknown") if user else "Unknown"
        payments.append(doc)
    return payments

def approve_payment(payment_id):
    payment = payments_collection.find_one({"_id": ObjectId(payment_id)})
    if payment and payment["status"] == "pending":
        payments_collection.update_one(
            {"_id": ObjectId(payment_id)},
            {"$set": {"status": "approved", "processed_at": datetime.datetime.utcnow()}}
        )
        set_user_subscription(payment["user_id"], payment["plan"], duration_days=30)
        return True
    return False

def reject_payment(payment_id):
    payment = payments_collection.find_one({"_id": ObjectId(payment_id)})
    if payment and payment["status"] == "pending":
        payments_collection.update_one(
            {"_id": ObjectId(payment_id)},
            {"$set": {"status": "rejected", "processed_at": datetime.datetime.utcnow()}}
        )
        users_collection.update_one(
            {"_id": ObjectId(payment["user_id"])},
            {"$set": {"subscription_status": "none"}}
        )
        return True
    return False

def check_subscription_active(user_id):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return False
    if user.get("role") == "admin":
        return True  # Admin always has full access
    status = user.get("subscription_status")
    if status != "active":
        return False
    expiry = user.get("subscription_expiry")
    if expiry and datetime.datetime.utcnow() > expiry:
        # Subscription expired, update status
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"subscription_status": "expired"}}
        )
        return False
    return True
