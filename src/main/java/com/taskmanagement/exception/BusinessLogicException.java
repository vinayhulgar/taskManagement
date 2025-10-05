package com.taskmanagement.exception;

/**
 * Exception thrown when business logic rules are violated
 */
public class BusinessLogicException extends TaskManagementException {
    
    public BusinessLogicException(String message) {
        super(message, "BUSINESS_LOGIC_ERROR");
    }
    
    public BusinessLogicException(String message, Throwable cause) {
        super(message, "BUSINESS_LOGIC_ERROR", cause);
    }
}