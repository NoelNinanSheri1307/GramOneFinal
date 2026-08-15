# GramOne ESP32 Hardware Telemetry Demo Guide

This document outlines the setup, wiring, flashing instructions, and judge demo steps for the GramOne physical ESP32 water-monitoring node.

---

## 1. Overview & Architecture

The GramOne Water Telemetry Node monitors village drinking water tank levels and battery levels, transmitting live telemetry over HTTP POST directly to the FastAPI backend.

```
+--------------------------+          Wi-Fi / HTTP POST           +-------------------------+
|    ESP32 Water Node      | -----------------------------------> |   FastAPI Backend       |
| (WATER-DEMO-001)         |   POST /api/v1/hardware/telemetry    |  (port 8000)            |
+--------------------------+                                      +-------------------------+
          |                                                                    |
          | Sensor / Simulated Data                                            | Live Status (20s)
          v                                                                    v
  Tank Water Level %                                             +-------------------------+
  Battery Level %                                                | Panchayat Web Portal    |
  Threshold Check (<20%)                                         |  (port 5173/panchayat)  |
                                                                 +-------------------------+
```

---

## 2. Hardware Components & Wiring

### Required Components
1. **ESP32 DevKit V1 Board**
2. **HC-SR04 Ultrasonic Distance Sensor** (or 10k Potentiometer for manual level tuning)
3. **Breadboard & Male-to-Female Jumper Wires**
4. **Micro-USB Cable** (Data transfer capable)

### ASCII Wiring Diagram (HC-SR04 Sensor)
```
      +------------------+                    +---------------------+
      |   ESP32 DevKit   |                    | HC-SR04 Ultrasonic  |
      +------------------+                    +---------------------+
      |   5V / VIN       | ------------------ | VCC                 |
      |   GND            | ------------------ | GND                 |
      |   GPIO 5         | ------------------ | TRIG                |
      |   GPIO 18        | ------------------ | ECHO                |
      +------------------+                    +---------------------+
```

---

## 3. How to Flash the ESP32 Sketch

1. Open Arduino IDE or VS Code with PlatformIO.
2. Open `hardware/water-node/esp32_demo.ino`.
3. Install required libraries via Arduino Library Manager:
   - **ArduinoJson** (v6.x or v7.x)
   - **WiFi** (Built-in for ESP32)
   - **HTTPClient** (Built-in for ESP32)
4. Select board: **ESP32 Dev Module**.
5. Update your local Wi-Fi configuration in lines 18–22:
   ```cpp
   const char* WIFI_SSID     = "YOUR_WIFI_SSID";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   const char* API_BASE_URL  = "http://192.168.1.100:8000/api/v1"; // Your local IP
   ```
6. Connect ESP32 via USB and click **Upload**.
7. Open Serial Monitor at **115200 baud** to view transmission logs.

---

## 4. Local Judge Demo Steps (No Physical Board Required)

Judges can evaluate the full physical telemetry warning pipeline with or without physical hardware:

1. **Start Services**:
   - Backend: `uvicorn app.main:app --reload --port 8000` (in `backend/`)
   - Web App: `npm run dev` (in `web/`)
2. **Open Panchayat Dashboard**:
   - Navigate to `http://localhost:5173/panchayat` (or click **⚡ Quick Switch to Panchayat Demo Officer**).
3. **Simulate Telemetry**:
   - Click the **⚡ DEV ONLY: Simulate Water 18% (Critical)** button on the Hardware Telemetry card.
   - Observe the **🚨 CRITICAL HARDWARE ALERT** red banner appear immediately:
     *`🚨 CRITICAL HARDWARE ALERT: Water Tank Level at 18% (Below 20% Critical Threshold).`*
4. **Simulate Refill**:
   - Click **⚡ DEV ONLY: Simulate Water 85% (Normal)**.
   - Observe the alert clear automatically on the next 20-second status tick.
