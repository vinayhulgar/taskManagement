package com.taskmanagement.interceptor;

import com.taskmanagement.exception.RateLimitExceededException;
import com.taskmanagement.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimitService rateLimitService;

    public RateLimitInterceptor(RateLimitService rateLimitService) {
        this.rateLimitService = rateLimitService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Skip rate limiting for health checks and documentation endpoints
        String requestURI = request.getRequestURI();
        if (requestURI.contains("/actuator/") || 
            requestURI.contains("/swagger-ui") || 
            requestURI.contains("/api-docs") ||
            requestURI.contains("/favicon.ico")) {
            return true;
        }

        // Get user identifier
        String userId = getUserIdentifier(request);
        
        // Check rate limit
        if (rateLimitService.isRateLimitExceeded(userId)) {
            // Add rate limit headers
            addRateLimitHeaders(response, userId);
            throw new RateLimitExceededException(rateLimitService.getTimeUntilReset(userId));
        }

        // Add rate limit headers for successful requests
        addRateLimitHeaders(response, userId);
        
        return true;
    }

    private String getUserIdentifier(HttpServletRequest request) {
        // Try to get authenticated user ID
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && 
            !authentication.getName().equals("anonymousUser")) {
            return authentication.getName();
        }
        
        // Fall back to IP address for unauthenticated requests
        String clientIp = getClientIpAddress(request);
        return "ip:" + clientIp;
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }

    private void addRateLimitHeaders(HttpServletResponse response, String userId) {
        response.setHeader("X-RateLimit-Limit", String.valueOf(rateLimitService.getRequestsPerMinute()));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(rateLimitService.getRemainingRequests(userId)));
        response.setHeader("X-RateLimit-Reset", String.valueOf((System.currentTimeMillis() / 1000) + rateLimitService.getTimeUntilReset(userId)));
    }
}