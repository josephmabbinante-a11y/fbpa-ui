from fastapi import FastAPI
import joblib
import numpy as np

app = FastAPI()
model = joblib.load("rate_model.pkl")

@app.post("/predict-rate")
def predict_rate(features: dict):
    input_vector = np.array([[
        features["billable_miles"],
        features["volatility_index"],
        features["capacity_score"],
        features["fuel_index"],
        features["deadhead_miles"],
        features["day_of_week"],
        features["month"],
        features["lane_avg_rate"]
    ]])
    prediction = model.predict(input_vector)
    return {
        "predicted_market_rate": float(prediction[0])
    }
