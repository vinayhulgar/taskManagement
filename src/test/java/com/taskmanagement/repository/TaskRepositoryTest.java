package com.taskmanagement.repository;

import com.taskmanagement.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.TestPropertySource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Repository tests for TaskRepository
 */
@DataJpaTest
@TestPropertySource(properties = {
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class TaskRepositoryTest {
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private TaskRepository taskRepository;
    
    private User owner;
    private User assignee;
    private Team team;
    private Project project;
    private Task testTask;
    
    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setEmail("owner@example.com");
        owner.setPasswordHash("hashedPassword");
        owner.setFirstName("Team");
        owner.setLastName("Owner");
        owner.setRole(Role.MANAGER);
        owner = entityManager.persistAndFlush(owner);
        
        assignee = new User();
        assignee.setEmail("assignee@example.com");
        assignee.setPasswordHash("hashedPassword");
        assignee.setFirstName("Task");
        assignee.setLastName("Assignee");
        assignee.setRole(Role.MEMBER);
        assignee = entityManager.persistAndFlush(assignee);
        
        team = new Team();
        team.setName("Development Team");
        team.setDescription("A team for software development");
        team.setOwner(owner);
        team = entityManager.persistAndFlush(team);
        
        project = new Project();
        project.setTeam(team);
        project.setName("Web Application");
        project.setDescription("A web application project");
        project.setStatus(ProjectStatus.ACTIVE);
        project.setCreatedBy(owner);
        project = entityManager.persistAndFlush(project);
        
        testTask = new Task();
        testTask.setProject(project);
        testTask.setTitle("Implement user authentication");
        testTask.setDescription("Implement JWT-based user authentication");
        testTask.setStatus(TaskStatus.TODO);
        testTask.setPriority(Priority.HIGH);
        testTask.setAssignee(assignee);
        testTask.setDueDate(LocalDateTime.now().plusDays(7));
        testTask.setCreatedBy(owner);
    }
    
    @Test
    void testSaveAndFindById() {
        Task savedTask = entityManager.persistAndFlush(testTask);
        
        Optional<Task> foundTask = taskRepository.findById(savedTask.getId());
        
        assertTrue(foundTask.isPresent());
        assertEquals(testTask.getTitle(), foundTask.get().getTitle());
        assertEquals(testTask.getDescription(), foundTask.get().getDescription());
        assertEquals(testTask.getStatus(), foundTask.get().getStatus());
        assertEquals(testTask.getPriority(), foundTask.get().getPriority());
        assertEquals(testTask.getProject().getId(), foundTask.get().getProject().getId());
        assertEquals(testTask.getAssignee().getId(), foundTask.get().getAssignee().getId());
    }
    
    @Test
    void testFindByProject() {
        Task anotherTask = new Task();
        anotherTask.setProject(project);
        anotherTask.setTitle("Setup database");
        anotherTask.setDescription("Setup PostgreSQL database");
        anotherTask.setStatus(TaskStatus.IN_PROGRESS);
        anotherTask.setPriority(Priority.MEDIUM);
        anotherTask.setCreatedBy(owner);
        
        entityManager.persistAndFlush(testTask);
        entityManager.persistAndFlush(anotherTask);
        
        List<Task> tasks = taskRepository.findByProject(project);
        
        assertEquals(2, tasks.size());
        assertTrue(tasks.stream().anyMatch(t -> t.getTitle().equals("Implement user authentication")));
        assertTrue(tasks.stream().anyMatch(t -> t.getTitle().equals("Setup database")));
    }
    
    @Test
    void testFindByProjectId() {
        entityManager.persistAndFlush(testTask);
        
        List<Task> tasks = taskRepository.findByProjectId(project.getId());
        
        assertEquals(1, tasks.size());
        assertEquals("Implement user authentication", tasks.get(0).getTitle());
    }
    
    @Test
    void testFindByAssignee() {
        entityManager.persistAndFlush(testTask);
        
        List<Task> tasks = taskRepository.findByAssignee(assignee);
        
        assertEquals(1, tasks.size());
        assertEquals("Implement user authentication", tasks.get(0).getTitle());
    }
    
    @Test
    void testFindByAssigneeId() {
        entityManager.persistAndFlush(testTask);
        
        List<Task> tasks = taskRepository.findByAssigneeId(assignee.getId());
        
        assertEquals(1, tasks.size());
        assertEquals("Implement user authentication", tasks.get(0).getTitle());
    }
    
    @Test
    void testFindByStatus() {
        Task inProgressTask = new Task();
        inProgressTask.setProject(project);
        inProgressTask.setTitle("In Progress Task");
        inProgressTask.setDescription("A task in progress");
        inProgressTask.setStatus(TaskStatus.IN_PROGRESS);
        inProgressTask.setPriority(Priority.MEDIUM);
        inProgressTask.setCreatedBy(owner);
        
        entityManager.persistAndFlush(testTask);
        entityManager.persistAndFlush(inProgressTask);
        
        List<Task> todoTasks = taskRepository.findByStatus(TaskStatus.TODO);
        List<Task> inProgressTasks = taskRepository.findByStatus(TaskStatus.IN_PROGRESS);
        
        assertEquals(1, todoTasks.size());
        assertEquals(1, inProgressTasks.size());
        assertEquals("Implement user authentication", todoTasks.get(0).getTitle());
        assertEquals("In Progress Task", inProgressTasks.get(0).getTitle());
    }
    
    @Test
    void testFindByPriority() {
        Task lowPriorityTask = new Task();
        lowPriorityTask.setProject(project);
        lowPriorityTask.setTitle("Low Priority Task");
        lowPriorityTask.setDescription("A low priority task");
        lowPriorityTask.setStatus(TaskStatus.TODO);
        lowPriorityTask.setPriority(Priority.LOW);
        lowPriorityTask.setCreatedBy(owner);
        
        entityManager.persistAndFlush(testTask);
        entityManager.persistAndFlush(lowPriorityTask);
        
        List<Task> highPriorityTasks = taskRepository.findByPriority(Priority.HIGH);
        List<Task> lowPriorityTasks = taskRepository.findByPriority(Priority.LOW);
        
        assertEquals(1, highPriorityTasks.size());
        assertEquals(1, lowPriorityTasks.size());
        assertEquals("Implement user authentication", highPriorityTasks.get(0).getTitle());
        assertEquals("Low Priority Task", lowPriorityTasks.get(0).getTitle());
    }
    
    @Test
    void testFindByParentTask() {
        Task parentTask = new Task();
        parentTask.setProject(project);
        parentTask.setTitle("Parent Task");
        parentTask.setDescription("A parent task");
        parentTask.setStatus(TaskStatus.IN_PROGRESS);
        parentTask.setPriority(Priority.MEDIUM);
        parentTask.setCreatedBy(owner);
        parentTask = entityManager.persistAndFlush(parentTask);
        
        Task subtask = new Task();
        subtask.setProject(project);
        subtask.setParentTask(parentTask);
        subtask.setTitle("Subtask");
        subtask.setDescription("A subtask");
        subtask.setStatus(TaskStatus.TODO);
        subtask.setPriority(Priority.LOW);
        subtask.setCreatedBy(owner);
        
        entityManager.persistAndFlush(subtask);
        
        List<Task> subtasks = taskRepository.findByParentTask(parentTask);
        
        assertEquals(1, subtasks.size());
        assertEquals("Subtask", subtasks.get(0).getTitle());
        assertEquals(parentTask.getId(), subtasks.get(0).getParentTask().getId());
    }
    
    @Test
    void testFindByParentTaskIsNull() {
        Task parentTask = new Task();
        parentTask.setProject(project);
        parentTask.setTitle("Parent Task");
        parentTask.setDescription("A parent task");
        parentTask.setStatus(TaskStatus.IN_PROGRESS);
        parentTask.setPriority(Priority.MEDIUM);
        parentTask.setCreatedBy(owner);
        parentTask = entityManager.persistAndFlush(parentTask);
        
        Task subtask = new Task();
        subtask.setProject(project);
        subtask.setParentTask(parentTask);
        subtask.setTitle("Subtask");
        subtask.setDescription("A subtask");
        subtask.setStatus(TaskStatus.TODO);
        subtask.setPriority(Priority.LOW);
        subtask.setCreatedBy(owner);
        
        entityManager.persistAndFlush(testTask);
        entityManager.persistAndFlush(subtask);
        
        List<Task> rootTasks = taskRepository.findByParentTaskIsNull();
        
        assertEquals(2, rootTasks.size()); // testTask and parentTask
        assertTrue(rootTasks.stream().anyMatch(t -> t.getTitle().equals("Implement user authentication")));
        assertTrue(rootTasks.stream().anyMatch(t -> t.getTitle().equals("Parent Task")));
    }
    
    @Test
    void testFindByProjectAndStatus() {
        entityManager.persistAndFlush(testTask);
        
        List<Task> tasks = taskRepository.findByProjectAndStatus(project, TaskStatus.TODO);
        
        assertEquals(1, tasks.size());
        assertEquals("Implement user authentication", tasks.get(0).getTitle());
    }
    
    @Test
    void testFindByProjectAndAssignee() {
        entityManager.persistAndFlush(testTask);
        
        List<Task> tasks = taskRepository.findByProjectAndAssignee(project, assignee);
        
        assertEquals(1, tasks.size());
        assertEquals("Implement user authentication", tasks.get(0).getTitle());
    }
    
    @Test
    void testFindByTitleContainingIgnoreCase() {
        entityManager.persistAndFlush(testTask);
        
        List<Task> tasks = taskRepository.findByTitleContainingIgnoreCase("authentication");
        
        assertEquals(1, tasks.size());
        assertEquals("Implement user authentication", tasks.get(0).getTitle());
        
        List<Task> upperCaseTasks = taskRepository.findByTitleContainingIgnoreCase("AUTHENTICATION");
        assertEquals(1, upperCaseTasks.size());
    }
    
    @Test
    void testFindOverdueTasks() {
        Task overdueTask = new Task();
        overdueTask.setProject(project);
        overdueTask.setTitle("Overdue Task");
        overdueTask.setDescription("An overdue task");
        overdueTask.setStatus(TaskStatus.IN_PROGRESS);
        overdueTask.setPriority(Priority.HIGH);
        overdueTask.setDueDate(LocalDateTime.now().minusDays(5)); // Past due date
        overdueTask.setCreatedBy(owner);
        
        entityManager.persistAndFlush(testTask);
        entityManager.persistAndFlush(overdueTask);
        
        List<Task> overdueTasks = taskRepository.findOverdueTasks(LocalDateTime.now());
        
        assertEquals(1, overdueTasks.size());
        assertEquals("Overdue Task", overdueTasks.get(0).getTitle());
    }
    
    @Test
    void testFindTasksDueBetween() {
        LocalDateTime startRange = LocalDateTime.now().plusDays(5);
        LocalDateTime endRange = LocalDateTime.now().plusDays(10);
        
        entityManager.persistAndFlush(testTask);
        
        List<Task> tasks = taskRepository.findTasksDueBetween(startRange, endRange);
        
        assertEquals(1, tasks.size());
        assertEquals("Implement user authentication", tasks.get(0).getTitle());
    }
    
    @Test
    void testFindByAssigneeIdAndStatus() {
        entityManager.persistAndFlush(testTask);
        
        List<Task> tasks = taskRepository.findByAssigneeIdAndStatus(assignee.getId(), TaskStatus.TODO);
        
        assertEquals(1, tasks.size());
        assertEquals("Implement user authentication", tasks.get(0).getTitle());
    }
    
    @Test
    void testFindTasksByCriteria() {
        entityManager.persistAndFlush(testTask);
        
        Page<Task> tasks = taskRepository.findTasksByCriteria(
            project.getId(), assignee.getId(), TaskStatus.TODO, Priority.HIGH, PageRequest.of(0, 10)
        );
        
        assertEquals(1, tasks.getTotalElements());
        assertEquals("Implement user authentication", tasks.getContent().get(0).getTitle());
    }
    
    @Test
    void testCountByProjectAndStatus() {
        Task anotherTask = new Task();
        anotherTask.setProject(project);
        anotherTask.setTitle("Another Task");
        anotherTask.setDescription("Another task");
        anotherTask.setStatus(TaskStatus.IN_PROGRESS);
        anotherTask.setPriority(Priority.MEDIUM);
        anotherTask.setCreatedBy(owner);
        
        entityManager.persistAndFlush(testTask);
        entityManager.persistAndFlush(anotherTask);
        
        long todoCount = taskRepository.countByProjectAndStatus(project, TaskStatus.TODO);
        long inProgressCount = taskRepository.countByProjectAndStatus(project, TaskStatus.IN_PROGRESS);
        
        assertEquals(1, todoCount);
        assertEquals(1, inProgressCount);
    }
    
    @Test
    void testFindHighPriorityTasksByProjectId() {
        Task criticalTask = new Task();
        criticalTask.setProject(project);
        criticalTask.setTitle("Critical Task");
        criticalTask.setDescription("A critical task");
        criticalTask.setStatus(TaskStatus.TODO);
        criticalTask.setPriority(Priority.CRITICAL);
        criticalTask.setCreatedBy(owner);
        
        Task lowTask = new Task();
        lowTask.setProject(project);
        lowTask.setTitle("Low Priority Task");
        lowTask.setDescription("A low priority task");
        lowTask.setStatus(TaskStatus.TODO);
        lowTask.setPriority(Priority.LOW);
        lowTask.setCreatedBy(owner);
        
        entityManager.persistAndFlush(testTask);
        entityManager.persistAndFlush(criticalTask);
        entityManager.persistAndFlush(lowTask);
        
        List<Task> highPriorityTasks = taskRepository.findHighPriorityTasksByProjectId(project.getId());
        
        assertEquals(2, highPriorityTasks.size());
        assertTrue(highPriorityTasks.stream().anyMatch(t -> t.getTitle().equals("Implement user authentication")));
        assertTrue(highPriorityTasks.stream().anyMatch(t -> t.getTitle().equals("Critical Task")));
    }
    
    @Test
    void testFindUnassignedTasksByProjectId() {
        Task unassignedTask = new Task();
        unassignedTask.setProject(project);
        unassignedTask.setTitle("Unassigned Task");
        unassignedTask.setDescription("A task without assignee");
        unassignedTask.setStatus(TaskStatus.TODO);
        unassignedTask.setPriority(Priority.MEDIUM);
        unassignedTask.setCreatedBy(owner);
        // No assignee set
        
        entityManager.persistAndFlush(testTask);
        entityManager.persistAndFlush(unassignedTask);
        
        List<Task> unassignedTasks = taskRepository.findUnassignedTasksByProjectId(project.getId());
        
        assertEquals(1, unassignedTasks.size());
        assertEquals("Unassigned Task", unassignedTasks.get(0).getTitle());
        assertNull(unassignedTasks.get(0).getAssignee());
    }
}