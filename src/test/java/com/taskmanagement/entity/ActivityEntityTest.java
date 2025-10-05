package com.taskmanagement.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ActivityEntityTest {

    private User testUser;
    private UUID testEntityId;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setRole(Role.MEMBER);

        testEntityId = UUID.randomUUID();
    }

    @Test
    void constructor_WithRequiredFields_ShouldCreateActivity() {
        // When
        Activity activity = new Activity(testUser, "Task", testEntityId, "CREATE");

        // Then
        assertThat(activity.getUser()).isEqualTo(testUser);
        assertThat(activity.getEntityType()).isEqualTo("Task");
        assertThat(activity.getEntityId()).isEqualTo(testEntityId);
        assertThat(activity.getAction()).isEqualTo("CREATE");
    }

    @Test
    void constructor_WithAllFields_ShouldCreateActivity() {
        // Given
        String details = "Task created successfully";
        String oldValues = "{\"status\":\"TODO\"}";
        String newValues = "{\"status\":\"IN_PROGRESS\"}";

        // When
        Activity activity = new Activity(testUser, "Task", testEntityId, "UPDATE", details, oldValues, newValues);

        // Then
        assertThat(activity.getUser()).isEqualTo(testUser);
        assertThat(activity.getEntityType()).isEqualTo("Task");
        assertThat(activity.getEntityId()).isEqualTo(testEntityId);
        assertThat(activity.getAction()).isEqualTo("UPDATE");
        assertThat(activity.getDetails()).isEqualTo(details);
        assertThat(activity.getOldValues()).isEqualTo(oldValues);
        assertThat(activity.getNewValues()).isEqualTo(newValues);
    }

    @Test
    void setters_ShouldUpdateFields() {
        // Given
        Activity activity = new Activity();
        LocalDateTime timestamp = LocalDateTime.now();

        // When
        activity.setUser(testUser);
        activity.setEntityType("Project");
        activity.setEntityId(testEntityId);
        activity.setAction("DELETE");
        activity.setDetails("Project deleted");
        activity.setOldValues("{\"name\":\"Old Project\"}");
        activity.setNewValues(null);
        activity.setTimestamp(timestamp);

        // Then
        assertThat(activity.getUser()).isEqualTo(testUser);
        assertThat(activity.getEntityType()).isEqualTo("Project");
        assertThat(activity.getEntityId()).isEqualTo(testEntityId);
        assertThat(activity.getAction()).isEqualTo("DELETE");
        assertThat(activity.getDetails()).isEqualTo("Project deleted");
        assertThat(activity.getOldValues()).isEqualTo("{\"name\":\"Old Project\"}");
        assertThat(activity.getNewValues()).isNull();
        assertThat(activity.getTimestamp()).isEqualTo(timestamp);
    }

    @Test
    void equals_WithSameId_ShouldReturnTrue() {
        // Given
        UUID activityId = UUID.randomUUID();
        Activity activity1 = new Activity(testUser, "Task", testEntityId, "CREATE");
        activity1.setId(activityId);
        Activity activity2 = new Activity(testUser, "Task", testEntityId, "CREATE");
        activity2.setId(activityId);

        // When & Then
        assertThat(activity1).isEqualTo(activity2);
        assertThat(activity1.hashCode()).isEqualTo(activity2.hashCode());
    }

    @Test
    void equals_WithDifferentId_ShouldReturnFalse() {
        // Given
        Activity activity1 = new Activity(testUser, "Task", testEntityId, "CREATE");
        activity1.setId(UUID.randomUUID());
        Activity activity2 = new Activity(testUser, "Task", testEntityId, "CREATE");
        activity2.setId(UUID.randomUUID());

        // When & Then
        assertThat(activity1).isNotEqualTo(activity2);
    }

    @Test
    void equals_WithNullId_ShouldReturnFalse() {
        // Given
        Activity activity1 = new Activity(testUser, "Task", testEntityId, "CREATE");
        Activity activity2 = new Activity(testUser, "Task", testEntityId, "CREATE");

        // When & Then
        assertThat(activity1).isNotEqualTo(activity2);
    }

    @Test
    void toString_ShouldContainKeyFields() {
        // Given
        Activity activity = new Activity(testUser, "Task", testEntityId, "CREATE");
        activity.setId(UUID.randomUUID());
        activity.setTimestamp(LocalDateTime.now());

        // When
        String result = activity.toString();

        // Then
        assertThat(result).contains("Activity{");
        assertThat(result).contains("entityType='Task'");
        assertThat(result).contains("action='CREATE'");
        assertThat(result).contains("entityId=" + testEntityId);
    }
}