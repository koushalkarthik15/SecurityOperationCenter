import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from .config import SENDER_EMAIL, SENDER_PASSWORD, SMTP_SERVER, SMTP_PORT


SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587





def send_email(receiver_email, ip, score):

    subject = "SOC Alert: Potential Threat Detected"


    body = f"""

Security Alert Triggered

Source IP: {ip}

Risk Score: {round(score,2)}

Classification: Malicious Activity Likely


Recommended Action:
Investigate the IP activity immediately.


Mini SOC System
"""


    message = MIMEMultipart()

    message["From"] = SENDER_EMAIL

    message["To"] = receiver_email

    message["Subject"] = subject


    message.attach(MIMEText(body, "plain"))


    try:

        server = smtplib.SMTP(

            SMTP_SERVER,
            SMTP_PORT

        )

        server.starttls()


        server.login(

            SENDER_EMAIL,
            SENDER_PASSWORD

        )


        server.send_message(message)


        server.quit()


        print("Email alert sent")



    except Exception as e:

        print("Email failed:", e)