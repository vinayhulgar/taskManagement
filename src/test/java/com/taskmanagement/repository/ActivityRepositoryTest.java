package com.taskmanagement.repository;

import com.taskmanagement.entity.Activity;
import com.taskmanagement.entity.Role;
import com.taskmanagement.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ActivityRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ActivityRepository activityRepository;

    private User testUser;
    private UUID testEntityId;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setEmail("test@example.com");
        testUser.setPasswordHash("hashedPassword");
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setRole(Role.MEMBER);
        testUser = entityManager.persistAndFlush(testUser);

        testEntityId = UUID.randomUUID();
    }

    @Test
    void findByUserOrderByTimestampDesc_ShouldReturnActivitiesForUser() {
        // Given
        Activity activity1 = new Activity(testUser, "Task", testEntityId, "CREATE");
        Activity activity2 = new Activity(testUser, "Task", testEntityId, "UPDATE");
        entityManager.persistAndFlush(activity1);
        entityManager.persistAndFlush(activity2);

        Pageable pageable = PageRequest.of(0, 10);

        // When
        Page<Activity> result = activityRepository.findByUserOrderByTimestampDesc(testUser, pageable);

        // Then
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getTimestamp())
            .isAfterOrEqualTo(result.getContent().get(1).getTimestamp());
    }

    @Test
    void findByEntityTypeAndEntityIdOrderByTimestampDesc_ShouldReturnActivitiesForEntity() {
        // Given
        Activity activity1 = new Activity(testUser, "Task", testEntityId, "CREATE");
        Activity activity2 = new Activity(testUser, "Task", testEntityId, "UPDATE");
        Activity activity3 = new Activity(testUser, "Project", UUID.randomUUID(), "CREATE");
        entityManager.persistAndFlush(activity1);
        entityManager.persistAndFlush(activity2);
        entityManager.persistAndFlush(activity3);

        // When
        List<Activity> result = activityRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc("Task", testEntityId);

        // Then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getEntityType()).isEqualTo("Task");
        assertThat(result.get(0).getEntityId()).isEqualTo(testEntityId);
    }

    @Test
    void findByEntityTypeOrderByTimestampDesc_ShouldReturnActivitiesForEntityType() {
        // Given
        Activity activity1 = new Activity(testUser, "Task", testEntityId, "CREATE");
        Activity activity2 = new Activity(testUser, "Task", UUID.randomUUID(), "UPDATE");
        Activity activity3 = new Activity(testUser, "Project", UUID.randomUUID(), "CREATE");
        entityManager.persistAndFlush(activity1);
        entityManager.persistAndFlush(activity2);
        entityManager.persistAndFlush(activity3);

        Pageable pageable = PageRequest.of(0, 10);

        // When
        Page<Activity> result = activityRepository.findByEntityTypeOrderByTimestampDesc("Task", pageable);

        // Then
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent()).allMatch(activity -> activity.getEntityType().equals("Task"));
    }

    @Test
    void findByActionOrderByTimestampDesc_ShouldReturnActivitiesForAction() {
        // Given
        Activity activity1 = new Activity(testUser, "Task", testEntityId, "CREATE");
        Activity activity2 = new Activity(testUser, "Project", UUID.randomUUID(), "CREATE");
        Activity activity3 = new Activity(testUser, "Task", testEntityId, "UPDATE");
        entityManager.persistAndFlush(activity1);
        entityManager.persistAndFlush(activity2);
        entityManager.persistAndFlush(activity3);

        Pageable pageable = PageRequest.of(0, 10);

        // When
        Page<Activity> result = activityRepository.findByActionOrderByTimestampDesc("CREATE", pageable);

        // Then
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent()).allMatch(activity -> activity.getAction().equals("CREATE"));
    }

    @Test
    void findByTimestampBetween_ShouldReturnActivitiesInDateRange() {
        // Given
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate = now.minusHours(2);
        LocalDateTime endDate = now.plusHours(2);

        Activity activity1 = new Activity(testUser, "Task", testEntityId, "CREATE");
        Activity activity2 = new Activity(testUser, "Task", testEntityId, "UPDATE");
        entityManager.persistAndFlush(activity1);
        entityManager.persistAndFlush(activity2);

        Pageable pageable = PageRequest.of(0, 10);

        // When
        Page<Activity> result = activityRepository.findByTimestampBetween(startDate, endDate, pageable);

        // Then
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent()).allMatch(activity -> 
            activity.getTimestamp().isAfter(startDate) && activity.getTimestamp().isBefore(endDate));
    }

    @Test
    void findByUserAndEntityType_ShouldReturnActivitiesForUserAndEntityType() {
        // Given
        Activity activity1 = new Activity(testUser, "Task", testEntityId, "CREATE");
        Activity activity2 = new Activity(testUser, "Task", UUID.randomUUID(), "UPDATE");
        Activity activity3 = new Activity(testUser, "Project", UUID.randomUUID(), "CREATE");
        entityManager.persistAndFlush(activity1);
        entityManager.persistAndFlush(activity2);
        entityManager.persistAndFlush(activity3);

        Pageable pageable = PageRequest.of(0, 10);

        // When
        Page<Activity> result = activityRepository.findByUserAndEntityType(testUser, "Task", pageable);

        // Then
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent()).allMatch(activity -> 
            activity.getUser().equals(testUser) && activity.getEntityType().equals("Task"));
    }

    @Test
    void countByUser_ShouldReturnCorrectCount() {
        // Given
        Activity activity1 = new Activity(testUser, "Task", testEntityId, "CREATE");
        Activity activity2 = new Activity(testUser, "Task", testEntityId, "UPDATE");
        entityManager.persistAndFlush(activity1);
        entityManager.persistAndFlush(activity2);

        // When
        long count = activityRepository.countByUser(testUser);

        // Then
        assertThat(count).isEqualTo(2);
    }

    @Test
    void countByEntityTypeAndEntityId_ShouldReturnCorrectCount() {
        // Given
        Activity activity1 = new Activity(testUser, "Task", testEntityId, "CREATE");
        Activity activity2 = new Activity(testUser, "Task", testEntityId, "UPDATE");
        Activity activity3 = new Activity(testUser, "Task", UUID.randomUUID(), "CREATE");
        entityManager.persistAndFlush(activity1);
        entityManager.persistAndFlush(activity2);
        entityManager.persistAndFlush(activity3);

        // When
        long count = activityRepository.countByEntityTypeAndEntityId("Task", testEntityId);

        // Then
        assertThat(count).isEqualTo(2);
    }
}