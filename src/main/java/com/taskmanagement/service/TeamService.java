package com.taskmanagement.service;

import com.taskmanagement.config.CacheConfig;
import com.taskmanagement.dto.*;
import com.taskmanagement.entity.Team;
import com.taskmanagement.entity.TeamMember;
import com.taskmanagement.entity.User;
import com.taskmanagement.repository.TeamMemberRepository;
import com.taskmanagement.repository.TeamRepository;
import com.taskmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service class for team management operations
 */
@Service
@Transactional
public class TeamService {
    
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final NotificationService notificationService;
    
    @Autowired
    public TeamService(TeamRepository teamRepository, UserRepository userRepository, 
                      TeamMemberRepository teamMemberRepository, NotificationService notificationService) {
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.notificationService = notificationService;
    }
    
    /**
     * Create a new team
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public TeamResponse createTeam(TeamCreateRequest request, UUID ownerId) {
        // Check if team name already exists
        if (teamRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Team name already exists");
        }
        
        // Find the owner user
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Owner user not found"));
        
        // Create new team
        Team team = new Team(request.getName(), request.getDescription(), owner);
        
        try {
            Team savedTeam = teamRepository.save(team);
            return convertToResponse(savedTeam);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Team name already exists");
        }
    }
    
    /**
     * Get team by ID
     */
    @PreAuthorize("hasRole('ADMIN') or @teamService.isTeamMember(#teamId, authentication.name)")
    @Cacheable(value = CacheConfig.TEAM_CACHE, key = "#teamId")
    public TeamResponse getTeamById(UUID teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        
        return convertToResponse(team);
    }
    
    /**
     * Get all teams for a user (including teams where user is owner or member)
     */
    @Cacheable(value = CacheConfig.TEAM_CACHE, key = "'user:' + #userId")
    public List<TeamResponse> getUserTeams(UUID userId) {
        List<Team> teams = teamMemberRepository.findTeamsByUserId(userId);
        return teams.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Update team
     */
    @PreAuthorize("hasRole('ADMIN') or @teamService.isTeamOwner(#teamId, authentication.name)")
    @CacheEvict(value = CacheConfig.TEAM_CACHE, allEntries = true)
    public TeamResponse updateTeam(UUID teamId, TeamUpdateRequest request) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        
        // Update name if provided and different
        if (request.getName() != null && !request.getName().equals(team.getName())) {
            if (teamRepository.existsByName(request.getName())) {
                throw new IllegalArgumentException("Team name already exists");
            }
            team.setName(request.getName());
        }
        
        // Update description if provided
        if (request.getDescription() != null) {
            team.setDescription(request.getDescription());
        }
        
        try {
            Team updatedTeam = teamRepository.save(team);
            return convertToResponse(updatedTeam);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Team name already exists");
        }
    }
    
    /**
     * Delete team
     */
    @PreAuthorize("hasRole('ADMIN') or @teamService.isTeamOwner(#teamId, authentication.name)")
    @CacheEvict(value = CacheConfig.TEAM_CACHE, allEntries = true)
    public void deleteTeam(UUID teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        
        teamRepository.delete(team);
    }
    
    /**
     * Check if user is team owner
     */
    public boolean isTeamOwner(UUID teamId, String userEmail) {
        return teamRepository.findById(teamId)
                .map(team -> team.getOwner().getEmail().equals(userEmail))
                .orElse(false);
    }
    
    /**
     * Check if user is team member (owner or explicit member)
     */
    public boolean isTeamMember(UUID teamId, String userEmail) {
        if (isTeamOwner(teamId, userEmail)) {
            return true;
        }
        
        return userRepository.findByEmail(userEmail)
                .map(user -> teamMemberRepository.existsByTeamIdAndUserId(teamId, user.getId()))
                .orElse(false);
    }
    
