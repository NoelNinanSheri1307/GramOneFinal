# GramOne hardware — water-node

ESP32 water monitoring node for the GramOne platform.

> **Foundation status:** This directory prepares the ESP32 project layout only.
> **No sensor driver, firmware or simulation is implemented yet.** Nothing here
> pretends to read a real sensor.

## Responsibilities of the hardware (final scope)

The ESP32 is another client of the shared backend. It should only:

- Read sensor data (e.g. flow, level, turbidity, TDS/EC).
- Validate basic sensor readings (sanity/range checks — simple, on-device).
- Transmit telemetry to the GramOne backend.
- Display local status (LED/display).

All GramOne business logic (threshold interpretation, evidence events, Impact
Cases, priority) lives in the backend — not in ESP32 firmware.

## Project layout (planned)

```
water-node/
├── src/          # Firmware sources (future)
├── include/      # Firmware headers (future)
├── CMakeLists.txt / platformio.ini   # to be added when firmware begins
└── README.md     # this file
```

The firmware toolchain (ESP-IDF or PlatformIO) will be chosen in the hardware
milestone; nothing is pinned yet.

## Telemetry contract (conceptual)

Each telemetry transmission is a single structured record:

| Field      | Type   | Description                                        |
|------------|--------|----------------------------------------------------|
| device_id  | string | Stable, backend-registered device identifier       |
| sensor_type| string | e.g. `flow`, `water_level`, `turbidity`, `conductivity` |
| value      | number | Sensor reading in `unit`                           |
| unit       | string | SI-preferred unit, e.g. `L/min`, `cm`, `NTU`       |
| timestamp  | string | ISO 8601 UTC timestamp                             |
| location   | object | `{ lat, lon }` (and/or village/panchayat reference)|

The node transmits this JSON/structured payload to the backend over HTTPS
(JSON) and/or MQTT. Format and bearer-token auth are finalized in the telemetry
milestone.

## End-to-end communication path (future)

```
ESP32
 → GramOne backend
   → telemetry storage (PostgreSQL)
   → deterministic threshold engine
   → evidence event
   → Impact Case
```

None of this workflow is active in the foundation.