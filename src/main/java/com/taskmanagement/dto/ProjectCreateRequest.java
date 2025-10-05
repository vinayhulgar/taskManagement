package com.taskmanagement.dto;

import com.taskmanagement.entity.ProjectStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * DTO for project creation requests
 */
@Schema(description = "Request object for creating a new project")
public class ProjectCreateRequest {
    
    @NotBlank(message = "Project name is required")
    @Size(min = 3, max = 100, message = "Project name must be between 3 and 100 characters")
    @Schema(description = "Project name", example = "Mobile App Development", required = true)
    private String name;
    
    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    @Schema(description = "Project description", example = "Development of a new mobile application for task management")
    private String description;
    
    @NotNull(message = "Project status is required")
    @Schema(description = "Project status", example = "PLANNING", required = true)
    private ProjectStatus status;
    
    @Schema(description = "Project start date", example = "2024-01-15")
    private LocalDate startDate;
    
    @Schema(description = "Project end date", example = "2024-06-30")
    private LocalDate endDate;
    
    // Default constructor
    public ProjectCreateRequest() {}
    
    // Constructor with all fields
    public ProjectCreateRequest(String name, String description, ProjectStatus status, 
                               LocalDate startDate, LocalDate endDate) {
        this.name = name;
        this.description = description;
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
    }
    
    // Getters and Setters
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
    
    @Override
    public String toString() {
        return "ProjectCreateRequest{" +
                "name='" + name + '\'' +
                ", description='" + description + '\'' +
                ", status=" + status +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                '}';
    }
}