package com.taskmanagement.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for Notification response
 */
@Schema(description = "Notification response containing notification details")
public class NotificationResponse {
    
    @Schema(description = "Notification ID", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID id;
    
    @Schema(description = "Notification type", example = "TASK_ASSIGNED")
    private String type;
    
    @Schema(description = "Notification title", example = "Task Assigned")
    private String title;
    
    @Schema(description = "Notification message", example = "You have been assigned to task 'Implement user authentication'")
    private String message;
    
    @Schema(description = "Type of related entity", example = "Task")
    private String entityType;
    
    @Schema(description = "ID of related entity", example = "123e4567-e89b-12d3-a456-426614174001")
    private UUID entityId;
    
    @Schema(description = "Whether the notification has been read", example = "false")
    private boolean isRead;
    
    @Schema(description = "When the notification was read", example = "2024-01-15T10:30:00")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime readAt;
    
    @Schema(description = "When the notification was created", example = "2024-01-15T10:00:00")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    
    // Default constructor
    public NotificationResponse() {}
    
    // Constructor with all fields
    public NotificationResponse(UUID id, String type, String title, String message, 
                               String entityType, UUID entityId, boolean isRead, 
                               LocalDateTime readAt, LocalDateTime createdAt) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.message = message;
        this.entityType = entityType;
        this.entityId = entityId;
        this.isRead = isRead;
        this.readAt = readAt;
        this.createdAt = createdAt;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
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
    
    public boolean isRead() {
        return isRead;
    }
    
    public void setRead(boolean read) {
        isRead = read;
    }
    
    public LocalDateTime getReadAt() {
        return readAt;
    }
    
    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}