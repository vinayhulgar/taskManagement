package com.taskmanagement.service;

import com.taskmanagement.dto.RegisterRequest;
import com.taskmanagement.dto.UserResponse;
import com.taskmanagement.entity.Role;
import com.taskmanagement.entity.User;
import com.taskmanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Tests for UserService
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private RegisterRequest registerRequest;
    private User testUser;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest(
            "test@example.com",
            "Password123",
            "John",
            "Doe"
        );

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
    }

    @Test
    void registerUser_WithValidData_ShouldReturnUserResponse() {
        // Given
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123")).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        UserResponse result = userService.registerUser(registerRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("test@example.com");
        assertThat(result.getFirstName()).isEqualTo("John");
        assertThat(result.getLastName()).isEqualTo("Doe");
        assertThat(result.getRole()).isEqualTo(Role.MEMBER);

        verify(userRepository).existsByEmail("test@example.com");
        verify(passwordEncoder).encode("Password123");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void registerUser_WithExistingEmail_ShouldThrowException() {
        // Given
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> userService.registerUser(registerRequest))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("User with email test@example.com already exists");

        verify(userRepository).existsByEmail("test@example.com");
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void findByEmail_WithExistingUser_ShouldReturnUser() {
        // Given
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        // When
        Optional<User> result = userService.findByEmail("test@example.com");

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getEmail()).isEqualTo("test@example.com");

        verify(userRepository).findByEmail("test@example.com");
    }

    @Test
    void findByEmail_WithNonExistentUser_ShouldReturnEmpty() {
        // Given
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // When
        Optional<User> result = userService.findByEmail("nonexistent@example.com");

        // Then
        assertThat(result).isEmpty();

        verify(userRepository).findByEmail("nonexistent@example.com");
    }

    @Test
    void findById_WithExistingUser_ShouldReturnUser() {
        // Given
        UUID userId = testUser.getId();
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        // When
        Optional<User> result = userService.findById(userId);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(userId);

        verify(userRepository).findById(userId);
    }

    @Test
    void updateLastLogin_WithExistingUser_ShouldUpdateLastLogin() {
        // Given
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        userService.updateLastLogin("test@example.com");

        // Then
        verify(userRepository).findByEmail("test@example.com");
        verify(userRepository).save(testUser);
        assertThat(testUser.getLastLogin()).isNotNull();
    }

    @Test
    void updateLastLogin_WithNonExistentUser_ShouldNotThrowException() {
        // Given
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // When & Then (should not throw exception)
        userService.updateLastLogin("nonexistent@example.com");

        verify(userRepository).findByEmail("nonexistent@example.com");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateUserProfile_WithValidData_ShouldReturnUpdatedUser() {
        // Given
        UUID userId = testUser.getId();
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        
        User updatedUser = new User(
            testUser.getEmail(),
            testUser.getPasswordHash(),
            "Jane",
            "Smith",
            testUser.getRole()
        );
        updatedUser.setId(userId);
        updatedUser.setCreatedAt(testUser.getCreatedAt());
        updatedUser.setUpdatedAt(LocalDateTime.now());
        
        when(userRepository.save(any(User.class))).thenReturn(updatedUser);

        // When
        UserResponse result = userService.updateUserProfile(userId, "Jane", "Smith");

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getFirstName()).isEqualTo("Jane");
        assertThat(result.getLastName()).isEqualTo("Smith");
        assertThat(result.getEmail()).isEqualTo(testUser.getEmail());

        verify(userRepository).findById(userId);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateUserProfile_WithNonExistentUser_ShouldThrowException() {
        // Given
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> userService.updateUserProfile(userId, "Jane", "Smith"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("User not found");

        verify(userRepository).findById(userId);
        verify(userRepository, never()).save(any(User.class));
    }
}