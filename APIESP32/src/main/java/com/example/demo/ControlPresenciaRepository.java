package com.example.demo;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface ControlPresenciaRepository extends MongoRepository<ControlPresencia, String> {
    List<ControlPresencia> findByUsuario(String usuario);
    Optional<ControlPresencia> findTopByUsuarioOrderByFechaHoraDesc(String usuario);
}
