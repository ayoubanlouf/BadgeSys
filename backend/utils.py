"""
Utility functions for badge image generation and QR code decoding.
"""

import io
import base64
from PIL import Image, ImageDraw, ImageFont
import qrcode
from pyzbar.pyzbar import decode as pyzbar_decode


# ---------------------------------------------------------------------------
# Badge image generation
# ---------------------------------------------------------------------------

BADGE_W = 480
BADGE_H = 280
HEADER_H = 60
QR_SIZE = 160
PADDING = 20

# Color scheme: dark navy header, light card body
COLOR_BG = (245, 247, 252)
COLOR_HEADER = (15, 40, 80)
COLOR_ACCENT = (20, 105, 200)
COLOR_TEXT_LIGHT = (255, 255, 255)
COLOR_TEXT_DARK = (30, 40, 60)
COLOR_LABEL = (100, 120, 150)
COLOR_BORDER = (200, 210, 230)


def _try_load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Try to load a system font; fall back to default if unavailable."""
    candidates_bold = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "arial.ttf",
    ]
    candidates_regular = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "arial.ttf",
    ]
    candidates = candidates_bold if bold else candidates_regular
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


def generate_badge_image(username: str, badge_id: str) -> str:
    """
    Generate a badge PNG image, return as base64-encoded string.
    The badge includes the username, badge ID, and an embedded QR code.
    """
    img = Image.new("RGB", (BADGE_W, BADGE_H), COLOR_BG)
    draw = ImageDraw.Draw(img)

    # Draw rounded-rect border
    draw.rounded_rectangle([(0, 0), (BADGE_W - 1, BADGE_H - 1)], radius=16, outline=COLOR_BORDER, width=2)

    # Header bar
    draw.rounded_rectangle([(0, 0), (BADGE_W, HEADER_H)], radius=16, fill=COLOR_HEADER)
    draw.rectangle([(0, HEADER_H // 2), (BADGE_W, HEADER_H)], fill=COLOR_HEADER)

    # Header text
    font_header = _try_load_font(18, bold=True)
    draw.text((PADDING, 18), "ACCESS BADGE", font=font_header, fill=COLOR_TEXT_LIGHT)

    # Accent stripe
    draw.rectangle([(0, HEADER_H), (BADGE_W, HEADER_H + 4)], fill=COLOR_ACCENT)

    # --- QR code ---
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=4,
        border=2,
    )
    qr.add_data(badge_id)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color=COLOR_HEADER, back_color=COLOR_BG).convert("RGB")
    qr_img = qr_img.resize((QR_SIZE, QR_SIZE), Image.LANCZOS)

    qr_x = BADGE_W - QR_SIZE - PADDING
    qr_y = HEADER_H + PADDING
    img.paste(qr_img, (qr_x, qr_y))

    # --- Text block ---
    text_x = PADDING
    text_y = HEADER_H + PADDING + 4

    font_label = _try_load_font(11)
    font_name = _try_load_font(22, bold=True)
    font_id_label = _try_load_font(10)
    font_id = _try_load_font(12)

    draw.text((text_x, text_y), "NAME", font=font_label, fill=COLOR_LABEL)
    text_y += 16
    draw.text((text_x, text_y), username, font=font_name, fill=COLOR_TEXT_DARK)
    text_y += 34

    draw.text((text_x, text_y), "BADGE ID", font=font_label, fill=COLOR_LABEL)
    text_y += 16

    # Split badge_id across two lines if too long
    parts = badge_id.split("-")
    line1 = "-".join(parts[:2]) if len(parts) >= 2 else badge_id
    line2 = "-".join(parts[2:]) if len(parts) > 2 else ""
    draw.text((text_x, text_y), line1, font=font_id, fill=COLOR_ACCENT)
    if line2:
        text_y += 16
        draw.text((text_x, text_y), line2, font=font_id, fill=COLOR_ACCENT)
    text_y += 28

    # Footer
    draw.text((text_x, BADGE_H - 28), "Scan QR to verify", font=font_id_label, fill=COLOR_LABEL)

    # Convert to base64
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


# ---------------------------------------------------------------------------
# QR code decoding from uploaded image
# ---------------------------------------------------------------------------

def decode_qr_from_image(image_bytes: bytes) -> str | None:
    """
    Decode QR code data from raw image bytes using pyzbar.
    Returns the decoded string or None if no QR code is found.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        decoded = pyzbar_decode(img)
        if decoded:
            return decoded[0].data.decode("utf-8").strip().upper()
    except Exception:
        pass
    return None
