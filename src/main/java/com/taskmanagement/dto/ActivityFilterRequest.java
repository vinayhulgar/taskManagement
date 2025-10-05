package com.taskmanagement.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for filtering activities
 */
@Schema(description = "Request for filtering activities with various criteria")
public class ActivityFilterRequest {
    
    @Schema(description = "Filter by entity type", example = "Task")
    private String entityType;
    
    @Schema(description = "Filter by entity ID", example = "123e4567-e89b-12d3-a456-426614174001")
    private UUID entityId;
    
    @Schema(description = "Filter by action", example = "CREATE")
    private String action;
    
    @Schema(description = "Filter by user ID", example = "123e4567-e89b-12d3-a456-426614174002")
    private UUID userId;
    
    @Schema(description = "Start date for filtering activities", example = "2024-01-01T00:00:00")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startDate;
    
    @Schema(description = "End date for filtering activities", example = "2024-01-31T23:59:59")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime endDate;
    
    @Schema(description = "Page number (0-based)", example = "0", defaultValue = "0")
    @Min(value = 0, message = "Page number must be non-negative")
    private int page = 0;
    
    @Schema(description = "Page size", example = "20", defaultValue = "20")
    @Min(value = 1, message = "Page size must be positive")
    private int size = 20;
    
    @Schema(description = "Sort field", example = "timestamp", defaultValue = "timestamp")
    private String sortBy = "timestamp";
    
    @Schema(description = "Sort direction", example = "desc", defaultValue = "desc")
    private String sortDirection = "desc";
    
    // Default constructor
    public ActivityFilterRequest() {}
    
    // Getters and Setters
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
    
    public UUID getUserId() {
        return userId;
    }
    
    public void setUserId(UUID userId) {
        this.userId = userId;
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