from fastapi import FastAPI, HTTPException, UploadFile, File, Form, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import database as db
import analytics_engine as ae
import os
import time
import json
import shutil
import base64
import cv2
import numpy as np
from fer import FER
import mediapipe as mp
from datetime import datetime, timedelta
from jose import JWTError, jwt
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from google.oauth2 import id_token
from google.auth.transport import requests
from fastapi.staticfiles import StaticFiles

app = FastAPI()

os.makedirs("uploads", exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Middleware to disable caching on static/uploads so browsers always get fresh trace.js
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest

class NoCacheStaticMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        response = await call_next(request)
        if request.url.path.startswith("/static/") or request.url.path.startswith("/uploads/"):
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response

app.add_middleware(NoCacheStaticMiddleware)
detector = FER(mtcnn=False)

from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# MediaPipe FaceLandmarker for gaze tracking
model_path = os.path.join(os.path.dirname(__file__), "models", "face_landmarker.task")
face_landmarker = None

try:
    if os.path.exists(model_path):
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=True,
            output_face_transformation_matrixes=True,
            num_faces=1)
        face_landmarker = vision.FaceLandmarker.create_from_options(options)
        print("MediaPipe FaceLandmarker initialized.")
    else:
        print(f"Warning: MediaPipe model not found at {model_path}. Gaze tracking will be disabled.")
except Exception as e:
    print(f"Error initializing MediaPipe: {e}")

# Iris landmark indices for gaze estimation
LEFT_IRIS = [474, 475, 476, 477]
RIGHT_IRIS = [469, 470, 471, 472]
LEFT_EYE_CORNERS = [33, 133]
RIGHT_EYE_CORNERS = [362, 263]

# JWT CONFIGURATION
SECRET_KEY = "super_secret_jwt_key_for_attention_trace"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login", auto_error=False)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

from fastapi import Query

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), q_token: Optional[str] = Query(None, alias="token")):
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials")
    
    # Use query token if provided, else use header token
    final_token = q_token if q_token else token
    
    if not final_token:
        raise credentials_exception

    try:
        payload = jwt.decode(final_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
        # Strict DB Check: Prevent 'Ghost' Sessions for deleted users
        if not db.get_user_by_id(user_id):
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    return user_id

class UserSignup(BaseModel):
    name: str
    username: str
    email: str
    password: str

class VerifyOtp(BaseModel):
    name: str
    username: str
    email: str
    password: str
    otp: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ForgotPasswordConfirm(BaseModel):
    email: str
    otp: str
    new_password: str

class UserLogin(BaseModel):
    identifier: str
    password: str

class GoogleAuth(BaseModel):
    token: str

def send_otp_email(to_email, otp_code):
    SENDER_EMAIL = "sujiii2204@gmail.com"
    APP_PASSWORD = "esdtsvouxhkplgxt"
    
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = to_email
    msg['Subject'] = "Attention Trace - Your Verification Code"
    
    body = f"Hello!\n\nYour 6-digit verification code is: {otp_code}\n\nThis code will expire in 10 minutes."
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SENDER_EMAIL, APP_PASSWORD)
        server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send OTP: {e}")
        return False

