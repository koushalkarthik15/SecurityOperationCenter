import pandas as pd
import requests
import time
import random
from datetime import datetime


API_URL = "http://127.0.0.1:8000/api/manual-log"


df = pd.read_csv("dataset.csv")


PUBLIC_IPS = [

"8.8.8.8",
"1.1.1.1",
"142.250.183.14",
"185.34.33.2",
"91.198.174.192"

]


def convert_to_model_features(row):

    failed_login_count = int(
        row["failed_logins"]
    )


    login_success_ratio = (

        (row["login_attempts"] - row["failed_logins"])

        / (row["login_attempts"] + 1)

    )


    privilege_target = int(

        row["ip_reputation_score"] < 0.3

    )


    hour_of_day = random.randint(0,23)


    is_off_hours = int(
        row["unusual_time_access"]
    )


    action_frequency = 1 / (

        row["session_duration"] + 1

    )


    connection_rate = (

        row["network_packet_size"]

        / (row["session_duration"] + 1)

    )


    bytes_transferred = float(

        row["network_packet_size"]

    )


    is_new_ip = int(

        row["ip_reputation_score"] < 0.2

    )


    payload = {

        "source_ip":

        random.choice(PUBLIC_IPS),


        "failed_login_count":

        failed_login_count,


        "login_success_ratio":

        login_success_ratio,


        "privilege_target":

        privilege_target,


        "hour_of_day":

        hour_of_day,


        "is_off_hours":

        is_off_hours,


        "action_frequency":

        action_frequency,


        "connection_rate":

        connection_rate,


        "bytes_transferred":

        bytes_transferred,


        "is_new_ip":

        is_new_ip

    }


    return payload



while True:

    row = df.sample(1).iloc[0]

    payload = convert_to_model_features(row)


    try:

        r = requests.post(
            API_URL,
            json=payload
        )


        print(
            "status:",
            r.status_code,
            round(r.json().get("risk_score",0),2)
        )


    except Exception as e:

        print("API error:", e)


    time.sleep(
        random.uniform(1,2)
    )