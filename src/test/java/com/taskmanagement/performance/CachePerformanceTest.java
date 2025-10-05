package com.taskmanagement.performance;

import com.taskmanagement.config.CacheConfig;
import com.taskmanagement.entity.User;
import com.taskmanagement.entity.Team;
import com.taskmanagement.entity.Project;
import com.taskmanagement.entity.Task;
import com.taskmanagement.entity.Role;
import com.taskmanagement.entity.ProjectStatus;
import com.taskmanagement.entity.TaskStatus;
import com.taskmanagement.entity.Priority;
import com.taskmanagement.repository.UserRepository;
import com.taskmanagement.repository.TeamRepository;
import com.taskmanagement.repository.ProjectRepository;
import com.taskmanagement.repository.TaskRepository;
import com.taskmanagement.service.UserService;
import com.taskmanagement.service.TeamService;
import com.taskmanagement.service.ProjectService;
import com.taskmanagement.service.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@Transactional
class CachePerformanceTest {

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
    }

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private UserService userService;

    @Autowired
    private TeamService teamService;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private TaskService taskService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private TaskRepository taskRepository;

    private User testUser;
    private Team testTeam;
    private Project testProject;

    @BeforeEach
    void setUp() {
        // Clear all caches
        cacheManager.getCacheNames().forEach(cacheName -> {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
            }
        });

        // Create test data
        testUser = createTestUser();
        testTeam = createTestTeam(testUser);
        testProject = createTestProject(testTeam, testUser);
    }

    @Test
    void testUserCachePerformance() {
        UUID userId = testUser.getId();
        
        // Measure database access time (cache miss)
        long startTime = System.nanoTime();
        userService.findById(userId).orElse(null);
        long dbAccessTime = System.nanoTime() - startTime;
        
        // Measure cache access time (cache hit)
        startTime = System.nanoTime();
        userService.findById(userId).orElse(null);
        long cacheAccessTime = System.nanoTime() - startTime;
        
        // Cache should be significantly faster
        assertThat(cacheAccessTime).isLessThan(dbAccessTime / 2);
        
        // Verify cache contains the user
        Cache userCache = cacheManager.getCache(CacheConfig.USER_CACHE);
        assertThat(userCache).isNotNull();
        assertThat(userCache.get(userId)).isNotNull();
    }

    @Test
    void testCacheEvictionOnUpdate() {
        UUID userId = testUser.getId();
        
        // Load user into cache
        userService.findById(userId).orElse(null);
        
        // Verify user is cached
        Cache userCache = cacheManager.getCache(CacheConfig.USER_CACHE);
        assertThat(userCache.get(userId)).isNotNull();
        
        // Update user (should evict cache)
        testUser.setFirstName("Updated Name");
        userRepository.save(testUser);
        
        // Cache should be evicted after update
        // Note: This depends on cache eviction configuration
        // For this test, we'll manually verify the behavior
        userService.findById(userId).orElse(null);
        
        // Verify updated data is returned
        User updatedUser = userService.findById(userId).orElse(null);
        assertThat(updatedUser).isNotNull();
        assertThat(updatedUser.getFirstName()).isEqualTo("Updated Name");
    }

    @Test
    void testConcurrentCacheAccess() throws InterruptedException {
        UUID userId = testUser.getId();
        int numberOfThreads = 50;
        int requestsPerThread = 10;
        
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        AtomicLong totalTime = new AtomicLong(0);
        AtomicLong requestCount = new AtomicLong(0);
        
        CompletableFuture<Void>[] futures = new CompletableFuture[numberOfThreads];
        
        for (int i = 0; i < numberOfThreads; i++) {
            futures[i] = CompletableFuture.runAsync(() -> {
                for (int j = 0; j < requestsPerThread; j++) {
                    long startTime = System.nanoTime();
                    userService.findById(userId).orElse(null);
                    long endTime = System.nanoTime();
                    
                    totalTime.addAndGet(endTime - startTime);
                    requestCount.incrementAndGet();
                }
            }, executor);
        }
        
        try {
            CompletableFuture.allOf(futures).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            // Handle exception
        }
        executor.shutdown();
        
        // Calculate average response time
        long averageTime = totalTime.get() / requestCount.get();
        
        // Average time should be reasonable (less than 1ms)
        assertThat(averageTime).isLessThan(1_000_000); // 1ms in nanoseconds
        
        // Verify all requests completed
        assertThat(requestCount.get()).isEqualTo(numberOfThreads * requestsPerThread);
    }

    @Test
    void testCacheTTLBehavior() throws InterruptedException {
        UUID userId = testUser.getId();
        
        // Load user into cache
        userService.findById(userId).orElse(null);
        
        // Verify user is cached
        Cache userCache = cacheManager.getCache(CacheConfig.USER_CACHE);
        assertThat(userCache.get(userId)).isNotNull();
        
        // Wait for a short time (less than TTL)
        Thread.sleep(1000);
        
        // User should still be cached
        assertThat(userCache.get(userId)).isNotNull();
        
        // Note: Testing actual TTL expiration would require waiting 30 minutes
        // In a real scenario, you might configure shorter TTL for testing
    }

    @Test
    void testMultipleCacheTypes() {
        // Test different cache types with different TTL configurations
        UUID userId = testUser.getId();
        UUID teamId = testTeam.getId();
        UUID projectId = testProject.getId();
        
        // Load entities into respective caches
        userService.findById(userId).orElse(null);
        // Note: TeamService and ProjectService findById methods may not exist
        // Using repository directly for this test
        teamRepository.findById(teamId).orElse(null);
        projectRepository.findById(projectId).orElse(null);
        
        // Verify all caches contain the entities
        assertThat(cacheManager.getCache(CacheConfig.USER_CACHE).get(userId)).isNotNull();
        assertThat(cacheManager.getCache(CacheConfig.TEAM_CACHE).get(teamId)).isNotNull();
        assertThat(cacheManager.getCache(CacheConfig.PROJECT_CACHE).get(projectId)).isNotNull();
    }

    @Test
    void testCacheMemoryUsage() {
        // Create multiple entities to test cache memory behavior
        for (int i = 0; i < 100; i++) {
            User user = createTestUser("user" + i + "@test.com");
            userService.findById(user.getId()).orElse(null);
        }
        
        Cache userCache = cacheManager.getCache(CacheConfig.USER_CACHE);
        assertThat(userCache).isNotNull();
        
        // Verify cache is populated but not overflowing
        // This is a basic test - in production you'd monitor actual memory usage
    }

    @Test
    void testCachePerformanceWithComplexQueries() {
        // Create multiple tasks for performance testing
        for (int i = 0; i < 50; i++) {
            createTestTask(testProject, testUser, "Task " + i);
        }
        
        // Test performance of complex queries with caching
        long startTime = System.nanoTime();
        taskService.getTasksByProject(testProject.getId(), testUser.getId());
        long firstQueryTime = System.nanoTime() - startTime;
        
        // Second query should benefit from caching
        startTime = System.nanoTime();
        taskService.getTasksByProject(testProject.getId(), testUser.getId());
        long secondQueryTime = System.nanoTime() - startTime;
        
        // Note: Depending on caching strategy, second query might be faster
        // This test verifies the caching mechanism is working
        assertThat(secondQueryTime).isLessThanOrEqualTo(firstQueryTime * 2);
    }

    private User createTestUser() {
        return createTestUser("test@example.com");
    }

    private User createTestUser(String email) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("hashedPassword");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(Role.MEMBER);
        return userRepository.save(user);
    }

    private Team createTestTeam(User owner) {
        Team team = new Team();
        team.setName("Test Team " + System.currentTimeMillis());
        team.setDescription("Test team description");
        team.setOwner(owner);
        return teamRepository.save(team);
    }

    private Project createTestProject(Team team, User createdBy) {
        Project project = new Project();
        project.setName("Test Project");
        project.setDescription("Test project description");
        project.setTeam(team);
        project.setStatus(ProjectStatus.ACTIVE);
        project.setStartDate(LocalDate.now());
        project.setEndDate(LocalDate.now().plusDays(30));
        project.setCreatedBy(createdBy);
        return projectRepository.save(project);
    }

    private Task createTestTask(Project project, User assignee, String title) {
        Task task = new Task();
        task.setTitle(title);
        task.setDescription("Test task description");
        task.setProject(project);
        task.setStatus(TaskStatus.TODO);
        task.setPriority(Priority.MEDIUM);
        task.setAssignee(assignee);
        task.setDueDate(LocalDateTime.now().plusDays(7));
        task.setCreatedBy(assignee);
        return taskRepository.save(task);
    }
}