# SP32 - Sistema Integral de Control de Presencia y Monitoreo IoT

## 🎯 Resumen del Proyecto (Contexto)
**Problema:** Las empresas necesitan sistemas de control de horarios y monitoreo ambiental que sean accesibles, modernos y permitan el teletrabajo.
**Solución:** SP32 integra un terminal físico de bajo coste (ESP32) con una App móvil multiplataforma, centralizando fichajes presenciales, remotos y datos de sensores en tiempo real.
**Valor Añadido:**
1. Hibridez: Fichaje físico (RFID) y remoto (App).
2. Seguridad: Doble factor (Tarjeta + PIN) en físico.
3. Monitoreo: Temperatura, Humedad y Luz para bienestar laboral.

---

## 📱 1. Aplicación Móvil (React Native / Expo)

La aplicación actúa como la interfaz principal para los usuarios (trabajadores y administradores), permitiendo la interacción con el sistema sin necesidad de estar físicamente en la terminal de acceso.

### 🌟 Funcionalidades Principales

#### **A. Perfil del Trabajador (`TrabajadorScreen`)**
Diseñado para la movilidad y el teletrabajo.
*   **Fichaje Remoto:** Registro de eventos directamente desde el móvil.
    *   Botón **ENTRADA**: Inicia la jornada laboral.
    *   Botón **SALIDA**: Finaliza la jornada.
    *   Gestión de **PAUSAS**: Café, descanso, fumar.
    *   Gestión de **SALIDAS MÉDICAS**: Registro específico para justificaciones.
*   **Feedback Visual:**
    *   Tarjeta de estado ( Verde: En Jornada / Gris: Fuera / Amarillo: En Pausa).
    *   Contador de horas trabajadas (Diario, Semanal, Mensual).
*   **Historial de Fichajes:** Lista detallada de todas las acciones realizadas, filtrable por fechas.

#### **B. Panel de Sensores Ambientales (`SensorScreen` & `LuzScreen`)**
Visualización de los datos recolectados por el hardware SP32.
*   **Termómetro & Higrómetro Digital:** Muestra Temperatura (ºC) y Humedad (%) actuales.
*   **Monitor de Iluminación:** Indica el nivel de luz en Lux.
*   **Alertas Automáticas:** La interfaz cambia de color o muestra avisos si la temperatura supera los 30ºC o la humedad el 80%.

#### **C. Seguridad y Administración (`LoginScreen` & `RFIDScreen`)**
*   **Login Seguro:** Acceso diferenciado por roles (Admin/User).
*   **Log de Auditoría RFID:** El administrador puede ver el registro "crudo" de todas las tarjetas escaneadas en el torno de acceso físico (UID, fecha y hora).

#### **D. Modo Desarrollo (Mock Mode)**
Para facilitar el desarrollo sin hardware conectado:
*   Archivo de configuración `config.js` con bandera `USE_MOCK = true`.
*   Simula respuestas de API y datos de sensores aleatorios para pruebas de UI.

---

## 🤖 2. Sistema Hardware (ESP32)

El "cerebro" físico del sistema es un microcontrolador ESP32 programado en C++ (Arduino Framework). Actúa como un torno de acceso inteligente y estación meteorológica.

### 🛠 Componentes y Conexiones
| Componente | Función | Pin ESP32 | Protocolo |
| :--- | :--- | :--- | :--- |
| **ESP32 DevKit V1** | Microcontrolador Principal | - | WiFi |
| **MFRC522** | Lector de tarjetas RFID/NFC | 18, 19, 23 (SPI) | SPI |
| **DHT11** | Sensor de Temperatura y Humedad | GPIO 4 | Digital (OneWire) |
| **LDR (Fotorresistencia)** | Sensor de Luz (Día/Noche) | GPIO 5 | Digital |
| **LCD 16x2 + I2C** | Pantalla de información al usuario | GPIO 14, 27 | I2C |
| **Keypad 4x4** | Teclado matricial para PIN y Motivo | Varios GPIOs | Digital |
| **Buzzer** | Feedback sonoro (Beeps) | GPIO 2 | PWM |

### 🧠 Lógica de Funcionamiento (Firmware)

El código del ESP32 (`esp32_sketch.ino`) ejecuta tres tareas principales:

