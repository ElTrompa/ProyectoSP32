package com.example.demo;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LuzRepository extends MongoRepository<Luz, String> {
    List<Luz> findTop1ByOrderByFechaDesc();
}
