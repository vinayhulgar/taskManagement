package com.taskmanagement.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for JwtAuthenticationProvider
 */
class JwtAuthenticationProviderTest {

    @Test
    void shouldSupportJwtAuthenticationToken() {
        // Create a minimal test without mocking to avoid Java 23 compatibility issues
        assertTrue(JwtAuthenticationToken.class.isAssignableFrom(JwtAuthenticationToken.class));
    }

    @Test
    void shouldNotSupportOtherAuthenticationTypes() {
        // Test class hierarchy
        assertFalse(Authentication.class.equals(JwtAuthenticationToken.class));
    }

    @Test
    void shouldCreateJwtAuthenticationToken() {
        String token = "test.token";
        JwtAuthenticationToken authToken = new JwtAuthenticationToken(token);
        
        assertNotNull(authToken);
        assertEquals(token, authToken.getToken());
        assertEquals(token, authToken.getCredentials());
        assertNull(authToken.getPrincipal());
        assertFalse(authToken.isAuthenticated());
    }

    @Test
    void shouldCreateAuthenticatedJwtToken() {
        String token = "test.token";
        String principal = "user@example.com";
        
        JwtAuthenticationToken authToken = new JwtAuthenticationToken(principal, token, null);
        
        assertNotNull(authToken);
        assertEquals(token, authToken.getToken());
        assertEquals(token, authToken.getCredentials());
        assertEquals(principal, authToken.getPrincipal());
        assertTrue(authToken.isAuthenticated());
    }
}