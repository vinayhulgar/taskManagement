package com.taskmanagement.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Service for handling notifications (email, etc.)
 * This is a basic implementation that logs notifications
 * In a real application, this would integrate with email services
 */
@Service
public class NotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    
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
        
        // For now, we'll just log the invitation
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
    public void sendTaskCommentNotification(com.taskmanagement.entity.Task task, com.taskmanagement.entity.Comment comment) {
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
    public void sendMentionNotification(com.taskmanagement.entity.Comment comment, com.taskmanagement.entity.User mentionedUser) {
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
}