package com.taskmanagement.performance;

import com.taskmanagement.dto.*;
import com.taskmanagement.entity.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
class ComprehensivePerformanceTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgres:15-alpine"))
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", redis::getFirstMappedPort);
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("rate-limit.enabled", () -> "true");
        registry.add("rate-limit.requests-per-minute", () -> "1000"); // Higher limit for performance tests
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private String baseUrl;
    private List<String> authTokens;
    private List<UUID> userIds;
    private List<UUID> teamIds;
    private List<UUID> projectIds;

    @BeforeEach
    void setUp() {
        baseUrl = "http://localhost:" + port + "/api/v1";
        setupTestData();
    }

    @Test
    void testSystemPerformanceUnderLoad() throws InterruptedException {
        // Test system performance under realistic load
        int numberOfUsers = 50;
        int operationsPerUser = 20;
        
        ExecutorService executor = Executors.newFixedThreadPool(numberOfUsers);
        AtomicLong totalResponseTime = new AtomicLong(0);
        AtomicInteger totalOperations = new AtomicInteger(0);
        AtomicInteger successfulOperations = new AtomicInteger(0);
        AtomicInteger failedOperations = new AtomicInteger(0);
        
        CompletableFuture<Void>[] futures = new CompletableFuture[numberOfUsers];
        
        for (int i = 0; i < numberOfUsers; i++) {
            final int userIndex = i % authTokens.size();
            final String token = authTokens.get(userIndex);
            final UUID userId = userIds.get(userIndex);
            final UUID projectId = projectIds.get(userIndex % projectIds.size());
            
            futures[i] = CompletableFuture.runAsync(() -> {
                for (int j = 0; j < operationsPerUser; j++) {
                    try {
                        long startTime = System.nanoTime();
                        
                        // Perform different operations
                        switch (j % 5) {
                            case 0:
                                performUserProfileOperation(token);
                                break;
                            case 1:
                                performTeamListOperation(token);
                                break;
                            case 2:
                                performProjectListOperation(token, teamIds.get(userIndex % teamIds.size()));
                                break;
                            case 3:
                                performTaskCreationOperation(token, projectId, userId);
                                break;
                            case 4:
                                performTaskListOperation(token, projectId);
                                break;
                        }
                        
                        long responseTime = System.nanoTime() - startTime;
                        totalResponseTime.addAndGet(responseTime);
                        totalOperations.incrementAndGet();
                        successfulOperations.incrementAndGet();
                        
                    } catch (Exception e) {
                        failedOperations.incrementAndGet();
                        totalOperations.incrementAndGet();
                    }
                }
            }, executor);
        }
        
        try {
            CompletableFuture.allOf(futures).get(120, TimeUnit.SECONDS);
        } catch (Exception e) {
            // Handle exception
        }
        executor.shutdown();
        
        // Calculate performance metrics
        long averageResponseTime = totalResponseTime.get() / Math.max(1, successfulOperations.get());
        double successRate = (double) successfulOperations.get() / totalOperations.get() * 100;
        
        // Performance assertions
        assertThat(averageResponseTime).isLessThan(200_000_000); // 200ms average
        assertThat(successRate).isGreaterThan(95.0); // 95% success rate
        assertThat(totalOperations.get()).isEqualTo(numberOfUsers * operationsPerUser);
        
        System.out.println("Performance Test Results:");
        System.out.println("Total Operations: " + totalOperations.get());
        System.out.println("Successful Operations: " + successfulOperations.get());
        System.out.println("Failed Operations: " + failedOperations.get());
        System.out.println("Success Rate: " + String.format("%.2f%%", successRate));
        System.out.println("Average Response Time: " + String.format("%.2fms", averageResponseTime / 1_000_000.0));
    }

    @Test
    void testDatabaseConnectionPoolPerformance() throws InterruptedException {
        // Test database connection pool under concurrent load
        int numberOfThreads = 100;
        int queriesPerThread = 10;
        
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        AtomicLong totalQueryTime = new AtomicLong(0);
        AtomicInteger completedQueries = new AtomicInteger(0);
        
        CompletableFuture<Void>[] futures = new CompletableFuture[numberOfThreads];
        
        for (int i = 0; i < numberOfThreads; i++) {
            final String token = authTokens.get(i % authTokens.size());
            
            futures[i] = CompletableFuture.runAsync(() -> {
                for (int j = 0; j < queriesPerThread; j++) {
                    long startTime = System.nanoTime();
                    
                    // Perform database-intensive operations
                    performUserProfileOperation(token);
                    
                    long queryTime = System.nanoTime() - startTime;
                    totalQueryTime.addAndGet(queryTime);
                    completedQueries.incrementAndGet();
                }
            }, executor);
        }
        
        try {
            CompletableFuture.allOf(futures).get(60, TimeUnit.SECONDS);
        } catch (Exception e) {
            // Handle exception
        }
        executor.shutdown();
        
        long averageQueryTime = totalQueryTime.get() / completedQueries.get();
        
        // Database performance assertions
        assertThat(averageQueryTime).isLessThan(100_000_000); // 100ms average
        assertThat(completedQueries.get()).isEqualTo(numberOfThreads * queriesPerThread);
    }

    @Test
    void testCacheEffectivenessUnderLoad() throws InterruptedException {
        // Test cache effectiveness with repeated requests
        String token = authTokens.get(0);
        UUID teamId = teamIds.get(0);
        
        int numberOfRequests = 100;
        ExecutorService executor = Executors.newFixedThreadPool(10);
        
        AtomicLong totalResponseTime = new AtomicLong(0);
        AtomicInteger completedRequests = new AtomicInteger(0);
        
        CompletableFuture<Void>[] futures = new CompletableFuture[numberOfRequests];
        
        for (int i = 0; i < numberOfRequests; i++) {
            futures[i] = CompletableFuture.runAsync(() -> {
                long startTime = System.nanoTime();
                
                // Repeated requests should benefit from caching
                performTeamDetailsOperation(token, teamId);
                
                long responseTime = System.nanoTime() - startTime;
                totalResponseTime.addAndGet(responseTime);
                completedRequests.incrementAndGet();
            }, executor);
        }
        
        try {
            CompletableFuture.allOf(futures).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            // Handle exception
        }
        executor.shutdown();
        
        long averageResponseTime = totalResponseTime.get() / completedRequests.get();
        
        // Cache performance should be very fast for repeated requests
        assertThat(averageResponseTime).isLessThan(50_000_000); // 50ms average with caching
        assertThat(completedRequests.get()).isEqualTo(numberOfRequests);
    }

    @Test
    void testMemoryUsageUnderLoad() throws InterruptedException {
        // Test memory usage during high load
        Runtime runtime = Runtime.getRuntime();
        long initialMemory = runtime.totalMemory() - runtime.freeMemory();
        
        // Perform memory-intensive operations
        int numberOfOperations = 1000;
        ExecutorService executor = Executors.newFixedThreadPool(20);
        
        CompletableFuture<Void>[] futures = new CompletableFuture[numberOfOperations];
        
        for (int i = 0; i < numberOfOperations; i++) {
            final String token = authTokens.get(i % authTokens.size());
            final UUID projectId = projectIds.get(i % projectIds.size());
            
            futures[i] = CompletableFuture.runAsync(() -> {
                performTaskListOperation(token, projectId);
            }, executor);
        }
        
        try {
            CompletableFuture.allOf(futures).get(60, TimeUnit.SECONDS);
        } catch (Exception e) {
            // Handle exception
        }
        executor.shutdown();
        
        // Force garbage collection and measure memory
        System.gc();
        Thread.sleep(1000);
        long finalMemory = runtime.totalMemory() - runtime.freeMemory();
        long memoryIncrease = finalMemory - initialMemory;
        
        // Memory increase should be reasonable (less than 100MB)
        assertThat(memoryIncrease).isLessThan(100 * 1024 * 1024); // 100MB
    }

    @Test
    void testResponseTimeConsistency() throws InterruptedException {
        // Test response time consistency over multiple requests
        String token = authTokens.get(0);
        int numberOfRequests = 100;
        
        List<Long> responseTimes = new ArrayList<>();
        
        for (int i = 0; i < numberOfRequests; i++) {
            long startTime = System.nanoTime();
            performUserProfileOperation(token);
            long responseTime = System.nanoTime() - startTime;
            responseTimes.add(responseTime);
            
            // Small delay between requests
            Thread.sleep(10);
        }
        
        // Calculate statistics
        long minTime = responseTimes.stream().mapToLong(Long::longValue).min().orElse(0);
        long maxTime = responseTimes.stream().mapToLong(Long::longValue).max().orElse(0);
        double avgTime = responseTimes.stream().mapToLong(Long::longValue).average().orElse(0);
        
        // Response times should be consistent (max should not be more than 10x min)
        assertThat(maxTime).isLessThan(minTime * 10);
        assertThat(avgTime).isLessThan(100_000_000); // 100ms average
        
        System.out.println("Response Time Statistics:");
        System.out.println("Min: " + String.format("%.2fms", minTime / 1_000_000.0));
        System.out.println("Max: " + String.format("%.2fms", maxTime / 1_000_000.0));
        System.out.println("Avg: " + String.format("%.2fms", avgTime / 1_000_000.0));
    }

    private void setupTestData() {
        authTokens = new ArrayList<>();
        userIds = new ArrayList<>();
        teamIds = new ArrayList<>();
        projectIds = new ArrayList<>();
        
        // Create test users, teams, and projects
        for (int i = 0; i < 10; i++) {
            // Register user
            RegisterRequest registerRequest = new RegisterRequest();
            registerRequest.setEmail("perftest" + i + "@example.com");
            registerRequest.setPassword("password123");
            registerRequest.setFirstName("PerfTest" + i);
            registerRequest.setLastName("User");
            
            ResponseEntity<AuthResponse> registerResponse = restTemplate.postForEntity(
                baseUrl + "/auth/register", registerRequest, AuthResponse.class);
            
            if (registerResponse.getStatusCode() == HttpStatus.CREATED) {
                authTokens.add(registerResponse.getBody().getAccessToken());
                userIds.add(registerResponse.getBody().getUser().getId());
                
                // Create team
                createTestTeam(registerResponse.getBody().getAccessToken(), i);
            }
        }
    }

    private void createTestTeam(String token, int index) {
        HttpHeaders headers = createAuthHeaders(token);
        
        TeamCreateRequest teamRequest = new TeamCreateRequest();
        teamRequest.setName("PerfTest Team " + index);
        teamRequest.setDescription("Performance test team");
        
        HttpEntity<TeamCreateRequest> teamEntity = new HttpEntity<>(teamRequest, headers);
        ResponseEntity<TeamResponse> teamResponse = restTemplate.exchange(
            baseUrl + "/teams", HttpMethod.POST, teamEntity, TeamResponse.class);
        
        if (teamResponse.getStatusCode() == HttpStatus.CREATED) {
            UUID teamId = teamResponse.getBody().getId();
            teamIds.add(teamId);
            
            // Create project
            createTestProject(token, teamId, index);
        }
    }

    private void createTestProject(String token, UUID teamId, int index) {
        HttpHeaders headers = createAuthHeaders(token);
        
        ProjectCreateRequest projectRequest = new ProjectCreateRequest();
        projectRequest.setName("PerfTest Project " + index);
        projectRequest.setDescription("Performance test project");
        projectRequest.setStartDate(LocalDate.now());
        projectRequest.setEndDate(LocalDate.now().plusDays(30));
        
        HttpEntity<ProjectCreateRequest> projectEntity = new HttpEntity<>(projectRequest, headers);
        ResponseEntity<ProjectResponse> projectResponse = restTemplate.exchange(
            baseUrl + "/teams/" + teamId + "/projects", HttpMethod.POST, projectEntity, ProjectResponse.class);
        
        if (projectResponse.getStatusCode() == HttpStatus.CREATED) {
            projectIds.add(projectResponse.getBody().getId());
        }
    }

    private void performUserProfileOperation(String token) {
        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);
        
        restTemplate.exchange(baseUrl + "/users/profile", HttpMethod.GET, entity, UserResponse.class);
    }

    private void performTeamListOperation(String token) {
        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);
        
        restTemplate.exchange(baseUrl + "/teams", HttpMethod.GET, entity, TeamResponse[].class);
    }

    private void performTeamDetailsOperation(String token, UUID teamId) {
        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);
        
        restTemplate.exchange(baseUrl + "/teams/" + teamId, HttpMethod.GET, entity, TeamResponse.class);
    }

    private void performProjectListOperation(String token, UUID teamId) {
        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);
        
        restTemplate.exchange(baseUrl + "/teams/" + teamId + "/projects", HttpMethod.GET, entity, ProjectResponse[].class);
    }

    private void performTaskCreationOperation(String token, UUID projectId, UUID userId) {
        HttpHeaders headers = createAuthHeaders(token);
        
        TaskCreateRequest taskRequest = new TaskCreateRequest();
        taskRequest.setTitle("Performance Test Task " + System.currentTimeMillis());
        taskRequest.setDescription("Task created during performance test");
        taskRequest.setAssigneeId(userId);
        taskRequest.setDueDate(LocalDateTime.now().plusDays(1));
        
        HttpEntity<TaskCreateRequest> taskEntity = new HttpEntity<>(taskRequest, headers);
        restTemplate.exchange(baseUrl + "/projects/" + projectId + "/tasks", HttpMethod.POST, taskEntity, TaskResponse.class);
    }

    private void performTaskListOperation(String token, UUID projectId) {
        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);
        
        restTemplate.exchange(baseUrl + "/projects/" + projectId + "/tasks?page=0&size=20", 
            HttpMethod.GET, entity, PagedTaskResponse.class);
    }

    private HttpHeaders createAuthHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        return headers;
    }
}