# Proyecto ESP32 - Sistema de Monitoreo IoT

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.0-green.svg)](https://spring.io/projects/spring-boot)
[![ESP32](https://img.shields.io/badge/ESP32-Microcontroller-blue.svg)](https://www.espressif.com/en/products/socs/esp32)
[![Arduino](https://img.shields.io/badge/Arduino-IDE-blue.svg)](https://www.arduino.cc/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0.31-black.svg)](https://expo.dev/)

Un sistema completo de monitoreo IoT que integra sensores conectados a un ESP32, una API REST desarrollada con Spring Boot y una aplicación móvil construida con React Native y Expo.

## 🚀 Características

### Sensores Integrados
- **Temperatura y Humedad**: Monitoreo ambiental en tiempo real
- **Luz**: Detección de niveles de iluminación
- **RFID**: Sistema de identificación y control de acceso

### Tecnologías Utilizadas
- **Backend**: Spring Boot para la API REST
- **Hardware**: ESP32 como controlador principal
- **Desarrollo**: Arduino IDE para programación del microcontrolador
- **Frontend Móvil**: React Native con Expo para la aplicación móvil

## 📋 Requisitos del Sistema

- Java 17 o superior
- Node.js 18 o superior
- Arduino IDE
- ESP32 DevKit
- MongoDB (para persistencia de datos)

## 🛠️ Instalación y Configuración

### 1. Clonación del Repositorio
```bash
git clone https://github.com/tu-usuario/ProyectoESP32.git
cd ProyectoESP32
```

### 2. Configuración de la API (Spring Boot)
```bash
cd APIESP32
./mvnw clean install
./mvnw spring-boot:run
```

### 3. Configuración de la Aplicación Móvil
```bash
cd App
npm install
npx expo start
```

### 4. Programación del ESP32
- Abre los archivos `.ino` en Arduino IDE
- Configura el puerto COM correspondiente
- Carga el código al ESP32

## 📱 Uso de la Aplicación

1. Inicia la API Spring Boot
2. Ejecuta la aplicación móvil con Expo
3. Escanea el código QR con la app Expo Go o un emulador
4. Navega entre las secciones para visualizar datos de sensores

## 👥 Integrantes del Equipo

- **ElTaquero** - Desarrollo Backend
- **Trompa** - Desarrollo Hardware
- **Boacamo** - Desarrollo Frontend

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue para discutir cambios mayores antes de enviar un pull request.
