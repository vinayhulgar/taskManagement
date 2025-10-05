package com.taskmanagement.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing team membership relationships
 */
@Entity
@Table(name = "team_members", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"team_id", "user_id"}),
       indexes = {
           @Index(name = "idx_team_member_team", columnList = "team_id"),
           @Index(name = "idx_team_member_user", columnList = "user_id")
       })
public class TeamMember {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by")
    private User invitedBy;
    
    // Default constructor
    public TeamMember() {}
    
    // Constructor
    public TeamMember(Team team, User user, User invitedBy) {
        this.team = team;
        this.user = user;
        this.invitedBy = invitedBy;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public Team getTeam() {
        return team;
    }
    
    public void setTeam(Team team) {
        this.team = team;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }
    
    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }
    
    public User getInvitedBy() {
        return invitedBy;
    }
    
    public void setInvitedBy(User invitedBy) {
        this.invitedBy = invitedBy;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TeamMember)) return false;
        TeamMember that = (TeamMember) o;
        return id != null && id.equals(that.id);
    }
    
    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
    
    @Override
    public String toString() {
        return "TeamMember{" +
                "id=" + id +
                ", joinedAt=" + joinedAt +
                '}';
    }
}