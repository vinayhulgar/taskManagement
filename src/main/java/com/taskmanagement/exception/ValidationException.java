package com.taskmanagement.exception;

/**
 * Exception thrown when business logic validation fails
 */
public class ValidationException extends TaskManagementException {
    
    public ValidationException(String message) {
        super(message, "VALIDATION_ERROR");
    }
    
    public ValidationException(String message, Throwable cause) {
        super(message, "VALIDATION_ERROR", cause);
    }
}