package com.example.demo;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "rfid_logs")
public class TarjetaRFID {
    @Id
    private String id;
    
    private String uid;
    private LocalDateTime fecha;

    public TarjetaRFID() {
        this.fecha = LocalDateTime.now();
    }

    public TarjetaRFID(String uid) {
        this.uid = uid;
        this.fecha = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUid() {
        return uid;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }
}
