import joblib
from sklearn.ensemble import RandomForestRegressor

def train_model(X, y):
    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        random_state=42
    )
    model.fit(X, y)
    joblib.dump(model, "rate_model.pkl")
    return model
