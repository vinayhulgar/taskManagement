package com.taskmanagement.controller;

import com.taskmanagement.dto.*;
import com.taskmanagement.service.JwtService;
import com.taskmanagement.service.UserDetailsServiceImpl;
import com.taskmanagement.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for authentication endpoints
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "User authentication and registration endpoints")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsServiceImpl userDetailsService;

    public AuthController(UserService userService, 
                         JwtService jwtService, 
                         AuthenticationManager authenticationManager,
                         UserDetailsServiceImpl userDetailsService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
    }

    // TEMPORARILY COMMENTED OUT FOR TESTING
    /*
    @Operation(summary = "Register a new user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "User registered successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "409", description = "User already exists")
    })
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        try {
            // Register the user
            UserResponse userResponse = userService.registerUser(request);
            
            // Load user details for JWT generation
            UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
            
            // Generate tokens
            String accessToken = jwtService.generateToken(userDetails);
            String refreshToken = jwtService.generateRefreshToken(userDetails);
            
            // Update last login
            userService.updateLastLogin(request.getEmail());
            
            // Create response
            AuthResponse authResponse = new AuthResponse(
                accessToken, 
                refreshToken, 
                900000L, // 15 minutes in milliseconds
                userResponse
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
            
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("already exists")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }
            return ResponseEntity.badRequest().build();
        }
    }
    */

    @Operation(summary = "Authenticate user and get tokens")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Authentication successful"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "401", description = "Invalid credentials")
    })
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            
            // Load user details
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            UserDetailsServiceImpl.CustomUserPrincipal customPrincipal = 
                (UserDetailsServiceImpl.CustomUserPrincipal) userDetails;
            
            // Generate tokens
            String accessToken = jwtService.generateToken(userDetails);
            String refreshToken = jwtService.generateRefreshToken(userDetails);
            
            // Update last login
            userService.updateLastLogin(request.getEmail());
            
            // Convert user to response DTO
            UserResponse userResponse = new UserResponse(
                customPrincipal.getUser().getId(),
                customPrincipal.getUser().getEmail(),
                customPrincipal.getUser().getFirstName(),
                customPrincipal.getUser().getLastName(),
                customPrincipal.getUser().getRole(),
                customPrincipal.getUser().getCreatedAt(),
                customPrincipal.getUser().getUpdatedAt(),
                customPrincipal.getUser().getLastLogin()
            );
            
            // Create response
            AuthResponse authResponse = new AuthResponse(
                accessToken, 
                refreshToken, 
                900000L, // 15 minutes in milliseconds
                userResponse
            );
            
            return ResponseEntity.ok(authResponse);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @Operation(summary = "Refresh access token")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Token refreshed successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid refresh token"),
        @ApiResponse(responseCode = "401", description = "Refresh token expired or invalid")
    })
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        try {
            String refreshToken = request.getRefreshToken();
            
            // Validate refresh token
            if (!jwtService.isTokenValid(refreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            // Extract username from refresh token
            String email = jwtService.extractUsername(refreshToken);
            
            // Load user details
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            UserDetailsServiceImpl.CustomUserPrincipal customPrincipal = 
                (UserDetailsServiceImpl.CustomUserPrincipal) userDetails;
            
            // Generate new access token
            String newAccessToken = jwtService.generateToken(userDetails);
            
            // Convert user to response DTO
            UserResponse userResponse = new UserResponse(
                customPrincipal.getUser().getId(),
                customPrincipal.getUser().getEmail(),
                customPrincipal.getUser().getFirstName(),
                customPrincipal.getUser().getLastName(),
                customPrincipal.getUser().getRole(),
                customPrincipal.getUser().getCreatedAt(),
                customPrincipal.getUser().getUpdatedAt(),
                customPrincipal.getUser().getLastLogin()
            );
            
            // Create response (keep the same refresh token)
            AuthResponse authResponse = new AuthResponse(
                newAccessToken, 
                refreshToken, 
                900000L, // 15 minutes in milliseconds
                userResponse
            );
            
            return ResponseEntity.ok(authResponse);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @Operation(summary = "Logout user (invalidate tokens)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Logout successful")
    })
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // In a stateless JWT implementation, logout is typically handled client-side
        // by removing the tokens from storage. For enhanced security, you could
        // implement a token blacklist here.
        return ResponseEntity.noContent().build();
    }
}