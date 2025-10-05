package com.taskmanagement.entity;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for User entity validation
 */
class UserEntityTest {
    
    private Validator validator;
    
    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }
    
    @Test
    void testValidUser() {
        User user = new User();
        user.setEmail("test@example.com");
        user.setPasswordHash("hashedPassword123");
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setRole(Role.MEMBER);
        
        Set<ConstraintViolation<User>> violations = validator.validate(user);
        assertTrue(violations.isEmpty());
    }
    
    @Test
    void testInvalidEmail() {
        User user = new User();
        user.setEmail("invalid-email");
        user.setPasswordHash("hashedPassword123");
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setRole(Role.MEMBER);
        
        Set<ConstraintViolation<User>> violations = validator.validate(user);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Email must be valid")));
    }
    
    @Test
    void testBlankEmail() {
        User user = new User();
        user.setEmail("");
        user.setPasswordHash("hashedPassword123");
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setRole(Role.MEMBER);
        
        Set<ConstraintViolation<User>> violations = validator.validate(user);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Email is required")));
    }
    
    @Test
    void testBlankPassword() {
        User user = new User();
        user.setEmail("test@example.com");
        user.setPasswordHash("");
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setRole(Role.MEMBER);
        
        Set<ConstraintViolation<User>> violations = validator.validate(user);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Password is required")));
    }
    
    @Test
    void testFirstNameTooLong() {
        User user = new User();
        user.setEmail("test@example.com");
        user.setPasswordHash("hashedPassword123");
        user.setFirstName("A".repeat(51)); // 51 characters
        user.setLastName("Doe");
        user.setRole(Role.MEMBER);
        
        Set<ConstraintViolation<User>> violations = validator.validate(user);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("First name must be between 1 and 50 characters")));
    }
    
    @Test
    void testLastNameTooLong() {
        User user = new User();
        user.setEmail("test@example.com");
        user.setPasswordHash("hashedPassword123");
        user.setFirstName("John");
        user.setLastName("A".repeat(51)); // 51 characters
        user.setRole(Role.MEMBER);
        
        Set<ConstraintViolation<User>> violations = validator.validate(user);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Last name must be between 1 and 50 characters")));
    }
    
    @Test
    void testUserEquality() {
        User user1 = new User();
        User user2 = new User();
        
        // Users without IDs should not be equal
        assertNotEquals(user1, user2);
        
        // Users with same ID should be equal
        user1.setId(java.util.UUID.randomUUID());
        user2.setId(user1.getId());
        assertEquals(user1, user2);
        assertEquals(user1.hashCode(), user2.hashCode());
    }
    
    @Test
    void testUserToString() {
        User user = new User();
        user.setEmail("test@example.com");
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setRole(Role.MEMBER);
        
        String toString = user.toString();
        assertTrue(toString.contains("test@example.com"));
        assertTrue(toString.contains("John"));
        assertTrue(toString.contains("Doe"));
        assertTrue(toString.contains("MEMBER"));
    }
    
    @Test
    void testConstructorWithParameters() {
        User user = new User("test@example.com", "hashedPassword", "John", "Doe", Role.ADMIN);
        
        assertEquals("test@example.com", user.getEmail());
        assertEquals("hashedPassword", user.getPasswordHash());
        assertEquals("John", user.getFirstName());
        assertEquals("Doe", user.getLastName());
        assertEquals(Role.ADMIN, user.getRole());
    }
}