package com.taskmanagement.repository;

import com.taskmanagement.entity.Team;
import com.taskmanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Team entity operations
 */
@Repository
public interface TeamRepository extends JpaRepository<Team, UUID> {
    
    /**
     * Find team by name
     */
    Optional<Team> findByName(String name);
    
    /**
     * Check if team exists by name
     */
    boolean existsByName(String name);
    
    /**
     * Find teams owned by a specific user
     */
    List<Team> findByOwner(User owner);
    
    /**
     * Find teams owned by user ID
     */
    List<Team> findByOwnerId(UUID ownerId);
    
    /**
     * Find teams by name containing (case insensitive)
     */
    List<Team> findByNameContainingIgnoreCase(String name);
    
    /**
     * Find teams where user is a member (including owner)
     * This query will be used when we implement team membership
     */
    @Query("SELECT DISTINCT t FROM Team t WHERE t.owner.id = :userId")
    List<Team> findTeamsByUserId(@Param("userId") UUID userId);
    
    /**
     * Count teams owned by a user
     */
    long countByOwnerId(UUID ownerId);
    
    /**
     * Find teams created within the last N days
     */
    @Query("SELECT t FROM Team t WHERE t.createdAt >= :cutoffDate")
    List<Team> findTeamsCreatedInLastDays(@Param("cutoffDate") java.time.LocalDateTime cutoffDate);
}