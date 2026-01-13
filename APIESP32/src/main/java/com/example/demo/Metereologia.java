package com.example.demo;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "metereologia_logs")
public class Metereologia {
    @Id
    private String id;
    
    private double temperatura;
    private double humedad;
    private LocalDateTime fecha;

    public Metereologia() {
        this.fecha = LocalDateTime.now();
    }

    public Metereologia(double temperatura, double humedad) {
        this.temperatura = temperatura;
        this.humedad = humedad;
        this.fecha = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public double getTemperatura() {
        return temperatura;
    }

    public void setTemperatura(double temperatura) {
        this.temperatura = temperatura;
    }

    public double getHumedad() {
        return humedad;
    }

    public void setHumedad(double humedad) {
        this.humedad = humedad;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }
}
