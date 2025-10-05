package com.taskmanagement.dto;

import com.taskmanagement.entity.ProjectStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * DTO for project update requests
 */
@Schema(description = "Request object for updating an existing project")
public class ProjectUpdateRequest {
    
    @Size(min = 3, max = 100, message = "Project name must be between 3 and 100 characters")
    @Schema(description = "Project name", example = "Mobile App Development v2")
    private String name;
    
    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    @Schema(description = "Project description", example = "Updated description for the mobile application project")
    private String description;
    
    @Schema(description = "Project status", example = "ACTIVE")
    private ProjectStatus status;
    
    @Schema(description = "Project start date", example = "2024-02-01")
    private LocalDate startDate;
    
    @Schema(description = "Project end date", example = "2024-07-31")
    private LocalDate endDate;
    
    // Default constructor
    public ProjectUpdateRequest() {}
    
    // Constructor with all fields
    public ProjectUpdateRequest(String name, String description, ProjectStatus status, 
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
        return "ProjectUpdateRequest{" +
                "name='" + name + '\'' +
                ", description='" + description + '\'' +
                ", status=" + status +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                '}';
    }
}