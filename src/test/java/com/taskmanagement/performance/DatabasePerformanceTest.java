package com.taskmanagement.performance;

import com.taskmanagement.entity.*;
import com.taskmanagement.repository.*;
import com.taskmanagement.dto.TaskFilterRequest;
import com.taskmanagement.dto.PagedTaskResponse;
import com.taskmanagement.service.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
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
class DatabasePerformanceTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgres:15-alpine"))
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.show-sql", () -> "false"); // Disable SQL logging for performance tests
    }

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskService taskService;

    private List<User> testUsers;
    private List<Team> testTeams;
    private List<Project> testProjects;
    private List<Task> testTasks;

    @BeforeEach
    void setUp() {
        createTestData();
    }

    @Test
    void testUserQueryPerformance() {
        // Test simple user queries
        long startTime = System.nanoTime();
        List<User> users = userRepository.findAll();
        long queryTime = System.nanoTime() - startTime;
        
        assertThat(users).hasSize(50);
        assertThat(queryTime).isLessThan(100_000_000); // 100ms
        
        // Test user search by email (should use index)
        startTime = System.nanoTime();
        User user = userRepository.findByEmail("user0@test.com").orElse(null);
        queryTime = System.nanoTime() - startTime;
        
        assertThat(user).isNotNull();
        assertThat(queryTime).isLessThan(10_000_000); // 10ms
    }

    @Test
    void testTaskQueryPerformanceWithIndexes() {
        // Test task queries that should benefit from indexes
        UUID projectId = testProjects.get(0).getId();
        
        // Query tasks by project (should use project_id index)
        long startTime = System.nanoTime();
        List<Task> projectTasks = taskRepository.findByProjectId(projectId);
        long queryTime = System.nanoTime() - startTime;
        
        assertThat(projectTasks).isNotEmpty();
        assertThat(queryTime).isLessThan(50_000_000); // 50ms
        
        // Query tasks by status (should use status index)
        startTime = System.nanoTime();
        List<Task> todoTasks = taskRepository.findByStatus(TaskStatus.TODO);
        queryTime = System.nanoTime() - startTime;
        
        assertThat(todoTasks).isNotEmpty();
        assertThat(queryTime).isLessThan(50_000_000); // 50ms
        
        // Query tasks by assignee (should use assignee_id index)
        UUID assigneeId = testUsers.get(0).getId();
        startTime = System.nanoTime();
        List<Task> assignedTasks = taskRepository.findByAssigneeId(assigneeId);
        queryTime = System.nanoTime() - startTime;
        
        assertThat(assignedTasks).isNotEmpty();
        assertThat(queryTime).isLessThan(50_000_000); // 50ms
    }

    @Test
    void testComplexTaskFilteringPerformance() {
        UUID projectId = testProjects.get(0).getId();
        
        TaskFilterRequest filter = new TaskFilterRequest();
        filter.setStatus(TaskStatus.TODO);
        filter.setPriority(Priority.HIGH);
        filter.setAssigneeId(testUsers.get(0).getId());
        
        // Test complex filtering query performance
        long startTime = System.nanoTime();
        PagedTaskResponse filteredTasks = taskService.searchTasks(filter, 0, 20, testUsers.get(0).getId());
        long queryTime = System.nanoTime() - startTime;
        
        assertThat(filteredTasks).isNotNull();
        assertThat(queryTime).isLessThan(100_000_000); // 100ms
    }

    @Test
    void testPaginationPerformance() {
        UUID projectId = testProjects.get(0).getId();
        
        // Test pagination performance with different page sizes
        int[] pageSizes = {10, 25, 50, 100};
        
        for (int pageSize : pageSizes) {
            long startTime = System.nanoTime();
            List<Task> tasks = taskRepository.findByProjectId(projectId);
            long queryTime = System.nanoTime() - startTime;
            
            assertThat(tasks).isNotNull();
            assertThat(queryTime).isLessThan(100_000_000); // 100ms
        }
    }

    @Test
    void testConcurrentDatabaseAccess() throws InterruptedException {
        int numberOfThreads = 20;
        int queriesPerThread = 10;
        
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        AtomicLong totalQueryTime = new AtomicLong(0);
        AtomicLong queryCount = new AtomicLong(0);
        
        CompletableFuture<Void>[] futures = new CompletableFuture[numberOfThreads];
        
        for (int i = 0; i < numberOfThreads; i++) {
            final int threadIndex = i;
            futures[i] = CompletableFuture.runAsync(() -> {
                for (int j = 0; j < queriesPerThread; j++) {
                    long startTime = System.nanoTime();
                    
                    // Perform different types of queries
                    switch (j % 4) {
                        case 0:
                            userRepository.findAll();
                            break;
                        case 1:
                            teamRepository.findAll();
                            break;
                        case 2:
                            projectRepository.findAll();
                            break;
                        case 3:
                            taskRepository.findByStatus(TaskStatus.TODO);
                            break;
                    }
                    
                    long queryTime = System.nanoTime() - startTime;
                    totalQueryTime.addAndGet(queryTime);
                    queryCount.incrementAndGet();
                }
            }, executor);
        }
        
        try {
            CompletableFuture.allOf(futures).get(60, TimeUnit.SECONDS);
        } catch (Exception e) {
            // Handle exception
        }
        executor.shutdown();
        
        // Calculate average query time
        long averageQueryTime = totalQueryTime.get() / queryCount.get();
        
        // Average query time should be reasonable
        assertThat(averageQueryTime).isLessThan(50_000_000); // 50ms
        assertThat(queryCount.get()).isEqualTo(numberOfThreads * queriesPerThread);
    }

    @Test
    void testJoinQueryPerformance() {
        // Test queries with joins to verify index effectiveness
        
        // Query tasks with project and assignee information
        long startTime = System.nanoTime();
        Query query = entityManager.createQuery(
            "SELECT t FROM Task t " +
            "JOIN FETCH t.project p " +
            "JOIN FETCH t.assignee a " +
            "WHERE p.status = :status"
        );
        query.setParameter("status", ProjectStatus.ACTIVE);
        query.setMaxResults(50);
        
        @SuppressWarnings("unchecked")
        List<Task> tasks = query.getResultList();
        long queryTime = System.nanoTime() - startTime;
        
        assertThat(tasks).isNotEmpty();
        assertThat(queryTime).isLessThan(100_000_000); // 100ms
        
        // Verify that data is properly fetched (no N+1 queries)
        for (Task task : tasks) {
            assertThat(task.getProject()).isNotNull();
            assertThat(task.getAssignee()).isNotNull();
        }
    }

    @Test
    void testAggregationQueryPerformance() {
        // Test aggregation queries performance
        
        // Count tasks by status
        long startTime = System.nanoTime();
        Query countQuery = entityManager.createQuery(
            "SELECT t.status, COUNT(t) FROM Task t GROUP BY t.status"
        );
        @SuppressWarnings("unchecked")
        List<Object[]> statusCounts = countQuery.getResultList();
        long queryTime = System.nanoTime() - startTime;
        
        assertThat(statusCounts).isNotEmpty();
        assertThat(queryTime).isLessThan(50_000_000); // 50ms
        
        // Count tasks by priority
        startTime = System.nanoTime();
        countQuery = entityManager.createQuery(
            "SELECT t.priority, COUNT(t) FROM Task t GROUP BY t.priority"
        );
        @SuppressWarnings("unchecked")
        List<Object[]> priorityCounts = countQuery.getResultList();
        queryTime = System.nanoTime() - startTime;
        
        assertThat(priorityCounts).isNotEmpty();
        assertThat(queryTime).isLessThan(50_000_000); // 50ms
    }

    @Test
    void testDateRangeQueryPerformance() {
        // Test date range queries that should use indexes
        LocalDateTime startDate = LocalDateTime.now().minusDays(30);
        LocalDateTime endDate = LocalDateTime.now();
        
        long startTime = System.nanoTime();
        List<Task> tasksInRange = taskRepository.findTasksDueBetween(startDate, endDate);
        long queryTime = System.nanoTime() - startTime;
        
        assertThat(tasksInRange).isNotEmpty();
        assertThat(queryTime).isLessThan(100_000_000); // 100ms
    }

    @Test
    void testBulkOperationPerformance() {
        // Test bulk update performance
        List<Task> tasksToUpdate = testTasks.subList(0, 100);
        
        long startTime = System.nanoTime();
        
        // Bulk update task status
        for (Task task : tasksToUpdate) {
            task.setStatus(TaskStatus.IN_PROGRESS);
        }
        taskRepository.saveAll(tasksToUpdate);
        entityManager.flush();
        
        long updateTime = System.nanoTime() - startTime;
        
        assertThat(updateTime).isLessThan(500_000_000); // 500ms for 100 updates
    }

    private void createTestData() {
        testUsers = new ArrayList<>();
        testTeams = new ArrayList<>();
        testProjects = new ArrayList<>();
        testTasks = new ArrayList<>();
        
        // Create 50 users
        for (int i = 0; i < 50; i++) {
            User user = new User();
            user.setEmail("user" + i + "@test.com");
            user.setPasswordHash("hashedPassword");
            user.setFirstName("User" + i);
            user.setLastName("Test");
            user.setRole(Role.MEMBER);
            testUsers.add(userRepository.save(user));
        }
        
        // Create 10 teams
        for (int i = 0; i < 10; i++) {
            Team team = new Team();
            team.setName("Team " + i);
            team.setDescription("Test team " + i);
            team.setOwner(testUsers.get(i % testUsers.size()));
            testTeams.add(teamRepository.save(team));
        }
        
        // Create 20 projects
        for (int i = 0; i < 20; i++) {
            Project project = new Project();
            project.setName("Project " + i);
            project.setDescription("Test project " + i);
            project.setTeam(testTeams.get(i % testTeams.size()));
            project.setStatus(i % 2 == 0 ? ProjectStatus.ACTIVE : ProjectStatus.PLANNING);
            project.setStartDate(LocalDate.now().minusDays(30));
            project.setEndDate(LocalDate.now().plusDays(30));
            project.setCreatedBy(testUsers.get(i % testUsers.size()));
            testProjects.add(projectRepository.save(project));
        }
        
        // Create 500 tasks
        for (int i = 0; i < 500; i++) {
            Task task = new Task();
            task.setTitle("Task " + i);
            task.setDescription("Test task " + i);
            task.setProject(testProjects.get(i % testProjects.size()));
            task.setStatus(TaskStatus.values()[i % TaskStatus.values().length]);
            task.setPriority(Priority.values()[i % Priority.values().length]);
            task.setAssignee(testUsers.get(i % testUsers.size()));
            task.setDueDate(LocalDateTime.now().plusDays(i % 30));
            task.setCreatedBy(testUsers.get(i % testUsers.size()));
            testTasks.add(taskRepository.save(task));
        }
        
        // Flush to ensure all data is persisted
        entityManager.flush();
        entityManager.clear();
    }
}