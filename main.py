import os
import smtplib
from datetime import datetime
from email.mime.text import MIMEText

import requests
from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

from prediction import predict_next_price, classify_market_pressure
from mock_household import (
    get_mock_household,
    get_unit_rate,
    calculate_shift_saving,
    calculate_reduce_saving,
)

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
TO_EMAIL = os.getenv("TO_EMAIL")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

price_history = []
last_predicted_level = None

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587


# -----------------------------
# USAGE CALCULATION
# -----------------------------
def calculate_usage_level(household: dict):
    appliances = household.get("appliances", {})
    total_daily_kwh = 0

    for appliance in appliances.values():
        if "kwh_per_cycle" in appliance:
            uses_per_day = appliance.get("typical_uses_per_week", 0) / 7
            total_daily_kwh += appliance["kwh_per_cycle"] * uses_per_day

        elif "kwh_per_hour" in appliance:
            hours = appliance.get("typical_hours_per_day", 0)
            total_daily_kwh += appliance["kwh_per_hour"] * hours

        elif "kwh_per_use" in appliance:
            uses = appliance.get("typical_uses_per_day", 0)
            total_daily_kwh += appliance["kwh_per_use"] * uses

    if total_daily_kwh == 0:
        total_daily_kwh = household.get("daily_electricity_kwh_estimate", 7.4)

    UK_AVG_DAILY_KWH = 7.4

    if total_daily_kwh < UK_AVG_DAILY_KWH * 0.8:
        return "low"
    elif total_daily_kwh < UK_AVG_DAILY_KWH * 1.2:
        return "medium"
    else:
        return "high"


# -----------------------------
# APPLIANCE LOGIC
# -----------------------------
def choose_appliance(appliance_names, pressure_level):
    household = get_mock_household()
    appliances = household["appliances"]

    valid_appliances = [a for a in appliance_names if a in appliances]

    if not valid_appliances:
        return None

    for appliance in valid_appliances:
        if appliances[appliance]["flexible"]:
            return appliance

    return None


def estimate_savings(pressure: dict, appliance_names: list[str]):
    unit_rate = get_unit_rate()
    selected_appliance = choose_appliance(appliance_names, pressure["pressure_level"])

    if not selected_appliance:
        return {
            "amount_gbp": 0.0,
            "appliance": None,
        }

    if pressure["pressure_level"] == "high":
        future_rate = unit_rate * 0.85
        saving = calculate_shift_saving(selected_appliance, unit_rate, future_rate)

    elif pressure["pressure_level"] == "low":
        future_rate = unit_rate * 1.10
        saving = calculate_shift_saving(selected_appliance, future_rate, unit_rate)

    else:
        saving = round(
            calculate_reduce_saving(selected_appliance, unit_rate, hours=0.5), 2
        )

    return {
        "amount_gbp": round(saving, 2),
        "appliance": selected_appliance,
    }


def generate_personalised_advice(pressure, savings_result, appliance_names):
    level = pressure["pressure_level"]
    savings = savings_result["amount_gbp"]
    appliance = savings_result["appliance"]

    if level == "low":
        if appliance:
            return f"Now is a good time to use the {appliance.replace('_', ' ')}. Save about £{savings}."
        return "Electricity conditions look favourable right now."

    if level == "high":
        if appliance:
            return f"Delay the {appliance.replace('_', ' ')} to save about £{savings}."
        return "Prices are high right now, consider delaying usage."

    if appliance:
        return f"Reduce use of {appliance.replace('_', ' ')} slightly to save about £{savings}."

    return "Energy conditions look moderate right now."


# -----------------------------
# EMAIL
# -----------------------------
def send_email_alert(subject: str, body: str):
    if not EMAIL_ADDRESS or not EMAIL_PASSWORD or not TO_EMAIL:
        return

    try:
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = TO_EMAIL

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.sendmail(EMAIL_ADDRESS, TO_EMAIL, msg.as_string())

    except Exception as e:
        print("Email failed:", e)


