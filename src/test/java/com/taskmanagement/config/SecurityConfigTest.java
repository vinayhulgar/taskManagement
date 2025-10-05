package com.taskmanagement.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for SecurityConfig components
 */
class SecurityConfigTest {

    @Test
    void shouldCreatePasswordEncoder() {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);
        
        assertNotNull(passwordEncoder);
        
        String rawPassword = "testPassword123";
        String encodedPassword = passwordEncoder.encode(rawPassword);
        
        assertNotNull(encodedPassword);
        assertNotEquals(rawPassword, encodedPassword);
        assertTrue(passwordEncoder.matches(rawPassword, encodedPassword));
    }

    @Test
    void shouldNotMatchWrongPassword() {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);
        
        String rawPassword = "testPassword123";
        String wrongPassword = "wrongPassword";
        String encodedPassword = passwordEncoder.encode(rawPassword);
        
        assertFalse(passwordEncoder.matches(wrongPassword, encodedPassword));
    }

    @Test
    void shouldGenerateDifferentHashesForSamePassword() {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);
        
        String rawPassword = "testPassword123";
        String hash1 = passwordEncoder.encode(rawPassword);
        String hash2 = passwordEncoder.encode(rawPassword);
        
        assertNotEquals(hash1, hash2);
        assertTrue(passwordEncoder.matches(rawPassword, hash1));
        assertTrue(passwordEncoder.matches(rawPassword, hash2));
    }
}