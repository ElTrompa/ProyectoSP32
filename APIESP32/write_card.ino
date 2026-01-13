#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN   21
#define RST_PIN  22

MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  SPI.begin(18, 19, 23, SS_PIN);
  mfrc522.PCD_Init();
  Serial.println("==========================================");
  Serial.println("ESCRITOR DE CREDECIALES RFID");
  Serial.println("Acerca la tarjeta para escribir: 'Borja 123456789'");
  Serial.println("==========================================");
}

void loop() {
  if ( ! mfrc522.PICC_IsNewCardPresent()) return;
  if ( ! mfrc522.PICC_ReadCardSerial()) return;

  Serial.println("Tarjeta detectada...");
  
  MFRC522::MIFARE_Key key;
  for (byte i = 0; i < 6; i++) key.keyByte[i] = 0xFF; // Clave por defecto

  MFRC522::StatusCode status;

  // ==========================================
  // 1. ESCRIBIR USUARIO EN BLOQUE 16
  // ==========================================
  byte blockUser = 16;
  
  // Autenticar Bloque 16
  status = mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, blockUser, &key, &(mfrc522.uid));
  if (status != MFRC522::STATUS_OK) {
    Serial.print(F("Error Auth Bloque 16: "));
    Serial.println(mfrc522.GetStatusCodeName(status));
    return;
  }

  // PREPARAR USUARIO: "Borja"
  byte userBlock[16];
  for(int i=0; i<16; i++) userBlock[i] = 0; // Limpiar buffer
  String usuario = "Borja";
  for(int i=0; i<usuario.length(); i++) userBlock[i] = usuario[i];

  // Escribir Bloque 16
  status = mfrc522.MIFARE_Write(blockUser, userBlock, 16);
  if (status != MFRC522::STATUS_OK) {
    Serial.print(F("Fallo escritura Usuario: "));
    Serial.println(mfrc522.GetStatusCodeName(status));
    return;
  }
  Serial.println(F("✅ Usuario 'Borja' escrito en Bloque 16"));

  // ==========================================
  // 2. ESCRIBIR PASSWORD EN BLOQUE 17
  // ==========================================
  byte blockPass = 17;
  
  // Autenticar Bloque 17
  status = mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, blockPass, &key, &(mfrc522.uid));
  if (status != MFRC522::STATUS_OK) {
    Serial.print(F("Error Auth Bloque 17: "));
    Serial.println(mfrc522.GetStatusCodeName(status));
    return;
  }

  // PREPARAR PASSWORD: "123456789"
  byte passBlock[16];
  for(int i=0; i<16; i++) passBlock[i] = 0; // Limpiar buffer
  String password = "123456789";
  for(int i=0; i<password.length(); i++) passBlock[i] = password[i];

  // Escribir Bloque 17
  status = mfrc522.MIFARE_Write(blockPass, passBlock, 16);
  if (status != MFRC522::STATUS_OK) {
    Serial.print(F("Fallo escritura Password: "));
    Serial.println(mfrc522.GetStatusCodeName(status));
    return;
  }
  Serial.println(F("✅ Password '123456789' escrito en Bloque 17"));
  
  Serial.println(F("---------------------------------------------"));
  Serial.println(F("🎉 TARJETA PREPARADA CORRECTAMENTE 🎉"));

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  
  delay(2000);
}
