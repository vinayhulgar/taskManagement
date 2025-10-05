package com.taskmanagement.dto;

import com.taskmanagement.entity.ProjectStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for project response data
 */
@Schema(description = "Response object containing project information")
public class ProjectResponse {
    
    @Schema(description = "Project unique identifier", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID id;
    
    @Schema(description = "Project name", example = "Mobile App Development")
    private String name;
    
    @Schema(description = "Project description", example = "Development of a new mobile application for task management")
    private String description;
    
    @Schema(description = "Project status", example = "ACTIVE")
    private ProjectStatus status;
    
    @Schema(description = "Project start date", example = "2024-01-15")
    private LocalDate startDate;
    
    @Schema(description = "Project end date", example = "2024-06-30")
    private LocalDate endDate;
    
    @Schema(description = "Team information")
    private TeamResponse team;
    
    @Schema(description = "User who created the project")
    private UserResponse createdBy;
    
    @Schema(description = "Project creation timestamp", example = "2024-01-10T10:30:00")
    private LocalDateTime createdAt;
    
    @Schema(description = "Project last update timestamp", example = "2024-01-15T14:45:00")
    private LocalDateTime updatedAt;
    
    // Default constructor
    public ProjectResponse() {}
    
    // Constructor with all fields
    public ProjectResponse(UUID id, String name, String description, ProjectStatus status,
                          LocalDate startDate, LocalDate endDate, TeamResponse team,
                          UserResponse createdBy, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
        this.team = team;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public ProjectStatus getStatus() {
        return status;
    }
    
    public void setStatus(ProjectStatus status) {
        this.status = status;
    }
    
    public LocalDate getStartDate() {
        return startDate;
    }
    
    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }
    
    public LocalDate getEndDate() {
        return endDate;
    }
    
    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
    
    public TeamResponse getTeam() {
        return team;
    }
    
    public void setTeam(TeamResponse team) {
        this.team = team;
    }
    
    public UserResponse getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(UserResponse createdBy) {
        this.createdBy = createdBy;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    @Override
    public String toString() {
        return "ProjectResponse{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", status=" + status +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                ", createdAt=" + createdAt +
                '}';
    }
}