# mock_household.py

from typing import Dict, Any


# ---------------- MOCK HOUSEHOLD ----------------
MOCK_HOUSEHOLD: Dict[str, Any] = {
    # Identity
    "household_id": "newham_family_a",
    "display_name": "Newham Family A",

    # Location / context
    "city": "London",
    "borough": "Newham",
    "region": "Greater London",
    "postcode_area": "E13",
    "country": "England",

    # Demographics
    "household_size": 4,
    "adults": 2,
    "children": 2,
    "income_band": "low_income",
    "monthly_income_gbp": 1800.0,
    "tenure": "private_rented",
    "home_type": "2_bed_flat",

    # Energy / home setup
    "heating_type": "electric",
    "meter_type": "single_rate",
    "payment_type": "direct_debit",
    "tariff_type": "standard_variable_tariff",
    "insulation_level": "poor",
    "energy_efficiency_band": "D",
    "budget_sensitive": True,
    "has_smart_meter": False,

    # Tariff (Ofgem reference values Apr–Jun 2026)
    "electricity_unit_rate_gbp_per_kwh": 0.2467,
    "electricity_standing_charge_gbp_per_day": 0.5721,

    # Baseline usage (Ofgem typical)
    "annual_electricity_kwh": 2700.0,
    "monthly_electricity_kwh_estimate": round(2700.0 / 12, 2),
    "daily_electricity_kwh_estimate": round(2700.0 / 365, 3),

    # Behaviour constraints (important for realism)
    "constraints": {
        "cannot_shift_all_usage": True,
        "needs_evening_cooking": True,
        "needs_heating_for_children": True,
        "risk_of_energy_debt": True,
        "prefers_clear_advice": True,
    },

    # Usage patterns
    "usage_patterns": {
        "high_usage_hours": ["06:30-08:30", "17:00-21:00"],
        "flexible_hours": ["10:00-16:00", "21:00-22:30"],
        "least_flexible_hours": ["07:00-08:00", "18:00-20:00"],
    },

    # Appliance profiles (simulation values)
    "appliances": {
        "washing_machine": {
            "label": "Washing Machine",
            "usage_type": "per_cycle",
            "kwh_per_cycle": 1.0,
            "typical_uses_per_week": 5,
            "flexible": True
        },
        "kettle": {
            "label": "Kettle",
            "usage_type": "per_use",
            "kwh_per_use": 0.12,
            "typical_uses_per_day": 6,
            "flexible": False
        },
        "electric_heater": {
            "label": "Electric Heater",
            "usage_type": "per_hour",
            "kwh_per_hour": 2.0,
            "typical_hours_per_day": 4,
            "flexible": True
        },
        "oven": {
            "label": "Oven",
            "usage_type": "per_hour",
            "kwh_per_hour": 2.0,
            "typical_hours_per_day": 1,
            "flexible": False
        },
        "dishwasher": {
            "label": "Dishwasher",
            "usage_type": "per_cycle",
            "kwh_per_cycle": 1.2,
            "typical_uses_per_week": 4,
            "flexible": True
        },
        "tumble_dryer": {
            "label": "Tumble Dryer",
            "usage_type": "per_cycle",
            "kwh_per_cycle": 2.5,
            "typical_uses_per_week": 2,
            "flexible": True
        },
        "fridge_freezer": {
            "label": "Fridge Freezer",
            "usage_type": "continuous_daily",
            "kwh_per_day": 1.0,
            "flexible": False
        },
        "lighting": {
            "label": "Lighting",
            "usage_type": "per_hour",
            "kwh_per_hour": 0.2,
            "typical_hours_per_day": 5,
            "flexible": False
        }
    },

    # UI labels (important for safety)
    "ui_labels": {
        "household_notice": "This is a simulated low-income household profile.",
        "savings_notice": "Savings are estimates based on this household's tariff and usage."
    }
}


# ---------------- GETTERS ----------------

def get_mock_household() -> Dict[str, Any]:
    return MOCK_HOUSEHOLD


def get_appliance_profile(name: str) -> Dict[str, Any]:
    appliances = MOCK_HOUSEHOLD["appliances"]
    if name not in appliances:
        raise ValueError(f"Unknown appliance: {name}")
    return appliances[name]


def get_unit_rate() -> float:
    return MOCK_HOUSEHOLD["electricity_unit_rate_gbp_per_kwh"]


def get_standing_charge() -> float:
    return MOCK_HOUSEHOLD["electricity_standing_charge_gbp_per_day"]


# ---------------- ENERGY CALCULATIONS ----------------

def appliance_kwh(appliance_name: str, hours: float = None) -> float:
    a = get_appliance_profile(appliance_name)

    if a["usage_type"] == "per_cycle":
        return a["kwh_per_cycle"]

    if a["usage_type"] == "per_use":
        return a["kwh_per_use"]

    if a["usage_type"] == "per_hour":
        h = hours if hours is not None else 1
        return a["kwh_per_hour"] * h

    if a["usage_type"] == "continuous_daily":
        return a["kwh_per_day"]

    raise ValueError("Unknown usage type")


def calculate_shift_saving(appliance: str, current_price: float, future_price: float, hours: float = None) -> float:
    kwh = appliance_kwh(appliance, hours)
    diff = max(current_price - future_price, 0)
    return round(kwh * diff, 2)


def calculate_reduce_saving(appliance: str, tariff: float, hours: float = 1) -> float:
    kwh = appliance_kwh(appliance, hours)
    return round(kwh * tariff, 2)