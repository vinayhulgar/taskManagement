package com.taskmanagement.exception;

/**
 * Base exception class for task management application
 */
public abstract class TaskManagementException extends RuntimeException {
    
    private final String errorCode;
    
    public TaskManagementException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public TaskManagementException(String message, String errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
}