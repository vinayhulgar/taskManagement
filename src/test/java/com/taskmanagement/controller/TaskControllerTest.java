package com.taskmanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskmanagement.dto.*;
import com.taskmanagement.entity.Priority;
import com.taskmanagement.entity.TaskStatus;
import com.taskmanagement.service.CommentService;
import com.taskmanagement.service.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Test class for TaskController
 */
@WebMvcTest(TaskController.class)
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TaskService taskService;

    @MockBean
    private CommentService commentService;

    @Autowired
    private ObjectMapper objectMapper;

    private UUID projectId;
    private UUID taskId;
    private UUID userId;
    private TaskResponse taskResponse;
    private TaskCreateRequest taskCreateRequest;
    private TaskUpdateRequest taskUpdateRequest;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        taskId = UUID.randomUUID();
        userId = UUID.randomUUID();

        // Create test data
        UserResponse userResponse = new UserResponse();
        userResponse.setId(userId);
        userResponse.setEmail("test@example.com");
        userResponse.setFirstName("Test");
        userResponse.setLastName("User");

        taskResponse = new TaskResponse();
        taskResponse.setId(taskId);
        taskResponse.setProjectId(projectId);
        taskResponse.setProjectName("Test Project");
        taskResponse.setTitle("Test Task");
        taskResponse.setDescription("Test Description");
        taskResponse.setStatus(TaskStatus.TODO);
        taskResponse.setPriority(Priority.MEDIUM);
        taskResponse.setAssignee(userResponse);
        taskResponse.setCreatedBy(userResponse);
        taskResponse.setCreatedAt(LocalDateTime.now());
        taskResponse.setUpdatedAt(LocalDateTime.now());

        taskCreateRequest = new TaskCreateRequest();
        taskCreateRequest.setTitle("New Task");
        taskCreateRequest.setDescription("New Task Description");
        taskCreateRequest.setStatus(TaskStatus.TODO);
        taskCreateRequest.setPriority(Priority.HIGH);
        taskCreateRequest.setAssigneeId(userId);
        taskCreateRequest.setDueDate(LocalDateTime.now().plusDays(7));

        taskUpdateRequest = new TaskUpdateRequest();
        taskUpdateRequest.setTitle("Updated Task");
        taskUpdateRequest.setDescription("Updated Description");
        taskUpdateRequest.setStatus(TaskStatus.IN_PROGRESS);
        taskUpdateRequest.setPriority(Priority.HIGH);
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"MEMBER"})
    void createTask_Success() throws Exception {
        when(taskService.createTask(eq(projectId), any(TaskCreateRequest.class), any(UUID.class)))
                .thenReturn(taskResponse);

        mockMvc.perform(post("/api/v1/projects/{projectId}/tasks", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(taskCreateRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(taskId.toString()))
                .andExpect(jsonPath("$.title").value(taskResponse.getTitle()))
                .andExpect(jsonPath("$.status").value(taskResponse.getStatus().toString()))
                .andExpect(jsonPath("$.priority").value(taskResponse.getPriority().toString()));
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"MEMBER"})
    void createTask_InvalidData_BadRequest() throws Exception {
        TaskCreateRequest invalidRequest = new TaskCreateRequest();
        invalidRequest.setTitle(""); // Invalid: empty title
        invalidRequest.setStatus(TaskStatus.TODO);
        invalidRequest.setPriority(Priority.MEDIUM);

        mockMvc.perform(post("/api/v1/projects/{projectId}/tasks", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"MEMBER"})
    void getProjectTasks_Success() throws Exception {
        List<TaskResponse> tasks = Arrays.asList(taskResponse);
        when(taskService.getTasksByProject(eq(projectId), any(UUID.class)))
                .thenReturn(tasks);

        mockMvc.perform(get("/api/v1/projects/{projectId}/tasks", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(taskId.toString()))
                .andExpect(jsonPath("$[0].title").value(taskResponse.getTitle()));
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"MEMBER"})
    void getTask_Success() throws Exception {
        when(taskService.getTaskById(eq(taskId), any(UUID.class)))
                .thenReturn(taskResponse);

        mockMvc.perform(get("/api/v1/tasks/{taskId}", taskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(taskId.toString()))
                .andExpect(jsonPath("$.title").value(taskResponse.getTitle()));
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"MEMBER"})
    void getTask_NotFound() throws Exception {
        when(taskService.getTaskById(eq(taskId), any(UUID.class)))
                .thenThrow(new RuntimeException("Task not found"));

        mockMvc.perform(get("/api/v1/tasks/{taskId}", taskId))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"MEMBER"})
    void updateTask_Success() throws Exception {
        TaskResponse updatedResponse = new TaskResponse();
        updatedResponse.setId(taskId);
        updatedResponse.setTitle("Updated Task");
        updatedResponse.setStatus(TaskStatus.IN_PROGRESS);

        when(taskService.updateTask(eq(taskId), any(TaskUpdateRequest.class), any(UUID.class)))
                .thenReturn(updatedResponse);

        mockMvc.perform(put("/api/v1/tasks/{taskId}", taskId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(taskUpdateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(taskId.toString()))
                .andExpect(jsonPath("$.title").value("Updated Task"))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"MEMBER"})
    void deleteTask_Success() throws Exception {
        mockMvc.perform(delete("/api/v1/tasks/{taskId}", taskId)
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"MEMBER"})
    void getSubtasks_Success() throws Exception {
        List<TaskResponse> subtasks = Arrays.asList(taskResponse);
        when(taskService.getSubtasks(eq(taskId), any(UUID.class)))
                .thenReturn(subtasks);

        mockMvc.perform(get("/api/v1/tasks/{taskId}/subtasks", taskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(taskId.toString()));
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"MEMBER"})
    void getMyTasks_Success() throws Exception {
        List<TaskResponse> myTasks = Arrays.asList(taskResponse);
        when(taskService.getMyTasks(any(UUID.class)))
                .thenReturn(myTasks);

        mockMvc.perform(get("/api/v1/tasks/my-tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(taskId.toString()));
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"MEMBER"})
    void searchTasks_Success() throws Exception {
        PagedTaskResponse pagedResponse = new PagedTaskResponse();
        pagedResponse.setTasks(Arrays.asList(taskResponse));
        pagedResponse.setPage(0);
        pagedResponse.setSize(20);
        pagedResponse.setTotalElements(1);
        pagedResponse.setTotalPages(1);

        when(taskService.searchTasks(any(TaskFilterRequest.class), eq(0), eq(20), any(UUID.class)))
                .thenReturn(pagedResponse);

        mockMvc.perform(get("/api/v1/tasks/search")
                        .param("searchTerm", "test")
                        .param("status", "TODO")
                        .param("priority", "HIGH")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasks").isArray())
                .andExpect(jsonPath("$.tasks[0].id").value(taskId.toString()))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"MEMBER"})
    void getOverdueTasks_Success() throws Exception {
        List<TaskResponse> overdueTasks = Arrays.asList(taskResponse);
        when(taskService.getOverdueTasks(any(UUID.class)))
                .thenReturn(overdueTasks);

        mockMvc.perform(get("/api/v1/tasks/overdue"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(taskId.toString()));
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"MEMBER"})
    void searchTasksByText_Success() throws Exception {
        List<TaskResponse> searchResults = Arrays.asList(taskResponse);
        when(taskService.searchTasksByText(eq("test"), any(UUID.class)))
                .thenReturn(searchResults);

        mockMvc.perform(get("/api/v1/tasks/search-text")
                        .param("searchTerm", "test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(taskId.toString()));
    }

    @Test
    void createTask_Unauthorized() throws Exception {
        mockMvc.perform(post("/api/v1/projects/{projectId}/tasks", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(taskCreateRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"GUEST"})
    void createTask_Forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/projects/{projectId}/tasks", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(taskCreateRequest)))
                .andExpect(status().isForbidden());
    }
}