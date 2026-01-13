#include <SPI.h>
#include <MFRC522.h>
#include "DHT.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WebServer.h> // Necesario para recibir peticiones

// =====================
// WIFI & API CONFIG
// =====================
const char* ssid = "Borjax";
const char* password = "123456789";
// ------------------------------------------------------------------------------------
// IMPORTANTE: Si usas Docker, asegurate de que esta IP es la de tu PC (ipconfig)
// y NO "localhost" ni "127.0.0.1". Windows Firewall debe permitir puerto 8080.
// ------------------------------------------------------------------------------------
const char* serverName = "http://10.132.5.62:8080/api/datos"; 

// =====================
// SERVER WEB (Para peticiones de sensores)
// =====================
WebServer server(80);

// =====================
// PINES
// =====================
#define DHTPIN   4
#define DHTTYPE  DHT11

#define LDRPIN   5      // D5 (digital)
#define LEDPIN   2

#define SS_PIN   21
#define RST_PIN  22

// =====================
// OBJETOS
// =====================
DHT dht(DHTPIN, DHTTYPE);
MFRC522 mfrc522(SS_PIN, RST_PIN);

// =====================
// FUNCIONES AUXILIARES
// =====================
void enviarDatosAPI(float temp, float hum, bool iluminadad, String uid, String usuario, String password) {
    if(WiFi.status() == WL_CONNECTED){
        HTTPClient http;
        http.begin(serverName);
        http.addHeader("Content-Type", "application/json");

        StaticJsonDocument<200> doc;
        
        bool hayDatos = false;

        // 1. LOGIN: Si hay Usuario y Password
        if (usuario != "" && password != "") {
             doc["usuario"] = usuario;
             doc["password"] = password;
             hayDatos = true;
        }
        // 2. Si no es Login, miramos si es UID simple o Sensores
        else if (uid != "") {
            doc["rfidUid"] = uid;
            hayDatos = true;
        } 
        else {
            // Luz siempre es válida (lectura digital)
            doc["luz"] = iluminadad;
            hayDatos = true;

            // Temp y Humedad pueden fallar (NAN), solo las enviamos si son válidas
            if (!isnan(temp)) doc["temperatura"] = temp;
            if (!isnan(hum)) doc["humedad"] = hum;
        }

        // Si no hay nada que enviar, salimos para evitar error 400
        if (!hayDatos) {
            Serial.println("No hay datos válidos para enviar a la API.");
            http.end();
            return; 
        }

        String requestBody;
        serializeJson(doc, requestBody);

        Serial.println("Enviando a API: " + requestBody);
        int httpResponseCode = http.POST(requestBody);
        
        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.print("✅ API Response Code: ");
            Serial.println(httpResponseCode);
            Serial.println("📥 API Response: " + response);
        } else {
            Serial.print("❌ Error API: ");
            Serial.println(httpResponseCode);
            if (httpResponseCode == -1) {
                Serial.println("💡 Error -1: No se pudo conectar al servidor");
                Serial.println("   Verifica:");
                Serial.println("   - ¿El servidor está corriendo en " + String(serverName) + "?");
                Serial.println("   - ¿La IP es correcta? (Tu IP: " + WiFi.localIP().toString() + ")");
                Serial.println("   - ¿El firewall permite conexiones?");
            } else if (httpResponseCode == -11) {
                Serial.println("💡 Error -11: Timeout - el servidor no respondió a tiempo");
            }
        }
        http.end();
    } else {
        Serial.println("❌ WiFi desconectado, no se puede enviar");
    }
}

// Esta función se ejecuta cuando alguien entra a http://IP_ESP32/
void handleRoot() {
  Serial.println("Petición WEB recibida - Leyendo sensores...");
  
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  int l = digitalRead(LDRPIN);
  bool luz = !(l == HIGH); // true si hay luz

  // --- LOGGING ---
  Serial.println("--------------------------------");
  Serial.print("Temperatura: "); Serial.println(isnan(t) ? "Error Sensor" : String(t));
  Serial.print("Humedad:     "); Serial.println(isnan(h) ? "Error Sensor" : String(h));
  Serial.print("Luz:         "); Serial.println(luz ? "ON" : "OFF");
  Serial.println("--------------------------------");

  StaticJsonDocument<200> doc;
  doc["temperatura"] = t;
  doc["humedad"] = h;
  doc["luz"] = luz;
  doc["mensaje"] = "Lectura bajo demanda";

  String json;
  serializeJson(doc, json);

  // Responder al navegador/cliente
  server.send(200, "application/json", json);
  
  // Guardar también en Spring Boot cuando se haga la petición web
  enviarDatosAPI(t, h, luz, "", "", ""); 
}

// =====================
// SETUP
// =====================
void setup() {
  Serial.begin(115200);
  delay(3000);

  // CONEXIÓN WIFI
  WiFi.begin(ssid, password);
  Serial.print("Conectando a WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Conectado con IP: ");
  Serial.println(WiFi.localIP());

  // Init Web Server
  server.on("/", handleRoot);
  server.begin();
  Serial.println("Servidor Web Iniciado");

  pinMode(LDRPIN, INPUT);
  pinMode(LEDPIN, OUTPUT);

  // DHT
  dht.begin();

  // RFID
  SPI.begin(18, 19, 23, SS_PIN);
  mfrc522.PCD_Init();

  Serial.println("=================================");
  Serial.println("SISTEMA HÍBRIDO: RFID (Loop) + Sensores (HTTP)");
  Serial.println("=================================");
}

