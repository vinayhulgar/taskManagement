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
 * Unit tests for Team entity validation
 */
class TeamEntityTest {
    
    private Validator validator;
    private User owner;
    
    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
        
        owner = new User();
        owner.setEmail("owner@example.com");
        owner.setPasswordHash("hashedPassword");
        owner.setFirstName("Owner");
        owner.setLastName("User");
        owner.setRole(Role.MANAGER);
    }
    
    @Test
    void testValidTeam() {
        Team team = new Team();
        team.setName("Development Team");
        team.setDescription("A team for software development");
        team.setOwner(owner);
        
        Set<ConstraintViolation<Team>> violations = validator.validate(team);
        assertTrue(violations.isEmpty());
    }
    
    @Test
    void testBlankTeamName() {
        Team team = new Team();
        team.setName("");
        team.setDescription("A team for software development");
        team.setOwner(owner);
        
        Set<ConstraintViolation<Team>> violations = validator.validate(team);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Team name is required")));
    }
    
    @Test
    void testTeamNameTooShort() {
        Team team = new Team();
        team.setName("AB"); // 2 characters
        team.setDescription("A team for software development");
        team.setOwner(owner);
        
        Set<ConstraintViolation<Team>> violations = validator.validate(team);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Team name must be between 3 and 50 characters")));
    }
    
    @Test
    void testTeamNameTooLong() {
        Team team = new Team();
        team.setName("A".repeat(51)); // 51 characters
        team.setDescription("A team for software development");
        team.setOwner(owner);
        
        Set<ConstraintViolation<Team>> violations = validator.validate(team);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Team name must be between 3 and 50 characters")));
    }
    
    @Test
    void testDescriptionTooLong() {
        Team team = new Team();
        team.setName("Development Team");
        team.setDescription("A".repeat(501)); // 501 characters
        team.setOwner(owner);
        
        Set<ConstraintViolation<Team>> violations = validator.validate(team);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Description cannot exceed 500 characters")));
    }
    
    @Test
    void testTeamEquality() {
        Team team1 = new Team();
        Team team2 = new Team();
        
        // Teams without IDs should not be equal
        assertNotEquals(team1, team2);
        
        // Teams with same ID should be equal
        team1.setId(java.util.UUID.randomUUID());
        team2.setId(team1.getId());
        assertEquals(team1, team2);
        assertEquals(team1.hashCode(), team2.hashCode());
    }
    
    @Test
    void testTeamToString() {
        Team team = new Team();
        team.setName("Development Team");
        team.setDescription("A team for software development");
        
        String toString = team.toString();
        assertTrue(toString.contains("Development Team"));
        assertTrue(toString.contains("A team for software development"));
    }
    
    @Test
    void testConstructorWithParameters() {
        Team team = new Team("Development Team", "A team for software development", owner);
        
        assertEquals("Development Team", team.getName());
        assertEquals("A team for software development", team.getDescription());
        assertEquals(owner, team.getOwner());
    }
    
    @Test
    void testValidTeamWithMinimumName() {
        Team team = new Team();
        team.setName("Dev"); // 3 characters (minimum)
        team.setOwner(owner);
        
        Set<ConstraintViolation<Team>> violations = validator.validate(team);
        assertTrue(violations.isEmpty());
    }
    
    @Test
    void testValidTeamWithMaximumName() {
        Team team = new Team();
        team.setName("A".repeat(50)); // 50 characters (maximum)
        team.setOwner(owner);
        
        Set<ConstraintViolation<Team>> violations = validator.validate(team);
        assertTrue(violations.isEmpty());
    }
}