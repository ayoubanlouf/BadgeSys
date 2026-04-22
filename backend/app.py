"""
Flask API for Access Badge System.
Handles user auth, badge generation, and badge validation.
"""

import os
import io
import uuid
import base64
from datetime import datetime, timedelta, timezone
from functools import wraps
from dotenv import load_dotenv

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import jwt
from PIL import Image, ImageDraw, ImageFont
import qrcode
import pyotp

from models import db, User, Badge
from utils import generate_badge_image, decode_qr_from_image

load_dotenv()

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Azure SQL placeholder — swap in real credentials before deploying
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL",
    "mssql+pyodbc://<username>:<password>@<server>.database.windows.net/<database>"
    "?driver=ODBC+Driver+18+for+SQL+Server",
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "change-me-in-production")
JWT_ALGORITHM = "HS256"
TOKEN_EXP_HOURS = 8

db.init_app(app)

with app.app_context():
    db.create_all()


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXP_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, app.config["SECRET_KEY"], algorithm=JWT_ALGORITHM)


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(
                token, app.config["SECRET_KEY"], algorithms=[JWT_ALGORITHM]
            )
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        user = db.session.get(User, int(payload["sub"]))
        if user is None:
            return jsonify({"error": "User not found"}), 401
        return f(user, *args, **kwargs)

    return decorated


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/api/register", methods=["POST"])
def register():
    """Register a new user. Body: {username, password}"""
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400
    if len(username) < 3 or len(username) > 50:
        return jsonify({"error": "username must be 3–50 characters"}), 400
    if len(password) < 6:
        return jsonify({"error": "password must be at least 6 characters"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already taken"}), 409

    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_token(user.id)
    return jsonify({"message": "User registered successfully", "token": token, "username": username}), 201


@app.route("/api/login", methods=["POST"])
def login():
    """Authenticate a user. Body: {username, password}"""
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username or password"}), 401

    token = create_token(user.id)
    return jsonify({"message": "Login successful", "token": token, "username": username}), 200


@app.route("/api/generate_badge", methods=["POST"])
@token_required
def generate_badge(current_user):
    """Generate a badge for the authenticated user (one badge per user)."""
    if Badge.query.filter_by(user_id=current_user.id).first():
        return jsonify({"error": "Badge already generated for this account"}), 409

    badge_id = str(uuid.uuid4()).upper()
    image_b64 = generate_badge_image(current_user.username, badge_id)

    badge = Badge(
        badge_id=badge_id,
        user_id=current_user.id,
        image_data=image_b64,
    )
    db.session.add(badge)
    db.session.commit()

    return jsonify({
        "message": "Badge generated successfully",
        "badge_id": badge_id,
        "image": image_b64,
    }), 201


@app.route("/api/my_badge", methods=["GET"])
@token_required
def my_badge(current_user):
    badge = Badge.query.filter_by(user_id=current_user.id).first()
    if not badge:
        return jsonify({"badge": None}), 200
    return jsonify({
        "badge": {
            "badge_id": badge.badge_id,
            "image": badge.image_data,
            "created_at": badge.created_at.isoformat(),
        }
    }), 200


@app.route("/api/validate_badge", methods=["POST"])
def validate_badge():
    """
    Validate a badge by ID or uploaded image.
    Accepts multipart/form-data with optional fields:
      - badge_id: text
      - image: file (PNG/JPEG containing QR code)
    """
    badge_id = None

    # Try plain text ID first
    if request.content_type and "multipart" in request.content_type:
        badge_id = (request.form.get("badge_id") or "").strip().upper() or None
        image_file = request.files.get("image")
        if not badge_id and image_file:
            img_bytes = image_file.read()
            badge_id = decode_qr_from_image(img_bytes)
            if not badge_id:
                return jsonify({"valid": False, "error": "Could not decode QR code from image"}), 400
    else:
        data = request.get_json(silent=True) or {}
        badge_id = (data.get("badge_id") or "").strip().upper() or None

    if not badge_id:
        return jsonify({"valid": False, "error": "Provide badge_id or an image with a QR code"}), 400

    badge = Badge.query.filter_by(badge_id=badge_id).first()
    if not badge:
        return jsonify({"valid": False, "message": "Badge not found"}), 200

    user = db.session.get(User, badge.user_id)
    return jsonify({
        "valid": True,
        "badge_id": badge.badge_id,
        "username": user.username if user else "Unknown",
        "issued_at": badge.created_at.isoformat(),
    }), 200


# ---------------------------------------------------------------------------
# Dev entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True, port=5000)
