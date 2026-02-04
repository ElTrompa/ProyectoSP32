#include <Wire.h>
#include <LiquidCrystal_PCF8574.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Keypad.h>
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
const char* serverName = "http://10.123.248.62:8080/api/datos"; 
 

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
// #define LEDPIN   2 // Comentado porque usaremos el pin 2 para el altavoz

#define SS_PIN   21
#define RST_PIN  22
#define BUZZER_PIN 2 // Usamos D2 (GPIO 2) que es salida válida

// =====================
// OBJETOS
// =====================
LiquidCrystal_PCF8574 lcd(0x27);
DHT dht(DHTPIN, DHTTYPE);
MFRC522 mfrc522(SS_PIN, RST_PIN);

// =====================
// VARIABLES GLOBALES
// =====================
const unsigned long sensorInterval = 30000; // Intervalo de lectura de sensores en ms (30 segundos)
unsigned long lastSensorUpdate = 0;

unsigned long lastLcdUpdate = 0;
bool lcdActive = false;

// Variable global para guardar el nombre del usuario
String currentUsuarioLeido = "";

// =====================
// DEFINICIÓN KEYPAD
// =====================
const byte ROWS = 4; 
const byte COLS = 4; 
char keys[ROWS][COLS] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};
byte rowPins[ROWS] = {32, 33, 25, 26}; 
byte colPins[COLS] = {16, 17, 12, 13}; 

Keypad keypad = Keypad( makeKeymap(keys), rowPins, colPins, ROWS, COLS );

// =====================
// DECLARACIÓN DE FUNCIONES PREVIAS
// =====================
void enviarDatosAPI(float temp, float hum, bool iluminadad, String uid, String token, String pin, String tipo);
void beep(unsigned int duration);

// =====================
// FUNCIONES AUXILIARES
// =====================
void beep(unsigned int duration) {
  tone(BUZZER_PIN, 2000); // Iniciar tono
  delay(duration);        // Esperar
  noTone(BUZZER_PIN);     // Parar tono
  digitalWrite(BUZZER_PIN, LOW); // Asegurar que se quede en LOW
}

