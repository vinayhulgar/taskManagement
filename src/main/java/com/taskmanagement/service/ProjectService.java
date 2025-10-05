package com.taskmanagement.service;

import com.taskmanagement.dto.*;
import com.taskmanagement.entity.Project;
import com.taskmanagement.entity.ProjectMember;
import com.taskmanagement.entity.ProjectStatus;
import com.taskmanagement.entity.Team;
import com.taskmanagement.entity.User;
import com.taskmanagement.repository.ProjectMemberRepository;
import com.taskmanagement.repository.ProjectRepository;
import com.taskmanagement.repository.TeamRepository;
import com.taskmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service class for project management operations
 */
@Service
@Transactional
public class ProjectService {
    
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final TeamService teamService;
    
    @Autowired
    public ProjectService(ProjectRepository projectRepository, ProjectMemberRepository projectMemberRepository,
                         TeamRepository teamRepository, UserRepository userRepository, TeamService teamService) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.teamService = teamService;
    }
    
    /**
     * Create a new project within a team
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or @teamService.isTeamMember(#teamId, authentication.name)")
    public ProjectResponse createProject(UUID teamId, ProjectCreateRequest request, String creatorEmail) {
        // Find the team
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        
        // Find the creator user
        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new IllegalArgumentException("Creator user not found"));
        
        // Validate date constraints
        validateProjectDates(request.getStartDate(), request.getEndDate());
        
        // Check if project name already exists within the team
        if (projectRepository.existsByTeamAndName(team, request.getName())) {
            throw new IllegalArgumentException("Project name already exists within this team");
        }
        
        // Create new project
        Project project = new Project(
                team,
                request.getName(),
                request.getDescription(),
                request.getStatus() != null ? request.getStatus() : ProjectStatus.PLANNING,
                request.getStartDate(),
                request.getEndDate(),
                creator
        );
        
        try {
            Project savedProject = projectRepository.save(project);
            return convertToResponse(savedProject);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Project name already exists within this team");
        }
    }
    
    /**
     * Get project by ID
     */
    @PreAuthorize("hasRole('ADMIN') or @projectService.hasProjectAccess(#projectId, authentication.name)")
    public ProjectResponse getProjectById(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        
        return convertToResponse(project);
    }
    
    /**
     * Get all projects for a team
     */
    @PreAuthorize("hasRole('ADMIN') or @teamService.isTeamMember(#teamId, authentication.name)")
    public List<ProjectResponse> getTeamProjects(UUID teamId) {
        // Verify team exists and user has access
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        
        List<Project> projects = projectRepository.findByTeamId(teamId);
        return projects.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Get projects by status for a team
     */
    @PreAuthorize("hasRole('ADMIN') or @teamService.isTeamMember(#teamId, authentication.name)")
    public List<ProjectResponse> getTeamProjectsByStatus(UUID teamId, ProjectStatus status) {
        // Verify team exists and user has access
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        
        List<Project> projects = projectRepository.findByTeamAndStatus(team, status);
        return projects.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Update project
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or @projectService.hasProjectAccess(#projectId, authentication.name)")
    public ProjectResponse updateProject(UUID projectId, ProjectUpdateRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        
        // Update name if provided and different
        if (request.getName() != null && !request.getName().equals(project.getName())) {
            if (projectRepository.existsByTeamAndName(project.getTeam(), request.getName())) {
                throw new IllegalArgumentException("Project name already exists within this team");
            }
            project.setName(request.getName());
        }
        
        // Update description if provided
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }
        
        // Update status if provided
        if (request.getStatus() != null) {
            validateStatusTransition(project.getStatus(), request.getStatus());
            project.setStatus(request.getStatus());
        }
        
        // Update dates if provided
        LocalDate newStartDate = request.getStartDate() != null ? request.getStartDate() : project.getStartDate();
        LocalDate newEndDate = request.getEndDate() != null ? request.getEndDate() : project.getEndDate();
        
        validateProjectDates(newStartDate, newEndDate);
        
        if (request.getStartDate() != null) {
            project.setStartDate(request.getStartDate());
        }
        
        if (request.getEndDate() != null) {
            project.setEndDate(request.getEndDate());
        }
        
        try {
            Project updatedProject = projectRepository.save(project);
            return convertToResponse(updatedProject);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Project name already exists within this team");
        }
    }
    
    /**
     * Delete project
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or @projectService.hasProjectAccess(#projectId, authentication.name)")
    public void deleteProject(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        
        projectRepository.delete(project);
    }
    
    /**
     * Check if user has access to a project (team member or project member)
     */
    public boolean hasProjectAccess(UUID projectId, String userEmail) {
        return projectRepository.findById(projectId)
                .map(project -> {
                    // Check if user is team member
                    if (teamService.isTeamMember(project.getTeam().getId(), userEmail)) {
                        return true;
                    }
                    // Check if user is specifically assigned to project
                    return userRepository.findByEmail(userEmail)
                            .map(user -> projectMemberRepository.existsByProjectAndUser(project, user))
                            .orElse(false);
                })
                .orElse(false);
    }
    
    /**
     * Assign user to project
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or @projectService.hasProjectAccess(#projectId, authentication.name)")
    public ProjectMemberResponse assignUserToProject(UUID projectId, ProjectMemberAssignRequest request, String assignerEmail) {
        // Find the project
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        
        // Find the user to assign
        User userToAssign = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User with email " + request.getEmail() + " not found"));
        
        // Find the assigner
        User assigner = userRepository.findByEmail(assignerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Assigner not found"));
        
        // Check if user is already assigned to project
        if (projectMemberRepository.existsByProjectAndUser(project, userToAssign)) {
            throw new IllegalArgumentException("User is already assigned to this project");
        }
        
        // Check if user is a member of the project's team
        if (!teamService.isTeamMember(project.getTeam().getId(), request.getEmail())) {
            throw new IllegalArgumentException("User must be a member of the project's team to be assigned");
        }
        
        // Create project assignment
        ProjectMember projectMember = new ProjectMember(project, userToAssign, assigner);
        ProjectMember savedMember = projectMemberRepository.save(projectMember);
        
        return convertToProjectMemberResponse(savedMember, false);
    }
    
    /**
     * Remove user from project
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or @projectService.hasProjectAccess(#projectId, authentication.name)")
    public void removeUserFromProject(UUID projectId, UUID userId) {
        // Find the project
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        
        // Find the user to remove
        User userToRemove = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Find and delete the assignment
        ProjectMember assignment = projectMemberRepository.findByProjectAndUser(project, userToRemove)
                .orElseThrow(() -> new IllegalArgumentException("User is not assigned to this project"));
        
        projectMemberRepository.delete(assignment);
    }
    
    /**
     * Get all members assigned to a project
     */
    @PreAuthorize("hasRole('ADMIN') or @projectService.hasProjectAccess(#projectId, authentication.name)")
    public List<ProjectMemberResponse> getProjectMembers(UUID projectId) {
        // Verify project exists
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        
        List<ProjectMember> members = projectMemberRepository.findByProject(project);
        return members.stream()
                .map(member -> convertToProjectMemberResponse(member, false))
                .collect(Collectors.toList());
    }
    
    /**
     * Get all projects assigned to a user
     */
    public List<ProjectResponse> getUserAssignedProjects(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        List<Project> projects = projectMemberRepository.findProjectsByUserId(user.getId());
        return projects.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Get overdue projects for a team
     */
    @PreAuthorize("hasRole('ADMIN') or @teamService.isTeamMember(#teamId, authentication.name)")
    public List<ProjectResponse> getOverdueProjects(UUID teamId) {
        // Verify team exists and user has access
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        
        List<Project> overdueProjects = projectRepository.findOverdueProjects(LocalDate.now());
        
        // Filter by team
        List<Project> teamOverdueProjects = overdueProjects.stream()
                .filter(project -> project.getTeam().getId().equals(teamId))
                .collect(Collectors.toList());
        
        return teamOverdueProjects.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Validate project dates
     */
    private void validateProjectDates(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }
        
        if (endDate != null && endDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("End date cannot be in the past");
        }
    }
    
    /**
     * Validate status transitions
     */
    private void validateStatusTransition(ProjectStatus currentStatus, ProjectStatus newStatus) {
        // Define valid status transitions
        switch (currentStatus) {
            case PLANNING:
                if (newStatus != ProjectStatus.ACTIVE && newStatus != ProjectStatus.ARCHIVED) {
                    throw new IllegalArgumentException("Invalid status transition from PLANNING to " + newStatus);
                }
                break;
            case ACTIVE:
                if (newStatus != ProjectStatus.ON_HOLD && newStatus != ProjectStatus.COMPLETED && newStatus != ProjectStatus.ARCHIVED) {
                    throw new IllegalArgumentException("Invalid status transition from ACTIVE to " + newStatus);
                }
                break;
            case ON_HOLD:
                if (newStatus != ProjectStatus.ACTIVE && newStatus != ProjectStatus.ARCHIVED) {
                    throw new IllegalArgumentException("Invalid status transition from ON_HOLD to " + newStatus);
                }
                break;
            case COMPLETED:
                if (newStatus != ProjectStatus.ARCHIVED) {
                    throw new IllegalArgumentException("Invalid status transition from COMPLETED to " + newStatus);
                }
                break;
            case ARCHIVED:
                throw new IllegalArgumentException("Cannot change status of archived project");
        }
    }
    
    /**
     * Convert Project entity to ProjectResponse DTO
     */
    private ProjectResponse convertToResponse(Project project) {
        // Convert team
        TeamResponse teamResponse = convertTeamToResponse(project.getTeam());
        
        // Convert creator
        UserResponse creatorResponse = convertUserToResponse(project.getCreatedBy());
        
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getStatus(),
                project.getStartDate(),
                project.getEndDate(),
                teamResponse,
                creatorResponse,
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
    
    /**
     * Convert Team entity to TeamResponse DTO
     */
    private TeamResponse convertTeamToResponse(Team team) {
        UserResponse ownerResponse = convertUserToResponse(team.getOwner());
        
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
     * Convert User entity to UserResponse DTO
     */
    private UserResponse convertUserToResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                user.getLastLogin()
        );
    }
    
    /**
     * Convert ProjectMember entity to ProjectMemberResponse DTO
     */
    private ProjectMemberResponse convertToProjectMemberResponse(ProjectMember projectMember, boolean includeProject) {
        UserResponse userResponse = convertUserToResponse(projectMember.getUser());
        UserResponse assignedByResponse = convertUserToResponse(projectMember.getAssignedBy());
        
        if (includeProject) {
            ProjectResponse projectResponse = convertToResponse(projectMember.getProject());
            return new ProjectMemberResponse(
                    projectMember.getId(),
                    userResponse,
                    projectResponse,
                    assignedByResponse,
                    projectMember.getAssignedAt()
            );
        } else {
            return new ProjectMemberResponse(
                    projectMember.getId(),
                    userResponse,
                    assignedByResponse,
                    projectMember.getAssignedAt()
            );
        }
    }
}