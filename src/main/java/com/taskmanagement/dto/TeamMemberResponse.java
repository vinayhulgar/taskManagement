package com.taskmanagement.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for team member response data
 */
public class TeamMemberResponse {
    
    private UUID id;
    private UserResponse user;
    private LocalDateTime joinedAt;
    private UserResponse invitedBy;
    
    // Default constructor
    public TeamMemberResponse() {}
    
    // Constructor
    public TeamMemberResponse(UUID id, UserResponse user, LocalDateTime joinedAt, UserResponse invitedBy) {
        this.id = id;
        this.user = user;
        this.joinedAt = joinedAt;
        this.invitedBy = invitedBy;
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
    
    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }
    
    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }
    
    public UserResponse getInvitedBy() {
        return invitedBy;
    }
    
    public void setInvitedBy(UserResponse invitedBy) {
        this.invitedBy = invitedBy;
    }
    
    @Override
    public String toString() {
        return "TeamMemberResponse{" +
                "id=" + id +
                ", user=" + user +
                ", joinedAt=" + joinedAt +
                ", invitedBy=" + invitedBy +
                '}';
    }
}