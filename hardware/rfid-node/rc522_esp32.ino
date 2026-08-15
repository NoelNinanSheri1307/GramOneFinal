/*
 * GramOne ESP32 RFID Employee Sign-In / Attendance Node
 * 
 * Hardware node reading RC522 RFID card scans and sending employee UID
 * to the GramOne FastAPI backend over HTTP POST /api/v1/hardware/rfid-scan.
 * 
 * Target Board: ESP32 Dev Module
 * RFID Module : MFRC522 (SPI)
 * 
 * Pin Configuration:
 * - MFRC522 SS/SDA  : GPIO 5
 * - MFRC522 RST     : GPIO 22
 * - MFRC522 SCK     : GPIO 18
 * - MFRC522 MISO    : GPIO 19
 * - MFRC522 MOSI    : GPIO 23
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>

// ============================================================================
// CONFIGURATION
// ============================================================================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

const char* API_BASE_URL  = "http://192.168.1.100:8000/api/v1";
const char* DEVICE_ID     = "RFID-GATE-01";

#define SS_PIN  5
#define RST_PIN 22

MFRC522 rfid(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n--- GramOne ESP32 RFID Reader Starting ---");
  
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("RC522 RFID Initialized. Tap card to sign in/out...");

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
    Serial.println("\nWiFi Connection Failed! Will retry upon card scan...");
  }
}

void loop() {
  // Look for new card
  if (!rfid.PICC_IsNewCardPresent()) {
    delay(50);
    return;
  }

  // Select card
  if (!rfid.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  // Read Card UID as hex string
  String cardUid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) cardUid += "0";
    cardUid += String(rfid.uid.uidByte[i], HEX);
  }
  cardUid.toUpperCase();

  Serial.println("----------------------------------------");
  Serial.print("Card Scanned! UID: ");
  Serial.println(cardUid);

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String endpoint = String(API_BASE_URL) + "/hardware/rfid-scan";

    http.begin(endpoint);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["rfid_card_id"] = cardUid;
    doc["device_id"] = DEVICE_ID;

    String jsonPayload;
    serializeJson(doc, jsonPayload);

    Serial.print("Posting scan to: "); Serial.println(endpoint);
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

  delay(2000); // 2-second debounce between card taps
}
