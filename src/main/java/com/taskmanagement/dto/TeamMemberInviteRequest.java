package com.taskmanagement.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO for team member invitation requests
 */
public class TeamMemberInviteRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    // Default constructor
    public TeamMemberInviteRequest() {}
    
    // Constructor
    public TeamMemberInviteRequest(String email) {
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
        return "TeamMemberInviteRequest{" +
                "email='" + email + '\'' +
                '}';
    }
}