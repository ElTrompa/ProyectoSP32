package com.example.demo;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class Apiesp32Application {

	public static void main(String[] args) {
		SpringApplication.run(Apiesp32Application.class, args);
	}

	@Bean
	CommandLineRunner init(UsuarioRepository usuarioRepository) {
		return args -> {
			if (!usuarioRepository.existsByUsername("Borja")) {
				Usuario admin = new Usuario("Borja", "123456789");
				usuarioRepository.save(admin);
				System.out.println("👤 Usuario predeterminado 'Borja' creado en MongoDB con contraseña '123456789'");
			} else {
				System.out.println("✅ El usuario 'Borja' ya existe en la base de datos.");
			}
		};
	}
}
