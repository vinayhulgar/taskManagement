package com.taskmanagement.service;

import com.taskmanagement.dto.*;
import com.taskmanagement.entity.Role;
import com.taskmanagement.entity.Team;
import com.taskmanagement.entity.TeamMember;
import com.taskmanagement.entity.User;
import com.taskmanagement.repository.TeamMemberRepository;
import com.taskmanagement.repository.TeamRepository;
import com.taskmanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {
    
    @Mock
    private TeamRepository teamRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private TeamMemberRepository teamMemberRepository;
    
    @Mock
    private NotificationService notificationService;
    
    @InjectMocks
    private TeamService teamService;
    
    private User testUser;
    private User testOwner;
    private Team testTeam;
    private TeamMember testMember;
    
    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setRole(Role.MEMBER);
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());
        
        testOwner = new User();
        testOwner.setId(UUID.randomUUID());
        testOwner.setEmail("owner@example.com");
        testOwner.setFirstName("Team");
        testOwner.setLastName("Owner");
        testOwner.setRole(Role.MANAGER);
        testOwner.setCreatedAt(LocalDateTime.now());
        testOwner.setUpdatedAt(LocalDateTime.now());
        
        testTeam = new Team();
        testTeam.setId(UUID.randomUUID());
        testTeam.setName("Test Team");
        testTeam.setDescription("Test Description");
        testTeam.setOwner(testOwner);
        testTeam.setCreatedAt(LocalDateTime.now());
        testTeam.setUpdatedAt(LocalDateTime.now());
        
        testMember = new TeamMember();
        testMember.setId(UUID.randomUUID());
        testMember.setTeam(testTeam);
        testMember.setUser(testUser);
        testMember.setInvitedBy(testOwner);
        testMember.setJoinedAt(LocalDateTime.now());
    }
    
    @Test
    void createTeam_Success() {
        // Arrange
        TeamCreateRequest request = new TeamCreateRequest("New Team", "New Description");
        
        when(teamRepository.existsByName("New Team")).thenReturn(false);
        when(userRepository.findById(testOwner.getId())).thenReturn(Optional.of(testOwner));
        when(teamRepository.save(any(Team.class))).thenReturn(testTeam);
        
        // Act
        TeamResponse response = teamService.createTeam(request, testOwner.getId());
        
        // Assert
        assertNotNull(response);
        assertEquals(testTeam.getId(), response.getId());
        assertEquals(testTeam.getName(), response.getName());
        assertEquals(testTeam.getDescription(), response.getDescription());
        assertEquals(testOwner.getId(), response.getOwner().getId());
        
        verify(teamRepository).existsByName("New Team");
        verify(userRepository).findById(testOwner.getId());
        verify(teamRepository).save(any(Team.class));
    }
    
    @Test
    void createTeam_DuplicateName_ThrowsException() {
        // Arrange
        TeamCreateRequest request = new TeamCreateRequest("Existing Team", "Description");
        
        when(teamRepository.existsByName("Existing Team")).thenReturn(true);
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> teamService.createTeam(request, testOwner.getId()));
        
        assertEquals("Team name already exists", exception.getMessage());
        verify(teamRepository).existsByName("Existing Team");
        verify(teamRepository, never()).save(any(Team.class));
    }
    
    @Test
    void createTeam_OwnerNotFound_ThrowsException() {
        // Arrange
        TeamCreateRequest request = new TeamCreateRequest("New Team", "Description");
        UUID nonExistentId = UUID.randomUUID();
        
        when(teamRepository.existsByName("New Team")).thenReturn(false);
        when(userRepository.findById(nonExistentId)).thenReturn(Optional.empty());
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> teamService.createTeam(request, nonExistentId));
        
        assertEquals("Owner user not found", exception.getMessage());
        verify(teamRepository, never()).save(any(Team.class));
    }
    
    @Test
    void createTeam_DataIntegrityViolation_ThrowsException() {
        // Arrange
        TeamCreateRequest request = new TeamCreateRequest("New Team", "Description");
        
        when(teamRepository.existsByName("New Team")).thenReturn(false);
        when(userRepository.findById(testOwner.getId())).thenReturn(Optional.of(testOwner));
        when(teamRepository.save(any(Team.class))).thenThrow(new DataIntegrityViolationException("Duplicate"));
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> teamService.createTeam(request, testOwner.getId()));
        
        assertEquals("Team name already exists", exception.getMessage());
    }
    
    @Test
    void getTeamById_Success() {
        // Arrange
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        
        // Act
        TeamResponse response = teamService.getTeamById(testTeam.getId());
        
        // Assert
        assertNotNull(response);
        assertEquals(testTeam.getId(), response.getId());
        assertEquals(testTeam.getName(), response.getName());
        verify(teamRepository).findById(testTeam.getId());
    }
    
    @Test
    void getTeamById_NotFound_ThrowsException() {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();
        when(teamRepository.findById(nonExistentId)).thenReturn(Optional.empty());
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> teamService.getTeamById(nonExistentId));
        
        assertEquals("Team not found", exception.getMessage());
    }
    
    @Test
    void getUserTeams_Success() {
        // Arrange
        List<Team> teams = Arrays.asList(testTeam);
        when(teamMemberRepository.findTeamsByUserId(testUser.getId())).thenReturn(teams);
        
        // Act
        List<TeamResponse> responses = teamService.getUserTeams(testUser.getId());
        
        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals(testTeam.getId(), responses.get(0).getId());
        verify(teamMemberRepository).findTeamsByUserId(testUser.getId());
    }
    
    @Test
    void updateTeam_Success() {
        // Arrange
        TeamUpdateRequest request = new TeamUpdateRequest("Updated Team", "Updated Description");
        
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        when(teamRepository.existsByName("Updated Team")).thenReturn(false);
        when(teamRepository.save(any(Team.class))).thenReturn(testTeam);
        
        // Act
        TeamResponse response = teamService.updateTeam(testTeam.getId(), request);
        
        // Assert
        assertNotNull(response);
        verify(teamRepository).findById(testTeam.getId());
        verify(teamRepository).existsByName("Updated Team");
        verify(teamRepository).save(any(Team.class));
    }
    
    @Test
    void updateTeam_DuplicateName_ThrowsException() {
        // Arrange
        TeamUpdateRequest request = new TeamUpdateRequest("Existing Team", "Description");
        
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        when(teamRepository.existsByName("Existing Team")).thenReturn(true);
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> teamService.updateTeam(testTeam.getId(), request));
        
        assertEquals("Team name already exists", exception.getMessage());
        verify(teamRepository, never()).save(any(Team.class));
    }
    
    @Test
    void deleteTeam_Success() {
        // Arrange
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        
        // Act
        teamService.deleteTeam(testTeam.getId());
        
        // Assert
        verify(teamRepository).findById(testTeam.getId());
        verify(teamRepository).delete(testTeam);
    }
    
    @Test
    void inviteUserToTeam_Success() {
        // Arrange
        TeamMemberInviteRequest request = new TeamMemberInviteRequest("test@example.com");
        
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(testOwner));
        when(teamMemberRepository.existsByTeamIdAndUserId(testTeam.getId(), testUser.getId())).thenReturn(false);
        when(teamMemberRepository.save(any(TeamMember.class))).thenReturn(testMember);
        
        // Act
        TeamMemberResponse response = teamService.inviteUserToTeam(testTeam.getId(), request, "owner@example.com");
        
        // Assert
        assertNotNull(response);
        assertEquals(testUser.getId(), response.getUser().getId());
        verify(teamMemberRepository).save(any(TeamMember.class));
        verify(notificationService).sendTeamInvitation(anyString(), anyString(), anyString());
    }
    
    @Test
    void inviteUserToTeam_UserAlreadyMember_ThrowsException() {
        // Arrange
        TeamMemberInviteRequest request = new TeamMemberInviteRequest("test@example.com");
        
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(testOwner));
        when(teamMemberRepository.existsByTeamIdAndUserId(testTeam.getId(), testUser.getId())).thenReturn(true);
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> teamService.inviteUserToTeam(testTeam.getId(), request, "owner@example.com"));
        
        assertEquals("User is already a member of this team", exception.getMessage());
        verify(teamMemberRepository, never()).save(any(TeamMember.class));
    }
    
    @Test
    void inviteUserToTeam_UserIsOwner_ThrowsException() {
        // Arrange
        TeamMemberInviteRequest request = new TeamMemberInviteRequest("owner@example.com");
        
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(testOwner));
        when(teamMemberRepository.existsByTeamIdAndUserId(testTeam.getId(), testOwner.getId())).thenReturn(false);
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> teamService.inviteUserToTeam(testTeam.getId(), request, "owner@example.com"));
        
        assertEquals("Team owner is already a member", exception.getMessage());
        verify(teamMemberRepository, never()).save(any(TeamMember.class));
    }
    
    @Test
    void removeUserFromTeam_Success() {
        // Arrange
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(testOwner));
        when(teamMemberRepository.findByTeamIdAndUserId(testTeam.getId(), testUser.getId()))
                .thenReturn(Optional.of(testMember));
        
        // Act
        teamService.removeUserFromTeam(testTeam.getId(), testUser.getId(), "owner@example.com");
        
        // Assert
        verify(teamMemberRepository).delete(testMember);
        verify(notificationService).sendMemberRemovalNotification(anyString(), anyString(), anyString());
    }
    
    @Test
    void removeUserFromTeam_CannotRemoveOwner_ThrowsException() {
        // Arrange
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        when(userRepository.findById(testOwner.getId())).thenReturn(Optional.of(testOwner));
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> teamService.removeUserFromTeam(testTeam.getId(), testOwner.getId(), "owner@example.com"));
        
        assertEquals("Cannot remove team owner from team", exception.getMessage());
        verify(teamMemberRepository, never()).delete(any(TeamMember.class));
    }
    
    @Test
    void getTeamMembers_Success() {
        // Arrange
        List<TeamMember> members = Arrays.asList(testMember);
        
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        when(teamMemberRepository.findByTeamId(testTeam.getId())).thenReturn(members);
        
        // Act
        List<TeamMemberResponse> responses = teamService.getTeamMembers(testTeam.getId());
        
        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals(testUser.getId(), responses.get(0).getUser().getId());
        verify(teamMemberRepository).findByTeamId(testTeam.getId());
    }
    
    @Test
    void isTeamOwner_True() {
        // Arrange
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        
        // Act
        boolean result = teamService.isTeamOwner(testTeam.getId(), "owner@example.com");
        
        // Assert
        assertTrue(result);
    }
    
    @Test
    void isTeamOwner_False() {
        // Arrange
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        
        // Act
        boolean result = teamService.isTeamOwner(testTeam.getId(), "other@example.com");
        
        // Assert
        assertFalse(result);
    }
    
    @Test
    void isTeamMember_OwnerIsAlwaysMember() {
        // Arrange
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        
        // Act
        boolean result = teamService.isTeamMember(testTeam.getId(), "owner@example.com");
        
        // Assert
        assertTrue(result);
    }
    
    @Test
    void isTeamMember_ExplicitMember() {
        // Arrange
        when(teamRepository.findById(testTeam.getId())).thenReturn(Optional.of(testTeam));
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(teamMemberRepository.existsByTeamIdAndUserId(testTeam.getId(), testUser.getId())).thenReturn(true);
        
        // Act
        boolean result = teamService.isTeamMember(testTeam.getId(), "test@example.com");
        
        // Assert
        assertTrue(result);
    }
}