# -----------------------------
# DATA
# -----------------------------
def normalise(value, min_value, max_value):
    if max_value == min_value:
        return 0.0
    return max(0.0, min(1.0, (value - min_value) / (max_value - min_value)))


def fetch_bmrs_price():
    try:
        url = "https://data.elexon.co.uk/bmrs/api/v1/balancing/pricing/market-index?format=json"
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        data = r.json()
        records = data.get("data", [])
        if not records:
            return None
        return float(records[0].get("price"))
    except:
        return None


def get_live_market_data():
    url = (
        "https://api.neso.energy/api/3/action/datastore_search"
        "?resource_id=aec5601a-7f3e-4c4c-bf56-d8e4184d3c5b&limit=5"
    )

    r = requests.get(url, timeout=30)
    r.raise_for_status()
    data = r.json()
    first = data["result"]["records"][0]

    return {"forecast_demand_mw": float(first["FORECASTDEMAND"])}


def build_market_pressure(data: dict):
    demand = data["forecast_demand_mw"]
    score = normalise(demand, 20000, 45000)

    if score >= 0.7:
        level = "high"
    elif score >= 0.4:
        level = "medium"
    else:
        level = "low"

    return {"forecast_demand_mw": demand, "pressure_level": level}


def build_live_metrics(raw):
    global price_history

    observed = fetch_bmrs_price()
    observed = 0.0 if observed is None else round(observed, 2)

    price_history.append(observed)
    price_history = price_history[-50:]

    predicted = predict_next_price(price_history) or observed
    predicted = round(predicted, 2)

    return {
        "predicted_price": predicted,
        "actual_price": observed,
        "predicted_pressure_level": classify_market_pressure(observed, predicted),
    }


# -----------------------------
# ROUTES
# -----------------------------
@app.get("/")
def root():
    return {"message": "Backend running"}


@app.get("/household-advice")
def household_advice():
    raw = get_live_market_data()
    pressure = build_market_pressure(raw)

    household = get_mock_household()
    usage_level = calculate_usage_level(household)  # ✅ FIX

    appliance_names = list(household["appliances"].keys())

    savings_result = estimate_savings(pressure, appliance_names)
    advice = generate_personalised_advice(pressure, savings_result, appliance_names)

    live_metrics = build_live_metrics(raw)

    return {
        "usage_level": usage_level,  # ✅ FIX
        "estimated_savings": savings_result["amount_gbp"],
        "target_appliance": savings_result["appliance"],
        "ai_advice": advice,
        "predicted_price": live_metrics["predicted_price"],
        "actual_price": live_metrics["actual_price"],
        "predicted_pressure_level": live_metrics["predicted_pressure_level"],
    }


# -----------------------------
# SMART NOTIFICATION SYSTEM
# -----------------------------
def check_and_notify():
    global last_predicted_level

    raw = get_live_market_data()
    pressure = build_market_pressure(raw)

    current_level = pressure["pressure_level"]

    if last_predicted_level is None:
        last_predicted_level = current_level
        return

    if current_level != last_predicted_level:
        household = get_mock_household()
        appliance_names = list(household["appliances"].keys())

        savings_result = estimate_savings(pressure, appliance_names)
        advice = generate_personalised_advice(
            pressure, savings_result, appliance_names
        )

        live_metrics = build_live_metrics(raw)

        price_change = (
            "increasing"
            if live_metrics["predicted_price"] > live_metrics["actual_price"]
            else "decreasing"
        )

        subject = f"Smart Energy Alert: Prices {price_change}"

        body = (
            f"Energy prices are {price_change}.\n\n"
            f"{advice}\n\n"
            f"Estimated saving: £{savings_result['amount_gbp']}"
        )

        print("Sending smart alert:", subject)
        send_email_alert(subject, body)

        last_predicted_level = current_level


# -----------------------------
# SCHEDULER
# -----------------------------
scheduler = BackgroundScheduler()
scheduler.add_job(check_and_notify, "interval", seconds=30)
scheduler.start()