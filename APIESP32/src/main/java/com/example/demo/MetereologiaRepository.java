package com.example.demo;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MetereologiaRepository extends MongoRepository<Metereologia, String> {
    // Obtener el registro más reciente (devuelve lista de 1 elemento para mantener compatibilidad)
    List<Metereologia> findTop1ByOrderByFechaDesc();
}
