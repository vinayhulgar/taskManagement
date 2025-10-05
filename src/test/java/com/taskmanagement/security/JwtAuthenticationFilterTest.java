package com.taskmanagement.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.IOException;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for JwtAuthenticationFilter
 */
@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    void setUp() {
        jwtAuthenticationFilter = new JwtAuthenticationFilter(authenticationManager);
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldAuthenticateWithValidBearerToken() throws ServletException, IOException {
        String token = "valid.jwt.token";
        String bearerToken = "Bearer " + token;
        
        UserDetails userDetails = new User(
            "test@example.com",
            "password",
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_MEMBER"))
        );
        
        JwtAuthenticationToken authenticatedToken = new JwtAuthenticationToken(
            userDetails, token, userDetails.getAuthorities()
        );

        when(request.getHeader("Authorization")).thenReturn(bearerToken);
        when(authenticationManager.authenticate(any(JwtAuthenticationToken.class)))
            .thenReturn(authenticatedToken);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals(authenticatedToken, SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void shouldContinueWithoutAuthenticationWhenNoToken() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn(null);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(authenticationManager, never()).authenticate(any());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void shouldContinueWithoutAuthenticationWhenInvalidTokenFormat() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn("InvalidFormat token");

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(authenticationManager, never()).authenticate(any());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void shouldContinueWhenAuthenticationFails() throws ServletException, IOException {
        String bearerToken = "Bearer invalid.token";

        when(request.getHeader("Authorization")).thenReturn(bearerToken);
        when(authenticationManager.authenticate(any(JwtAuthenticationToken.class)))
            .thenThrow(new RuntimeException("Authentication failed"));

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void shouldNotOverrideExistingAuthentication() throws ServletException, IOException {
        String bearerToken = "Bearer valid.token";
        
        // Set existing authentication
        UserDetails existingUser = new User("existing@example.com", "password", Collections.emptyList());
        JwtAuthenticationToken existingAuth = new JwtAuthenticationToken(
            existingUser, "existing.token", Collections.emptyList()
        );
        SecurityContextHolder.getContext().setAuthentication(existingAuth);

        when(request.getHeader("Authorization")).thenReturn(bearerToken);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(authenticationManager, never()).authenticate(any());
        assertEquals(existingAuth, SecurityContextHolder.getContext().getAuthentication());
    }
}