@app.post("/api/signup/request-otp")
def request_otp(user: UserSignup):
    import re
    if len(user.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not re.search(r"[a-zA-Z]", user.password) or not re.search(r"\d", user.password) or not re.search(r"[^a-zA-Z\d]", user.password):
        raise HTTPException(status_code=400, detail="Password must contain letters, numbers, and a symbol")
    if not user.email.endswith("@gmail.com"):
        raise HTTPException(status_code=400, detail="Please use a valid @gmail.com address")

    # Check if user already exists BEFORE sending OTP
    if db.users_collection.find_one({"$or": [{"email": user.email}, {"username": user.username}]}):
        raise HTTPException(status_code=400, detail="Email or Username already exists")

    # Generate 6-digit OTP
    import random
    otp_code = str(random.randint(100000, 999999))
    
    db.save_otp(user.email, otp_code)
    
    # Send email
    if not send_otp_email(user.email, otp_code):
        raise HTTPException(status_code=500, detail="Failed to send verification email.")
        
    return {"message": "OTP sent successfully"}

@app.post("/api/signup/verify-otp")
def verify_otp(data: VerifyOtp):
    if not db.verify_otp(data.email, data.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    success = db.create_user(data.email, data.username, data.name, data.password)
    if success:
        return {"message": "User created successfully"}
    raise HTTPException(status_code=400, detail="Email or Username already exists")

@app.post("/api/password-reset/request")
def password_reset_request(data: ForgotPasswordRequest):
    user = db.users_collection.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    if user.get("auth_provider") != "local":
        raise HTTPException(status_code=400, detail="This account uses Google Sign-In. Reset your password through Google.")
        
    import random
    otp_code = str(random.randint(100000, 999999))
    db.save_otp(data.email, otp_code)
    
    if not send_otp_email(data.email, otp_code):
        raise HTTPException(status_code=500, detail="Failed to send verification email.")
        
    return {"message": "OTP sent to email"}

@app.post("/api/password-reset/confirm")
def password_reset_confirm(data: ForgotPasswordConfirm):
    import re
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not re.search(r"[a-zA-Z]", data.new_password) or not re.search(r"\d", data.new_password) or not re.search(r"[^a-zA-Z\d]", data.new_password):
        raise HTTPException(status_code=400, detail="Password must contain letters, numbers, and a symbol")
        
    if not db.verify_otp(data.email, data.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    if db.update_user_password(data.email, data.new_password):
        return {"message": "Password updated successfully"}
    raise HTTPException(status_code=500, detail="Failed to update password")

@app.post("/api/login")
def login(user: UserLogin):
    user_id = db.verify_user(user.identifier, user.password)
    if user_id:
        access_token = create_access_token(data={"sub": user_id})
        return {"access_token": access_token, "token_type": "bearer", "user_id": user_id}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/auth/google")
def google_auth(auth: GoogleAuth):
    try:
        CLIENT_ID = "72588428050-2ou8i0d2bn23jirg6dieu04tuh5i2irr.apps.googleusercontent.com"
        idinfo = id_token.verify_oauth2_token(auth.token, requests.Request(), CLIENT_ID, clock_skew_in_seconds=10)
        
        email = idinfo.get('email')
        name = idinfo.get('name', 'Google User')
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")
            
        user_id = db.get_or_create_google_user(email, name)
        
        access_token = create_access_token(data={"sub": user_id})
        return {"access_token": access_token, "token_type": "bearer", "user_id": user_id, "email": email}
    except ValueError as e:
        print(f"Google Auth Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid Google token")

class SettingsUpdate(BaseModel):
    public_api_url: str

@app.get("/api/users/me")
def get_user_profile(current_user_id: str = Depends(get_current_user)):
    user = db.get_user_by_id(current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/api/settings/public_url")
def get_public_url():
    # Return the global setting, or fallback to localhost if not set
    url = db.get_global_setting("public_api_url", "http://localhost:8000")
    return {"public_api_url": url}

@app.post("/api/settings/public_url")
def set_public_url(settings: SettingsUpdate, current_user_id: str = Depends(get_current_user)):
    user = db.get_user_by_id(current_user_id)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db.set_global_setting("public_api_url", settings.public_api_url)
    return {"message": "Settings updated successfully"}

@app.get("/api/admin/stats")
def get_admin_stats(current_user_id: str = Depends(get_current_user)):
    user = db.get_user_by_id(current_user_id)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.get_platform_stats()

# ---- Subscription Endpoints ----

class SubscriptionRequest(BaseModel):
    plan: str = "monthly"
    transaction_id: str
    billing_name: str
    billing_address: str
    billing_phone: str

@app.get("/api/subscription/pricing")
def get_subscription_pricing():
    """Public: returns current subscription pricing."""
    price = db.get_global_setting("subscription_price", 500.0)
    campaign_limit_free = db.get_global_setting("free_campaign_limit", 1)
    pro_campaign_limit = db.get_global_setting("pro_campaign_limit", 20)
    return {"price": price, "free_campaign_limit": campaign_limit_free, "pro_campaign_limit": pro_campaign_limit, "currency": "INR", "period": "month"}

@app.get("/api/subscription/status")
def get_subscription_status(current_user_id: str = Depends(get_current_user)):
    user = db.get_user_by_id(current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    is_active = db.check_subscription_active(current_user_id)
    campaign_count = db.get_user_campaign_count(current_user_id)
    free_limit = db.get_global_setting("free_campaign_limit", 1)
    pro_limit = db.get_global_setting("pro_campaign_limit", 20)
    is_admin = user.get("role") == "admin"
    if is_admin:
        can_create = True
    elif is_active:
        can_create = campaign_count < pro_limit
    else:
        can_create = campaign_count < free_limit
    return {
        "is_subscribed": is_active,
        "status": user.get("subscription_status", "none"),
        "plan": user.get("subscription_plan", "free"),
        "expiry": str(user.get("subscription_expiry", "")) if user.get("subscription_expiry") else None,
        "campaign_count": campaign_count,
        "free_campaign_limit": free_limit,
        "pro_campaign_limit": pro_limit,
        "can_create_campaign": can_create
    }

@app.post("/api/subscription/activate")
def activate_subscription(req: SubscriptionRequest, current_user_id: str = Depends(get_current_user)):
    """Submit a manual payment transaction for admin verification."""
    price = db.get_global_setting("subscription_price", 500.0)
    db.create_payment_record(
        user_id=current_user_id,
        plan=req.plan,
        amount=price,
        transaction_id=req.transaction_id,
        billing_name=req.billing_name,
        billing_address=req.billing_address,
        billing_phone=req.billing_phone
    )
    return {"message": "Payment submitted. Waiting for admin verification."}

@app.get("/api/admin/payments")
def get_pending_payments(current_user_id: str = Depends(get_current_user)):
    user = db.get_user_by_id(current_user_id)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.get_pending_payments()

@app.post("/api/admin/payments/{payment_id}/approve")
def approve_payment(payment_id: str, current_user_id: str = Depends(get_current_user)):
    user = db.get_user_by_id(current_user_id)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    success = db.approve_payment(payment_id)
    if success:
        return {"message": "Payment approved and subscription activated."}
    raise HTTPException(status_code=400, detail="Failed to approve payment.")

@app.post("/api/admin/payments/{payment_id}/reject")
def reject_payment(payment_id: str, current_user_id: str = Depends(get_current_user)):
    user = db.get_user_by_id(current_user_id)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    success = db.reject_payment(payment_id)
    if success:
        return {"message": "Payment rejected."}
    raise HTTPException(status_code=400, detail="Failed to reject payment.")

@app.post("/api/subscription/cancel")
def cancel_subscription(current_user_id: str = Depends(get_current_user)):
    db.cancel_user_subscription(current_user_id)
    return {"message": "Subscription cancelled."}

@app.post("/api/subscription/renew")
def renew_subscription(req: SubscriptionRequest, current_user_id: str = Depends(get_current_user)):
    """Renew an active or expired subscription with a new payment."""
    user = db.get_user_by_id(current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    status = user.get("subscription_status", "none")
    if status not in ("active", "expired", "cancelled"):
        raise HTTPException(status_code=400, detail="No previous subscription found to renew.")
    price = db.get_global_setting("subscription_price", 500.0)
    db.create_payment_record(
        user_id=current_user_id,
        plan=req.plan,
        amount=price,
        transaction_id=req.transaction_id,
        billing_name=req.billing_name,
        billing_address=req.billing_address,
        billing_phone=req.billing_phone
    )
    return {"message": "Renewal payment submitted. Waiting for admin verification."}

class SubscriptionPricingUpdate(BaseModel):
    price: float
    free_campaign_limit: int = 1

@app.post("/api/admin/subscription-pricing")
def update_subscription_pricing(data: SubscriptionPricingUpdate, current_user_id: str = Depends(get_current_user)):
    user = db.get_user_by_id(current_user_id)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db.set_global_setting("subscription_price", data.price)
    db.set_global_setting("free_campaign_limit", data.free_campaign_limit)
    return {"message": "Pricing updated successfully"}

@app.post("/api/campaigns")
async def create_campaign(
    website_url: str = Form(...),
    file: UploadFile = File(...),
    ad_name: str = Form(""),
    click_url: str = Form(""),
    current_user_id: str = Depends(get_current_user)
):
    # Check file size (100MB limit)
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)
    if size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum allowed size is 100MB.")
    
    # Enforce campaign limit
    user = db.get_user_by_id(current_user_id)
    is_admin = user and user.get("role") == "admin"
    if not is_admin:
        campaign_count = db.get_user_campaign_count(current_user_id)
        free_limit = db.get_global_setting("free_campaign_limit", 1)
        pro_limit = db.get_global_setting("pro_campaign_limit", 20)
        is_subscribed = db.check_subscription_active(current_user_id)
        if is_subscribed:
            if campaign_count >= pro_limit:
                raise HTTPException(status_code=403, detail=f"Pro plan allows up to {pro_limit} campaigns. You have reached the limit.")
        else:
            if campaign_count >= free_limit:
                raise HTTPException(status_code=403, detail="Campaign limit reached. Please subscribe to create more campaigns.")

    file_ext = file.filename.split('.')[-1]
    filename = f"media_{current_user_id}_{int(time.time())}.{file_ext}"
    file_path = os.path.join("uploads", filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db.create_campaign(current_user_id, website_url, file_path, ad_name=ad_name, click_url=click_url)
    return {"message": "Campaign created"}

@app.delete("/api/campaigns/{campaign_id}")
def delete_campaign(campaign_id: str, current_user_id: str = Depends(get_current_user)):
    # Delete the media file from disk
    campaigns = db.get_all_campaigns()
    camp = next((c for c in campaigns if c['id'] == campaign_id), None)
    if camp and os.path.exists(camp.get('ad_media', '')):
        os.remove(camp['ad_media'])
    # Delete sessions tied to campaign
    db.delete_sessions_by_campaign(campaign_id)
    # Delete campaign document
    success = db.delete_campaign(campaign_id, current_user_id)
    if success:
        return {"message": "Campaign deleted"}
    raise HTTPException(status_code=404, detail="Campaign not found")

@app.get("/api/campaigns/me")
def get_campaigns(current_user_id: str = Depends(get_current_user)):
    return db.get_campaigns_by_user(current_user_id)

@app.get("/api/campaigns/active")
def get_active_campaigns():
    """Public endpoint: returns all active campaigns so the demo website can show ads."""
    all_camps = db.get_all_campaigns()
    result = []
    for c in all_camps:
        ext = c['ad_media'].split('.')[-1].lower()
        media_type = 'video' if ext in ['mp4', 'webm', 'ogg', 'mov'] else 'image'
        
        # Failsafe: Just find the filename starting with 'ad_'
        import os
        filename = os.path.basename(c['ad_media'].replace('\\', '/'))
        if 'media_' not in filename and '/' in c['ad_media']:
             # Fallback if basename fails
             filename = c['ad_media'].split('/')[-1]
            
        result.append({
            'id': c['id'],
            'website_url': c['website_url'],
            'media_url': f"/uploads/{filename}",
            'media_type': media_type,
            'ad_name': c.get('ad_name', ''),
            'click_url': c.get('click_url', '')
        })
    return result

@app.get("/api/campaign/{campaign_id}/media")
def get_campaign_media(campaign_id: str):
    campaigns = db.get_all_campaigns()
    camp = next((c for c in campaigns if c['id'] == campaign_id), None)
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    file_path = camp['ad_media']
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Media file not found")
    
    with open(file_path, "rb") as f:
        data = f.read()
    b64 = base64.b64encode(data).decode()
    ext = file_path.split('.')[-1].lower()
    mime = "video/mp4" if ext in ['mp4', 'webm', 'ogg', 'mov'] else f"image/{ext}"
    return {"media_url": f"data:{mime};base64,{b64}", "website_url": camp['website_url'], "click_url": camp.get('click_url', '')}

class SessionData(BaseModel):
    campaign_id: str
    time_spent: float
    clicks: int
    avg_emotion: str
    heatmap_data: str = '[]'
    emotion_timeline: List[Dict[str, Any]] = []
    gaze_timeline: List[Dict[str, Any]] = []
    hover_zones: Dict[str, Any] = {}
    mouse_velocity_avg: float = 0
    idle_time: float = 0
    active_time: float = 0
    tab_hidden_time: float = 0
    face_detected_pct: float = 0
    gaze_on_ad_pct: float = 0

@app.post("/api/sessions")
def save_session(session: SessionData):
    db.save_session(
        session.campaign_id, session.time_spent, session.clicks,
        session.avg_emotion, session.heatmap_data,
        emotion_timeline=session.emotion_timeline,
        gaze_timeline=session.gaze_timeline,
        hover_zones=session.hover_zones,
        mouse_velocity_avg=session.mouse_velocity_avg,
        idle_time=session.idle_time,
        active_time=session.active_time,
        tab_hidden_time=session.tab_hidden_time,
        face_detected_pct=session.face_detected_pct,
        gaze_on_ad_pct=session.gaze_on_ad_pct
    )
    return {"message": "Session saved"}

@app.get("/api/sessions/{campaign_id}")
def get_sessions(campaign_id: str, current_user_id: str = Depends(get_current_user)):
    return db.get_sessions_by_campaign(campaign_id)

@app.get("/api/analytics/{campaign_id}")
def get_analytics(campaign_id: str, current_user_id: str = Depends(get_current_user)):
    """Returns aggregated averaged analytics for a campaign across all sessions."""
    sessions = db.get_sessions_by_campaign(campaign_id)
    return ae.compute_full_analytics(sessions)

@app.get("/api/analytics/{campaign_id}/heatmap")
def get_heatmap_png(campaign_id: str, current_user_id: str = Depends(get_current_user)):
    """Returns a downloadable attention heatmap PNG."""
    sessions = db.get_sessions_by_campaign(campaign_id)
    png_b64 = ae.generate_heatmap_png(sessions)
    png_bytes = base64.b64decode(png_b64)
    return Response(content=png_bytes, media_type="image/png",
                    headers={"Content-Disposition": f"attachment; filename=heatmap_{campaign_id}.png"})

@app.get("/api/analytics/{campaign_id}/report")
def download_report(campaign_id: str, current_user_id: str = Depends(get_current_user)):
    """Generates a comprehensive CSV report for the campaign."""
    sessions = db.get_sessions_by_campaign(campaign_id)
    analytics = ae.compute_full_analytics(sessions)
    
    import io
    import csv
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header Info
    writer.writerow(["--- ATTENTION TRACE CAMPAIGN REPORT ---"])
    writer.writerow(["Campaign ID", campaign_id])
    writer.writerow(["Report Generated At", datetime.now().strftime("%Y-%m-%d %H:%M:%S")])
    writer.writerow([])
    
    # Summary Metrics
    writer.writerow(["SUMMARY METRICS"])
    writer.writerow(["Metric", "Value"])
    writer.writerow(["Total Sessions", analytics['total_sessions']])
    writer.writerow(["Avg Engagement Score", analytics['avg_engagement_score']])
    writer.writerow(["Avg Time Spent (s)", analytics['avg_time_spent']])
    writer.writerow(["Avg Active Time (%)", analytics['avg_active_pct']])
    writer.writerow(["Avg Idle Time (%)", analytics['avg_idle_pct']])
    writer.writerow(["Avg Clicks", analytics['avg_clicks']])
    writer.writerow(["Peak Attention Moment", analytics['peak_attention_second']])
    writer.writerow(["Lowest Attention Moment", analytics['lowest_attention_second']])
    writer.writerow([])
    
    # Emotion Distribution
    writer.writerow(["EMOTION DISTRIBUTION (%)"])
    for em, val in analytics['emotion_distribution'].items():
        writer.writerow([em.capitalize(), f"{val}%"])
    writer.writerow([])
    
    # Per-Session Detail
    writer.writerow(["DETAILED SESSION LOG"])
    writer.writerow(["Session ID", "Date", "Time Spent (s)", "Clicks", "Avg Emotion", "Face Detection %", "Gaze on Ad %"])
    for s in sessions:
        writer.writerow([
            s.get('id', 'N/A'), 
            s.get('created_at', 'N/A'), 
            s.get('time_spent', 0), 
            s.get('clicks', 0), 
            s.get('avg_emotion', 'neutral'),
            s.get('face_detected_pct', 0),
            s.get('gaze_on_ad_pct', 0)
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=report_{campaign_id}.csv"}
    )

def estimate_gaze(landmarks, img_w, img_h):
    """
    Estimate gaze direction from MediaPipe iris landmarks.
    Maps iris position within eye socket to a normalized 0-1 screen coordinate.
    """
    try:
        # Iris and eye corner indices
        # LEFT_IRIS = [474, 475, 476, 477], RIGHT_IRIS = [469, 470, 471, 472]
        
        # Calculate iris centers
        l_iris = np.mean([(landmarks[i].x, landmarks[i].y) for i in LEFT_IRIS], axis=0)
        r_iris = np.mean([(landmarks[i].x, landmarks[i].y) for i in RIGHT_IRIS], axis=0)
        
        # Get horizontal eye corners
        l_corner_l = landmarks[33].x
        l_corner_r = landmarks[133].x
        r_corner_l = landmarks[362].x
        r_corner_r = landmarks[263].x
        
        # Horizontal ratio (0=left corner, 0.5=center, 1=right corner)
        # We use a sensitivity factor because iris doesn't reach the exact corners usually
        sensitivity_x = 2.5 
        l_ratio_x = (l_iris[0] - l_corner_l) / (l_corner_r - l_corner_l + 1e-6)
        r_ratio_x = (r_iris[0] - r_corner_l) / (r_corner_r - r_corner_l + 1e-6)
        avg_ratio_x = (l_ratio_x + r_ratio_x) / 2
        
        # Map 0.35-0.65 range to 0-1 for more 'screen-wide' movement
        gaze_x = np.clip((avg_ratio_x - 0.5) * sensitivity_x + 0.5, 0, 1)
        
        # Vertical: Use iris Y relative to eyelids
        l_top = landmarks[159].y
        l_bot = landmarks[145].y
        r_top = landmarks[386].y
        r_bot = landmarks[374].y
        
        l_ratio_y = (l_iris[1] - l_top) / (l_bot - l_top + 1e-6)
        r_ratio_y = (r_iris[1] - r_top) / (r_bot - r_top + 1e-6)
        avg_ratio_y = (l_ratio_y + r_ratio_y) / 2
        
        sensitivity_y = 2.0
        gaze_y = np.clip((avg_ratio_y - 0.5) * sensitivity_y + 0.5, 0, 1)
        
        # on_ad logic: if gaze is roughly centered (0.1 to 0.9)
        on_ad = 0.1 < gaze_x < 0.9 and 0.1 < gaze_y < 0.9
        
        return float(gaze_x), float(gaze_y), bool(on_ad)
    except:
        return 0.5, 0.5, True

@app.websocket("/ws/emotion")
async def emotion_tracking(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            try:
                encoded_data = data.split(',')[1]
                nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if img is None:
                    await websocket.send_text(json.dumps({
                        'emotion': 'neutral', 'emotion_scores': {},
                        'gaze_x': 0.5, 'gaze_y': 0.5, 'on_ad': True, 'face_detected': False
                    }))
                    continue
                
                img_h, img_w = img.shape[:2]
                
                # FER Emotion Detection
                face_detected = False
                dominant_emotion = 'neutral'
                emotion_scores = {}
                fer_result = detector.detect_emotions(img)
                if fer_result:
                    face_detected = True
                    emotion_scores = fer_result[0]['emotions']
                    # Increase 'accurate' detection: only count as non-neutral if score > 0.1
                    # and neutral is not overwhelming
                    dominant_emotion = max(emotion_scores, key=emotion_scores.get)
                    if dominant_emotion == 'neutral' and any(v > 0.15 for k, v in emotion_scores.items() if k != 'neutral'):
                        # pick the next best emotion if neutral is just slightly ahead
                        sorted_emotions = sorted(emotion_scores.items(), key=lambda x: x[1], reverse=True)
                        if sorted_emotions[0][1] - sorted_emotions[1][1] < 0.2:
                             dominant_emotion = sorted_emotions[1][0]
                
                # MediaPipe Gaze Tracking
                gaze_x, gaze_y, on_ad = 0.5, 0.5, True
                if face_landmarker:
                    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_img)
                    detection_result = face_landmarker.detect(mp_image)
                    
                    if detection_result.face_landmarks:
                        face_detected = True
                        landmarks = detection_result.face_landmarks[0]
                        gaze_x, gaze_y, on_ad = estimate_gaze(landmarks, img_w, img_h)
                
                response = {
                    'emotion': dominant_emotion,
                    'emotion_scores': {k: round(v, 3) for k, v in emotion_scores.items()},
                    'gaze_x': round(gaze_x, 3),
                    'gaze_y': round(gaze_y, 3),
                    'on_ad': on_ad,
                    'face_detected': face_detected
                }
                await websocket.send_text(json.dumps(response))
            except Exception as e:
                await websocket.send_text(json.dumps({
                    'emotion': 'neutral', 'emotion_scores': {},
                    'gaze_x': 0.5, 'gaze_y': 0.5, 'on_ad': True, 'face_detected': False
                }))
    except WebSocketDisconnect:
        pass

class ContactMessage(BaseModel):
    name: str
    email: str
    subject: str
    message: str

@app.post("/api/contact")
def send_contact_message(contact: ContactMessage, current_user_id: str = Depends(get_current_user)):
    SENDER_EMAIL = "sujiii2204@gmail.com"
    APP_PASSWORD = "esdtsvouxhkplgxt" 
    RECEIVER_EMAIL = "sujiii2204@gmail.com"

    if APP_PASSWORD == "[REPLACE_WITH_YOUR_APP_PASSWORD]":
        raise HTTPException(status_code=500, detail="Server not configured for email yet.")

    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = RECEIVER_EMAIL
    msg['Subject'] = f"Attention Trace Feedback: {contact.subject}"

    body = f"""
    New message from Attention Trace Contact Form!
    
    Name: {contact.name}
    Email: {contact.email}
    User ID: {current_user_id}
    Subject: {contact.subject}
    
    Message:
    {contact.message}
    """
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SENDER_EMAIL, APP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SENDER_EMAIL, RECEIVER_EMAIL, text)
        server.quit()
        return {"message": "Email sent successfully!"}
    except Exception as e:
        print(f"SMTP Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
