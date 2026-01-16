package com.example.demo;

import java.time.LocalDateTime;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "control_presencia")
public class ControlPresencia {
    @Id
    private String id;
    
    private String usuario; // Username
    private LocalDateTime fechaHora;
    private String metodoAuth; // "TOKEN", "PIN", "TOKEN+PIN"
    private String tipo; // "ENTRADA", "SALIDA"
    private boolean accesoPermitido;
    private String detalles;

    public ControlPresencia() {}

    public ControlPresencia(String usuario, LocalDateTime fechaHora, String metodoAuth, String tipo, boolean accesoPermitido, String detalles) {
        this.usuario = usuario;
        this.fechaHora = fechaHora;
        this.metodoAuth = metodoAuth;
        this.tipo = tipo;
        this.accesoPermitido = accesoPermitido;
        this.detalles = detalles;
    }

    // Getters y Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }
    public LocalDateTime getFechaHora() { return fechaHora; }
    public void setFechaHora(LocalDateTime fechaHora) { this.fechaHora = fechaHora; }
    public String getMetodoAuth() { return metodoAuth; }
    public void setMetodoAuth(String metodoAuth) { this.metodoAuth = metodoAuth; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public boolean isAccesoPermitido() { return accesoPermitido; }
    public void setAccesoPermitido(boolean accesoPermitido) { this.accesoPermitido = accesoPermitido; }
    public String getDetalles() { return detalles; }
    public void setDetalles(String detalles) { this.detalles = detalles; }
}
