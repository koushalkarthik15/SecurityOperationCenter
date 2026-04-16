import joblib
import pandas as pd

MODEL_PATH = "../backend/rf_model.joblib"

model = joblib.load(MODEL_PATH)


def predict(features: dict):

    df = pd.DataFrame([features])

    prob = model.predict_proba(df)[0][1]

    risk_score = prob * 100


    if risk_score < 40:

        label = "Normal"

    elif risk_score < 75:

        label = "Suspicious"

    else:

        label = "Malicious"


    return risk_score, label