package com.taskmanagement.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Detailed error information for validation errors
 */
@Schema(description = "Detailed error information")
public class ErrorDetail {
    
    @Schema(description = "Field name that caused the error", example = "email")
    private String field;
    
    @Schema(description = "Error message for the field", example = "Invalid email format")
    private String message;
    
    @Schema(description = "Rejected value", example = "invalid-email")
    private Object rejectedValue;
    
    public ErrorDetail() {}
    
    public ErrorDetail(String field, String message) {
        this.field = field;
        this.message = message;
    }
    
    public ErrorDetail(String field, String message, Object rejectedValue) {
        this.field = field;
        this.message = message;
        this.rejectedValue = rejectedValue;
    }
    
    // Getters and setters
    public String getField() {
        return field;
    }
    
    public void setField(String field) {
        this.field = field;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public Object getRejectedValue() {
        return rejectedValue;
    }
    
    public void setRejectedValue(Object rejectedValue) {
        this.rejectedValue = rejectedValue;
    }
}