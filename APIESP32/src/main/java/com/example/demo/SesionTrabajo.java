package com.example.demo;

import java.time.LocalDateTime;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "sesiones_trabajo")
public class SesionTrabajo {
    @Id
    private String id;
    
    private String usuario;
    private LocalDateTime inicio;
    private LocalDateTime fin;
    private long duracionMinutos;

    public SesionTrabajo() {}

    public SesionTrabajo(String usuario, LocalDateTime inicio, LocalDateTime fin, long duracionMinutos) {
        this.usuario = usuario;
        this.inicio = inicio;
        this.fin = fin;
        this.duracionMinutos = duracionMinutos;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }
    public LocalDateTime getInicio() { return inicio; }
    public void setInicio(LocalDateTime inicio) { this.inicio = inicio; }
    public LocalDateTime getFin() { return fin; }
    public void setFin(LocalDateTime fin) { this.fin = fin; }
    public long getDuracionMinutos() { return duracionMinutos; }
    public void setDuracionMinutos(long duracionMinutos) { this.duracionMinutos = duracionMinutos; }
}