// Loop
// =====================
void loop() {
  // 1. ATENDER PETICIONES WEB (SENSORES)
  server.handleClient();

  // 2. COMPROBAR RFID (SIEMPRE ACTIVO)
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
      Serial.println("\n🔐 TARJETA DETECTADA");

      // --- OBTENER UID REAL DE LA TARJETA ---
      String uidReal = "";
      for (byte i = 0; i < mfrc522.uid.size; i++) {
          if (i > 0) uidReal += ":";
          if (mfrc522.uid.uidByte[i] < 0x10) uidReal += "0";
          uidReal += String(mfrc522.uid.uidByte[i], HEX);
      }
      uidReal.toUpperCase();
      Serial.println("UID Tarjeta: " + uidReal);

      // --- AUTENTICACIÓN MIFARE ---
      MFRC522::MIFARE_Key key;
      for (byte i = 0; i < 6; i++) key.keyByte[i] = 0xFF; // Clave por defecto

      // --- AUTENTICACIÓN Y LECTURA SECTOR 4 ---
      // Bloque 16 = Usuario
      // Bloque 17 = Password
      
      MFRC522::StatusCode status;
      byte buffer[18];
      byte size = sizeof(buffer);
      String usuarioLeido = "";
      String passwordLeido = "";
      bool errorLecturaUsuario = false;
      bool errorLecturaPassword = false;

      // 1. LEER BLOQUE 17 (USUARIO) - Ajustado según datos de tarjeta
      byte blockUser = 17;
      status = mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, blockUser, &key, &(mfrc522.uid));
      if (status == MFRC522::STATUS_OK) {
          size = sizeof(buffer); // Reset size
          status = mfrc522.MIFARE_Read(blockUser, buffer, &size);
          if (status == MFRC522::STATUS_OK) {
              Serial.print("Bloque 17 (User) raw: ");
              for (byte i = 0; i < 16; i++) {
                  Serial.print(buffer[i], HEX);
                  Serial.print(" ");
                  if (buffer[i] >= 32 && buffer[i] <= 126) usuarioLeido += (char)buffer[i];
              }
              Serial.println();
              usuarioLeido.trim(); // Eliminar espacios
          } else {
              Serial.println("❌ Error leyendo bloque 17 (Usuario): " + String(status));
              errorLecturaUsuario = true;
          }
      } else {
          Serial.println("❌ Error autenticando bloque 17: " + String(status));
          errorLecturaUsuario = true;
      }

      // 2. LEER BLOQUE 18 (PASSWORD) - Ajustado según datos de tarjeta
      byte blockPass = 18;
      status = mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, blockPass, &key, &(mfrc522.uid));
      if (status == MFRC522::STATUS_OK) {
           size = sizeof(buffer); // Reset size
           status = mfrc522.MIFARE_Read(blockPass, buffer, &size);
           if (status == MFRC522::STATUS_OK) {
              Serial.print("Bloque 18 (Pass) raw: ");
              for (byte i = 0; i < 16; i++) {
                  Serial.print(buffer[i], HEX);
                  Serial.print(" ");
                  if (buffer[i] >= 32 && buffer[i] <= 126) passwordLeido += (char)buffer[i];
              }
              Serial.println();
              passwordLeido.trim(); // Eliminar espacios
           } else {
              Serial.println("❌ Error leyendo bloque 18 (Password): " + String(status));
              errorLecturaPassword = true;
           }
      } else {
          Serial.println("❌ Error autenticando bloque 18: " + String(status));
          errorLecturaPassword = true;
      }

      Serial.println("Usuario Leido: [" + usuarioLeido + "]");
      Serial.println("Password Leido: [" + passwordLeido + "]");

      // DECISIÓN DE QUÉ ENVIAR
      if (usuarioLeido != "" && passwordLeido != "") {
          // CASO 1: AMBOS CAMPOS LEÍDOS CORRECTAMENTE
          Serial.println("✅ Enviando credenciales completas");
          enviarDatosAPI(NAN, NAN, false, "", usuarioLeido, passwordLeido);
      } else if (usuarioLeido == "" && passwordLeido == "" && !errorLecturaUsuario && !errorLecturaPassword) {
          // CASO 2: BLOQUES VACÍOS (tarjeta sin escribir) -> Enviar solo UID
          Serial.println("⚠️ Tarjeta sin credenciales, enviando UID: " + uidReal);
          enviarDatosAPI(NAN, NAN, false, uidReal, "", ""); 
      } else {
          // CASO 3: Credenciales parciales o errores de lectura
          Serial.println("⚠️ Credenciales incompletas o error de lectura");
          if (usuarioLeido != "" || passwordLeido != "") {
              Serial.println("💡 Sugerencia: Verifica que la tarjeta esté bien escrita (bloques 16 y 17)");
          }
          Serial.println("📤 Enviando UID como respaldo: " + uidReal);
          enviarDatosAPI(NAN, NAN, false, uidReal, "", ""); 
      }

      mfrc522.PICC_HaltA();
      mfrc522.PCD_StopCrypto1();
  }
}
