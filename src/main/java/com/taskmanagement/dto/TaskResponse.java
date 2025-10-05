package com.taskmanagement.dto;

import com.taskmanagement.entity.Priority;
import com.taskmanagement.entity.TaskStatus;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for task responses
 */
public class TaskResponse {
    
    private UUID id;
    private UUID projectId;
    private String projectName;
    private UUID parentTaskId;
    private String parentTaskTitle;
    private String title;
    private String description;
    private TaskStatus status;
    private Priority priority;
    private UserResponse assignee;
    private LocalDateTime dueDate;
    private UserResponse createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean hasSubtasks;
    private int subtaskCount;
    
    // Default constructor
    public TaskResponse() {}
    
    // Constructor with required fields
    public TaskResponse(UUID id, UUID projectId, String projectName, String title, 
                       String description, TaskStatus status, Priority priority, 
                       LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.projectId = projectId;
        this.projectName = projectName;
        this.title = title;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public UUID getProjectId() {
        return projectId;
    }
    
    public void setProjectId(UUID projectId) {
        this.projectId = projectId;
    }
    
    public String getProjectName() {
        return projectName;
    }
    
    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }
    
    public UUID getParentTaskId() {
        return parentTaskId;
    }
    
    public void setParentTaskId(UUID parentTaskId) {
        this.parentTaskId = parentTaskId;
    }
    
    public String getParentTaskTitle() {
        return parentTaskTitle;
    }
    
    public void setParentTaskTitle(String parentTaskTitle) {
        this.parentTaskTitle = parentTaskTitle;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
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
    
    public UserResponse getAssignee() {
        return assignee;
    }
    
    public void setAssignee(UserResponse assignee) {
        this.assignee = assignee;
    }
    
    public LocalDateTime getDueDate() {
        return dueDate;
    }
    
    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }
    
    public UserResponse getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(UserResponse createdBy) {
        this.createdBy = createdBy;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public boolean isHasSubtasks() {
        return hasSubtasks;
    }
    
    public void setHasSubtasks(boolean hasSubtasks) {
        this.hasSubtasks = hasSubtasks;
    }
    
    public int getSubtaskCount() {
        return subtaskCount;
    }
    
    public void setSubtaskCount(int subtaskCount) {
        this.subtaskCount = subtaskCount;
    }
    
    @Override
    public String toString() {
        return "TaskResponse{" +
                "id=" + id +
                ", projectId=" + projectId +
                ", title='" + title + '\'' +
                ", status=" + status +
                ", priority=" + priority +
                ", dueDate=" + dueDate +
                ", hasSubtasks=" + hasSubtasks +
                ", subtaskCount=" + subtaskCount +
                '}';
    }
}