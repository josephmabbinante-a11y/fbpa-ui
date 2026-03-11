# ML Pipeline Phase 1 (Deterministic Source of Truth)

This document defines the implemented Phase 1 pricing interfaces in `server/rateLogic.js`.

## Versions

- `feature_schema_version`: `1.0`
- `engine_version`: `rules_v1.2`
- response `version`: `2.0`

## Endpoints

### 1) Feature schema contract

- `GET /api/rate-logic/feature-schema`

Returns the locked feature fields and active schema/engine version.

### 1b) Geo coverage database (continental U.S.)

- `GET /api/rate-logic/geo/coverage`
- `GET /api/rate-logic/geo/states`
- `GET /api/rate-logic/geo/zip3/:zip3`
- `GET /api/rate-logic/geo/state/:stateCode`

This provides:

- lower-48 state coverage
- ZIP3 to market-region lookups
- state defaults used to resolve missing ZIP3 in UI input flows

### 2) Deterministic prediction

- `POST /api/rate-logic/predict`

Request body (example):

```json
{
  "feature_schema_version": "1.0",
  "origin_zip3": "606",
  "destination_zip3": "752",
  "miles": 945,
  "equipment_type": "dry_van",
  "pickup_date": "2026-03-01",
  "fuel_price": 3.87,
  "lane_7d_avg": 2.31,
  "lane_30d_avg": 2.25,
  "lane_volatility": 0.18,
  "load_to_truck_ratio": 3.2,
  "carrier_score": 0.76
}
```

Response shape:

```json
{
  "version": "2.0",
  "feature_schema_version": "1.0",
  "engine_version": "rules_v1.2",
  "rule_rate": 2.44,
  "ml_rate": null,
  "confidence": 0.82,
  "recommended_band": {
    "low": 2.38,
    "high": 2.57
  },
  "guardrails": {
    "floor": 2.15,
    "ceiling": 2.73,
    "clamped": false,
    "unclamped_rate": 2.44
  },
  "components": {
    "base_rate": 2.31,
    "fuel_component": 0.28,
    "market_multiplier": 1.168,
    "carrier_adjustment": 1.0416
  },
  "feature_snapshot": {}
}
```

### 3) Quote outcome logging

- `POST /api/rate-logic/quote-outcomes`

Logs quote outcomes for later ML training.

Request body (example):

```json
{
  "engine_version": "rules_v1.2",
  "rule_rate": 2.44,
  "ml_rate": null,
  "accepted": true,
  "booked_rate": 2.48,
  "margin": 0.14,
  "time_to_cover_minutes": 37,
  "feature_snapshot": {
    "feature_schema_version": "1.0",
    "origin_zip3": "606",
    "destination_zip3": "752",
    "miles": 945,
    "equipment_type": "dry_van",
    "pickup_date": "2026-03-01",
    "fuel_price": 3.87,
    "lane_7d_avg": 2.31,
    "lane_30d_avg": 2.25,
    "lane_volatility": 0.18,
    "load_to_truck_ratio": 3.2,
    "carrier_score": 0.76
  }
}
```

### 4) View logged outcomes

- `GET /api/rate-logic/quote-outcomes?limit=100`

### 5) Monitoring metrics

- `GET /api/rate-logic/metrics`

Provides:

- `mean_absolute_error_7d`
- `acceptance_rate_rule`
- `acceptance_rate_ml_shadow`
- `lane_drift_score`
- `margin_compression_trend`

### 6) Training dataset export

- `GET /api/rate-logic/training-dataset/export` (JSON)
- `GET /api/rate-logic/training-dataset/export.csv` (CSV download)

## Notes

- Existing endpoint `POST /api/rate-logic/calculate` remains supported for current UI compatibility.
- Current storage is in-memory for MVP; persist to database for production retention and reproducible model training.
