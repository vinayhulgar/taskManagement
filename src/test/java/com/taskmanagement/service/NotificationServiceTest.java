package com.taskmanagement.service;

import com.taskmanagement.dto.NotificationFilterRequest;
import com.taskmanagement.dto.NotificationResponse;
import com.taskmanagement.entity.*;
import com.taskmanagement.repository.NotificationRepository;
import com.taskmanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private NotificationService notificationService;

    private User testUser;
    private User assignedByUser;
    private Task testTask;
    private Project testProject;
    private Team testTeam;
    private Comment testComment;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setRole(Role.MEMBER);

        assignedByUser = new User();
        assignedByUser.setId(UUID.randomUUID());
        assignedByUser.setEmail("manager@example.com");
        assignedByUser.setFirstName("Manager");
        assignedByUser.setLastName("User");
        assignedByUser.setRole(Role.MANAGER);

        testTeam = new Team();
        testTeam.setId(UUID.randomUUID());
        testTeam.setName("Test Team");
        testTeam.setOwner(assignedByUser);

        testProject = new Project();
        testProject.setId(UUID.randomUUID());
        testProject.setName("Test Project");
        testProject.setTeam(testTeam);
        testProject.setCreatedBy(assignedByUser);

        testTask = new Task();
        testTask.setId(UUID.randomUUID());
        testTask.setTitle("Test Task");
        testTask.setProject(testProject);
        testTask.setAssignee(testUser);
        testTask.setCreatedBy(assignedByUser);

        testComment = new Comment();
        testComment.setId(UUID.randomUUID());
        testComment.setContent("Test comment");
        testComment.setTask(testTask);
        testComment.setAuthor(assignedByUser);

        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void createNotification_ShouldSaveAndReturnNotification() {
        // Given
        Notification savedNotification = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task", "Task", testTask.getId());
        savedNotification.setId(UUID.randomUUID());
        
        when(notificationRepository.save(any(Notification.class))).thenReturn(savedNotification);

        // When
        Notification result = notificationService.createNotification(
            testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task", "Task", testTask.getId()
        );

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getType()).isEqualTo("TASK_ASSIGNED");
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void notifyTaskAssigned_ShouldCreateNotification() {
        // Given
        when(notificationRepository.save(any(Notification.class))).thenReturn(new Notification());

        // When
        notificationService.notifyTaskAssigned(testTask, testUser, assignedByUser);

        // Then
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void notifyTaskAssigned_WhenAssigneeIsSameAsAssignedBy_ShouldNotCreateNotification() {
        // Given
        testTask.setAssignee(assignedByUser);

        // When
        notificationService.notifyTaskAssigned(testTask, assignedByUser, assignedByUser);

        // Then
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void notifyTaskStatusChanged_ShouldCreateNotification() {
        // Given
        when(notificationRepository.save(any(Notification.class))).thenReturn(new Notification());

        // When
        notificationService.notifyTaskStatusChanged(testTask, TaskStatus.TODO, TaskStatus.IN_PROGRESS, assignedByUser);

        // Then
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void notifyTaskStatusChanged_WhenAssigneeIsSameAsChanger_ShouldNotCreateNotification() {
        // Given
        testTask.setAssignee(assignedByUser);

        // When
        notificationService.notifyTaskStatusChanged(testTask, TaskStatus.TODO, TaskStatus.IN_PROGRESS, assignedByUser);

        // Then
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void notifyProjectAssigned_ShouldCreateNotification() {
        // Given
        when(notificationRepository.save(any(Notification.class))).thenReturn(new Notification());

        // When
        notificationService.notifyProjectAssigned(testProject, testUser, assignedByUser);

        // Then
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void notifyTeamInvitation_ShouldCreateNotification() {
        // Given
        when(notificationRepository.save(any(Notification.class))).thenReturn(new Notification());

        // When
        notificationService.notifyTeamInvitation(testUser, testTeam, assignedByUser);

        // Then
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void notifyTaskComment_ShouldCreateNotification() {
        // Given
        when(notificationRepository.save(any(Notification.class))).thenReturn(new Notification());

        // When
        notificationService.notifyTaskComment(testTask, testComment);

        // Then
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void notifyTaskComment_WhenAssigneeIsSameAsAuthor_ShouldNotCreateNotification() {
        // Given
        testTask.setAssignee(assignedByUser);
        testComment.setAuthor(assignedByUser);

        // When
        notificationService.notifyTaskComment(testTask, testComment);

        // Then
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void notifyMention_ShouldCreateNotification() {
        // Given
        when(notificationRepository.save(any(Notification.class))).thenReturn(new Notification());

        // When
        notificationService.notifyMention(testComment, testUser);

        // Then
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void notifyMention_WhenMentionedUserIsSameAsAuthor_ShouldNotCreateNotification() {
        // When
        notificationService.notifyMention(testComment, assignedByUser);

        // Then
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void getUserNotifications_ShouldReturnFilteredNotifications() {
        // Given
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("test@example.com");
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        NotificationFilterRequest filterRequest = new NotificationFilterRequest();
        filterRequest.setType("TASK_ASSIGNED");

        Notification notification = new Notification(testUser, "TASK_ASSIGNED", "Task Assigned", "You have been assigned to a task");
        notification.setId(UUID.randomUUID());
        notification.setCreatedAt(LocalDateTime.now());

        Page<Notification> notificationPage = new PageImpl<>(List.of(notification));
        when(notificationRepository.findByUserAndTypeOrderByCreatedAtDesc(eq(testUser), eq("TASK_ASSIGNED"), any(Pageable.class)))
            .thenReturn(notificationPage);

        // When
        Page<NotificationResponse> result = notificationService.getUserNotifications(filterRequest);

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getType()).isEqualTo("TASK_ASSIGNED");
    }

    @Test
    void getUserNotifications_WhenUserNotAuthenticated_ShouldThrowException() {
        // Given
        when(securityContext.getAuthentication()).thenReturn(null);
        NotificationFilterRequest filterRequest = new NotificationFilterRequest();

        // When & Then
        assertThatThrownBy(() -> notificationService.getUserNotifications(filterRequest))
            .isInstanceOf(RuntimeException.class)
            .hasMessage("User not authenticated");
    }

    @Test
    void getUnreadNotificationsCount_ShouldReturnCount() {
        // Given
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("test@example.com");
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(notificationRepository.countByUserAndIsReadFalse(testUser)).thenReturn(5L);

        // When
        long count = notificationService.getUnreadNotificationsCount();

        // Then
        assertThat(count).isEqualTo(5L);
    }

    @Test
    void getUnreadNotificationsCount_WhenUserNotAuthenticated_ShouldReturnZero() {
        // Given
        when(securityContext.getAuthentication()).thenReturn(null);

        // When
        long count = notificationService.getUnreadNotificationsCount();

        // Then
        assertThat(count).isEqualTo(0L);
    }

    @Test
    void markNotificationAsRead_ShouldReturnTrue() {
        // Given
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("test@example.com");
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        UUID notificationId = UUID.randomUUID();
        when(notificationRepository.markAsRead(eq(notificationId), eq(testUser), any(LocalDateTime.class)))
            .thenReturn(1);

        // When
        boolean result = notificationService.markNotificationAsRead(notificationId);

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void markNotificationAsRead_WhenNotificationNotFound_ShouldReturnFalse() {
        // Given
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("test@example.com");
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        UUID notificationId = UUID.randomUUID();
        when(notificationRepository.markAsRead(eq(notificationId), eq(testUser), any(LocalDateTime.class)))
            .thenReturn(0);

        // When
        boolean result = notificationService.markNotificationAsRead(notificationId);

        // Then
        assertThat(result).isFalse();
    }

    @Test
    void markAllNotificationsAsRead_ShouldReturnUpdatedCount() {
        // Given
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("test@example.com");
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(notificationRepository.markAllAsRead(eq(testUser), any(LocalDateTime.class))).thenReturn(3);

        // When
        int result = notificationService.markAllNotificationsAsRead();

        // Then
        assertThat(result).isEqualTo(3);
    }

    @Test
    void deleteOldNotifications_ShouldReturnDeletedCount() {
        // Given
        when(notificationRepository.deleteOldNotifications(any(LocalDateTime.class))).thenReturn(10);

        // When
        int result = notificationService.deleteOldNotifications(30);

        // Then
        assertThat(result).isEqualTo(10);
        verify(notificationRepository).deleteOldNotifications(any(LocalDateTime.class));
    }
}