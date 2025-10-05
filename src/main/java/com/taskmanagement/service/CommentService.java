package com.taskmanagement.service;

import com.taskmanagement.dto.CommentCreateRequest;
import com.taskmanagement.dto.CommentResponse;
import com.taskmanagement.dto.CommentUpdateRequest;
import com.taskmanagement.dto.UserResponse;
import com.taskmanagement.entity.Comment;
import com.taskmanagement.entity.Task;
import com.taskmanagement.entity.User;
import com.taskmanagement.repository.CommentRepository;
import com.taskmanagement.repository.TaskRepository;
import com.taskmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Service class for comment management operations
 */
@Service
@Transactional
public class CommentService {
    
    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    
    // Pattern to match user mentions in comments (e.g., @user@example.com or @username)
    private static final Pattern MENTION_PATTERN = Pattern.compile("@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}|[a-zA-Z0-9._-]+)");
    
    @Autowired
    public CommentService(CommentRepository commentRepository, TaskRepository taskRepository, 
                         UserRepository userRepository, NotificationService notificationService) {
        this.commentRepository = commentRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }
    
    /**
     * Create a new comment on a task
     */
    public CommentResponse createComment(UUID taskId, CommentCreateRequest request, UUID currentUserId) {
        // Validate task exists and user has access
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        
        // Validate current user has access to the task
        validateTaskAccess(task, currentUserId);
        
        // Get current user
        User currentUser = userRepository.findById(currentUserId)
            .orElseThrow(() -> new RuntimeException("Current user not found"));
        
        // Create comment entity
        Comment comment = new Comment();
        comment.setTask(task);
        comment.setAuthor(currentUser);
        comment.setContent(request.getContent());
        
        // Set parent comment if provided (for replies)
        if (request.getParentCommentId() != null) {
            Comment parentComment = commentRepository.findById(request.getParentCommentId())
                .orElseThrow(() -> new RuntimeException("Parent comment not found"));
            
            // Validate parent comment belongs to the same task
            if (!parentComment.getTask().getId().equals(taskId)) {
                throw new RuntimeException("Parent comment must belong to the same task");
            }
            
            comment.setParentComment(parentComment);
        }
        
        // Save comment
        Comment savedComment = commentRepository.save(comment);
        
        // Process mentions and send notifications
        processMentions(savedComment);
        
        // Send notification to task assignee (if different from comment author)
        if (task.getAssignee() != null && !task.getAssignee().getId().equals(currentUserId)) {
            notificationService.sendTaskCommentNotification(task, savedComment);
        }
        
        return convertToCommentResponse(savedComment);
    }
    
    /**
     * Get comments for a task with pagination
     */
    @Transactional(readOnly = true)
    public List<CommentResponse> getTaskComments(UUID taskId, int page, int size, UUID currentUserId) {
        // Validate task exists and user has access
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        
        validateTaskAccess(task, currentUserId);
        
        // Get root comments (not replies) with pagination
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        Page<Comment> commentsPage = commentRepository.findByTaskIdAndParentCommentIsNull(taskId, pageable);
        
        // Convert to response DTOs and include replies
        return commentsPage.getContent().stream()
            .map(this::convertToCommentResponseWithReplies)
            .collect(Collectors.toList());
    }
    
    /**
     * Get all comments for a task (without pagination)
     */
    @Transactional(readOnly = true)
    public List<CommentResponse> getAllTaskComments(UUID taskId, UUID currentUserId) {
        // Validate task exists and user has access
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        
        validateTaskAccess(task, currentUserId);
        
        // Get root comments
        List<Comment> rootComments = commentRepository.findByTaskIdAndParentCommentIsNull(taskId);
        
        // Convert to response DTOs and include replies
        return rootComments.stream()
            .map(this::convertToCommentResponseWithReplies)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a specific comment by ID
     */
    @Transactional(readOnly = true)
    public CommentResponse getCommentById(UUID commentId, UUID currentUserId) {
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new RuntimeException("Comment not found"));
        
        // Validate user has access to the task
        validateTaskAccess(comment.getTask(), currentUserId);
        
        return convertToCommentResponseWithReplies(comment);
    }
    
    /**
     * Update a comment
     */
    public CommentResponse updateComment(UUID commentId, CommentUpdateRequest request, UUID currentUserId) {
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new RuntimeException("Comment not found"));
        
        // Validate user has access to the task
        validateTaskAccess(comment.getTask(), currentUserId);
        
        // Validate user is the author of the comment
        if (!comment.getAuthor().getId().equals(currentUserId)) {
            throw new RuntimeException("You can only edit your own comments");
        }
        
        // Update comment content
        comment.setContent(request.getContent());
        comment.setEdited(true);
        
        // Save updated comment
        Comment updatedComment = commentRepository.save(comment);
        
        // Process mentions in updated comment
        processMentions(updatedComment);
        
