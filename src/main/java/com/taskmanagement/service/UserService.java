package com.taskmanagement.service;

import com.taskmanagement.config.CacheConfig;
import com.taskmanagement.dto.RegisterRequest;
import com.taskmanagement.dto.UserResponse;
import com.taskmanagement.entity.User;
import com.taskmanagement.repository.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for user management operations
 */
@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Register a new user
     */
    public UserResponse registerUser(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("User with email " + request.getEmail() + " already exists");
        }

        // Create new user entity
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setRole(request.getRole());

        // Save user
        User savedUser = userRepository.save(user);

        // Convert to response DTO
        return convertToUserResponse(savedUser);
    }

    /**
     * Find user by email
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.USER_CACHE, key = "'email:' + #email")
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Find user by ID
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.USER_CACHE, key = "'id:' + #id")
    public Optional<User> findById(UUID id) {
        return userRepository.findById(id);
    }

    /**
     * Update user's last login time
     */
    @CacheEvict(value = CacheConfig.USER_CACHE, key = "'email:' + #email")
    public void updateLastLogin(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
        });
    }

    /**
     * Update user profile
     */
    @CacheEvict(value = CacheConfig.USER_CACHE, allEntries = true)
    public UserResponse updateUserProfile(UUID userId, String firstName, String lastName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setFirstName(firstName);
        user.setLastName(lastName);

        User updatedUser = userRepository.save(user);
        return convertToUserResponse(updatedUser);
    }

    /**
     * Convert User entity to UserResponse DTO
     */
    private UserResponse convertToUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                user.getLastLogin()
        );
    }
}