package com.taskmanagement.integration;

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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Security-focused integration tests covering authentication, authorization,
 * and security configurations
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
class SecurityIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgres:15-alpine"))
            .withDatabaseName("security_test")
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
        registry.add("rate-limit.requests-per-minute", () -> "10"); // Low limit for testing
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    private String baseUrl;

    @BeforeEach
    void setUp() {
        baseUrl = "http://localhost:" + port + "/api/v1";
    }

    @Test
    void testAuthenticationFlow() {
        // Test user registration
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("security@test.com");
        registerRequest.setPassword("SecurePass123");
        registerRequest.setFirstName("Security");
        registerRequest.setLastName("Test");
        
        ResponseEntity<AuthResponse> registerResponse = restTemplate.postForEntity(
            baseUrl + "/auth/register", registerRequest, AuthResponse.class);
        
        assertThat(registerResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(registerResponse.getBody().getAccessToken()).isNotNull();
        assertThat(registerResponse.getBody().getRefreshToken()).isNotNull();
        
        String accessToken = registerResponse.getBody().getAccessToken();
        String refreshToken = registerResponse.getBody().getRefreshToken();
        
        // Test login with correct credentials
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("security@test.com");
        loginRequest.setPassword("SecurePass123");
        
        ResponseEntity<AuthResponse> loginResponse = restTemplate.postForEntity(
            baseUrl + "/auth/login", loginRequest, AuthResponse.class);
        
        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginResponse.getBody().getAccessToken()).isNotNull();
        
        // Test login with incorrect credentials
        LoginRequest wrongLoginRequest = new LoginRequest();
        wrongLoginRequest.setEmail("security@test.com");
        wrongLoginRequest.setPassword("WrongPassword");
        
        ResponseEntity<ErrorResponse> wrongLoginResponse = restTemplate.postForEntity(
            baseUrl + "/auth/login", wrongLoginRequest, ErrorResponse.class);
        
        assertThat(wrongLoginResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        
        // Test token refresh
        RefreshTokenRequest refreshRequest = new RefreshTokenRequest();
        refreshRequest.setRefreshToken(refreshToken);
        
        ResponseEntity<AuthResponse> refreshResponse = restTemplate.postForEntity(
            baseUrl + "/auth/refresh", refreshRequest, AuthResponse.class);
        
        assertThat(refreshResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(refreshResponse.getBody().getAccessToken()).isNotNull();
        
        // Test accessing protected endpoint with valid token
        HttpHeaders headers = createAuthHeaders(accessToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);
        
        ResponseEntity<UserResponse> profileResponse = restTemplate.exchange(
            baseUrl + "/users/profile", HttpMethod.GET, entity, UserResponse.class);
        
        assertThat(profileResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void testJwtTokenSecurity() {
        // Register user and get token
        String token = registerAndGetToken("jwt@test.com", "JwtTest123");
        
        // Test with valid token
        HttpHeaders validHeaders = createAuthHeaders(token);
        HttpEntity<String> validEntity = new HttpEntity<>(validHeaders);
        
        ResponseEntity<UserResponse> validResponse = restTemplate.exchange(
            baseUrl + "/users/profile", HttpMethod.GET, validEntity, UserResponse.class);
        
        assertThat(validResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        // Test with malformed token
        HttpHeaders malformedHeaders = createAuthHeaders("malformed.jwt.token");
        HttpEntity<String> malformedEntity = new HttpEntity<>(malformedHeaders);
        
        ResponseEntity<ErrorResponse> malformedResponse = restTemplate.exchange(
            baseUrl + "/users/profile", HttpMethod.GET, malformedEntity, ErrorResponse.class);
        
        assertThat(malformedResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        
        // Test with empty token
        HttpHeaders emptyHeaders = new HttpHeaders();
        emptyHeaders.set("Authorization", "Bearer ");
        HttpEntity<String> emptyEntity = new HttpEntity<>(emptyHeaders);
        
        ResponseEntity<ErrorResponse> emptyResponse = restTemplate.exchange(
            baseUrl + "/users/profile", HttpMethod.GET, emptyEntity, ErrorResponse.class);
        
        assertThat(emptyResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        
        // Test without Authorization header
        ResponseEntity<ErrorResponse> noAuthResponse = restTemplate.getForEntity(
            baseUrl + "/users/profile", ErrorResponse.class);
        
        assertThat(noAuthResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void testRoleBasedAccessControl() {
        // Create users with different roles
        String adminToken = registerAndGetToken("admin@security.com", "AdminPass123");
        String managerToken = registerAndGetToken("manager@security.com", "ManagerPass123");
        String memberToken = registerAndGetToken("member@security.com", "MemberPass123");
        
        // Test team creation - should work for admin/manager
        TeamCreateRequest teamRequest = new TeamCreateRequest();
        teamRequest.setName("Security Test Team");
        teamRequest.setDescription("Team for security testing");
        
        // Manager should be able to create team
        HttpHeaders managerHeaders = createAuthHeaders(managerToken);
        HttpEntity<TeamCreateRequest> managerEntity = new HttpEntity<>(teamRequest, managerHeaders);
        
        ResponseEntity<TeamResponse> managerTeamResponse = restTemplate.exchange(
            baseUrl + "/teams", HttpMethod.POST, managerEntity, TeamResponse.class);
        
        assertThat(managerTeamResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        UUID teamId = managerTeamResponse.getBody().getId();
        
        // Test project creation within team
        ProjectCreateRequest projectRequest = new ProjectCreateRequest();
        projectRequest.setName("Security Test Project");
        projectRequest.setDescription("Project for security testing");
        projectRequest.setStartDate(LocalDate.now());
        projectRequest.setEndDate(LocalDate.now().plusDays(30));
        
        HttpEntity<ProjectCreateRequest> projectEntity = new HttpEntity<>(projectRequest, managerHeaders);
        ResponseEntity<ProjectResponse> projectResponse = restTemplate.exchange(
            baseUrl + "/teams/" + teamId + "/projects", HttpMethod.POST, projectEntity, ProjectResponse.class);
        
        assertThat(projectResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        UUID projectId = projectResponse.getBody().getId();
        
        // Test access control - member should not access team they're not part of
        HttpHeaders memberHeaders = createAuthHeaders(memberToken);
        HttpEntity<String> memberEntity = new HttpEntity<>(memberHeaders);
        
        ResponseEntity<ErrorResponse> memberAccessResponse = restTemplate.exchange(
            baseUrl + "/teams/" + teamId, HttpMethod.GET, memberEntity, ErrorResponse.class);
        
        assertThat(memberAccessResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        
        // Test project access control
        ResponseEntity<ErrorResponse> memberProjectResponse = restTemplate.exchange(
            baseUrl + "/projects/" + projectId, HttpMethod.GET, memberEntity, ErrorResponse.class);
        
        assertThat(memberProjectResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void testInputValidationSecurity() {
        // Test SQL injection attempts
        RegisterRequest sqlInjectionRequest = new RegisterRequest();
        sqlInjectionRequest.setEmail("test'; DROP TABLE users; --@test.com");
        sqlInjectionRequest.setPassword("Password123");
        sqlInjectionRequest.setFirstName("Test");
        sqlInjectionRequest.setLastName("User");
        
        ResponseEntity<ErrorResponse> sqlResponse = restTemplate.postForEntity(
            baseUrl + "/auth/register", sqlInjectionRequest, ErrorResponse.class);
        
        assertThat(sqlResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        
        // Test XSS attempts
        RegisterRequest xssRequest = new RegisterRequest();
        xssRequest.setEmail("xss@test.com");
        xssRequest.setPassword("Password123");
        xssRequest.setFirstName("<script>alert('xss')</script>");
        xssRequest.setLastName("User");
        
        ResponseEntity<ErrorResponse> xssResponse = restTemplate.postForEntity(
            baseUrl + "/auth/register", xssRequest, ErrorResponse.class);
        
        // Should either be rejected or sanitized
        assertThat(xssResponse.getStatusCode().is4xxClientError()).isTrue();
        
        // Test oversized input
        RegisterRequest oversizedRequest = new RegisterRequest();
        oversizedRequest.setEmail("oversized@test.com");
        oversizedRequest.setPassword("Password123");
        oversizedRequest.setFirstName("A".repeat(1000)); // Very long name
        oversizedRequest.setLastName("User");
        
        ResponseEntity<ErrorResponse> oversizedResponse = restTemplate.postForEntity(
            baseUrl + "/auth/register", oversizedRequest, ErrorResponse.class);
        
        assertThat(oversizedResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void testRateLimiting() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("nonexistent@test.com");
        loginRequest.setPassword("wrongpassword");
        
        int successCount = 0;
        int rateLimitedCount = 0;
        
        // Make requests beyond the rate limit
        for (int i = 0; i < 15; i++) {
            ResponseEntity<?> response = restTemplate.postForEntity(
                baseUrl + "/auth/login", loginRequest, Object.class);
            
            if (response.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                rateLimitedCount++;
                
                // Check rate limit headers
                assertThat(response.getHeaders().getFirst("X-RateLimit-Limit")).isNotNull();
                assertThat(response.getHeaders().getFirst("X-RateLimit-Remaining")).isNotNull();
                assertThat(response.getHeaders().getFirst("X-RateLimit-Reset")).isNotNull();
            } else {
                successCount++;
            }
        }
        
        // Should have some rate limited requests
        assertThat(rateLimitedCount).isGreaterThan(0);
        assertThat(successCount).isLessThan(15);
    }

    @Test
    void testCorsConfiguration() {
        // Test CORS preflight request
        HttpHeaders corsHeaders = new HttpHeaders();
        corsHeaders.set("Origin", "http://localhost:3000");
        corsHeaders.set("Access-Control-Request-Method", "POST");
        corsHeaders.set("Access-Control-Request-Headers", "Authorization,Content-Type");
        
        HttpEntity<String> corsEntity = new HttpEntity<>(corsHeaders);
        
        ResponseEntity<String> corsResponse = restTemplate.exchange(
            baseUrl + "/auth/login", HttpMethod.OPTIONS, corsEntity, String.class);
        
        // Should allow CORS for configured origins
        assertThat(corsResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(corsResponse.getHeaders().getAccessControlAllowOrigin()).isNotNull();
        assertThat(corsResponse.getHeaders().getAccessControlAllowMethods()).isNotEmpty();
    }

    @Test
    void testPasswordSecurity() {
        // Test weak password rejection
        RegisterRequest weakPasswordRequest = new RegisterRequest();
        weakPasswordRequest.setEmail("weak@test.com");
        weakPasswordRequest.setPassword("123"); // Too short
        weakPasswordRequest.setFirstName("Test");
        weakPasswordRequest.setLastName("User");
        
        ResponseEntity<ErrorResponse> weakResponse = restTemplate.postForEntity(
            baseUrl + "/auth/register", weakPasswordRequest, ErrorResponse.class);
        
        assertThat(weakResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(weakResponse.getBody().getDetails()).isNotEmpty();
        
        // Test password without required complexity
        RegisterRequest simplePasswordRequest = new RegisterRequest();
        simplePasswordRequest.setEmail("simple@test.com");
        simplePasswordRequest.setPassword("password"); // No uppercase, no numbers
        simplePasswordRequest.setFirstName("Test");
        simplePasswordRequest.setLastName("User");
        
        ResponseEntity<ErrorResponse> simpleResponse = restTemplate.postForEntity(
            baseUrl + "/auth/register", simplePasswordRequest, ErrorResponse.class);
        
        assertThat(simpleResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void testSecurityHeaders() {
        // Test that security headers are present in responses
        ResponseEntity<String> response = restTemplate.getForEntity(
            baseUrl + "/auth/login", String.class);
        
        HttpHeaders headers = response.getHeaders();
        
        // Check for security headers (these should be configured in SecurityConfig)
        // Note: Actual header names may vary based on Spring Security configuration
        assertThat(headers.getFirst("X-Content-Type-Options")).isNotNull();
        assertThat(headers.getFirst("X-Frame-Options")).isNotNull();
        assertThat(headers.getFirst("X-XSS-Protection")).isNotNull();
    }

    @Test
    void testSessionManagement() {
        // Test that the application is stateless (no session cookies)
        String token = registerAndGetToken("session@test.com", "SessionTest123");
        
        HttpHeaders headers = createAuthHeaders(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);
        
        ResponseEntity<UserResponse> response = restTemplate.exchange(
            baseUrl + "/users/profile", HttpMethod.GET, entity, UserResponse.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        // Should not set session cookies
        String setCookieHeader = response.getHeaders().getFirst("Set-Cookie");
        if (setCookieHeader != null) {
            assertThat(setCookieHeader).doesNotContain("JSESSIONID");
        }
    }

    @Test
    void testResourceAccessControl() {
        // Create two users
        String user1Token = registerAndGetToken("user1@test.com", "User1Pass123");
        String user2Token = registerAndGetToken("user2@test.com", "User2Pass123");
        
        // User1 creates a team
        TeamCreateRequest teamRequest = new TeamCreateRequest();
        teamRequest.setName("User1 Team");
        
        HttpHeaders user1Headers = createAuthHeaders(user1Token);
        HttpEntity<TeamCreateRequest> teamEntity = new HttpEntity<>(teamRequest, user1Headers);
        
        ResponseEntity<TeamResponse> teamResponse = restTemplate.exchange(
            baseUrl + "/teams", HttpMethod.POST, teamEntity, TeamResponse.class);
        
        UUID teamId = teamResponse.getBody().getId();
        
        // User2 should not be able to access User1's team
        HttpHeaders user2Headers = createAuthHeaders(user2Token);
        HttpEntity<String> getEntity = new HttpEntity<>(user2Headers);
        
        ResponseEntity<ErrorResponse> accessResponse = restTemplate.exchange(
            baseUrl + "/teams/" + teamId, HttpMethod.GET, getEntity, ErrorResponse.class);
        
        assertThat(accessResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        
        // User2 should not be able to modify User1's team
        TeamUpdateRequest updateRequest = new TeamUpdateRequest();
        updateRequest.setName("Hacked Team");
        
        HttpEntity<TeamUpdateRequest> updateEntity = new HttpEntity<>(updateRequest, user2Headers);
        ResponseEntity<ErrorResponse> updateResponse = restTemplate.exchange(
            baseUrl + "/teams/" + teamId, HttpMethod.PUT, updateEntity, ErrorResponse.class);
        
        assertThat(updateResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    private String registerAndGetToken(String email, String password) {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail(email);
        registerRequest.setPassword(password);
        registerRequest.setFirstName("Test");
        registerRequest.setLastName("User");
        
        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
            baseUrl + "/auth/register", registerRequest, AuthResponse.class);
        
        if (response.getStatusCode() == HttpStatus.CREATED) {
            return response.getBody().getAccessToken();
        } else {
            // User might already exist, try login
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setEmail(email);
            loginRequest.setPassword(password);
            
            ResponseEntity<AuthResponse> loginResponse = restTemplate.postForEntity(
                baseUrl + "/auth/login", loginRequest, AuthResponse.class);
            
            return loginResponse.getBody().getAccessToken();
        }
    }

    private HttpHeaders createAuthHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        return headers;
    }
}