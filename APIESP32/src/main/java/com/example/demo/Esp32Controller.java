package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class Esp32Controller {

    @Autowired
    private MetereologiaRepository metereologiaRepository;

    @Autowired
    private LuzRepository luzRepository;

    @Autowired
    private TarjetaRFIDRepository tarjetaRFIDRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Endpoint para registrar nuevos usuarios dinámicamente
    @PostMapping("/usuarios/registrar")
    public ResponseEntity<String> registrarUsuario(@RequestBody Usuario nuevoUsuario) {
        if (usuarioRepository.existsByUsername(nuevoUsuario.getUsername())) {
             return ResponseEntity.badRequest().body("Error: El usuario '" + nuevoUsuario.getUsername() + "' ya existe.");
        }
        usuarioRepository.save(nuevoUsuario);
        return ResponseEntity.ok("Usuario '" + nuevoUsuario.getUsername() + "' registrado correctamente.");
    }

    @PostMapping("/datos")
    public ResponseEntity<String> recibirDatos(@RequestBody DatosSensorDTO datos) {
        
        // --- LOGICA DE LOGIN CON MONGODB ---
        if (datos.getUsuario() != null && datos.getPassword() != null) {
            System.out.println(">>> INTENTO DE LOGIN: Usuario=" + datos.getUsuario());
            
            boolean accesoValido = usuarioRepository.findByUsernameAndPassword(datos.getUsuario(), datos.getPassword()).isPresent();

            if (accesoValido) {
                System.out.println("✅ ACCESO CONCEDIDO PARA: " + datos.getUsuario());
                return ResponseEntity.ok("LOGIN CORRECTO"); 
            } else {
                System.out.println("❌ ACCESO DENEGADO");
                return ResponseEntity.status(401).body("LOGIN FALLIDO");
            }
        }

        System.out.println(">>> DATO RECIBIDO: Temp=" + datos.getTemperatura() + " Hum=" + datos.getHumedad() + " Luz=" + datos.getLuz() + " UID=" + datos.getRfidUid());

        // Guardar Datos Meteorológicos

        if (datos.getTemperatura() != null && datos.getHumedad() != null) {
            Metereologia metereologia = new Metereologia(datos.getTemperatura(), datos.getHumedad());
            metereologiaRepository.save(metereologia);
        }

        // Guardar Datos de Luz
        if (datos.getLuz() != null) {
            // Asumiendo que el dato 'luz' es booleano indicando si está "iluminado"
            Luz luz = new Luz(datos.getLuz());
            luzRepository.save(luz);
        }

        // Guardar Datos RFID (si se detecta tarjeta)
        if (datos.getRfidUid() != null && !datos.getRfidUid().isEmpty()) {
            TarjetaRFID rfid = new TarjetaRFID(datos.getRfidUid());
            tarjetaRFIDRepository.save(rfid);
        }

        return ResponseEntity.ok("Datos recibidos correctamente");
    }
}
