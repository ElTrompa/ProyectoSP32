package com.example.demo;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Optional;

import java.time.temporal.ChronoUnit;
import org.springframework.web.bind.annotation.RequestParam;

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

    @Autowired
    private SesionTrabajoRepository sesionTrabajoRepository;

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
        return ResponseEntity.ok(luzRepository.findTop1ByOrderByFechaDesc());
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

    // 6. Obtener historial de un usuario específico (Para calcular horas en
    // Frontend)
    @GetMapping("/control-presencia/usuario/{username}")
    public ResponseEntity<List<ControlPresencia>> obtenerHistorialUsuario(@PathVariable String username) {
        return ResponseEntity.ok(controlPresenciaRepository.findByUsuario(username));
    }

    // 7. Obtener Sesiones Consolidadas (Jornadas completas) con filtro opcional
    // Uso: /api/sesiones/usuario/Borja?dias=7 (Última semana)
    // Uso: /api/sesiones/usuario/Borja?dias=30 (Último mes)
    @GetMapping("/sesiones/usuario/{username}")
    public ResponseEntity<List<SesionTrabajo>> obtenerSesionesUsuario(
            @PathVariable String username,
            @RequestParam(required = false) Integer dias) {

        if (dias != null) {
            LocalDateTime fechaInicio = LocalDateTime.now().minusDays(dias);
            LocalDateTime fechaFin = LocalDateTime.now();
            return ResponseEntity
                    .ok(sesionTrabajoRepository.findByUsuarioAndInicioBetween(username, fechaInicio, fechaFin));
        }

        return ResponseEntity.ok(sesionTrabajoRepository.findByUsuario(username));
    }

    // Endpoint para registrar nuevos usuarios dinámicamente
    @PostMapping("/usuarios/registrar")
    public ResponseEntity<String> registrarUsuario(@RequestBody Usuario nuevoUsuario) {
        if (usuarioRepository.existsByUsername(nuevoUsuario.getUsername())) {
            return ResponseEntity.badRequest()
                    .body("Error: El usuario '" + nuevoUsuario.getUsername() + "' ya existe.");
        }
        usuarioRepository.save(nuevoUsuario);
        return ResponseEntity.ok("Usuario '" + nuevoUsuario.getUsername() + "' registrado correctamente.");
    }

    // Endpoint de Mantenimiento: Llama aquí para que los usuarios viejos tengan los
    // campos nuevos en la BD
    @GetMapping("/usuarios/actualizar-esquema")
    public ResponseEntity<String> actualizarEsquemaUsuarios() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        // Al leerlos, Java les asigna los valores por defecto (rol="trabajador")
        // Al guardarlos de nuevo, se escriben físicamente en MongoDB
        usuarioRepository.saveAll(usuarios);
        return ResponseEntity
                .ok("Base de datos actualizada. Se han migrado " + usuarios.size() + " usuarios al nuevo formato.");
    }

    @PutMapping("/usuarios/{id}")
    public ResponseEntity<?> actualizarUsuario(@PathVariable String id, @RequestBody Usuario usuarioDetails) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findById(id);

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();

            // Actualizar campos básicos
            usuario.setUsername(usuarioDetails.getUsername());
            usuario.setRfidToken(usuarioDetails.getRfidToken());
            usuario.setRol(usuarioDetails.getRol());
            usuario.setAdmin(usuarioDetails.isAdmin());
            usuario.setHorario(usuarioDetails.getHorario());

            // Solo actualizar contraseña si viene con datos
            if (usuarioDetails.getPassword() != null && !usuarioDetails.getPassword().isEmpty()) {
                usuario.setPassword(usuarioDetails.getPassword());
            }

            usuarioRepository.save(usuario);
            return ResponseEntity.ok("Usuario actualizado correctamente");
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/presencia/manual")
    public ResponseEntity<String> registrarPresenciaManual(@RequestBody Map<String, String> payload) {
        String username = payload.get("usuario");
        String tipo = payload.get("tipo");
        String ubicacion = payload.getOrDefault("ubicacion", "APP");

        if (username == null || tipo == null) {
            return ResponseEntity.badRequest().body("Faltan datos (usuario, tipo)");
        }

        // Verificar usuario
        if (!usuarioRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body("Usuario no encontrado");
        }

        // Lógica de sesión si es SALIDA
        if ("SALIDA".equals(tipo) || "INICIO_PAUSA".equals(tipo)) {
            Optional<ControlPresencia> ultimoRegistro = controlPresenciaRepository
                    .findTopByUsuarioOrderByFechaHoraDesc(username);
            if (ultimoRegistro.isPresent() && "ENTRADA".equals(ultimoRegistro.get().getTipo())) {
                try {
                    LocalDateTime entrada = ultimoRegistro.get().getFechaHora();
                    LocalDateTime salida = LocalDateTime.now();
                    long minutos = ChronoUnit.MINUTES.between(entrada, salida);

                    // Solo guardamos sesión si es SALIDA/FIN JORNADA o para contabilizar tramos
                    // (opcional simplificado)
                    if ("SALIDA".equals(tipo)) {
                        SesionTrabajo sesion = new SesionTrabajo(username, entrada, salida, minutos);
                        sesionTrabajoRepository.save(sesion);
                    }
                } catch (Exception e) {
                    System.err.println("Error cálculo sesión manual: " + e.getMessage());
                }
            }
        }

        ControlPresencia registro = new ControlPresencia(username, LocalDateTime.now(), "MANUAL_APP", tipo, true,
                "Registrado desde App (" + ubicacion + ")");
        controlPresenciaRepository.save(registro);

        return ResponseEntity.ok("Fichaje registrado: " + tipo);
    }

    @PostMapping("/datos")
    public ResponseEntity<Object> recibirDatos(@RequestBody DatosSensorDTO datos) {

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

                    // Lógica de Fichaje (Entrada/Salida) o Motivo Manual
                    String tipoMovimiento = "ENTRADA"; // Valor por defecto

                    // 1. Si viene un TIPO explícito, evaluamos lógica contextual
                    if (datos.getTipo() != null && !datos.getTipo().isEmpty()) {
                        String rawTipo = datos.getTipo();

                        // Lógica Contextual: Determinamos la acción real basada en el estado previo
                        Optional<ControlPresencia> ultimoRegistro = controlPresenciaRepository
                                .findTopByUsuarioOrderByFechaHoraDesc(u.getUsername());

                        boolean estabaDentro = false;
                        if (ultimoRegistro.isPresent()) {
                            String lastT = ultimoRegistro.get().getTipo();
                            // Consideramos "dentro" si lo último fue ENTRADA o FIN_PAUSA
                            // Consideramos "fuera" si fue SALIDA, INICIO_PAUSA, etc.
                            // Simplificación: Si el último es ENTRADA -> Está dentro.
                            if ("ENTRADA".equals(lastT) || "FIN_PAUSA".equals(lastT) || "VUELTA_MEDICO".equals(lastT)) {
                                estabaDentro = true;
                            }
                        }

                        // Mapeo de Intención (Arduino) a Acción Real (DB)
                        if ("PAUSA".equals(rawTipo)) {
                            tipoMovimiento = estabaDentro ? "INICIO_PAUSA" : "FIN_PAUSA";
                        } else if ("MEDICO".equals(rawTipo)) {
                            tipoMovimiento = estabaDentro ? "CONSULTA" : "VUELTA_MEDICO";
                            if ("VUELTA_MEDICO".equals(tipoMovimiento))
                                tipoMovimiento = "ENTRADA"; // Normalizamos a ENTRADA
                        } else {
                            // Si envían "ENTRADA", "SALIDA" explícitos (Arduino A/B o Mobile App)
                            // Se usan tal cual. 'A' -> "ENTRADA", 'B' -> "SALIDA"
                            tipoMovimiento = rawTipo;
                        }

                        // Si resulta ser una SALIDA (de cualquier tipo), calculamos sesión
                        if ("SALIDA".equals(tipoMovimiento) || "INICIO_PAUSA".equals(tipoMovimiento)
                                || "CONSULTA".equals(tipoMovimiento)) {
                            if (estabaDentro && ultimoRegistro.isPresent()) {
                                try {
                                    LocalDateTime entrada = ultimoRegistro.get().getFechaHora();
                                    LocalDateTime salida = LocalDateTime.now();
                                    long minutos = ChronoUnit.MINUTES.between(entrada, salida);

                                    // Solo registramos sesión de trabajo productivo en SALIDA o INICIO_PAUSA
                                    // (Si se va al médico, ¿cuenta como trabajo? Depende politica. Aquí asumimos
                                    // sesión cerrada).
                                    SesionTrabajo sesion = new SesionTrabajo(u.getUsername(), entrada, salida, minutos);
                                    sesionTrabajoRepository.save(sesion);
                                } catch (Exception e) {
                                    System.err.println("Error cálculo sesión sensor: " + e.getMessage());
                                }
                            }
                        }
                    } else {
                        // 2. Lógica AUTOMÁTICA (si no se envía tipo) -> Alternar Entrada/Salida
                        Optional<ControlPresencia> ultimoRegistro = controlPresenciaRepository
                                .findTopByUsuarioOrderByFechaHoraDesc(u.getUsername());

                        if (ultimoRegistro.isPresent()) {
                            String ultimoTipo = ultimoRegistro.get().getTipo();
                            if ("ENTRADA".equals(ultimoTipo) && ultimoRegistro.get().isAccesoPermitido()) {
                                tipoMovimiento = "SALIDA";

                                // --- CALCULO Y GUARDADO DE SESION DE TRABAJO ---
                                try {
                                    LocalDateTime entrada = ultimoRegistro.get().getFechaHora();
                                    LocalDateTime salida = LocalDateTime.now();
                                    long minutos = ChronoUnit.MINUTES.between(entrada, salida);

                                    SesionTrabajo sesion = new SesionTrabajo(u.getUsername(), entrada, salida, minutos);
                                    sesionTrabajoRepository.save(sesion);
                                    System.out
                                            .println("⏳ Sesión Guardada: " + minutos + " min para " + u.getUsername());
                                } catch (Exception e) {
                                    System.err.println("Error al calcular sesión: " + e.getMessage());
                                }
                            }
                        }
                    }

                    controlPresenciaRepository.save(new ControlPresencia(u.getUsername(), LocalDateTime.now(), metodo,
                            tipoMovimiento, true, "Acceso Correcto"));
                    return ResponseEntity.ok(tipoMovimiento + ": " + u.getUsername());
                } else {
                    System.out.println("❌ PIN INCORRECTO PARA: " + u.getUsername());
                    controlPresenciaRepository.save(new ControlPresencia(u.getUsername(), LocalDateTime.now(), metodo,
                            "INTENTO", false, "PIN Incorrecto"));
                    return ResponseEntity.status(401).body("PIN INCORRECTO");
                }
            } else {
                System.out.println("❌ TOKEN IVÁLIDO");
                // Registrar intento fallido desconocido
                controlPresenciaRepository.save(new ControlPresencia("DESCONOCIDO", LocalDateTime.now(), "TOKEN",
                        "INTENTO", false, "Token no registrado: " + datos.getToken()));
                return ResponseEntity.status(401).body("TOKEN NO RECONOCIDO");
            }
        }

        // --- 2. LOGIN LEGACY (USUARIO/PASS) ---
        if (datos.getUsuario() != null && datos.getPassword() != null) {
            System.out.println(">>> INTENTO DE LOGIN LEGACY: Usuario=" + datos.getUsuario());

            Optional<Usuario> usuarioLogueado = usuarioRepository.findByUsernameAndPassword(datos.getUsuario(),
                    datos.getPassword());

            if (usuarioLogueado.isPresent()) {
                System.out.println("✅ ACCESO CONCEDIDO PARA: " + datos.getUsuario());
                // Devolvemos el objeto Usuario completo (JSON) para que el Frontend vea rol e
                // isAdmin
                return ResponseEntity.ok(usuarioLogueado.get());
            } else {
                System.out.println("❌ ACCESO DENEGADO");
                // Devolvemos un objeto JSON de error para consistencia, o string si el frontend
                // lo prefiere así.
                // Mantendremos compatibilidad simple por ahora.
                Map<String, String> error = new HashMap<>();
                error.put("error", "LOGIN FALLIDO");
                return ResponseEntity.status(401).body(error);
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

        System.out.println(">>> DATO SENSOR RECIBIDO: Temp=" + datos.getTemperatura() + " Hum=" + datos.getHumedad()
                + " Luz=" + datos.getLuz());

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
