# Load Command MVP Build Spec

## 1) Objective
Build a production-ready **Load Command** page that acts as the brokerage execution console for dispatchers.

MVP outcome:
- Dispatcher can filter/search active loads.
- Dispatcher can select a load and see financial + risk context.
- Dispatcher can execute core actions (dispatch, reassign, bid-network handoff, mark delivered).
- UI supports mock mode cleanly, with live mode backed by API contracts.

## 2) In-Scope vs Out-of-Scope

### In Scope (Sprint 1)
- Split-pane page: load grid (left) + contextual detail panel (right).
- URL-driven module route and filter state for Loads.
- Single-row selection + detail fetch.
- Core actions with server validation + optimistic status updates.
- Basic event log per load.
- Role guard for dispatcher/admin actions.

### Out of Scope (Sprint 1)
- Real-time socket sync.
- Bulk dispatch / shift-click multi-select.
- Inline cell editing in grid.
- Live map/GPS embedding.
- Full compliance document upload workflows.

## 3) Users and Permissions

Roles:
- `dispatcher`: full execution actions on assigned and permitted loads.
- `ops_manager`: dispatcher rights + reassignment across all teams.
- `owner_admin`: read/write all; access operational overrides.
- `viewer`: read-only.

Authorization rules (MVP):
- Read list/detail/risk/events: all authenticated roles.
- Dispatch/reassign/bid/mark-delivered: dispatcher, ops_manager, owner_admin.

## 4) Page IA and Routing

Primary route:
- `/loads`

Query params (server-driven filters):
- `tab=all|my|uncovered|at_risk|delivered`
- `q=<searchTerm>` (customer/carrier/load id)
- `status=open|in_transit|uncovered|delivered|cancelled|at_risk`
- `equipment=van|reefer|flatbed|...`
- `dispatcherId=<id>`
- `pickupFrom=YYYY-MM-DD`
- `pickupTo=YYYY-MM-DD`
- `sort=pickupAt|-pickupAt|marginPct|-marginPct|updatedAt|-updatedAt`
- `page=<n>`
- `pageSize=<n>`

Selection state:
- `selected=<loadId>` optional query param so right panel is deep-linkable.

## 5) Data Model (MVP Contract)

### Load
```json
{
  "id": "L-102938",
  "status": "open",
  "customer": { "id": "C-44", "name": "Amazon" },
  "carrier": { "id": "CR-18", "name": "Prime Logistics", "assigned": true },
  "origin": { "city": "Los Angeles", "state": "CA" },
  "destination": { "city": "Dallas", "state": "TX" },
  "equipment": "van",
  "miles": 1280,
  "revenue": 4200,
  "carrierCost": 3600,
  "margin": 600,
  "marginPct": 14.3,
  "targetMarginPct": 12,
  "pickupAt": "2026-03-02T15:00:00Z",
  "deliveryAt": "2026-03-04T03:00:00Z",
  "dispatcher": { "id": "U-9", "name": "Alex Smith" },
  "updatedAt": "2026-03-01T18:32:00Z"
}
```

### Risk Signals
```json
{
  "loadId": "L-102938",
  "laneVolatilityScore": 61,
  "capacityHeatIndex": 51,
  "complianceStatus": "valid",
  "pickupCountdownMinutes": 930,
  "warnings": ["margin_below_lane_avg"]
}
```

### Event Log Item
```json
{
  "id": "EV-909",
  "loadId": "L-102938",
  "type": "carrier_assigned",
  "message": "Carrier Prime Logistics assigned",
  "actor": { "id": "U-9", "name": "Alex Smith" },
  "createdAt": "2026-03-01T18:22:00Z"
}
```

## 6) REST Endpoint Contracts

Base path: `/api`

### 6.1 List Loads
`GET /api/loads`

Query:
- `tab`, `q`, `status`, `equipment`, `dispatcherId`, `pickupFrom`, `pickupTo`, `sort`, `page`, `pageSize`

