package com.example.demo;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface SesionTrabajoRepository extends MongoRepository<SesionTrabajo, String> {
    List<SesionTrabajo> findByUsuario(String usuario);
    List<SesionTrabajo> findByUsuarioAndInicioBetween(String usuario, LocalDateTime inicio, LocalDateTime fin);
}
