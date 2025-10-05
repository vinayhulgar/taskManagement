package com.taskmanagement.entity;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for Project entity validation
 */
class ProjectEntityTest {
    
    private Validator validator;
    private Team team;
    private User createdBy;
    
    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
        
        User owner = new User();
        owner.setEmail("owner@example.com");
        owner.setPasswordHash("hashedPassword");
        owner.setRole(Role.MANAGER);
        
        team = new Team();
        team.setName("Development Team");
        team.setOwner(owner);
        
        createdBy = new User();
        createdBy.setEmail("creator@example.com");
        createdBy.setPasswordHash("hashedPassword");
        createdBy.setRole(Role.MANAGER);
    }
    
    @Test
    void testValidProject() {
        Project project = new Project();
        project.setTeam(team);
        project.setName("Web Application");
        project.setDescription("A web application project");
        project.setStatus(ProjectStatus.ACTIVE);
        project.setStartDate(LocalDate.now());
        project.setEndDate(LocalDate.now().plusDays(30));
        project.setCreatedBy(createdBy);
        
        Set<ConstraintViolation<Project>> violations = validator.validate(project);
        assertTrue(violations.isEmpty());
    }
    
    @Test
    void testBlankProjectName() {
        Project project = new Project();
        project.setTeam(team);
        project.setName("");
        project.setDescription("A web application project");
        project.setStatus(ProjectStatus.ACTIVE);
        project.setCreatedBy(createdBy);
        
        Set<ConstraintViolation<Project>> violations = validator.validate(project);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Project name is required")));
    }
    
    @Test
    void testProjectNameTooShort() {
        Project project = new Project();
        project.setTeam(team);
        project.setName("AB"); // 2 characters
        project.setDescription("A web application project");
        project.setStatus(ProjectStatus.ACTIVE);
        project.setCreatedBy(createdBy);
        
        Set<ConstraintViolation<Project>> violations = validator.validate(project);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Project name must be between 3 and 100 characters")));
    }
    
    @Test
    void testProjectNameTooLong() {
        Project project = new Project();
        project.setTeam(team);
        project.setName("A".repeat(101)); // 101 characters
        project.setDescription("A web application project");
        project.setStatus(ProjectStatus.ACTIVE);
        project.setCreatedBy(createdBy);
        
        Set<ConstraintViolation<Project>> violations = validator.validate(project);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Project name must be between 3 and 100 characters")));
    }
    
    @Test
    void testDescriptionTooLong() {
        Project project = new Project();
        project.setTeam(team);
        project.setName("Web Application");
        project.setDescription("A".repeat(1001)); // 1001 characters
        project.setStatus(ProjectStatus.ACTIVE);
        project.setCreatedBy(createdBy);
        
        Set<ConstraintViolation<Project>> violations = validator.validate(project);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Description cannot exceed 1000 characters")));
    }
    
    @Test
    void testProjectEquality() {
        Project project1 = new Project();
        Project project2 = new Project();
        
        // Projects without IDs should not be equal
        assertNotEquals(project1, project2);
        
        // Projects with same ID should be equal
        project1.setId(java.util.UUID.randomUUID());
        project2.setId(project1.getId());
        assertEquals(project1, project2);
        assertEquals(project1.hashCode(), project2.hashCode());
    }
    
    @Test
    void testProjectToString() {
        Project project = new Project();
        project.setName("Web Application");
        project.setStatus(ProjectStatus.ACTIVE);
        project.setStartDate(LocalDate.now());
        project.setEndDate(LocalDate.now().plusDays(30));
        
        String toString = project.toString();
        assertTrue(toString.contains("Web Application"));
        assertTrue(toString.contains("ACTIVE"));
    }
    
    @Test
    void testConstructorWithParameters() {
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = LocalDate.now().plusDays(30);
        
        Project project = new Project(team, "Web Application", "A web app", 
                                    ProjectStatus.ACTIVE, startDate, endDate, createdBy);
        
        assertEquals(team, project.getTeam());
        assertEquals("Web Application", project.getName());
        assertEquals("A web app", project.getDescription());
        assertEquals(ProjectStatus.ACTIVE, project.getStatus());
        assertEquals(startDate, project.getStartDate());
        assertEquals(endDate, project.getEndDate());
        assertEquals(createdBy, project.getCreatedBy());
    }
    
    @Test
    void testValidProjectWithMinimumName() {
        Project project = new Project();
        project.setTeam(team);
        project.setName("App"); // 3 characters (minimum)
        project.setStatus(ProjectStatus.PLANNING);
        project.setCreatedBy(createdBy);
        
        Set<ConstraintViolation<Project>> violations = validator.validate(project);
        assertTrue(violations.isEmpty());
    }
    
    @Test
    void testValidProjectWithMaximumName() {
        Project project = new Project();
        project.setTeam(team);
        project.setName("A".repeat(100)); // 100 characters (maximum)
        project.setStatus(ProjectStatus.PLANNING);
        project.setCreatedBy(createdBy);
        
        Set<ConstraintViolation<Project>> violations = validator.validate(project);
        assertTrue(violations.isEmpty());
    }
}