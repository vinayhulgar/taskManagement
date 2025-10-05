package com.taskmanagement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Activity entity for audit trail logging
 */
@Entity
@Table(name = "activities", indexes = {
    @Index(name = "idx_activity_user", columnList = "user_id"),
    @Index(name = "idx_activity_entity", columnList = "entity_type, entity_id"),
    @Index(name = "idx_activity_action", columnList = "action"),
    @Index(name = "idx_activity_timestamp", columnList = "timestamp")
})
public class Activity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User is required")
    private User user;
    
    @Column(name = "entity_type", nullable = false)
    @NotBlank(message = "Entity type is required")
    private String entityType;
    
    @Column(name = "entity_id", nullable = false)
    @NotNull(message = "Entity ID is required")
    private UUID entityId;
    
    @Column(nullable = false)
    @NotBlank(message = "Action is required")
    private String action;
    
    @Column(columnDefinition = "TEXT")
    private String details;
    
    @Column(name = "old_values", columnDefinition = "TEXT")
    private String oldValues;
    
    @Column(name = "new_values", columnDefinition = "TEXT")
    private String newValues;
    
    @CreationTimestamp
    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;
    
    // Default constructor
    public Activity() {}
    
    // Constructor with required fields
    public Activity(User user, String entityType, UUID entityId, String action) {
        this.user = user;
        this.entityType = entityType;
        this.entityId = entityId;
        this.action = action;
    }
    
    // Constructor with all fields
    public Activity(User user, String entityType, UUID entityId, String action, 
                   String details, String oldValues, String newValues) {
        this.user = user;
        this.entityType = entityType;
        this.entityId = entityId;
        this.action = action;
        this.details = details;
        this.oldValues = oldValues;
        this.newValues = newValues;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
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
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Activity)) return false;
        Activity activity = (Activity) o;
        return id != null && id.equals(activity.id);
    }
    
    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
    
    @Override
    public String toString() {
        return "Activity{" +
                "id=" + id +
                ", entityType='" + entityType + '\'' +
                ", entityId=" + entityId +
                ", action='" + action + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }
}