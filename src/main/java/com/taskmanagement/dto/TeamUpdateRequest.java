package com.taskmanagement.dto;

import jakarta.validation.constraints.Size;

/**
 * DTO for team update requests
 */
public class TeamUpdateRequest {
    
    @Size(min = 3, max = 50, message = "Team name must be between 3 and 50 characters")
    private String name;
    
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;
    
    // Default constructor
    public TeamUpdateRequest() {}
    
    // Constructor
    public TeamUpdateRequest(String name, String description) {
        this.name = name;
        this.description = description;
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
    
    @Override
    public String toString() {
        return "TeamUpdateRequest{" +
                "name='" + name + '\'' +
                ", description='" + description + '\'' +
                '}';
    }
}