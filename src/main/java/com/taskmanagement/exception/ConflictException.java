package com.taskmanagement.exception;

/**
 * Exception thrown when there's a conflict with existing data
 */
public class ConflictException extends TaskManagementException {
    
    public ConflictException(String message) {
        super(message, "CONFLICT");
    }
    
    public ConflictException(String resourceType, String field, String value) {
        super(String.format("%s with %s '%s' already exists", resourceType, field, value), "CONFLICT");
    }
}