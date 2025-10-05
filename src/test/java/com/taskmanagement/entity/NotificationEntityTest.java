package com.taskmanagement.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationEntityTest {

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
    void constructor_WithRequiredFields_ShouldCreateNotification() {
        // When
        Notification notification = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");

        // Then
        assertThat(notification.getUser()).isEqualTo(testUser);
        assertThat(notification.getType()).isEqualTo("TASK_ASSIGNED");
        assertThat(notification.getTitle()).isEqualTo("Task Assigned");
        assertThat(notification.getMessage()).isEqualTo("You have been assigned to a task");
        assertThat(notification.isRead()).isFalse();
    }

    @Test
    void constructor_WithEntityReference_ShouldCreateNotification() {
        // When
        Notification notification = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", 
            "You have been assigned to a task", "Task", testEntityId);

        // Then
        assertThat(notification.getUser()).isEqualTo(testUser);
        assertThat(notification.getType()).isEqualTo("TASK_ASSIGNED");
        assertThat(notification.getTitle()).isEqualTo("Task Assigned");
        assertThat(notification.getMessage()).isEqualTo("You have been assigned to a task");
        assertThat(notification.getEntityType()).isEqualTo("Task");
        assertThat(notification.getEntityId()).isEqualTo(testEntityId);
        assertThat(notification.isRead()).isFalse();
    }

    @Test
    void setRead_ToTrue_ShouldSetReadAtTimestamp() {
        // Given
        Notification notification = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");
        LocalDateTime beforeRead = LocalDateTime.now();

        // When
        notification.setRead(true);

        // Then
        assertThat(notification.isRead()).isTrue();
        assertThat(notification.getReadAt()).isNotNull();
        assertThat(notification.getReadAt()).isAfterOrEqualTo(beforeRead);
    }

    @Test
    void setRead_ToFalse_ShouldClearReadAtTimestamp() {
        // Given
        Notification notification = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");
        notification.setRead(true);
        assertThat(notification.getReadAt()).isNotNull();

        // When
        notification.setRead(false);

        // Then
        assertThat(notification.isRead()).isFalse();
        assertThat(notification.getReadAt()).isNull();
    }

    @Test
    void setRead_ToTrueWhenAlreadyRead_ShouldNotChangeReadAtTimestamp() {
        // Given
        Notification notification = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");
        LocalDateTime originalReadAt = LocalDateTime.now().minusMinutes(5);
        notification.setRead(true);
        notification.setReadAt(originalReadAt);

        // When
        notification.setRead(true);

        // Then
        assertThat(notification.isRead()).isTrue();
        assertThat(notification.getReadAt()).isEqualTo(originalReadAt);
    }

    @Test
    void setters_ShouldUpdateFields() {
        // Given
        Notification notification = new Notification();
        LocalDateTime createdAt = LocalDateTime.now();
        LocalDateTime readAt = LocalDateTime.now().plusMinutes(5);

        // When
        notification.setUser(testUser);
        notification.setType("TASK_COMMENT");
        notification.setTitle("New Comment");
        notification.setMessage("New comment on your task");
        notification.setEntityType("Task");
        notification.setEntityId(testEntityId);
        notification.setRead(true);
        notification.setReadAt(readAt);
        notification.setCreatedAt(createdAt);

        // Then
        assertThat(notification.getUser()).isEqualTo(testUser);
        assertThat(notification.getType()).isEqualTo("TASK_COMMENT");
        assertThat(notification.getTitle()).isEqualTo("New Comment");
        assertThat(notification.getMessage()).isEqualTo("New comment on your task");
        assertThat(notification.getEntityType()).isEqualTo("Task");
        assertThat(notification.getEntityId()).isEqualTo(testEntityId);
        assertThat(notification.isRead()).isTrue();
        assertThat(notification.getReadAt()).isEqualTo(readAt);
        assertThat(notification.getCreatedAt()).isEqualTo(createdAt);
    }

    @Test
    void equals_WithSameId_ShouldReturnTrue() {
        // Given
        UUID notificationId = UUID.randomUUID();
        Notification notification1 = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");
        notification1.setId(notificationId);
        Notification notification2 = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");
        notification2.setId(notificationId);

        // When & Then
        assertThat(notification1).isEqualTo(notification2);
        assertThat(notification1.hashCode()).isEqualTo(notification2.hashCode());
    }

    @Test
    void equals_WithDifferentId_ShouldReturnFalse() {
        // Given
        Notification notification1 = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");
        notification1.setId(UUID.randomUUID());
        Notification notification2 = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");
        notification2.setId(UUID.randomUUID());

        // When & Then
        assertThat(notification1).isNotEqualTo(notification2);
    }

    @Test
    void equals_WithNullId_ShouldReturnFalse() {
        // Given
        Notification notification1 = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");
        Notification notification2 = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");

        // When & Then
        assertThat(notification1).isNotEqualTo(notification2);
    }

    @Test
    void toString_ShouldContainKeyFields() {
        // Given
        Notification notification = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");
        notification.setId(UUID.randomUUID());
        notification.setCreatedAt(LocalDateTime.now());

        // When
        String result = notification.toString();

        // Then
        assertThat(result).contains("Notification{");
        assertThat(result).contains("type='TASK_ASSIGNED'");
        assertThat(result).contains("title='Task Assigned'");
        assertThat(result).contains("isRead=false");
    }
}