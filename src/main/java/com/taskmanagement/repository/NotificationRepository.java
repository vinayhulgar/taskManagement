package com.taskmanagement.repository;

import com.taskmanagement.entity.Notification;
import com.taskmanagement.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for Notification entity
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    
    /**
     * Find notifications by user with pagination
     */
    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    
    /**
     * Find unread notifications by user
     */
    List<Notification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user);
    
    /**
     * Find notifications by user and read status
     */
    Page<Notification> findByUserAndIsReadOrderByCreatedAtDesc(User user, boolean isRead, Pageable pageable);
    
    /**
     * Find notifications by type
     */
    Page<Notification> findByUserAndTypeOrderByCreatedAtDesc(User user, String type, Pageable pageable);
    
    /**
     * Find notifications by entity
     */
    List<Notification> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, UUID entityId);
    
    /**
     * Count unread notifications for user
     */
    long countByUserAndIsReadFalse(User user);
    
    /**
     * Mark notification as read
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.id = :id AND n.user = :user")
    int markAsRead(@Param("id") UUID id, @Param("user") User user, @Param("readAt") LocalDateTime readAt);
    
    /**
     * Mark all notifications as read for user
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.user = :user AND n.isRead = false")
    int markAllAsRead(@Param("user") User user, @Param("readAt") LocalDateTime readAt);
    
    /**
     * Delete old notifications (older than specified date)
     */
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate")
    int deleteOldNotifications(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    /**
     * Find notifications created within date range
     */
    @Query("SELECT n FROM Notification n WHERE n.user = :user AND n.createdAt BETWEEN :startDate AND :endDate ORDER BY n.createdAt DESC")
    Page<Notification> findByUserAndCreatedAtBetween(@Param("user") User user,
                                                    @Param("startDate") LocalDateTime startDate,
                                                    @Param("endDate") LocalDateTime endDate,
                                                    Pageable pageable);
}