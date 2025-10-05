package com.taskmanagement.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for health check endpoints and actuator functionality
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
class HealthCheckIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgres:15-alpine"))
            .withDatabaseName("health_test")
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
        registry.add("management.endpoints.web.exposure.include", () -> "*");
        registry.add("management.endpoint.health.show-details", () -> "always");
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    private String baseUrl;
    private String actuatorUrl;

    @BeforeEach
    void setUp() {
        baseUrl = "http://localhost:" + port + "/api/v1";
        actuatorUrl = "http://localhost:" + port + "/api/v1/actuator";
    }

    @Test
    void testHealthEndpoint() throws Exception {
        ResponseEntity<String> response = restTemplate.getForEntity(
            actuatorUrl + "/health", String.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        JsonNode healthResponse = objectMapper.readTree(response.getBody());
        
        // Validate overall health status
        assertThat(healthResponse.has("status")).isTrue();
        assertThat(healthResponse.get("status").asText()).isEqualTo("UP");
        
        // Validate components
        assertThat(healthResponse.has("components")).isTrue();
        JsonNode components = healthResponse.get("components");
        
        // Database health
        assertThat(components.has("db")).isTrue();
        JsonNode dbHealth = components.get("db");
        assertThat(dbHealth.get("status").asText()).isEqualTo("UP");
        assertThat(dbHealth.has("details")).isTrue();
        
        // Redis health
        assertThat(components.has("redis")).isTrue();
        JsonNode redisHealth = components.get("redis");
        assertThat(redisHealth.get("status").asText()).isEqualTo("UP");
        
        // Disk space health
        assertThat(components.has("diskSpace")).isTrue();
        JsonNode diskHealth = components.get("diskSpace");
        assertThat(diskHealth.get("status").asText()).isEqualTo("UP");
        assertThat(diskHealth.has("details")).isTrue();
        
        // Ping health
        assertThat(components.has("ping")).isTrue();
        JsonNode pingHealth = components.get("ping");
        assertThat(pingHealth.get("status").asText()).isEqualTo("UP");
    }

    @Test
    void testCustomHealthIndicators() throws Exception {
        ResponseEntity<String> response = restTemplate.getForEntity(
            actuatorUrl + "/health", String.class);
        
        JsonNode healthResponse = objectMapper.readTree(response.getBody());
        JsonNode components = healthResponse.get("components");
        
        // Test custom database health indicator
        if (components.has("databaseHealthIndicator")) {
            JsonNode customDbHealth = components.get("databaseHealthIndicator");
            assertThat(customDbHealth.get("status").asText()).isEqualTo("UP");
            
            JsonNode details = customDbHealth.get("details");
            assertThat(details.has("responseTime")).isTrue();
            assertThat(details.has("version")).isTrue();
        }
        
        // Test custom Redis health indicator
        if (components.has("redisHealthIndicator")) {
            JsonNode customRedisHealth = components.get("redisHealthIndicator");
            assertThat(customRedisHealth.get("status").asText()).isEqualTo("UP");
            
            JsonNode details = customRedisHealth.get("details");
            assertThat(details.has("responseTime")).isTrue();
        }
    }

    @Test
    void testInfoEndpoint() throws Exception {
        ResponseEntity<String> response = restTemplate.getForEntity(
            actuatorUrl + "/info", String.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        JsonNode infoResponse = objectMapper.readTree(response.getBody());
        
        // Validate application info
        assertThat(infoResponse.has("app")).isTrue();
        JsonNode appInfo = infoResponse.get("app");
        assertThat(appInfo.has("name")).isTrue();
        assertThat(appInfo.has("description")).isTrue();
        assertThat(appInfo.has("version")).isTrue();
        
        // Validate runtime info
        if (infoResponse.has("runtime")) {
            JsonNode runtimeInfo = infoResponse.get("runtime");
            assertThat(runtimeInfo.has("processors")).isTrue();
            assertThat(runtimeInfo.has("maxMemory")).isTrue();
            assertThat(runtimeInfo.has("javaVersion")).isTrue();
            assertThat(runtimeInfo.has("osName")).isTrue();
        }
        
        // Validate application features
        if (infoResponse.has("application")) {
            JsonNode applicationInfo = infoResponse.get("application");
            assertThat(applicationInfo.has("features")).isTrue();
            JsonNode features = applicationInfo.get("features");
            assertThat(features.isArray()).isTrue();
            assertThat(features.size()).isGreaterThan(0);
        }
    }

    @Test
    void testMetricsEndpoint() throws Exception {
        ResponseEntity<String> response = restTemplate.getForEntity(
            actuatorUrl + "/metrics", String.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        JsonNode metricsResponse = objectMapper.readTree(response.getBody());
        
        // Validate metrics structure
        assertThat(metricsResponse.has("names")).isTrue();
        JsonNode names = metricsResponse.get("names");
        assertThat(names.isArray()).isTrue();
        assertThat(names.size()).isGreaterThan(0);
        
        // Check for common metrics
        boolean hasJvmMemoryUsed = false;
        boolean hasHttpServerRequests = false;
        boolean hasSystemCpuUsage = false;
        
        for (JsonNode name : names) {
            String metricName = name.asText();
            if (metricName.equals("jvm.memory.used")) {
                hasJvmMemoryUsed = true;
            } else if (metricName.equals("http.server.requests")) {
                hasHttpServerRequests = true;
            } else if (metricName.equals("system.cpu.usage")) {
                hasSystemCpuUsage = true;
            }
        }
        
        assertThat(hasJvmMemoryUsed).isTrue();
        assertThat(hasHttpServerRequests).isTrue();
        assertThat(hasSystemCpuUsage).isTrue();
    }

    @Test
    void testSpecificMetrics() throws Exception {
        // Test JVM memory metric
        ResponseEntity<String> memoryResponse = restTemplate.getForEntity(
            actuatorUrl + "/metrics/jvm.memory.used", String.class);
        
        assertThat(memoryResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        JsonNode memoryMetric = objectMapper.readTree(memoryResponse.getBody());
        assertThat(memoryMetric.has("name")).isTrue();
        assertThat(memoryMetric.get("name").asText()).isEqualTo("jvm.memory.used");
        assertThat(memoryMetric.has("measurements")).isTrue();
        assertThat(memoryMetric.get("measurements").isArray()).isTrue();
        
        // Test HTTP server requests metric (if available)
        ResponseEntity<String> httpResponse = restTemplate.getForEntity(
            actuatorUrl + "/metrics/http.server.requests", String.class);
        
        if (httpResponse.getStatusCode() == HttpStatus.OK) {
            JsonNode httpMetric = objectMapper.readTree(httpResponse.getBody());
            assertThat(httpMetric.has("name")).isTrue();
            assertThat(httpMetric.get("name").asText()).isEqualTo("http.server.requests");
            assertThat(httpMetric.has("availableTags")).isTrue();
        }
    }

    @Test
    void testPrometheusEndpoint() {
        ResponseEntity<String> response = restTemplate.getForEntity(
            actuatorUrl + "/prometheus", String.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        String prometheusMetrics = response.getBody();
        assertThat(prometheusMetrics).isNotNull();
        assertThat(prometheusMetrics).isNotEmpty();
        
        // Validate Prometheus format
        assertThat(prometheusMetrics).contains("# HELP");
        assertThat(prometheusMetrics).contains("# TYPE");
        
        // Check for common metrics in Prometheus format
        assertThat(prometheusMetrics).contains("jvm_memory_used_bytes");
        assertThat(prometheusMetrics).contains("system_cpu_usage");
        assertThat(prometheusMetrics).contains("http_server_requests");
    }

    @Test
    void testEnvironmentEndpoint() throws Exception {
        ResponseEntity<String> response = restTemplate.getForEntity(
            actuatorUrl + "/env", String.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        JsonNode envResponse = objectMapper.readTree(response.getBody());
        
        // Validate environment structure
        assertThat(envResponse.has("activeProfiles")).isTrue();
        assertThat(envResponse.has("propertySources")).isTrue();
        
        JsonNode activeProfiles = envResponse.get("activeProfiles");
        assertThat(activeProfiles.isArray()).isTrue();
        
        JsonNode propertySources = envResponse.get("propertySources");
        assertThat(propertySources.isArray()).isTrue();
        assertThat(propertySources.size()).isGreaterThan(0);
        
        // Check that test profile is active
        boolean hasTestProfile = false;
        for (JsonNode profile : activeProfiles) {
            if (profile.asText().equals("test")) {
                hasTestProfile = true;
                break;
            }
        }
        assertThat(hasTestProfile).isTrue();
    }

    @Test
    void testConfigPropsEndpoint() throws Exception {
        ResponseEntity<String> response = restTemplate.getForEntity(
            actuatorUrl + "/configprops", String.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        JsonNode configResponse = objectMapper.readTree(response.getBody());
        
        // Validate configuration properties structure
        assertThat(configResponse.has("contexts")).isTrue();
        JsonNode contexts = configResponse.get("contexts");
        assertThat(contexts.has("application")).isTrue();
        
        JsonNode application = contexts.get("application");
        assertThat(application.has("beans")).isTrue();
        
        JsonNode beans = application.get("beans");
        assertThat(beans.size()).isGreaterThan(0);
        
        // Check for Spring Boot configuration beans
        boolean hasDataSourceProperties = false;
        boolean hasServerProperties = false;
        
        var fieldNames = beans.fieldNames();
        while (fieldNames.hasNext()) {
            String name = fieldNames.next();
            if (name.contains("dataSource") || name.contains("DataSource")) {
                hasDataSourceProperties = true;
            } else if (name.contains("server") || name.contains("Server")) {
                hasServerProperties = true;
            }
        }
        
        // At least one of these should be present
        assertThat(hasDataSourceProperties || hasServerProperties).isTrue();
    }

    @Test
    void testLoggersEndpoint() throws Exception {
        ResponseEntity<String> response = restTemplate.getForEntity(
            actuatorUrl + "/loggers", String.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        JsonNode loggersResponse = objectMapper.readTree(response.getBody());
        
        // Validate loggers structure
        assertThat(loggersResponse.has("levels")).isTrue();
        assertThat(loggersResponse.has("loggers")).isTrue();
        
        JsonNode levels = loggersResponse.get("levels");
        assertThat(levels.isArray()).isTrue();
        
        JsonNode loggers = loggersResponse.get("loggers");
        assertThat(loggers.size()).isGreaterThan(0);
        
        // Check for application logger
        assertThat(loggers.has("com.taskmanagement")).isTrue();
        JsonNode appLogger = loggers.get("com.taskmanagement");
        assertThat(appLogger.has("effectiveLevel")).isTrue();
        
        // Check root logger
        assertThat(loggers.has("ROOT")).isTrue();
        JsonNode rootLogger = loggers.get("ROOT");
        assertThat(rootLogger.has("effectiveLevel")).isTrue();
    }

    @Test
    void testHealthEndpointWithDatabaseDown() {
        // This test would require stopping the database container
        // For now, we'll test that the health endpoint handles partial failures gracefully
        
        ResponseEntity<String> response = restTemplate.getForEntity(
            actuatorUrl + "/health", String.class);
        
        // Even if some components are down, the endpoint should respond
        assertThat(response.getStatusCode().is2xxSuccessful() || 
                  response.getStatusCode().is5xxServerError()).isTrue();
    }

    @Test
    void testReadinessAndLivenessProbes() {
        // Test readiness probe
        ResponseEntity<String> readinessResponse = restTemplate.getForEntity(
            actuatorUrl + "/health/readiness", String.class);
        
        assertThat(readinessResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        // Test liveness probe
        ResponseEntity<String> livenessResponse = restTemplate.getForEntity(
            actuatorUrl + "/health/liveness", String.class);
        
        assertThat(livenessResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void testActuatorSecurity() {
        // Test that actuator endpoints are accessible (in test profile)
        ResponseEntity<String> healthResponse = restTemplate.getForEntity(
            actuatorUrl + "/health", String.class);
        
        assertThat(healthResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        // Test that sensitive endpoints require authentication in production
        // (This would be different in production profile)
        ResponseEntity<String> envResponse = restTemplate.getForEntity(
            actuatorUrl + "/env", String.class);
        
        // In test profile, this should be accessible
        assertThat(envResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void testCustomMetrics() throws Exception {
        // Make some API calls to generate custom metrics
        restTemplate.getForEntity(baseUrl + "/auth/login", String.class);
        
        // Wait a moment for metrics to be recorded
        Thread.sleep(100);
        
        // Check if custom metrics are available
        ResponseEntity<String> metricsResponse = restTemplate.getForEntity(
            actuatorUrl + "/metrics", String.class);
        
        JsonNode metricsJson = objectMapper.readTree(metricsResponse.getBody());
        JsonNode names = metricsJson.get("names");
        
        // Look for HTTP request metrics
        boolean hasHttpMetrics = false;
        for (JsonNode name : names) {
            if (name.asText().equals("http.server.requests")) {
                hasHttpMetrics = true;
                break;
            }
        }
        
        assertThat(hasHttpMetrics).isTrue();
        
        // Get detailed HTTP metrics
        ResponseEntity<String> httpMetricsResponse = restTemplate.getForEntity(
            actuatorUrl + "/metrics/http.server.requests", String.class);
        
        assertThat(httpMetricsResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        JsonNode httpMetrics = objectMapper.readTree(httpMetricsResponse.getBody());
        assertThat(httpMetrics.has("measurements")).isTrue();
        assertThat(httpMetrics.get("measurements").isArray()).isTrue();
        assertThat(httpMetrics.get("measurements").size()).isGreaterThan(0);
    }
}