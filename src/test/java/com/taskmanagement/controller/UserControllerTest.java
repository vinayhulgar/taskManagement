package com.taskmanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskmanagement.dto.UserResponse;
import com.taskmanagement.dto.UserUpdateRequest;
import com.taskmanagement.entity.Role;
import com.taskmanagement.entity.User;
import com.taskmanagement.service.UserDetailsServiceImpl;
import com.taskmanagement.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests for UserController
 */
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    private User testUser;
    private UserResponse userResponse;
    private UserUpdateRequest updateRequest;
    private UserDetailsServiceImpl.CustomUserPrincipal userPrincipal;

    @BeforeEach
    void setUp() {
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

        updateRequest = new UserUpdateRequest("Jane", "Smith");
        userPrincipal = new UserDetailsServiceImpl.CustomUserPrincipal(testUser);
    }

    @Test
    @WithMockUser
    void getCurrentUserProfile_ShouldReturnUserProfile() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/users/profile")
                .with(user(userPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testUser.getId().toString()))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.firstName").value("John"))
                .andExpect(jsonPath("$.lastName").value("Doe"))
                .andExpect(jsonPath("$.role").value("MEMBER"));
    }

    @Test
    void getCurrentUserProfile_WithoutAuthentication_ShouldReturnUnauthorized() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/users/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void updateCurrentUserProfile_WithValidData_ShouldReturnUpdatedProfile() throws Exception {
        // Given
        UserResponse updatedResponse = new UserResponse(
            testUser.getId(),
            testUser.getEmail(),
            "Jane",
            "Smith",
            testUser.getRole(),
            testUser.getCreatedAt(),
            testUser.getUpdatedAt(),
            testUser.getLastLogin()
        );

        when(userService.updateUserProfile(any(UUID.class), anyString(), anyString()))
            .thenReturn(updatedResponse);

        // When & Then
        mockMvc.perform(put("/api/v1/users/profile")
                .with(user(userPrincipal))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Jane"))
                .andExpect(jsonPath("$.lastName").value("Smith"));

        verify(userService).updateUserProfile(testUser.getId(), "Jane", "Smith");
    }

    @Test
    @WithMockUser
    void updateCurrentUserProfile_WithInvalidData_ShouldReturnBadRequest() throws Exception {
        // Given
        UserUpdateRequest invalidRequest = new UserUpdateRequest("", "Smith");

        // When & Then
        mockMvc.perform(put("/api/v1/users/profile")
                .with(user(userPrincipal))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void updateCurrentUserProfile_WithUserNotFound_ShouldReturnNotFound() throws Exception {
        // Given
        when(userService.updateUserProfile(any(UUID.class), anyString(), anyString()))
            .thenThrow(new IllegalArgumentException("User not found"));

        // When & Then
        mockMvc.perform(put("/api/v1/users/profile")
                .with(user(userPrincipal))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateCurrentUserProfile_WithoutAuthentication_ShouldReturnUnauthorized() throws Exception {
        // When & Then
        mockMvc.perform(put("/api/v1/users/profile")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserById_AsAdmin_ShouldReturnUser() throws Exception {
        // Given
        UUID userId = UUID.randomUUID();
        when(userService.findById(userId)).thenReturn(Optional.of(testUser));

        // When & Then
        mockMvc.perform(get("/api/v1/users/{id}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.firstName").value("John"));

        verify(userService).findById(userId);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserById_WithNonExistentUser_ShouldReturnNotFound() throws Exception {
        // Given
        UUID userId = UUID.randomUUID();
        when(userService.findById(userId)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/v1/users/{id}", userId))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "MEMBER")
    void getUserById_AsNonAdmin_ShouldReturnForbidden() throws Exception {
        // Given
        UUID userId = UUID.randomUUID();

        // When & Then
        mockMvc.perform(get("/api/v1/users/{id}", userId))
                .andExpect(status().isForbidden());
    }

    @Test
    void getUserById_WithoutAuthentication_ShouldReturnUnauthorized() throws Exception {
        // Given
        UUID userId = UUID.randomUUID();

        // When & Then
        mockMvc.perform(get("/api/v1/users/{id}", userId))
                .andExpect(status().isUnauthorized());
    }
}