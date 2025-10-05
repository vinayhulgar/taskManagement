package com.taskmanagement.repository;

import com.taskmanagement.entity.Activity;
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
 * Repository interface for Activity entity
 */
@Repository
public interface ActivityRepository extends JpaRepository<Activity, UUID> {
    
    /**
     * Find activities by user with pagination
     */
    Page<Activity> findByUserOrderByTimestampDesc(User user, Pageable pageable);
    
    /**
     * Find activities by entity type and ID
     */
    List<Activity> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, UUID entityId);
    
    /**
     * Find activities by entity type
     */
    Page<Activity> findByEntityTypeOrderByTimestampDesc(String entityType, Pageable pageable);
    
    /**
     * Find activities by action
     */
    Page<Activity> findByActionOrderByTimestampDesc(String action, Pageable pageable);
    
    /**
     * Find activities within date range
     */
    @Query("SELECT a FROM Activity a WHERE a.timestamp BETWEEN :startDate AND :endDate ORDER BY a.timestamp DESC")
    Page<Activity> findByTimestampBetween(@Param("startDate") LocalDateTime startDate, 
                                         @Param("endDate") LocalDateTime endDate, 
                                         Pageable pageable);
    
    /**
     * Find activities by user and entity type
     */
    @Query("SELECT a FROM Activity a WHERE a.user = :user AND a.entityType = :entityType ORDER BY a.timestamp DESC")
    Page<Activity> findByUserAndEntityType(@Param("user") User user, 
                                          @Param("entityType") String entityType, 
                                          Pageable pageable);
    
    /**
     * Find activities by user within date range
     */
    @Query("SELECT a FROM Activity a WHERE a.user = :user AND a.timestamp BETWEEN :startDate AND :endDate ORDER BY a.timestamp DESC")
    Page<Activity> findByUserAndTimestampBetween(@Param("user") User user,
                                                @Param("startDate") LocalDateTime startDate,
                                                @Param("endDate") LocalDateTime endDate,
                                                Pageable pageable);
    
    /**
     * Count activities by user
     */
    long countByUser(User user);
    
    /**
     * Count activities by entity type and ID
     */
    long countByEntityTypeAndEntityId(String entityType, UUID entityId);
}