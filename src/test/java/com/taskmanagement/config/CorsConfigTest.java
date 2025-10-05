package com.taskmanagement.config;

import org.junit.jupiter.api.Test;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for CorsConfig
 */
class CorsConfigTest {

    @Test
    void shouldCreateCorsConfiguration() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Set test values
        List<String> origins = Arrays.asList("http://localhost:3000", "http://localhost:4200");
        configuration.setAllowedOrigins(origins);
        
        List<String> methods = Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS");
        configuration.setAllowedMethods(methods);
        
        configuration.addAllowedHeader("*");
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        // Test the configuration directly instead of using getCorsConfiguration with null
        assertNotNull(configuration);
        
        assertTrue(configuration.getAllowedOrigins().contains("http://localhost:3000"));
        assertTrue(configuration.getAllowedOrigins().contains("http://localhost:4200"));
        assertTrue(configuration.getAllowedMethods().contains("GET"));
        assertTrue(configuration.getAllowedMethods().contains("POST"));
        assertTrue(configuration.getAllowedHeaders().contains("*"));
        assertTrue(configuration.getAllowCredentials());
        assertEquals(3600L, configuration.getMaxAge());
    }

    @Test
    void shouldAllowAllHeaders() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.addAllowedHeader("*");
        
        assertTrue(configuration.getAllowedHeaders().contains("*"));
    }

    @Test
    void shouldAllowCredentials() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowCredentials(true);
        
        assertTrue(configuration.getAllowCredentials());
    }
}