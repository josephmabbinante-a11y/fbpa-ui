# Fleet Data API Endpoints

The following endpoints are available for managing fleet data. All endpoints are prefixed with `/api`.

---

## Vehicles

- **GET /api/vehicles**
  - List all vehicles
- **GET /api/vehicles/:id**
  - Get a single vehicle by ID
- **POST /api/vehicles**
  - Create a new vehicle
  - Body: `{ make, model, year, vin, licensePlate, status }`
- **PUT /api/vehicles/:id**
  - Update a vehicle by ID
  - Body: `{ make, model, year, vin, licensePlate, status }`
- **DELETE /api/vehicles/:id**
  - Delete a vehicle by ID

---

## Drivers

- **GET /api/drivers**
  - List all drivers
- **GET /api/drivers/:id**
  - Get a single driver by ID
- **POST /api/drivers**
  - Create a new driver
  - Body: `{ name, licenseNumber, phone, email, status }`
- **PUT /api/drivers/:id**
  - Update a driver by ID
  - Body: `{ name, licenseNumber, phone, email, status }`
- **DELETE /api/drivers/:id**
  - Delete a driver by ID

---

## Trips

- **GET /api/trips**
  - List all trips
- **GET /api/trips/:id**
  - Get a single trip by ID
- **POST /api/trips**
  - Create a new trip
  - Body: `{ vehicle, driver, startLocation, endLocation, startTime, endTime, status }`
- **PUT /api/trips/:id**
  - Update a trip by ID
  - Body: `{ vehicle, driver, startLocation, endLocation, startTime, endTime, status }`
- **DELETE /api/trips/:id**
  - Delete a trip by ID

---

All endpoints return standard JSON responses. For POST and PUT, provide the required fields in the request body as JSON.
