package com.taskmanagement.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO for project member assignment requests
 */
@Schema(description = "Request object for assigning a user to a project")
public class ProjectMemberAssignRequest {
    
    @NotBlank(message = "User email is required")
    @Email(message = "Email must be valid")
    @Schema(description = "Email of the user to assign to the project", example = "user@example.com", required = true)
    private String email;
    
    // Default constructor
    public ProjectMemberAssignRequest() {}
    
    // Constructor with email
    public ProjectMemberAssignRequest(String email) {
        this.email = email;
    }
    
    // Getters and Setters
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    @Override
    public String toString() {
        return "ProjectMemberAssignRequest{" +
                "email='" + email + '\'' +
                '}';
    }
}