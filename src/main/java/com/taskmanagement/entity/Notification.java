package com.taskmanagement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Notification entity for user notifications
 */
@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notification_user", columnList = "user_id"),
    @Index(name = "idx_notification_type", columnList = "type"),
    @Index(name = "idx_notification_read", columnList = "is_read"),
    @Index(name = "idx_notification_created", columnList = "created_at"),
    @Index(name = "idx_notification_entity", columnList = "entity_type, entity_id")
})
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User is required")
    private User user;
    
    @Column(nullable = false)
    @NotBlank(message = "Type is required")
    private String type;
    
    @Column(nullable = false)
    @NotBlank(message = "Title is required")
    private String title;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    @NotBlank(message = "Message is required")
    private String message;
    
    @Column(name = "entity_type")
    private String entityType;
    
    @Column(name = "entity_id")
    private UUID entityId;
    
    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    // Default constructor
    public Notification() {}
    
    // Constructor with required fields
    public Notification(User user, String type, String title, String message) {
        this.user = user;
        this.type = type;
        this.title = title;
        this.message = message;
    }
    
    // Constructor with entity reference
    public Notification(User user, String type, String title, String message, 
                       String entityType, UUID entityId) {
        this.user = user;
        this.type = type;
        this.title = title;
        this.message = message;
        this.entityType = entityType;
        this.entityId = entityId;
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
        if (read && readAt == null) {
            readAt = LocalDateTime.now();
        } else if (!read) {
            readAt = null;
        }
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
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Notification)) return false;
        Notification that = (Notification) o;
        return id != null && id.equals(that.id);
    }
    
    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
    
    @Override
    public String toString() {
        return "Notification{" +
                "id=" + id +
                ", type='" + type + '\'' +
                ", title='" + title + '\'' +
                ", isRead=" + isRead +
                ", createdAt=" + createdAt +
                '}';
    }
}