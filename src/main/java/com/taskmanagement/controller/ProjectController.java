package com.taskmanagement.controller;

import com.taskmanagement.dto.ProjectCreateRequest;
import com.taskmanagement.dto.ProjectMemberAssignRequest;
import com.taskmanagement.dto.ProjectMemberResponse;
import com.taskmanagement.dto.ProjectResponse;
import com.taskmanagement.dto.ProjectUpdateRequest;
import com.taskmanagement.entity.ProjectStatus;
import com.taskmanagement.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for project management operations
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Project Management", description = "APIs for managing projects within teams")
@SecurityRequirement(name = "bearerAuth")
public class ProjectController {
    
    private final ProjectService projectService;
    
    @Autowired
    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }
    
    /**
     * Create a new project within a team
     */
    @PostMapping("/teams/{teamId}/projects")
    @Operation(summary = "Create a new project", description = "Create a new project within the specified team")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Project created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data or validation error"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Team not found"),
        @ApiResponse(responseCode = "409", description = "Project name already exists within team"),
        @ApiResponse(responseCode = "422", description = "Business logic error (e.g., invalid dates)")
    })
    public ResponseEntity<ProjectResponse> createProject(
            @Parameter(description = "Team ID") @PathVariable UUID teamId,
            @Valid @RequestBody ProjectCreateRequest request,
            Authentication authentication) {
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String creatorEmail = userDetails.getUsername();
        
        ProjectResponse response = projectService.createProject(teamId, request, creatorEmail);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    /**
     * Get all projects for a team
     */
    @GetMapping("/teams/{teamId}/projects")
    @Operation(summary = "Get team projects", description = "Get all projects for the specified team")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Projects retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Team not found")
    })
    public ResponseEntity<List<ProjectResponse>> getTeamProjects(
            @Parameter(description = "Team ID") @PathVariable UUID teamId,
            @Parameter(description = "Filter by project status") @RequestParam(required = false) ProjectStatus status) {
        
        List<ProjectResponse> projects;
        if (status != null) {
            projects = projectService.getTeamProjectsByStatus(teamId, status);
        } else {
            projects = projectService.getTeamProjects(teamId);
        }
        
        return ResponseEntity.ok(projects);
    }
    
    /**
     * Get project by ID
     */
    @GetMapping("/projects/{id}")
    @Operation(summary = "Get project by ID", description = "Get project details by project ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Project retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Project not found")
    })
    public ResponseEntity<ProjectResponse> getProjectById(
            @Parameter(description = "Project ID") @PathVariable UUID id) {
        
        ProjectResponse response = projectService.getProjectById(id);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Update project
     */
    @PutMapping("/projects/{id}")
    @Operation(summary = "Update project", description = "Update project details")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Project updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data or validation error"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Project not found"),
        @ApiResponse(responseCode = "409", description = "Project name already exists within team"),
        @ApiResponse(responseCode = "422", description = "Business logic error (e.g., invalid dates or status transition)")
    })
    public ResponseEntity<ProjectResponse> updateProject(
            @Parameter(description = "Project ID") @PathVariable UUID id,
            @Valid @RequestBody ProjectUpdateRequest request) {
        
        ProjectResponse response = projectService.updateProject(id, request);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Delete project
     */
    @DeleteMapping("/projects/{id}")
    @Operation(summary = "Delete project", description = "Delete project")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Project deleted successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Project not found")
    })
    public ResponseEntity<Void> deleteProject(
            @Parameter(description = "Project ID") @PathVariable UUID id) {
        
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Get overdue projects for a team
     */
    @GetMapping("/teams/{teamId}/projects/overdue")
    @Operation(summary = "Get overdue projects", description = "Get all overdue projects for the specified team")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Overdue projects retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Team not found")
    })
    public ResponseEntity<List<ProjectResponse>> getOverdueProjects(
            @Parameter(description = "Team ID") @PathVariable UUID teamId) {
        
        List<ProjectResponse> overdueProjects = projectService.getOverdueProjects(teamId);
        return ResponseEntity.ok(overdueProjects);
    }
    
    /**
     * Assign user to project
     */
    @PostMapping("/projects/{id}/members")
    @Operation(summary = "Assign user to project", description = "Assign a user to the project by email")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "User assigned successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data or user already assigned"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Project or user not found")
    })
    public ResponseEntity<ProjectMemberResponse> assignUserToProject(
            @Parameter(description = "Project ID") @PathVariable UUID id,
            @Valid @RequestBody ProjectMemberAssignRequest request,
            Authentication authentication) {
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String assignerEmail = userDetails.getUsername();
        
        ProjectMemberResponse response = projectService.assignUserToProject(id, request, assignerEmail);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    /**
     * Get project members
     */
    @GetMapping("/projects/{id}/members")
    @Operation(summary = "Get project members", description = "Get all users assigned to the project")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Project members retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Project not found")
    })
    public ResponseEntity<List<ProjectMemberResponse>> getProjectMembers(
            @Parameter(description = "Project ID") @PathVariable UUID id) {
        
        List<ProjectMemberResponse> members = projectService.getProjectMembers(id);
        return ResponseEntity.ok(members);
    }
    
    /**
     * Remove user from project
     */
    @DeleteMapping("/projects/{id}/members/{userId}")
    @Operation(summary = "Remove user from project", description = "Remove a user assignment from the project")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "User removed successfully"),
        @ApiResponse(responseCode = "400", description = "User not assigned to project"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Project or user not found")
    })
    public ResponseEntity<Void> removeUserFromProject(
            @Parameter(description = "Project ID") @PathVariable UUID id,
            @Parameter(description = "User ID") @PathVariable UUID userId) {
        
        projectService.removeUserFromProject(id, userId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Get user's assigned projects
     */
    @GetMapping("/projects/assigned")
    @Operation(summary = "Get user's assigned projects", description = "Get all projects assigned to the authenticated user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Assigned projects retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<List<ProjectResponse>> getUserAssignedProjects(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String userEmail = userDetails.getUsername();
        
        List<ProjectResponse> projects = projectService.getUserAssignedProjects(userEmail);
        return ResponseEntity.ok(projects);
    }
}