1.  **Control de Acceso Físico (Bucle Principal):**
    *   Detecta una tarjeta RFID.
    *   Lee los sectores seguros de la tarjeta (Mifare Classic) para extraer el **Usuario** y el **Token**.
    *   Muestra el nombre del usuario en la pantalla LCD.
    *   Solicita el **Motivo** del fichaje vía teclado:
        *   `A`: Jornada
        *   `B`: Pausa
        *   `C`: Médico
        *   `D`: Consulta
    *   Solicita el **PIN de seguridad** vía teclado.
    *   Envía todo (Token + PIN + Motivo) al servidor.
    *   Si el servidor responde `200 OK`: Abre torno (pitido doble) y muestra "Hola [Usuario]".
    *   Si responde `403 Forbidden`: Deniega acceso (pitido largo).

2.  **Estación Meteorológica (Segundo plano - Cada 30s):**
    *   Lee automáticamente los valores del sensor DHT11 y LDR.
    *   Envía un reporte silencioso a la API con la temperatura, humedad y estado de luz actuales.

3.  **Servidor Web Integrado:**
    *   El ESP32 levanta un servidor web en el puerto 80.
    *   Al recibir una petición GET en su IP, devuelve un JSON instantáneo con el estado de los sensores.

---

## 📡 3. Especificación de la API

La comunicación entre el ESP32, la App y el Backend se realiza mediante peticiones HTTP REST.

### Configuración
*   **Base URL:** Definida en `config.js` (`API_URL`) y en el sketch (`serverName`).

### Endpoints Principales

#### `POST /api/datos` (Recepción de Datos)
Este es el endpoint único que recibe toda la información del ESP32. El JSON varía según el evento:

**Caso 1: Fichaje (Acceso)**
```json
{
  "token": "A1B2C3D4...",  // Token leído de la tarjeta RFID
  "pin": "1234",           // PIN introducido en el teclado
  "tipo": "ENTRADA"        // Motivo seleccionado (JORNADA, PAUSA...)
}
```

**Caso 2: Monitoreo Ambiental (Automático)**
```json
{
  "temperatura": 24.5,
  "humedad": 60.0,
  "luz": true,             // true = hay luz, false = oscuro
  "rfidUid": ""            // Vacío
}
```

#### `GET /api/datos` (Lectura para la App)
La aplicación móvil consume este endpoint para mostrar los gráficos y listas.
*   Respuesta: Objeto JSON con arrays de `presencia`, `luz`, `meteorologia`, `rfid`.

---

## 🚀 Guía de Puesta en Marcha

### Requisitos Previos
1.  **Node.js** instalado en tu PC.
2.  **Arduino IDE** configurado con las librerías `MFRC522`, `DHT sensor library`, `Keypad`, `LiquidCrystal_PCF8574` y `ArduinoJson`.

### Pasos
1.  **Backend:** Asegúrate de que tu servidor Java/SpringBoot esté corriendo en el puerto 8080.
2.  **Hardware:**
    *   Conecta el ESP32 a la corriente.
    *   Verifica en el Monitor Serie que se conecta al WiFi ("Conectado con IP...").
3.  **App Móvil:**
    *   Abre este proyecto en VS Code.
    *   Ejecuta `npm install`.
    *   Ejecuta `npm start` y escanea el QR con tu móvil (Expo Go).

### Credenciales Mock (Pruebas)
Si no tienes el backend levantado, usa estos datos en la app:
*   **Admin:** Usuario: `admin` (Sin contraseña).
*   **Trabajador:** Usuario: `juan_perez` (Se autologuea).

---

## 📂 Estructura de Archivos (Para Demostración)
```bash
/
├── assets/                 # Recursos visuales (iconos, splash)
├── screens/                # Vistas de la App
│   ├── LoginScreen.jsx     # Autenticación segura (Roles)
│   ├── TrabajadorScreen.jsx# UI para fichar, pausas y estadísticas
│   ├── SensorScreen.jsx    # UI de datos ambientales (DHT11/LDR)
│   ├── LuzScreen.jsx       # UI específica de luminosidad
│   └── RFIDScreen.jsx      # Panel Admin de logs de tarjetas
├── config.js               # Configuración global (API URL, Flags)
└── App.jsx                 # Rutas, Navegación y Temas
```

---

## 🚀 Posibles Mejoras (Futuro)
*   **Biometría:** Sustituir PIN por sensor de huella dactilar.
*   **Notificaciones Push:** Avisar al móvil si la temperatura sube de 35ºC.
*   **Geolocalización:** Verificar ubicación GPS al fichar desde la App.
*   **Dashboard Web:** Panel de administración avanzado en React/Vue.
