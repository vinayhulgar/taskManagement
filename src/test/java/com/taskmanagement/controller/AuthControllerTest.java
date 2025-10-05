package com.taskmanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskmanagement.dto.*;
import com.taskmanagement.entity.Role;
import com.taskmanagement.entity.User;
import com.taskmanagement.service.JwtService;
import com.taskmanagement.service.UserDetailsServiceImpl;
import com.taskmanagement.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests for AuthController
 */
@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    private RegisterRequest validRegisterRequest;
    private LoginRequest validLoginRequest;
    private RefreshTokenRequest validRefreshRequest;
    private UserResponse userResponse;
    private User testUser;

    @BeforeEach
    void setUp() {
        validRegisterRequest = new RegisterRequest(
            "test@example.com",
            "Password123",
            "John",
            "Doe"
        );

        validLoginRequest = new LoginRequest("test@example.com", "Password123");
        validRefreshRequest = new RefreshTokenRequest("valid-refresh-token");

        testUser = new User(
            "test@example.com",
            "hashedPassword",
            "John",
            "Doe",
            Role.MEMBER
        );
        testUser.setId(UUID.randomUUID());
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());

        userResponse = new UserResponse(
            testUser.getId(),
            testUser.getEmail(),
            testUser.getFirstName(),
            testUser.getLastName(),
            testUser.getRole(),
            testUser.getCreatedAt(),
            testUser.getUpdatedAt(),
            testUser.getLastLogin()
        );
    }

    @Test
    void register_WithValidData_ShouldReturnCreated() throws Exception {
        // Given
        when(userService.registerUser(any(RegisterRequest.class))).thenReturn(userResponse);
        when(userDetailsService.loadUserByUsername(anyString()))
            .thenReturn(new UserDetailsServiceImpl.CustomUserPrincipal(testUser));
        when(jwtService.generateToken(any())).thenReturn("access-token");
        when(jwtService.generateRefreshToken(any())).thenReturn("refresh-token");

        // When & Then
        mockMvc.perform(post("/api/v1/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRegisterRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.access_token").value("access-token"))
                .andExpect(jsonPath("$.refresh_token").value("refresh-token"))
                .andExpect(jsonPath("$.token_type").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("test@example.com"));

        verify(userService).registerUser(any(RegisterRequest.class));
        verify(userService).updateLastLogin("test@example.com");
    }

    @Test
    void register_WithExistingEmail_ShouldReturnConflict() throws Exception {
        // Given
        when(userService.registerUser(any(RegisterRequest.class)))
            .thenThrow(new IllegalArgumentException("User with email test@example.com already exists"));

        // When & Then
        mockMvc.perform(post("/api/v1/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRegisterRequest)))
                .andExpect(status().isConflict());
    }

    @Test
    void register_WithInvalidEmail_ShouldReturnBadRequest() throws Exception {
        // Given
        RegisterRequest invalidRequest = new RegisterRequest(
            "invalid-email",
            "Password123",
            "John",
            "Doe"
        );

        // When & Then
        mockMvc.perform(post("/api/v1/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_WithWeakPassword_ShouldReturnBadRequest() throws Exception {
        // Given
        RegisterRequest invalidRequest = new RegisterRequest(
            "test@example.com",
            "weak",
            "John",
            "Doe"
        );

        // When & Then
        mockMvc.perform(post("/api/v1/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_WithValidCredentials_ShouldReturnOk() throws Exception {
        // Given
        Authentication authentication = mock(Authentication.class);
        UserDetailsServiceImpl.CustomUserPrincipal principal = 
            new UserDetailsServiceImpl.CustomUserPrincipal(testUser);
        
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
            .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(principal);
        when(jwtService.generateToken(any())).thenReturn("access-token");
        when(jwtService.generateRefreshToken(any())).thenReturn("refresh-token");

        // When & Then
        mockMvc.perform(post("/api/v1/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validLoginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access_token").value("access-token"))
                .andExpect(jsonPath("$.refresh_token").value("refresh-token"))
                .andExpect(jsonPath("$.user.email").value("test@example.com"));

        verify(userService).updateLastLogin("test@example.com");
    }

    @Test
    void login_WithInvalidCredentials_ShouldReturnUnauthorized() throws Exception {
        // Given
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
            .thenThrow(new BadCredentialsException("Invalid credentials"));

        // When & Then
        mockMvc.perform(post("/api/v1/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validLoginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_WithInvalidEmail_ShouldReturnBadRequest() throws Exception {
        // Given
        LoginRequest invalidRequest = new LoginRequest("invalid-email", "Password123");

        // When & Then
        mockMvc.perform(post("/api/v1/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void refresh_WithValidToken_ShouldReturnOk() throws Exception {
        // Given
        UserDetailsServiceImpl.CustomUserPrincipal principal = 
            new UserDetailsServiceImpl.CustomUserPrincipal(testUser);
        
        when(jwtService.isTokenValid("valid-refresh-token")).thenReturn(true);
        when(jwtService.extractUsername("valid-refresh-token")).thenReturn("test@example.com");
        when(userDetailsService.loadUserByUsername("test@example.com")).thenReturn(principal);
        when(jwtService.generateToken(any())).thenReturn("new-access-token");

        // When & Then
        mockMvc.perform(post("/api/v1/auth/refresh")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRefreshRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access_token").value("new-access-token"))
                .andExpect(jsonPath("$.refresh_token").value("valid-refresh-token"));
    }

    @Test
    void refresh_WithInvalidToken_ShouldReturnUnauthorized() throws Exception {
        // Given
        when(jwtService.isTokenValid("invalid-refresh-token")).thenReturn(false);

        RefreshTokenRequest invalidRequest = new RefreshTokenRequest("invalid-refresh-token");

        // When & Then
        mockMvc.perform(post("/api/v1/auth/refresh")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_WithEmptyToken_ShouldReturnBadRequest() throws Exception {
        // Given
        RefreshTokenRequest invalidRequest = new RefreshTokenRequest("");

        // When & Then
        mockMvc.perform(post("/api/v1/auth/refresh")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void logout_ShouldReturnNoContent() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/v1/auth/logout")
                .with(csrf()))
                .andExpect(status().isNoContent());
    }
}