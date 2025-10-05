package com.taskmanagement.service;

import com.taskmanagement.dto.NotificationFilterRequest;
import com.taskmanagement.dto.NotificationResponse;
import com.taskmanagement.entity.*;
import com.taskmanagement.repository.NotificationRepository;
import com.taskmanagement.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service for handling notifications and email delivery
 */
@Service
@Transactional
public class NotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    
    @Autowired
    public NotificationService(NotificationRepository notificationRepository,
                              UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }
    
    /**
     * Create and save a notification
     */
    public Notification createNotification(User user, String type, String title, String message, 
                                         String entityType, UUID entityId) {
        Notification notification = new Notification(user, type, title, message, entityType, entityId);
        return notificationRepository.save(notification);
    }
    
    /**
     * Send task assignment notification
     */
    public void notifyTaskAssigned(Task task, User assignee, User assignedBy) {
        if (assignee != null && !assignee.equals(assignedBy)) {
            String title = "Task Assigned";
            String message = String.format("You have been assigned to task '%s' by %s %s", 
                task.getTitle(), 
                assignedBy.getFirstName(), 
                assignedBy.getLastName());
            
            createNotification(assignee, "TASK_ASSIGNED", title, message, "Task", task.getId());
            logger.info("Task assignment notification sent to: {} for task: {}", assignee.getEmail(), task.getTitle());
        }
    }
    
    /**
     * Send task status change notification
     */
    public void notifyTaskStatusChanged(Task task, TaskStatus oldStatus, TaskStatus newStatus, User changedBy) {
        if (task.getAssignee() != null && !task.getAssignee().equals(changedBy)) {
            String title = "Task Status Updated";
            String message = String.format("Task '%s' status changed from %s to %s by %s %s", 
                task.getTitle(), 
                oldStatus.name(), 
                newStatus.name(),
                changedBy.getFirstName(), 
                changedBy.getLastName());
            
            createNotification(task.getAssignee(), "TASK_STATUS_CHANGED", title, message, "Task", task.getId());
            logger.info("Task status change notification sent to: {} for task: {}", task.getAssignee().getEmail(), task.getTitle());
        }
    }
    
    /**
     * Send project assignment notification
     */
    public void notifyProjectAssigned(Project project, User assignee, User assignedBy) {
        if (assignee != null && !assignee.equals(assignedBy)) {
            String title = "Project Assignment";
            String message = String.format("You have been assigned to project '%s' by %s %s", 
                project.getName(), 
                assignedBy.getFirstName(), 
                assignedBy.getLastName());
            
            createNotification(assignee, "PROJECT_ASSIGNED", title, message, "Project", project.getId());
            logger.info("Project assignment notification sent to: {} for project: {}", assignee.getEmail(), project.getName());
        }
    }
    
    /**
     * Send team invitation notification
     */
    public void notifyTeamInvitation(User invitee, Team team, User inviter) {
        String title = "Team Invitation";
        String message = String.format("You have been invited to join team '%s' by %s %s", 
            team.getName(), 
            inviter.getFirstName(), 
            inviter.getLastName());
        
        createNotification(invitee, "TEAM_INVITATION", title, message, "Team", team.getId());
        sendTeamInvitation(invitee.getEmail(), team.getName(), inviter.getFirstName() + " " + inviter.getLastName());
        logger.info("Team invitation notification sent to: {} for team: {}", invitee.getEmail(), team.getName());
    }
    
    /**
     * Send comment notification
     */
    public void notifyTaskComment(Task task, Comment comment) {
        if (task.getAssignee() != null && !task.getAssignee().equals(comment.getAuthor())) {
            String title = "New Comment";
            String message = String.format("New comment added to task '%s' by %s %s: %s", 
                task.getTitle(), 
                comment.getAuthor().getFirstName(), 
                comment.getAuthor().getLastName(),
                comment.getContent().length() > 100 ? comment.getContent().substring(0, 100) + "..." : comment.getContent());
            
            createNotification(task.getAssignee(), "TASK_COMMENT", title, message, "Task", task.getId());
            sendTaskCommentNotification(task, comment);
            logger.info("Task comment notification sent to: {} for task: {}", task.getAssignee().getEmail(), task.getTitle());
        }
    }
    
    /**
     * Send mention notification
     */
    public void notifyMention(Comment comment, User mentionedUser) {
        if (!mentionedUser.equals(comment.getAuthor())) {
            String title = "You were mentioned";
            String message = String.format("You were mentioned in a comment on task '%s' by %s %s: %s", 
                comment.getTask().getTitle(),
                comment.getAuthor().getFirstName(), 
                comment.getAuthor().getLastName(),
                comment.getContent().length() > 100 ? comment.getContent().substring(0, 100) + "..." : comment.getContent());
            
            createNotification(mentionedUser, "MENTION", title, message, "Task", comment.getTask().getId());
            sendMentionNotification(comment, mentionedUser);
            logger.info("Mention notification sent to: {} for task: {}", mentionedUser.getEmail(), comment.getTask().getTitle());
        }
    }
    
    /**
     * Get notifications for current user with filtering
     */
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUserNotifications(NotificationFilterRequest filterRequest) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        Pageable pageable = createPageable(filterRequest);
        Page<Notification> notifications;
        
        if (filterRequest.getType() != null) {
            notifications = notificationRepository.findByUserAndTypeOrderByCreatedAtDesc(currentUser, filterRequest.getType(), pageable);
        } else if (filterRequest.getIsRead() != null) {
            notifications = notificationRepository.findByUserAndIsReadOrderByCreatedAtDesc(currentUser, filterRequest.getIsRead(), pageable);
        } else if (filterRequest.getStartDate() != null && filterRequest.getEndDate() != null) {
            notifications = notificationRepository.findByUserAndCreatedAtBetween(currentUser, filterRequest.getStartDate(), filterRequest.getEndDate(), pageable);
        } else {
            notifications = notificationRepository.findByUserOrderByCreatedAtDesc(currentUser, pageable);
        }
        
        return notifications.map(this::convertToResponse);
    }
    
    /**
     * Get unread notifications count for current user
     */
    @Transactional(readOnly = true)
    public long getUnreadNotificationsCount() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return 0;
        }
        return notificationRepository.countByUserAndIsReadFalse(currentUser);
    }
    
    /**
     * Mark notification as read
     */
    public boolean markNotificationAsRead(UUID notificationId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        int updated = notificationRepository.markAsRead(notificationId, currentUser, LocalDateTime.now());
        return updated > 0;
    }
    
    /**
     * Mark all notifications as read for current user
     */
    public int markAllNotificationsAsRead() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        return notificationRepository.markAllAsRead(currentUser, LocalDateTime.now());
    }
    
    /**
     * Delete old notifications (cleanup job)
     */
    public int deleteOldNotifications(int daysOld) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysOld);
        return notificationRepository.deleteOldNotifications(cutoffDate);
    }
    
    // Legacy email methods (kept for backward compatibility)
    
    /**
     * Send team invitation email
     * For now, this just logs the invitation
     * In production, this would send actual emails
     */
    public void sendTeamInvitation(String recipientEmail, String teamName, String inviterName) {
        logger.info("Sending team invitation email to: {} for team: {} from: {}", 
                   recipientEmail, teamName, inviterName);
        
        // TODO: Implement actual email sending logic
        // This could use Spring Mail, SendGrid, AWS SES, etc.
        
        String message = String.format(
            "You have been invited to join team '%s' by %s. " +
            "Please log in to your account to accept the invitation.",
            teamName, inviterName
        );
        
        logger.info("Email content: {}", message);
    }
    
    /**
     * Send team member removal notification
     */
    public void sendMemberRemovalNotification(String recipientEmail, String teamName, String removerName) {
        logger.info("Sending member removal notification to: {} for team: {} by: {}", 
                   recipientEmail, teamName, removerName);
        
        String message = String.format(
            "You have been removed from team '%s' by %s.",
            teamName, removerName
        );
        
        logger.info("Email content: {}", message);
    }
    
    /**
     * Send task comment notification
     */
    public void sendTaskCommentNotification(Task task, Comment comment) {
        logger.info("Sending task comment notification for task: {} by: {}", 
                   task.getTitle(), comment.getAuthor().getEmail());
        
        if (task.getAssignee() != null) {
            String message = String.format(
                "New comment added to task '%s' by %s: %s",
                task.getTitle(), 
                comment.getAuthor().getFirstName() + " " + comment.getAuthor().getLastName(),
                comment.getContent().length() > 100 ? comment.getContent().substring(0, 100) + "..." : comment.getContent()
            );
            
            logger.info("Notification to {}: {}", task.getAssignee().getEmail(), message);
        }
    }
    
    /**
     * Send mention notification
     */
    public void sendMentionNotification(Comment comment, User mentionedUser) {
        logger.info("Sending mention notification to: {} for comment in task: {}", 
                   mentionedUser.getEmail(), comment.getTask().getTitle());
        
        String message = String.format(
            "You were mentioned in a comment on task '%s' by %s: %s",
            comment.getTask().getTitle(),
            comment.getAuthor().getFirstName() + " " + comment.getAuthor().getLastName(),
            comment.getContent().length() > 100 ? comment.getContent().substring(0, 100) + "..." : comment.getContent()
        );
        
        logger.info("Mention notification to {}: {}", mentionedUser.getEmail(), message);
    }
    
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && 
            !authentication.getPrincipal().equals("anonymousUser")) {
            String email = authentication.getName();
            return userRepository.findByEmail(email).orElse(null);
        }
        return null;
    }
    
    private Pageable createPageable(NotificationFilterRequest filterRequest) {
        Sort.Direction direction = "asc".equalsIgnoreCase(filterRequest.getSortDirection()) 
            ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = Sort.by(direction, filterRequest.getSortBy());
        return PageRequest.of(filterRequest.getPage(), filterRequest.getSize(), sort);
    }
    
    private NotificationResponse convertToResponse(Notification notification) {
        return new NotificationResponse(
            notification.getId(),
            notification.getType(),
            notification.getTitle(),
            notification.getMessage(),
            notification.getEntityType(),
            notification.getEntityId(),
            notification.isRead(),
            notification.getReadAt(),
            notification.getCreatedAt()
        );
    }
}