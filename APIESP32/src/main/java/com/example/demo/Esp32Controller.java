package com.example.demo;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Optional;

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

    @Autowired
    private ControlPresenciaRepository controlPresenciaRepository;

    // --- ENDPOINTS GET DE CONSULTA ---

    // 1. Obtener TODOS los datos agrupados
    @GetMapping("/datos")
    public ResponseEntity<Map<String, Object>> obtenerTodosLosDatos() {
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("meteorologia", metereologiaRepository.findAll());
        respuesta.put("luz", luzRepository.findAll());
        respuesta.put("rfid", tarjetaRFIDRepository.findAll());
        respuesta.put("usuarios", usuarioRepository.findAll());
        respuesta.put("presencia", controlPresenciaRepository.findAll());
        return ResponseEntity.ok(respuesta);
    }

    // 1.1 Obtener Control de Presencia (NUEVO)
    @GetMapping("/control-presencia")
    public ResponseEntity<List<ControlPresencia>> obtenerControlPresencia() {
        return ResponseEntity.ok(controlPresenciaRepository.findAll());
    }

    // 2. Obtener solo Meteorología (Solo el más reciente)
    @GetMapping("/datos/meteorologia")
    public ResponseEntity<List<Metereologia>> obtenerDatosMetereologia() {
        return ResponseEntity.ok(metereologiaRepository.findTop1ByOrderByFechaDesc());
    }

    // 3. Obtener solo Luz
    @GetMapping("/datos/luz")
    public ResponseEntity<List<Luz>> obtenerDatosLuz() {
        return ResponseEntity.ok(luzRepository.findAll());
    }

    // 4. Obtener solo Accesos RFID
    @GetMapping("/datos/rfid")
    public ResponseEntity<List<TarjetaRFID>> obtenerDatosRFID() {
        return ResponseEntity.ok(tarjetaRFIDRepository.findAll());
    }

    // 5. Obtener solo Presencia
    @GetMapping("/datos/presencia")
    public ResponseEntity<List<ControlPresencia>> obtenerDatosPresencia() {
        return ResponseEntity.ok(controlPresenciaRepository.findAll());
    }

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
        
        // --- 1. LOGIN CON TOKEN + PIN (SEGURIDAD ALTA) RECOMENDADO ---
        if (datos.getToken() != null && !datos.getToken().isEmpty()) {
             System.out.println(">>> LOGIN POR TOKEN: " + datos.getToken());
             
             Optional<Usuario> usuarioOpt = usuarioRepository.findByRfidToken(datos.getToken());
             
             if (usuarioOpt.isPresent()) {
                 Usuario u = usuarioOpt.get();
                 boolean pinCorrecto = true;
                 String metodo = "TOKEN";

                 // Si viene PIN en la petición, lo verificamos usando la PASSWORD
                 if (datos.getPin() != null && !datos.getPin().isEmpty()) {
                     metodo = "TOKEN+PIN";
                     System.out.println("🔍 Verificando PIN usando Password. Recibido: ['" + datos.getPin() + "']");
                     
                     if (u.getPassword() == null || !u.getPassword().equals(datos.getPin())) {
                          pinCorrecto = false;
                     }
                 }

                 if (pinCorrecto) {
                    System.out.println("✅ ACCESO CONCEDIDO A: " + u.getUsername());
                    
                    // Lógica de Fichaje (Entrada/Salida) automatico
                    String tipoMovimiento = "ENTRADA";
                    Optional<ControlPresencia> ultimoRegistro = controlPresenciaRepository.findTopByUsuarioOrderByFechaHoraDesc(u.getUsername());
                    
                    if (ultimoRegistro.isPresent()) {
                        String ultimoTipo = ultimoRegistro.get().getTipo();
                        if ("ENTRADA".equals(ultimoTipo) && ultimoRegistro.get().isAccesoPermitido()) {
                            tipoMovimiento = "SALIDA";
                        }
                    }

                    controlPresenciaRepository.save(new ControlPresencia(u.getUsername(), LocalDateTime.now(), metodo, tipoMovimiento, true, "Acceso Correcto"));
                    return ResponseEntity.ok(tipoMovimiento + ": " + u.getUsername());
                 } else {
                    System.out.println("❌ PIN INCORRECTO PARA: " + u.getUsername());
                    controlPresenciaRepository.save(new ControlPresencia(u.getUsername(), LocalDateTime.now(), metodo, "INTENTO", false, "PIN Incorrecto"));
                    return ResponseEntity.status(401).body("PIN INCORRECTO");
                 }
             } else {
                 System.out.println("❌ TOKEN IVÁLIDO");
                 // Registrar intento fallido desconocido
                 controlPresenciaRepository.save(new ControlPresencia("DESCONOCIDO", LocalDateTime.now(), "TOKEN", "INTENTO", false, "Token no registrado: " + datos.getToken()));
                 return ResponseEntity.status(401).body("TOKEN NO RECONOCIDO");
             }
        }

        // --- 2. LOGIN LEGACY (USUARIO/PASS) ---
        if (datos.getUsuario() != null && datos.getPassword() != null) {
            System.out.println(">>> INTENTO DE LOGIN LEGACY: Usuario=" + datos.getUsuario());
            // ... (logica anterior) ...
            boolean accesoValido = usuarioRepository.findByUsernameAndPassword(datos.getUsuario(), datos.getPassword()).isPresent();

            if (accesoValido) {
                System.out.println("✅ ACCESO CONCEDIDO PARA: " + datos.getUsuario());
                return ResponseEntity.ok("LOGIN CORRECTO"); 
            } else {
                System.out.println("❌ ACCESO DENEGADO");
                return ResponseEntity.status(401).body("LOGIN FALLIDO");
            }
        }

        // --- 3. DETECCIÓN DE TARJETA SIN TOKEN (UID) ---
        if (datos.getRfidUid() != null && !datos.getRfidUid().isEmpty()) {
            System.out.println("💳 TARJETA DETECTADA - UID: [" + datos.getRfidUid() + "]");
            TarjetaRFID rfid = new TarjetaRFID(datos.getRfidUid());
            tarjetaRFIDRepository.save(rfid);
            // Mensaje especial si no es login
            return ResponseEntity.ok("UID Registrado: " + datos.getRfidUid());
        }

        System.out.println(">>> DATO SENSOR RECIBIDO: Temp=" + datos.getTemperatura() + " Hum=" + datos.getHumedad() + " Luz=" + datos.getLuz());

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

        return ResponseEntity.ok("Datos recibidos correctamente");
    }
}
