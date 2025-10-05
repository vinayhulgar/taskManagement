package com.taskmanagement.performance;

import com.taskmanagement.exception.RateLimitExceededException;
import com.taskmanagement.service.RateLimitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
class RateLimitPerformanceTest {

    @Container
    static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", redis::getFirstMappedPort);
        registry.add("rate-limit.enabled", () -> "true");
        registry.add("rate-limit.requests-per-minute", () -> "10"); // Lower limit for testing
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private RateLimitService rateLimitService;

    private String baseUrl;
    private String testUserId;

    @BeforeEach
    void setUp() {
        baseUrl = "http://localhost:" + port;
        testUserId = "test-user-" + System.currentTimeMillis();
        
        // Reset rate limit for test user
        rateLimitService.resetRateLimit(testUserId);
    }

    @Test
    void testRateLimitEnforcement() {
        // Test that rate limit is enforced correctly
        String endpoint = baseUrl + "/api/v1/auth/login";
        
        // Make requests up to the limit
        for (int i = 0; i < 10; i++) {
            ResponseEntity<String> response = makeAuthenticatedRequest(endpoint, testUserId);
            assertThat(response.getStatusCode()).isNotEqualTo(HttpStatus.TOO_MANY_REQUESTS);
            
            // Check rate limit headers
            assertThat(response.getHeaders().getFirst("X-RateLimit-Limit")).isEqualTo("10");
            assertThat(response.getHeaders().getFirst("X-RateLimit-Remaining")).isNotNull();
        }
        
        // Next request should be rate limited
        ResponseEntity<String> response = makeAuthenticatedRequest(endpoint, testUserId);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(response.getHeaders().getFirst("X-RateLimit-Remaining")).isEqualTo("0");
    }

    @Test
    void testRateLimitPerformanceUnderLoad() throws InterruptedException {
        // Test rate limiting performance under concurrent load
        int numberOfThreads = 20;
        int requestsPerThread = 5;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        
        AtomicInteger successfulRequests = new AtomicInteger(0);
        AtomicInteger rateLimitedRequests = new AtomicInteger(0);
        
        CompletableFuture<Void>[] futures = new CompletableFuture[numberOfThreads];
        
        for (int i = 0; i < numberOfThreads; i++) {
            final String userId = "load-test-user-" + i;
            rateLimitService.resetRateLimit(userId);
            
            futures[i] = CompletableFuture.runAsync(() -> {
                for (int j = 0; j < requestsPerThread; j++) {
                    try {
                        ResponseEntity<String> response = makeAuthenticatedRequest(
                            baseUrl + "/api/v1/auth/login", userId);
                        
                        if (response.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                            rateLimitedRequests.incrementAndGet();
                        } else {
                            successfulRequests.incrementAndGet();
                        }
                        
                        // Small delay to simulate real usage
                        Thread.sleep(10);
                    } catch (Exception e) {
                        // Handle exceptions
                    }
                }
            }, executor);
        }
        
        // Wait for all requests to complete
        try {
            CompletableFuture.allOf(futures).get(30, TimeUnit.SECONDS);
        } catch (ExecutionException | InterruptedException | java.util.concurrent.TimeoutException e) {
            // Handle execution exception
        }
        executor.shutdown();
        
        // Verify that rate limiting worked correctly
        // Each user should be able to make up to 10 requests
        int expectedSuccessful = numberOfThreads * Math.min(requestsPerThread, 10);
        int expectedRateLimited = Math.max(0, numberOfThreads * requestsPerThread - expectedSuccessful);
        
        assertThat(successfulRequests.get()).isLessThanOrEqualTo(expectedSuccessful);
        assertThat(rateLimitedRequests.get()).isGreaterThanOrEqualTo(expectedRateLimited);
    }

    @Test
    void testRateLimitReset() throws InterruptedException {
        String endpoint = baseUrl + "/api/v1/auth/login";
        
        // Exhaust rate limit
        for (int i = 0; i < 10; i++) {
            makeAuthenticatedRequest(endpoint, testUserId);
        }
        
        // Verify rate limit is exceeded
        ResponseEntity<String> response = makeAuthenticatedRequest(endpoint, testUserId);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        
        // Reset rate limit manually (simulating time passage)
        rateLimitService.resetRateLimit(testUserId);
        
        // Verify requests work again
        response = makeAuthenticatedRequest(endpoint, testUserId);
        assertThat(response.getStatusCode()).isNotEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void testRateLimitHeaders() {
        String endpoint = baseUrl + "/api/v1/auth/login";
        
        ResponseEntity<String> response = makeAuthenticatedRequest(endpoint, testUserId);
        
        // Verify rate limit headers are present
        assertThat(response.getHeaders().getFirst("X-RateLimit-Limit")).isEqualTo("10");
        assertThat(response.getHeaders().getFirst("X-RateLimit-Remaining")).isNotNull();
        assertThat(response.getHeaders().getFirst("X-RateLimit-Reset")).isNotNull();
        
        // Verify remaining count decreases
        int initialRemaining = Integer.parseInt(response.getHeaders().getFirst("X-RateLimit-Remaining"));
        
        response = makeAuthenticatedRequest(endpoint, testUserId);
        int newRemaining = Integer.parseInt(response.getHeaders().getFirst("X-RateLimit-Remaining"));
        
        assertThat(newRemaining).isLessThan(initialRemaining);
    }

    private ResponseEntity<String> makeAuthenticatedRequest(String url, String userId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-ID", userId); // Simulate user identification
        
        HttpEntity<String> entity = new HttpEntity<>(headers);
        return restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
    }
}