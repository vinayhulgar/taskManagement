package com.taskmanagement.service;

import com.taskmanagement.dto.TaskCreateRequest;
import com.taskmanagement.dto.TaskFilterRequest;
import com.taskmanagement.dto.TaskResponse;
import com.taskmanagement.dto.TaskUpdateRequest;
import com.taskmanagement.entity.*;
import com.taskmanagement.repository.ProjectRepository;
import com.taskmanagement.repository.TaskRepository;
import com.taskmanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Test class for TaskService
 */
@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TaskService taskService;

    private UUID projectId;
    private UUID taskId;
    private UUID userId;
    private UUID assigneeId;
    private Project project;
    private Task task;
    private User user;
    private User assignee;
    private TaskCreateRequest taskCreateRequest;
    private TaskUpdateRequest taskUpdateRequest;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        taskId = UUID.randomUUID();
        userId = UUID.randomUUID();
        assigneeId = UUID.randomUUID();

        // Create test entities
        user = new User();
        user.setId(userId);
        user.setEmail("test@example.com");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(Role.MEMBER);

        assignee = new User();
        assignee.setId(assigneeId);
        assignee.setEmail("assignee@example.com");
        assignee.setFirstName("Assignee");
        assignee.setLastName("User");
        assignee.setRole(Role.MEMBER);

        project = new Project();
        project.setId(projectId);
        project.setName("Test Project");
        project.setDescription("Test Description");
        project.setStatus(ProjectStatus.ACTIVE);

        task = new Task();
        task.setId(taskId);
        task.setProject(project);
        task.setTitle("Test Task");
        task.setDescription("Test Description");
        task.setStatus(TaskStatus.TODO);
        task.setPriority(Priority.MEDIUM);
        task.setAssignee(assignee);
        task.setCreatedBy(user);
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());

        // Create test DTOs
        taskCreateRequest = new TaskCreateRequest();
        taskCreateRequest.setTitle("New Task");
        taskCreateRequest.setDescription("New Task Description");
        taskCreateRequest.setStatus(TaskStatus.TODO);
        taskCreateRequest.setPriority(Priority.HIGH);
        taskCreateRequest.setAssigneeId(assigneeId);
        taskCreateRequest.setDueDate(LocalDateTime.now().plusDays(7));

        taskUpdateRequest = new TaskUpdateRequest();
        taskUpdateRequest.setTitle("Updated Task");
        taskUpdateRequest.setDescription("Updated Description");
        taskUpdateRequest.setStatus(TaskStatus.IN_PROGRESS);
        taskUpdateRequest.setPriority(Priority.HIGH);
    }

    @Test
    void createTask_Success() {
        // Arrange
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.findById(assigneeId)).thenReturn(Optional.of(assignee));
        when(taskRepository.save(any(Task.class))).thenReturn(task);
        when(taskRepository.findByParentTask(any(Task.class))).thenReturn(Arrays.asList());

        // Act
        TaskResponse result = taskService.createTask(projectId, taskCreateRequest, userId);

        // Assert
        assertNotNull(result);
        assertEquals(taskId, result.getId());
        assertEquals(projectId, result.getProjectId());
        assertEquals("Test Task", result.getTitle());
        assertEquals(TaskStatus.TODO, result.getStatus());
        assertEquals(Priority.MEDIUM, result.getPriority());

        verify(taskRepository).save(any(Task.class));
    }

    @Test
    void createTask_ProjectNotFound_ThrowsException() {
        // Arrange
        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                taskService.createTask(projectId, taskCreateRequest, userId));

        assertEquals("Project not found", exception.getMessage());
        verify(taskRepository, never()).save(any(Task.class));
    }

    @Test
    void createTask_DueDateInPast_ThrowsException() {
        // Arrange
        taskCreateRequest.setDueDate(LocalDateTime.now().minusDays(1));
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                taskService.createTask(projectId, taskCreateRequest, userId));

        assertEquals("Due date cannot be in the past", exception.getMessage());
    }

    @Test
    void createTask_AssigneeNotFound_ThrowsException() {
        // Arrange
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.findById(assigneeId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                taskService.createTask(projectId, taskCreateRequest, userId));

        assertEquals("Assignee not found", exception.getMessage());
    }

    @Test
    void getTaskById_Success() {
        // Arrange
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(taskRepository.findByParentTask(any(Task.class))).thenReturn(Arrays.asList());

        // Act
        TaskResponse result = taskService.getTaskById(taskId, userId);

        // Assert
        assertNotNull(result);
        assertEquals(taskId, result.getId());
        assertEquals("Test Task", result.getTitle());
    }

    @Test
    void getTaskById_TaskNotFound_ThrowsException() {
        // Arrange
        when(taskRepository.findById(taskId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                taskService.getTaskById(taskId, userId));

        assertEquals("Task not found", exception.getMessage());
    }

    @Test
    void getTasksByProject_Success() {
        // Arrange
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(taskRepository.findByProjectId(projectId)).thenReturn(Arrays.asList(task));
        when(taskRepository.findByParentTask(any(Task.class))).thenReturn(Arrays.asList());

        // Act
        List<TaskResponse> result = taskService.getTasksByProject(projectId, userId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(taskId, result.get(0).getId());
    }

    @Test
    void updateTask_Success() {
        // Arrange
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(taskRepository.save(any(Task.class))).thenReturn(task);
        when(taskRepository.findByParentTask(any(Task.class))).thenReturn(Arrays.asList());

        // Act
        TaskResponse result = taskService.updateTask(taskId, taskUpdateRequest, userId);

        // Assert
        assertNotNull(result);
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    void updateTask_TaskNotFound_ThrowsException() {
        // Arrange
        when(taskRepository.findById(taskId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                taskService.updateTask(taskId, taskUpdateRequest, userId));

        assertEquals("Task not found", exception.getMessage());
    }

    @Test
    void deleteTask_Success() {
        // Arrange
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(taskRepository.findByParentTask(task)).thenReturn(Arrays.asList());

        // Act
        taskService.deleteTask(taskId, userId);

        // Assert
        verify(taskRepository).delete(task);
    }

    @Test
    void deleteTask_HasSubtasks_ThrowsException() {
        // Arrange
        Task subtask = new Task();
        subtask.setId(UUID.randomUUID());
        subtask.setParentTask(task);

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(taskRepository.findByParentTask(task)).thenReturn(Arrays.asList(subtask));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                taskService.deleteTask(taskId, userId));

        assertEquals("Cannot delete task with subtasks. Delete subtasks first.", exception.getMessage());
        verify(taskRepository, never()).delete(any(Task.class));
    }

    @Test
    void getMyTasks_Success() {
        // Arrange
        when(taskRepository.findByAssigneeId(userId)).thenReturn(Arrays.asList(task));
        when(taskRepository.findByParentTask(any(Task.class))).thenReturn(Arrays.asList());

        // Act
        List<TaskResponse> result = taskService.getMyTasks(userId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(taskId, result.get(0).getId());
    }

    @Test
    void searchTasks_Success() {
        // Arrange
        TaskFilterRequest filter = new TaskFilterRequest();
        filter.setSearchTerm("test");
        filter.setStatus(TaskStatus.TODO);

        Page<Task> taskPage = new PageImpl<>(Arrays.asList(task));
        when(taskRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(taskPage);
        when(taskRepository.findByParentTask(any(Task.class))).thenReturn(Arrays.asList());

        // Act
        var result = taskService.searchTasks(filter, 0, 20, userId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTasks().size());
        assertEquals(0, result.getPage());
        assertEquals(1, result.getSize()); // PageImpl sets size to actual content size
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void getOverdueTasks_Success() {
        // Arrange
        when(taskRepository.findOverdueTasks(any(LocalDateTime.class))).thenReturn(Arrays.asList(task));
        when(taskRepository.findByParentTask(any(Task.class))).thenReturn(Arrays.asList());

        // Act
        List<TaskResponse> result = taskService.getOverdueTasks(userId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(taskId, result.get(0).getId());
    }

    @Test
    void searchTasksByText_Success() {
        // Arrange
        when(taskRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList(task));
        when(taskRepository.findByParentTask(any(Task.class))).thenReturn(Arrays.asList());

        // Act
        List<TaskResponse> result = taskService.searchTasksByText("test", userId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(taskId, result.get(0).getId());
    }

    @Test
    void searchTasksByText_EmptySearchTerm_ReturnsEmptyList() {
        // Act
        List<TaskResponse> result = taskService.searchTasksByText("", userId);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(taskRepository, never()).findAll(any(Specification.class));
    }
}