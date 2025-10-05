package com.taskmanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskmanagement.dto.*;
import com.taskmanagement.entity.Role;
import com.taskmanagement.service.TeamService;
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
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TeamController.class)
class TeamControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private TeamService teamService;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    private TeamResponse testTeamResponse;
    private TeamCreateRequest testCreateRequest;
    private TeamUpdateRequest testUpdateRequest;
    private TeamMemberInviteRequest testInviteRequest;
    private TeamMemberResponse testMemberResponse;
    private UserResponse testUserResponse;
    
    @BeforeEach
    void setUp() {
        testUserResponse = new UserResponse(
                UUID.randomUUID(),
                "owner@example.com",
                "Team",
                "Owner",
                Role.MANAGER,
                LocalDateTime.now(),
                LocalDateTime.now(),
                LocalDateTime.now()
        );
        
        testTeamResponse = new TeamResponse(
                UUID.randomUUID(),
                "Test Team",
                "Test Description",
                testUserResponse,
                LocalDateTime.now(),
                LocalDateTime.now()
        );
        
        testCreateRequest = new TeamCreateRequest("New Team", "New Description");
        testUpdateRequest = new TeamUpdateRequest("Updated Team", "Updated Description");
        testInviteRequest = new TeamMemberInviteRequest("member@example.com");
        
        UserResponse memberUser = new UserResponse(
                UUID.randomUUID(),
                "member@example.com",
                "Team",
                "Member",
                Role.MEMBER,
                LocalDateTime.now(),
                LocalDateTime.now(),
                LocalDateTime.now()
        );
        
        testMemberResponse = new TeamMemberResponse(
                UUID.randomUUID(),
                memberUser,
                LocalDateTime.now(),
                testUserResponse
        );
    }
    
    @Test
    @WithMockUser(username = "owner@example.com", roles = {"MANAGER"})
    void createTeam_Success() throws Exception {
        // Arrange
        when(teamService.createTeam(any(TeamCreateRequest.class), any(UUID.class)))
                .thenReturn(testTeamResponse);
        
        // Act & Assert
        mockMvc.perform(post("/api/v1/teams")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testCreateRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(testTeamResponse.getId().toString()))
                .andExpect(jsonPath("$.name").value(testTeamResponse.getName()))
                .andExpect(jsonPath("$.description").value(testTeamResponse.getDescription()));
        
        verify(teamService).createTeam(any(TeamCreateRequest.class), any(UUID.class));
    }
    
    @Test
    @WithMockUser(username = "owner@example.com", roles = {"MANAGER"})
    void createTeam_InvalidRequest_BadRequest() throws Exception {
        // Arrange
        TeamCreateRequest invalidRequest = new TeamCreateRequest("", "Description");
        
        // Act & Assert
        mockMvc.perform(post("/api/v1/teams")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
        
        verify(teamService, never()).createTeam(any(TeamCreateRequest.class), any(UUID.class));
    }
    
    @Test
    @WithMockUser(username = "owner@example.com", roles = {"MANAGER"})
    void createTeam_DuplicateName_Conflict() throws Exception {
        // Arrange
        when(teamService.createTeam(any(TeamCreateRequest.class), any(UUID.class)))
                .thenThrow(new IllegalArgumentException("Team name already exists"));
        
        // Act & Assert
        mockMvc.perform(post("/api/v1/teams")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testCreateRequest)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    @WithMockUser(username = "member@example.com", roles = {"MEMBER"})
    void createTeam_InsufficientPermissions_Forbidden() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/v1/teams")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testCreateRequest)))
                .andExpect(status().isForbidden());
        
        verify(teamService, never()).createTeam(any(TeamCreateRequest.class), any(UUID.class));
    }
    
    @Test
    @WithMockUser(username = "owner@example.com", roles = {"MANAGER"})
    void getUserTeams_Success() throws Exception {
        // Arrange
        List<TeamResponse> teams = Arrays.asList(testTeamResponse);
        when(teamService.getUserTeams(any(UUID.class))).thenReturn(teams);
        
        // Act & Assert
        mockMvc.perform(get("/api/v1/teams"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(testTeamResponse.getId().toString()))
                .andExpect(jsonPath("$[0].name").value(testTeamResponse.getName()));
        
        verify(teamService).getUserTeams(any(UUID.class));
    }
    
    @Test
    @WithMockUser(username = "owner@example.com", roles = {"MANAGER"})
    void getTeamById_Success() throws Exception {
        // Arrange
        UUID teamId = testTeamResponse.getId();
        when(teamService.getTeamById(teamId)).thenReturn(testTeamResponse);
        
        // Act & Assert
        mockMvc.perform(get("/api/v1/teams/{id}", teamId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(teamId.toString()))
                .andExpect(jsonPath("$.name").value(testTeamResponse.getName()));
        
        verify(teamService).getTeamById(teamId);
    }
    
    @Test
    @WithMockUser(username = "owner@example.com", roles = {"MANAGER"})
    void getTeamById_NotFound() throws Exception {
        // Arrange
        UUID teamId = UUID.randomUUID();
        when(teamService.getTeamById(teamId))
                .thenThrow(new IllegalArgumentException("Team not found"));
        
        // Act & Assert
        mockMvc.perform(get("/api/v1/teams/{id}", teamId))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    @WithMockUser(username = "owner@example.com", roles = {"MANAGER"})
    void updateTeam_Success() throws Exception {
        // Arrange
        UUID teamId = testTeamResponse.getId();
        when(teamService.updateTeam(eq(teamId), any(TeamUpdateRequest.class)))
                .thenReturn(testTeamResponse);
        
        // Act & Assert
        mockMvc.perform(put("/api/v1/teams/{id}", teamId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testUpdateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(teamId.toString()));
        
        verify(teamService).updateTeam(eq(teamId), any(TeamUpdateRequest.class));
    }
    
    @Test
    @WithMockUser(username = "owner@example.com", roles = {"MANAGER"})
    void deleteTeam_Success() throws Exception {
        // Arrange
        UUID teamId = testTeamResponse.getId();
        doNothing().when(teamService).deleteTeam(teamId);
        
        // Act & Assert
        mockMvc.perform(delete("/api/v1/teams/{id}", teamId)
                .with(csrf()))
                .andExpect(status().isNoContent());
        
        verify(teamService).deleteTeam(teamId);
    }
    
    @Test
    @WithMockUser(username = "owner@example.com", roles = {"MANAGER"})
    void inviteUserToTeam_Success() throws Exception {
        // Arrange
        UUID teamId = testTeamResponse.getId();
        when(teamService.inviteUserToTeam(eq(teamId), any(TeamMemberInviteRequest.class), anyString()))
                .thenReturn(testMemberResponse);
        
        // Act & Assert
        mockMvc.perform(post("/api/v1/teams/{id}/members", teamId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testInviteRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.email").value("member@example.com"));
        
        verify(teamService).inviteUserToTeam(eq(teamId), any(TeamMemberInviteRequest.class), anyString());
    }
    
    @Test
    @WithMockUser(username = "owner@example.com", roles = {"MANAGER"})
    void inviteUserToTeam_InvalidEmail_BadRequest() throws Exception {
        // Arrange
        UUID teamId = testTeamResponse.getId();
        TeamMemberInviteRequest invalidRequest = new TeamMemberInviteRequest("invalid-email");
        
        // Act & Assert
        mockMvc.perform(post("/api/v1/teams/{id}/members", teamId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
        
        verify(teamService, never()).inviteUserToTeam(any(UUID.class), any(TeamMemberInviteRequest.class), anyString());
    }
    
    @Test
    @WithMockUser(username = "owner@example.com", roles = {"MANAGER"})
    void inviteUserToTeam_UserAlreadyMember_BadRequest() throws Exception {
        // Arrange
        UUID teamId = testTeamResponse.getId();
        when(teamService.inviteUserToTeam(eq(teamId), any(TeamMemberInviteRequest.class), anyString()))
                .thenThrow(new IllegalArgumentException("User is already a member of this team"));
        
        // Act & Assert
        mockMvc.perform(post("/api/v1/teams/{id}/members", teamId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testInviteRequest)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    @WithMockUser(username = "owner@example.com", roles = {"MANAGER"})
    void getTeamMembers_Success() throws Exception {
        // Arrange
        UUID teamId = testTeamResponse.getId();
        List<TeamMemberResponse> members = Arrays.asList(testMemberResponse);
        when(teamService.getTeamMembers(teamId)).thenReturn(members);
        
        // Act & Assert
        mockMvc.perform(get("/api/v1/teams/{id}/members", teamId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].user.email").value("member@example.com"));
        
        verify(teamService).getTeamMembers(teamId);
    }
    
    @Test
    @WithMockUser(username = "owner@example.com", roles = {"MANAGER"})
    void removeUserFromTeam_Success() throws Exception {
        // Arrange
        UUID teamId = testTeamResponse.getId();
        UUID userId = UUID.randomUUID();
        doNothing().when(teamService).removeUserFromTeam(teamId, userId, "owner@example.com");
        
        // Act & Assert
        mockMvc.perform(delete("/api/v1/teams/{id}/members/{userId}", teamId, userId)
                .with(csrf()))
                .andExpect(status().isNoContent());
        
        verify(teamService).removeUserFromTeam(teamId, userId, "owner@example.com");
    }
    
    @Test
    @WithMockUser(username = "owner@example.com", roles = {"MANAGER"})
    void removeUserFromTeam_CannotRemoveOwner_BadRequest() throws Exception {
        // Arrange
        UUID teamId = testTeamResponse.getId();
        UUID userId = UUID.randomUUID();
        doThrow(new IllegalArgumentException("Cannot remove team owner from team"))
                .when(teamService).removeUserFromTeam(teamId, userId, "owner@example.com");
        
        // Act & Assert
        mockMvc.perform(delete("/api/v1/teams/{id}/members/{userId}", teamId, userId)
                .with(csrf()))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void createTeam_Unauthenticated_Unauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/v1/teams")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testCreateRequest)))
                .andExpect(status().isUnauthorized());
        
        verify(teamService, never()).createTeam(any(TeamCreateRequest.class), any(UUID.class));
    }
}