package com.taskmanagement.repository;

import com.taskmanagement.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Repository tests for ProjectRepository
 */
@DataJpaTest
@TestPropertySource(properties = {
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class ProjectRepositoryTest {
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private ProjectRepository projectRepository;
    
    private User owner;
    private Team team;
    private Project testProject;
    
    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setEmail("owner@example.com");
        owner.setPasswordHash("hashedPassword");
        owner.setFirstName("Team");
        owner.setLastName("Owner");
        owner.setRole(Role.MANAGER);
        owner = entityManager.persistAndFlush(owner);
        
        team = new Team();
        team.setName("Development Team");
        team.setDescription("A team for software development");
        team.setOwner(owner);
        team = entityManager.persistAndFlush(team);
        
        testProject = new Project();
        testProject.setTeam(team);
        testProject.setName("Web Application");
        testProject.setDescription("A web application project");
        testProject.setStatus(ProjectStatus.ACTIVE);
        testProject.setStartDate(LocalDate.now());
        testProject.setEndDate(LocalDate.now().plusDays(30));
        testProject.setCreatedBy(owner);
    }
    
    @Test
    void testSaveAndFindById() {
        Project savedProject = entityManager.persistAndFlush(testProject);
        
        Optional<Project> foundProject = projectRepository.findById(savedProject.getId());
        
        assertTrue(foundProject.isPresent());
        assertEquals(testProject.getName(), foundProject.get().getName());
        assertEquals(testProject.getDescription(), foundProject.get().getDescription());
        assertEquals(testProject.getStatus(), foundProject.get().getStatus());
        assertEquals(testProject.getTeam().getId(), foundProject.get().getTeam().getId());
    }
    
    @Test
    void testFindByTeam() {
        Project anotherProject = new Project();
        anotherProject.setTeam(team);
        anotherProject.setName("Mobile App");
        anotherProject.setDescription("A mobile application project");
        anotherProject.setStatus(ProjectStatus.PLANNING);
        anotherProject.setCreatedBy(owner);
        
        entityManager.persistAndFlush(testProject);
        entityManager.persistAndFlush(anotherProject);
        
        List<Project> projects = projectRepository.findByTeam(team);
        
        assertEquals(2, projects.size());
        assertTrue(projects.stream().anyMatch(p -> p.getName().equals("Web Application")));
        assertTrue(projects.stream().anyMatch(p -> p.getName().equals("Mobile App")));
    }
    
    @Test
    void testFindByTeamId() {
        entityManager.persistAndFlush(testProject);
        
        List<Project> projects = projectRepository.findByTeamId(team.getId());
        
        assertEquals(1, projects.size());
        assertEquals("Web Application", projects.get(0).getName());
    }
    
    @Test
    void testFindByStatus() {
        Project planningProject = new Project();
        planningProject.setTeam(team);
        planningProject.setName("Planning Project");
        planningProject.setDescription("A project in planning");
        planningProject.setStatus(ProjectStatus.PLANNING);
        planningProject.setCreatedBy(owner);
        
        entityManager.persistAndFlush(testProject);
        entityManager.persistAndFlush(planningProject);
        
        List<Project> activeProjects = projectRepository.findByStatus(ProjectStatus.ACTIVE);
        List<Project> planningProjects = projectRepository.findByStatus(ProjectStatus.PLANNING);
        
        assertEquals(1, activeProjects.size());
        assertEquals(1, planningProjects.size());
        assertEquals("Web Application", activeProjects.get(0).getName());
        assertEquals("Planning Project", planningProjects.get(0).getName());
    }
    
    @Test
    void testFindByTeamAndStatus() {
        Project planningProject = new Project();
        planningProject.setTeam(team);
        planningProject.setName("Planning Project");
        planningProject.setDescription("A project in planning");
        planningProject.setStatus(ProjectStatus.PLANNING);
        planningProject.setCreatedBy(owner);
        
        entityManager.persistAndFlush(testProject);
        entityManager.persistAndFlush(planningProject);
        
        List<Project> activeProjects = projectRepository.findByTeamAndStatus(team, ProjectStatus.ACTIVE);
        
        assertEquals(1, activeProjects.size());
        assertEquals("Web Application", activeProjects.get(0).getName());
    }
    
    @Test
    void testFindByCreatedBy() {
        entityManager.persistAndFlush(testProject);
        
        List<Project> projects = projectRepository.findByCreatedBy(owner);
        
        assertEquals(1, projects.size());
        assertEquals("Web Application", projects.get(0).getName());
    }
    
    @Test
    void testFindByNameContainingIgnoreCase() {
        Project mobileProject = new Project();
        mobileProject.setTeam(team);
        mobileProject.setName("Mobile Application");
        mobileProject.setDescription("A mobile app");
        mobileProject.setStatus(ProjectStatus.PLANNING);
        mobileProject.setCreatedBy(owner);
        
        entityManager.persistAndFlush(testProject);
        entityManager.persistAndFlush(mobileProject);
        
        List<Project> appProjects = projectRepository.findByNameContainingIgnoreCase("application");
        
        assertEquals(2, appProjects.size());
        
        List<Project> webProjects = projectRepository.findByNameContainingIgnoreCase("web");
        assertEquals(1, webProjects.size());
        assertEquals("Web Application", webProjects.get(0).getName());
    }
    
    @Test
    void testFindByTeamAndNameContainingIgnoreCase() {
        entityManager.persistAndFlush(testProject);
        
        List<Project> projects = projectRepository.findByTeamAndNameContainingIgnoreCase(team, "web");
        
        assertEquals(1, projects.size());
        assertEquals("Web Application", projects.get(0).getName());
    }
    
    @Test
    void testFindOverdueProjects() {
        Project overdueProject = new Project();
        overdueProject.setTeam(team);
        overdueProject.setName("Overdue Project");
        overdueProject.setDescription("An overdue project");
        overdueProject.setStatus(ProjectStatus.ACTIVE);
        overdueProject.setStartDate(LocalDate.now().minusDays(60));
        overdueProject.setEndDate(LocalDate.now().minusDays(10)); // Past end date
        overdueProject.setCreatedBy(owner);
        
        entityManager.persistAndFlush(testProject);
        entityManager.persistAndFlush(overdueProject);
        
        List<Project> overdueProjects = projectRepository.findOverdueProjects(LocalDate.now());
        
        assertEquals(1, overdueProjects.size());
        assertEquals("Overdue Project", overdueProjects.get(0).getName());
    }
    
    @Test
    void testFindProjectsEndingBetween() {
        LocalDate startRange = LocalDate.now().plusDays(25);
        LocalDate endRange = LocalDate.now().plusDays(35);
        
        entityManager.persistAndFlush(testProject);
        
        List<Project> projects = projectRepository.findProjectsEndingBetween(startRange, endRange);
        
        assertEquals(1, projects.size());
        assertEquals("Web Application", projects.get(0).getName());
    }
    
    @Test
    void testFindActiveProjectsByTeamId() {
        Project planningProject = new Project();
        planningProject.setTeam(team);
        planningProject.setName("Planning Project");
        planningProject.setDescription("A project in planning");
        planningProject.setStatus(ProjectStatus.PLANNING);
        planningProject.setCreatedBy(owner);
        
        entityManager.persistAndFlush(testProject);
        entityManager.persistAndFlush(planningProject);
        
        List<Project> activeProjects = projectRepository.findActiveProjectsByTeamId(team.getId());
        
        assertEquals(1, activeProjects.size());
        assertEquals("Web Application", activeProjects.get(0).getName());
    }
    
    @Test
    void testCountByTeamAndStatus() {
        Project planningProject = new Project();
        planningProject.setTeam(team);
        planningProject.setName("Planning Project");
        planningProject.setDescription("A project in planning");
        planningProject.setStatus(ProjectStatus.PLANNING);
        planningProject.setCreatedBy(owner);
        
        entityManager.persistAndFlush(testProject);
        entityManager.persistAndFlush(planningProject);
        
        long activeCount = projectRepository.countByTeamAndStatus(team, ProjectStatus.ACTIVE);
        long planningCount = projectRepository.countByTeamAndStatus(team, ProjectStatus.PLANNING);
        
        assertEquals(1, activeCount);
        assertEquals(1, planningCount);
    }
    
    @Test
    void testExistsByTeamAndName() {
        entityManager.persistAndFlush(testProject);
        
        assertTrue(projectRepository.existsByTeamAndName(team, "Web Application"));
        assertFalse(projectRepository.existsByTeamAndName(team, "Nonexistent Project"));
    }
    
    @Test
    void testCascadeDeleteWithTeam() {
        Project savedProject = entityManager.persistAndFlush(testProject);
        
        // Verify project exists
        assertTrue(projectRepository.findById(savedProject.getId()).isPresent());
        
        // Delete team (this should cascade to project)
        entityManager.remove(team);
        entityManager.flush();
        
        // Project should be deleted due to cascade
        assertFalse(projectRepository.findById(savedProject.getId()).isPresent());
    }
}