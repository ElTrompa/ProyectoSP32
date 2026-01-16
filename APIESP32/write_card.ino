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
  // 1. ESCRIBIR USUARIO EN BLOQUE 17
  // ==========================================
  byte blockUser = 17;
  status = mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, blockUser, &key, &(mfrc522.uid));
  if (status != MFRC522::STATUS_OK) {
    Serial.println(F("Error Auth Bloque 17"));
    return;
  }
  
  byte userBlock[16];
  for(int i=0; i<16; i++) userBlock[i] = 0;
  String usuario = "Borja";
  for(int i=0; i<usuario.length(); i++) userBlock[i] = usuario[i];
  
  status = mfrc522.MIFARE_Write(blockUser, userBlock, 16);
  if (status == MFRC522::STATUS_OK) Serial.println(F("✅ Usuario 'Borja' escrito en Bloque 17"));

  // ==========================================
  // 2. ESCRIBIR TOKEN DE SEGURIDAD EN BLOQUE 18
  // ==========================================
  // Token: "SECURE-TK-00123"
  byte blockToken = 18;
  
  status = mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, blockToken, &key, &(mfrc522.uid));
  if (status != MFRC522::STATUS_OK) {
    Serial.println(F("Error Auth Bloque 18"));
    return;
  }

  byte tokenBlock[16];
  for(int i=0; i<16; i++) tokenBlock[i] = 0;
  String token = "SECURE-TK-00123"; 
  for(int i=0; i<token.length() && i<16; i++) tokenBlock[i] = token[i];

  status = mfrc522.MIFARE_Write(blockToken, tokenBlock, 16);
  if (status == MFRC522::STATUS_OK) Serial.println(F("✅ Token 'SECURE-TK-00123' escrito en Bloque 18"));
  
  Serial.println(F("---------------------------------------------"));
  Serial.println(F("🎉 TARJETA ACTUALIZADA (User:17, Token:18) 🎉"));

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  
  delay(2000);
}
