package com.taskmanagement.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
class TaskManagementIntegrationTest {

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
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    private String baseUrl;
    private String authToken;
    private UUID userId;
    private UUID teamId;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        baseUrl = "http://localhost:" + port + "/api/v1";
        setupTestUser();
    }

    @Test
    void testCompleteUserWorkflow() {
        // Test complete user workflow from registration to task management
        
        // 1. Register a new user
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("integration@test.com");
        registerRequest.setPassword("TestPassword123");
        registerRequest.setFirstName("Integration");
        registerRequest.setLastName("Test");
        
        ResponseEntity<AuthResponse> registerResponse = restTemplate.postForEntity(
            baseUrl + "/auth/register", registerRequest, AuthResponse.class);
        
        assertThat(registerResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(registerResponse.getBody()).isNotNull();
        assertThat(registerResponse.getBody().getAccessToken()).isNotNull();
        
        String userToken = registerResponse.getBody().getAccessToken();
        UUID newUserId = registerResponse.getBody().getUser().getId();
        
        // 2. Create a team
        TeamCreateRequest teamRequest = new TeamCreateRequest();
        teamRequest.setName("Integration Test Team");
        teamRequest.setDescription("Team for integration testing");
        
        HttpHeaders headers = createAuthHeaders(userToken);
        HttpEntity<TeamCreateRequest> teamEntity = new HttpEntity<>(teamRequest, headers);
        
        ResponseEntity<TeamResponse> teamResponse = restTemplate.exchange(
            baseUrl + "/teams", HttpMethod.POST, teamEntity, TeamResponse.class);
        
        assertThat(teamResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(teamResponse.getBody()).isNotNull();
        UUID newTeamId = teamResponse.getBody().getId();
        
        // 3. Create a project
        ProjectCreateRequest projectRequest = new ProjectCreateRequest();
        projectRequest.setName("Integration Test Project");
        projectRequest.setDescription("Project for integration testing");
        projectRequest.setStartDate(LocalDate.now());
        projectRequest.setEndDate(LocalDate.now().plusDays(30));
        
        HttpEntity<ProjectCreateRequest> projectEntity = new HttpEntity<>(projectRequest, headers);
        
        ResponseEntity<ProjectResponse> projectResponse = restTemplate.exchange(
            baseUrl + "/teams/" + newTeamId + "/projects", HttpMethod.POST, projectEntity, ProjectResponse.class);
        
        assertThat(projectResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(projectResponse.getBody()).isNotNull();
        UUID newProjectId = projectResponse.getBody().getId();
        
        // 4. Create a task
        TaskCreateRequest taskRequest = new TaskCreateRequest();
        taskRequest.setTitle("Integration Test Task");
        taskRequest.setDescription("Task for integration testing");
        taskRequest.setAssigneeId(newUserId);
        taskRequest.setDueDate(LocalDateTime.now().plusDays(7));
        
        HttpEntity<TaskCreateRequest> taskEntity = new HttpEntity<>(taskRequest, headers);
        
        ResponseEntity<TaskResponse> taskResponse = restTemplate.exchange(
            baseUrl + "/projects/" + newProjectId + "/tasks", HttpMethod.POST, taskEntity, TaskResponse.class);
        
        assertThat(taskResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(taskResponse.getBody()).isNotNull();
        assertThat(taskResponse.getBody().getTitle()).isEqualTo("Integration Test Task");
    }

    @Test
    void testAuthenticationAndAuthorization() {
        // Test authentication flow
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");
        
        ResponseEntity<AuthResponse> loginResponse = restTemplate.postForEntity(
            baseUrl + "/auth/login", loginRequest, AuthResponse.class);
        
        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginResponse.getBody()).isNotNull();
        assertThat(loginResponse.getBody().getAccessToken()).isNotNull();
        
        // Test accessing protected endpoint without token
        ResponseEntity<String> unauthorizedResponse = restTemplate.getForEntity(
            baseUrl + "/users/profile", String.class);
        
        assertThat(unauthorizedResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        
        // Test accessing protected endpoint with valid token
        HttpHeaders headers = createAuthHeaders(loginResponse.getBody().getAccessToken());
        HttpEntity<String> entity = new HttpEntity<>(headers);
        
        ResponseEntity<UserResponse> profileResponse = restTemplate.exchange(
            baseUrl + "/users/profile", HttpMethod.GET, entity, UserResponse.class);
        
        assertThat(profileResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(profileResponse.getBody()).isNotNull();
    }

    @Test
    void testTeamManagementWorkflow() {
        HttpHeaders headers = createAuthHeaders(authToken);
        
        // Create team
        TeamCreateRequest createRequest = new TeamCreateRequest();
        createRequest.setName("Test Team Workflow");
        createRequest.setDescription("Testing team management workflow");
        
        HttpEntity<TeamCreateRequest> createEntity = new HttpEntity<>(createRequest, headers);
        ResponseEntity<TeamResponse> createResponse = restTemplate.exchange(
            baseUrl + "/teams", HttpMethod.POST, createEntity, TeamResponse.class);
        
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        UUID workflowTeamId = createResponse.getBody().getId();
        
        // Get team details
        HttpEntity<String> getEntity = new HttpEntity<>(headers);
        ResponseEntity<TeamResponse> getResponse = restTemplate.exchange(
            baseUrl + "/teams/" + workflowTeamId, HttpMethod.GET, getEntity, TeamResponse.class);
        
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResponse.getBody().getName()).isEqualTo("Test Team Workflow");
        
        // Update team
        TeamUpdateRequest updateRequest = new TeamUpdateRequest();
        updateRequest.setName("Updated Team Workflow");
        updateRequest.setDescription("Updated description");
        
        HttpEntity<TeamUpdateRequest> updateEntity = new HttpEntity<>(updateRequest, headers);
        ResponseEntity<TeamResponse> updateResponse = restTemplate.exchange(
            baseUrl + "/teams/" + workflowTeamId, HttpMethod.PUT, updateEntity, TeamResponse.class);
        
        assertThat(updateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updateResponse.getBody().getName()).isEqualTo("Updated Team Workflow");
        
        // Delete team
        ResponseEntity<Void> deleteResponse = restTemplate.exchange(
            baseUrl + "/teams/" + workflowTeamId, HttpMethod.DELETE, getEntity, Void.class);
        
        assertThat(deleteResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    void testTaskManagementWithFiltering() {
        HttpHeaders headers = createAuthHeaders(authToken);
        
        // Create multiple tasks with different properties
        for (int i = 0; i < 5; i++) {
            TaskCreateRequest taskRequest = new TaskCreateRequest();
            taskRequest.setTitle("Filter Test Task " + i);
            taskRequest.setDescription("Task for filtering test");
            taskRequest.setAssigneeId(userId);
            taskRequest.setDueDate(LocalDateTime.now().plusDays(i + 1));
            
            HttpEntity<TaskCreateRequest> taskEntity = new HttpEntity<>(taskRequest, headers);
            restTemplate.exchange(
                baseUrl + "/projects/" + projectId + "/tasks", HttpMethod.POST, taskEntity, TaskResponse.class);
        }
        
        // Test filtering tasks
        HttpEntity<String> getEntity = new HttpEntity<>(headers);
        ResponseEntity<PagedTaskResponse> tasksResponse = restTemplate.exchange(
            baseUrl + "/projects/" + projectId + "/tasks?page=0&size=10", 
            HttpMethod.GET, getEntity, PagedTaskResponse.class);
        
        assertThat(tasksResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(tasksResponse.getBody()).isNotNull();
        assertThat(tasksResponse.getBody().getTasks()).hasSizeGreaterThanOrEqualTo(5);
    }

    @Test
    void testErrorHandlingAndValidation() {
        HttpHeaders headers = createAuthHeaders(authToken);
        
        // Test validation error - invalid email format
        RegisterRequest invalidRequest = new RegisterRequest();
        invalidRequest.setEmail("invalid-email");
        invalidRequest.setPassword("short");
        invalidRequest.setFirstName("");
        invalidRequest.setLastName("");
        
        ResponseEntity<ErrorResponse> errorResponse = restTemplate.postForEntity(
            baseUrl + "/auth/register", invalidRequest, ErrorResponse.class);
        
        assertThat(errorResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(errorResponse.getBody()).isNotNull();
        assertThat(errorResponse.getBody().getCode()).isEqualTo("VALIDATION_ERROR");
        
        // Test not found error
        HttpEntity<String> getEntity = new HttpEntity<>(headers);
        ResponseEntity<ErrorResponse> notFoundResponse = restTemplate.exchange(
            baseUrl + "/teams/" + UUID.randomUUID(), HttpMethod.GET, getEntity, ErrorResponse.class);
        
        assertThat(notFoundResponse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void testRateLimitingIntegration() {
        // Test rate limiting with multiple requests
        String endpoint = baseUrl + "/auth/login";
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");
        
        int successfulRequests = 0;
        int rateLimitedRequests = 0;
        
        // Make requests up to and beyond the rate limit
        for (int i = 0; i < 15; i++) {
            ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
                endpoint, loginRequest, AuthResponse.class);
            
            if (response.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                rateLimitedRequests++;
            } else {
                successfulRequests++;
            }
            
            // Check rate limit headers
            assertThat(response.getHeaders().getFirst("X-RateLimit-Limit")).isNotNull();
        }
        
        // Should have some successful requests and some rate limited
        assertThat(successfulRequests).isGreaterThan(0);
        assertThat(rateLimitedRequests).isGreaterThan(0);
    }

    @Test
    void testConcurrentOperations() throws InterruptedException {
        // Test concurrent operations to ensure thread safety
        HttpHeaders headers = createAuthHeaders(authToken);
        
        // Create multiple tasks concurrently
        Thread[] threads = new Thread[10];
        for (int i = 0; i < 10; i++) {
            final int taskIndex = i;
            threads[i] = new Thread(() -> {
                TaskCreateRequest taskRequest = new TaskCreateRequest();
                taskRequest.setTitle("Concurrent Task " + taskIndex);
                taskRequest.setDescription("Task created concurrently");
                taskRequest.setAssigneeId(userId);
                taskRequest.setDueDate(LocalDateTime.now().plusDays(1));
                
                HttpEntity<TaskCreateRequest> taskEntity = new HttpEntity<>(taskRequest, headers);
                ResponseEntity<TaskResponse> response = restTemplate.exchange(
                    baseUrl + "/projects/" + projectId + "/tasks", HttpMethod.POST, taskEntity, TaskResponse.class);
                
                assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
            });
        }
        
        // Start all threads
        for (Thread thread : threads) {
            thread.start();
        }
        
        // Wait for all threads to complete
        for (Thread thread : threads) {
            thread.join();
        }
        
        // Verify all tasks were created
        HttpEntity<String> getEntity = new HttpEntity<>(headers);
        ResponseEntity<PagedTaskResponse> tasksResponse = restTemplate.exchange(
            baseUrl + "/projects/" + projectId + "/tasks?page=0&size=20", 
            HttpMethod.GET, getEntity, PagedTaskResponse.class);
        
        assertThat(tasksResponse.getBody().getTasks()).hasSizeGreaterThanOrEqualTo(10);
    }

    private void setupTestUser() {
        // Register test user
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setFirstName("Test");
        registerRequest.setLastName("User");
        
        ResponseEntity<AuthResponse> registerResponse = restTemplate.postForEntity(
            baseUrl + "/auth/register", registerRequest, AuthResponse.class);
        
        if (registerResponse.getStatusCode() == HttpStatus.CREATED) {
            authToken = registerResponse.getBody().getAccessToken();
            userId = registerResponse.getBody().getUser().getId();
        } else {
            // User might already exist, try login
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setEmail("test@example.com");
            loginRequest.setPassword("password123");
            
            ResponseEntity<AuthResponse> loginResponse = restTemplate.postForEntity(
                baseUrl + "/auth/login", loginRequest, AuthResponse.class);
            
            authToken = loginResponse.getBody().getAccessToken();
            userId = loginResponse.getBody().getUser().getId();
        }
        
        // Create test team and project
        setupTestTeamAndProject();
    }

    private void setupTestTeamAndProject() {
        HttpHeaders headers = createAuthHeaders(authToken);
        
        // Create team
        TeamCreateRequest teamRequest = new TeamCreateRequest();
        teamRequest.setName("Test Team " + System.currentTimeMillis());
        teamRequest.setDescription("Test team for integration tests");
        
        HttpEntity<TeamCreateRequest> teamEntity = new HttpEntity<>(teamRequest, headers);
        ResponseEntity<TeamResponse> teamResponse = restTemplate.exchange(
            baseUrl + "/teams", HttpMethod.POST, teamEntity, TeamResponse.class);
        
        teamId = teamResponse.getBody().getId();
        
        // Create project
        ProjectCreateRequest projectRequest = new ProjectCreateRequest();
        projectRequest.setName("Test Project");
        projectRequest.setDescription("Test project for integration tests");
        projectRequest.setStartDate(LocalDate.now());
        projectRequest.setEndDate(LocalDate.now().plusDays(30));
        
        HttpEntity<ProjectCreateRequest> projectEntity = new HttpEntity<>(projectRequest, headers);
        ResponseEntity<ProjectResponse> projectResponse = restTemplate.exchange(
            baseUrl + "/teams/" + teamId + "/projects", HttpMethod.POST, projectEntity, ProjectResponse.class);
        
        projectId = projectResponse.getBody().getId();
    }

    private HttpHeaders createAuthHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        return headers;
    }
}