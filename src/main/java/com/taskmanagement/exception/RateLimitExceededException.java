package com.taskmanagement.exception;

/**
 * Exception thrown when rate limit is exceeded
 */
public class RateLimitExceededException extends TaskManagementException {
    
    private final long retryAfterSeconds;
    
    public RateLimitExceededException(long retryAfterSeconds) {
        super("Rate limit exceeded. Please try again later.", "RATE_LIMIT_EXCEEDED");
        this.retryAfterSeconds = retryAfterSeconds;
    }
    
    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}