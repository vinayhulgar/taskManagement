package com.taskmanagement.dto;

import com.taskmanagement.entity.Priority;
import com.taskmanagement.entity.TaskStatus;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for task filtering and search requests
 */
public class TaskFilterRequest {
    
    private UUID projectId;
    private UUID assigneeId;
    private TaskStatus status;
    private Priority priority;
    private String searchTerm;
    
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime dueDateFrom;
    
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime dueDateTo;
    
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime createdFrom;
    
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime createdTo;
    
    private Boolean hasSubtasks;
    private Boolean isOverdue;
    private String sortBy = "createdAt";
    private String sortDirection = "desc";
    
    // Default constructor
    public TaskFilterRequest() {}
    
    // Getters and Setters
    public UUID getProjectId() {
        return projectId;
    }
    
    public void setProjectId(UUID projectId) {
        this.projectId = projectId;
    }
    
    public UUID getAssigneeId() {
        return assigneeId;
    }
    
    public void setAssigneeId(UUID assigneeId) {
        this.assigneeId = assigneeId;
    }
    
    public TaskStatus getStatus() {
        return status;
    }
    
    public void setStatus(TaskStatus status) {
        this.status = status;
    }
    
    public Priority getPriority() {
        return priority;
    }
    
    public void setPriority(Priority priority) {
        this.priority = priority;
    }
    
    public String getSearchTerm() {
        return searchTerm;
    }
    
    public void setSearchTerm(String searchTerm) {
        this.searchTerm = searchTerm;
    }
    
    public LocalDateTime getDueDateFrom() {
        return dueDateFrom;
    }
    
    public void setDueDateFrom(LocalDateTime dueDateFrom) {
        this.dueDateFrom = dueDateFrom;
    }
    
    public LocalDateTime getDueDateTo() {
        return dueDateTo;
    }
    
    public void setDueDateTo(LocalDateTime dueDateTo) {
        this.dueDateTo = dueDateTo;
    }
    
    public LocalDateTime getCreatedFrom() {
        return createdFrom;
    }
    
    public void setCreatedFrom(LocalDateTime createdFrom) {
        this.createdFrom = createdFrom;
    }
    
    public LocalDateTime getCreatedTo() {
        return createdTo;
    }
    
    public void setCreatedTo(LocalDateTime createdTo) {
        this.createdTo = createdTo;
    }
    
    public Boolean getHasSubtasks() {
        return hasSubtasks;
    }
    
    public void setHasSubtasks(Boolean hasSubtasks) {
        this.hasSubtasks = hasSubtasks;
    }
    
    public Boolean getIsOverdue() {
        return isOverdue;
    }
    
    public void setIsOverdue(Boolean isOverdue) {
        this.isOverdue = isOverdue;
    }
    
    public String getSortBy() {
        return sortBy;
    }
    
    public void setSortBy(String sortBy) {
        this.sortBy = sortBy;
    }
    
    public String getSortDirection() {
        return sortDirection;
    }
    
    public void setSortDirection(String sortDirection) {
        this.sortDirection = sortDirection;
    }
    
    @Override
    public String toString() {
        return "TaskFilterRequest{" +
                "projectId=" + projectId +
                ", assigneeId=" + assigneeId +
                ", status=" + status +
                ", priority=" + priority +
                ", searchTerm='" + searchTerm + '\'' +
                ", dueDateFrom=" + dueDateFrom +
                ", dueDateTo=" + dueDateTo +
                ", sortBy='" + sortBy + '\'' +
                ", sortDirection='" + sortDirection + '\'' +
                '}';
    }
}