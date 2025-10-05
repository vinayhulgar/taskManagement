package com.taskmanagement.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskmanagement.dto.ActivityFilterRequest;
import com.taskmanagement.dto.ActivityResponse;
import com.taskmanagement.entity.Activity;
import com.taskmanagement.entity.Role;
import com.taskmanagement.entity.User;
import com.taskmanagement.repository.ActivityRepository;
import com.taskmanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AuditService auditService;

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

        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void logActivity_ShouldCreateAndSaveActivity() {
        // Given
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("test@example.com");
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        String entityType = "Task";
        String action = "CREATE";
        String details = "Task created";

        // When
        auditService.logActivity(entityType, testEntityId, action, details);

        // Then
        verify(activityRepository).save(any(Activity.class));
    }

    @Test
    void logActivity_WithValues_ShouldSerializeAndSaveActivity() throws Exception {
        // Given
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("test@example.com");
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(objectMapper.writeValueAsString(any())).thenReturn("{\"field\":\"value\"}");

        String entityType = "Task";
        String action = "UPDATE";
        String details = "Task updated";
        Object oldValues = new Object();
        Object newValues = new Object();

        // When
        auditService.logActivity(entityType, testEntityId, action, details, oldValues, newValues);

        // Then
        verify(activityRepository).save(any(Activity.class));
        verify(objectMapper, times(2)).writeValueAsString(any());
    }

    @Test
    void logCreate_ShouldLogCreateActivity() {
        // Given
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("test@example.com");
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        String entityType = "Task";
        String entityName = "Test Task";
        Object newValues = new Object();

        // When
        auditService.logCreate(entityType, testEntityId, entityName, newValues);

        // Then
        verify(activityRepository).save(any(Activity.class));
    }

    @Test
    void logUpdate_ShouldLogUpdateActivity() {
        // Given
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("test@example.com");
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        String entityType = "Task";
        String entityName = "Test Task";
        Object oldValues = new Object();
        Object newValues = new Object();

        // When
        auditService.logUpdate(entityType, testEntityId, entityName, oldValues, newValues);

        // Then
        verify(activityRepository).save(any(Activity.class));
    }

    @Test
    void logDelete_ShouldLogDeleteActivity() {
        // Given
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("test@example.com");
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        String entityType = "Task";
        String entityName = "Test Task";
        Object oldValues = new Object();

        // When
        auditService.logDelete(entityType, testEntityId, entityName, oldValues);

        // Then
        verify(activityRepository).save(any(Activity.class));
    }

    @Test
    void logAssign_ShouldLogAssignActivity() {
        // Given
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("test@example.com");
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        String entityType = "Task";
        String entityName = "Test Task";
        String assigneeName = "John Doe";

        // When
        auditService.logAssign(entityType, testEntityId, entityName, assigneeName);

        // Then
        verify(activityRepository).save(any(Activity.class));
    }

    @Test
    void logStatusChange_ShouldLogStatusChangeActivity() {
        // Given
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("test@example.com");
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        String entityType = "Task";
        String entityName = "Test Task";
        String oldStatus = "TODO";
        String newStatus = "IN_PROGRESS";

        // When
        auditService.logStatusChange(entityType, testEntityId, entityName, oldStatus, newStatus);

        // Then
        verify(activityRepository).save(any(Activity.class));
    }

    @Test
    void getActivities_ShouldReturnFilteredActivities() {
        // Given
        ActivityFilterRequest filterRequest = new ActivityFilterRequest();
        filterRequest.setEntityType("Task");
        filterRequest.setPage(0);
        filterRequest.setSize(10);

        Activity activity = new Activity(testUser, "Task", testEntityId, "CREATE");
        activity.setId(UUID.randomUUID());
        activity.setTimestamp(LocalDateTime.now());

        Page<Activity> activityPage = new PageImpl<>(List.of(activity));
        when(activityRepository.findByEntityTypeOrderByTimestampDesc(eq("Task"), any(Pageable.class)))
            .thenReturn(activityPage);

        // When
        Page<ActivityResponse> result = auditService.getActivities(filterRequest);

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getEntityType()).isEqualTo("Task");
    }

    @Test
    void getCurrentUserActivities_ShouldReturnUserActivities() {
        // Given
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("test@example.com");
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        Activity activity = new Activity(testUser, "Task", testEntityId, "CREATE");
        activity.setId(UUID.randomUUID());
        activity.setTimestamp(LocalDateTime.now());

        Page<Activity> activityPage = new PageImpl<>(List.of(activity));
        when(activityRepository.findByUserOrderByTimestampDesc(eq(testUser), any(Pageable.class)))
            .thenReturn(activityPage);

        // When
        Page<ActivityResponse> result = auditService.getCurrentUserActivities(0, 10);

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getUser().getEmail()).isEqualTo(testUser.getEmail());
    }

    @Test
    void getEntityActivities_ShouldReturnActivitiesForEntity() {
        // Given
        Activity activity = new Activity(testUser, "Task", testEntityId, "CREATE");
        activity.setId(UUID.randomUUID());
        activity.setTimestamp(LocalDateTime.now());

        when(activityRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc("Task", testEntityId))
            .thenReturn(List.of(activity));

        // When
        Page<ActivityResponse> result = auditService.getEntityActivities("Task", testEntityId, 0, 10);

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getEntityId()).isEqualTo(testEntityId);
    }

    @Test
    void logActivity_WhenUserNotAuthenticated_ShouldNotSaveActivity() {
        // Given
        when(securityContext.getAuthentication()).thenReturn(null);

        String entityType = "Task";
        String action = "CREATE";
        String details = "Task created";

        // When
        auditService.logActivity(entityType, testEntityId, action, details);

        // Then
        verify(activityRepository, never()).save(any(Activity.class));
    }

    @Test
    void logActivity_WhenUserNotFound_ShouldNotSaveActivity() {
        // Given
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("test@example.com");
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());

        String entityType = "Task";
        String action = "CREATE";
        String details = "Task created";

        // When
        auditService.logActivity(entityType, testEntityId, action, details);

        // Then
        verify(activityRepository, never()).save(any(Activity.class));
    }
}