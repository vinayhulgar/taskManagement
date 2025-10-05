package com.taskmanagement.controller;

import com.taskmanagement.dto.UserResponse;
import com.taskmanagement.dto.UserUpdateRequest;
import com.taskmanagement.entity.User;
import com.taskmanagement.service.UserDetailsServiceImpl;
import com.taskmanagement.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller for user profile management
 */
@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "User Management", description = "User profile management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @Operation(summary = "Get current user profile")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Profile retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getCurrentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsServiceImpl.CustomUserPrincipal principal = 
            (UserDetailsServiceImpl.CustomUserPrincipal) authentication.getPrincipal();
        
        User user = principal.getUser();
        UserResponse userResponse = new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getRole(),
            user.getCreatedAt(),
            user.getUpdatedAt(),
            user.getLastLogin()
        );
        
        return ResponseEntity.ok(userResponse);
    }

    @Operation(summary = "Update current user profile")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Profile updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateCurrentUserProfile(@Valid @RequestBody UserUpdateRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsServiceImpl.CustomUserPrincipal principal = 
            (UserDetailsServiceImpl.CustomUserPrincipal) authentication.getPrincipal();
        
        UUID userId = principal.getUser().getId();
        
        try {
            UserResponse updatedUser = userService.updateUserProfile(
                userId, 
                request.getFirstName(), 
                request.getLastName()
            );
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Get user by ID (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "User retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID id) {
        return userService.findById(id)
            .map(user -> {
                UserResponse userResponse = new UserResponse(
                    user.getId(),
                    user.getEmail(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getRole(),
                    user.getCreatedAt(),
                    user.getUpdatedAt(),
                    user.getLastLogin()
                );
                return ResponseEntity.ok(userResponse);
            })
            .orElse(ResponseEntity.notFound().build());
    }
}