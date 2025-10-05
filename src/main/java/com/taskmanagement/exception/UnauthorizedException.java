package com.taskmanagement.exception;

/**
 * Exception thrown when user is not authorized to perform an action
 */
public class UnauthorizedException extends TaskManagementException {
    
    public UnauthorizedException(String message) {
        super(message, "UNAUTHORIZED");
    }
    
    public UnauthorizedException() {
        super("Access denied", "UNAUTHORIZED");
    }
}