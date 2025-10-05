package com.taskmanagement.repository;

import com.taskmanagement.entity.Comment;
import com.taskmanagement.entity.Task;
import com.taskmanagement.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for Comment entity operations
 */
@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {
    
    /**
     * Find comments by task
     */
    List<Comment> findByTask(Task task);
    
    /**
     * Find comments by task ID
     */
    List<Comment> findByTaskId(UUID taskId);
    
    /**
     * Find comments by task ID with pagination
     */
    Page<Comment> findByTaskId(UUID taskId, Pageable pageable);
    
    /**
     * Find comments by author
     */
    List<Comment> findByAuthor(User author);
    
    /**
     * Find comments by author ID
     */
    List<Comment> findByAuthorId(UUID authorId);
    
    /**
     * Find replies to a comment (parent comment)
     */
    List<Comment> findByParentComment(Comment parentComment);
    
    /**
     * Find replies to a comment by parent comment ID
     */
    List<Comment> findByParentCommentId(UUID parentCommentId);
    
    /**
     * Find root comments (comments without parent) for a task
     */
    List<Comment> findByTaskAndParentCommentIsNull(Task task);
    
    /**
     * Find root comments by task ID
     */
    List<Comment> findByTaskIdAndParentCommentIsNull(UUID taskId);
    
    /**
     * Find root comments by task ID with pagination
     */
    Page<Comment> findByTaskIdAndParentCommentIsNull(UUID taskId, Pageable pageable);
    
    /**
     * Find comments created after a specific date
     */
    List<Comment> findByCreatedAtAfter(LocalDateTime date);
    
    /**
     * Find comments by task and created after a specific date
     */
    List<Comment> findByTaskAndCreatedAtAfter(Task task, LocalDateTime date);
    
    /**
     * Find comments by task ID and created after a specific date
     */
    List<Comment> findByTaskIdAndCreatedAtAfter(UUID taskId, LocalDateTime date);
    
    /**
     * Count comments by task
     */
    long countByTask(Task task);
    
    /**
     * Count comments by task ID
     */
    long countByTaskId(UUID taskId);
    
    /**
     * Count comments by author
     */
    long countByAuthor(User author);
    
    /**
     * Find comments containing specific text (case insensitive)
     */
    List<Comment> findByContentContainingIgnoreCase(String content);
    
    /**
     * Find comments by task containing specific text
     */
    @Query("SELECT c FROM Comment c WHERE c.task.id = :taskId AND LOWER(c.content) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Comment> findByTaskIdAndContentContaining(@Param("taskId") UUID taskId, @Param("searchTerm") String searchTerm);
    
    /**
     * Find recent comments for a task (last N days)
     */
    @Query("SELECT c FROM Comment c WHERE c.task.id = :taskId AND c.createdAt >= :sinceDate ORDER BY c.createdAt DESC")
    List<Comment> findRecentCommentsByTaskId(@Param("taskId") UUID taskId, @Param("sinceDate") LocalDateTime sinceDate);
    
    /**
     * Find comments that mention a specific user (by email or name)
     */
    @Query("SELECT c FROM Comment c WHERE LOWER(c.content) LIKE LOWER(CONCAT('%@', :username, '%'))")
    List<Comment> findCommentsMentioningUser(@Param("username") String username);
    
    /**
     * Find comments by multiple task IDs
     */
    @Query("SELECT c FROM Comment c WHERE c.task.id IN :taskIds ORDER BY c.createdAt DESC")
    List<Comment> findByTaskIds(@Param("taskIds") List<UUID> taskIds);
    
    /**
     * Find comments with replies count
     */
    @Query("SELECT c, COUNT(r) as replyCount FROM Comment c LEFT JOIN Comment r ON r.parentComment = c WHERE c.task.id = :taskId AND c.parentComment IS NULL GROUP BY c ORDER BY c.createdAt DESC")
    List<Object[]> findCommentsWithReplyCount(@Param("taskId") UUID taskId);
}