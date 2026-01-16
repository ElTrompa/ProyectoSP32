#include "DHT.h"

// Configuración del pin y tipo de sensor
// Asegúrate de que estás usando el PIN 4 en tu ESP32, 
// o cambia este número si lo has conectado a otro sitio.
#define DHTPIN   4     
#define DHTTYPE  DHT11 

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  Serial.println(F("------------------------------------"));
  Serial.println(F("   INICIANDO PRUEBA DE DHT11       "));
  Serial.println(F("------------------------------------"));

  dht.begin();
}

void loop() {
  // Esperar 2 segundos entre medidas (el DHT11 es lento)
  delay(2000);

  // Leer humedad
  float h = dht.readHumidity();
  // Leer temperatura en Celsius
  float t = dht.readTemperature();

  // Comprobar si la lectura falló
  if (isnan(h) || isnan(t)) {
    Serial.println(F("❌ Error: No se puede leer del sensor DHT11."));
    Serial.println(F("   -> Revisa cables (VCC, GND, DATA)"));
    Serial.println(F("   -> Revisa si necesitas una resistencia pull-up (4.7k o 10k) entre VCC y DATA"));
    return;
  }

  Serial.print(F("Humedad: "));
  Serial.print(h);
  Serial.print(F("%  |  Temperatura: "));
  Serial.print(t);
  Serial.println(F("°C"));
}
