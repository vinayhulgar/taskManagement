package com.taskmanagement.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Service
public class RateLimitService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final int requestsPerMinute;
    private final boolean rateLimitEnabled;

    public RateLimitService(RedisTemplate<String, Object> redisTemplate,
                           @Value("${rate-limit.requests-per-minute:100}") int requestsPerMinute,
                           @Value("${rate-limit.enabled:true}") boolean rateLimitEnabled) {
        this.redisTemplate = redisTemplate;
        this.requestsPerMinute = requestsPerMinute;
        this.rateLimitEnabled = rateLimitEnabled;
    }

    /**
     * Check if the user has exceeded the rate limit
     * @param userId the user identifier
     * @return true if rate limit is exceeded, false otherwise
     */
    public boolean isRateLimitExceeded(String userId) {
        if (!rateLimitEnabled) {
            return false;
        }

        String key = "rate_limit:" + userId;
        
        // Get current count
        Integer currentCount = (Integer) redisTemplate.opsForValue().get(key);
        
        if (currentCount == null) {
            // First request in this window
            redisTemplate.opsForValue().set(key, 1, Duration.ofMinutes(1));
            return false;
        }
        
        if (currentCount >= requestsPerMinute) {
            return true;
        }
        
        // Increment counter
        redisTemplate.opsForValue().increment(key);
        return false;
    }

    /**
     * Get the current request count for a user
     * @param userId the user identifier
     * @return current request count
     */
    public int getCurrentRequestCount(String userId) {
        if (!rateLimitEnabled) {
            return 0;
        }

        String key = "rate_limit:" + userId;
        Integer count = (Integer) redisTemplate.opsForValue().get(key);
        return count != null ? count : 0;
    }

    /**
     * Get the remaining requests for a user
     * @param userId the user identifier
     * @return remaining requests in current window
     */
    public int getRemainingRequests(String userId) {
        if (!rateLimitEnabled) {
            return requestsPerMinute;
        }

        int currentCount = getCurrentRequestCount(userId);
        return Math.max(0, requestsPerMinute - currentCount);
    }

    /**
     * Get the time until rate limit window resets
     * @param userId the user identifier
     * @return seconds until reset
     */
    public long getTimeUntilReset(String userId) {
        if (!rateLimitEnabled) {
            return 0;
        }

        String key = "rate_limit:" + userId;
        Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
        return ttl != null ? ttl : 0;
    }

    /**
     * Reset rate limit for a user (for testing purposes)
     * @param userId the user identifier
     */
    public void resetRateLimit(String userId) {
        String key = "rate_limit:" + userId;
        redisTemplate.delete(key);
    }

    public int getRequestsPerMinute() {
        return requestsPerMinute;
    }

    public boolean isRateLimitEnabled() {
        return rateLimitEnabled;
    }
}