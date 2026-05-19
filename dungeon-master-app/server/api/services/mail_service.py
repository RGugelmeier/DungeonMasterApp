from threading import Thread
from flask_mail import Message
from flask import current_app
from server import mail

def send_async_email(app, msg):
    with app.app_context():
        mail.send(msg)

def send_reset_email(to_email, reset_token):
    reset_url = f"http://localhost:5173/reset-password?token={reset_token}"
    msg = Message(
        subject="Scrawler Password Reset Request",
        recipients=[to_email],
        body=f"Click the link to reset your scrawler password:\n\n{reset_url}\n\nThis link expires in 30 minutes."
    )
    app = current_app._get_current_object()
    Thread(target=send_async_email, args=(app, msg)).start()