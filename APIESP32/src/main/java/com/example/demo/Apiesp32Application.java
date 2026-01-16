package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

@SpringBootApplication
public class Apiesp32Application {

	public static void main(String[] args) {
		SpringApplication.run(Apiesp32Application.class, args);
	}

	@EventListener(ApplicationReadyEvent.class)
	public void cuandoEsteLista() {
		System.out.println("✅ Aplicación ESP32 iniciada correctamente");
		System.out.println("📊 Base de datos MongoDB configurada con persistencia");
		System.out.println("🌐 API disponible en: http://localhost:8080/api/datos");
	}
}
