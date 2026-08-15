/*
 * GramOne ESP32 Water Node Telemetry Demo
 * 
 * Hardware node demo sending water tank level and battery telemetry
 * to the GramOne FastAPI backend over HTTP POST.
 * 
 * Target Board: ESP32 Dev Module
 * Sensor: Ultrasonic (HC-SR04) or Simulated Water Level
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // Library version 6.x or 7.x

// ============================================================================
// CONFIGURATION (Replace with your local network settings)
// ============================================================================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Replace with your backend IP / URL (e.g., http://192.168.1.100:8000/api/v1)
const char* API_BASE_URL  = "http://127.0.0.1:8000/api/v1";

const char* DEVICE_ID     = "WATER-DEMO-001";
const int   POST_INTERVAL_MS = 15000; // Send telemetry every 15 seconds

// Simulated water level variable (oscillates to trigger critical <20% warnings)
float current_water_level = 85.0;
bool  draining = true;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n--- GramOne ESP32 Water Node Starting ---");
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi Connection Failed! Proceeding in offline simulation mode...");
  }
}

void loop() {
  // Simulate water level oscillation between 90% and 15%
  if (draining) {
    current_water_level -= 10.0;
    if (current_water_level <= 15.0) {
      current_water_level = 15.0;
      draining = false; // Tank refilling
    }
  } else {
    current_water_level += 15.0;
    if (current_water_level >= 90.0) {
      current_water_level = 90.0;
      draining = true; // Tank draining
    }
  }

  float battery_percent = 94.0; // Simulated battery state

  Serial.println("----------------------------------------");
  Serial.print("Device ID    : "); Serial.println(DEVICE_ID);
  Serial.print("Water Level  : "); Serial.print(current_water_level); Serial.println("%");
  Serial.print("Battery      : "); Serial.print(battery_percent); Serial.println("%");
  if (current_water_level < 20.0) {
    Serial.println("STATUS       : 🚨 CRITICAL LOW WATER WARNING (< 20%)");
  } else {
    Serial.println("STATUS       : OK (Normal Operating Range)");
  }

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String endpoint = String(API_BASE_URL) + "/hardware/telemetry";

    http.begin(endpoint);
    http.addHeader("Content-Type", "application/json");

    // Prepare JSON payload
    StaticJsonDocument<200> doc;
    doc["device_id"] = DEVICE_ID;
    doc["water_level_percent"] = current_water_level;
    doc["battery_percent"] = battery_percent;

    String jsonPayload;
    serializeJson(doc, jsonPayload);

    Serial.print("Posting to   : "); Serial.println(endpoint);
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.print("HTTP Response Code: "); Serial.println(httpResponseCode);
      String response = http.getString();
      Serial.print("Server Response   : "); Serial.println(response);
    } else {
      Serial.print("HTTP POST Error Code: "); Serial.println(httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("Skipping HTTP POST (WiFi disconnected)");
  }

  delay(POST_INTERVAL_MS);
}
