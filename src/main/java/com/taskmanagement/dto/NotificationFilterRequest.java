package com.taskmanagement.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;

import java.time.LocalDateTime;

/**
 * DTO for filtering notifications
 */
@Schema(description = "Request for filtering notifications with various criteria")
public class NotificationFilterRequest {
    
    @Schema(description = "Filter by notification type", example = "TASK_ASSIGNED")
    private String type;
    
    @Schema(description = "Filter by read status", example = "false")
    private Boolean isRead;
    
    @Schema(description = "Start date for filtering notifications", example = "2024-01-01T00:00:00")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startDate;
    
    @Schema(description = "End date for filtering notifications", example = "2024-01-31T23:59:59")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime endDate;
    
    @Schema(description = "Page number (0-based)", example = "0", defaultValue = "0")
    @Min(value = 0, message = "Page number must be non-negative")
    private int page = 0;
    
    @Schema(description = "Page size", example = "20", defaultValue = "20")
    @Min(value = 1, message = "Page size must be positive")
    private int size = 20;
    
    @Schema(description = "Sort field", example = "createdAt", defaultValue = "createdAt")
    private String sortBy = "createdAt";
    
    @Schema(description = "Sort direction", example = "desc", defaultValue = "desc")
    private String sortDirection = "desc";
    
    // Default constructor
    public NotificationFilterRequest() {}
    
    // Getters and Setters
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public Boolean getIsRead() {
        return isRead;
    }
    
    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }
    
    public LocalDateTime getStartDate() {
        return startDate;
    }
    
    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }
    
    public LocalDateTime getEndDate() {
        return endDate;
    }
    
    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }
    
    public int getPage() {
        return page;
    }
    
    public void setPage(int page) {
        this.page = page;
    }
    
    public int getSize() {
        return size;
    }
    
    public void setSize(int size) {
        this.size = size;
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
}