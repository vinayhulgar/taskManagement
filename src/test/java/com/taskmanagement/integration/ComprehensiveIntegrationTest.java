package com.taskmanagement.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskmanagement.dto.*;
import com.taskmanagement.entity.Priority;
import com.taskmanagement.entity.TaskStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
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
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Comprehensive integration tests covering complete user workflows,
 * security scenarios, and API validation
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ComprehensiveIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgres:15-alpine"))
            .withDatabaseName("comprehensive_test")
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
        registry.add("rate-limit.enabled", () -> "false"); // Disable for testing
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    private String baseUrl;
    private String adminToken;
    private String managerToken;
    private String memberToken;
    private UUID adminUserId;
    private UUID managerUserId;
    private UUID memberUserId;
    private UUID teamId;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        baseUrl = "http://localhost:" + port + "/api/v1";
    }

    @Test
    @Order(1)
    void testCompleteApplicationWorkflow() {
        // 1. Setup users with different roles
        setupUsersWithRoles();
        
        // 2. Test team creation and management
        testTeamLifecycle();
        
        // 3. Test project creation and management
        testProjectLifecycle();
        
        // 4. Test task management with all features
        testTaskLifecycle();
        
        // 5. Test collaboration features
        testCollaborationFeatures();
        
        // 6. Test activity tracking
        testActivityTracking();
        
        // 7. Test notifications
        testNotificationSystem();
    }

    @Test
    @Order(2)
    void testSecurityAndAuthorizationScenarios() {
        setupUsersWithRoles();
        
        // Test role-based access control
        testRoleBasedAccess();
        
        // Test JWT token validation
        testJwtTokenValidation();
        
        // Test unauthorized access attempts
        testUnauthorizedAccess();
        
        // Test cross-team access restrictions
        testCrossTeamAccessRestrictions();
    }

    @Test
    @Order(3)
    void testDataValidationAndErrorHandling() {
        setupUsersWithRoles();
        
        // Test input validation
        testInputValidation();
        
        // Test business logic validation
        testBusinessLogicValidation();
        
        // Test error response formats
        testErrorResponseFormats();
        
        // Test constraint violations
        testConstraintViolations();
    }

    @Test
    @Order(4)
    void testPerformanceAndScalability() throws InterruptedException {
        setupUsersWithRoles();
        
        // Test pagination
        testPaginationFeatures();
        
        // Test filtering and search
        testFilteringAndSearch();
        
        // Test bulk operations
        testBulkOperations();
        
        // Test concurrent access
        testConcurrentAccess();
    }

    @Test
    @Order(5)
    void testApiDocumentationCompliance() {
        // Test OpenAPI specification compliance
        testOpenApiEndpoints();
        
        // Test response schemas
        testResponseSchemas();
        
        // Test error response schemas
        testErrorSchemas();
    }

    private void setupUsersWithRoles() {
        // Create admin user
        RegisterRequest adminRequest = new RegisterRequest();
        adminRequest.setEmail("admin@test.com");
        adminRequest.setPassword("AdminPass123");
        adminRequest.setFirstName("Admin");
        adminRequest.setLastName("User");
        
        ResponseEntity<AuthResponse> adminResponse = restTemplate.postForEntity(
            baseUrl + "/auth/register", adminRequest, AuthResponse.class);
        
        assertThat(adminResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        adminToken = adminResponse.getBody().getAccessToken();
        adminUserId = adminResponse.getBody().getUser().getId();
        
        // Create manager user
        RegisterRequest managerRequest = new RegisterRequest();
        managerRequest.setEmail("manager@test.com");
        managerRequest.setPassword("ManagerPass123");
        managerRequest.setFirstName("Manager");
        managerRequest.setLastName("User");
        
        ResponseEntity<AuthResponse> managerResponse = restTemplate.postForEntity(
            baseUrl + "/auth/register", managerRequest, AuthResponse.class);
        
        assertThat(managerResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        managerToken = managerResponse.getBody().getAccessToken();
        managerUserId = managerResponse.getBody().getUser().getId();
        
        // Create member user
        RegisterRequest memberRequest = new RegisterRequest();
        memberRequest.setEmail("member@test.com");
        memberRequest.setPassword("MemberPass123");
        memberRequest.setFirstName("Member");
        memberRequest.setLastName("User");
        
        ResponseEntity<AuthResponse> memberResponse = restTemplate.postForEntity(
            baseUrl + "/auth/register", memberRequest, AuthResponse.class);
        
        assertThat(memberResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        memberToken = memberResponse.getBody().getAccessToken();
        memberUserId = memberResponse.getBody().getUser().getId();
    }

    private void testTeamLifecycle() {
        HttpHeaders headers = createAuthHeaders(managerToken);
        
        // Create team
        TeamCreateRequest createRequest = new TeamCreateRequest();
        createRequest.setName("Comprehensive Test Team");
        createRequest.setDescription("Team for comprehensive testing");
        
        HttpEntity<TeamCreateRequest> createEntity = new HttpEntity<>(createRequest, headers);
        ResponseEntity<TeamResponse> createResponse = restTemplate.exchange(
            baseUrl + "/teams", HttpMethod.POST, createEntity, TeamResponse.class);
        
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(createResponse.getBody().getName()).isEqualTo("Comprehensive Test Team");
        teamId = createResponse.getBody().getId();
        
        // Invite member to team
        TeamMemberInviteRequest inviteRequest = new TeamMemberInviteRequest();
        inviteRequest.setEmail("member@test.com");
        
        HttpEntity<TeamMemberInviteRequest> inviteEntity = new HttpEntity<>(inviteRequest, headers);
        ResponseEntity<Void> inviteResponse = restTemplate.exchange(
            baseUrl + "/teams/" + teamId + "/members", HttpMethod.POST, inviteEntity, Void.class);
        
        assertThat(inviteResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        
        // List team members
        HttpEntity<String> getEntity = new HttpEntity<>(headers);
        ResponseEntity<TeamMemberResponse[]> membersResponse = restTemplate.exchange(
            baseUrl + "/teams/" + teamId + "/members", HttpMethod.GET, getEntity, TeamMemberResponse[].class);
        
        assertThat(membersResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(membersResponse.getBody()).hasSizeGreaterThanOrEqualTo(2); // Owner + invited member
    }

    private void testProjectLifecycle() {
        HttpHeaders headers = createAuthHeaders(managerToken);
        
        // Create project
        ProjectCreateRequest createRequest = new ProjectCreateRequest();
        createRequest.setName("Comprehensive Test Project");
        createRequest.setDescription("Project for comprehensive testing");
        createRequest.setStartDate(LocalDate.now());
        createRequest.setEndDate(LocalDate.now().plusDays(60));
        
        HttpEntity<ProjectCreateRequest> createEntity = new HttpEntity<>(createRequest, headers);
        ResponseEntity<ProjectResponse> createResponse = restTemplate.exchange(
            baseUrl + "/teams/" + teamId + "/projects", HttpMethod.POST, createEntity, ProjectResponse.class);
        
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        projectId = createResponse.getBody().getId();
        
        // Assign member to project
        ProjectMemberAssignRequest assignRequest = new ProjectMemberAssignRequest();
        assignRequest.setEmail("member@test.com");
        
        HttpEntity<ProjectMemberAssignRequest> assignEntity = new HttpEntity<>(assignRequest, headers);
        ResponseEntity<Void> assignResponse = restTemplate.exchange(
            baseUrl + "/projects/" + projectId + "/members", HttpMethod.POST, assignEntity, Void.class);
        
        assertThat(assignResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        
        // Update project
        ProjectUpdateRequest updateRequest = new ProjectUpdateRequest();
        updateRequest.setName("Updated Comprehensive Test Project");
        updateRequest.setDescription("Updated description");
        
        HttpEntity<ProjectUpdateRequest> updateEntity = new HttpEntity<>(updateRequest, headers);
        ResponseEntity<ProjectResponse> updateResponse = restTemplate.exchange(
            baseUrl + "/projects/" + projectId, HttpMethod.PUT, updateEntity, ProjectResponse.class);
        
        assertThat(updateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updateResponse.getBody().getName()).isEqualTo("Updated Comprehensive Test Project");
    }

    private void testTaskLifecycle() {
        HttpHeaders managerHeaders = createAuthHeaders(managerToken);
        HttpHeaders memberHeaders = createAuthHeaders(memberToken);
        
        // Create parent task
        TaskCreateRequest parentTaskRequest = new TaskCreateRequest();
        parentTaskRequest.setTitle("Parent Task");
        parentTaskRequest.setDescription("Main task with subtasks");
        parentTaskRequest.setAssigneeId(memberUserId);
        parentTaskRequest.setDueDate(LocalDateTime.now().plusDays(14));
        parentTaskRequest.setPriority(Priority.HIGH);
        
        HttpEntity<TaskCreateRequest> parentEntity = new HttpEntity<>(parentTaskRequest, managerHeaders);
        ResponseEntity<TaskResponse> parentResponse = restTemplate.exchange(
            baseUrl + "/projects/" + projectId + "/tasks", HttpMethod.POST, parentEntity, TaskResponse.class);
        
        assertThat(parentResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        UUID parentTaskId = parentResponse.getBody().getId();
        
        // Create subtask
        TaskCreateRequest subtaskRequest = new TaskCreateRequest();
        subtaskRequest.setTitle("Subtask 1");
        subtaskRequest.setDescription("First subtask");
        subtaskRequest.setAssigneeId(memberUserId);
        subtaskRequest.setParentTaskId(parentTaskId);
        subtaskRequest.setDueDate(LocalDateTime.now().plusDays(7));
        subtaskRequest.setPriority(Priority.MEDIUM);
        
        HttpEntity<TaskCreateRequest> subtaskEntity = new HttpEntity<>(subtaskRequest, managerHeaders);
        ResponseEntity<TaskResponse> subtaskResponse = restTemplate.exchange(
            baseUrl + "/projects/" + projectId + "/tasks", HttpMethod.POST, subtaskEntity, TaskResponse.class);
        
        assertThat(subtaskResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        UUID subtaskId = subtaskResponse.getBody().getId();
        
        // Update task status (as assigned member)
        TaskUpdateRequest updateRequest = new TaskUpdateRequest();
        updateRequest.setStatus(TaskStatus.IN_PROGRESS);
        updateRequest.setDescription("Updated description with progress");
        
        HttpEntity<TaskUpdateRequest> updateEntity = new HttpEntity<>(updateRequest, memberHeaders);
        ResponseEntity<TaskResponse> updateResponse = restTemplate.exchange(
            baseUrl + "/tasks/" + subtaskId, HttpMethod.PUT, updateEntity, TaskResponse.class);
        
        assertThat(updateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updateResponse.getBody().getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
    }

    private void testCollaborationFeatures() {
        HttpHeaders memberHeaders = createAuthHeaders(memberToken);
        
        // Get a task to comment on
        HttpEntity<String> getEntity = new HttpEntity<>(memberHeaders);
        ResponseEntity<PagedTaskResponse> tasksResponse = restTemplate.exchange(
            baseUrl + "/projects/" + projectId + "/tasks?page=0&size=1", 
            HttpMethod.GET, getEntity, PagedTaskResponse.class);
        
        UUID taskId = tasksResponse.getBody().getTasks().get(0).getId();
        
        // Add comment
        CommentCreateRequest commentRequest = new CommentCreateRequest();
        commentRequest.setContent("This is a test comment for collaboration");
        
        HttpEntity<CommentCreateRequest> commentEntity = new HttpEntity<>(commentRequest, memberHeaders);
        ResponseEntity<CommentResponse> commentResponse = restTemplate.exchange(
            baseUrl + "/tasks/" + taskId + "/comments", HttpMethod.POST, commentEntity, CommentResponse.class);
        
        assertThat(commentResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(commentResponse.getBody().getContent()).isEqualTo("This is a test comment for collaboration");
        
        // Get comments
        ResponseEntity<CommentResponse[]> commentsResponse = restTemplate.exchange(
            baseUrl + "/tasks/" + taskId + "/comments", HttpMethod.GET, getEntity, CommentResponse[].class);
        
        assertThat(commentsResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(commentsResponse.getBody()).hasSizeGreaterThanOrEqualTo(1);
    }

    private void testActivityTracking() {
        HttpHeaders headers = createAuthHeaders(memberToken);
        
        // Get activity feed
        HttpEntity<String> getEntity = new HttpEntity<>(headers);
        ResponseEntity<ActivityResponse[]> activityResponse = restTemplate.exchange(
            baseUrl + "/activities?page=0&size=10", HttpMethod.GET, getEntity, ActivityResponse[].class);
        
        assertThat(activityResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(activityResponse.getBody()).isNotEmpty();
        
        // Verify activity contains expected actions
        List<ActivityResponse> activities = List.of(activityResponse.getBody());
        boolean hasTaskCreation = activities.stream()
            .anyMatch(activity -> activity.getAction().contains("CREATED"));
        
        assertThat(hasTaskCreation).isTrue();
    }

    private void testNotificationSystem() {
        HttpHeaders headers = createAuthHeaders(memberToken);
        
        // Get notifications
        HttpEntity<String> getEntity = new HttpEntity<>(headers);
        ResponseEntity<NotificationResponse[]> notificationResponse = restTemplate.exchange(
            baseUrl + "/notifications?page=0&size=10", HttpMethod.GET, getEntity, NotificationResponse[].class);
        
        assertThat(notificationResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        // If there are notifications, test marking as read
        if (notificationResponse.getBody().length > 0) {
            UUID notificationId = notificationResponse.getBody()[0].getId();
            
            ResponseEntity<Void> markReadResponse = restTemplate.exchange(
                baseUrl + "/notifications/" + notificationId + "/read", 
                HttpMethod.PUT, getEntity, Void.class);
            
            assertThat(markReadResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        }
    }

    private void testRoleBasedAccess() {
        // Test that member cannot create teams
        HttpHeaders memberHeaders = createAuthHeaders(memberToken);
        TeamCreateRequest teamRequest = new TeamCreateRequest();
        teamRequest.setName("Unauthorized Team");
        
        HttpEntity<TeamCreateRequest> teamEntity = new HttpEntity<>(teamRequest, memberHeaders);
        ResponseEntity<ErrorResponse> errorResponse = restTemplate.exchange(
            baseUrl + "/teams", HttpMethod.POST, teamEntity, ErrorResponse.class);
        
        // Should be forbidden or bad request depending on implementation
        assertThat(errorResponse.getStatusCode().is4xxClientError()).isTrue();
    }

    private void testJwtTokenValidation() {
        // Test with invalid token
        HttpHeaders invalidHeaders = new HttpHeaders();
        invalidHeaders.setBearerAuth("invalid.jwt.token");
        
        HttpEntity<String> entity = new HttpEntity<>(invalidHeaders);
        ResponseEntity<ErrorResponse> response = restTemplate.exchange(
            baseUrl + "/users/profile", HttpMethod.GET, entity, ErrorResponse.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    private void testUnauthorizedAccess() {
        // Test accessing protected endpoint without token
        ResponseEntity<ErrorResponse> response = restTemplate.getForEntity(
            baseUrl + "/users/profile", ErrorResponse.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    private void testCrossTeamAccessRestrictions() {
        // Create another team with different manager
        HttpHeaders adminHeaders = createAuthHeaders(adminToken);
        
        TeamCreateRequest teamRequest = new TeamCreateRequest();
        teamRequest.setName("Admin Team");
        
        HttpEntity<TeamCreateRequest> teamEntity = new HttpEntity<>(teamRequest, adminHeaders);
        ResponseEntity<TeamResponse> teamResponse = restTemplate.exchange(
            baseUrl + "/teams", HttpMethod.POST, teamEntity, TeamResponse.class);
        
        UUID adminTeamId = teamResponse.getBody().getId();
        
        // Try to access admin team with member token
        HttpHeaders memberHeaders = createAuthHeaders(memberToken);
        HttpEntity<String> getEntity = new HttpEntity<>(memberHeaders);
        
        ResponseEntity<ErrorResponse> errorResponse = restTemplate.exchange(
            baseUrl + "/teams/" + adminTeamId, HttpMethod.GET, getEntity, ErrorResponse.class);
        
        assertThat(errorResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    private void testInputValidation() {
        // Test invalid email format
        RegisterRequest invalidRequest = new RegisterRequest();
        invalidRequest.setEmail("invalid-email");
        invalidRequest.setPassword("short");
        invalidRequest.setFirstName("");
        invalidRequest.setLastName("");
        
        ResponseEntity<ErrorResponse> response = restTemplate.postForEntity(
            baseUrl + "/auth/register", invalidRequest, ErrorResponse.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getCode()).isEqualTo("VALIDATION_ERROR");
        assertThat(response.getBody().getDetails()).isNotEmpty();
    }

    private void testBusinessLogicValidation() {
        HttpHeaders headers = createAuthHeaders(managerToken);
        
        // Test creating project with end date before start date
        ProjectCreateRequest invalidProject = new ProjectCreateRequest();
        invalidProject.setName("Invalid Project");
        invalidProject.setStartDate(LocalDate.now());
        invalidProject.setEndDate(LocalDate.now().minusDays(1)); // End before start
        
        HttpEntity<ProjectCreateRequest> entity = new HttpEntity<>(invalidProject, headers);
        ResponseEntity<ErrorResponse> response = restTemplate.exchange(
            baseUrl + "/teams/" + teamId + "/projects", HttpMethod.POST, entity, ErrorResponse.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }

    private void testErrorResponseFormats() {
        // Test that all error responses follow the standard format
        ResponseEntity<ErrorResponse> response = restTemplate.getForEntity(
            baseUrl + "/nonexistent", ErrorResponse.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().getCode()).isNotNull();
        assertThat(response.getBody().getMessage()).isNotNull();
    }

    private void testConstraintViolations() {
        HttpHeaders headers = createAuthHeaders(managerToken);
        
        // Test duplicate team name
        TeamCreateRequest duplicateTeam = new TeamCreateRequest();
        duplicateTeam.setName("Comprehensive Test Team"); // Same as existing team
        
        HttpEntity<TeamCreateRequest> entity = new HttpEntity<>(duplicateTeam, headers);
        ResponseEntity<ErrorResponse> response = restTemplate.exchange(
            baseUrl + "/teams", HttpMethod.POST, entity, ErrorResponse.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    private void testPaginationFeatures() {
        HttpHeaders headers = createAuthHeaders(memberToken);
        
        // Test pagination parameters
        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<PagedTaskResponse> response = restTemplate.exchange(
            baseUrl + "/projects/" + projectId + "/tasks?page=0&size=5", 
            HttpMethod.GET, entity, PagedTaskResponse.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getTasks()).hasSizeLessThanOrEqualTo(5);
        assertThat(response.getBody().getTotalElements()).isNotNull();
        assertThat(response.getBody().getTotalPages()).isNotNull();
    }

    private void testFilteringAndSearch() {
        HttpHeaders headers = createAuthHeaders(memberToken);
        
        // Test filtering by status
        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<PagedTaskResponse> response = restTemplate.exchange(
            baseUrl + "/projects/" + projectId + "/tasks?status=IN_PROGRESS&page=0&size=10", 
            HttpMethod.GET, entity, PagedTaskResponse.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        // Verify all returned tasks have the filtered status
        if (!response.getBody().getTasks().isEmpty()) {
            boolean allInProgress = response.getBody().getTasks().stream()
                .allMatch(task -> task.getStatus() == TaskStatus.IN_PROGRESS);
            assertThat(allInProgress).isTrue();
        }
    }

    private void testBulkOperations() {
        HttpHeaders headers = createAuthHeaders(managerToken);
        
        // Create multiple tasks for bulk testing
        for (int i = 0; i < 5; i++) {
            TaskCreateRequest taskRequest = new TaskCreateRequest();
            taskRequest.setTitle("Bulk Task " + i);
            taskRequest.setDescription("Task for bulk operations test");
            taskRequest.setAssigneeId(memberUserId);
            taskRequest.setDueDate(LocalDateTime.now().plusDays(i + 1));
            
            HttpEntity<TaskCreateRequest> taskEntity = new HttpEntity<>(taskRequest, headers);
            restTemplate.exchange(
                baseUrl + "/projects/" + projectId + "/tasks", HttpMethod.POST, taskEntity, TaskResponse.class);
        }
        
        // Verify bulk creation
        HttpEntity<String> getEntity = new HttpEntity<>(headers);
        ResponseEntity<PagedTaskResponse> tasksResponse = restTemplate.exchange(
            baseUrl + "/projects/" + projectId + "/tasks?page=0&size=20", 
            HttpMethod.GET, getEntity, PagedTaskResponse.class);
        
        assertThat(tasksResponse.getBody().getTasks()).hasSizeGreaterThanOrEqualTo(5);
    }

    private void testConcurrentAccess() throws InterruptedException {
        // Test concurrent task creation
        Thread[] threads = new Thread[5];
        HttpHeaders headers = createAuthHeaders(managerToken);
        
        for (int i = 0; i < 5; i++) {
            final int taskIndex = i;
            threads[i] = new Thread(() -> {
                TaskCreateRequest taskRequest = new TaskCreateRequest();
                taskRequest.setTitle("Concurrent Task " + taskIndex);
                taskRequest.setDescription("Task created concurrently");
                taskRequest.setAssigneeId(memberUserId);
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
        
        // Wait for completion
        for (Thread thread : threads) {
            thread.join();
        }
    }

    private void testOpenApiEndpoints() {
        // Test that OpenAPI documentation is accessible
        ResponseEntity<String> response = restTemplate.getForEntity(
            baseUrl + "/api-docs", String.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("openapi");
        assertThat(response.getBody()).contains("Task Management API");
    }

    private void testResponseSchemas() {
        HttpHeaders headers = createAuthHeaders(memberToken);
        
        // Test user profile response schema
        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<UserResponse> userResponse = restTemplate.exchange(
            baseUrl + "/users/profile", HttpMethod.GET, entity, UserResponse.class);
        
        assertThat(userResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(userResponse.getBody().getId()).isNotNull();
        assertThat(userResponse.getBody().getEmail()).isNotNull();
        assertThat(userResponse.getBody().getFirstName()).isNotNull();
        assertThat(userResponse.getBody().getLastName()).isNotNull();
        assertThat(userResponse.getBody().getCreatedAt()).isNotNull();
    }

    private void testErrorSchemas() {
        // Test error response schema compliance
        ResponseEntity<ErrorResponse> response = restTemplate.getForEntity(
            baseUrl + "/teams/" + UUID.randomUUID(), ErrorResponse.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().getCode()).isNotNull();
        assertThat(response.getBody().getMessage()).isNotNull();
        // Request ID should be present for tracing
        assertThat(response.getHeaders().getFirst("X-Request-ID")).isNotNull();
    }

    private HttpHeaders createAuthHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        return headers;
    }
}