        return convertToCommentResponse(updatedComment);
    }
    
    /**
     * Delete a comment
     */
    public void deleteComment(UUID commentId, UUID currentUserId) {
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new RuntimeException("Comment not found"));
        
        // Validate user has access to the task
        validateTaskAccess(comment.getTask(), currentUserId);
        
        // Validate user is the author of the comment or has admin/manager role
        User currentUser = userRepository.findById(currentUserId)
            .orElseThrow(() -> new RuntimeException("Current user not found"));
        
        boolean canDelete = comment.getAuthor().getId().equals(currentUserId) ||
                           currentUser.getRole().name().equals("ADMIN") ||
                           currentUser.getRole().name().equals("MANAGER");
        
        if (!canDelete) {
            throw new RuntimeException("You can only delete your own comments or you need admin/manager privileges");
        }
        
        // Check if comment has replies
        List<Comment> replies = commentRepository.findByParentCommentId(commentId);
        if (!replies.isEmpty()) {
            throw new RuntimeException("Cannot delete comment with replies. Delete replies first.");
        }
        
        commentRepository.delete(comment);
    }
    
    /**
     * Get recent comments for a task (last N days)
     */
    @Transactional(readOnly = true)
    public List<CommentResponse> getRecentComments(UUID taskId, int days, UUID currentUserId) {
        // Validate task exists and user has access
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        
        validateTaskAccess(task, currentUserId);
        
        LocalDateTime sinceDate = LocalDateTime.now().minusDays(days);
        List<Comment> comments = commentRepository.findRecentCommentsByTaskId(taskId, sinceDate);
        
        return comments.stream()
            .map(this::convertToCommentResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Search comments by content
     */
    @Transactional(readOnly = true)
    public List<CommentResponse> searchComments(UUID taskId, String searchTerm, UUID currentUserId) {
        // Validate task exists and user has access
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        
        validateTaskAccess(task, currentUserId);
        
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return new ArrayList<>();
        }
        
        List<Comment> comments = commentRepository.findByTaskIdAndContentContaining(taskId, searchTerm);
        
        return comments.stream()
            .map(this::convertToCommentResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Convert Comment entity to CommentResponse DTO
     */
    private CommentResponse convertToCommentResponse(Comment comment) {
        CommentResponse response = new CommentResponse();
        response.setId(comment.getId());
        response.setTaskId(comment.getTask().getId());
        response.setTaskTitle(comment.getTask().getTitle());
        response.setContent(comment.getContent());
        response.setEdited(comment.isEdited());
        response.setCreatedAt(comment.getCreatedAt());
        response.setUpdatedAt(comment.getUpdatedAt());
        
        // Set parent comment ID if exists
        if (comment.getParentComment() != null) {
            response.setParentCommentId(comment.getParentComment().getId());
        }
        
        // Set author info
        if (comment.getAuthor() != null) {
            UserResponse author = new UserResponse();
            author.setId(comment.getAuthor().getId());
            author.setEmail(comment.getAuthor().getEmail());
            author.setFirstName(comment.getAuthor().getFirstName());
            author.setLastName(comment.getAuthor().getLastName());
            author.setRole(comment.getAuthor().getRole());
            response.setAuthor(author);
        }
        
        // Extract mentioned users
        response.setMentionedUsers(extractMentions(comment.getContent()));
        
        // Count replies
        List<Comment> replies = commentRepository.findByParentCommentId(comment.getId());
        response.setReplyCount(replies.size());
        
        return response;
    }
    
    /**
     * Convert Comment entity to CommentResponse DTO with replies
     */
    private CommentResponse convertToCommentResponseWithReplies(Comment comment) {
        CommentResponse response = convertToCommentResponse(comment);
        
        // Get and convert replies
        List<Comment> replies = commentRepository.findByParentCommentId(comment.getId());
        List<CommentResponse> replyResponses = replies.stream()
            .map(this::convertToCommentResponse)
            .collect(Collectors.toList());
        
        response.setReplies(replyResponses);
        
        return response;
    }
    
    /**
     * Extract user mentions from comment content
     */
    private List<String> extractMentions(String content) {
        List<String> mentions = new ArrayList<>();
        Matcher matcher = MENTION_PATTERN.matcher(content);
        
        while (matcher.find()) {
            String mention = matcher.group(1);
            mentions.add(mention);
        }
        
        return mentions;
    }
    
    /**
     * Process mentions in comment and send notifications
     */
    private void processMentions(Comment comment) {
        List<String> mentions = extractMentions(comment.getContent());
        
        for (String mention : mentions) {
            // Try to find user by email or username
            User mentionedUser = null;
            
            if (mention.contains("@")) {
                // It's an email
                mentionedUser = userRepository.findByEmail(mention).orElse(null);
            } else {
                // It's a username - for now, we'll skip this as we don't have username field
                // In a real implementation, you might have a username field or use first/last name
            }
            
            if (mentionedUser != null) {
                notificationService.sendMentionNotification(comment, mentionedUser);
            }
        }
    }
    
    /**
     * Validate user has access to the task
     */
    private void validateTaskAccess(Task task, UUID userId) {
        // This is a simplified check - in a real implementation, you would check
        // if the user is a member of the team that owns the project
        // For now, we'll assume all authenticated users have access
        // TODO: Implement proper task access validation based on project membership
    }
}