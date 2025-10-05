package com.taskmanagement.service;

import com.taskmanagement.dto.*;
import com.taskmanagement.entity.*;
import com.taskmanagement.repository.ProjectMemberRepository;
import com.taskmanagement.repository.ProjectRepository;
import com.taskmanagement.repository.TeamRepository;
import com.taskmanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ProjectService
 */
@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {
    
    @Mock
    private ProjectRepository projectRepository;
    
    @Mock
    private ProjectMemberRepository projectMemberRepository;
    
    @Mock
    private TeamRepository teamRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private TeamService teamService;
    
    @InjectMocks
    private ProjectService projectService;
    
    private User testUser;
    private Team testTeam;
    private Project testProject;
    private ProjectCreateRequest createRequest;
    private ProjectUpdateRequest updateRequest;
    
    @BeforeEach
    void setUp() {
        testUser = new User("test@example.com", "hashedPassword", "John", "Doe", Role.MANAGER);
        testUser.setId(UUID.randomUUID());
        
        testTeam = new Team("Test Team", "Test Description", testUser);
        testTeam.setId(UUID.randomUUID());
        
        testProject = new Project(testTeam, "Test Project", "Test Description", 
                                 ProjectStatus.PLANNING, LocalDate.now().plusDays(1), 
                                 LocalDate.now().plusDays(30), testUser);
        testProject.setId(UUID.randomUUID());
        
        createRequest = new ProjectCreateRequest("New Project", "New Description", 
                                               ProjectStatus.PLANNING, LocalDate.now().plusDays(1), 
                                               LocalDate.now().plusDays(30));
        
        updateRequest = new ProjectUpdateRequest("Updated Project", "Updated Description", 
                                               ProjectStatus.ACTIVE, LocalDate.now().plusDays(2), 
                                               LocalDate.now().plusDays(35));
    }
    
    @Test
    void createProject_Success() {
        // Arrange
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(projectRepository.existsByTeamAndName(testTeam, createRequest.getName())).thenReturn(false);
        when(projectRepository.save(any(Project.class))).thenReturn(testProject);
        
        // Act
        ProjectResponse response = projectService.createProject(testTeam.getId(), createRequest, testUser.getEmail());
        
        // Assert
        assertNotNull(response);
        assertEquals(testProject.getName(), response.getName());
        assertEquals(testProject.getDescription(), response.getDescription());
        assertEquals(testProject.getStatus(), response.getStatus());
        verify(projectRepository).save(any(Project.class));
    }
    
    @Test
    void createProject_TeamNotFound() {
        // Arrange
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.empty());
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, 
                () -> projectService.createProject(testTeam.getId(), createRequest, testUser.getEmail()));
    }
    
    @Test
    void createProject_UserNotFound() {
        // Arrange
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.empty());
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, 
                () -> projectService.createProject(testTeam.getId(), createRequest, testUser.getEmail()));
    }
    
    @Test
    void createProject_DuplicateName() {
        // Arrange
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(projectRepository.existsByTeamAndName(testTeam, createRequest.getName())).thenReturn(true);
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, 
                () -> projectService.createProject(testTeam.getId(), createRequest, testUser.getEmail()));
    }
    
    @Test
    void createProject_InvalidDates() {
        // Arrange
        createRequest.setStartDate(LocalDate.now().plusDays(30));
        createRequest.setEndDate(LocalDate.now().plusDays(1)); // End before start
        
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, 
                () -> projectService.createProject(testTeam.getId(), createRequest, testUser.getEmail()));
    }
    
    @Test
    void createProject_EndDateInPast() {
        // Arrange
        createRequest.setEndDate(LocalDate.now().minusDays(1));
        
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, 
                () -> projectService.createProject(testTeam.getId(), createRequest, testUser.getEmail()));
    }
    
    @Test
    void getProjectById_Success() {
        // Arrange
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        
        // Act
        ProjectResponse response = projectService.getProjectById(testProject.getId());
        
        // Assert
        assertNotNull(response);
        assertEquals(testProject.getId(), response.getId());
        assertEquals(testProject.getName(), response.getName());
    }
    
    @Test
    void getProjectById_NotFound() {
        // Arrange
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.empty());
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, 
                () -> projectService.getProjectById(testProject.getId()));
    }
    
    @Test
    void getTeamProjects_Success() {
        // Arrange
        List<Project> projects = Arrays.asList(testProject);
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        when(projectRepository.findByTeamId(testTeam.getId())).thenReturn(projects);
        
        // Act
        List<ProjectResponse> responses = projectService.getTeamProjects(testTeam.getId());
        
        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals(testProject.getName(), responses.get(0).getName());
    }
    
    @Test
    void getTeamProjectsByStatus_Success() {
        // Arrange
        List<Project> projects = Arrays.asList(testProject);
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        when(projectRepository.findByTeamAndStatus(testTeam, ProjectStatus.PLANNING)).thenReturn(projects);
        
        // Act
        List<ProjectResponse> responses = projectService.getTeamProjectsByStatus(testTeam.getId(), ProjectStatus.PLANNING);
        
        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals(testProject.getName(), responses.get(0).getName());
    }
    
    @Test
    void updateProject_Success() {
        // Arrange
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        when(projectRepository.existsByTeamAndName(testTeam, updateRequest.getName())).thenReturn(false);
        when(projectRepository.save(any(Project.class))).thenReturn(testProject);
        
        // Act
        ProjectResponse response = projectService.updateProject(testProject.getId(), updateRequest);
        
        // Assert
        assertNotNull(response);
        verify(projectRepository).save(any(Project.class));
    }
    
    @Test
    void updateProject_DuplicateName() {
        // Arrange
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        when(projectRepository.existsByTeamAndName(testTeam, updateRequest.getName())).thenReturn(true);
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, 
                () -> projectService.updateProject(testProject.getId(), updateRequest));
    }
    
    @Test
    void updateProject_InvalidStatusTransition() {
        // Arrange
        testProject.setStatus(ProjectStatus.ARCHIVED);
        updateRequest.setStatus(ProjectStatus.ACTIVE);
        
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, 
                () -> projectService.updateProject(testProject.getId(), updateRequest));
    }
    
    @Test
    void deleteProject_Success() {
        // Arrange
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        
        // Act
        projectService.deleteProject(testProject.getId());
        
        // Assert
        verify(projectRepository).delete(testProject);
    }
    
    @Test
    void hasProjectAccess_TeamMember() {
        // Arrange
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        when(teamService.isTeamMember(testTeam.getId(), testUser.getEmail())).thenReturn(true);
        
        // Act
        boolean hasAccess = projectService.hasProjectAccess(testProject.getId(), testUser.getEmail());
        
        // Assert
        assertTrue(hasAccess);
    }
    
    @Test
    void hasProjectAccess_ProjectMember() {
        // Arrange
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        when(teamService.isTeamMember(testTeam.getId(), testUser.getEmail())).thenReturn(false);
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(projectMemberRepository.existsByProjectAndUser(testProject, testUser)).thenReturn(true);
        
        // Act
        boolean hasAccess = projectService.hasProjectAccess(testProject.getId(), testUser.getEmail());
        
        // Assert
        assertTrue(hasAccess);
    }
    
    @Test
    void hasProjectAccess_NoAccess() {
        // Arrange
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        when(teamService.isTeamMember(testTeam.getId(), testUser.getEmail())).thenReturn(false);
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(projectMemberRepository.existsByProjectAndUser(testProject, testUser)).thenReturn(false);
        
        // Act
        boolean hasAccess = projectService.hasProjectAccess(testProject.getId(), testUser.getEmail());
        
        // Assert
        assertFalse(hasAccess);
    }
    
    @Test
    void assignUserToProject_Success() {
        // Arrange
        User assignee = new User("assignee@example.com", "password", "Jane", "Smith", Role.MEMBER);
        assignee.setId(UUID.randomUUID());
        
        ProjectMemberAssignRequest request = new ProjectMemberAssignRequest(assignee.getEmail());
        ProjectMember projectMember = new ProjectMember(testProject, assignee, testUser);
        projectMember.setId(UUID.randomUUID());
        
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        when(userRepository.findByEmail(assignee.getEmail())).thenReturn(Optional.of(assignee));
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(projectMemberRepository.existsByProjectAndUser(testProject, assignee)).thenReturn(false);
        when(teamService.isTeamMember(testTeam.getId(), assignee.getEmail())).thenReturn(true);
        when(projectMemberRepository.save(any(ProjectMember.class))).thenReturn(projectMember);
        
        // Act
        ProjectMemberResponse response = projectService.assignUserToProject(testProject.getId(), request, testUser.getEmail());
        
        // Assert
        assertNotNull(response);
        assertEquals(assignee.getId(), response.getUser().getId());
        verify(projectMemberRepository).save(any(ProjectMember.class));
    }
    
    @Test
    void assignUserToProject_UserAlreadyAssigned() {
        // Arrange
        User assignee = new User("assignee@example.com", "password", "Jane", "Smith", Role.MEMBER);
        ProjectMemberAssignRequest request = new ProjectMemberAssignRequest(assignee.getEmail());
        
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        when(userRepository.findByEmail(assignee.getEmail())).thenReturn(Optional.of(assignee));
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(projectMemberRepository.existsByProjectAndUser(testProject, assignee)).thenReturn(true);
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, 
                () -> projectService.assignUserToProject(testProject.getId(), request, testUser.getEmail()));
    }
    
    @Test
    void assignUserToProject_UserNotTeamMember() {
        // Arrange
        User assignee = new User("assignee@example.com", "password", "Jane", "Smith", Role.MEMBER);
        ProjectMemberAssignRequest request = new ProjectMemberAssignRequest(assignee.getEmail());
        
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        when(userRepository.findByEmail(assignee.getEmail())).thenReturn(Optional.of(assignee));
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(projectMemberRepository.existsByProjectAndUser(testProject, assignee)).thenReturn(false);
        when(teamService.isTeamMember(testTeam.getId(), assignee.getEmail())).thenReturn(false);
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, 
                () -> projectService.assignUserToProject(testProject.getId(), request, testUser.getEmail()));
    }
    
    @Test
    void removeUserFromProject_Success() {
        // Arrange
        User assignee = new User("assignee@example.com", "password", "Jane", "Smith", Role.MEMBER);
        assignee.setId(UUID.randomUUID());
        
        ProjectMember projectMember = new ProjectMember(testProject, assignee, testUser);
        
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        when(userRepository.findById(assignee.getId())).thenReturn(Optional.of(assignee));
        when(projectMemberRepository.findByProjectAndUser(testProject, assignee)).thenReturn(Optional.of(projectMember));
        
        // Act
        projectService.removeUserFromProject(testProject.getId(), assignee.getId());
        
        // Assert
        verify(projectMemberRepository).delete(projectMember);
    }
    
    @Test
    void removeUserFromProject_UserNotAssigned() {
        // Arrange
        User assignee = new User("assignee@example.com", "password", "Jane", "Smith", Role.MEMBER);
        assignee.setId(UUID.randomUUID());
        
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        when(userRepository.findById(assignee.getId())).thenReturn(Optional.of(assignee));
        when(projectMemberRepository.findByProjectAndUser(testProject, assignee)).thenReturn(Optional.empty());
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, 
                () -> projectService.removeUserFromProject(testProject.getId(), assignee.getId()));
    }
    
    @Test
    void getProjectMembers_Success() {
        // Arrange
        User assignee = new User("assignee@example.com", "password", "Jane", "Smith", Role.MEMBER);
        ProjectMember projectMember = new ProjectMember(testProject, assignee, testUser);
        List<ProjectMember> members = Arrays.asList(projectMember);
        
        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        when(projectMemberRepository.findByProject(testProject)).thenReturn(members);
        
        // Act
        List<ProjectMemberResponse> responses = projectService.getProjectMembers(testProject.getId());
        
        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals(assignee.getId(), responses.get(0).getUser().getId());
    }
    
    @Test
    void getUserAssignedProjects_Success() {
        // Arrange
        List<Project> projects = Arrays.asList(testProject);
        
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(projectMemberRepository.findProjectsByUserId(testUser.getId())).thenReturn(projects);
        
        // Act
        List<ProjectResponse> responses = projectService.getUserAssignedProjects(testUser.getEmail());
        
        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals(testProject.getName(), responses.get(0).getName());
    }
    
    @Test
    void getOverdueProjects_Success() {
        // Arrange
        List<Project> overdueProjects = Arrays.asList(testProject);
        
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        when(projectRepository.findOverdueProjects(any(LocalDate.class))).thenReturn(overdueProjects);
        
        // Act
        List<ProjectResponse> responses = projectService.getOverdueProjects(testTeam.getId());
        
        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals(testProject.getName(), responses.get(0).getName());
    }
}