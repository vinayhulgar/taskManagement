package com.taskmanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskmanagement.dto.*;
import com.taskmanagement.entity.ProjectStatus;
import com.taskmanagement.entity.Role;
import com.taskmanagement.service.ProjectService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for ProjectController
 */
@WebMvcTest(ProjectController.class)
class ProjectControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private ProjectService projectService;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    private UUID teamId;
    private UUID projectId;
    private UUID userId;
    private ProjectCreateRequest createRequest;
    private ProjectUpdateRequest updateRequest;
    private ProjectResponse projectResponse;
    private ProjectMemberAssignRequest assignRequest;
    private ProjectMemberResponse memberResponse;
    
    @BeforeEach
    void setUp() {
        teamId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        userId = UUID.randomUUID();
        
        createRequest = new ProjectCreateRequest(
                "Test Project",
                "Test Description",
                ProjectStatus.PLANNING,
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(30)
        );
        
        updateRequest = new ProjectUpdateRequest(
                "Updated Project",
                "Updated Description",
                ProjectStatus.ACTIVE,
                LocalDate.now().plusDays(2),
                LocalDate.now().plusDays(35)
        );
        
        UserResponse userResponse = new UserResponse(
                userId,
                "test@example.com",
                "John",
                "Doe",
                Role.MANAGER,
                LocalDateTime.now(),
                LocalDateTime.now(),
                LocalDateTime.now()
        );
        
        TeamResponse teamResponse = new TeamResponse(
                teamId,
                "Test Team",
                "Test Description",
                userResponse,
                LocalDateTime.now(),
                LocalDateTime.now()
        );
        
        projectResponse = new ProjectResponse(
                projectId,
                "Test Project",
                "Test Description",
                ProjectStatus.PLANNING,
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(30),
                teamResponse,
                userResponse,
                LocalDateTime.now(),
                LocalDateTime.now()
        );
        
        assignRequest = new ProjectMemberAssignRequest("assignee@example.com");
        
        memberResponse = new ProjectMemberResponse(
                UUID.randomUUID(),
                userResponse,
                userResponse,
                LocalDateTime.now()
        );
    }
    
    @Test
    @WithMockUser(username = "test@example.com", roles = {"MANAGER"})
    void createProject_Success() throws Exception {
        // Arrange
        when(projectService.createProject(eq(teamId), any(ProjectCreateRequest.class), eq("test@example.com")))
                .thenReturn(projectResponse);
        
        // Act & Assert
        mockMvc.perform(post("/api/v1/teams/{teamId}/projects", teamId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(projectId.toString()))
                .andExpect(jsonPath("$.name").value("Test Project"))
                .andExpect(jsonPath("$.description").value("Test Description"))
                .andExpect(jsonPath("$.status").value("PLANNING"));
        
        verify(projectService).createProject(eq(teamId), any(ProjectCreateRequest.class), eq("test@example.com"));
    }
    
    @Test
    @WithMockUser(username = "test@example.com", roles = {"MANAGER"})
    void createProject_InvalidRequest() throws Exception {
        // Arrange
        createRequest.setName(""); // Invalid name
        
        // Act & Assert
        mockMvc.perform(post("/api/v1/teams/{teamId}/projects", teamId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isBadRequest());
        
        verify(projectService, never()).createProject(any(), any(), any());
    }
    
    @Test
    @WithMockUser(username = "test@example.com", roles = {"MANAGER"})
    void createProject_DuplicateName() throws Exception {
        // Arrange
        when(projectService.createProject(eq(teamId), any(ProjectCreateRequest.class), eq("test@example.com")))
                .thenThrow(new IllegalArgumentException("Project name already exists within this team"));
        
        // Act & Assert
        mockMvc.perform(post("/api/v1/teams/{teamId}/projects", teamId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    @WithMockUser(username = "test@example.com", roles = {"MEMBER"})
    void getTeamProjects_Success() throws Exception {
        // Arrange
        List<ProjectResponse> projects = Arrays.asList(projectResponse);
        when(projectService.getTeamProjects(teamId)).thenReturn(projects);
        
        // Act & Assert
        mockMvc.perform(get("/api/v1/teams/{teamId}/projects", teamId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(projectId.toString()))
                .andExpect(jsonPath("$[0].name").value("Test Project"));
        
        verify(projectService).getTeamProjects(teamId);
    }
    
    @Test
    @WithMockUser(username = "test@example.com", roles = {"MEMBER"})
    void getTeamProjects_WithStatusFilter() throws Exception {
        // Arrange
        List<ProjectResponse> projects = Arrays.asList(projectResponse);
        when(projectService.getTeamProjectsByStatus(teamId, ProjectStatus.PLANNING)).thenReturn(projects);
        
        // Act & Assert
        mockMvc.perform(get("/api/v1/teams/{teamId}/projects", teamId)
                        .param("status", "PLANNING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].status").value("PLANNING"));
        
        verify(projectService).getTeamProjectsByStatus(teamId, ProjectStatus.PLANNING);
    }
    
    @Test
    @WithMockUser(username = "test@example.com", roles = {"MEMBER"})
    void getProjectById_Success() throws Exception {
        // Arrange
        when(projectService.getProjectById(projectId)).thenReturn(projectResponse);
        
        // Act & Assert
        mockMvc.perform(get("/api/v1/projects/{id}", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(projectId.toString()))
                .andExpect(jsonPath("$.name").value("Test Project"));
        
        verify(projectService).getProjectById(projectId);
    }
    
    @Test
    @WithMockUser(username = "test@example.com", roles = {"MEMBER"})
    void getProjectById_NotFound() throws Exception {
        // Arrange
        when(projectService.getProjectById(projectId))
                .thenThrow(new IllegalArgumentException("Project not found"));
        
        // Act & Assert
        mockMvc.perform(get("/api/v1/projects/{id}", projectId))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    @WithMockUser(username = "test@example.com", roles = {"MANAGER"})
    void updateProject_Success() throws Exception {
        // Arrange
        when(projectService.updateProject(eq(projectId), any(ProjectUpdateRequest.class)))
                .thenReturn(projectResponse);
        
        // Act & Assert
        mockMvc.perform(put("/api/v1/projects/{id}", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(projectId.toString()));
        
        verify(projectService).updateProject(eq(projectId), any(ProjectUpdateRequest.class));
    }
    
    @Test
    @WithMockUser(username = "test@example.com", roles = {"MANAGER"})
    void updateProject_InvalidStatusTransition() throws Exception {
        // Arrange
        when(projectService.updateProject(eq(projectId), any(ProjectUpdateRequest.class)))
                .thenThrow(new IllegalArgumentException("Invalid status transition"));
        
        // Act & Assert
        mockMvc.perform(put("/api/v1/projects/{id}", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    @WithMockUser(username = "test@example.com", roles = {"MANAGER"})
    void deleteProject_Success() throws Exception {
        // Arrange
        doNothing().when(projectService).deleteProject(projectId);
        
        // Act & Assert
        mockMvc.perform(delete("/api/v1/projects/{id}", projectId)
                        .with(csrf()))
                .andExpect(status().isNoContent());
        
        verify(projectService).deleteProject(projectId);
    }
    
    @Test
    @WithMockUser(username = "test@example.com", roles = {"MEMBER"})
    void getOverdueProjects_Success() throws Exception {
        // Arrange
        List<ProjectResponse> overdueProjects = Arrays.asList(projectResponse);
        when(projectService.getOverdueProjects(teamId)).thenReturn(overdueProjects);
        
        // Act & Assert
        mockMvc.perform(get("/api/v1/teams/{teamId}/projects/overdue", teamId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(projectId.toString()));
        
        verify(projectService).getOverdueProjects(teamId);
    }
    
    @Test
    @WithMockUser(username = "test@example.com", roles = {"MANAGER"})
    void assignUserToProject_Success() throws Exception {
        // Arrange
        when(projectService.assignUserToProject(eq(projectId), any(ProjectMemberAssignRequest.class), eq("test@example.com")))
                .thenReturn(memberResponse);
        
        // Act & Assert
        mockMvc.perform(post("/api/v1/projects/{id}/members", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.id").value(userId.toString()));
        
        verify(projectService).assignUserToProject(eq(projectId), any(ProjectMemberAssignRequest.class), eq("test@example.com"));
    }
    
    @Test
    @WithMockUser(username = "test@example.com", roles = {"MANAGER"})
    void assignUserToProject_InvalidEmail() throws Exception {
        // Arrange
        assignRequest.setEmail("invalid-email");
        
        // Act & Assert
        mockMvc.perform(post("/api/v1/projects/{id}/members", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignRequest)))
                .andExpect(status().isBadRequest());
        
        verify(projectService, never()).assignUserToProject(any(), any(), any());
    }
    
    @Test
    @WithMockUser(username = "test@example.com", roles = {"MEMBER"})
    void getProjectMembers_Success() throws Exception {
        // Arrange
        List<ProjectMemberResponse> members = Arrays.asList(memberResponse);
        when(projectService.getProjectMembers(projectId)).thenReturn(members);
        
        // Act & Assert
        mockMvc.perform(get("/api/v1/projects/{id}/members", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].user.id").value(userId.toString()));
        
        verify(projectService).getProjectMembers(projectId);
    }
    
    @Test
    @WithMockUser(username = "test@example.com", roles = {"MANAGER"})
    void removeUserFromProject_Success() throws Exception {
        // Arrange
        doNothing().when(projectService).removeUserFromProject(projectId, userId);
        
        // Act & Assert
        mockMvc.perform(delete("/api/v1/projects/{id}/members/{userId}", projectId, userId)
                        .with(csrf()))
                .andExpect(status().isNoContent());
        
        verify(projectService).removeUserFromProject(projectId, userId);
    }
    
    @Test
    @WithMockUser(username = "test@example.com", roles = {"MEMBER"})
    void getUserAssignedProjects_Success() throws Exception {
        // Arrange
        List<ProjectResponse> projects = Arrays.asList(projectResponse);
        when(projectService.getUserAssignedProjects("test@example.com")).thenReturn(projects);
        
        // Act & Assert
        mockMvc.perform(get("/api/v1/projects/assigned"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(projectId.toString()));
        
        verify(projectService).getUserAssignedProjects("test@example.com");
    }
    
    @Test
    void createProject_Unauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/v1/teams/{teamId}/projects", teamId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isUnauthorized());
        
        verify(projectService, never()).createProject(any(), any(), any());
    }
}