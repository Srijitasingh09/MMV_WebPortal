import os
import smtplib
from email.message import EmailMessage

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def send_password_reset_email(to_email: str, raw_token: str) -> None:
    """
    Emails a one-time reset link to to_email. Raises on failure so the
    caller (the /forgot-password endpoint) can decide how to respond -
    see the note in main.py about not leaking whether the send succeeded.
    """
    reset_link = f"{FRONTEND_URL}/reset-password?token={raw_token}"

    msg = EmailMessage()
    msg["Subject"] = "Reset your MMV WebPortal admin password"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.set_content(
        "You requested a password reset for the MMV WebPortal admin account.\n\n"
        f"Reset your password here (link expires in 30 minutes):\n{reset_link}\n\n"
        "If you didn't request this, you can ignore this email - your "
        "password will not be changed."
    )

    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD:
        raise RuntimeError(
            "SMTP is not configured - set SMTP_HOST, SMTP_USER and "
            "SMTP_PASSWORD in your .env before this endpoint can send email."
        )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)