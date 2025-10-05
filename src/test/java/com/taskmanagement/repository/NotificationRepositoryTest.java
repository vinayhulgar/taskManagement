package com.taskmanagement.repository;

import com.taskmanagement.entity.Notification;
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
class NotificationRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private NotificationRepository notificationRepository;

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
    void findByUserOrderByCreatedAtDesc_ShouldReturnNotificationsForUser() {
        // Given
        Notification notification1 = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");
        Notification notification2 = new Notification(testUser, "TASK_COMMENT", "New Comment", "New comment on your task");
        entityManager.persistAndFlush(notification1);
        entityManager.persistAndFlush(notification2);

        Pageable pageable = PageRequest.of(0, 10);

        // When
        Page<Notification> result = notificationRepository.findByUserOrderByCreatedAtDesc(testUser, pageable);

        // Then
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getCreatedAt())
            .isAfterOrEqualTo(result.getContent().get(1).getCreatedAt());
    }

    @Test
    void findByUserAndIsReadFalseOrderByCreatedAtDesc_ShouldReturnUnreadNotifications() {
        // Given
        Notification unreadNotification = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");
        Notification readNotification = new Notification(testUser, "TASK_COMMENT", "New Comment", "New comment on your task");
        readNotification.setRead(true);
        
        entityManager.persistAndFlush(unreadNotification);
        entityManager.persistAndFlush(readNotification);

        // When
        List<Notification> result = notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(testUser);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).isRead()).isFalse();
        assertThat(result.get(0).getType()).isEqualTo("TASK_ASSIGNED");
    }

    @Test
    void findByUserAndIsReadOrderByCreatedAtDesc_ShouldReturnNotificationsByReadStatus() {
        // Given
        Notification unreadNotification = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");
        Notification readNotification = new Notification(testUser, "TASK_COMMENT", "New Comment", "New comment on your task");
        readNotification.setRead(true);
        
        entityManager.persistAndFlush(unreadNotification);
        entityManager.persistAndFlush(readNotification);

        Pageable pageable = PageRequest.of(0, 10);

        // When - Find read notifications
        Page<Notification> readResult = notificationRepository.findByUserAndIsReadOrderByCreatedAtDesc(testUser, true, pageable);
        
        // When - Find unread notifications
        Page<Notification> unreadResult = notificationRepository.findByUserAndIsReadOrderByCreatedAtDesc(testUser, false, pageable);

        // Then
        assertThat(readResult.getContent()).hasSize(1);
        assertThat(readResult.getContent().get(0).isRead()).isTrue();
        
        assertThat(unreadResult.getContent()).hasSize(1);
        assertThat(unreadResult.getContent().get(0).isRead()).isFalse();
    }

    @Test
    void findByUserAndTypeOrderByCreatedAtDesc_ShouldReturnNotificationsByType() {
        // Given
        Notification taskNotification = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");
        Notification commentNotification = new Notification(testUser, "TASK_COMMENT", "New Comment", "New comment on your task");
        Notification mentionNotification = new Notification(testUser, "MENTION", "You were mentioned", "You were mentioned in a comment");
        
        entityManager.persistAndFlush(taskNotification);
        entityManager.persistAndFlush(commentNotification);
        entityManager.persistAndFlush(mentionNotification);

        Pageable pageable = PageRequest.of(0, 10);

        // When
        Page<Notification> result = notificationRepository.findByUserAndTypeOrderByCreatedAtDesc(testUser, "TASK_ASSIGNED", pageable);

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getType()).isEqualTo("TASK_ASSIGNED");
    }

    @Test
    void findByEntityTypeAndEntityIdOrderByCreatedAtDesc_ShouldReturnNotificationsForEntity() {
        // Given
        Notification notification1 = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task", "Task", testEntityId);
        Notification notification2 = new Notification(testUser, "TASK_COMMENT", "New Comment", "New comment on your task", "Task", testEntityId);
        Notification notification3 = new Notification(testUser, "PROJECT_ASSIGNED", "Project Assigned", "You have been assigned to a project", "Project", UUID.randomUUID());
        
        entityManager.persistAndFlush(notification1);
        entityManager.persistAndFlush(notification2);
        entityManager.persistAndFlush(notification3);

        // When
        List<Notification> result = notificationRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("Task", testEntityId);

        // Then
        assertThat(result).hasSize(2);
        assertThat(result).allMatch(notification -> 
            notification.getEntityType().equals("Task") && notification.getEntityId().equals(testEntityId));
    }

    @Test
    void countByUserAndIsReadFalse_ShouldReturnUnreadCount() {
        // Given
        Notification unreadNotification1 = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");
        Notification unreadNotification2 = new Notification(testUser, "TASK_COMMENT", "New Comment", "New comment on your task");
        Notification readNotification = new Notification(testUser, "MENTION", "You were mentioned", "You were mentioned in a comment");
        readNotification.setRead(true);
        
        entityManager.persistAndFlush(unreadNotification1);
        entityManager.persistAndFlush(unreadNotification2);
        entityManager.persistAndFlush(readNotification);

        // When
        long count = notificationRepository.countByUserAndIsReadFalse(testUser);

        // Then
        assertThat(count).isEqualTo(2);
    }

    @Test
    void markAsRead_ShouldUpdateNotificationReadStatus() {
        // Given
        Notification notification = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");
        notification = entityManager.persistAndFlush(notification);
        LocalDateTime readTime = LocalDateTime.now();

        // When
        int updated = notificationRepository.markAsRead(notification.getId(), testUser, readTime);

        // Then
        assertThat(updated).isEqualTo(1);
        
        entityManager.refresh(notification);
        assertThat(notification.isRead()).isTrue();
        assertThat(notification.getReadAt()).isNotNull();
    }

    @Test
    void markAllAsRead_ShouldUpdateAllUnreadNotifications() {
        // Given
        Notification unreadNotification1 = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");
        Notification unreadNotification2 = new Notification(testUser, "TASK_COMMENT", "New Comment", "New comment on your task");
        Notification readNotification = new Notification(testUser, "MENTION", "You were mentioned", "You were mentioned in a comment");
        readNotification.setRead(true);
        
        entityManager.persistAndFlush(unreadNotification1);
        entityManager.persistAndFlush(unreadNotification2);
        entityManager.persistAndFlush(readNotification);
        
        LocalDateTime readTime = LocalDateTime.now();

        // When
        int updated = notificationRepository.markAllAsRead(testUser, readTime);

        // Then
        assertThat(updated).isEqualTo(2);
        
        entityManager.refresh(unreadNotification1);
        entityManager.refresh(unreadNotification2);
        
        assertThat(unreadNotification1.isRead()).isTrue();
        assertThat(unreadNotification2.isRead()).isTrue();
    }

    @Test
    void deleteOldNotifications_ShouldDeleteNotificationsOlderThanCutoff() {
        // Given
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        
        // Create old notification (will be deleted)
        Notification oldNotification = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");
        entityManager.persistAndFlush(oldNotification);
        
        // Manually set created date to be older than cutoff
        entityManager.getEntityManager()
            .createQuery("UPDATE Notification n SET n.createdAt = :oldDate WHERE n.id = :id")
            .setParameter("oldDate", cutoffDate.minusDays(1))
            .setParameter("id", oldNotification.getId())
            .executeUpdate();
        
        // Create recent notification (will not be deleted)
        Notification recentNotification = new Notification(testUser, "TASK_COMMENT", "New Comment", "New comment on your task");
        entityManager.persistAndFlush(recentNotification);

        // When
        int deleted = notificationRepository.deleteOldNotifications(cutoffDate);

        // Then
        assertThat(deleted).isEqualTo(1);
        
        List<Notification> remaining = notificationRepository.findAll();
        assertThat(remaining).hasSize(1);
        assertThat(remaining.get(0).getId()).isEqualTo(recentNotification.getId());
    }

    @Test
    void findByUserAndCreatedAtBetween_ShouldReturnNotificationsInDateRange() {
        // Given
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate = now.minusHours(2);
        LocalDateTime endDate = now.plusHours(2);

        Notification notification1 = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");
        Notification notification2 = new Notification(testUser, "TASK_COMMENT", "New Comment", "New comment on your task");
        entityManager.persistAndFlush(notification1);
        entityManager.persistAndFlush(notification2);

        Pageable pageable = PageRequest.of(0, 10);

        // When
        Page<Notification> result = notificationRepository.findByUserAndCreatedAtBetween(testUser, startDate, endDate, pageable);

        // Then
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent()).allMatch(notification -> 
            notification.getCreatedAt().isAfter(startDate) && notification.getCreatedAt().isBefore(endDate));
    }
}