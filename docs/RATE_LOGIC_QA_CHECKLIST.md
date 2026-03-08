# Rate Logic QA Checklist (UAT Handoff)

This checklist validates the completed Rate Calculator workflow end-to-end for broker/operator use.

## Test Scope

- UI hierarchy and clarity
- Deterministic prediction behavior
- Sensitivity and risk interactions
- Execution workflow actions
- Quote outcome logging and validation
- Confidence/trust metadata rendering

## Preconditions

1. Frontend app is running and accessible.
2. Backend API is running (use any open port and configured API base URL).
3. Route accessible: `/rate-logic`.

---

## A. Visual Hierarchy and Layout

### A1. Primary focus card
- Open Rate Logic page.
- Confirm the largest centered focal element is Recommended Sell Price.
- Confirm delta text appears directly beneath sell price and is color-coded:
  - green when above market
  - red when below market
- Confirm supporting context line includes Win Prob and Margin.

Expected:
- Recommended Sell has highest visual weight and contrast.

### A2. Panel role separation
- Confirm left panel contains only core shipment inputs.
- Confirm advanced controls are not expanded by default.
- Confirm right panel contains context blocks (advanced controls, lane intelligence, top carriers).

Expected:
- Cognitive flow is Inputs -> Decision -> Context.

### A3. Lane analytics visibility
- Confirm bottom analytics section is hidden by default.
- Click Show Lane Analytics.
- Confirm KPI footer appears.
- Click Hide Lane Analytics.

Expected:
- Footer visibility toggles correctly.

---

## B. Predict and Deterministic Engine Integration

### B1. Predict Rate action
- Enter valid shipment inputs.
- Click Predict Rate.

Expected:
- Predict completes without errors.
- Rule rate, confidence, and recommended band update in the center panel.
- Action status message confirms prediction.

### B2. Data freshness and metadata
- After prediction, verify enterprise metadata block:
  - confidence level + value
  - sample size
  - volatility label
  - engine version
  - data freshness timestamp
  - fuel source
  - market source

Expected:
- All fields render and are populated.

### B3. Drift warning behavior
- Use inputs that increase lane deviation (or adjust market values).

Expected:
- Drift warning appears when variance threshold is crossed.

---

## C. Price Sensitivity and Risk

### C1. Sensitivity curve
- Move sensitivity slider negative and positive.

Expected:
- Recommended sell changes live.
- Win probability changes live.
- Margin impact updates live.

### C2. Dynamic risk badge
- Toggle rejection spike forecast option on/off.
- Increase/decrease capacity and observe state transitions.

Expected:
- Risk badge changes between:
  - Balanced Market
  - Tight Capacity
  - Rejection Spike Risk

---

## D. Execution Workflow Buttons

### D1. Push to Load Board
- Click Push to Load Board.

Expected:
- Navigates to load board route and shows action feedback.

### D2. Send to Carrier List
- Click Send to Carrier List.

Expected:
- Navigates to carrier list route and shows action feedback.

### D3. Lock Quote and unlock
- Click Lock Quote.
- Attempt to edit outcome fields.

Expected:
- Fields are blocked while locked.
- Unlock restores edit access.

### D4. Simulate Margin Impact
- Click Simulate Margin Impact.

Expected:
- Action feedback shows simulated margin range.

---

## E. Quote Outcome Logging

### E1. Outcome validation
- Leave Booked Rate blank or invalid.
- Click Log Quote Outcome.

Expected:
- Inline validation appears (red border + helper message).
- Logging is blocked.

### E2. Valid logging path
- Set:
  - Accepted = Accepted or Rejected
  - Booked Rate = valid positive number
  - Time to Cover = valid non-negative integer
- Click Log Quote Outcome.

Expected:
- Quote logs successfully.
- Success message displays quote id.

### E3. Auto-fill convenience
- Click Auto-fill in Outcome Fields.

Expected:
- Booked Rate and Time to Cover are populated.
- Does not run when quote is locked.

---

## F. Backend Contract Smoke Checks

Use these endpoints to validate runtime responses:

- `GET /api/rate-logic/feature-schema`
- `POST /api/rate-logic/predict`
- `POST /api/rate-logic/quote-outcomes`
- `GET /api/rate-logic/metrics`

Expected:
- All return valid JSON with non-error status under healthy runtime.

---

## G. Exit Criteria

Release candidate is accepted when:

1. All A-F tests pass.
2. No UI regressions in navigation or rendering.
3. No console/runtime errors during happy-path use.
4. Build and backend runtime checks are successful.

---

## Known Environment Note

If backend starts with MONGODB_URI warning, deterministic and in-memory MVP flows can still function for local QA, but persistent data behavior should be validated again once DB is configured.

---

## QA Sign-off Template

Use this section as a formal test record for each UAT cycle.

| Field | Value |
|---|---|
| Owner | |
| Date | |
| Build / Commit | |
| Result | Pass / Fail |
| Blockers | |

### Notes

- Scope covered:
- Deferred items:
- Follow-up actions:
