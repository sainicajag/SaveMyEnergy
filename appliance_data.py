# appliance_data.py

APPLIANCE_DB = {
    "Kettle": {
        "power": "medium",
        "flexible": False,
        "essential": False,
        "use_when_low": False,
        "avoid_when_high": True
    },
    "Washing Machine": {
        "power": "high",
        "flexible": True,
        "essential": False,
        "use_when_low": True,
        "avoid_when_high": True
    },
    "Dishwasher": {
        "power": "high",
        "flexible": True,
        "essential": False,
        "use_when_low": True,
        "avoid_when_high": True
    },
    "Oven": {
        "power": "high",
        "flexible": True,
        "essential": False,
        "use_when_low": True,
        "avoid_when_high": True
    },
    "Heater": {
        "power": "high",
        "flexible": False,
        "essential": True,
        "use_when_low": False,
        "avoid_when_high": False
    },
    "Fridge": {
        "power": "low",
        "flexible": False,
        "essential": True,
        "use_when_low": False,
        "avoid_when_high": False
    },
    "Microwave": {
        "power": "medium",
        "flexible": False,
        "essential": False,
        "use_when_low": False,
        "avoid_when_high": True
    }
}