Response `200`:
```json
{
  "items": ["<Load>"],
  "page": 1,
  "pageSize": 50,
  "total": 428,
  "facets": {
    "status": { "open": 121, "in_transit": 203, "uncovered": 33, "at_risk": 44, "delivered": 27 },
    "equipment": { "van": 282, "reefer": 91, "flatbed": 55 }
  }
}
```

### 6.2 Load Detail
`GET /api/loads/:loadId`

Response `200`:
```json
{
  "load": "<Load>",
  "laneAverageMarginPct": 15.4,
  "marginDeltaPct": -1.1,
  "controls": {
    "canDispatch": true,
    "canReassign": true,
    "canBidNetwork": true,
    "canMarkDelivered": false
  }
}
```

### 6.3 Risk Signals
`GET /api/loads/:loadId/risk-signals`

Response `200`:
```json
{ "risk": "<Risk Signals>" }
```

### 6.4 Event Log
`GET /api/loads/:loadId/events?limit=25&cursor=<cursor>`

Response `200`:
```json
{
  "items": ["<Event Log Item>"],
  "nextCursor": "opaque-cursor-or-null"
}
```

### 6.5 Create Load (minimal)
`POST /api/loads`

Body:
```json
{
  "customerId": "C-44",
  "origin": { "city": "Los Angeles", "state": "CA" },
  "destination": { "city": "Dallas", "state": "TX" },
  "equipment": "van",
  "miles": 1280,
  "revenue": 4200,
  "pickupAt": "2026-03-02T15:00:00Z",
  "deliveryAt": "2026-03-04T03:00:00Z"
}
```

Response `201`:
```json
{ "load": "<Load>" }
```

### 6.6 Update Load (limited editable fields)
`PATCH /api/loads/:loadId`

Body (any subset):
```json
{
  "revenue": 4300,
  "carrierCost": 3650,
  "pickupAt": "2026-03-02T16:00:00Z",
  "deliveryAt": "2026-03-04T04:00:00Z"
}
```

Response `200`:
```json
{ "load": "<Load>" }
```

### 6.7 Dispatch Action
`POST /api/loads/:loadId/dispatch`

Body:
```json
{
  "carrierId": "CR-18",
  "lockStatus": true,
  "notes": "Confirmed via phone"
}
```

Server validations:
- carrier compliance valid
- insurance valid
- margin threshold satisfied (default `>= 12%`, override only for owner_admin)

Response `200`:
```json
{
  "load": "<Load>",
  "dispatch": { "status": "dispatched", "dispatchedAt": "2026-03-01T19:10:00Z" }
}
```

### 6.8 Reassign Carrier
`POST /api/loads/:loadId/reassign`

Body:
```json
{
  "carrierId": "CR-27",
  "reason": "Missed check call"
}
```

Response `200`:
```json
{ "load": "<Load>" }
```

### 6.9 Send to Bid Network
`POST /api/loads/:loadId/send-to-bid-network`

Body:
```json
{
  "network": "internal",
  "expiresAt": "2026-03-02T03:00:00Z"
}
```

Response `202`:
```json
{
  "requestId": "BN-774",
  "status": "queued"
}
```

### 6.10 Mark Delivered
`POST /api/loads/:loadId/mark-delivered`

Body:
```json
{
  "deliveredAt": "2026-03-04T03:10:00Z",
  "podReceived": true
}
```

Response `200`:
```json
{ "load": "<Load>" }
```

## 7) Error Contract
All endpoints return:
```json
{
  "error": {
    "code": "MARGIN_BELOW_THRESHOLD",
    "message": "Margin 9.2% is below required 12.0%",
    "details": { "required": 12, "actual": 9.2 }
  }
}
```

HTTP mapping:
- `400` validation error
- `401` unauthenticated
- `403` unauthorized
- `404` not found
- `409` state conflict
- `422` business rule failure
- `500` internal

## 8) React Component Boundaries (Concrete)

### Existing shell to reuse
- App routing and providers: `src/App.jsx`
- Frame layout: `src/components/Layout.jsx`
- Sidebar nav: `src/components/Sidebar.jsx`

### New module boundaries (Sprint 1)
- `src/pages/loads/LoadCommandPage.jsx`
  - Orchestrates URL query state, data fetching, selection state.
