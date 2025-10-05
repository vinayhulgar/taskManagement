package com.taskmanagement.repository;

import com.taskmanagement.entity.Team;
import com.taskmanagement.entity.TeamMember;
import com.taskmanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for TeamMember entity operations
 */
@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {
    
    /**
     * Find team membership by team and user
     */
    Optional<TeamMember> findByTeamAndUser(Team team, User user);
    
    /**
     * Find team membership by team ID and user ID
     */
    Optional<TeamMember> findByTeamIdAndUserId(UUID teamId, UUID userId);
    
    /**
     * Check if user is member of team
     */
    boolean existsByTeamIdAndUserId(UUID teamId, UUID userId);
    
    /**
     * Find all members of a team
     */
    List<TeamMember> findByTeam(Team team);
    
    /**
     * Find all members of a team by team ID
     */
    List<TeamMember> findByTeamId(UUID teamId);
    
    /**
     * Find all teams for a user
     */
    List<TeamMember> findByUser(User user);
    
    /**
     * Find all teams for a user by user ID
     */
    List<TeamMember> findByUserId(UUID userId);
    
    /**
     * Count members in a team
     */
    long countByTeamId(UUID teamId);
    
    /**
     * Count teams for a user
     */
    long countByUserId(UUID userId);
    
    /**
     * Find teams where user is a member (including through ownership)
     */
    @Query("SELECT DISTINCT tm.team FROM TeamMember tm WHERE tm.user.id = :userId " +
           "UNION " +
           "SELECT DISTINCT t FROM Team t WHERE t.owner.id = :userId")
    List<Team> findTeamsByUserId(@Param("userId") UUID userId);
    
    /**
     * Delete team membership
     */
    void deleteByTeamIdAndUserId(UUID teamId, UUID userId);
    
    /**
     * Delete all memberships for a team
     */
    void deleteByTeamId(UUID teamId);
    
    /**
     * Delete all memberships for a user
     */
    void deleteByUserId(UUID userId);
}