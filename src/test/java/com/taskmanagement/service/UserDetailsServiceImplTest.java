package com.taskmanagement.service;

import com.taskmanagement.entity.Role;
import com.taskmanagement.entity.User;
import com.taskmanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * Unit tests for UserDetailsServiceImpl
 */
@ExtendWith(MockitoExtension.class)
class UserDetailsServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserDetailsServiceImpl userDetailsService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");
        testUser.setPasswordHash("$2a$12$hashedPassword");
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setRole(Role.MEMBER);
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void shouldLoadUserByUsername() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        UserDetails userDetails = userDetailsService.loadUserByUsername("test@example.com");

        assertNotNull(userDetails);
        assertEquals("test@example.com", userDetails.getUsername());
        assertEquals("$2a$12$hashedPassword", userDetails.getPassword());
        assertTrue(userDetails.isEnabled());
        assertTrue(userDetails.isAccountNonExpired());
        assertTrue(userDetails.isAccountNonLocked());
        assertTrue(userDetails.isCredentialsNonExpired());
    }

    @Test
    void shouldHaveCorrectAuthorities() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        UserDetails userDetails = userDetailsService.loadUserByUsername("test@example.com");

        assertEquals(1, userDetails.getAuthorities().size());
        GrantedAuthority authority = userDetails.getAuthorities().iterator().next();
        assertEquals("ROLE_MEMBER", authority.getAuthority());
    }

    @Test
    void shouldHaveAdminRole() {
        testUser.setRole(Role.ADMIN);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        UserDetails userDetails = userDetailsService.loadUserByUsername("test@example.com");

        GrantedAuthority authority = userDetails.getAuthorities().iterator().next();
        assertEquals("ROLE_ADMIN", authority.getAuthority());
    }

    @Test
    void shouldHaveManagerRole() {
        testUser.setRole(Role.MANAGER);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        UserDetails userDetails = userDetailsService.loadUserByUsername("test@example.com");

        GrantedAuthority authority = userDetails.getAuthorities().iterator().next();
        assertEquals("ROLE_MANAGER", authority.getAuthority());
    }

    @Test
    void shouldThrowExceptionWhenUserNotFound() {
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> {
            userDetailsService.loadUserByUsername("nonexistent@example.com");
        });
    }

    @Test
    void shouldReturnCustomUserPrincipal() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        UserDetails userDetails = userDetailsService.loadUserByUsername("test@example.com");

        assertTrue(userDetails instanceof UserDetailsServiceImpl.CustomUserPrincipal);
        UserDetailsServiceImpl.CustomUserPrincipal customPrincipal = 
            (UserDetailsServiceImpl.CustomUserPrincipal) userDetails;
        assertEquals(testUser, customPrincipal.getUser());
    }
}