- `src/pages/loads/components/PrimaryTabs.jsx`
  - Top module tabs.
- `src/pages/loads/components/SubTabs.jsx`
  - `All`, `My Loads`, `Uncovered`, `At Risk`, `Delivered`.
- `src/pages/loads/components/FilterBar.jsx`
  - Search, status/equipment/date filters, reset.
- `src/pages/loads/components/LoadsGrid.jsx`
  - Table shell, sorting UI, pagination controls.
- `src/pages/loads/components/LoadRow.jsx`
  - Pure row renderer + click handling.
- `src/pages/loads/components/LoadDetailPanel.jsx`
  - Right panel container.
- `src/pages/loads/components/FinancialSummaryCard.jsx`
- `src/pages/loads/components/OperationalActionsCard.jsx`
- `src/pages/loads/components/RiskSignalsCard.jsx`
- `src/pages/loads/components/EventLogCard.jsx`

### Hooks and services
- `src/pages/loads/hooks/useLoadFilters.js`
- `src/pages/loads/hooks/useLoadsQuery.js`
- `src/pages/loads/hooks/useLoadSelection.js`
- `src/pages/loads/hooks/useLoadActions.js`
- `src/api/loadsClient.js` (new)

### Type contracts (if TS phase starts)
- `src/pages/loads/types.js` (JSDoc typedefs now; TS later)

## 9) Frontend State and API Integration Rules

- URL is source of truth for filters + selected load id.
- Local state only for transient UI (open menus, in-flight buttons).
- All mutations (`dispatch`, `reassign`, `mark-delivered`) must:
  1. disable relevant action button,
  2. call API,
  3. patch selected row + detail panel,
  4. append event-log item or refetch events.
- Mock mode uses same contracts with local adapters; no alternate shapes.

## 10) Sprint Plan

## Sprint 1 (MVP, ship now)
Deliver:
1. Route `/loads` with split-pane page.
2. Sub-tabs and filter bar mapped to URL params.
3. `GET /api/loads` + `GET /api/loads/:id` + `GET /api/loads/:id/risk-signals` + `GET /api/loads/:id/events`.
4. Actions: `dispatch`, `reassign`, `mark-delivered`.
5. Validation and error handling with shared error contract.
6. Feature flag + mock adapter parity.

Acceptance criteria:
- Dispatcher can filter and find a load in <3 interactions.
- Selecting a row renders detail panel in <400 ms after response.
- Dispatch action is blocked on compliance/margin rule failures with explicit error message.
- URL refresh preserves current filter and selected load.

## Scale Phase (post-MVP)
Deliver:
1. WebSocket live updates for status, compliance, and pricing events.
2. Virtualized grid + server-side cursor pagination for 10k+ loads.
3. Bulk operations (multi-select dispatch/reassign).
4. Inline grid editing with audit trail.
5. Carrier recommendation engine endpoint and UI suggestions.
6. Embedded map/tracking panel and SLA countdown engine.

Scale KPIs:
- p95 list query < 500 ms for 50-row page.
- UI remains responsive with 10k active-load dataset.
- Real-time event latency < 2s from backend emit to UI reflect.

## 11) Backend Implementation Mapping (Current Repo)
Current routers in `server/index.js` cover auth, dashboard, invoices, exceptions, reports, etc., but no dedicated loads execution API.

Add new router:
- `server/loads.js`

Mount:
- `app.use('/api/loads', loadsRouter)` in `server/index.js`.

Recommended backing tables/collections for MVP:
- `loads`
- `load_events`
- `carriers` (existing source)
- `compliance_snapshots` (or derived service call)

## 12) Delivery Checklist
- [ ] Frontend route and components scaffolded.
- [ ] API client implemented with typed contracts.
- [ ] Backend `loads` router with listed endpoints.
- [ ] Permission middleware applied on mutation endpoints.
- [ ] Margin/compliance validation rules implemented.
- [ ] Mock/live mode contract parity verified.
- [ ] QA test script for list/select/dispatch/reassign/delivered flows.
