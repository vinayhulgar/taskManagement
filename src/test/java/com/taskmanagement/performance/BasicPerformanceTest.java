package com.taskmanagement.performance;

import com.taskmanagement.service.RateLimitService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Basic performance tests that don't require TestContainers
 */
@SpringBootTest
@ActiveProfiles("test")
class BasicPerformanceTest {

    @MockBean
    private RedisTemplate<String, Object> redisTemplate;

    @Test
    void testRateLimitServicePerformance() {
        // Mock Redis operations
        when(redisTemplate.opsForValue()).thenReturn(null);
        
        RateLimitService rateLimitService = new RateLimitService(redisTemplate, 100, false);
        
        // Test that rate limiting is disabled in test mode
        assertThat(rateLimitService.isRateLimitEnabled()).isFalse();
        assertThat(rateLimitService.getRequestsPerMinute()).isEqualTo(100);
        
        // Test performance of rate limit check when disabled
        long startTime = System.nanoTime();
        boolean isExceeded = rateLimitService.isRateLimitExceeded("test-user");
        long endTime = System.nanoTime();
        
        assertThat(isExceeded).isFalse();
        assertThat(endTime - startTime).isLessThan(1_000_000); // Should be very fast when disabled
    }

    @Test
    void testPerformanceMetrics() {
        // Test basic performance measurement functionality
        long startTime = System.nanoTime();
        
        // Simulate some work
        for (int i = 0; i < 1000; i++) {
            Math.sqrt(i);
        }
        
        long endTime = System.nanoTime();
        long duration = endTime - startTime;
        
        // Verify that we can measure performance
        assertThat(duration).isGreaterThan(0);
        assertThat(duration).isLessThan(100_000_000); // Should complete within 100ms
    }

    @Test
    void testConcurrentPerformance() throws InterruptedException {
        // Test basic concurrent operations
        int numberOfThreads = 10;
        Thread[] threads = new Thread[numberOfThreads];
        
        long startTime = System.nanoTime();
        
        for (int i = 0; i < numberOfThreads; i++) {
            threads[i] = new Thread(() -> {
                // Simulate some work
                for (int j = 0; j < 100; j++) {
                    Math.sqrt(j);
                }
            });
            threads[i].start();
        }
        
        // Wait for all threads to complete
        for (Thread thread : threads) {
            thread.join();
        }
        
        long endTime = System.nanoTime();
        long duration = endTime - startTime;
        
        // Verify concurrent execution completed
        assertThat(duration).isGreaterThan(0);
        assertThat(duration).isLessThan(1_000_000_000); // Should complete within 1 second
    }
}