package com.taskmanagement.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for project member response data
 */
@Schema(description = "Response object containing project member information")
public class ProjectMemberResponse {
    
    @Schema(description = "Project member unique identifier", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID id;
    
    @Schema(description = "User information")
    private UserResponse user;
    
    @Schema(description = "Project information")
    private ProjectResponse project;
    
    @Schema(description = "User who assigned this member to the project")
    private UserResponse assignedBy;
    
    @Schema(description = "Assignment timestamp", example = "2024-01-15T10:30:00")
    private LocalDateTime assignedAt;
    
    // Default constructor
    public ProjectMemberResponse() {}
    
    // Constructor with all fields
    public ProjectMemberResponse(UUID id, UserResponse user, ProjectResponse project,
                                UserResponse assignedBy, LocalDateTime assignedAt) {
        this.id = id;
        this.user = user;
        this.project = project;
        this.assignedBy = assignedBy;
        this.assignedAt = assignedAt;
    }
    
    // Constructor without project (for project member lists)
    public ProjectMemberResponse(UUID id, UserResponse user, UserResponse assignedBy, LocalDateTime assignedAt) {
        this.id = id;
        this.user = user;
        this.assignedBy = assignedBy;
        this.assignedAt = assignedAt;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public UserResponse getUser() {
        return user;
    }
    
    public void setUser(UserResponse user) {
        this.user = user;
    }
    
    public ProjectResponse getProject() {
        return project;
    }
    
    public void setProject(ProjectResponse project) {
        this.project = project;
    }
    
    public UserResponse getAssignedBy() {
        return assignedBy;
    }
    
    public void setAssignedBy(UserResponse assignedBy) {
        this.assignedBy = assignedBy;
    }
    
    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }
    
    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }
    
    @Override
    public String toString() {
        return "ProjectMemberResponse{" +
                "id=" + id +
                ", assignedAt=" + assignedAt +
                '}';
    }
}