void enviarDatosAPI(float temp, float hum, bool iluminadad, String uid, String token, String pin, String tipo) {
    if(WiFi.status() == WL_CONNECTED){
        HTTPClient http;
        http.begin(serverName);
        http.addHeader("Content-Type", "application/json");

        StaticJsonDocument<200> doc;
        
        bool hayDatos = false;

        // 1. LOGIN: Si hay Token (o PIN)
        if (token != "") {
             doc["token"] = token;
             hayDatos = true;
        }
        
        if (pin != "") {
             doc["pin"] = pin;
             hayDatos = true;
        }
        
        if (tipo != "") {
            doc["tipo"] = tipo;
        }

        // 2. Si no es Login, miramos si es UID simple o Sensores
        if (uid != "") { // Cambiado 'else if' a 'if' para permitir enviar UID + PIN si fuera necesario
            doc["rfidUid"] = uid;
            hayDatos = true;
        } 
        
        // Solo datos sensores si NO estamos autenticando (para no mezclar tipos de mensaje si la API no lo soporta)
        // O si quieres enviar todo junto, quita el 'else'. 
        // Asumo que si hay UID/Token/Pin es un evento de acceso.
        // Si no hay nada de eso, es lectura de sensores ambiental.
        if (token == "" && uid == "" && pin == "") {
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
        
        // Feedback visual de "Enviando..."
        bool esAcceso = (uid != "" || token != "" || pin != "");
        if (esAcceso) {
            lcd.clear();
            lcd.setCursor(0, 0); lcd.print("Verificando...");
        }

        int httpResponseCode = http.POST(requestBody);
        
        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.print("✅ API Response Code: ");
            Serial.println(httpResponseCode);
            Serial.println("📥 API Response: " + response);

            // --- RESPUESTA EN PANTALLA LCD ---
            if (esAcceso) {
                lcd.clear();
                if (httpResponseCode == 200) {
                    // ACCESO CORRECTO (Pitido: Beep-Beep)
                    beep(100); delay(100); beep(100); 

                    if (response.indexOf("SALIDA") >= 0) {
                        lcd.setCursor(0, 0); lcd.print("Hasta luego");
                        lcd.setCursor(0, 1); lcd.print(currentUsuarioLeido); 
                    } else if (response.indexOf("ENTRADA") >= 0) {
                        lcd.setCursor(0, 0); lcd.print("Hola");
                        lcd.setCursor(6, 0); lcd.print(currentUsuarioLeido);
                        lcd.setCursor(0, 1); lcd.print("Adelante ->");
                    } else {
                        // Fallback
                        lcd.setCursor(0, 0); lcd.print("Acceso");
                        lcd.setCursor(0, 1); lcd.print("Concedido");
                    }
                } else {
                    // ACCESO DENEGADO (Pitido: Beep largo)
                    beep(1000);

                    lcd.setCursor(0, 0); lcd.print("Acceso");
                    lcd.setCursor(0, 1); lcd.print("Denegado");
                }
                lastLcdUpdate = millis();
                lcdActive = true;
            }
            // ---------------------------------

        } else {
            Serial.print("❌ Error API: ");
            Serial.println(httpResponseCode);
            if (httpResponseCode == -1) {
                Serial.println("💡 Error -1: No se pudo conectar al servidor");
            }

            // --- ERROR EN PANTALLA LCD ---
            if (esAcceso) {
                // ERROR CONEXION (Pitido: 3 beeps rápidos error)
                beep(200); delay(100); beep(200); delay(100); beep(200);

                lcd.clear();
                lcd.setCursor(0, 0); lcd.print("Error Conexion");
                lcd.setCursor(0, 1); lcd.print("Err: " + String(httpResponseCode));
                lastLcdUpdate = millis();
                lcdActive = true;
            }
            // -----------------------------
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
  enviarDatosAPI(t, h, luz, "", "", "", ""); 
}

// =====================
// SETUP
// =====================
void setup() {
  Wire.begin(27, 14);
  lcd.begin(16, 2);
  lcd.setBacklight(255);
  lcd.clear();

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
  // pinMode(LEDPIN, OUTPUT); // Comentado
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  noTone(BUZZER_PIN);

  // DHT
  dht.begin();

  // RFID
  SPI.begin(18, 19, 23, SS_PIN);
  mfrc522.PCD_Init();

  Serial.println("=================================");
  Serial.println("SISTEMA DE TOKENS: RFID (Loop) + Sensores (HTTP)");
  Serial.println("=================================");
}

// =====================
// LOOP
// =====================
void loop() {
  // 1. ATENDER PETICIONES WEB (SENSORES)
  server.handleClient();

  // 2. COMPROBAR RFID (SIEMPRE ACTIVO)
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
      Serial.println("\n🔐 TARJETA DETECTADA");
      
      // Pitar altavoz D2
      beep(200);

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
      // Bloque 17 = Usuario
      // Bloque 18 = Token
      
      MFRC522::StatusCode status;
      byte buffer[18];
      byte size = sizeof(buffer);
      String usuarioLeido = "";
      String tokenLeido = "";
      bool errorLectura = false;

      // 1. LEER BLOQUE 17 (USUARIO)
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
              errorLectura = true;
          }
      } else {
          Serial.println("❌ Error autenticando bloque 17: " + String(status));
          errorLectura = true;
      }

      // 2. LEER BLOQUE 18 (TOKEN)
      byte blockToken = 18;
      status = mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, blockToken, &key, &(mfrc522.uid));
      if (status == MFRC522::STATUS_OK) {
          size = sizeof(buffer); // Reset size
          status = mfrc522.MIFARE_Read(blockToken, buffer, &size);
          if (status == MFRC522::STATUS_OK) {
              Serial.print("Bloque 18 (Token) raw: ");
              for (byte i = 0; i < 16; i++) {
                  Serial.print(buffer[i], HEX);
                  Serial.print(" ");
                  if (buffer[i] >= 32 && buffer[i] <= 126) tokenLeido += (char)buffer[i];
              }
              Serial.println();
              tokenLeido.trim(); // Eliminar espacios
          } else {
              Serial.println("❌ Error leyendo bloque 18 (Token): " + String(status));
              errorLectura = true;
          }
      } else {
          Serial.println("❌ Error autenticando bloque 18: " + String(status));
          errorLectura = true;
      }
      
      // Guardar en variable global para usar en enviarDatosAPI
      currentUsuarioLeido = usuarioLeido;

      // --- LCD: BIENVENIDA ---
      lcd.clear();
      if (usuarioLeido != "") {
        lcd.setCursor(0, 0);
        lcd.print("Bienvenido");
        lcd.setCursor(0, 1);
        lcd.print(usuarioLeido);
        delay(1500); // Dar un momento para leer el saludo
      } else {
        lcd.setCursor(0, 0);
        lcd.print("Usuario no");
        lcd.setCursor(0, 1);
        lcd.print("registrado");
        delay(1500);
      }
      
      // --- SELECCION DE MOTIVO ---
      String tipoLeido = "";
      lcd.clear();
      lcd.setCursor(0, 0); lcd.print("A:Jor B:Pau");
      lcd.setCursor(0, 1); lcd.print("C:Med D:Otro");
      
      bool motivoSeleccionado = false;
      unsigned long startTimeMotivo = millis();
      
      while (millis() - startTimeMotivo < 10000 && !motivoSeleccionado) {
          char key = keypad.getKey();
          if (key) {
              beep(100);
              if (key == 'A') { tipoLeido = "JORNADA"; motivoSeleccionado = true; }
              else if (key == 'B') { tipoLeido = "PAUSA"; motivoSeleccionado = true; } // Backend decide Start/End
              else if (key == 'C') { tipoLeido = "MEDICO"; motivoSeleccionado = true; } // Backend decide Out/In
              else if (key == 'D') { tipoLeido = "CONSULTA"; motivoSeleccionado = true; } 
              else if (key == '#') { tipoLeido = ""; motivoSeleccionado = true; } // Automatic / Jump
          }
      }
      
      if (!motivoSeleccionado) {
          Serial.println("Timeout Motivo - Enviando sin tipo (Automático)");
      } else {
          Serial.println("Motivo seleccionado: " + tipoLeido);
          lcd.clear();
          lcd.setCursor(0,0); lcd.print("Seleccionado:");
          lcd.setCursor(0,1); lcd.print(tipoLeido);
          delay(1000);
      }

      // --- PEDIR PIN ---
      String pinIngresado = "";
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Ingrese PIN:");
      lcd.setCursor(0, 1); // Cursor para asteriscos
      
      unsigned long startTime = millis();
      bool pinCompleto = false;
      
      // Bucle de espera de PIN (10 segundos timeout)
      while (millis() - startTime < 10000 && !pinCompleto) { 
        char key = keypad.getKey();
        if (key) {
           beep(100); // Feedback sonoro tecla (sin bloquear demasiado)
           startTime = millis(); // Reset timeout al pulsar tecla
           
           if (key == '#') {
             pinCompleto = true; // Enter
           } else if (key == '*') {
             pinIngresado = ""; // Borrar
             lcd.setCursor(0, 1);
             lcd.print("                "); // Limpiar línea
             lcd.setCursor(0, 1);
           } else {
             if (pinIngresado.length() < 16) { // Evitar desbordar pantalla
                pinIngresado += key;
                lcd.print("*");
             }
           }
        }
        delay(10); // Debounce simple
      }
      
      if (!pinCompleto && pinIngresado.length() == 0) {
         Serial.println("Timeout PIN - Enviando sin PIN");
      }

      // Actualizar temporizador LCD para que se apague después
      lastLcdUpdate = millis();
      lcdActive = true;

      // DECISIÓN DE QUÉ ENVIAR (Prioridad al Token)
      if (tokenLeido != "") {
          // CASO 1: TOKEN LEIDO + PIN
          Serial.println("✅ Enviando Token + PIN");
          enviarDatosAPI(NAN, NAN, false, "", tokenLeido, pinIngresado, tipoLeido);
      } else if (tokenLeido == "" && !errorLectura) {
          // CASO 2: SOLO UID + PIN
          Serial.println("⚠️ Tarjeta sin token, enviando UID: " + uidReal);
          enviarDatosAPI(NAN, NAN, false, uidReal, "", pinIngresado, tipoLeido); 
      } else {
          // CASO 3: Error lectura + PIN
          Serial.println("⚠️ Error de lectura");
          Serial.println("📤 Enviando UID como respaldo: " + uidReal);
          enviarDatosAPI(NAN, NAN, false, uidReal, "", pinIngresado, tipoLeido); 
      }

      mfrc522.PICC_HaltA();
      mfrc522.PCD_StopCrypto1();
  }

  // 3. LIMPIAR LCD TRAS 30 SEGUNDOS
  if (lcdActive && (millis() - lastLcdUpdate > 30000)) {
    lcd.clear();
    lcdActive = false; 
  }

  // 4. LECTURA PERIODICA DE SENSORES
  if (millis() - lastSensorUpdate > sensorInterval) {
      Serial.println("⏰ Tarea periódica: Enviando datos de sensores...");
      
      float h = dht.readHumidity();
      float t = dht.readTemperature();
      int l = digitalRead(LDRPIN);
      bool luz = !(l == HIGH); // true si hay luz (ajustar según tu pullup/down)

      // Enviamos datos (uid, token, pin vacíos)
      enviarDatosAPI(t, h, luz, "", "", "", ""); 
      
      lastSensorUpdate = millis();
  }
}
