package com.taskmanagement.repository;

import com.taskmanagement.entity.Role;
import com.taskmanagement.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Repository tests for UserRepository
 */
@DataJpaTest
@TestPropertySource(properties = {
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class UserRepositoryTest {
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private UserRepository userRepository;
    
    private User testUser;
    
    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setEmail("test@example.com");
        testUser.setPasswordHash("hashedPassword123");
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setRole(Role.MEMBER);
        testUser.setLastLogin(LocalDateTime.now().minusDays(1));
    }
    
    @Test
    void testSaveAndFindById() {
        User savedUser = entityManager.persistAndFlush(testUser);
        
        Optional<User> foundUser = userRepository.findById(savedUser.getId());
        
        assertTrue(foundUser.isPresent());
        assertEquals(testUser.getEmail(), foundUser.get().getEmail());
        assertEquals(testUser.getFirstName(), foundUser.get().getFirstName());
        assertEquals(testUser.getLastName(), foundUser.get().getLastName());
        assertEquals(testUser.getRole(), foundUser.get().getRole());
    }
    
    @Test
    void testFindByEmail() {
        entityManager.persistAndFlush(testUser);
        
        Optional<User> foundUser = userRepository.findByEmail("test@example.com");
        
        assertTrue(foundUser.isPresent());
        assertEquals(testUser.getEmail(), foundUser.get().getEmail());
    }
    
    @Test
    void testFindByEmailNotFound() {
        Optional<User> foundUser = userRepository.findByEmail("nonexistent@example.com");
        
        assertFalse(foundUser.isPresent());
    }
    
    @Test
    void testExistsByEmail() {
        entityManager.persistAndFlush(testUser);
        
        assertTrue(userRepository.existsByEmail("test@example.com"));
        assertFalse(userRepository.existsByEmail("nonexistent@example.com"));
    }
    
    @Test
    void testFindByRole() {
        User adminUser = new User();
        adminUser.setEmail("admin@example.com");
        adminUser.setPasswordHash("hashedPassword");
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        adminUser.setRole(Role.ADMIN);
        
        entityManager.persistAndFlush(testUser);
        entityManager.persistAndFlush(adminUser);
        
        List<User> members = userRepository.findByRole(Role.MEMBER);
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        
        assertEquals(1, members.size());
        assertEquals(1, admins.size());
        assertEquals("test@example.com", members.get(0).getEmail());
        assertEquals("admin@example.com", admins.get(0).getEmail());
    }
    
    @Test
    void testFindByFirstNameAndLastNameContainingIgnoreCase() {
        User user2 = new User();
        user2.setEmail("jane@example.com");
        user2.setPasswordHash("hashedPassword");
        user2.setFirstName("Jane");
        user2.setLastName("Smith");
        user2.setRole(Role.MEMBER);
        
        entityManager.persistAndFlush(testUser);
        entityManager.persistAndFlush(user2);
        
        List<User> users = userRepository.findByFirstNameAndLastNameContainingIgnoreCase("john", "doe");
        
        assertEquals(1, users.size());
        assertEquals("test@example.com", users.get(0).getEmail());
    }
    
    @Test
    void testFindUsersNotLoggedInSince() {
        User recentUser = new User();
        recentUser.setEmail("recent@example.com");
        recentUser.setPasswordHash("hashedPassword");
        recentUser.setFirstName("Recent");
        recentUser.setLastName("User");
        recentUser.setRole(Role.MEMBER);
        recentUser.setLastLogin(LocalDateTime.now().minusHours(1));
        
        User oldUser = new User();
        oldUser.setEmail("old@example.com");
        oldUser.setPasswordHash("hashedPassword");
        oldUser.setFirstName("Old");
        oldUser.setLastName("User");
        oldUser.setRole(Role.MEMBER);
        oldUser.setLastLogin(LocalDateTime.now().minusDays(10));
        
        entityManager.persistAndFlush(recentUser);
        entityManager.persistAndFlush(oldUser);
        
        List<User> oldUsers = userRepository.findUsersNotLoggedInSince(LocalDateTime.now().minusDays(5));
        
        assertEquals(1, oldUsers.size());
        assertEquals("old@example.com", oldUsers.get(0).getEmail());
    }
    
    @Test
    void testFindUsersCreatedBetween() {
        LocalDateTime startDate = LocalDateTime.now().minusDays(2);
        LocalDateTime endDate = LocalDateTime.now();
        
        entityManager.persistAndFlush(testUser);
        
        List<User> users = userRepository.findUsersCreatedBetween(startDate, endDate);
        
        assertEquals(1, users.size());
        assertEquals("test@example.com", users.get(0).getEmail());
    }
    
    @Test
    void testCountByRole() {
        User adminUser = new User();
        adminUser.setEmail("admin@example.com");
        adminUser.setPasswordHash("hashedPassword");
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        adminUser.setRole(Role.ADMIN);
        
        User managerUser = new User();
        managerUser.setEmail("manager@example.com");
        managerUser.setPasswordHash("hashedPassword");
        managerUser.setFirstName("Manager");
        managerUser.setLastName("User");
        managerUser.setRole(Role.MANAGER);
        
        entityManager.persistAndFlush(testUser);
        entityManager.persistAndFlush(adminUser);
        entityManager.persistAndFlush(managerUser);
        
        assertEquals(1, userRepository.countByRole(Role.MEMBER));
        assertEquals(1, userRepository.countByRole(Role.ADMIN));
        assertEquals(1, userRepository.countByRole(Role.MANAGER));
    }
    
    @Test
    void testUniqueEmailConstraint() {
        entityManager.persistAndFlush(testUser);
        
        User duplicateUser = new User();
        duplicateUser.setEmail("test@example.com"); // Same email
        duplicateUser.setPasswordHash("hashedPassword");
        duplicateUser.setFirstName("Jane");
        duplicateUser.setLastName("Smith");
        duplicateUser.setRole(Role.MEMBER);
        
        assertThrows(Exception.class, () -> {
            entityManager.persistAndFlush(duplicateUser);
        });
    }
}