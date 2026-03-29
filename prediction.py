from sklearn.linear_model import LinearRegression
import numpy as np


def train_price_model(price_history):
    """
    Train a simple ML model using the last 3 observed prices
    to predict the next observed price.
    """
    if len(price_history) < 12:
        return None

    X = []
    y = []

    for i in range(len(price_history) - 3):
        X.append(price_history[i:i + 3])
        y.append(price_history[i + 3])

    X = np.array(X)
    y = np.array(y)

    model = LinearRegression()
    model.fit(X, y)
    return model


def predict_next_price(price_history):
    """
    Predict the next price from recent price history.
    Returns None if there is not enough history yet.
    """
    if len(price_history) < 3:
        return None

    model = train_price_model(price_history)
    if model is None:
        return None

    latest_window = np.array(price_history[-3:]).reshape(1, -1)
    predicted_price = model.predict(latest_window)[0]
    return round(float(predicted_price), 2)


def classify_market_pressure(current_price, predicted_price, tolerance=0.03):
    """
    Convert predicted price movement into:
    - low:    predicted price is meaningfully lower than current
    - medium: little expected change
    - high:   predicted price is meaningfully higher than current

    tolerance=0.03 means a 3% movement band.
    """
    if current_price is None or predicted_price is None or current_price <= 0:
        return "medium"

    pct_change = (predicted_price - current_price) / current_price

    if pct_change > tolerance:
        return "high"
    elif pct_change < -tolerance:
        return "low"
    return "medium"