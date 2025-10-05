package com.taskmanagement.entity;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for Task entity validation
 */
class TaskEntityTest {
    
    private Validator validator;
    private Project project;
    private User assignee;
    private User createdBy;
    
    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
        
        User owner = new User();
        owner.setEmail("owner@example.com");
        owner.setPasswordHash("hashedPassword");
        owner.setRole(Role.MANAGER);
        
        Team team = new Team();
        team.setName("Development Team");
        team.setOwner(owner);
        
        project = new Project();
        project.setTeam(team);
        project.setName("Web Application");
        project.setStatus(ProjectStatus.ACTIVE);
        project.setCreatedBy(owner);
        
        assignee = new User();
        assignee.setEmail("assignee@example.com");
        assignee.setPasswordHash("hashedPassword");
        assignee.setRole(Role.MEMBER);
        
        createdBy = new User();
        createdBy.setEmail("creator@example.com");
        createdBy.setPasswordHash("hashedPassword");
        createdBy.setRole(Role.MANAGER);
    }
    
    @Test
    void testValidTask() {
        Task task = new Task();
        task.setProject(project);
        task.setTitle("Implement user authentication");
        task.setDescription("Implement JWT-based user authentication");
        task.setStatus(TaskStatus.TODO);
        task.setPriority(Priority.HIGH);
        task.setAssignee(assignee);
        task.setDueDate(LocalDateTime.now().plusDays(7));
        task.setCreatedBy(createdBy);
        
        Set<ConstraintViolation<Task>> violations = validator.validate(task);
        assertTrue(violations.isEmpty());
    }
    
    @Test
    void testBlankTaskTitle() {
        Task task = new Task();
        task.setProject(project);
        task.setTitle("");
        task.setDescription("Implement JWT-based user authentication");
        task.setStatus(TaskStatus.TODO);
        task.setPriority(Priority.HIGH);
        task.setCreatedBy(createdBy);
        
        Set<ConstraintViolation<Task>> violations = validator.validate(task);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Task title is required")));
    }
    
    @Test
    void testTaskTitleTooShort() {
        Task task = new Task();
        task.setProject(project);
        task.setTitle("AB"); // 2 characters
        task.setDescription("Implement JWT-based user authentication");
        task.setStatus(TaskStatus.TODO);
        task.setPriority(Priority.HIGH);
        task.setCreatedBy(createdBy);
        
        Set<ConstraintViolation<Task>> violations = validator.validate(task);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Task title must be between 3 and 200 characters")));
    }
    
    @Test
    void testTaskTitleTooLong() {
        Task task = new Task();
        task.setProject(project);
        task.setTitle("A".repeat(201)); // 201 characters
        task.setDescription("Implement JWT-based user authentication");
        task.setStatus(TaskStatus.TODO);
        task.setPriority(Priority.HIGH);
        task.setCreatedBy(createdBy);
        
        Set<ConstraintViolation<Task>> violations = validator.validate(task);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Task title must be between 3 and 200 characters")));
    }
    
    @Test
    void testDescriptionTooLong() {
        Task task = new Task();
        task.setProject(project);
        task.setTitle("Implement user authentication");
        task.setDescription("A".repeat(2001)); // 2001 characters
        task.setStatus(TaskStatus.TODO);
        task.setPriority(Priority.HIGH);
        task.setCreatedBy(createdBy);
        
        Set<ConstraintViolation<Task>> violations = validator.validate(task);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Description cannot exceed 2000 characters")));
    }
    
    @Test
    void testTaskEquality() {
        Task task1 = new Task();
        Task task2 = new Task();
        
        // Tasks without IDs should not be equal
        assertNotEquals(task1, task2);
        
        // Tasks with same ID should be equal
        task1.setId(java.util.UUID.randomUUID());
        task2.setId(task1.getId());
        assertEquals(task1, task2);
        assertEquals(task1.hashCode(), task2.hashCode());
    }
    
    @Test
    void testTaskToString() {
        Task task = new Task();
        task.setTitle("Implement user authentication");
        task.setStatus(TaskStatus.TODO);
        task.setPriority(Priority.HIGH);
        task.setDueDate(LocalDateTime.now().plusDays(7));
        
        String toString = task.toString();
        assertTrue(toString.contains("Implement user authentication"));
        assertTrue(toString.contains("TODO"));
        assertTrue(toString.contains("HIGH"));
    }
    
    @Test
    void testConstructorWithParameters() {
        LocalDateTime dueDate = LocalDateTime.now().plusDays(7);
        
        Task task = new Task(project, "Implement authentication", "JWT auth", 
                           TaskStatus.IN_PROGRESS, Priority.HIGH, assignee, dueDate, createdBy);
        
        assertEquals(project, task.getProject());
        assertEquals("Implement authentication", task.getTitle());
        assertEquals("JWT auth", task.getDescription());
        assertEquals(TaskStatus.IN_PROGRESS, task.getStatus());
        assertEquals(Priority.HIGH, task.getPriority());
        assertEquals(assignee, task.getAssignee());
        assertEquals(dueDate, task.getDueDate());
        assertEquals(createdBy, task.getCreatedBy());
    }
    
    @Test
    void testValidTaskWithMinimumTitle() {
        Task task = new Task();
        task.setProject(project);
        task.setTitle("Fix"); // 3 characters (minimum)
        task.setStatus(TaskStatus.TODO);
        task.setPriority(Priority.LOW);
        task.setCreatedBy(createdBy);
        
        Set<ConstraintViolation<Task>> violations = validator.validate(task);
        assertTrue(violations.isEmpty());
    }
    
    @Test
    void testValidTaskWithMaximumTitle() {
        Task task = new Task();
        task.setProject(project);
        task.setTitle("A".repeat(200)); // 200 characters (maximum)
        task.setStatus(TaskStatus.TODO);
        task.setPriority(Priority.LOW);
        task.setCreatedBy(createdBy);
        
        Set<ConstraintViolation<Task>> violations = validator.validate(task);
        assertTrue(violations.isEmpty());
    }
    
    @Test
    void testTaskWithParentTask() {
        Task parentTask = new Task();
        parentTask.setProject(project);
        parentTask.setTitle("Parent Task");
        parentTask.setStatus(TaskStatus.IN_PROGRESS);
        parentTask.setPriority(Priority.MEDIUM);
        parentTask.setCreatedBy(createdBy);
        
        Task subtask = new Task();
        subtask.setProject(project);
        subtask.setParentTask(parentTask);
        subtask.setTitle("Subtask");
        subtask.setStatus(TaskStatus.TODO);
        subtask.setPriority(Priority.LOW);
        subtask.setCreatedBy(createdBy);
        
        Set<ConstraintViolation<Task>> violations = validator.validate(subtask);
        assertTrue(violations.isEmpty());
        assertEquals(parentTask, subtask.getParentTask());
    }
}