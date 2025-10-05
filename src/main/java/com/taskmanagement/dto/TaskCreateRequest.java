package com.taskmanagement.dto;

import com.taskmanagement.entity.Priority;
import com.taskmanagement.entity.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for task creation requests
 */
public class TaskCreateRequest {
    
    @NotBlank(message = "Task title is required")
    @Size(min = 3, max = 200, message = "Task title must be between 3 and 200 characters")
    private String title;
    
    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;
    
    @NotNull(message = "Task status is required")
    private TaskStatus status;
    
    @NotNull(message = "Task priority is required")
    private Priority priority;
    
    private UUID assigneeId;
    
    private LocalDateTime dueDate;
    
    private UUID parentTaskId;
    
    // Default constructor
    public TaskCreateRequest() {}
    
    // Constructor with required fields
    public TaskCreateRequest(String title, String description, TaskStatus status, Priority priority) {
        this.title = title;
        this.description = description;
        this.status = status;
        this.priority = priority;
    }
    
    // Getters and Setters
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
    
    public UUID getAssigneeId() {
        return assigneeId;
    }
    
    public void setAssigneeId(UUID assigneeId) {
        this.assigneeId = assigneeId;
    }
    
    public LocalDateTime getDueDate() {
        return dueDate;
    }
    
    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }
    
    public UUID getParentTaskId() {
        return parentTaskId;
    }
    
    public void setParentTaskId(UUID parentTaskId) {
        this.parentTaskId = parentTaskId;
    }
    
    @Override
    public String toString() {
        return "TaskCreateRequest{" +
                "title='" + title + '\'' +
                ", status=" + status +
                ", priority=" + priority +
                ", assigneeId=" + assigneeId +
                ", dueDate=" + dueDate +
                ", parentTaskId=" + parentTaskId +
                '}';
    }
}