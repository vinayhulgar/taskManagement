package com.taskmanagement.repository;

import com.taskmanagement.entity.Project;
import com.taskmanagement.entity.ProjectStatus;
import com.taskmanagement.entity.Team;
import com.taskmanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for Project entity operations
 */
@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    
    /**
     * Find projects by team
     */
    List<Project> findByTeam(Team team);
    
    /**
     * Find projects by team ID
     */
    List<Project> findByTeamId(UUID teamId);
    
    /**
     * Find projects by status
     */
    List<Project> findByStatus(ProjectStatus status);
    
    /**
     * Find projects by team and status
     */
    List<Project> findByTeamAndStatus(Team team, ProjectStatus status);
    
    /**
     * Find projects created by a specific user
     */
    List<Project> findByCreatedBy(User createdBy);
    
    /**
     * Find projects by name containing (case insensitive)
     */
    List<Project> findByNameContainingIgnoreCase(String name);
    
    /**
     * Find projects within a team by name containing (case insensitive)
     */
    List<Project> findByTeamAndNameContainingIgnoreCase(Team team, String name);
    
    /**
     * Find projects with end date before a specific date (overdue projects)
     */
    @Query("SELECT p FROM Project p WHERE p.endDate < :date AND p.status NOT IN ('COMPLETED', 'ARCHIVED')")
    List<Project> findOverdueProjects(@Param("date") LocalDate date);
    
    /**
     * Find projects ending within a specific date range
     */
    @Query("SELECT p FROM Project p WHERE p.endDate BETWEEN :startDate AND :endDate")
    List<Project> findProjectsEndingBetween(
        @Param("startDate") LocalDate startDate, 
        @Param("endDate") LocalDate endDate
    );
    
    /**
     * Find active projects for a team
     */
    @Query("SELECT p FROM Project p WHERE p.team.id = :teamId AND p.status = 'ACTIVE'")
    List<Project> findActiveProjectsByTeamId(@Param("teamId") UUID teamId);
    
    /**
     * Count projects by team and status
     */
    long countByTeamAndStatus(Team team, ProjectStatus status);
    
    /**
     * Check if project name exists within a team
     */
    boolean existsByTeamAndName(Team team, String name);
}