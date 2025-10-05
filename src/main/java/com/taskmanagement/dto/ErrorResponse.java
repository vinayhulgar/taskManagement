package com.taskmanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Standardized error response DTO
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Error response containing error details")
public class ErrorResponse {
    
    @Schema(description = "Error code", example = "VALIDATION_ERROR")
    private String code;
    
    @Schema(description = "Error message", example = "Request validation failed")
    private String message;
    
    @Schema(description = "Detailed error information")
    private List<ErrorDetail> details;
    
    @Schema(description = "Request ID for tracking", example = "req_123456789")
    private String requestId;
    
    @Schema(description = "Timestamp when error occurred")
    private LocalDateTime timestamp;
    
    @Schema(description = "API path where error occurred", example = "/api/v1/tasks")
    private String path;
    
    public ErrorResponse() {
        this.timestamp = LocalDateTime.now();
    }
    
    public ErrorResponse(String code, String message) {
        this();
        this.code = code;
        this.message = message;
    }
    
    public ErrorResponse(String code, String message, List<ErrorDetail> details) {
        this(code, message);
        this.details = details;
    }
    
    public ErrorResponse(String code, String message, String path) {
        this(code, message);
        this.path = path;
    }
    
    public ErrorResponse(String code, String message, List<ErrorDetail> details, String path) {
        this(code, message, details);
        this.path = path;
    }
    
    // Getters and setters
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public List<ErrorDetail> getDetails() {
        return details;
    }
    
    public void setDetails(List<ErrorDetail> details) {
        this.details = details;
    }
    
    public String getRequestId() {
        return requestId;
    }
    
    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
    
    public String getPath() {
        return path;
    }
    
    public void setPath(String path) {
        this.path = path;
    }
}