package com.taskmanagement.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for JwtService
 */
class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        
        // Set test values using reflection
        ReflectionTestUtils.setField(jwtService, "secretKey", "myTestSecretKeyThatIsLongEnoughForHS256Algorithm");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 900000L); // 15 minutes
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", 604800000L); // 7 days
        
        userDetails = new User(
            "test@example.com",
            "password",
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_MEMBER"))
        );
    }

    @Test
    void shouldGenerateToken() {
        String token = jwtService.generateToken(userDetails);
        
        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertTrue(token.split("\\.").length == 3); // JWT has 3 parts
    }

    @Test
    void shouldGenerateTokenWithExtraClaims() {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", "MEMBER");
        extraClaims.put("userId", "123");
        
        String token = jwtService.generateToken(extraClaims, userDetails);
        
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void shouldGenerateRefreshToken() {
        String refreshToken = jwtService.generateRefreshToken(userDetails);
        
        assertNotNull(refreshToken);
        assertFalse(refreshToken.isEmpty());
        assertTrue(refreshToken.split("\\.").length == 3);
    }

    @Test
    void shouldExtractUsername() {
        String token = jwtService.generateToken(userDetails);
        
        String extractedUsername = jwtService.extractUsername(token);
        
        assertEquals(userDetails.getUsername(), extractedUsername);
    }

    @Test
    void shouldExtractExpiration() {
        String token = jwtService.generateToken(userDetails);
        
        assertNotNull(jwtService.extractExpiration(token));
        assertTrue(jwtService.extractExpiration(token).getTime() > System.currentTimeMillis());
    }

    @Test
    void shouldValidateValidToken() {
        String token = jwtService.generateToken(userDetails);
        
        assertTrue(jwtService.isTokenValid(token, userDetails));
        assertTrue(jwtService.isTokenValid(token));
    }

    @Test
    void shouldRejectInvalidToken() {
        String invalidToken = "invalid.token.here";
        
        assertFalse(jwtService.isTokenValid(invalidToken, userDetails));
        assertFalse(jwtService.isTokenValid(invalidToken));
    }

    @Test
    void shouldRejectTokenForWrongUser() {
        String token = jwtService.generateToken(userDetails);
        
        UserDetails wrongUser = new User(
            "wrong@example.com",
            "password",
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_MEMBER"))
        );
        
        assertFalse(jwtService.isTokenValid(token, wrongUser));
    }

    @Test
    void shouldRejectExpiredToken() {
        // Set very short expiration for testing
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", -1000L); // Already expired
        
        String expiredToken = jwtService.generateToken(userDetails);
        
        assertFalse(jwtService.isTokenValid(expiredToken, userDetails));
        assertFalse(jwtService.isTokenValid(expiredToken));
    }
}