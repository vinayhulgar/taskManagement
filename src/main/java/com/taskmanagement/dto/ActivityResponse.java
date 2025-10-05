package com.taskmanagement.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for Activity response
 */
@Schema(description = "Activity response containing audit trail information")
public class ActivityResponse {
    
    @Schema(description = "Activity ID", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID id;
    
    @Schema(description = "User who performed the action")
    private UserResponse user;
    
    @Schema(description = "Type of entity that was modified", example = "Task")
    private String entityType;
    
    @Schema(description = "ID of the entity that was modified", example = "123e4567-e89b-12d3-a456-426614174001")
    private UUID entityId;
    
    @Schema(description = "Action that was performed", example = "CREATE")
    private String action;
    
    @Schema(description = "Additional details about the action", example = "Task created with title 'Implement user authentication'")
    private String details;
    
    @Schema(description = "Old values before the change (JSON format)")
    private String oldValues;
    
    @Schema(description = "New values after the change (JSON format)")
    private String newValues;
    
    @Schema(description = "Timestamp when the activity occurred", example = "2024-01-15T10:30:00")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    
    // Default constructor
    public ActivityResponse() {}
    
    // Constructor with all fields
    public ActivityResponse(UUID id, UserResponse user, String entityType, UUID entityId, 
                           String action, String details, String oldValues, String newValues, 
                           LocalDateTime timestamp) {
        this.id = id;
        this.user = user;
        this.entityType = entityType;
        this.entityId = entityId;
        this.action = action;
        this.details = details;
        this.oldValues = oldValues;
        this.newValues = newValues;
        this.timestamp = timestamp;
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
    
    public String getEntityType() {
        return entityType;
    }
    
    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }
    
    public UUID getEntityId() {
        return entityId;
    }
    
    public void setEntityId(UUID entityId) {
        this.entityId = entityId;
    }
    
    public String getAction() {
        return action;
    }
    
    public void setAction(String action) {
        this.action = action;
    }
    
    public String getDetails() {
        return details;
    }
    
    public void setDetails(String details) {
        this.details = details;
    }
    
    public String getOldValues() {
        return oldValues;
    }
    
    public void setOldValues(String oldValues) {
        this.oldValues = oldValues;
    }
    
    public String getNewValues() {
        return newValues;
    }
    
    public void setNewValues(String newValues) {
        this.newValues = newValues;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}