package com.taskmanagement.repository;

import com.taskmanagement.entity.Role;
import com.taskmanagement.entity.Team;
import com.taskmanagement.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Repository tests for TeamRepository
 */
@DataJpaTest
@TestPropertySource(properties = {
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class TeamRepositoryTest {
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private TeamRepository teamRepository;
    
    private User owner;
    private Team testTeam;
    
    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setEmail("owner@example.com");
        owner.setPasswordHash("hashedPassword");
        owner.setFirstName("Team");
        owner.setLastName("Owner");
        owner.setRole(Role.MANAGER);
        owner = entityManager.persistAndFlush(owner);
        
        testTeam = new Team();
        testTeam.setName("Development Team");
        testTeam.setDescription("A team for software development");
        testTeam.setOwner(owner);
    }
    
    @Test
    void testSaveAndFindById() {
        Team savedTeam = entityManager.persistAndFlush(testTeam);
        
        Optional<Team> foundTeam = teamRepository.findById(savedTeam.getId());
        
        assertTrue(foundTeam.isPresent());
        assertEquals(testTeam.getName(), foundTeam.get().getName());
        assertEquals(testTeam.getDescription(), foundTeam.get().getDescription());
        assertEquals(testTeam.getOwner().getId(), foundTeam.get().getOwner().getId());
    }
    
    @Test
    void testFindByName() {
        entityManager.persistAndFlush(testTeam);
        
        Optional<Team> foundTeam = teamRepository.findByName("Development Team");
        
        assertTrue(foundTeam.isPresent());
        assertEquals(testTeam.getName(), foundTeam.get().getName());
    }
    
    @Test
    void testFindByNameNotFound() {
        Optional<Team> foundTeam = teamRepository.findByName("Nonexistent Team");
        
        assertFalse(foundTeam.isPresent());
    }
    
    @Test
    void testExistsByName() {
        entityManager.persistAndFlush(testTeam);
        
        assertTrue(teamRepository.existsByName("Development Team"));
        assertFalse(teamRepository.existsByName("Nonexistent Team"));
    }
    
    @Test
    void testFindByOwner() {
        Team anotherTeam = new Team();
        anotherTeam.setName("QA Team");
        anotherTeam.setDescription("Quality Assurance team");
        anotherTeam.setOwner(owner);
        
        entityManager.persistAndFlush(testTeam);
        entityManager.persistAndFlush(anotherTeam);
        
        List<Team> teams = teamRepository.findByOwner(owner);
        
        assertEquals(2, teams.size());
        assertTrue(teams.stream().anyMatch(t -> t.getName().equals("Development Team")));
        assertTrue(teams.stream().anyMatch(t -> t.getName().equals("QA Team")));
    }
    
    @Test
    void testFindByOwnerId() {
        entityManager.persistAndFlush(testTeam);
        
        List<Team> teams = teamRepository.findByOwnerId(owner.getId());
        
        assertEquals(1, teams.size());
        assertEquals("Development Team", teams.get(0).getName());
    }
    
    @Test
    void testFindByNameContainingIgnoreCase() {
        Team qaTeam = new Team();
        qaTeam.setName("QA Team");
        qaTeam.setDescription("Quality Assurance team");
        qaTeam.setOwner(owner);
        
        entityManager.persistAndFlush(testTeam);
        entityManager.persistAndFlush(qaTeam);
        
        List<Team> teams = teamRepository.findByNameContainingIgnoreCase("team");
        
        assertEquals(2, teams.size());
        
        List<Team> devTeams = teamRepository.findByNameContainingIgnoreCase("development");
        assertEquals(1, devTeams.size());
        assertEquals("Development Team", devTeams.get(0).getName());
    }
    
    @Test
    void testFindTeamsByUserId() {
        entityManager.persistAndFlush(testTeam);
        
        List<Team> teams = teamRepository.findTeamsByUserId(owner.getId());
        
        assertEquals(1, teams.size());
        assertEquals("Development Team", teams.get(0).getName());
    }
    
    @Test
    void testCountByOwnerId() {
        Team anotherTeam = new Team();
        anotherTeam.setName("QA Team");
        anotherTeam.setDescription("Quality Assurance team");
        anotherTeam.setOwner(owner);
        
        entityManager.persistAndFlush(testTeam);
        entityManager.persistAndFlush(anotherTeam);
        
        long count = teamRepository.countByOwnerId(owner.getId());
        
        assertEquals(2, count);
    }
    
    @Test
    void testUniqueNameConstraint() {
        entityManager.persistAndFlush(testTeam);
        
        Team duplicateTeam = new Team();
        duplicateTeam.setName("Development Team"); // Same name
        duplicateTeam.setDescription("Another development team");
        duplicateTeam.setOwner(owner);
        
        assertThrows(Exception.class, () -> {
            entityManager.persistAndFlush(duplicateTeam);
        });
    }
    
    @Test
    void testCascadeDeleteWithOwner() {
        Team savedTeam = entityManager.persistAndFlush(testTeam);
        
        // Verify team exists
        assertTrue(teamRepository.findById(savedTeam.getId()).isPresent());
        
        // Delete owner (this should cascade to team due to foreign key constraint)
        entityManager.remove(owner);
        entityManager.flush();
        
        // Team should be deleted due to cascade
        assertFalse(teamRepository.findById(savedTeam.getId()).isPresent());
    }
    
    @Test
    void testTeamWithDifferentOwners() {
        User anotherOwner = new User();
        anotherOwner.setEmail("another@example.com");
        anotherOwner.setPasswordHash("hashedPassword");
        anotherOwner.setFirstName("Another");
        anotherOwner.setLastName("Owner");
        anotherOwner.setRole(Role.MANAGER);
        anotherOwner = entityManager.persistAndFlush(anotherOwner);
        
        Team anotherTeam = new Team();
        anotherTeam.setName("Marketing Team");
        anotherTeam.setDescription("Marketing team");
        anotherTeam.setOwner(anotherOwner);
        
        entityManager.persistAndFlush(testTeam);
        entityManager.persistAndFlush(anotherTeam);
        
        List<Team> ownerTeams = teamRepository.findByOwner(owner);
        List<Team> anotherOwnerTeams = teamRepository.findByOwner(anotherOwner);
        
        assertEquals(1, ownerTeams.size());
        assertEquals(1, anotherOwnerTeams.size());
        assertEquals("Development Team", ownerTeams.get(0).getName());
        assertEquals("Marketing Team", anotherOwnerTeams.get(0).getName());
    }
}