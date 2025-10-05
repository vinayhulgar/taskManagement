package com.taskmanagement.repository;

import com.taskmanagement.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test class for TaskRepository
 */
@DataJpaTest
class TaskRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private TaskRepository taskRepository;

    private User user;
    private User assignee;
    private Team team;
    private Project project;
    private Task parentTask;
    private Task childTask;

    @BeforeEach
    void setUp() {
        // Create test user
        user = new User();
        user.setEmail("test@example.com");
        user.setPasswordHash("hashedPassword");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(Role.MEMBER);
        user = entityManager.persistAndFlush(user);

        // Create assignee
        assignee = new User();
        assignee.setEmail("assignee@example.com");
        assignee.setPasswordHash("hashedPassword");
        assignee.setFirstName("Assignee");
        assignee.setLastName("User");
        assignee.setRole(Role.MEMBER);
        assignee = entityManager.persistAndFlush(assignee);

        // Create team
        team = new Team();
        team.setName("Test Team");
        team.setDescription("Test Description");
        team.setOwner(user);
        team = entityManager.persistAndFlush(team);

        // Create project
        project = new Project();
        project.setTeam(team);
        project.setName("Test Project");
        project.setDescription("Test Description");
        project.setStatus(ProjectStatus.ACTIVE);
        project.setCreatedBy(user);
        project = entityManager.persistAndFlush(project);

        // Create parent task
        parentTask = new Task();
        parentTask.setProject(project);
        parentTask.setTitle("Parent Task");
        parentTask.setDescription("Parent Description");
        parentTask.setStatus(TaskStatus.TODO);
        parentTask.setPriority(Priority.HIGH);
        parentTask.setAssignee(assignee);
        parentTask.setCreatedBy(user);
        parentTask.setDueDate(LocalDateTime.now().plusDays(7));
        parentTask = entityManager.persistAndFlush(parentTask);

        // Create child task
        childTask = new Task();
        childTask.setProject(project);
        childTask.setParentTask(parentTask);
        childTask.setTitle("Child Task");
        childTask.setDescription("Child Description");
        childTask.setStatus(TaskStatus.IN_PROGRESS);
        childTask.setPriority(Priority.MEDIUM);
        childTask.setAssignee(assignee);
        childTask.setCreatedBy(user);
        childTask.setDueDate(LocalDateTime.now().plusDays(3));
        childTask = entityManager.persistAndFlush(childTask);

        entityManager.clear();
    }

    @Test
    void findByProject_Success() {
        // Act
        List<Task> tasks = taskRepository.findByProject(project);

        // Assert
        assertEquals(2, tasks.size());
        assertTrue(tasks.stream().anyMatch(t -> t.getTitle().equals("Parent Task")));
        assertTrue(tasks.stream().anyMatch(t -> t.getTitle().equals("Child Task")));
    }

    @Test
    void findByProjectId_Success() {
        // Act
        List<Task> tasks = taskRepository.findByProjectId(project.getId());

        // Assert
        assertEquals(2, tasks.size());
    }

    @Test
    void findByAssignee_Success() {
        // Act
        List<Task> tasks = taskRepository.findByAssignee(assignee);

        // Assert
        assertEquals(2, tasks.size());
        assertTrue(tasks.stream().allMatch(t -> t.getAssignee().getId().equals(assignee.getId())));
    }

    @Test
    void findByAssigneeId_Success() {
        // Act
        List<Task> tasks = taskRepository.findByAssigneeId(assignee.getId());

        // Assert
        assertEquals(2, tasks.size());
    }

    @Test
    void findByStatus_Success() {
        // Act
        List<Task> todoTasks = taskRepository.findByStatus(TaskStatus.TODO);
        List<Task> inProgressTasks = taskRepository.findByStatus(TaskStatus.IN_PROGRESS);

        // Assert
        assertEquals(1, todoTasks.size());
        assertEquals("Parent Task", todoTasks.get(0).getTitle());
        
        assertEquals(1, inProgressTasks.size());
        assertEquals("Child Task", inProgressTasks.get(0).getTitle());
    }

    @Test
    void findByPriority_Success() {
        // Act
        List<Task> highPriorityTasks = taskRepository.findByPriority(Priority.HIGH);
        List<Task> mediumPriorityTasks = taskRepository.findByPriority(Priority.MEDIUM);

        // Assert
        assertEquals(1, highPriorityTasks.size());
        assertEquals("Parent Task", highPriorityTasks.get(0).getTitle());
        
        assertEquals(1, mediumPriorityTasks.size());
        assertEquals("Child Task", mediumPriorityTasks.get(0).getTitle());
    }

    @Test
    void findByParentTask_Success() {
        // Act
        List<Task> subtasks = taskRepository.findByParentTask(parentTask);

        // Assert
        assertEquals(1, subtasks.size());
        assertEquals("Child Task", subtasks.get(0).getTitle());
        assertEquals(parentTask.getId(), subtasks.get(0).getParentTask().getId());
    }

    @Test
    void findByParentTaskIsNull_Success() {
        // Act
        List<Task> rootTasks = taskRepository.findByParentTaskIsNull();

        // Assert
        assertEquals(1, rootTasks.size());
        assertEquals("Parent Task", rootTasks.get(0).getTitle());
        assertNull(rootTasks.get(0).getParentTask());
    }

    @Test
    void findByProjectAndStatus_Success() {
        // Act
        List<Task> todoTasks = taskRepository.findByProjectAndStatus(project, TaskStatus.TODO);

        // Assert
        assertEquals(1, todoTasks.size());
        assertEquals("Parent Task", todoTasks.get(0).getTitle());
    }

    @Test
    void findByProjectAndAssignee_Success() {
        // Act
        List<Task> assigneeTasks = taskRepository.findByProjectAndAssignee(project, assignee);

        // Assert
        assertEquals(2, assigneeTasks.size());
    }

    @Test
    void findByTitleContainingIgnoreCase_Success() {
        // Act
        List<Task> tasks = taskRepository.findByTitleContainingIgnoreCase("parent");

        // Assert
        assertEquals(1, tasks.size());
        assertEquals("Parent Task", tasks.get(0).getTitle());
    }

    @Test
    void findOverdueTasks_Success() {
        // Create an overdue task
        Task overdueTask = new Task();
        overdueTask.setProject(project);
        overdueTask.setTitle("Overdue Task");
        overdueTask.setDescription("Overdue Description");
        overdueTask.setStatus(TaskStatus.TODO);
        overdueTask.setPriority(Priority.CRITICAL);
        overdueTask.setAssignee(assignee);
        overdueTask.setCreatedBy(user);
        overdueTask.setDueDate(LocalDateTime.now().minusDays(1)); // Past due date
        entityManager.persistAndFlush(overdueTask);

        // Act
        List<Task> overdueTasks = taskRepository.findOverdueTasks(LocalDateTime.now());

        // Assert
        assertEquals(1, overdueTasks.size());
        assertEquals("Overdue Task", overdueTasks.get(0).getTitle());
    }

    @Test
    void findTasksDueBetween_Success() {
        // Act
        LocalDateTime startDate = LocalDateTime.now().plusDays(2);
        LocalDateTime endDate = LocalDateTime.now().plusDays(5);
        List<Task> tasksDueBetween = taskRepository.findTasksDueBetween(startDate, endDate);

        // Assert
        assertEquals(1, tasksDueBetween.size());
        assertEquals("Child Task", tasksDueBetween.get(0).getTitle());
    }

    @Test
    void findByAssigneeIdAndStatus_Success() {
        // Act
        List<Task> tasks = taskRepository.findByAssigneeIdAndStatus(assignee.getId(), TaskStatus.TODO);

        // Assert
        assertEquals(1, tasks.size());
        assertEquals("Parent Task", tasks.get(0).getTitle());
    }

    @Test
    void findTasksByCriteria_Success() {
        // Act
        Pageable pageable = PageRequest.of(0, 10);
        Page<Task> taskPage = taskRepository.findTasksByCriteria(
                project.getId(), assignee.getId(), TaskStatus.TODO, Priority.HIGH, pageable);

        // Assert
        assertEquals(1, taskPage.getTotalElements());
        assertEquals("Parent Task", taskPage.getContent().get(0).getTitle());
    }

    @Test
    void countByProjectAndStatus_Success() {
        // Act
        long todoCount = taskRepository.countByProjectAndStatus(project, TaskStatus.TODO);
        long inProgressCount = taskRepository.countByProjectAndStatus(project, TaskStatus.IN_PROGRESS);

        // Assert
        assertEquals(1, todoCount);
        assertEquals(1, inProgressCount);
    }

    @Test
    void countByAssigneeAndStatus_Success() {
        // Act
        long todoCount = taskRepository.countByAssigneeAndStatus(assignee, TaskStatus.TODO);

        // Assert
        assertEquals(1, todoCount);
    }

    @Test
    void findHighPriorityTasksByProjectId_Success() {
        // Act
        List<Task> highPriorityTasks = taskRepository.findHighPriorityTasksByProjectId(project.getId());

        // Assert
        assertEquals(1, highPriorityTasks.size());
        assertEquals("Parent Task", highPriorityTasks.get(0).getTitle());
        assertEquals(Priority.HIGH, highPriorityTasks.get(0).getPriority());
    }

    @Test
    void findByCreatedBy_Success() {
        // Act
        List<Task> tasks = taskRepository.findByCreatedBy(user);

        // Assert
        assertEquals(2, tasks.size());
        assertTrue(tasks.stream().allMatch(t -> t.getCreatedBy().getId().equals(user.getId())));
    }

    @Test
    void findUnassignedTasksByProjectId_Success() {
        // Create an unassigned task
        Task unassignedTask = new Task();
        unassignedTask.setProject(project);
        unassignedTask.setTitle("Unassigned Task");
        unassignedTask.setDescription("Unassigned Description");
        unassignedTask.setStatus(TaskStatus.TODO);
        unassignedTask.setPriority(Priority.LOW);
        unassignedTask.setCreatedBy(user);
        // No assignee set
        entityManager.persistAndFlush(unassignedTask);

        // Act
        List<Task> unassignedTasks = taskRepository.findUnassignedTasksByProjectId(project.getId());

        // Assert
        assertEquals(1, unassignedTasks.size());
        assertEquals("Unassigned Task", unassignedTasks.get(0).getTitle());
        assertNull(unassignedTasks.get(0).getAssignee());
    }
}