    /**
     * Invite user to team by email
     */
    @PreAuthorize("hasRole('ADMIN') or @teamService.isTeamOwner(#teamId, authentication.name)")
    public TeamMemberResponse inviteUserToTeam(UUID teamId, TeamMemberInviteRequest request, String inviterEmail) {
        // Find the team
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        
        // Find the user to invite
        User userToInvite = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User with email " + request.getEmail() + " not found"));
        
        // Find the inviter
        User inviter = userRepository.findByEmail(inviterEmail)
                .orElseThrow(() -> new IllegalArgumentException("Inviter not found"));
        
        // Check if user is already a member
        if (teamMemberRepository.existsByTeamIdAndUserId(teamId, userToInvite.getId())) {
            throw new IllegalArgumentException("User is already a member of this team");
        }
        
        // Check if user is the team owner
        if (team.getOwner().getId().equals(userToInvite.getId())) {
            throw new IllegalArgumentException("Team owner is already a member");
        }
        
        // Create team membership
        TeamMember teamMember = new TeamMember(team, userToInvite, inviter);
        TeamMember savedMember = teamMemberRepository.save(teamMember);
        
        // Send invitation notification
        notificationService.sendTeamInvitation(
                userToInvite.getEmail(), 
                team.getName(), 
                inviter.getFirstName() + " " + inviter.getLastName()
        );
        
        return convertToMemberResponse(savedMember);
    }
    
    /**
     * Remove user from team
     */
    @PreAuthorize("hasRole('ADMIN') or @teamService.isTeamOwner(#teamId, authentication.name)")
    public void removeUserFromTeam(UUID teamId, UUID userId, String removerEmail) {
        // Find the team
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        
        // Find the user to remove
        User userToRemove = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Check if user is the team owner
        if (team.getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException("Cannot remove team owner from team");
        }
        
        // Find and delete the membership
        TeamMember membership = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new IllegalArgumentException("User is not a member of this team"));
        
        teamMemberRepository.delete(membership);
        
        // Send removal notification
        User remover = userRepository.findByEmail(removerEmail)
                .orElse(null);
        String removerName = remover != null ? 
                remover.getFirstName() + " " + remover.getLastName() : "Team Administrator";
        
        notificationService.sendMemberRemovalNotification(
                userToRemove.getEmail(),
                team.getName(),
                removerName
        );
    }
    
    /**
     * Get all members of a team
     */
    @PreAuthorize("hasRole('ADMIN') or @teamService.isTeamMember(#teamId, authentication.name)")
    public List<TeamMemberResponse> getTeamMembers(UUID teamId) {
        // Verify team exists
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        
        List<TeamMember> members = teamMemberRepository.findByTeamId(teamId);
        return members.stream()
                .map(this::convertToMemberResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Convert Team entity to TeamResponse DTO
     */
    private TeamResponse convertToResponse(Team team) {
        UserResponse ownerResponse = new UserResponse(
                team.getOwner().getId(),
                team.getOwner().getEmail(),
                team.getOwner().getFirstName(),
                team.getOwner().getLastName(),
                team.getOwner().getRole(),
                team.getOwner().getCreatedAt(),
                team.getOwner().getUpdatedAt(),
                team.getOwner().getLastLogin()
        );
        
        return new TeamResponse(
                team.getId(),
                team.getName(),
                team.getDescription(),
                ownerResponse,
                team.getCreatedAt(),
                team.getUpdatedAt()
        );
    }
    
    /**
     * Convert TeamMember entity to TeamMemberResponse DTO
     */
    private TeamMemberResponse convertToMemberResponse(TeamMember teamMember) {
        UserResponse userResponse = new UserResponse(
                teamMember.getUser().getId(),
                teamMember.getUser().getEmail(),
                teamMember.getUser().getFirstName(),
                teamMember.getUser().getLastName(),
                teamMember.getUser().getRole(),
                teamMember.getUser().getCreatedAt(),
                teamMember.getUser().getUpdatedAt(),
                teamMember.getUser().getLastLogin()
        );
        
        UserResponse inviterResponse = null;
        if (teamMember.getInvitedBy() != null) {
            inviterResponse = new UserResponse(
                    teamMember.getInvitedBy().getId(),
                    teamMember.getInvitedBy().getEmail(),
                    teamMember.getInvitedBy().getFirstName(),
                    teamMember.getInvitedBy().getLastName(),
                    teamMember.getInvitedBy().getRole(),
                    teamMember.getInvitedBy().getCreatedAt(),
                    teamMember.getInvitedBy().getUpdatedAt(),
                    teamMember.getInvitedBy().getLastLogin()
            );
        }
        
        return new TeamMemberResponse(
                teamMember.getId(),
                userResponse,
                teamMember.getJoinedAt(),
                inviterResponse
        );
    }
}