package com.taskmanagement.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskmanagement.dto.*;
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

/**
 * API validation tests that ensure compliance with OpenAPI specification
 * and validate response schemas, status codes, and headers
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
class ApiValidationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgres:15-alpine"))
            .withDatabaseName("api_validation_test")
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
        registry.add("rate-limit.enabled", () -> "false");
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
        setupTestData();
    }

    @Test
    void testOpenApiSpecificationAccessibility() {
        // Test OpenAPI JSON specification
        ResponseEntity<String> apiDocsResponse = restTemplate.getForEntity(
            baseUrl + "/api-docs", String.class);
        
        assertThat(apiDocsResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(apiDocsResponse.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_JSON);
        
        // Validate OpenAPI structure
        try {
            JsonNode openApiSpec = objectMapper.readTree(apiDocsResponse.getBody());
            
            assertThat(openApiSpec.has("openapi")).isTrue();
            assertThat(openApiSpec.has("info")).isTrue();
            assertThat(openApiSpec.has("paths")).isTrue();
            assertThat(openApiSpec.has("components")).isTrue();
            
            // Validate info section
            JsonNode info = openApiSpec.get("info");
            assertThat(info.has("title")).isTrue();
            assertThat(info.has("version")).isTrue();
            assertThat(info.has("description")).isTrue();
            
            // Validate that all major endpoints are documented
            JsonNode paths = openApiSpec.get("paths");
            assertThat(paths.has("/auth/register")).isTrue();
            assertThat(paths.has("/auth/login")).isTrue();
            assertThat(paths.has("/users/profile")).isTrue();
            assertThat(paths.has("/teams")).isTrue();
            assertThat(paths.has("/teams/{teamId}/projects")).isTrue();
            assertThat(paths.has("/projects/{projectId}/tasks")).isTrue();
            
        } catch (Exception e) {
            throw new AssertionError("Failed to parse OpenAPI specification", e);
        }
        
        // Test Swagger UI accessibility
        ResponseEntity<String> swaggerResponse = restTemplate.getForEntity(
            baseUrl + "/swagger-ui.html", String.class);
        
        assertThat(swaggerResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(swaggerResponse.getHeaders().getContentType().toString()).contains("text/html");
    }

    @Test
    void testAuthenticationEndpointsCompliance() {
        // Test registration endpoint
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("api-test@example.com");
        registerRequest.setPassword("ApiTest123");
        registerRequest.setFirstName("API");
        registerRequest.setLastName("Test");
        
        ResponseEntity<AuthResponse> registerResponse = restTemplate.postForEntity(
            baseUrl + "/auth/register", registerRequest, AuthResponse.class);
        
        // Validate response status and structure
        assertThat(registerResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        validateAuthResponse(registerResponse.getBody());
        validateResponseHeaders(registerResponse.getHeaders());
        
        // Test login endpoint
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("api-test@example.com");
        loginRequest.setPassword("ApiTest123");
        
        ResponseEntity<AuthResponse> loginResponse = restTemplate.postForEntity(
            baseUrl + "/auth/login", loginRequest, AuthResponse.class);
        
        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        validateAuthResponse(loginResponse.getBody());
        validateResponseHeaders(loginResponse.getHeaders());
        
        // Test refresh token endpoint
        RefreshTokenRequest refreshRequest = new RefreshTokenRequest();
        refreshRequest.setRefreshToken(registerResponse.getBody().getRefreshToken());
        
        ResponseEntity<AuthResponse> refreshResponse = restTemplate.postForEntity(
            baseUrl + "/auth/refresh", refreshRequest, AuthResponse.class);
        
        assertThat(refreshResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        validateAuthResponse(refreshResponse.getBody());
    }

    @Test
    void testUserManagementEndpointsCompliance() {
        HttpHeaders headers = createAuthHeaders(authToken);
        
        // Test get user profile
        HttpEntity<String> getEntity = new HttpEntity<>(headers);
        ResponseEntity<UserResponse> profileResponse = restTemplate.exchange(
            baseUrl + "/users/profile", HttpMethod.GET, getEntity, UserResponse.class);
        
        assertThat(profileResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        validateUserResponse(profileResponse.getBody());
        validateResponseHeaders(profileResponse.getHeaders());
        
        // Test update user profile
        UserUpdateRequest updateRequest = new UserUpdateRequest();
        updateRequest.setFirstName("Updated");
        updateRequest.setLastName("Name");
        
        HttpEntity<UserUpdateRequest> updateEntity = new HttpEntity<>(updateRequest, headers);
        ResponseEntity<UserResponse> updateResponse = restTemplate.exchange(
            baseUrl + "/users/profile", HttpMethod.PUT, updateEntity, UserResponse.class);
        
        assertThat(updateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        validateUserResponse(updateResponse.getBody());
        assertThat(updateResponse.getBody().getFirstName()).isEqualTo("Updated");
        assertThat(updateResponse.getBody().getLastName()).isEqualTo("Name");
    }

    @Test
    void testTeamManagementEndpointsCompliance() {
        HttpHeaders headers = createAuthHeaders(authToken);
        
        // Test create team
        TeamCreateRequest createRequest = new TeamCreateRequest();
        createRequest.setName("API Validation Team");
        createRequest.setDescription("Team for API validation testing");
        
        HttpEntity<TeamCreateRequest> createEntity = new HttpEntity<>(createRequest, headers);
        ResponseEntity<TeamResponse> createResponse = restTemplate.exchange(
            baseUrl + "/teams", HttpMethod.POST, createEntity, TeamResponse.class);
        
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        validateTeamResponse(createResponse.getBody());
        validateResponseHeaders(createResponse.getHeaders());
        
        UUID validationTeamId = createResponse.getBody().getId();
        
        // Test get team
        HttpEntity<String> getEntity = new HttpEntity<>(headers);
        ResponseEntity<TeamResponse> getResponse = restTemplate.exchange(
            baseUrl + "/teams/" + validationTeamId, HttpMethod.GET, getEntity, TeamResponse.class);
        
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        validateTeamResponse(getResponse.getBody());
        
        // Test list teams
        ResponseEntity<TeamResponse[]> listResponse = restTemplate.exchange(
            baseUrl + "/teams", HttpMethod.GET, getEntity, TeamResponse[].class);
        
        assertThat(listResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(listResponse.getBody()).isNotEmpty();
        for (TeamResponse team : listResponse.getBody()) {
            validateTeamResponse(team);
        }
        
        // Test update team
        TeamUpdateRequest updateRequest = new TeamUpdateRequest();
        updateRequest.setName("Updated API Validation Team");
        updateRequest.setDescription("Updated description");
        
        HttpEntity<TeamUpdateRequest> updateEntity = new HttpEntity<>(updateRequest, headers);
        ResponseEntity<TeamResponse> updateResponse = restTemplate.exchange(
            baseUrl + "/teams/" + validationTeamId, HttpMethod.PUT, updateEntity, TeamResponse.class);
        
        assertThat(updateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        validateTeamResponse(updateResponse.getBody());
        assertThat(updateResponse.getBody().getName()).isEqualTo("Updated API Validation Team");
        
        // Test delete team
        ResponseEntity<Void> deleteResponse = restTemplate.exchange(
            baseUrl + "/teams/" + validationTeamId, HttpMethod.DELETE, getEntity, Void.class);
        
        assertThat(deleteResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    void testProjectManagementEndpointsCompliance() {
        HttpHeaders headers = createAuthHeaders(authToken);
        
        // Test create project
        ProjectCreateRequest createRequest = new ProjectCreateRequest();
        createRequest.setName("API Validation Project");
        createRequest.setDescription("Project for API validation testing");
        createRequest.setStartDate(LocalDate.now());
        createRequest.setEndDate(LocalDate.now().plusDays(30));
        
        HttpEntity<ProjectCreateRequest> createEntity = new HttpEntity<>(createRequest, headers);
        ResponseEntity<ProjectResponse> createResponse = restTemplate.exchange(
            baseUrl + "/teams/" + teamId + "/projects", HttpMethod.POST, createEntity, ProjectResponse.class);
        
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        validateProjectResponse(createResponse.getBody());
        validateResponseHeaders(createResponse.getHeaders());
        
        UUID validationProjectId = createResponse.getBody().getId();
        
        // Test get project
        HttpEntity<String> getEntity = new HttpEntity<>(headers);
        ResponseEntity<ProjectResponse> getResponse = restTemplate.exchange(
            baseUrl + "/projects/" + validationProjectId, HttpMethod.GET, getEntity, ProjectResponse.class);
        
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        validateProjectResponse(getResponse.getBody());
        
        // Test list team projects
        ResponseEntity<ProjectResponse[]> listResponse = restTemplate.exchange(
            baseUrl + "/teams/" + teamId + "/projects", HttpMethod.GET, getEntity, ProjectResponse[].class);
        
        assertThat(listResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(listResponse.getBody()).isNotEmpty();
        for (ProjectResponse project : listResponse.getBody()) {
            validateProjectResponse(project);
        }
        
        // Test update project
        ProjectUpdateRequest updateRequest = new ProjectUpdateRequest();
        updateRequest.setName("Updated API Validation Project");
        updateRequest.setDescription("Updated description");
        
        HttpEntity<ProjectUpdateRequest> updateEntity = new HttpEntity<>(updateRequest, headers);
        ResponseEntity<ProjectResponse> updateResponse = restTemplate.exchange(
            baseUrl + "/projects/" + validationProjectId, HttpMethod.PUT, updateEntity, ProjectResponse.class);
        
        assertThat(updateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        validateProjectResponse(updateResponse.getBody());
        assertThat(updateResponse.getBody().getName()).isEqualTo("Updated API Validation Project");
    }

    @Test
    void testTaskManagementEndpointsCompliance() {
        HttpHeaders headers = createAuthHeaders(authToken);
        
        // Test create task
        TaskCreateRequest createRequest = new TaskCreateRequest();
        createRequest.setTitle("API Validation Task");
        createRequest.setDescription("Task for API validation testing");
        createRequest.setAssigneeId(userId);
        createRequest.setDueDate(LocalDateTime.now().plusDays(7));
        
        HttpEntity<TaskCreateRequest> createEntity = new HttpEntity<>(createRequest, headers);
        ResponseEntity<TaskResponse> createResponse = restTemplate.exchange(
            baseUrl + "/projects/" + projectId + "/tasks", HttpMethod.POST, createEntity, TaskResponse.class);
        
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        validateTaskResponse(createResponse.getBody());
        validateResponseHeaders(createResponse.getHeaders());
        
        UUID validationTaskId = createResponse.getBody().getId();
        
        // Test get task
        HttpEntity<String> getEntity = new HttpEntity<>(headers);
        ResponseEntity<TaskResponse> getResponse = restTemplate.exchange(
            baseUrl + "/tasks/" + validationTaskId, HttpMethod.GET, getEntity, TaskResponse.class);
        
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        validateTaskResponse(getResponse.getBody());
        
        // Test list project tasks with pagination
        ResponseEntity<PagedTaskResponse> listResponse = restTemplate.exchange(
            baseUrl + "/projects/" + projectId + "/tasks?page=0&size=10", 
            HttpMethod.GET, getEntity, PagedTaskResponse.class);
        
        assertThat(listResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        validatePagedTaskResponse(listResponse.getBody());
        
        // Test update task
        TaskUpdateRequest updateRequest = new TaskUpdateRequest();
        updateRequest.setTitle("Updated API Validation Task");
        updateRequest.setDescription("Updated description");
        
        HttpEntity<TaskUpdateRequest> updateEntity = new HttpEntity<>(updateRequest, headers);
        ResponseEntity<TaskResponse> updateResponse = restTemplate.exchange(
            baseUrl + "/tasks/" + validationTaskId, HttpMethod.PUT, updateEntity, TaskResponse.class);
        
        assertThat(updateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        validateTaskResponse(updateResponse.getBody());
        assertThat(updateResponse.getBody().getTitle()).isEqualTo("Updated API Validation Task");
    }

    @Test
    void testErrorResponseCompliance() {
        HttpHeaders headers = createAuthHeaders(authToken);
        
        // Test 404 Not Found
        HttpEntity<String> getEntity = new HttpEntity<>(headers);
        ResponseEntity<ErrorResponse> notFoundResponse = restTemplate.exchange(
            baseUrl + "/teams/" + UUID.randomUUID(), HttpMethod.GET, getEntity, ErrorResponse.class);
        
        assertThat(notFoundResponse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        validateErrorResponse(notFoundResponse.getBody());
        
        // Test 400 Bad Request
        RegisterRequest invalidRequest = new RegisterRequest();
        invalidRequest.setEmail("invalid-email");
        invalidRequest.setPassword("short");
        
        ResponseEntity<ErrorResponse> badRequestResponse = restTemplate.postForEntity(
            baseUrl + "/auth/register", invalidRequest, ErrorResponse.class);
        
        assertThat(badRequestResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        validateErrorResponse(badRequestResponse.getBody());
        assertThat(badRequestResponse.getBody().getDetails()).isNotEmpty();
        
        // Test 401 Unauthorized
        ResponseEntity<ErrorResponse> unauthorizedResponse = restTemplate.getForEntity(
            baseUrl + "/users/profile", ErrorResponse.class);
        
        assertThat(unauthorizedResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        validateErrorResponse(unauthorizedResponse.getBody());
    }

    @Test
    void testResponseHeadersCompliance() {
        HttpHeaders headers = createAuthHeaders(authToken);
        
        // Test that all responses include required headers
        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<UserResponse> response = restTemplate.exchange(
            baseUrl + "/users/profile", HttpMethod.GET, entity, UserResponse.class);
        
        HttpHeaders responseHeaders = response.getHeaders();
        
        // Content-Type should be application/json for API responses
        assertThat(responseHeaders.getContentType()).isEqualTo(MediaType.APPLICATION_JSON);
        
        // Should include CORS headers
        assertThat(responseHeaders.getAccessControlAllowOrigin()).isNotNull();
        
        // Should include cache control headers
        assertThat(responseHeaders.getCacheControl()).isNotNull();
        
        // Should include request ID for tracing
        assertThat(responseHeaders.getFirst("X-Request-ID")).isNotNull();
    }

    @Test
    void testPaginationCompliance() {
        HttpHeaders headers = createAuthHeaders(authToken);
        
        // Create multiple tasks for pagination testing
        for (int i = 0; i < 15; i++) {
            TaskCreateRequest taskRequest = new TaskCreateRequest();
            taskRequest.setTitle("Pagination Task " + i);
            taskRequest.setDescription("Task for pagination testing");
            taskRequest.setAssigneeId(userId);
            taskRequest.setDueDate(LocalDateTime.now().plusDays(i + 1));
            
            HttpEntity<TaskCreateRequest> taskEntity = new HttpEntity<>(taskRequest, headers);
            restTemplate.exchange(
                baseUrl + "/projects/" + projectId + "/tasks", HttpMethod.POST, taskEntity, TaskResponse.class);
        }
        
        // Test pagination parameters
        HttpEntity<String> getEntity = new HttpEntity<>(headers);
        
        // Test first page
        ResponseEntity<PagedTaskResponse> firstPageResponse = restTemplate.exchange(
            baseUrl + "/projects/" + projectId + "/tasks?page=0&size=5", 
            HttpMethod.GET, getEntity, PagedTaskResponse.class);
        
        assertThat(firstPageResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        PagedTaskResponse firstPage = firstPageResponse.getBody();
        validatePagedTaskResponse(firstPage);
        assertThat(firstPage.getTasks()).hasSizeLessThanOrEqualTo(5);
        assertThat(firstPage.getPage()).isEqualTo(0);
        assertThat(firstPage.getSize()).isEqualTo(5);
        assertThat(firstPage.getTotalElements()).isGreaterThanOrEqualTo(15);
        
        // Test second page
        ResponseEntity<PagedTaskResponse> secondPageResponse = restTemplate.exchange(
            baseUrl + "/projects/" + projectId + "/tasks?page=1&size=5", 
            HttpMethod.GET, getEntity, PagedTaskResponse.class);
        
        assertThat(secondPageResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        PagedTaskResponse secondPage = secondPageResponse.getBody();
        validatePagedTaskResponse(secondPage);
        assertThat(secondPage.getPage()).isEqualTo(1);
        
        // Ensure different pages return different content
        assertThat(firstPage.getTasks().get(0).getId())
            .isNotEqualTo(secondPage.getTasks().get(0).getId());
    }

    private void setupTestData() {
        // Register test user
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("validation@test.com");
        registerRequest.setPassword("ValidationTest123");
        registerRequest.setFirstName("Validation");
        registerRequest.setLastName("Test");
        
        ResponseEntity<AuthResponse> registerResponse = restTemplate.postForEntity(
            baseUrl + "/auth/register", registerRequest, AuthResponse.class);
        
        authToken = registerResponse.getBody().getAccessToken();
        userId = registerResponse.getBody().getUser().getId();
        
        // Create test team
        HttpHeaders headers = createAuthHeaders(authToken);
        TeamCreateRequest teamRequest = new TeamCreateRequest();
        teamRequest.setName("Validation Test Team");
        teamRequest.setDescription("Team for validation testing");
        
        HttpEntity<TeamCreateRequest> teamEntity = new HttpEntity<>(teamRequest, headers);
        ResponseEntity<TeamResponse> teamResponse = restTemplate.exchange(
            baseUrl + "/teams", HttpMethod.POST, teamEntity, TeamResponse.class);
        
        teamId = teamResponse.getBody().getId();
        
        // Create test project
        ProjectCreateRequest projectRequest = new ProjectCreateRequest();
        projectRequest.setName("Validation Test Project");
        projectRequest.setDescription("Project for validation testing");
        projectRequest.setStartDate(LocalDate.now());
        projectRequest.setEndDate(LocalDate.now().plusDays(30));
        
        HttpEntity<ProjectCreateRequest> projectEntity = new HttpEntity<>(projectRequest, headers);
        ResponseEntity<ProjectResponse> projectResponse = restTemplate.exchange(
            baseUrl + "/teams/" + teamId + "/projects", HttpMethod.POST, projectEntity, ProjectResponse.class);
        
        projectId = projectResponse.getBody().getId();
    }

    private void validateAuthResponse(AuthResponse response) {
        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isNotNull().isNotEmpty();
        assertThat(response.getRefreshToken()).isNotNull().isNotEmpty();
        assertThat(response.getUser()).isNotNull();
        validateUserResponse(response.getUser());
    }

    private void validateUserResponse(UserResponse response) {
        assertThat(response).isNotNull();
        assertThat(response.getId()).isNotNull();
        assertThat(response.getEmail()).isNotNull().isNotEmpty();
        assertThat(response.getFirstName()).isNotNull().isNotEmpty();
        assertThat(response.getLastName()).isNotNull().isNotEmpty();
        assertThat(response.getRole()).isNotNull();
        assertThat(response.getCreatedAt()).isNotNull();
        assertThat(response.getUpdatedAt()).isNotNull();
    }

    private void validateTeamResponse(TeamResponse response) {
        assertThat(response).isNotNull();
        assertThat(response.getId()).isNotNull();
        assertThat(response.getName()).isNotNull().isNotEmpty();
        assertThat(response.getOwner()).isNotNull();
        assertThat(response.getCreatedAt()).isNotNull();
        assertThat(response.getUpdatedAt()).isNotNull();
    }

    private void validateProjectResponse(ProjectResponse response) {
        assertThat(response).isNotNull();
        assertThat(response.getId()).isNotNull();
        assertThat(response.getName()).isNotNull().isNotEmpty();
        assertThat(response.getTeam()).isNotNull();
        assertThat(response.getStatus()).isNotNull();
        assertThat(response.getStartDate()).isNotNull();
        assertThat(response.getEndDate()).isNotNull();
        assertThat(response.getCreatedBy()).isNotNull();
        assertThat(response.getCreatedAt()).isNotNull();
        assertThat(response.getUpdatedAt()).isNotNull();
    }

    private void validateTaskResponse(TaskResponse response) {
        assertThat(response).isNotNull();
        assertThat(response.getId()).isNotNull();
        assertThat(response.getTitle()).isNotNull().isNotEmpty();
        assertThat(response.getProjectId()).isNotNull();
        assertThat(response.getStatus()).isNotNull();
        assertThat(response.getPriority()).isNotNull();
        assertThat(response.getCreatedBy()).isNotNull();
        assertThat(response.getCreatedAt()).isNotNull();
        assertThat(response.getUpdatedAt()).isNotNull();
    }

    private void validatePagedTaskResponse(PagedTaskResponse response) {
        assertThat(response).isNotNull();
        assertThat(response.getTasks()).isNotNull();
        assertThat(response.getPage()).isNotNull().isGreaterThanOrEqualTo(0);
        assertThat(response.getSize()).isNotNull().isGreaterThan(0);
        assertThat(response.getTotalElements()).isNotNull().isGreaterThanOrEqualTo(0);
        assertThat(response.getTotalPages()).isNotNull().isGreaterThanOrEqualTo(0);
        
        for (TaskResponse task : response.getTasks()) {
            validateTaskResponse(task);
        }
    }

    private void validateErrorResponse(ErrorResponse response) {
        assertThat(response).isNotNull();
        assertThat(response.getCode()).isNotNull().isNotEmpty();
        assertThat(response.getMessage()).isNotNull().isNotEmpty();
        // Details can be null for some errors
        if (response.getDetails() != null) {
            assertThat(response.getDetails()).isNotEmpty();
        }
    }

    private void validateResponseHeaders(HttpHeaders headers) {
        assertThat(headers).isNotNull();
        assertThat(headers.getContentType()).isNotNull();
        
        // Should include request ID for tracing
        assertThat(headers.getFirst("X-Request-ID")).isNotNull();
    }

    private HttpHeaders createAuthHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        return headers;
    }
}