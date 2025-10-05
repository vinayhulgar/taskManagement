package com.taskmanagement.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ProjectMember entity representing project assignments
 */
@Entity
@Table(name = "project_members", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "user_id"}),
       indexes = {
           @Index(name = "idx_project_member_project", columnList = "project_id"),
           @Index(name = "idx_project_member_user", columnList = "user_id"),
           @Index(name = "idx_project_member_assigned_by", columnList = "assigned_by")
       })
public class ProjectMember {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy;
    
    @CreationTimestamp
    @Column(name = "assigned_at", nullable = false, updatable = false)
    private LocalDateTime assignedAt;
    
    // Default constructor
    public ProjectMember() {}
    
    // Constructor with required fields
    public ProjectMember(Project project, User user, User assignedBy) {
        this.project = project;
        this.user = user;
        this.assignedBy = assignedBy;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public Project getProject() {
        return project;
    }
    
    public void setProject(Project project) {
        this.project = project;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public User getAssignedBy() {
        return assignedBy;
    }
    
    public void setAssignedBy(User assignedBy) {
        this.assignedBy = assignedBy;
    }
    
    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }
    
    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProjectMember)) return false;
        ProjectMember that = (ProjectMember) o;
        return id != null && id.equals(that.id);
    }
    
    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
    
    @Override
    public String toString() {
        return "ProjectMember{" +
                "id=" + id +
                ", assignedAt=" + assignedAt +
                '}';
    }
}